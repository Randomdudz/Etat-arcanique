// Anti-triche du classement d'Arène : seule cette fonction écrit les compteurs du classement.
// Le client envoie {op:'run'|'match'|'win'|'loss'|'end'|'state'} avec son jeton Firebase en en-tête
// « Authorization: Bearer <idToken> ». Chaque partie est journalisée dans arenaWeeks/{semaine}/log (lecture publique).
'use strict';
const { onRequest } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const core = require('./arena-core');

admin.initializeApp();
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const REGION = 'europe-west1';                 // doit correspondre à l'URL de cloud-config.js
const RUNS = 'arenaRuns';                      // état serveur des courses (invisible des clients)

const fail = (res, status, err, code) => res.status(status).json({ ok: false, err, code });
const playerRef = (week, uid) => db.collection('arenaWeeks').doc(week).collection('players').doc(uid);
const logRef = week => db.collection('arenaWeeks').doc(week).collection('log');

exports.arena = onRequest({ region: REGION, cors: true, maxInstances: 20, timeoutSeconds: 30 }, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return fail(res, 405, 'Méthode non autorisée.');
  const m = /^Bearer (.+)$/i.exec(String(req.headers.authorization || ''));
  if (!m) return fail(res, 401, 'Connexion au compte en ligne requise.');
  let uid;
  try { uid = (await admin.auth().verifyIdToken(m[1], true)).uid }
  catch (e) { return fail(res, 401, 'Session expirée : reconnecte-toi.') }
  const body = (req.body && typeof req.body === 'object') ? req.body : {};
  const op = String(body.op || '');
  try {
    const out = await handle(op, uid, body);
    res.status(out.status || 200).json(out.json);
  } catch (e) {
    logger.error('arena : ' + op + ' a échoué', { uid, err: String(e && e.message) });
    fail(res, 500, 'Erreur du serveur, réessaie dans un instant.');
  }
});

async function handle(op, uid, body) {
  const now = Date.now();
  if (op === 'run') return doRun(uid, body, now);
  if (op === 'match') return doMatch(uid, body, now);
  if (op === 'win') return doWin(uid, body, now);
  if (op === 'loss') return doLoss(uid, body, now);
  if (op === 'end') return doEnd(uid, now);
  if (op === 'state') return doState(uid);
  return { status: 400, json: { ok: false, err: 'Opération inconnue.' } };
}

// ouverture d'une course : runs +1 dans le classement de la semaine, état serveur remis à zéro
async function doRun(uid, body, now) {
  const runRef = db.doc(RUNS + '/' + uid);
  return db.runTransaction(async t => {
    const snap = await t.get(runRef);
    const state = snap.exists ? snap.data() : null;
    const v = core.runOp(state, now, body.pseudo);
    if (!v.ok) return { status: 409, json: { ok: false, err: v.err, code: v.code } };
    const st = Object.assign({ uid }, v.state);
    t.set(runRef, st);
    t.set(playerRef(v.week, uid), { uid, pseudo: st.pseudo, runs: FieldValue.increment(1), updatedAt: now }, { merge: true });
    t.create(logRef(v.week).doc(), { kind: 'run', mode: '', elapsedMs: 0, at: now, week: v.week, uid, pseudo: st.pseudo, opp: '', wins: 0, losses: 0 });
    return { json: { ok: true, week: v.week, pseudo: st.pseudo, runsToday: v.starts.length } };
  });
}

// début d'un match : billet horodaté que seule la victoire/défaite consommera
async function doMatch(uid, body, now) {
  const runRef = db.doc(RUNS + '/' + uid);
  return db.runTransaction(async t => {
    const snap = await t.get(runRef);
    const state = snap.exists ? snap.data() : null;
    const v = core.matchOp(state, now, body.mode);
    if (!v.ok) return { status: 409, json: { ok: false, err: v.err, code: v.code } };
    t.set(runRef, { ticket: v.ticket, lastAt: now }, { merge: true });
    return { json: { ok: true, ticket: v.ticket.id, at: v.ticket.at, mode: v.ticket.mode } };
  });
}

// victoire : total +1 (et winsAI / winsHuman) dans le classement, journal + état serveur à jour
async function doWin(uid, body, now) {
  const runRef = db.doc(RUNS + '/' + uid);
  return db.runTransaction(async t => {
    const snap = await t.get(runRef);
    const state = snap.exists ? snap.data() : null;
    const v = core.winOp(state, now, body.ticket, body.opp);
    if (!v.ok) return { status: 409, json: { ok: false, err: v.err, code: v.code } };
    const week = state.week, pseudo = state.pseudo, counts = {};
    counts[state.ticket.mode === 'ai' ? 'winsAI' : 'winsHuman'] = FieldValue.increment(1);
    t.set(runRef, v.next, { merge: true });
    t.set(playerRef(week, uid), Object.assign({ uid, pseudo, total: FieldValue.increment(1), updatedAt: now }, counts), { merge: true });
    t.create(logRef(week).doc(), Object.assign({}, v.log, { uid }));
    return { json: { ok: true, wins: v.next.wins, losses: +state.losses || 0, finished: !!v.finished, elapsedMs: v.log.elapsedMs } };
  });
}

// défaite : pas de compteur (le classement ne compte que les victoires), mais journal + état serveur
async function doLoss(uid, body, now) {
  const runRef = db.doc(RUNS + '/' + uid);
  return db.runTransaction(async t => {
    const snap = await t.get(runRef);
    const state = snap.exists ? snap.data() : null;
    const v = core.lossOp(state, now, body.opp);
    if (!v.ok) return { status: 409, json: { ok: false, err: v.err, code: v.code } };
    t.set(runRef, v.next, { merge: true });
    t.create(logRef(state.week).doc(), Object.assign({}, v.log, { uid }));
    return { json: { ok: true, losses: v.next.losses, finished: !!v.finished } };
  });
}

async function doEnd(uid, now) {
  const runRef = db.doc(RUNS + '/' + uid);
  return db.runTransaction(async t => {
    const snap = await t.get(runRef);
    const state = snap.exists ? snap.data() : null;
    const v = core.endOp(state, now);
    if (!v.ok) return { status: 409, json: { ok: false, err: v.err, code: v.code } };
    t.set(runRef, v.next, { merge: true });
    t.create(logRef(state.week).doc(), Object.assign({}, v.log, { uid }));
    return { json: { ok: true } };
  });
}

async function doState(uid) {
  const snap = await db.doc(RUNS + '/' + uid).get();
  const r = snap.exists ? snap.data() : null;
  return {
    json: {
      ok: true, state: r ? {
        week: r.week, wins: +r.wins || 0, losses: +r.losses || 0, ai: +r.ai || 0, hum: +r.hum || 0,
        status: r.status, startedAt: +r.startedAt || 0, pseudo: r.pseudo || ''
      } : null
    }
  };
}
