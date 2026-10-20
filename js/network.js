// ============ HÔTE DE PARTIE (IA locale ou en ligne) + RÉSEAU PEERJS ============
const APPV='3.11.3';
const ANIM=1.78;                                            // vitesse des animations du duel (1 = ancienne vitesse ; plus grand = plus lent)
function peerId(code){return 'etat-arcanique-'+String(code).replace('ARCANE-','').toLowerCase()}
function validCode(c){return /^ARCANE-[A-Z0-9]{6}$/.test(String(c||'').trim().toUpperCase())}

// Le moteur vit chez l'hôte : il valide chaque action, gère le chrono et l'IA, puis envoie à chaque joueur sa propre vue.
const MULLT=30;   // secondes pour choisir son mulligan (si le défi a un chrono)
const RPST=15;    // secondes pour choisir pierre, feuille ou ciseaux face à Osiris (expert bluffeur), même sans chrono
function HostGame(G,seats,onMe){
  const H={G,seats,sent:[0,0],dl:0,timer:null,aiT:null,stop:false};seats.forEach((x,i)=>{if(x.kind!=='ai')G.p[i].hum=1});   // joueurs humains : ils choisissent les cibles des Cris d'arrivée
  const lim=()=>G.o.tim|0;
  H.view=side=>{const V=view(G,side,H.sent[side]);H.sent[side]=G.hist.length;V.tl=H.dl?Math.max(0,H.dl-Date.now()):0;V.tim=G.phase==='mull'?Math.min(lim(),MULLT):G.phase==='rps'?RPST:lim();return V};
  H.push=()=>{seats.forEach((s,i)=>{
    if(s.kind==='me'){try{onMe(H.view(i))}catch(e){console.error(e)}}else if(s.kind==='net'&&s.send)s.send({t:'st',v:H.view(i)})})};
  H.arm=()=>{clearTimeout(H.timer);H.dl=0;if(G.over||H.stop)return;
    // Osiris (expert bluffeur) : sans choix au bout de 15 s, le signe est tiré au hasard
    if(G.phase==='rps'){const c=G.rpsTo,tn=G.turn;H.dl=Date.now()+RPST*1000;
      H.timer=setTimeout(()=>{if(G.over||G.phase!=='rps'||G.rpsTo!==c||G.turn!==tn||H.stop)return;const n0=G.hist.length;act(G,c,{t:'rps',v:RPSK[Math.random()*3|0]});H.after(pace(n0,300))},RPST*1000+250);return}
    if(!lim())return;
    // mulligan : à la fin du temps, ceux qui n'ont pas choisi gardent leur main
    if(G.phase==='mull'){const mt=Math.min(lim(),MULLT);H.dl=Date.now()+mt*1000;
      H.timer=setTimeout(()=>{if(G.over||G.phase!=='mull'||H.stop)return;for(const s of[0,1])if(G.phase==='mull'&&!G.mull[s])act(G,s,{t:'mull',idx:[]});H.after(300)},mt*1000+250);return}
    H.dl=Date.now()+lim()*1000;const c=G.cur,tn=G.turn;
    H.timer=setTimeout(()=>{if(G.over||G.cur!==c||G.turn!==tn||H.stop)return;act(G,c,{t:'end'});H.after(300)},lim()*1000+250)};
  H.after=(delay)=>{
    if(H.stop)return;
    const ph=G.phase||'';if(H.lastTurn!==G.turn||H.lastPh!==ph){H.lastTurn=G.turn;H.lastPh=ph;H.arm()}
    H.push();
    if(G.over){clearTimeout(H.timer);clearTimeout(H.aiT);return}
    // l'IA face à Osiris : elle choisit son signe après un petit temps de réflexion
    if(G.phase==='rps'&&seats[G.rpsTo].kind==='ai'){clearTimeout(H.aiT);const c=G.rpsTo;
      H.aiT=setTimeout(()=>{if(H.stop||G.over||G.phase!=='rps'||G.rpsTo!==c)return;const n0=G.hist.length;act(G,c,aiPick(G,c,seats[c].W));H.after(pace(n0,600))},1500+Math.random()*1500)}
    if(!G.phase&&seats[G.cur].kind==='ai'){clearTimeout(H.aiT);H.aiT=setTimeout(H.aiStep,delay==null?700:delay)}};
  // délai avant l'action suivante de l'IA : assez long pour laisser jouer les animations produites
  const pace=(n0,base)=>{let w=0;for(let i=n0;i<G.hist.length;i++){const t=G.hist[i].t;w+=t==='fac'||t==='play'&&G.hist[i].ts!==0?550:t==='dmg'||t==='pz'||t==='gold'?260:t==='atk'?480:t==='tfx'||t==='chaos'||t==='story'?280:t==='move'||t==='tmove'?420:t==='rpsr'?1500:80}
    return Math.min(4200,base+w)*ANIM};
  H.aiStep=()=>{
    if(H.stop||G.over||G.phase)return;const s=G.cur;if(seats[s].kind!=='ai')return;
    const st=seats[s],n0=G.hist.length;
    // siège « fort » : l'IA simule la suite (MCTS plat apparié) au lieu d'évaluer son seul coup immédiat
    const m=st.strong?aiFlatMC(G,s,st.W,st.strong===true?MCTS_STRONG:st.strong):aiPick(G,s,st.W);
    const r=act(G,s,m);if(!r.ok)act(G,s,{t:'end'});
    H.after(pace(n0,m.t==='end'?400:600))};
  H.act=(side,a)=>{
    if(H.stop)return{ok:false,err:'Partie fermée.'};
    const n0=G.hist.length,r=act(G,side,a);
    if(!r.ok){const s=seats[side];if(s.kind==='net'&&s.send)s.send({t:'err',m:r.err});return r}
    H.after(pace(n0,a.t==='end'?700:500));return r};
  H.resign=side=>{if(!G.over){act(G,side,{t:'resign'});H.after(0)}};
  H.close=()=>{H.stop=true;clearTimeout(H.timer);clearTimeout(H.aiT)};
  H.start=()=>{H.lastTurn=G.turn;H.lastPh=G.phase||'';H.arm();H.push();
    // mulligan de l'IA, après un petit temps de réflexion
    if(G.phase==='mull'){seats.forEach((st,i)=>{if(st.kind==='ai')setTimeout(()=>{if(H.stop||G.phase!=='mull'||G.mull[i])return;act(G,i,{t:'mull',idx:aiMull(G,i)});H.after(500)},1800+Math.random()*1800)});return}
    if(seats[G.cur].kind==='ai')H.aiT=setTimeout(H.aiStep,1200)};
  return H}

// ---------- réseau ----------
const NET={peer:null,ok:false,err:'',tries:{},cb:null};
function netStart(onChange){
  NET.cb=onChange||function(){};
  if(typeof Peer==='undefined'){NET.err='Mode en ligne indisponible (PeerJS non chargé : vérifie ta connexion).';NET.cb();return}
  try{NET.peer=new Peer(peerId(S.code),{debug:0})}catch(e){NET.err='Connexion impossible.';NET.cb();return}
  const P=NET.peer;
  P.on('open',()=>{NET.ok=true;NET.err='';NET.cb()});
  P.on('connection',onIncoming);
  P.on('disconnected',()=>{NET.ok=false;NET.cb();setTimeout(()=>{try{P.reconnect()}catch(e){}},2500)});
  P.on('close',()=>{NET.ok=false;NET.cb()});
  P.on('error',e=>{
    if(e.type==='unavailable-id'){NET.err='Ton profil est déjà ouvert dans un autre onglet.';NET.cb();return}
    if(e.type==='peer-unavailable'){const m=String(e.message||'').match(/etat-arcanique-[a-z0-9]+/);if(m&&NET.tries[m[0]])NET.tries[m[0]]();return}
    if(e.type==='network'||e.type==='server-error'||e.type==='socket-error'){NET.err='Serveur de rencontre injoignable…';NET.cb()}})}
function netReady(){return NET.peer&&NET.ok}
// présence d'un ami : on tente de se connecter à son profil
function pingFriend(code,cb){
  if(!netReady())return cb(null);
  const id=peerId(code);let done=false,c=null;
  const fin=v=>{if(done)return;done=true;clearTimeout(t);delete NET.tries[id];try{c&&c.close()}catch(e){}cb(v)};
  const t=setTimeout(()=>fin(false),5500);NET.tries[id]=()=>fin(false);
  try{c=NET.peer.connect(id,{reliable:true})}catch(e){return fin(false)}
  c.on('open',()=>{try{c.send({t:'ping'})}catch(e){fin(false)}});
  c.on('data',m=>{if(m&&m.t==='pong')fin(m)});c.on('error',()=>fin(false))}

// connexion entrante : ping, ou défi
function onIncoming(c){
  c.on('data',m=>{
    if(!m||!m.t)return;
    if(m.t==='ping'){try{c.send({t:'pong',name:S.name,av:S.av||'',busy:!!window.DUEL})}catch(e){}return}
    if(m.t==='chal'){
      if(window.DUEL||window.CHALLENGE_UI||window.TRADE_UI){try{c.send({t:'busy'})}catch(e){}return}
      if(typeof onChallenge==='function')onChallenge(c,m);return}
    if(m.t==='msg'){try{c.send({t:'msgok'})}catch(e){}if(typeof onFriendMsg==='function')onFriendMsg(m);return}   // message de chat d'un ami
    if(m.t==='trade'){                                   // proposition d'échange de cartes
      if(window.DUEL||window.CHALLENGE_UI||window.TRADE_UI){try{c.send({t:'busy'})}catch(e){}return}
      if(typeof onTrade==='function')onTrade(c,m)}})}

// côté challenger : envoie le défi et attend la réponse
function sendChallenge(friend,deckInfo,opt,cbs){
  if(!netReady()){cbs.fail('Connexion au serveur de rencontre en cours… réessaie dans un instant.');return null}
  const id=peerId(friend.code);let c=null,done=false;
  const fail=m=>{if(done)return;done=true;clearTimeout(t);delete NET.tries[id];try{c&&c.close()}catch(e){}cbs.fail(m)};
  const t=setTimeout(()=>fail(friend.name+' est hors ligne (ou n’a pas ouvert le jeu).'),9000);
  NET.tries[id]=()=>fail(friend.name+' est hors ligne (ou n’a pas ouvert le jeu).');
  try{c=NET.peer.connect(id,{reliable:true})}catch(e){fail('Connexion impossible.');return null}
  c.on('open',()=>{clearTimeout(t);delete NET.tries[id];c.send({t:'chal',name:S.name,av:S.av||'',code:S.code,o:opt,ver:APPV})});
  c.on('data',m=>{
    if(!m)return;
    if(m.t==='busy'){done=true;cbs.fail(friend.name+' est déjà occupé(e).');try{c.close()}catch(e){}}
    else if(m.t==='dec'){done=true;cbs.fail(m.why==='arena'?friend.name+' n’a pas de deck d’Arène prêt.':m.why==='duel'?friend.name+' n’a plus de deck valide.':friend.name+' a refusé le défi.');try{c.close()}catch(e){}}
    else if(m.t==='acc'){done=true;cbs.accepted(c,m)}});
  c.on('error',()=>fail('Erreur de connexion.'));
  c.on('close',()=>{if(!done)fail('La connexion a été coupée.')});
  return{cancel:()=>{done=true;clearTimeout(t);delete NET.tries[id];try{c.close()}catch(e){}}}}

// message de chat à un ami connecté : connexion, envoi, accusé de réception (cb(true) ou cb(false))
function sendMsg(friend,text,cb){
  if(!netReady())return cb(false);
  const id=peerId(friend.code);let c=null,done=false;
  const fin=v=>{if(done)return;done=true;clearTimeout(t);delete NET.tries[id];try{c&&c.close()}catch(e){}cb(v)};
  const t=setTimeout(()=>fin(false),7000);NET.tries[id]=()=>fin(false);
  try{c=NET.peer.connect(id,{reliable:true})}catch(e){return fin(false)}
  c.on('open',()=>{try{c.send({t:'msg',name:S.name,av:S.av||'',code:S.code,m:String(text).slice(0,300)})}catch(e){fin(false)}});
  c.on('data',m=>{if(m&&m.t==='msgok')fin(true)});c.on('error',()=>fin(false))}
// côté initiateur d'un échange : envoie la proposition et attend la réponse (accepté / refusé / occupé)
function sendTrade(friend,cbs){
  if(!netReady()){cbs.fail('Connexion au serveur de rencontre en cours… réessaie dans un instant.');return null}
  const id=peerId(friend.code);let c=null,done=false;
  const off=friend.name+' est hors ligne (ou n’a pas ouvert le jeu).';
  const fail=m=>{if(done)return;done=true;clearTimeout(t);delete NET.tries[id];try{c&&c.close()}catch(e){}cbs.fail(m)};
  const t=setTimeout(()=>fail(off),9000);NET.tries[id]=()=>fail(off);
  try{c=NET.peer.connect(id,{reliable:true})}catch(e){fail('Connexion impossible.');return null}
  c.on('open',()=>{clearTimeout(t);delete NET.tries[id];try{c.send({t:'trade',name:S.name,av:S.av||'',code:S.code,ver:APPV})}catch(e){fail('Erreur de connexion.')}});
  c.on('data',m=>{
    if(!m||done)return;
    if(m.t==='busy'){done=true;cbs.fail(friend.name+' est occupé(e) (duel ou autre échange).');try{c.close()}catch(e){}}
    else if(m.t==='dec'){done=true;cbs.fail(friend.name+' a refusé l’échange.');try{c.close()}catch(e){}}
    else if(m.t==='tacc'){done=true;cbs.accepted(c,m)}});
  c.on('error',()=>fail('Erreur de connexion.'));
  c.on('close',()=>{if(!done)fail('La connexion a été coupée.')});
  return{cancel:()=>{done=true;clearTimeout(t);delete NET.tries[id];try{c.send({t:'tcancel'})}catch(e){}try{c.close()}catch(e){}}}}

// ============ ÉCHANGES DE CARTES ENTRE AMIS ============
// Une offre est {k,p:0} : la carte (clé) ; p vaut toujours 0 (les exemplaires prismatiques n'existent plus).
// Chaque joueur choisit UNE carte à donner ; les deux joueurs voient les deux cartes ; l'échange n'a lieu que quand
// les deux ont validé exactement la même paire. Toute modification d'une offre annule les validations.
function offerOk(o){return!!o&&typeof o.k==='string'&&!!CARDS[o.k]&&POOL.indexOf(o.k)>=0&&!o.p}
function cleanOffer(o){return offerOk(o)?{k:o.k,p:0}:null}
function sameOffer(a,b){return!!a&&!!b&&a.k===b.k}
function hasCopy(o,st){const e=(st||S).coll[o.k];return!!e&&e.n>0}
// decks : on retire l'exemplaire donné des decks qui en contenaient plus que ce que le joueur possède encore (carte `only`)
function fixDecks(st,only){st=st||S;const out=[];
  for(const d of st.decks){const cnt={};d.cards.forEach(e=>{const k=String(e).replace('*','');cnt[k]=(cnt[k]||0)+1});let lost=0;
    for(const k in cnt){if(only&&k!==only)continue;const e=st.coll[k]||{n:0,p:0};let ex=cnt[k]-(e.n+(e.p||0));
      for(let i=d.cards.length-1;i>=0&&ex>0;i--)if(String(d.cards[i]).replace('*','')===k){d.cards.splice(i,1);ex--;lost++}}
    if(lost)out.push({name:d.name,n:lost})}
  return out}
// applique l'échange dans MA collection : je perds `give`, je gagne `get` (null si l'échange est impossible)
function tradeApply(give,get,st){
  st=st||S;if(!offerOk(give)||!offerOk(get)||!hasCopy(give,st))return null;
  const e=st.coll[give.k];e.n--;
  const g=st.coll[get.k]||(st.coll[get.k]={n:0,p:0});g.n++;
  const fixed=fixDecks(st,give.k);saveS();return{fixed}}

// Session d'échange entre deux joueurs, au-dessus d'une connexion {send,on,close}.
// hooks : change(T) à chaque changement d'état, done(res) quand l'échange est fait, closed(raison) quand il est annulé ou coupé ;
// hooks.S (facultatif) renvoie la sauvegarde du joueur (par défaut la sauvegarde globale S).
// État : T.mine / T.theirs (offres), T.myLock / T.theirLock (validations), T.state = 'open' | 'done' | 'closed'.
function TradeSession(conn,peer,hooks){
  const T={conn,peer,mine:null,theirs:null,myLock:false,theirLock:false,state:'open',res:null},st=()=>hooks.S?hooks.S():S;
  const send=m=>{try{conn.send(m)}catch(e){}};
  const change=()=>{try{hooks.change&&hooks.change(T)}catch(e){console.error(e)}};
  const closed=why=>{if(T.state==='closed')return;T.state='closed';try{hooks.closed&&hooks.closed(why)}catch(e){console.error(e)}};
  const unlockBoth=()=>{T.myLock=false;T.theirLock=false};
  // quand les deux ont validé la même paire, chacun applique l'échange chez lui (une seule fois)
  const tryFinish=()=>{
    if(T.state!=='open'||!T.myLock||!T.theirLock||!T.mine||!T.theirs)return;
    const r=tradeApply(T.mine,T.theirs,st());
    if(!r){send({t:'tcancel'});closed('fail');return}
    T.state='done';T.res={give:T.mine,get:T.theirs,fixed:r.fixed};send({t:'tdone'});change();try{hooks.done&&hooks.done(T.res)}catch(e){console.error(e)}};
  T.setOffer=o=>{
    if(T.state!=='open')return false;
    if(o&&!(offerOk(o)&&hasCopy(o,st())))return false;
    T.mine=o?{k:o.k,p:0}:null;unlockBoth();send({t:'toff',o:T.mine});change();return true};
  T.canLock=()=>T.state==='open'&&!!T.mine&&!!T.theirs&&!T.myLock&&hasCopy(T.mine,st());
  T.lock=()=>{
    if(!T.canLock())return false;
    T.myLock=true;send({t:'tlock',give:T.mine,get:T.theirs});tryFinish();if(T.state==='open')change();return true};
  T.unlock=()=>{if(T.state!=='open'||!T.myLock)return;T.myLock=false;send({t:'tunlock'});change()};
  T.cancel=()=>{
    if(T.state==='closed')return;const was=T.state;if(was==='open')send({t:'tcancel'});T.state='closed';
    // après un échange réussi, on laisse partir les derniers messages (validation, « fait ») avant de couper
    if(was==='done')setTimeout(()=>{try{conn.close()}catch(e){}},1500);else try{conn.close()}catch(e){}
    if(was==='open'){try{hooks.closed&&hooks.closed('cancel')}catch(e){console.error(e)}}};
  conn.on('data',m=>{
    if(!m||typeof m!=='object'||T.state==='closed')return;
    if(m.t==='toff'){
      const o=m.o==null?null:cleanOffer(m.o);if(m.o!=null&&!o)return;     // offre invalide : ignorée
      if(T.state!=='open')return;T.theirs=o;unlockBoth();change();return}
    if(m.t==='tlock'){
      if(T.state!=='open')return;
      // l'autre a validé : on ne le croit que s'il s'agit exactement de la paire que je vois (sinon c'est une validation périmée)
      if(sameOffer(cleanOffer(m.give),T.theirs)&&sameOffer(cleanOffer(m.get),T.mine)){T.theirLock=true;tryFinish();if(T.state==='open')change()}
      return}
    if(m.t==='tunlock'){if(T.state==='open'){T.theirLock=false;change()}return}
    if(m.t==='tcancel'){if(T.state==='open')closed('peer');return}});
  conn.on('close',()=>{if(T.state==='open')closed('lost')});
  return T}

