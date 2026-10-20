// ============ DUEL EN LIGNE : MATCHMAKING DES DUELS NORMAUX ============
// Même principe que la file d'Arène (js/arena.js) : une entrée Firestore par joueur (duelQueue/{uid}),
// appariement déterministe (l'uid le plus petit se connecte), puis défi PeerJS accepté automatiquement.
// Les matchs se jouent en réglages standard du jeu ; le deck est choisi avant de lancer la recherche.
const DUEL_QUEUE_MS=300000,DUEL_QUEUE_POLL=2500;
const DQ={active:false,state:'',qid:'',created:0,expires:0,deck:null,peer:null,busy:false,started:false,skip:[],poll:0,tick:0,cleanup:null,error:''};
function duelQueueUrl(uid){return'https://firestore.googleapis.com/v1/projects/'+encodeURIComponent(CLOUD.projectId)+'/databases/(default)/documents/duelQueue/'+encodeURIComponent(uid)}
function duelQueueFields(q){return{qid:{stringValue:q.qid},pseudo:{stringValue:q.pseudo},code:{stringValue:q.code},status:{stringValue:q.status},
  created:{integerValue:String(q.created)},expires:{integerValue:String(q.expires)},
  opponentUid:{stringValue:q.opponentUid||''},opponentQueueId:{stringValue:q.opponentQueueId||''},
  opponentCode:{stringValue:q.opponentCode||''},opponentName:{stringValue:q.opponentName||''}}}
function duelQueueDocData(d){const f=d.fields||{},v=(k)=>f[k]&&(f[k].stringValue||f[k].integerValue)||'';
  return{uid:d.name.split('/').pop(),qid:String(v('qid')),pseudo:String(v('pseudo')),code:String(v('code')),status:String(v('status')),
    created:+v('created')||0,expires:+v('expires')||0,opponentUid:String(v('opponentUid')),
    opponentQueueId:String(v('opponentQueueId')),opponentCode:String(v('opponentCode')),opponentName:String(v('opponentName'))}}
async function duelQueueWrite(status,peer){
  const q={qid:DQ.qid,pseudo:String(S.name||'Joueur').slice(0,18),code:S.code,status,created:DQ.created,expires:DQ.expires,
    opponentUid:peer&&peer.uid,opponentQueueId:peer&&peer.qid,opponentCode:peer&&peer.code,opponentName:peer&&peer.pseudo};
  const tok=await accTok();return accFetch(duelQueueUrl(DQ.uid),{method:'PATCH',headers:{Authorization:'Bearer '+tok,'Content-Type':'application/json'},
    body:JSON.stringify({fields:duelQueueFields(q)})})}
async function duelQueueDelete(uid){
  if(!ACC||!cloudOn())return;
  const tok=await accTok(),url=duelQueueUrl(uid||DQ.uid);let r;
  try{r=await fetch(url,{method:'DELETE',headers:{Authorization:'Bearer '+tok}})}catch(e){throw new Error(accErr(''))}
  if(!r.ok&&r.status!==404){const j=await r.json().catch(()=>({})),e=j.error||{};throw new Error(accErr(e.status||e.message))}}
async function duelQueueReadAll(){
  const tok=await accTok(),url='https://firestore.googleapis.com/v1/projects/'+encodeURIComponent(CLOUD.projectId)+'/databases/(default)/documents:runQuery',
    rows=await accFetch(url,{method:'POST',headers:{Authorization:'Bearer '+tok,'Content-Type':'application/json'},
      body:JSON.stringify({structuredQuery:{from:[{collectionId:'duelQueue'}],limit:100}})});
  return rows.filter(x=>x.document).map(x=>duelQueueDocData(x.document))}
function duelQueuePanel(){
  return homeCard({k:'queue',icon:'compass',title:'Chercher un adversaire',
    desc:'Le matchmaking te trouve un adversaire humain, en réglages standard (30 PV, 80 s par tour), avec les récompenses habituelles. 5 minutes de recherche au plus. Compte en ligne nécessaire.',
    extra:h('div',{id:'duelQueueStatus',class:'arena-qstatus',hidden:true}),
    btn:[h('button',{class:'hm-btn',id:'duelQueueJoin',onclick:duelQueueStart},'Lancer la recherche'),h('button',{class:'btn sm hm-cancel',id:'duelQueueCancel',hidden:true,onclick:duelQueueCancel},'Annuler la recherche')]})}
function duelQueueRender(){
  const box=$('#duelQueueStatus'),cancel=$('#duelQueueCancel'),join=$('#duelQueueJoin');if(!box)return;
  box.hidden=!DQ.state;box.className='arena-qstatus'+(DQ.state==='expired'||DQ.state==='error'?' expired':'');
  const remain=Math.max(0,DQ.expires-Date.now()),mm=Math.floor(remain/60000),ss=String(Math.ceil(remain%60000/1000)).padStart(2,'0');
  box.textContent=DQ.state==='searching'?'Recherche d’un adversaire humain · '+mm+':'+ss+' restantes.':
    DQ.state==='paired'?'Adversaire trouvé · établissement de la connexion…':
    DQ.state==='connecting'?'Match trouvé · connexion à '+(DQ.peer&&DQ.peer.pseudo||'ton adversaire')+'…':
    DQ.state==='playing'?'Match trouvé · bon duel !':
    DQ.state==='expired'?'File expirée après 5 minutes. Tu peux relancer la recherche.':
    DQ.state==='error'?DQ.error||'La recherche a échoué. Réessaie.':'';
  if(join){join.disabled=DQ.active;join.textContent=DQ.active?'Recherche en cours…':DQ.state==='expired'||DQ.state==='error'?'Relancer la recherche':'Lancer la recherche'}
  if(cancel)cancel.hidden=!DQ.active}
function duelQueueClearTimers(){clearInterval(DQ.poll);clearInterval(DQ.tick);DQ.poll=0;DQ.tick=0}
function duelQueueWatch(){
  if(!DQ.active)return;
  if(!DQ.tick)DQ.tick=setInterval(()=>{if(Date.now()>=DQ.expires)duelQueueTimeout();else duelQueueRender()},1000);
  if(!DQ.poll)DQ.poll=setInterval(duelQueuePoll,DUEL_QUEUE_POLL)}
function duelQueueRelease(reason){
  const uid=DQ.uid;duelQueueClearTimers();DQ.active=false;DQ.busy=false;DQ.started=false;DQ.peer=null;
  DQ.state=reason||'';if(uid&&ACC&&cloudOn())DQ.cleanup=duelQueueDelete(uid).catch(e=>{console.error(e);if(reason!=='expired')toast('Impossible de nettoyer la file de duel : '+e.message)}).finally(()=>{DQ.cleanup=null});
  duelQueueRender()}
async function duelQueueTimeout(){
  if(!DQ.active)return;
  const uid=DQ.uid;duelQueueClearTimers();DQ.active=false;DQ.busy=false;DQ.started=false;DQ.peer=null;DQ.state='expired';
  DQ.cleanup=duelQueueDelete(uid);try{await DQ.cleanup}catch(e){console.error(e);toast('La recherche a expiré, mais le nettoyage a échoué : '+e.message)}
  finally{DQ.cleanup=null}
  duelQueueRender()}
function duelQueueCancel(){if(!DQ.active)return;duelQueueRelease('');toast('Recherche de duel annulée.')}
function duelQueueStart(){
  if(typeof AQ!=='undefined'&&AQ.active){toast('Tu cherches déjà un adversaire en Arène : annule cette recherche d’abord.');return}
  if(DQ.active)return;
  if(!cloudOn()||!ACC){toast('Le duel en ligne nécessite un compte Firebase connecté. Les comptes locaux ne peuvent pas y accéder.');return}
  if(!netReady()){toast('Connexion au serveur de rencontre en cours… réessaie dans un instant.');return}
  pickDeckModal('Duel en ligne','Choisis le deck qui sera utilisé si un adversaire est trouvé (il restera secret).',duelQueueBegin)}
function duelQueueBegin(di){
  if(DQ.active)return;
  const d=S.decks[di],chk=d?deckCheck(d):{ok:false,err:'Deck introuvable.'};if(!chk.ok){toast('Deck invalide : '+chk.err);return}
  if(DQ.cleanup){DQ.cleanup.then(()=>duelQueueBegin(di));return}
  const now=Date.now();Object.assign(DQ,{active:true,state:'searching',uid:ACC.uid,qid:arenaSeed().toString(36),created:now,expires:now+DUEL_QUEUE_MS,
    deck:di,peer:null,busy:false,started:false,skip:[]});
  go('play');duelQueueRender();
  duelQueueWrite('searching').then(()=>{if(!DQ.active)return;duelQueueWatch();duelQueuePoll()})
    .catch(e=>{console.error(e);duelQueueRelease('error');DQ.error='Échec de connexion à la file Firestore : '+e.message;duelQueueRender();toast(DQ.error)})}
async function duelQueuePoll(){
  if(!DQ.active||DQ.busy||!ACC||ACC.uid!==DQ.uid)return;
  if(Date.now()>=DQ.expires){duelQueueTimeout();return}
  DQ.busy=true;
  try{
    const all=await duelQueueReadAll();if(!DQ.active)return;
    const now=Date.now(),mine=all.find(x=>x.uid===DQ.uid&&x.qid===DQ.qid);
    if(!mine){await duelQueueWrite('searching');DQ.state='searching';DQ.peer=null;duelQueueRender();return}
    const peers=all.filter(x=>x.uid!==DQ.uid&&x.expires>now);
    if(mine.status==='paired'&&mine.opponentUid){
      const peer=peers.find(x=>x.uid===mine.opponentUid&&x.qid===mine.opponentQueueId&&x.status==='paired'&&x.opponentUid===DQ.uid&&x.opponentQueueId===DQ.qid);
      if(peer){DQ.peer=peer;DQ.state='paired';duelQueueRender();if(DQ.uid.localeCompare(peer.uid)<0)duelQueueConnect(peer);return}
      const pending=peers.find(x=>x.uid===mine.opponentUid&&x.qid===mine.opponentQueueId);
      if(!pending||pending.status==='searching'){DQ.peer=null;DQ.state='searching';await duelQueueWrite('searching');duelQueueWatch();duelQueueRender();return}
      DQ.state='paired';duelQueueRender();return}
    const proposal=peers.filter(x=>x.status==='paired'&&x.opponentUid===DQ.uid&&x.opponentQueueId===DQ.qid&&x.uid.localeCompare(DQ.uid)<0)
      .sort((a,b)=>a.created-b.created||a.uid.localeCompare(b.uid))[0];
    if(proposal&&mine.status==='searching'){
      await duelQueueWrite('paired',proposal);if(!DQ.active)return;
      DQ.peer=proposal;DQ.state='paired';duelQueueRender();return}
    if(mine.status==='searching'){
      const candidate=peers.filter(x=>x.status==='searching'&&x.uid.localeCompare(DQ.uid)>0&&!DQ.skip.includes(x.uid))
        .sort((a,b)=>a.created-b.created||a.uid.localeCompare(b.uid))[0];
      if(candidate){await duelQueueWrite('paired',candidate);if(!DQ.active)return;
        DQ.peer=candidate;DQ.state='paired';duelQueueRender()}}
  }catch(e){console.error(e);if(DQ.active){duelQueueRelease('error');DQ.error='File Firestore indisponible : '+e.message;duelQueueRender()}}
  finally{DQ.busy=false}}
function duelQueueConnect(peer){
  if(!DQ.active||DQ.started||Date.now()>=DQ.expires)return;
  const d=S.decks[DQ.deck];
  if(!d||!deckCheck(d).ok){duelQueueRelease('error');DQ.error='Ton deck n’est plus valide : recherche interrompue.';duelQueueRender();toast(DQ.error);return}
  DQ.started=true;DQ.peer=peer;DQ.state='connecting';duelQueueRender();
  const opt=Object.assign({},OPTDEF,{duelQueue:1,duelQueueId:DQ.qid,duelOpponentQueueId:peer.qid});
  sendChallenge({code:peer.code,name:peer.pseudo},null,opt,{fail:async m=>{
    DQ.started=false;if(!DQ.active)return;
    DQ.skip.push(peer.uid);DQ.peer=null;DQ.state='searching';
    try{await duelQueueWrite('searching');duelQueueWatch();toast(m+' Recherche d’un autre adversaire…')}catch(e){duelQueueRelease('error');DQ.error='Impossible de reprendre la file : '+e.message;duelQueueRender();toast(DQ.error)}
    duelQueueRender()},
    accepted:(c,m)=>{
      if(!DQ.active||!m.duelQueue||m.duelQueueId!==peer.qid||m.duelOpponentQueueId!==DQ.qid){try{c.send({t:'dec'})}catch(e){}try{c.close()}catch(e){}DQ.started=false;return}
      duelQueueClearTimers();
      DQ.state='playing';duelQueueRender();duelQueueWrite('playing',peer).catch(e=>{console.error(e);toast('Le duel démarre, mais le statut de file n’a pas pu être actualisé : '+e.message)});
      startHostDuel(c,m,DQ.deck,opt)}})}
function onDuelQueueChallenge(c,m,nm,close){
  const r=DQ.peer,valid=DQ.active&&r&&DQ.qid===m.o.duelOpponentQueueId&&r.qid===m.o.duelQueueId&&r.code===m.code;
  const d=valid&&DQ.deck!=null?S.decks[DQ.deck]:null;
  if(!valid||!d||!deckCheck(d).ok||DUEL){try{c.send({t:'dec',why:'duel'})}catch(e){}close();setTimeout(()=>{try{c.close()}catch(e){}},300);return}
  close();duelQueueClearTimers();c.on('data',x=>{if(x&&x.t==='st'&&!DUEL){closeModal();beginGuestDuel(c,x.v)}});
  DQ.state='playing';duelQueueRender();
  duelQueueWrite('playing',r).catch(e=>{console.error(e);toast('Le duel démarre, mais le statut de file n’a pas pu être actualisé : '+e.message)});
  c.send({t:'acc',name:S.name,av:S.av||'',deck:deckKeys(d.cards),duelQueue:1,duelQueueId:DQ.qid,duelOpponentQueueId:r.qid,ver:APPV});
  modal(h('div',{style:'text-align:center'},h('h2',null,'Match trouvé'),h('p',{class:'mut'},'Le duel contre '+nm+' démarre…')),{sticky:true})}
function duelQueueFinished(){
  if(!DQ.active)return;
  duelQueueRelease('')}
