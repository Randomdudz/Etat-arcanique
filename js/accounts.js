// ============ STOCKAGE LOCAL : profil, 💎, collection, decks, amis ============
const LS_KEY='etat_arcanique_v3';
let S=null;
function sha256(s){
  const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  const b=unescape(encodeURIComponent(s)),l=b.length,w=[];
  for(let i=0;i<l;i++)w[i>>2]|=b.charCodeAt(i)<<(24-(i%4)*8);
  w[l>>2]|=0x80<<(24-(l%4)*8);w[(((l+8)>>6)<<4)+15]=l*8;
  let H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const R=(x,n)=>(x>>>n)|(x<<(32-n));
  for(let o=0;o<w.length;o+=16){
    const x=new Array(64);let[a,b2,c,d,e,f,g,h2]=H;
    for(let i=0;i<64;i++){
      if(i<16)x[i]=w[o+i]|0;else{const s0=R(x[i-15],7)^R(x[i-15],18)^(x[i-15]>>>3),s1=R(x[i-2],17)^R(x[i-2],19)^(x[i-2]>>>10);x[i]=(x[i-16]+s0+x[i-7]+s1)|0}
      const S1=R(e,6)^R(e,11)^R(e,25),ch=(e&f)^(~e&g),t1=(h2+S1+ch+K[i]+x[i])|0,S0=R(a,2)^R(a,13)^R(a,22),mj=(a&b2)^(a&c)^(b2&c),t2=(S0+mj)|0;
      h2=g;g=f;f=e;e=(d+t1)|0;d=c;c=b2;b2=a;a=(t1+t2)|0}
    H=[(H[0]+a)|0,(H[1]+b2)|0,(H[2]+c)|0,(H[3]+d)|0,(H[4]+e)|0,(H[5]+f)|0,(H[6]+g)|0,(H[7]+h2)|0]}
  return H.map(v=>('00000000'+(v>>>0).toString(16)).slice(-8)).join('')}

function today(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function genCode(){const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<6;i++)s+=A[Math.floor(Math.random()*A.length)];return 'ARCANE-'+s}
function freshState(){
  const coll={};STARTER.forEach(k=>coll[k]={n:2,p:0});
  const st={v:3,name:'',code:genCode(),friends:[],gems:ECON.start,coll,sel:0,
    decks:[],daily:{d:today(),earned:0,first:false},stats:{w:0,l:0},opt:Object.assign({},OPTDEF),seen:{},arena:arenaFix(null)};
  st.decks[0]={name:'Ravagés',cards:autoDeck(coll,'ravages')};      // 3 decks de départ ; on peut en créer jusqu'à ECON.decks
  st.decks[1]={name:'Farmers',cards:autoDeck(coll,'farmer')};
  st.decks[2]={name:'Toxic',cards:autoDeck(coll,'toxic')};
  return st}
// communes ajoutées en v11 : offertes (2 exemplaires) aux sauvegardes plus anciennes, comme toute la collection de départ
const NEWC11=['signalement','binge','genkidama','achat','lowcost','valise','folie','gatekeeping','nostalgie','drain','parchemin','feca','flash','smite','fumigene','smurf','freelance','multi'];
function grantStarter(st){
  if(!Array.isArray(st.st0))st.st0=STARTER.filter(k=>NEWC11.indexOf(k)<0);
  for(const k of STARTER)if(st.st0.indexOf(k)<0){const e=st.coll[k]||(st.coll[k]={n:0,p:0});e.n+=2;st.st0.push(k)}}
// vérifie et met à niveau une sauvegarde (locale, du compte en ligne ou importée) ; null si elle est invalide
function fixS(st){
  if(!st||typeof st!=='object'||st.v!==3||!st.coll||typeof st.coll!=='object'||!Array.isArray(st.decks))return null;
  st.opt=Object.assign({},OPTDEF,st.opt||{});st.seen=st.seen||{};st.friends=Array.isArray(st.friends)?st.friends:[];st.stats=st.stats||{w:0,l:0};
  st.gems=Math.max(0,Math.floor(+st.gems||0));st.name=String(st.name||'').slice(0,16);if(!st.code)st.code=genCode();st.sel=st.sel|0;
  st.decks=st.decks.map((d,i)=>({name:(d&&d.name)||('Deck '+(i+1)),cards:((d&&d.cards)||[]).map(e=>String(e).replace('*','')).filter(k=>CARDS[k]&&POOL.indexOf(k)>=0)}));
  for(const k of Object.keys(st.coll)){const e=st.coll[k];if(!CARDS[k]||!e||typeof e!=='object')delete st.coll[k];else{e.n=Math.max(0,e.n|0)+Math.max(0,e.p|0);e.p=0}}
  delete st.opt.pw;delete st.opt.rel;delete st.opt.arena;st.arena=arenaFix(st.arena);
  if(!st.daily||st.daily.d!==today())st.daily={d:today(),earned:0,first:false};
  grantStarter(st);
  return st}
function loadS(){
  let st=null;try{const r=localStorage.getItem(LS_KEY);if(r)st=JSON.parse(r)}catch(e){}
  S=fixS(st);if(!S){S=freshState();S.st0=STARTER.slice()}
  return S}
// nosync : écriture locale seulement (sauvegarde qui vient d'être reçue du compte en ligne)
function saveS(nosync){if(!nosync)S.upd=Date.now();try{localStorage.setItem(LS_KEY,JSON.stringify(S))}catch(e){}locSync();if(!nosync&&typeof cloudSoon==='function')cloudSoon();
  // la collection a peut-être changé (boosters, échanges, recyclage, arène) : on relance le
  // calcul du deck de l'IA en fond, sans jamais bloquer l'interface
  if(typeof warmBestDeck==='function'){clearTimeout(saveS._w);saveS._w=setTimeout(()=>{if(typeof DUEL!=='undefined'&&DUEL)return;try{warmBestDeck(S.coll,S.opt)}catch(e){}},1500)}}
function freshStateNew(){const st=freshState();st.st0=STARTER.slice();return st}

// ============ COMPTES LOCAUX : connexion obligatoire même sans serveur de sauvegarde ============
// Quand les comptes en ligne ne sont pas configurés (cloud-config.js vide), chaque joueur se connecte avec un pseudo et un mot de passe
// propres à cet ordinateur : une progression par compte. Le mot de passe n'est jamais stocké, seulement son empreinte (SHA-256 salée).
const LOC_KEY='etat_arcanique_comptes',LSES_KEY='etat_arcanique_session';
function locAll(){try{return JSON.parse(localStorage.getItem(LOC_KEY)||'{}')||{}}catch(e){return{}}}
function locPut(a){try{localStorage.setItem(LOC_KEY,JSON.stringify(a))}catch(e){}}
function locKey(id){return String(id||'').trim().toLowerCase()}
function locSession(){try{const k=localStorage.getItem(LSES_KEY)||'';return k&&locAll()[k]?k:''}catch(e){return''}}
function locSetSession(k){try{if(k)localStorage.setItem(LSES_KEY,k);else localStorage.removeItem(LSES_KEY)}catch(e){}}
function locHash(salt,pw){return sha256(salt+'|'+pw)}
function locSignUp(id,pw){id=String(id||'').trim();const k=locKey(id);
  if(k.length<3)throw new Error('Pseudo trop court : 3 caractères minimum.');if(k.length>16)throw new Error('Pseudo trop long : 16 caractères maximum.');
  if(String(pw||'').length<6)throw new Error('Mot de passe trop court : 6 caractères minimum.');
  const A=locAll();if(A[k])throw new Error('Ce pseudo est déjà pris sur cet ordinateur : connecte-toi, ou choisis-en un autre.');
  // le premier compte créé sur cet ordinateur reprend la progression déjà présente ; les suivants commencent avec la collection de départ
  const first=!Object.keys(A).length,st=first?S:freshStateNew();st.name=id.slice(0,16);
  const salt=Math.random().toString(36).slice(2)+Date.now().toString(36);
  A[k]={id,salt,h:locHash(salt,pw),save:JSON.stringify(st),c:Date.now()};locPut(A);locSetSession(k);S=st;saveS();return first?'migrated':'new'}
function locSignIn(id,pw){const k=locKey(id),A=locAll(),a=A[k];if(!a)throw new Error('Aucun compte avec ce pseudo sur cet ordinateur.');
  if(locHash(a.salt,String(pw||''))!==a.h)throw new Error('Mot de passe incorrect.');
  let st=null;try{st=fixS(JSON.parse(a.save))}catch(e){}if(!st){st=freshStateNew();st.name=a.id}
  locSetSession(k);S=st;saveS(true);return'loaded'}
function locLogout(){locSync();locSetSession('')}
function locSync(){let k='';try{k=localStorage.getItem(LSES_KEY)||''}catch(e){}if(!k)return;const A=locAll();if(!A[k])return;A[k].save=JSON.stringify(S);locPut(A)}
// connecté ? (compte en ligne si le serveur est configuré, sinon compte local)
function loggedIn(){return cloudOn()?!!accLoad():!!locSession()}

// ============ COMPTES : la collection, les decks et les 💎 suivent le joueur d'un ordinateur à l'autre ============
// Sauvegarde en ligne avec Firebase (Authentication par e-mail / mot de passe + Cloud Firestore), appelés par leur API web.
// La configuration (apiKey, projectId) est lue dans cloud-config.js, à côté du jeu ; vide = comptes désactivés.
const CLOUD=Object.assign({apiKey:'',projectId:''},(typeof window!=='undefined'&&window.EA_CLOUD)||{});
const ACC_KEY='etat_arcanique_compte',BAK_KEY='etat_arcanique_secours';
let ACC=null,ACC_T=0,ACC_ST='',ACC_BUSY=false,ACC_DIRTY=false;   // compte connecté, envoi programmé, état affiché, envoi en cours, modifs à envoyer
function cloudOn(){return!!(CLOUD.apiKey&&CLOUD.projectId)}
function accLoad(){try{ACC=JSON.parse(localStorage.getItem(ACC_KEY)||'null')}catch(e){ACC=null}if(ACC&&(!ACC.uid||!ACC.rt))ACC=null;return ACC}
function accSave(){try{if(ACC)localStorage.setItem(ACC_KEY,JSON.stringify({uid:ACC.uid,id:ACC.id,em:ACC.em,rt:ACC.rt,last:ACC.last||0}));else localStorage.removeItem(ACC_KEY)}catch(e){}}
// identifiant : un pseudo (transformé en adresse interne, jamais utilisée pour écrire) ou une vraie adresse e-mail
function accEmail(id){id=String(id||'').trim();if(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(id))return id.toLowerCase();
  const s=id.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9._-]+/g,'-').replace(/^[-._]+|[-._]+$/g,'');
  return s?s+'@joueurs.etat-arcanique.fr':''}
function accIsMail(id){return/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(id||'').trim())}
const ACC_ERR={EMAIL_EXISTS:'Ce pseudo (ou cet e-mail) est déjà utilisé par un autre compte.',EMAIL_NOT_FOUND:'Aucun compte avec ce pseudo.',INVALID_PASSWORD:'Mot de passe incorrect.',
  INVALID_LOGIN_CREDENTIALS:'Pseudo ou mot de passe incorrect.',INVALID_EMAIL:'Pseudo ou adresse e-mail invalide.',WEAK_PASSWORD:'Mot de passe trop court : 6 caractères minimum.',
  MISSING_PASSWORD:'Entre un mot de passe.',TOO_MANY_ATTEMPTS_TRY_LATER:'Trop de tentatives : réessaie dans quelques minutes.',USER_DISABLED:'Ce compte est désactivé.',
  OPERATION_NOT_ALLOWED:'La connexion par e-mail et mot de passe n’est pas activée dans le projet Firebase.',TOKEN_EXPIRED:'Session expirée : reconnecte-toi.',
  INVALID_REFRESH_TOKEN:'Session expirée : reconnecte-toi.',USER_NOT_FOUND:'Compte introuvable : reconnecte-toi.',PERMISSION_DENIED:'Accès refusé par le serveur (règles Firestore ?).',
  API_KEY_INVALID:'Configuration Firebase invalide (apiKey).',NOT_FOUND:'Base Firestore introuvable (projectId ?).'};
function accErr(m){m=String(m||'');const k=m.split(/[ :]/)[0];return ACC_ERR[k]||(m?'Erreur du serveur : '+m:'Serveur injoignable (connexion internet ?).')}
async function accFetch(url,o){let r;try{r=await fetch(url,o)}catch(e){throw new Error(accErr(''))}
  const j=await r.json().catch(()=>({}));if(!r.ok){const e=j.error||{};throw new Error(accErr(e.status==='PERMISSION_DENIED'||e.status==='NOT_FOUND'?e.status:e.message))}return j}
const IDT='https://identitytoolkit.googleapis.com/v1/accounts:';
async function accAuth(mode,id,pw){                                   // mode : 'signUp' (création) ou 'signInWithPassword' (connexion)
  const em=accEmail(id);if(!em)throw new Error('Entre un pseudo ou une adresse e-mail.');
  const j=await accFetch(IDT+mode+'?key='+encodeURIComponent(CLOUD.apiKey),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:em,password:pw,returnSecureToken:true})});
  ACC={uid:j.localId,id:String(id).trim(),em,rt:j.refreshToken,tok:j.idToken,exp:Date.now()+(+j.expiresIn||3600)*1000-60000,last:0};accSave();return ACC}
async function accTok(){if(!ACC)throw new Error('Non connecté.');if(ACC.tok&&Date.now()<ACC.exp)return ACC.tok;
  const j=await accFetch('https://securetoken.googleapis.com/v1/token?key='+encodeURIComponent(CLOUD.apiKey),{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:'grant_type=refresh_token&refresh_token='+encodeURIComponent(ACC.rt)});
  ACC.tok=j.id_token;ACC.rt=j.refresh_token||ACC.rt;ACC.exp=Date.now()+(+j.expires_in||3600)*1000-60000;accSave();return ACC.tok}
function accDoc(){return'https://firestore.googleapis.com/v1/projects/'+encodeURIComponent(CLOUD.projectId)+'/databases/(default)/documents/saves/'+encodeURIComponent(ACC.uid)}
async function cloudGet(){const tok=await accTok();let r;try{r=await fetch(accDoc(),{headers:{Authorization:'Bearer '+tok}})}catch(e){throw new Error(accErr(''))}
  if(r.status===404)return null;const j=await r.json().catch(()=>({}));if(!r.ok){const e=j.error||{};throw new Error(accErr(e.status||e.message))}
  const f=j.fields||{};if(!f.data||!f.data.stringValue)return null;let data=null;try{data=JSON.parse(f.data.stringValue)}catch(e){}
  return{data,upd:+((f.upd&&f.upd.integerValue)||0)}}
async function cloudPut(keep){const tok=await accTok();ACC_DIRTY=false;
  const body={fields:{data:{stringValue:JSON.stringify(S)},upd:{integerValue:String(S.upd||0)},pseudo:{stringValue:S.name||''},ver:{stringValue:APPV}}};
  try{await accFetch(accDoc(),{method:'PATCH',keepalive:!!keep,headers:{Authorization:'Bearer '+tok,'Content-Type':'application/json'},body:JSON.stringify(body)})}catch(e){ACC_DIRTY=true;throw e}
  ACC.last=Date.now();accSave()}
function accState(st,err){ACC_ST=st;if(ACC)ACC.err=err||'';if(typeof refreshTop==='function')refreshTop();if(typeof accRefresh==='function')accRefresh()}
// après chaque sauvegarde locale : envoi au compte (regroupé, 1,5 s plus tard)
function cloudSoon(){if(!ACC||!cloudOn())return;ACC_DIRTY=true;clearTimeout(ACC_T);ACC_T=setTimeout(cloudSync,1500)}
async function cloudSync(){if(!ACC||!cloudOn())return;if(ACC_BUSY){clearTimeout(ACC_T);ACC_T=setTimeout(cloudSync,1500);return}
  ACC_BUSY=true;accState('sync');try{await cloudPut();accState('ok')}catch(e){accState('err',e.message)}finally{ACC_BUSY=false}
  if(ACC_DIRTY&&ACC_ST==='ok')cloudSoon()}
function accBackup(){try{localStorage.setItem(BAK_KEY,JSON.stringify(S))}catch(e){}}
function useState(st,upd){S=st;if(upd!=null)S.upd=upd;saveS(upd!=null)}
// connexion / création : en se connectant, on récupère la sauvegarde du compte (la progression locale est gardée en copie de secours) ;
// en créant un compte, la progression actuelle devient celle du compte
async function accLogin(mode,id,pw){
  if(!cloudOn())throw new Error('Les comptes en ligne ne sont pas activés sur cette version du jeu.');
  await accAuth(mode,id,pw);
  try{if(mode==='signUp'){S.upd=S.upd||Date.now();await cloudPut();accState('ok');return'new'}
    const c=await cloudGet(),st=c&&fixS(c.data);
    if(st){accBackup();useState(st,c.upd);accState('ok');return'loaded'}
    S.upd=S.upd||Date.now();await cloudPut();accState('ok');return'pushed'}
  catch(e){accState('err',e.message);throw e}}
// au démarrage, si le joueur est déjà connecté : la version la plus récente gagne (celle du compte ou celle de cet ordinateur)
async function accBoot(onLoaded){accLoad();if(!ACC||!cloudOn())return;accState('sync');
  try{const c=await cloudGet(),st=c&&fixS(c.data);
    if(st&&c.upd>(S.upd||0)){useState(st,c.upd);accState('ok');onLoaded&&onLoaded();return}
    if(!st||(S.upd||0)>c.upd){S.upd=S.upd||Date.now();await cloudPut()}
    accState('ok')}catch(e){accState('err',e.message)}}
function accLogout(){if(ACC&&ACC_DIRTY&&cloudOn())cloudPut(true).catch(()=>{});clearTimeout(ACC_T);ACC=null;accSave();accState('')}
async function accReset(id){const em=accEmail(id);if(!accIsMail(id))throw new Error('La récupération du mot de passe ne marche qu’avec une adresse e-mail.');
  await accFetch(IDT+'sendOobCode?key='+encodeURIComponent(CLOUD.apiKey),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestType:'PASSWORD_RESET',email:em})})}
if(typeof window!=='undefined')document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&ACC&&ACC_DIRTY&&cloudOn()){clearTimeout(ACC_T);cloudPut(true).catch(()=>{})}});
// ----- transfert sans compte : code de sauvegarde (texte à copier) ou fichier .json -----
function saveCode(){const j=JSON.stringify(S);return'EA1-'+sha256(j).slice(0,8)+'-'+btoa(unescape(encodeURIComponent(j)))}
function readSave(txt){txt=String(txt||'').trim();let j=null;
  const m=txt.replace(/\s+/g,'').match(/^EA1-([0-9a-f]{8})-([A-Za-z0-9+/=]+)$/);
  if(m){try{j=decodeURIComponent(escape(atob(m[2])))}catch(e){return null}if(sha256(j).slice(0,8)!==m[1])return null}
  else if(txt[0]==='{')j=txt;else return null;
  let st=null;try{st=JSON.parse(j)}catch(e){return null}return fixS(st)}
function importSave(st){accBackup();useState(st)}

// ----- collection -----
function ownedN(k){const e=S.coll[k];return e?e.n+e.p:0}
function addCard(k){const e=S.coll[k]||(S.coll[k]={n:0,p:0});e.n++;saveS()}
// ----- recyclage : les exemplaires au-delà de 2 rapportent quelques 💎 (les decks ne sont jamais touchés : 2 exemplaires restent) -----
const RECY={keep:2,v:[0,1,3,10]};                          // 💎 par exemplaire : commune 1, rare 3, légendaire 10
function extraN(k){return Math.max(0,ownedN(k)-RECY.keep)}
function recycleVal(k){return RECY.v[CARDS[k].r]||0}
function recy0(k,n){const e=S.coll[k];n=Math.min(n==null?1:n,extraN(k));if(!e||n<=0)return 0;
  for(let j=0;j<n;j++){if(e.n>0)e.n--;else e.p--}const g=n*recycleVal(k);S.gems+=g;return g}
function recycleCard(k,n){const g=recy0(k,n);if(g)saveS();return g}
function recycleSum(){let n=0,g=0;for(const k of POOL){const x=extraN(k);if(x>0){n+=x;g+=x*recycleVal(k)}}return{n,g}}
function recycleAll(){let n=0,g=0;for(const k of POOL){const x=extraN(k);if(x>0){n+=x;g+=recy0(k,x)}}if(n)saveS();return{n,g}}

// ----- boosters : 5 cartes ; 3 boosters d'un coup = au moins une Rare (ou mieux) garantie -----
function rollRar(odds){let r=Math.random()*100,a=0;for(let i=1;i<odds.length;i++){a+=odds[i];if(r<a)return i}return odds.length-1}
function rollCard(rar){const pool=POOL.filter(k=>CARDS[k].r===rar);return pool[Math.floor(Math.random()*pool.length)]}
// n paquets ; renvoie un tableau de paquets (chacun : liste de {k,p,rar,isNew}) ou null si pas assez de 💎
function buyBoosters(n){
  const price=ECON.booster*n;if(S.gems<price)return null;S.gems-=price;
  const odds=ECON.odds,seen={},packs=[];
  for(let b=0;b<n;b++){const pk=[];
    for(let i=0;i<ECON.pack;i++){const rar=rollRar(odds);pk.push({rar,k:null})}
    packs.push(pk)}
  // garantie : un lot de 3 contient au moins une Rare ou mieux
  if(n>=ECON.bulk){const all=packs.flat();if(!all.some(c=>c.rar>=2)){const c=all[Math.floor(Math.random()*all.length)];c.rar=2}}
  for(const pk of packs)for(const c of pk){c.k=rollCard(c.rar);c.isNew=ownedN(c.k)===0&&!seen[c.k];seen[c.k]=1;addCard(c.k)}
  // les paquets sont triés du moins rare au plus rare pour une révélation qui monte en tension
  packs.forEach(pk=>pk.sort((a,b)=>a.rar-b.rar));
  saveS();return packs}

// ----- gains en 💎 -----
function dailyLeft(){return Math.max(0,ECON.cap-S.daily.earned)}
function rewardDuel(win){
  if(S.daily.d!==today())S.daily={d:today(),earned:0,first:false};
  let g=win?ECON.win:ECON.loss,bonus=0;
  if(win&&!S.daily.first){bonus=ECON.first;S.daily.first=true}
  const tot=g+bonus,gain=Math.min(tot,dailyLeft());
  S.daily.earned+=gain;S.gems+=gain;if(win)S.stats.w++;else S.stats.l++;saveS();
  return{gain,base:g,bonus,capped:gain<tot}}
// toute la collection d'un coup (code de bêta-test) : chaque carte au maximum autorisé dans un deck (2, ou 1 pour une légendaire)
function unlockAll(){let n=0;for(const k of POOL){const e=S.coll[k]||(S.coll[k]={n:0,p:0});const m=LIMIT(CARDS[k].r);if(e.n<m){n+=m-e.n;e.n=m}}saveS();return n}
function redeemCode(txt){
  const t=String(txt||'').trim(),h=sha256(t);
  if(h===ECON.codeH){S.gems+=ECON.codeGems;saveS();return{ok:true,n:ECON.codeGems}}
  if(sha256(t.toLowerCase())===ECON.codeAll)return{ok:true,all:true,n:unlockAll()};
  return{ok:false}}

// ----- decks -----
function deckCount(d){const c={};for(const e of d.cards){const k=e.replace('*','');c[k]=(c[k]||0)+1}return c}
function deckCheck(d){
  if(d.cards.length!==ECON.deck)return{ok:false,err:d.cards.length+' / '+ECON.deck+' cartes'};
  const c=deckCount(d);for(const k in c){if(c[k]>LIMIT(CARDS[k].r))return{ok:false,err:fullName(k)+' : max '+LIMIT(CARDS[k].r)};if(c[k]>ownedN(k))return{ok:false,err:fullName(k)+' non possédée'}}
  const nl=Object.keys(c).reduce((n,k)=>n+(CARDS[k]&&CARDS[k].r===3?c[k]:0),0);if(nl>LEGMAX)return{ok:false,err:nl+' légendaires : '+LEGMAX+' au maximum'};
  return{ok:true}}
// liste de clés d'un deck (sans les anciennes marques « * » des cartes prismatiques)
function deckKeys(list){return list.map(k=>String(k).replace('*',''))}

