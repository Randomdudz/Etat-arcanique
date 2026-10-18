// Cœur de validation de l'Arène (pur : aucune dépendance Firebase, testable en Node).
// Le serveur est la seule source de vérité des compteurs du classement : le client ne peut plus les écrire,
// il demande d'abord l'ouverture d'une course, obtient un billet horodaté au début de chaque match, puis
// déclare le résultat. Chaque fonction renvoie {ok:true, ...} ou {ok:false, code, err}.
'use strict';

const CFG = {
  minMatchMs: 60 * 1000,        // une victoire ne peut pas être enregistrée moins de 60 s après le début du match
  maxMatchMs: 3 * 3600 * 1000,  // un billet plus vieux que 3 h ne compte plus
  maxRunMs: 6 * 3600 * 1000,    // une course ouverte depuis plus de 6 h est considérée abandonnée
  maxRunsPerDay: 12,            // courses maximum par 24 h glissantes
  maxWins: 9,
  maxLosses: 3,
  dayMs: 24 * 3600 * 1000,
  maxPseudo: 18
};

const ok = x => Object.assign({ ok: true }, x || {});
const no = (code, err) => ({ ok: false, code, err });

// lundi 00:00 UTC de la semaine contenant `now` (même calcul que arenaWeekKey du client)
function weekKey(now) {
  const d = new Date(now);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7);
  return d.toISOString().slice(0, 10);
}
function cleanPseudo(p) {
  return String(p == null ? '' : p).replace(/[\r\n\t]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, CFG.maxPseudo) || 'Joueur';
}
function activeRun(state, now) {
  if (!state) return no('no-run', 'Aucune course en cours sur le serveur.');
  if (state.status !== 'active') return no('run-done', 'Cette course est déjà terminée.');
  if (now - (+state.startedAt || 0) > CFG.maxRunMs) return no('run-stale', 'Course expirée : elle a été ouverte il y a trop longtemps.');
  return ok();
}
function pruneStarts(starts, now) {
  return (Array.isArray(starts) ? starts : []).filter(x => Number.isFinite(+x) && now - +x < CFG.dayMs && +x <= now + 60000);
}
function ticketId() {
  try { return require('crypto').randomBytes(12).toString('hex') }
  catch (e) { return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) }
}

// ouverture d'une course : limite les courses sur 24 h glissantes ; une course encore ouverte est remplacée
function runOp(state, now, pseudo) {
  const starts = pruneStarts(state && state.starts, now);
  if (starts.length >= CFG.maxRunsPerDay) return no('rate-run', 'Trop de courses lancées sur les dernières 24 h (maximum ' + CFG.maxRunsPerDay + ').');
  const week = weekKey(now);
  return ok({
    week, starts: starts.concat(now), state: {
      pseudo: cleanPseudo(pseudo), week, startedAt: now, wins: 0, losses: 0, ai: 0, hum: 0,
      status: 'active', ticket: null, lastAt: now, starts: starts.concat(now), ver: 1
    }
  });
}

// début d'un match : billet horodaté (mode « ai » ou « human ») ; un nouveau billet remplace l'ancien
function matchOp(state, now, mode) {
  const a = activeRun(state, now); if (!a.ok) return a;
  if ((+state.wins || 0) >= CFG.maxWins) return no('run-full', 'Course déjà à ' + CFG.maxWins + ' victoires.');
  return ok({ ticket: { id: ticketId(), mode: mode === 'ai' ? 'ai' : 'human', at: now } });
}

// victoire : billet obligatoire, match assez long, course encore ouverte
function winOp(state, now, ticketId, opp) {
  const a = activeRun(state, now); if (!a.ok) return a;
  if ((+state.wins || 0) >= CFG.maxWins) return no('run-full', 'Course déjà à ' + CFG.maxWins + ' victoires.');
  const tk = state.ticket;
  if (!tk || !tk.id) return no('no-ticket', 'Aucun match en cours enregistré côté serveur : relance un duel d’Arène.');
  if (String(ticketId || '') !== String(tk.id)) return no('bad-ticket', 'Billet de match invalide ou déjà utilisé.');
  const el = now - (+tk.at || 0);
  if (el < CFG.minMatchMs) return no('too-fast', 'Match trop court pour être enregistré (' + Math.round(el / 1000) + ' s).');
  if (el > CFG.maxMatchMs) return no('ticket-old', 'Match trop ancien pour être enregistré.');
  const mode = tk.mode === 'ai' ? 'ai' : 'human';
  const wins = (+state.wins || 0) + 1;
  const next = {
    wins, ai: (+state.ai || 0) + (mode === 'ai' ? 1 : 0), hum: (+state.hum || 0) + (mode === 'human' ? 1 : 0),
    ticket: null, lastAt: now, status: wins >= CFG.maxWins ? 'done' : 'active'
  };
  const log = {
    kind: 'win', mode, elapsedMs: el, at: now, week: state.week, pseudo: state.pseudo,
    opp: cleanPseudo(opp), wins, losses: +state.losses || 0
  };
  return ok({ next, log, week: state.week, finished: next.status === 'done' });
}

// défaite : consomme le billet, ferme la course à la 3e (le classement ne compte que les victoires)
function lossOp(state, now, opp) {
  const a = activeRun(state, now); if (!a.ok) return a;
  const mode = state.ticket ? (state.ticket.mode === 'ai' ? 'ai' : 'human') : '';
  const el = state.ticket && state.ticket.at ? now - state.ticket.at : 0;
  const losses = (+state.losses || 0) + 1;
  const next = { losses, ticket: null, lastAt: now, status: losses >= CFG.maxLosses ? 'done' : 'active' };
  const log = {
    kind: 'loss', mode, elapsedMs: el, at: now, week: state.week, pseudo: state.pseudo,
    opp: cleanPseudo(opp), wins: +state.wins || 0, losses
  };
  return ok({ next, log, week: state.week, finished: next.status === 'done' });
}

// abandon ou fin de course
function endOp(state, now) {
  const a = activeRun(state, now); if (!a.ok) return a;
  const next = { status: 'done', ticket: null, lastAt: now };
  const log = {
    kind: 'end', mode: '', elapsedMs: 0, at: now, week: state.week, pseudo: state.pseudo,
    opp: '', wins: +state.wins || 0, losses: +state.losses || 0
  };
  return ok({ next, log, week: state.week, finished: true });
}

module.exports = { CFG, weekKey, cleanPseudo, pruneStarts, runOp, matchOp, winOp, lossOp, endOp };
