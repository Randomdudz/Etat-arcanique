// Tests du cœur de validation de l'Arène — exécution : node test-arena-core.js
'use strict';
const core = require('./arena-core');

let ok = 0, ko = 0;
const check = (name, cond) => { if (cond) { ok++; console.log('  OK   ' + name) } else { ko++; console.log('  ÉCHEC ' + name) } };
const T0 = Date.UTC(2026, 9, 14, 12, 0, 0);            // mercredi 14 octobre 2026, 12:00 UTC
const MIN = 60 * 1000, H = 3600 * 1000;
const st = over => Object.assign({
  uid: 'u1', pseudo: 'Test', week: '2026-10-12', startedAt: T0, wins: 0, losses: 0, ai: 0, hum: 0,
  status: 'active', ticket: null, lastAt: T0, starts: [T0], ver: 1
}, over || {});

console.log('1) semaine du classement');
check('mercredi → lundi 12', core.weekKey(T0) === '2026-10-12');
check('dimanche soir → même semaine', core.weekKey(Date.UTC(2026, 9, 18, 23, 59)) === '2026-10-12');
check('lundi 00:00 → elle-même', core.weekKey(Date.UTC(2026, 9, 19, 0, 0)) === '2026-10-19');

console.log('2) ouverture de course (run)');
{
  const a = core.runOp(null, T0, 'Marlon');
  check('course acceptée sans historique', a.ok && a.week === '2026-10-12' && a.state.status === 'active');
  check('pseudo nettoyé', a.state.pseudo === 'Marlon');
  check('1 départ sur 24 h', a.starts.length === 1);
  const b = core.runOp(st({ starts: Array.from({ length: 12 }, (_, i) => T0 - i * MIN) }), T0, 'Marlon');
  check('13e course/24 h refusée', !b.ok && b.code === 'rate-run');
  const c = core.runOp(st({ starts: [T0 - 25 * H, T0 - 2 * H] }), T0, 'Marlon');
  check('départs de plus de 24 h ignorés', c.ok && c.starts.length === 2);
  const d = core.runOp(st({}), T0, 'X'.repeat(40));
  check('pseudo tronqué à ' + core.CFG.maxPseudo, d.state.pseudo.length === core.CFG.maxPseudo);
}

console.log('3) billet de match (match)');
{
  const a = core.matchOp(null, T0, 'ai');
  check('sans course → refus', !a.ok && a.code === 'no-run');
  const b = core.matchOp(st({ status: 'done' }), T0, 'ai');
  check('course terminée → refus', !b.ok && b.code === 'run-done');
  const c = core.matchOp(st({ startedAt: T0 - 7 * H }), T0, 'ai');
  check('course de plus de 6 h → refus', !c.ok && c.code === 'run-stale');
  const d = core.matchOp(st({}), T0, 'ai');
  check('billet IA délivré', d.ok && d.ticket.mode === 'ai' && d.ticket.at === T0 && d.ticket.id.length >= 16);
  const e = core.matchOp(st({ wins: 9 }), T0, 'ai');
  check('course pleine (9 V) → refus', !e.ok && e.code === 'run-full');
}

console.log('4) victoire (win)');
{
  const tk = { id: 'abc123', mode: 'ai', at: T0 };
  const a = core.winOp(st({}), T0 + 5 * MIN, 'abc123', 'IA du palier 1');
  check('sans billet → refus', !a.ok && a.code === 'no-ticket');
  const b = core.winOp(st({ ticket: tk }), T0 + 5 * MIN, 'mauvais', 'IA');
  check('mauvais billet → refus', !b.ok && b.code === 'bad-ticket');
  const c = core.winOp(st({ ticket: tk }), T0 + 30 * 1000, 'abc123', 'IA');
  check('match de 30 s → refus (trop court)', !c.ok && c.code === 'too-fast');
  const d = core.winOp(st({ ticket: tk }), T0 + 5 * H, 'abc123', 'IA');
  check('billet de plus de 3 h → refus', !d.ok && d.code === 'ticket-old');
  const e = core.winOp(st({ ticket: tk }), T0 + 5 * MIN, 'abc123', 'IA du palier 1');
  check('victoire acceptée', e.ok && e.next.wins === 1 && e.next.ai === 1 && e.next.hum === 0);
  check('billet consommé', e.next.ticket === null && e.next.status === 'active' && e.finished === false);
  check('journal complet', e.log.kind === 'win' && e.log.mode === 'ai' && e.log.elapsedMs === 5 * MIN && e.log.opp === 'IA du palier 1');
  const f = core.winOp(st({ ticket: { id: 'z', mode: 'human', at: T0 }, wins: 8, ai: 5, hum: 3 }), T0 + 9 * MIN, 'z', 'Marlon');
  check('9e victoire → course terminée', f.ok && f.next.wins === 9 && f.next.hum === 4 && f.next.status === 'done' && f.finished === true);
  const g = core.winOp(st({ ticket: { id: 'z', mode: 'ai', at: T0 }, wins: 9 }), T0 + 9 * MIN, 'z', 'IA');
  check('10e victoire refusée', !g.ok && g.code === 'run-full');
}

console.log('5) défaite (loss) et fin de course');
{
  const tk = { id: 'd1', mode: 'human', at: T0 };
  const a = core.lossOp(st({ ticket: tk, losses: 2 }), T0 + 4 * MIN, 'Marlon');
  check('3e défaite → course terminée', a.ok && a.next.losses === 3 && a.next.status === 'done' && a.finished === true);
  check('billet consommé et journalisé', a.next.ticket === null && a.log.kind === 'loss' && a.log.elapsedMs === 4 * MIN);
  const b = core.lossOp(st({ losses: 1 }), T0 + MIN, 'Marlon');
  check('défaite sans billet acceptée', b.ok && b.next.losses === 2 && b.next.status === 'active');
  const c = core.lossOp(st({ status: 'done' }), T0, 'X');
  check('défaite après la fin → refus', !c.ok && c.code === 'run-done');
  const d = core.endOp(st({}), T0 + MIN);
  check('abandon → course fermée', d.ok && d.next.status === 'done' && d.log.kind === 'end');
  const e = core.endOp(st({ status: 'done' }), T0);
  check('abandon d’une course finie → refus', !e.ok && e.code === 'run-done');
}

console.log('\n' + ok + ' test(s) OK' + (ko ? ', ' + ko + ' échec(s)' : '') + '.');
process.exit(ko ? 1 : 0);
