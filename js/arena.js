// ============ ARÈNE : draft de 30 cartes (1 parmi 3), duels contre l’IA ou matchmaking ============
// Entrée : 100 💎. Chaque choix propose 3 cartes de la même rareté, tirées avec les mêmes chances pour tout le monde
// (indépendamment de la collection) ; la graine est fixée à l'entrée : recharger la page ne relance pas les choix.
// Les limites d'exemplaires ne comptent pas. À chaque défaite non éliminatoire, cinq cartes du deck peuvent être remplacées.
const ARENA={cost:100,picks:30,redraft:5,maxW:9,maxL:3,rw:[40,65,95,135,185,250,335,445,580,750],odds:[0,69.5,24,6.5]};
const ARENA_LB={week:'',rows:null,at:0,loading:false,error:'',backfill:false};
function arenaWeekKey(now=new Date()){const d=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()));d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return d.toISOString().slice(0,10)}
function arenaWeekLabel(key){const start=new Date(key+'T00:00:00Z'),end=new Date(start);end.setUTCDate(end.getUTCDate()+6);
  const fmt=new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'short',timeZone:'UTC'});return fmt.format(start)+' – '+fmt.format(end)}
function arenaLeaderboardUrl(week){return'https://firestore.googleapis.com/v1/projects/'+encodeURIComponent(CLOUD.projectId)+'/databases/(default)/documents/arenaWeeks/'+encodeURIComponent(week)}
function arenaLeaderboardDoc(row){const f=row.document.fields||{},v=k=>f[k]&&(f[k].stringValue||f[k].integerValue)||'';
  const ai=+v('winsAI')||0,human=+v('winsHuman')||0,total=Number(v('total'));return{uid:String(v('uid')),pseudo:String(v('pseudo')||'Joueur').slice(0,18),
    ai,human,total:Number.isFinite(total)?total:ai+human,runs:+v('runs')||((ai+human)>0?1:0)}}
function arenaLeaderboardRender(){
  const el=$('#arenaLeaderboard');if(!el)return;
  const title='Classement · '+arenaWeekLabel(ARENA_LB.week),refresh=h('button',{class:'btn sm',onclick:()=>arenaLeaderboardLoad(true)},'Actualiser');
  const rows=ARENA_LB.rows;
  el.replaceChildren(h('div',{class:'albh'},h('h3',null,title),refresh),
    ARENA_LB.loading?h('p',{class:'sm mut'},'Chargement du classement…'):
    ARENA_LB.error?h('div',{class:'sm'},h('p',{class:'lb-error'},'Classement indisponible : '+ARENA_LB.error),h('button',{class:'btn sm',onclick:()=>arenaLeaderboardLoad(true)},'Réessayer')):
    !rows||!rows.length?h('p',{class:'sm mut'},'Aucune course enregistrée cette semaine. Connecte-toi à un compte en ligne pour apparaître dans le classement.'):
    h('div',{class:'alblist'},rows.map((r,i)=>h('div',{class:'alborrow'},
      h('b',{class:'albrank'},String(i+1)),h('b',{class:'albpseudo'},r.pseudo),h('b',{class:'albtot'},r.total+' V'),
      h('span',{class:'albsplit'},'Courses '+r.runs+' · IA '+r.ai+' · Joueurs '+r.human)))));
}
async function arenaLeaderboardLoad(force){
  const week=arenaWeekKey();
  if(ARENA_LB.week!==week){Object.assign(ARENA_LB,{week,rows:null,at:0,error:''})}
  if(!cloudOn()){ARENA_LB.error='Le classement nécessite la configuration Firebase.';arenaLeaderboardRender();return}
  if(ARENA_LB.loading)return;
  if(!force&&ARENA_LB.rows&&Date.now()-ARENA_LB.at<60000){arenaLeaderboardRender();return}
  ARENA_LB.loading=true;ARENA_LB.error='';arenaLeaderboardRender();
  try{
    const headers={'Content-Type':'application/json'};if(ACC)headers.Authorization='Bearer '+await accTok();
    const url=arenaLeaderboardUrl(week)+':runQuery?key='+encodeURIComponent(CLOUD.apiKey),rows=await accFetch(url,{method:'POST',headers,
      body:JSON.stringify({structuredQuery:{from:[{collectionId:'players'}],orderBy:[{field:{fieldPath:'total'},direction:'DESCENDING'}],limit:10}})});
    if(ARENA_LB.week!==week)return;
    ARENA_LB.rows=rows.filter(x=>x.document).map(arenaLeaderboardDoc).filter(x=>x.runs>0)
      .sort((a,b)=>b.total-a.total||b.runs-a.runs||b.human-a.human||a.pseudo.localeCompare(b.pseudo)).slice(0,10);
    ARENA_LB.at=Date.now();
  }catch(e){console.error(e);if(ARENA_LB.week===week)ARENA_LB.error=e.message==='Serveur injoignable (connexion internet ?).'
    ?'Impossible de joindre Firestore depuis cette page. Vérifie les règles du classement et teste depuis GitHub Pages, pas depuis un fichier local.'
    :e.message}
  finally{ARENA_LB.loading=false;if(ARENA_LB.week===week)arenaLeaderboardRender()}
}
function arenaLeaderboardPanel(){const panel=h('div',{class:'panel arena-lb',id:'arenaLeaderboard'});
  Promise.resolve().then(()=>arenaLeaderboardLoad(false));return panel}
function arenaLeaderboardBackfillLast(){
  const last=S.arena&&S.arena.last;
  if(ARENA_LB.backfill||!last||last.lb||last.w!==0||last.l<1||arenaWeekKey(new Date(last.t))!==arenaWeekKey()||!ACC||!cloudOn())return;
  ARENA_LB.backfill=true;
  arenaRegisterRun(last.t).finally(()=>{ARENA_LB.backfill=false});
}
async function arenaWeeklyUpdate(kind,mode,runT){
  if(!ACC||!cloudOn()){toast(kind==='run'?'Course non inscrite au classement : connecte-toi à un compte en ligne.':'Victoire non inscrite au classement : connecte-toi à un compte en ligne.');return false}
  try{
    const week=arenaWeekKey(),uid=ACC.uid,pseudo=String(S.name||ACC.id||'Joueur').trim().slice(0,18)||'Joueur',tok=await accTok(),
      docUrl=arenaLeaderboardUrl(week)+'/players/'+encodeURIComponent(uid),
      docName='projects/'+encodeURIComponent(CLOUD.projectId)+'/databases/(default)/documents/arenaWeeks/'+week+'/players/'+uid,
      url='https://firestore.googleapis.com/v1/projects/'+encodeURIComponent(CLOUD.projectId)+'/databases/(default)/documents:commit?key='+encodeURIComponent(CLOUD.apiKey),
      transforms=kind==='run'?[{fieldPath:'runs',increment:{integerValue:'1'}}]:
        [{fieldPath:'total',increment:{integerValue:'1'}},{fieldPath:mode==='ai'?'winsAI':'winsHuman',increment:{integerValue:'1'}}];
    let saved=false;
    for(let attempt=0;attempt<2&&!saved;attempt++){
      let exists=true,r,stored=null;
      try{r=await fetch(docUrl,{headers:{Authorization:'Bearer '+tok}})}catch(e){throw new Error(accErr(''))}
      if(r.status===404)exists=false;
      else if(!r.ok){const j=await r.json().catch(()=>({})),e=j.error||{};throw new Error(accErr(e.status||e.message))}
      else stored=await r.json().catch(()=>null);
      const fields={uid:{stringValue:uid},pseudo:{stringValue:pseudo}},fieldPaths=['uid','pseudo'];
      if(!exists){fields.total={integerValue:'0'};fields.winsAI={integerValue:'0'};fields.winsHuman={integerValue:'0'};fields.runs={integerValue:kind==='run'?'1':'0'};
        fieldPaths.push('total','winsAI','winsHuman','runs')}
      else for(const k of(kind==='run'?['total','winsAI','winsHuman']:['total','winsAI','winsHuman','runs']))if(!stored||!stored.fields||!stored.fields[k]){
        fields[k]={integerValue:'0'};fieldPaths.push(k)}
      const writeTransforms=!exists&&kind==='run'?[]:transforms;
      try{
        await accFetch(url,{method:'POST',headers:{Authorization:'Bearer '+tok,'Content-Type':'application/json'},
          body:JSON.stringify({writes:[{update:{name:docName,fields},updateMask:{fieldPaths},updateTransforms:writeTransforms,
            currentDocument:{exists}}]})});
        saved=true;
      }catch(e){if(attempt||!String(e.message).includes('FAILED_PRECONDITION'))throw e}
    }
    if(!saved)throw new Error('Impossible de mettre à jour le classement après une mise à jour concurrente.');
    if(kind==='run'){
      if(S.arena.run&&S.arena.run.t===runT)S.arena.run.lb=true;
      if(S.arena.last&&S.arena.last.t===runT)S.arena.last.lb=true;
      saveS();
    }
    ARENA_LB.week=week;ARENA_LB.rows=null;ARENA_LB.at=0;
    if($('#arenaLeaderboard'))arenaLeaderboardLoad(true);
    return true;
  }catch(e){console.error(e);toast((kind==='run'?'Course':'Victoire')+' non inscrite au classement hebdomadaire : '+e.message);return false}
}
function arenaWeeklyRun(t){return arenaWeeklyUpdate('run',null,t)}
function arenaWeeklyRecord(mode){return arenaWeeklyUpdate('win',mode)}

// ---------- anti-triche : Cloud Function « arena » (facultative mais recommandée) ----------
// Quand elle est déployée (et les règles Firestore durcies), seule cette fonction écrit les compteurs du
// classement : le client lui demande d'ouvrir une course, délivre un billet horodaté au début de chaque match,
// puis lui déclare le résultat. Tant qu'elle ne répond pas, on retombe sur l'écriture directe (ancien mode).
const ARENA_FN={state:'?'};                                     // '?' inconnu · 'on' opérationnelle · 'off' absente
function arenaFnUrl(){return(typeof CLOUD!=='undefined'&&CLOUD&&CLOUD.arenaFn)||''}
async function arenaFnCall(op,body){
  const url=arenaFnUrl();if(!url||ARENA_FN.state==='off')return null;
  if(!ACC||!cloudOn())return null;
  let tok;try{tok=await accTok()}catch(e){return null}
  let r;try{r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+tok},
    body:JSON.stringify(Object.assign({op,ver:APPV},body||{}))})}
  catch(e){console.warn('Arène : fonction serveur injoignable ('+e.message+').');return null}
  if(r.status===404||r.status===501){ARENA_FN.state='off';console.warn('Arène : fonction serveur non déployée ('+r.status+') — écriture directe utilisée.');return null}
  const j=await r.json().catch(()=>({}));
  if(!r.ok||j.ok===false){const msg=j.err||('erreur '+r.status);console.warn('Arène : '+op+' refusé par le serveur : '+msg);return{refused:msg}}
  ARENA_FN.state='on';return j;
}
function arenaLbDirty(t){                                       // le classement a bougé : on relit la semaine
  if(S.arena){if(t&&S.arena.run&&S.arena.run.t===t)S.arena.run.lb=true;if(t&&S.arena.last&&S.arena.last.t===t)S.arena.last.lb=true;saveS()}
  ARENA_LB.week=arenaWeekKey();ARENA_LB.rows=null;ARENA_LB.at=0;
  if($('#arenaLeaderboard'))arenaLeaderboardLoad(true);
}
function arenaPseudo(){return String(S.name||(ACC&&ACC.id)||'Joueur').trim().slice(0,18)||'Joueur'}
async function arenaRegisterRun(t){                             // ouverture de course
  const j=await arenaFnCall('run',{pseudo:arenaPseudo()});
  if(j&&!j.refused){arenaLbDirty(t);return true}
  if(j&&j.refused){toast('Course non inscrite au classement : '+j.refused);return false}
  return arenaWeeklyRun(t);                                     // fonction absente : ancien mode
}
async function arenaRegisterResult(res,mode,opp,tk){            // résultat d'un match d'Arène
  const j=await arenaFnCall(res?'win':'loss',res?{ticket:tk,opp}:{opp});
  if(j&&!j.refused){if(res)arenaLbDirty();return true}
  if(j&&j.refused){if(res)toast('Victoire non inscrite au classement : '+j.refused);return false}
  return res?arenaWeeklyRecord(mode):false;                     // fonction absente : ancien mode (défaite : rien à inscrire)
}
function arenaServerMatch(mode){                                // billet horodaté délivré au début d'un match
  return arenaFnCall('match',{mode:mode==='ai'?'ai':'human'}).then(j=>j&&!j.refused&&j.ticket?j.ticket:null,()=>null);
}
function arenaServerEnd(){return arenaFnCall('end',{}).then(()=>true,()=>false)}   // fin ou abandon de course
function arenaRng(seed){let t=seed>>>0;return()=>{t=(t+0x6D2B79F5)|0;let r=Math.imul(t^t>>>15,t|1);r^=r+Math.imul(r^r>>>7,r|61);return((r^r>>>14)>>>0)/4294967296}}
function arenaSeed(){const b=new Uint32Array(1);try{crypto.getRandomValues(b)}catch(e){b[0]=(Math.random()*4294967296)>>>0}return b[0]>>>0}
// choix n° n (0 à 29) d'une course : {r: rareté, c: [3 cartes différentes]} ; le 1er choix est toujours un choix de légendaires
function arenaOffer(seed,n){const R=arenaRng((seed^Math.imul(n+1,0x9E3779B1))>>>0);let r=3;
  if(n>0){const x=R()*100;r=x<ARENA.odds[3]?3:x<ARENA.odds[3]+ARENA.odds[2]?2:1}
  const pool=POOL.filter(k=>CARDS[k].r===r),c=[];
  while(c.length<3&&c.length<pool.length){const k=pool[Math.floor(R()*pool.length)];if(c.indexOf(k)<0)c.push(k)}
  return{r,c}}
// sauvegarde : S.arena = {run, runs, best, last} ; run = {seed, picks, w, l, t, log, cur} (cur = partie commencée, pas encore finie)
function arenaFix(a){a=a&&typeof a==='object'?a:{};const r=a.run;let run=null;
  if(r&&typeof r==='object'&&Number.isFinite(+r.seed)){
    const picks=(Array.isArray(r.picks)?r.picks:[]).filter(k=>CARDS[k]&&POOL.indexOf(k)>=0).slice(0,ARENA.picks),sw=r.swap;
    let swap=null;
    if(sw&&typeof sw==='object'){
      if(sw.stage==='draft'&&picks.length===ARENA.picks){
        const replacements=(Array.isArray(sw.replacements)?sw.replacements:[]).filter(k=>CARDS[k]&&POOL.indexOf(k)>=0).slice(0,ARENA.redraft);
        swap={stage:'draft',drafted:Math.min(replacements.length,Math.max(0,sw.drafted|0)),replacements:replacements.slice(0,Math.min(replacements.length,Math.max(0,sw.drafted|0)))}
      }else if(sw.stage==='remove'&&picks.length===ARENA.picks){
        const replacements=(Array.isArray(sw.replacements)?sw.replacements:[]).filter(k=>CARDS[k]&&POOL.indexOf(k)>=0).slice(0,ARENA.redraft);
        if(replacements.length===ARENA.redraft){
          const removed=(Array.isArray(sw.removed)?sw.removed:[]).filter((i,j,a)=>Number.isInteger(i)&&i>=0&&i<picks.length&&a.indexOf(i)===j).slice(0,ARENA.redraft);
          swap={stage:'remove',replacements,removed}
        }else swap={stage:'draft',drafted:0,replacements:[]}
      }else if((sw.stage==='pick'||sw.stage==='legacyPick')&&picks.length===ARENA.picks-ARENA.redraft+Math.min(ARENA.redraft,Math.max(0,sw.drafted|0))){
        swap={stage:'legacyPick',drafted:Math.min(ARENA.redraft,Math.max(0,sw.drafted|0))}
      }else if(sw.stage==='remove'&&picks.length===ARENA.picks-ARENA.redraft+Math.min(ARENA.redraft,Math.max(0,sw.drafted|0))){
        swap={stage:'legacyPick',drafted:Math.min(ARENA.redraft,Math.max(0,sw.drafted|0))}
      }}
    run={seed:(+r.seed)>>>0,picks,swap,lb:!!r.lb,
      w:Math.min(ARENA.maxW,Math.max(0,r.w|0)),l:Math.min(ARENA.maxL,Math.max(0,r.l|0)),t:+r.t||Date.now(),log:(Array.isArray(r.log)?r.log:[]).slice(-20),
      cur:r.cur&&typeof r.cur==='object'?{o:String(r.cur.o||'').slice(0,18),t:+r.cur.t||0,mode:r.cur.mode==='ai'?'ai':'human',tk:String(r.cur.tk||'').slice(0,64)}:null}}
  return{run,runs:Math.max(0,a.runs|0),best:Math.max(0,a.best|0),last:a.last&&typeof a.last==='object'?{w:a.last.w|0,l:a.last.l|0,g:a.last.g|0,t:+a.last.t||0,lb:!!a.last.lb}:null}}
function arenaReady(){const r=S.arena&&S.arena.run;return!!(r&&!r.swap&&r.picks.length>=ARENA.picks)}
function arenaEnter(){if(S.arena.run)return'Tu as déjà une course en cours.';if(S.gems<ARENA.cost)return'Il te faut '+ARENA.cost+' 💎 pour entrer.';
  S.gems-=ARENA.cost;const t=Date.now();S.arena.run={seed:arenaSeed(),picks:[],w:0,l:0,t,lb:false,log:[],cur:null};saveS();arenaRegisterRun(t);return null}
function arenaPick(i){const r=S.arena.run;if(!r||r.swap&&r.swap.stage!=='draft'&&r.swap.stage!=='legacyPick'||!r.swap&&r.picks.length>=ARENA.picks)return null;
  const n=r.swap?r.swap.drafted+1:r.picks.length,o=arenaOffer(r.seed,n),k=o.c[i];if(!k)return null;
  if(r.swap&&r.swap.stage==='draft'){
    r.swap.replacements.push(k);
    if(++r.swap.drafted>=ARENA.redraft){r.swap.stage='remove';r.swap.removed=[]}
  }else{r.picks.push(k);if(r.swap&&++r.swap.drafted>=ARENA.redraft)r.swap=null}
  saveS();return k}
function arenaToggleRemoval(i){
  const r=S.arena.run;if(!r||!r.swap||r.swap.stage!=='remove'||!Number.isInteger(i)||i<0||i>=r.picks.length)return false;
  const a=r.swap.removed,j=a.indexOf(i);if(j>=0)a.splice(j,1);else if(a.length<ARENA.redraft)a.push(i);saveS();return true}
function arenaApplyRemoval(){
  const r=S.arena.run;if(!r||!r.swap||r.swap.stage!=='remove'||r.swap.removed.length!==ARENA.redraft||r.swap.replacements.length!==ARENA.redraft)return false;
  const replacements=r.swap.replacements,removed=r.swap.removed.slice().sort((a,b)=>a-b);let next=0;
  r.picks=r.picks.map((k,i)=>i===removed[next]?replacements[next++]:k);r.swap=null;saveS();return true}
function arenaStart(opp,mode){const r=S.arena.run;if(!r)return;
  const cur={o:String(opp||'').slice(0,18),t:Date.now(),mode:mode==='ai'?'ai':'human',tk:''};r.cur=cur;saveS();
  arenaServerMatch(cur.mode).then(tk=>{if(tk&&S.arena.run===r&&r.cur===cur){cur.tk=tk;saveS()}})}
// résultat d'une partie : 1 victoire, 0 défaite, -1 égalité (ne compte pas)
function arenaRecord(res,opp){const r=S.arena.run;if(!r)return null;const cur=r.cur,mode=cur&&cur.mode==='ai'?'ai':'human',tk=cur&&cur.tk||'';r.cur=null;
  if(res>=0){if(res){r.w++}else{r.l++}arenaRegisterResult(res?1:0,mode,opp,tk);r.log.push({o:String(opp||'?').slice(0,18),w:res?1:0,t:Date.now(),mode})}
  const out={w:r.w,l:r.l,over:false,g:0,redraft:false};
  if(r.w>=ARENA.maxW||r.l>=ARENA.maxL)return Object.assign(out,arenaFinish());
  if(res===0){r.seed=arenaSeed();r.swap={stage:'draft',drafted:0,replacements:[]};out.redraft=true}
  saveS();return out}
function arenaFinish(){const r=S.arena.run;if(!r)return{over:true,g:0};const g=ARENA.rw[Math.min(r.w,ARENA.maxW)];S.gems+=g;
  S.arena.last={w:r.w,l:r.l,g,t:Date.now(),lb:!!r.lb};S.arena.runs++;S.arena.best=Math.max(S.arena.best,r.w);S.arena.run=null;saveS();arenaServerEnd();return{over:true,g}}
// partie d'Arène interrompue (jeu fermé ou connexion coupée avant la fin) : comptée comme une défaite
function arenaCheckStale(){const r=S.arena&&S.arena.run;if(!r||!r.cur||(typeof DUEL!=='undefined'&&DUEL))return null;const res=arenaRecord(0,r.cur.o);
  if(typeof toast==='function')toast('Partie d’Arène interrompue : comptée comme une défaite.');return res}
const ARENA_QUEUE_MS=300000,ARENA_QUEUE_POLL=2500;
const AQ={active:false,state:'',qid:'',created:0,expires:0,tier:0,peer:null,busy:false,started:false,skip:[],poll:0,tick:0,cleanup:null};
function arenaQueueUrl(uid){return'https://firestore.googleapis.com/v1/projects/'+encodeURIComponent(CLOUD.projectId)+'/databases/(default)/documents/arenaQueue/'+encodeURIComponent(uid)}
function arenaQueueFields(q){return{qid:{stringValue:q.qid},pseudo:{stringValue:q.pseudo},code:{stringValue:q.code},status:{stringValue:q.status},
  tier:{integerValue:String(q.tier)},created:{integerValue:String(q.created)},expires:{integerValue:String(q.expires)},
  opponentUid:{stringValue:q.opponentUid||''},opponentQueueId:{stringValue:q.opponentQueueId||''},
  opponentCode:{stringValue:q.opponentCode||''},opponentName:{stringValue:q.opponentName||''}}}
function arenaQueueDocData(d){const f=d.fields||{},v=(k)=>f[k]&&(f[k].stringValue||f[k].integerValue)||'';
  return{uid:d.name.split('/').pop(),qid:String(v('qid')),pseudo:String(v('pseudo')),code:String(v('code')),status:String(v('status')),
    tier:+v('tier')||1,created:+v('created')||0,expires:+v('expires')||0,opponentUid:String(v('opponentUid')),
    opponentQueueId:String(v('opponentQueueId')),opponentCode:String(v('opponentCode')),opponentName:String(v('opponentName'))}}
async function arenaQueueWrite(status,peer){
  const q={qid:AQ.qid,pseudo:String(S.name||'Joueur').slice(0,18),code:S.code,status,tier:AQ.tier,created:AQ.created,expires:AQ.expires,
    opponentUid:peer&&peer.uid,opponentQueueId:peer&&peer.qid,opponentCode:peer&&peer.code,opponentName:peer&&peer.pseudo};
  const tok=await accTok();return accFetch(arenaQueueUrl(AQ.uid),{method:'PATCH',headers:{Authorization:'Bearer '+tok,'Content-Type':'application/json'},
    body:JSON.stringify({fields:arenaQueueFields(q)})})}
async function arenaQueueDelete(uid){
  if(!ACC||!cloudOn())return;
  const tok=await accTok(),url=arenaQueueUrl(uid||AQ.uid);let r;
  try{r=await fetch(url,{method:'DELETE',headers:{Authorization:'Bearer '+tok}})}catch(e){throw new Error(accErr(''))}
  if(!r.ok&&r.status!==404){const j=await r.json().catch(()=>({})),e=j.error||{};throw new Error(accErr(e.status||e.message))}}
async function arenaQueueReadAll(){
  const tok=await accTok(),url='https://firestore.googleapis.com/v1/projects/'+encodeURIComponent(CLOUD.projectId)+'/databases/(default)/documents:runQuery',
    rows=await accFetch(url,{method:'POST',headers:{Authorization:'Bearer '+tok,'Content-Type':'application/json'},
      body:JSON.stringify({structuredQuery:{from:[{collectionId:'arenaQueue'}],limit:100}})});
  return rows.filter(x=>x.document).map(x=>arenaQueueDocData(x.document))}
function arenaQueueRender(){
  const box=$('#arenaQueueStatus'),cancel=$('#arenaQueueCancel'),join=$('#arenaQueueJoin');if(!box)return;
  box.hidden=!AQ.state;box.className='arena-qstatus'+(AQ.state==='expired'||AQ.state==='error'?' expired':'');
  const remain=Math.max(0,AQ.expires-Date.now()),mm=Math.floor(remain/60000),ss=String(Math.ceil(remain%60000/1000)).padStart(2,'0');
  box.textContent=AQ.state==='searching'?'Recherche d’un adversaire humain · '+mm+':'+ss+' restantes.':
    AQ.state==='paired'?'Adversaire trouvé · établissement de la connexion…':
    AQ.state==='connecting'?'Match trouvé · connexion à '+(AQ.peer&&AQ.peer.pseudo||'ton adversaire')+'…':
    AQ.state==='playing'?'Match d’Arène trouvé · bon duel !':
    AQ.state==='expired'?'File expirée après 5 minutes. Tu peux relancer la recherche.':
    AQ.state==='error'?AQ.error||'La recherche a échoué. Réessaie.':'';
  if(join){join.disabled=AQ.active;join.textContent=AQ.active?'Recherche en cours…':AQ.state==='expired'||AQ.state==='error'?'Relancer la recherche':'Chercher un joueur humain'}
  if(cancel)cancel.hidden=!AQ.active}
function arenaQueueClearTimers(){clearInterval(AQ.poll);clearInterval(AQ.tick);AQ.poll=0;AQ.tick=0}
function arenaQueueWatch(){
  if(!AQ.active)return;
  if(!AQ.tick)AQ.tick=setInterval(()=>{if(Date.now()>=AQ.expires)arenaQueueTimeout();else arenaQueueRender()},1000);
  if(!AQ.poll)AQ.poll=setInterval(arenaQueuePoll,ARENA_QUEUE_POLL)}
function arenaQueueRelease(reason){
  const uid=AQ.uid;arenaQueueClearTimers();AQ.active=false;AQ.busy=false;AQ.started=false;AQ.peer=null;
  AQ.state=reason||'';if(uid&&ACC&&cloudOn())AQ.cleanup=arenaQueueDelete(uid).catch(e=>{console.error(e);if(reason!=='expired')toast('Impossible de nettoyer la file d’Arène : '+e.message)}).finally(()=>{AQ.cleanup=null});
  arenaQueueRender()}
async function arenaQueueTimeout(){
  if(!AQ.active)return;
  const uid=AQ.uid;arenaQueueClearTimers();AQ.active=false;AQ.busy=false;AQ.started=false;AQ.peer=null;AQ.state='expired';
  AQ.cleanup=arenaQueueDelete(uid);try{await AQ.cleanup}catch(e){console.error(e);toast('La recherche a expiré, mais le nettoyage a échoué : '+e.message)}
  finally{AQ.cleanup=null}
  arenaQueueRender()}
function arenaQueueCancel(){if(!AQ.active)return;arenaQueueRelease('');toast('Recherche d’Arène annulée.')}
function arenaQueueStart(){
  if(!arenaReady()){toast('Termine ton draft ou ton remplacement avant de chercher un adversaire.');return}
  if(!cloudOn()||!ACC){toast('La file mondiale nécessite un compte Firebase connecté. Les comptes locaux ne peuvent pas y accéder.');return}
  if(!netReady()){toast('Connexion au serveur de rencontre en cours… réessaie dans un instant.');return}
  if(AQ.active)return;
  if(AQ.cleanup){AQ.cleanup.then(arenaQueueStart);return}
  const now=Date.now();Object.assign(AQ,{active:true,state:'searching',uid:ACC.uid,qid:arenaSeed().toString(36),created:now,expires:now+ARENA_QUEUE_MS,
    tier:Math.min(ARENA.maxW,S.arena.run.w+1),peer:null,busy:false,started:false,skip:[]});
  go('arena');arenaQueueRender();
  arenaQueueWrite('searching').then(()=>{if(!AQ.active)return;arenaQueueWatch();arenaQueuePoll()})
    .catch(e=>{console.error(e);AQ.active=false;AQ.state='error';AQ.error='Échec de connexion à la file Firestore : '+e.message;arenaQueueRender();toast(AQ.error)})}
async function arenaQueuePoll(){
  if(!AQ.active||AQ.busy||!ACC||ACC.uid!==AQ.uid)return;
  if(Date.now()>=AQ.expires){arenaQueueTimeout();return}
  AQ.busy=true;
  try{
    const all=await arenaQueueReadAll();if(!AQ.active)return;
    const now=Date.now(),mine=all.find(x=>x.uid===AQ.uid&&x.qid===AQ.qid);
    if(!mine){await arenaQueueWrite('searching');AQ.state='searching';AQ.peer=null;arenaQueueRender();return}
    const peers=all.filter(x=>x.uid!==AQ.uid&&x.expires>now);
    if(mine.status==='paired'&&mine.opponentUid){
      const peer=peers.find(x=>x.uid===mine.opponentUid&&x.qid===mine.opponentQueueId&&x.status==='paired'&&x.opponentUid===AQ.uid&&x.opponentQueueId===AQ.qid);
      if(peer){AQ.peer=peer;AQ.state='paired';arenaQueueRender();if(AQ.uid.localeCompare(peer.uid)<0)arenaQueueConnect(peer);return}
      const pending=peers.find(x=>x.uid===mine.opponentUid&&x.qid===mine.opponentQueueId);
      if(!pending||pending.status==='searching'){AQ.peer=null;AQ.state='searching';await arenaQueueWrite('searching');arenaQueueWatch();arenaQueueRender();return}
      AQ.state='paired';arenaQueueRender();return}
    const proposal=peers.filter(x=>x.status==='paired'&&x.opponentUid===AQ.uid&&x.opponentQueueId===AQ.qid&&x.uid.localeCompare(AQ.uid)<0)
      .sort((a,b)=>a.created-b.created||a.uid.localeCompare(b.uid))[0];
    if(proposal&&mine.status==='searching'){
      await arenaQueueWrite('paired',proposal);if(!AQ.active)return;
      AQ.peer=proposal;AQ.state='paired';arenaQueueRender();return}
    if(mine.status==='searching'){
      const candidate=peers.filter(x=>x.status==='searching'&&x.uid.localeCompare(AQ.uid)>0&&!AQ.skip.includes(x.uid))
        .sort((a,b)=>Math.abs(a.tier-AQ.tier)-Math.abs(b.tier-AQ.tier)||a.created-b.created||a.uid.localeCompare(b.uid))[0];
      if(candidate){await arenaQueueWrite('paired',candidate);if(!AQ.active)return;
        AQ.peer=candidate;AQ.state='paired';arenaQueueRender()}}
  }catch(e){console.error(e);if(AQ.active){AQ.error='File Firestore indisponible : '+e.message;AQ.state='error';arenaQueueRender();arenaQueueRelease('error');AQ.error='File Firestore indisponible : '+e.message;arenaQueueRender()}}
  finally{AQ.busy=false}}
function arenaQueueConnect(peer){
  if(!AQ.active||AQ.started||Date.now()>=AQ.expires)return;
  AQ.started=true;AQ.peer=peer;AQ.state='connecting';arenaQueueRender();
  const opt=Object.assign(arenaOpt(),{arenaQueue:1,arenaQueueId:AQ.qid,arenaOpponentQueueId:peer.qid});
  sendChallenge({code:peer.code,name:peer.pseudo},null,opt,{fail:async m=>{
    AQ.started=false;if(!AQ.active)return;
    AQ.skip.push(peer.uid);AQ.peer=null;AQ.state='searching';
    try{await arenaQueueWrite('searching');arenaQueueWatch();toast(m+' Recherche d’un autre adversaire…')}catch(e){AQ.error='Impossible de reprendre la file : '+e.message;AQ.state='error';arenaQueueRelease('error');AQ.error='Impossible de reprendre la file : '+e.message;toast(AQ.error)}
    arenaQueueRender()},
    accepted:(c,m)=>{
      if(!AQ.active||!m.arenaQueue||m.arenaQueueId!==peer.qid||m.arenaOpponentQueueId!==AQ.qid){try{c.send({t:'dec'})}catch(e){}try{c.close()}catch(e){}AQ.started=false;return}
      arenaQueueClearTimers();arenaStart(peer.pseudo,'human');
      AQ.state='playing';arenaQueueRender();arenaQueueWrite('playing',peer).catch(e=>{console.error(e);toast('Le duel démarre, mais le statut de file n’a pas pu être actualisé : '+e.message)});
      startHostDuel(c,m,null,opt)}})}
function onArenaQueueChallenge(c,m,nm,close){
  const r=AQ.peer,valid=AQ.active&&r&&AQ.qid===m.o.arenaOpponentQueueId&&r.qid===m.o.arenaQueueId&&r.code===m.code;
  if(!valid||!arenaReady()||DUEL){try{c.send({t:'dec',why:'arena'})}catch(e){}close();setTimeout(()=>{try{c.close()}catch(e){}},300);return}
  close();arenaQueueClearTimers();c.on('data',x=>{if(x&&x.t==='st'&&!DUEL){closeModal();beginGuestDuel(c,x.v)}});
  arenaStart(nm,'human');AQ.state='playing';arenaQueueRender();
  arenaQueueWrite('playing',r).catch(e=>{console.error(e);toast('Le duel démarre, mais le statut de file n’a pas pu être actualisé : '+e.message)});
  c.send({t:'acc',name:S.name,deck:S.arena.run.picks.slice(),arena:1,arenaQueue:1,arenaQueueId:AQ.qid,arenaOpponentQueueId:r.qid,ver:APPV});
  modal(h('div',{style:'text-align:center'},h('h2',null,'Match d’Arène trouvé'),h('p',{class:'mut'},'Le duel contre '+nm+' démarre…')),{sticky:true})}
function arenaQueueFinished(){
  if(!AQ.active)return;
  arenaQueueRelease('');}
function arenaAIDeck(tier,seed){
  // l'IA joue au maximum de sa force dès le palier 1 : toutes les raretés sont disponibles,
  // quel que soit le palier (le palier ne sert plus qu'à nommer l'adversaire).
  const coll={};
  POOL.forEach(k=>{coll[k]={n:CARDS[k].r===3?1:2,p:0}});
  const ai=bestAIDeckFast(coll,seed,arenaOpt());
  return{deck:ai.cards,arch:ai.arch}
}
function startArenaAIDuel(){
  if(AQ.active){toast('Annule la recherche de joueur avant de lancer un duel contre l’IA.');return}
  if(!arenaReady()){toast('Termine d’abord ton draft.');return}
  const r=S.arena.run,tier=Math.min(ARENA.maxW,r.w+1),opp='IA du palier '+tier,
    ai=arenaAIDeck(tier,r.seed^Math.imul(r.w+1,0x9E3779B1)),o=arenaOpt();
  if(ai.deck.length!==ARENA.picks){toast('Impossible de préparer le deck de l’IA pour ce palier. Réessaie.');return}
  arenaStart(opp,'ai');
  const G=newGame({names:[S.name||'Moi',opp],decks:[r.picks.slice(),ai.deck],seed:arenaSeed(),o,mull:true});
  const Hh=HostGame(G,[{kind:'me'},{kind:'ai',W:WGT[ARCH[ai.arch].w],strong:1}],v=>applyView(v));
  newDuelState({mode:'arena-ai',host:Hh,ctl:{act:a=>Hh.act(0,a),resign:()=>Hh.resign(0),close:()=>Hh.close()}});
  mountDuel();Hh.start()}

// ---------- interface ----------
function apn(el,...k){el.append(...k.flat(9).filter(x=>x!=null&&x!==false));return el}   // comme append, sans les éléments absents
function arenaPips(w,l){return h('div',{class:'apips'},
  h('span',{class:'aw',title:w+' victoire'+(w>1?'s':'')+' sur '+ARENA.maxW},Array.from({length:ARENA.maxW},(_,i)=>h('i',{class:i<w?'on':''},'⚔'))),
  h('span',{class:'al',title:l+' défaite'+(l>1?'s':'')+' sur '+ARENA.maxL},Array.from({length:ARENA.maxL},(_,i)=>h('i',{class:i<l?'on':''},'✕'))))}
function arenaRewards(w){return h('div',{class:'arw'},ARENA.rw.map((g,i)=>h('div',{class:'arwc'+(w===i?' cur':'')},h('b',null,i+' V'),h('span',null,g+' 💎'))))}
function arenaDeckList(picks,removed,onRemove){if(onRemove)return h('div',{class:'adeck'},picks.map((k,i)=>h('div',{class:'arow r'+CARDS[k].r+(removed.indexOf(i)>=0?' selected':''),onclick:()=>onRemove(i),oncontextmenu:e=>{e.preventDefault();showCard(k)}},
    h('b',{class:'acost'},String(CARDS[k].c)),h('span',{class:'aav'},miniAv(k)),h('span',{class:'anm'},fullName(k)),h('em',null,removed.indexOf(i)>=0?'À remplacer':'Garder'))));
  const c={};picks.forEach(k=>c[k]=(c[k]||0)+1);
  const ks=Object.keys(c).sort((a,b)=>CARDS[a].c-CARDS[b].c||CARDS[b].r-CARDS[a].r||fullName(a).localeCompare(fullName(b)));
  return h('div',{class:'adeck'},ks.map(k=>h('div',{class:'arow r'+CARDS[k].r,onclick:()=>showCard(k),oncontextmenu:e=>{e.preventDefault();showCard(k)}},
    h('b',{class:'acost'},String(CARDS[k].c)),h('span',{class:'aav'},miniAv(k)),h('span',{class:'anm'},fullName(k)),c[k]>1?h('em',null,'×'+c[k]):null)))}
function vArena(v){
  arenaCheckStale();arenaLeaderboardBackfillLast();const A=S.arena,r=A.run;
  const rules=h('div',{class:'sm mut',style:'line-height:1.55'},
    'Entrée : ',h('b',null,ARENA.cost+' 💎'),'. Tu construis un deck de ',h('b',null,'30 cartes'),' en ',h('b',null,'30 choix'),' : à chaque fois, garde 1 carte parmi 3 de la même rareté. ',
    'Les limites d’exemplaires ne comptent pas. Ensuite, affronte l’IA ou cherche un joueur avec le matchmaking : l’IA joue son meilleur deck possible (toutes raretés) dès le premier palier. La course s’arrête à ',h('b',null,ARENA.maxW+' victoires'),' ou ',h('b',null,ARENA.maxL+' défaites'),'. Après une défaite non éliminatoire, garde ton deck : choisis d’abord ',h('b',null,ARENA.redraft+' remplaçantes'),' (1 parmi 3 pour chacune), puis sélectionne les cartes qu’elles remplaceront.',
    h('br'),'Mêmes chances pour tout le monde : commune '+ARENA.odds[1]+' %, rare '+ARENA.odds[2]+' %, légendaire '+ARENA.odds[3]+' % par choix (le 1er choix est toujours un choix de légendaires), sans tenir compte de ta collection. Les choix sont fixés dès l’entrée : recharger la page ne les change pas. Le second joueur garde la Pièce et l’Or de compensation, mais pas les '+COMP.hp+' PV bonus. Une partie quittée avant la fin compte comme une défaite.');
  const head=h('div',{class:'panel hl v-arena'},ph('play','Arène',r?r.w+' V · '+r.l+' D':(A.best?'Record : '+A.best+' V':'')),rules);
  if(!r){
    apn(head,h('div',{class:'row',style:'margin-top:14px;gap:12px'},
      h('button',{class:'btn gold big',id:'arenaGo',disabled:S.gems<ARENA.cost,onclick:()=>{const e=arenaEnter();if(e){toast(e);return}refreshTop();go('arena')}},'Entrer dans l’Arène ('+ARENA.cost+' 💎)')),
      S.gems<ARENA.cost?h('p',{class:'sm',style:'color:#f2a7a2;margin:8px 0 0'},'Il te manque '+(ARENA.cost-S.gems)+' 💎.'):null,
      A.last?h('p',{class:'sm mut',style:'margin:10px 0 0'},'Dernière course : '+A.last.w+' V – '+A.last.l+' D, +'+A.last.g+' 💎.'+(A.runs>1?' Courses jouées : '+A.runs+'.':'')):null);
    v.append(head,h('div',{class:'cols arena-cols'},arenaLeaderboardPanel(),
      h('div',{class:'panel'},ph('💎','Récompenses'),h('p',{class:'sm mut',style:'margin:0 0 8px'},'Selon le nombre de victoires à la fin de la course :'),arenaRewards(-1))));return}
  if(r.swap&&r.swap.stage==='remove'){
    const removed=r.swap.removed,toggle=i=>{arenaToggleRemoval(i);go('arena')};
    v.append(h('div',{class:'cols arena-cols'},
      h('div',null,h('div',{class:'panel hl v-arena'},ph('play','Remplacer des cartes',removed.length+' / '+ARENA.redraft),
        h('p',{class:'mut sm'},'Tes '+ARENA.redraft+' nouvelles cartes sont prêtes. Sélectionne maintenant les '+ARENA.redraft+' cartes de ton deck qu’elles vont remplacer.'),
        h('button',{class:'btn gold',disabled:removed.length!==ARENA.redraft,onclick:()=>{if(arenaApplyRemoval())go('arena')}},'Remplacer les '+ARENA.redraft+' cartes sélectionnées'))),
      h('div',null,h('div',{class:'panel'},ph('decks','Ton deck · sélectionne '+ARENA.redraft+' cartes'),arenaDeckList(r.picks,removed,toggle)),arenaLeaderboardPanel())));return}
  if((r.swap&&(r.swap.stage==='draft'||r.swap.stage==='legacyPick'))||r.picks.length<ARENA.picks){
    const replacing=!!r.swap,n=replacing?r.swap.drafted:r.picks.length,total=replacing?ARENA.redraft:ARENA.picks,
      offerN=replacing?n+1:n,o=arenaOffer(r.seed,offerN);let busy=false;
    const pick=i=>{if(busy)return;busy=true;const draftingReplacement=!!(r.swap&&r.swap.stage==='draft'),k=arenaPick(i);
      if(k)toast('✔ '+fullName(k)+(replacing?(draftingReplacement?' ajoutée aux remplaçantes ('+(n+1)+' / '+total+')':' remplace une carte ('+(n+1)+' / '+total+')'):' ajoutée ('+(n+1)+' / '+total+')'));go('arena')};
    v.append(h('div',{class:'cols arena-cols'},
      h('div',null,h('div',{class:'panel hl v-arena adraft'},ph('play',replacing?'Redraft de remplacement':'Draft d’Arène',(n+1)+' / '+total),
        h('p',{class:'apr'},h('span',{class:'arar r'+o.r},RGEM[o.r]+' Choix de '+RAR[o.r].toLowerCase()+'s'),' Clique sur la carte à garder · clic droit : fiche détaillée'),
        h('div',{class:'apick'},o.c.map((k,i)=>h('div',{class:'apc',onclick:()=>pick(i),oncontextmenu:e=>{e.preventDefault();showCard(k)}},cardEl(k,{big:true,tilt:1}),h('span',{class:'apx'},'✔ Garder')))),
        h('div',{class:'bar',style:'margin-top:16px'},h('i',{style:'width:'+(n/total*100)+'%'})))),
      h('div',null,h('div',{class:'panel'},ph('decks','Ton deck d’Arène',r.picks.length+' / '+ARENA.picks),r.picks.length?curve({cards:r.picks}):h('p',{class:'sm mut'},'Tes cartes apparaîtront ici.'),r.picks.length?arenaDeckList(r.picks):null),arenaLeaderboardPanel())));return}
  apn(head,arenaPips(r.w,r.l),
    h('div',{class:'row',style:'margin-top:14px;gap:10px;flex-wrap:wrap'},
      h('button',{class:'btn gold big arena-action',onclick:startArenaAIDuel},'Défier l’IA · palier '+Math.min(ARENA.maxW,r.w+1)),
      h('button',{class:'btn big arena-action',id:'arenaQueueJoin',disabled:AQ.active,onclick:arenaQueueStart},AQ.active?'Recherche en cours…':AQ.state==='expired'||AQ.state==='error'?'Relancer la recherche':'Chercher un joueur humain'),
      h('button',{class:'btn',id:'arenaQueueCancel',hidden:!AQ.active,onclick:arenaQueueCancel},'Annuler la recherche'),
      h('button',{class:'btn',onclick:()=>{const g=ARENA.rw[Math.min(r.w,ARENA.maxW)];ask('Abandonner la course ?','Tu touches tout de suite la récompense de '+r.w+' victoire'+(r.w>1?'s':'')+' : '+g+' 💎. Ton deck d’Arène est perdu.',
        [{t:'Continuer'},{t:'Abandonner (+'+g+' 💎)',c:'danger',f:()=>{const x=arenaFinish();refreshTop();toast('Course terminée : +'+x.g+' 💎');go('arena')}}])}},'Abandonner la course')),
    h('div',{id:'arenaQueueStatus',class:'arena-qstatus',hidden:true}),
    r.log.length?h('div',{class:'alog'},r.log.slice(-8).map(e=>h('span',{class:e.w?'w':'l'},(e.w?'⚔ Victoire':'✕ Défaite')+' contre '+e.o))):null);
  v.append(h('div',{class:'cols arena-cols'},h('div',null,head,arenaLeaderboardPanel(),h('div',{class:'panel'},ph('💎','Récompenses'),arenaRewards(r.w))),
    h('div',null,h('div',{class:'panel'},ph('decks','Ton deck d’Arène',ARENA.picks+' cartes'),curve({cards:r.picks}),arenaDeckList(r.picks)))));
  arenaQueueRender()}
function arenaOpt(){return Object.assign({},OPTDEF,{rw:0,arena:1})}
// fin d'un duel d'Arène : on note le résultat de la course (une seule fois)
function arenaAfterDuel(V,D){if(!V.o.arena||D.arenaDone||!S.arena.run)return null;D.arenaDone=true;const me=V.me,w=V.over.w,res=arenaRecord(w<0?-1:w===me?1:0,V.p[1-me].nm);
  if(V.o.arenaQueue)arenaQueueFinished();return res}
