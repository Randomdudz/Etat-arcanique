// ============ EXPÉDITION : roguelite solo (patrons, carte à embranchements, reliques, boss, Tilt) ============
// Une course : un patron, 15 cartes, des PV qui ne remontent pas tout seuls. 3 actes de 7 étages puis le Raid final.
// Les combats utilisent le duel normal (moteur, IA, interface) ; les effets de course passent par P.rx (engine.js).
// Tout le hasard d'une course vient d'une graine : recharger la page ne change ni la carte, ni les offres, ni les combats.

const EXP={hp:40,floors:7,deck0:15,acts:['Le Bazar','La Faille','Dust','Le Raid final'],tg:['dofus','lol','cs','wow'],
  ehp:{normal:[16,24,30],elite:[20,28,34],boss:[24,32,38]},lvl:{normal:[0,1,3],elite:[0,2,3],boss:[1,3,3]},ai:{normal:[0,1,2],elite:[0,1,2],boss:[0,2,2]},
  gems:[10,20,30],gemRaid:60,gemTilt:10,gemDaily:25,rmCost:60,rmStep:25,xpLv:[0,120,300,550,900,1350,1900,2600]};
const XPVER=1;

// ---------- patrons ----------
const XPAT={
  farmer:{n:'Le Fermier',ic:'🪙',fam:'farmer',tx:'Commence chaque combat avec 2 Or. +25 % d’Or d’expédition.',rx:{or:2},gold:.25},
  toxic:{n:'Le Rageux',ic:'☠',fam:'toxic',tx:'Chaque fois qu’une créature ennemie meurt, le héros adverse perd 1 PV.',rx:{ping:1}},
  ravages:{n:'Le Zergueur',ic:'🚀',fam:'ravages',tx:'La première créature que tu joues à chaque tour gagne Hâte.',rx:{hasteTurn:1}},
  vestige:{n:'Le Vétéran',ic:'🛡',fam:'vestige',tx:'45 PV au lieu de 40. Les Tavernes soignent 5 PV de plus.',rx:{},hp:5,restFlat:5},
  expats:{n:'L’Expat',ic:'✈',fam:'expats',tx:'Le premier voyage de chaque combat est gratuit, et la créature revient avec +1/+1.',rx:{tr1:1},unl:'boss1',ut:'Bats le boss de l’acte 1.'},
  weebos:{n:'Le Weeb',ic:'🌸',fam:'weebos',tx:'Tes créatures arrivent avec +1 PV.',rx:{hpPlus:1},unl:'boss2',ut:'Bats le boss de l’acte 2.'},
  alien:{n:'L’Envahisseur',ic:'🛸',fam:'alien',tx:'Commence chaque combat avec 1 Démoflux maximum de plus.',rx:{cap:1},unl:'win',ut:'Termine une Expédition.'},
  xeno:{n:'Le Xéno',ic:'👽',fam:'xeno',tx:'Tes créatures ont +1 ATK tant que tu as 3 créatures ou plus.',rx:{atk3:1},unl:'tilt3',ut:'Termine une Expédition au Tilt 3 ou plus.'}};
const XPATK=Object.keys(XPAT);

// ---------- reliques ----------
// r : c commune, r rare, b boss, m maudite (événements, Tilt 6). lv : niveau d'expédition requis pour qu'elle apparaisse.
// rx : effets en combat (engine.js) ; les autres effets (or, soins, boutique…) sont lus par la course.
const XREL={
  casque:{n:'Casque RGB',ic:'🎧',r:'c',tx:'Ta première créature de chaque combat gagne Hâte.',rx:{hasteFirst:1}},
  pizza:{n:'Pizza froide',ic:'🍕',r:'c',tx:'Après chaque combat gagné, récupère 4 PV.',healWin:4},
  usb:{n:'Clé USB',ic:'💾',r:'c',tx:'Commence chaque combat avec 1 Démoflux maximum de plus.',rx:{cap:1}},
  tirelire:{n:'Tirelire',ic:'🐷',r:'c',tx:'Commence chaque combat avec 2 Or.',rx:{or:2}},
  canette:{n:'Canette énergisante',ic:'🥤',r:'c',tx:'Ta main de départ a 1 carte de plus.',rx:{draw:1}},
  carton:{n:'Bouclier en carton',ic:'📦',r:'c',tx:'Ta première créature de chaque combat arrive avec Égide.',rx:{egFirst:1}},
  ticket:{n:'Ticket de caisse',ic:'🧾',r:'c',tx:'+25 % d’Or d’expédition.',gold:.25},
  mug:{n:'Mug du serveur',ic:'☕',r:'c',tx:'+4 PV maximum (et récupère 4 PV).',mhp:4},
  chaussons:{n:'Chaussons douillets',ic:'🧦',r:'c',tx:'Les Tavernes soignent 10 % de plus.',rest:.1},
  fidelite:{n:'Carte de fidélité',ic:'💳',r:'c',tx:'Tout coûte 20 % de moins chez le Marchand.',shop:-.2},
  valise:{n:'Valise diplomatique',ic:'🧳',r:'r',tx:'Les voyages coûtent 1 Or de moins.',rx:{trDisc:1}},
  ping5:{n:'Ping 5 ms',ic:'📶',r:'r',tx:'Tu joues toujours en premier.',first:0},
  oeuf:{n:'Œuf fêlé',ic:'🥚',r:'r',tx:'Commence chaque combat avec un Dofus légendaire au hasard.',rx:{dofus:1}},
  vpn:{n:'VPN',ic:'🕶',r:'r',lv:3,tx:'L’IA ne voit plus ta main pendant ses calculs.',vpn:1},
  dragodinde:{n:'Dragodinde de compagnie',ic:'🐉',r:'r',tx:'+1 Or au début de chacun de tes 3 premiers tours.',rx:{orTurn:3}},
  whey:{n:'Pot de whey',ic:'💪',r:'r',tx:'Tes créatures arrivent avec +1 PV.',rx:{hpPlus:1}},
  sel:{n:'Sel de rage',ic:'🧂',r:'r',tx:'Chaque fois qu’une créature ennemie meurt, le héros adverse perd 1 PV.',rx:{ping:1}},
  lunettes:{n:'Lunettes de visée',ic:'🎯',r:'r',lv:2,tx:'Les récompenses de combat proposent 1 carte de plus.',pick:1},
  enclume:{n:'Enclume portative',ic:'⚒',r:'r',lv:3,tx:'Au début de chaque acte, une carte au hasard de ton deck est améliorée.',forge:1},
  sablier:{n:'Sablier « encore 5 min »',ic:'⏳',r:'r',lv:2,tx:'Tes cartes coûtent 1 de moins pendant ton premier tour.',rx:{ncost:1}},
  marteau:{n:'Marteau de modo',ic:'🔨',r:'b',tx:'Le premier sort adverse de chaque combat est annulé.',rx:{counter:1}},
  nitro:{n:'Abonnement Nitro',ic:'💎',r:'b',tx:'Tes cartes coûtent 1 de moins pendant tes 2 premiers tours.',rx:{ncost:2}},
  replay:{n:'Replay',ic:'📼',r:'b',lv:4,tx:'Une fois par combat, ta première créature qui meurt revient dans ta main.',rx:{replay:1}},
  couronne:{n:'Couronne du serveur',ic:'👑',r:'b',tx:'Tes créatures ont +1 ATK.',rx:{atk:1}},
  serveur:{n:'Serveur dédié',ic:'🖥',r:'b',lv:5,tx:'+10 PV maximum, et récupère tous tes PV.',mhp:10,full:1},
  clavier:{n:'Clavier maudit',ic:'🩸',r:'m',tx:'Maudite. Tes créatures ont +1 ATK, mais ton héros perd 1 PV au début de chacun de tes tours.',rx:{atk:1,selfDmg:1}},
  pret:{n:'Prêt sur gages',ic:'💸',r:'m',tx:'Maudite. +150 Or tout de suite, mais tout coûte 30 % de plus chez le Marchand.',goldNow:150,shop:.3},
  box:{n:'Box internet capricieuse',ic:'📡',r:'m',tx:'Maudite. +1 Démoflux maximum en début de combat, mais l’adversaire joue toujours en premier.',rx:{cap:1},first:1},
  ego:{n:'Ego surdimensionné',ic:'🎈',r:'m',tx:'Maudite. +8 PV maximum, mais les Tavernes soignent deux fois moins.',mhp:8,restMul:.5},
  masque:{n:'Masque de troll',ic:'🎭',r:'m',tx:'Maudite. Tes créatures arrivent avec +1 PV, mais l’adversaire commence avec 1 Démoflux maximum de plus.',rx:{hpPlus:1},ecap:1}};
const XRELK=Object.keys(XREL);

// ---------- cartes maudites (événements) : des sorts qui ne font rien ----------
Object.assign(CARDS,{
  xcurse1:{t:'s',n:'Ping fantôme',r:1,c:1,tok:1,fx:[],tx:'Malédiction. Ne fait rien. Le Marchand peut la retirer de ton deck.',sym:'👻',col:'#5a5f6e',lore:'Une notification qui n’existe pas. Tu la vérifies quand même.'},
  xcurse2:{t:'s',n:'Mise à jour forcée',r:1,c:2,tok:1,fx:[],tx:'Malédiction. Ne fait rien. Le Marchand peut la retirer de ton deck.',sym:'⌛',col:'#5a5f6e',lore:'« Redémarrage nécessaire. » Évidemment, pendant le combat.'}});
CARDS.xcurse1.k='xcurse1';CARDS.xcurse2.k='xcurse2';
const XCURSE=['xcurse1','xcurse2'];

// ---------- ennemis ----------
const XNAMES=[['Marchand louche','Bouftou enragé','Arnaqueur du Bazar','Pickpocket d’Astrub','Bot de spam','Troll du salon'],
  ['Sbire de la Faille','Jungler perdu','Support toxique','Feeder repenti','Smurf masqué','Main Yasuo'],
  ['Campeur de Dust','Rusheur du B','Joueur à 300 ms','Ancien pro','Planteur de bombe','AWPer silencieux']];
// élites : un personnage, sa règle (P.rx du camp ennemi)
const XELITE=[
  [{b:'korock',tx:'Insultes : chaque fois qu’une de tes créatures meurt, tu perds 1 PV.',rx:{ping:1}},
   {b:'gobi',tx:'Collection : commence avec 2 Dofus légendaires.',rx:{dofus:2}},
   {b:'snoux',tx:'Le face, c’est la place : ses créatures ont +1 ATK.',rx:{atk:1}}],
  [{b:'lanfear',tx:'Express : toutes ses créatures arrivent avec Hâte.',rx:{hasteAll:1}},
   {b:'elkatrix',tx:'Unleashed : ses créatures arrivent avec +2 PV.',rx:{hpPlus:2}},
   {b:'lisdoon',tx:'Gomuscu : commence avec 1 Démoflux maximum et 3 Or de plus.',rx:{cap:1,or:3}}],
  [{b:'sadamie',tx:'Highroller : pioche 1 carte de plus à chaque tour.',rx:{drawTurn:1}},
   {b:'xulyes',tx:'Commandant : ton premier sort est annulé et sa première créature morte revient en main.',rx:{counter:1,replay:1}},
   {b:'takk',tx:'Pourquoi il est mort ? Au début de chacun de ses tours, 1 dégât à ta créature la plus forte.',rx:{snipe:1}}]];
// boss : 2 candidats par acte, puis le Raid final (et, au Tilt 10, un second boss)
const XBOSS=[
  [{b:'orga',k:'orga3',tx:'Trouve toujours un truc : un événement du Bazar au hasard se produit au début de chacun de ses tours.',rx:{evTurn:'orga3'}},
   {b:'coach',k:'coach3',tx:'Go go go : toutes ses créatures arrivent avec Hâte.',rx:{hasteAll:1}}],
  [{b:'saja',k:'saja3',tx:'Balance : au début de chacun de ses tours, ta créature la plus à gauche perd −1/−1 et la sienne la plus à droite gagne +1/+1.',rx:{balance:1}},
   {b:'haddmi',k:'haddmi3',tx:'Sniper d’élite : au début de chacun de ses tours, 2 dégâts à ta créature la plus forte.',rx:{snipe:2}}],
  [{b:'kirua',k:'kirua1',tx:'Crash du serveur : tous les 3 tours, ta créature la plus chère retourne dans ta main.',rx:{crash:3}},
   {b:'simon',k:'simon3',tx:'Rusheur de ligue : pioche 1 carte de plus à chaque tour.',rx:{drawTurn:1}}],
  [{b:'minuit',k:'minuit3',hp:40,tx:'Chef de raid : à 20 PV, elle appelle son raid (2 créatures) et ses créatures gagnent +1/+1.',rx:{phase:{at:20,sum:2,buff:1,raid:1,tx:'appelle son raid !'}}},
   {b:'bambou',k:'bambou3',hp:35,tx:'Grand Reformatage : à 15 PV, toutes tes créatures sont détruites.',rx:{phase:{at:15,wipe:1,tx:'lance le Grand Reformatage !'}}}]];

// ---------- niveaux de Tilt ----------
const XTILT=['Les élites ont 5 PV de plus.','−25 % d’Or d’expédition.','Les ennemis commencent chaque combat avec 1 Démoflux maximum de plus.',
  'Les Tavernes soignent 20 % au lieu de 30 %.','Les boss des actes 1 et 2 ont une 2e phase.','Tu commences avec une relique maudite au hasard.',
  'Les combats normaux de l’acte 3 ont aussi une règle d’élite.','−5 PV maximum.','Les récompenses de combat proposent 2 cartes au lieu de 3.','Le Raid final enchaîne deux boss.'];

// ---------- hasard de la course ----------
function xRnd(run){let t=(run.rs=(run.rs+0x6D2B79F5)>>>0);t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}
function xInt(run,n){return Math.floor(xRnd(run)*n)}
function xPick(run,a){return a.length?a[xInt(run,a.length)]:null}
function xShuf(run,a){for(let i=a.length-1;i>0;i--){const j=xInt(run,i+1);const t=a[i];a[i]=a[j];a[j]=t}return a}
function xHash(s){let x=2166136261;for(let i=0;i<s.length;i++){x^=s.charCodeAt(i);x=Math.imul(x,16777619)>>>0}return x}

// ---------- cartes améliorées (forgemagie) : clé_u = +1/+1, clé_c = −1 coût ----------
function xBase(k){return String(k).replace(/_[uc]$/,'')}
function xUpOf(k){const m=/_([uc])$/.exec(String(k));return m?m[1]:null}
function xEnsure(k){if(CARDS[k])return k;const b=xBase(k),u=xUpOf(k),cd=CARDS[b];if(!cd||!u)return null;
  const n=Object.assign({},cd,{k,up:u,upOf:b,art:(typeof ART!=='undefined'&&ART[b])?b:cd.art});
  if(u==='u'){n.a=cd.a+1;n.h=cd.h+1}else n.c=Math.max(0,cd.c-1);CARDS[k]=n;return k}
function xUpOpts(k){if(xUpOf(k)||!CARDS[k]||CARDS[k].tok)return[];const cd=CARDS[k],o=[];if(cd.t==='c')o.push('u');if(cd.c>=(cd.t==='c'?3:1))o.push('c');return o}
function xUpTx(k,u){const cd=CARDS[k];return u==='u'?'+1/+1 ('+cd.a+'/'+cd.h+' → '+(cd.a+1)+'/'+(cd.h+1)+')':'−1 coût ('+cd.c+' → '+(cd.c-1)+')'}
function xIsFam(k,f){const cd=CARDS[k];return cd.t==='c'?(cd.fac||[]).indexOf(f)>=0:cd.fam===f}

// ---------- état sauvegardé ----------
function expFix(x){x=x&&typeof x==='object'?x:{};
  const m=x.meta&&typeof x.meta==='object'?x.meta:{};
  x.meta={xp:Math.max(0,m.xp|0),runs:m.runs|0,wins:m.wins|0,tilt:Math.min(10,Math.max(0,m.tilt|0)),best:m.best|0,unl:Object.assign({},m.unl||{}),
    codex:{r:Object.assign({},(m.codex&&m.codex.r)||{}),e:Object.assign({},(m.codex&&m.codex.e)||{}),b:Object.assign({},(m.codex&&m.codex.b)||{})},
    daily:m.daily&&typeof m.daily==='object'?m.daily:{d:'',done:0,best:0,won:0},hist:Array.isArray(m.hist)?m.hist.slice(0,10):[]};
  if(x.run&&(typeof x.run!=='object'||x.run.v!==XPVER||!Array.isArray(x.run.deck)))x.run=null;
  if(x.run)x.run.deck=x.run.deck.filter(k=>xEnsure(k));
  return x}
function XS(){if(!S.exped)S.exped=expFix(null);return S.exped}
function xLevel(xp){let l=1;for(let i=1;i<EXP.xpLv.length;i++)if(xp>=EXP.xpLv[i])l=i+1;return l}
function xPatOk(p){const P=XPAT[p],M=XS().meta;return!P.unl||!!M.unl[P.unl]}
function xRelPool(run,rar){const lv=run.daily?99:xLevel(XS().meta.xp);return XRELK.filter(id=>XREL[id].r===rar&&(XREL[id].lv||1)<=lv&&run.relics.indexOf(id)<0)}

// ---------- effets cumulés de la course ----------
function xHas(run,id){return run.relics.indexOf(id)>=0}
function xSum(run,key){let v=0;for(const id of run.relics){const R=XREL[id];if(R&&R[key])v+=R[key]}const P=XPAT[run.pat];if(P&&P[key])v+=P[key];return v}
function xGoldMul(run){return Math.max(.25,1+xSum(run,'gold')-(run.tilt>=2?.25:0))}
function xShopMul(run){return Math.max(.3,1+xSum(run,'shop'))}
function xRx(run){const rx={src:{}};const add=(fx,src)=>{if(!fx)return;for(const k in fx){const v=fx[k];if(typeof v==='number')rx[k]=(rx[k]||0)+v;else rx[k]=v;if(!rx.src[k])rx.src[k]=src}};
  add(XPAT[run.pat].rx,'x:pat:'+run.pat);for(const id of run.relics)add(XREL[id].rx,'x:'+id);return rx}

// ---------- nouvelle course ----------
function xStarter(run){const P=XPAT[run.pat],coll={};POOL.forEach(k=>{if(CARDS[k].r===1)coll[k]={n:2}});
  const d=autoDeck(coll,P.fam,EXP.deck0-1,(run.seed%9973)+1);
  const R2=POOL.filter(k=>CARDS[k].r===2&&xIsFam(k,P.fam)&&CARDS[k].c<=5);d.push(xPick(run,R2)||xPick(run,POOL.filter(k=>CARDS[k].r===2)));return d}
function xNewRun(o){
  const seed=o.seed>>>0||((Math.random()*4294967296)>>>0),run={v:XPVER,seed,rs:seed,daily:o.daily?o.date:'',tilt:o.daily?0:(o.tilt|0),pat:o.pat,
    act:0,map:null,row:-1,col:-1,node:null,relics:[],gold:0,deck:[],rmCost:EXP.rmCost,stats:{fights:0,elites:0,bosses:0,floors:0,dmg:0,cards:0},
    bossOf:[],final:0,t0:Date.now(),over:null};
  run.mhp=EXP.hp+(XPAT[run.pat].hp||0)-(run.tilt>=8?5:0);run.hp=run.mhp;
  run.deck=xStarter(run);
  run.bossOf=[0,1,2].map(a=>xInt(run,XBOSS[a].length));
  if(run.tilt>=6)xGainRelic(run,xPick(run,XRELK.filter(id=>XREL[id].r==='m')));
  xNewAct(run);return run}
function xGainRelic(run,id){const R=XREL[id];if(!R||xHas(run,id))return;run.relics.push(id);XS().meta.codex.r[id]=1;
  if(R.mhp){run.mhp+=R.mhp;run.hp+=R.mhp}if(R.full)run.hp=run.mhp;if(R.goldNow)run.gold+=R.goldNow}
function xForgeRandom(run){const L=run.deck.map((k,i)=>[k,i]).filter(x=>xUpOpts(x[0]).length);if(!L.length)return null;const [k,i]=xPick(run,L),o=xUpOpts(k);const u=o[0];run.deck[i]=xEnsure(k+'_'+u);return run.deck[i]}

// ---------- carte d'un acte : 7 étages, 3 ou 4 cases par étage, chemins vers les cases voisines ----------
function xNewAct(run){
  const rows=[];
  for(let r=0;r<EXP.floors;r++){const n=r===0||r===EXP.floors-1?3:3+xInt(run,2),cols=xShuf(run,[0,1,2,3]).slice(0,n).sort((a,b)=>a-b);
    rows.push(cols.map(c=>({c,t:'fight',to:[]})))}
  // types : 1er étage = combats, dernier = Tavernes, au milieu au hasard (élites dès l'étage 3, un coffre garanti à l'étage 4)
  for(let r=1;r<EXP.floors-1;r++)rows[r].forEach(nd=>{const x=xRnd(run);
    nd.t=x<.42?'fight':x<.64?'event':x<.76&&r>=2?'elite':x<.86&&r>=2?'shop':x<.95&&r>=2?'rest':x<.97?'chest':'fight'});
  rows[EXP.floors-1].forEach(nd=>nd.t='rest');
  rows[3][xInt(run,rows[3].length)].t='chest';
  for(let r=0;r<EXP.floors-1;r++){const A=rows[r],B=rows[r+1];
    A.forEach(nd=>{B.forEach((m,j)=>{if(Math.abs(m.c-nd.c)<=1&&xRnd(run)<.75)nd.to.push(j)});
      if(!nd.to.length){let bj=0;B.forEach((m,j)=>{if(Math.abs(m.c-nd.c)<Math.abs(B[bj].c-nd.c))bj=j});nd.to.push(bj)}});
    B.forEach((m,j)=>{if(!A.some(nd=>nd.to.indexOf(j)>=0)){let bi=0;A.forEach((nd,i)=>{if(Math.abs(nd.c-m.c)<Math.abs(A[bi].c-m.c))bi=i});A[bi].to.push(j)}});
    A.forEach(nd=>nd.to.sort((a,b)=>a-b))}
  run.map=rows;run.row=-1;run.col=-1;run.node=null;
  if(xSum(run,'forge')&&run.act>0)xForgeRandom(run)}
// cases accessibles depuis la position actuelle
function xGiftOffer(run){const out=[];for(let j=0;j<3;j++){const L=POOL.filter(k=>CARDS[k].r>=2&&out.indexOf(k)<0&&!(CARDS[k].fam&&CARDS[k].fam!==XPAT[run.pat].fam));out.push(xPick(run,L))}return out}
function xNext(run){if(run.act>=3)return run.over?[]:['boss'];if(run.row<0)return run.map[0].map((_,j)=>j);if(run.row>=EXP.floors-1)return['boss'];return run.map[run.row][run.col].to.slice()}

// ---------- combats ----------
const XAI=[0,{ms:120,roll:1,hide:1,topK:4},'strong'];
function xLvlColl(L,run){const coll={};POOL.forEach(k=>{const r=CARDS[k].r;coll[k]={n:L===0?(r===1?2:0):L===1?(r<=2?2:0):L===2?(r<=2?2:0):(r===3?1:2)}});
  if(L===0){const R2=xShuf(run,POOL.filter(k=>CARDS[k].r===2)).slice(0,3);R2.forEach(k=>coll[k].n=1)}
  if(L===2){const R3=xShuf(run,POOL.filter(k=>CARDS[k].r===3)).slice(0,4);R3.forEach(k=>coll[k].n=1)}
  return coll}
function xFamOf(b){const f=(CARDS[b+'3']||CARDS[b+'1']).fac||[];return f.find(x=>ARCH[x])||'ravages'}
// prépare le combat de la case (une fois : il est rejoué à l'identique si la page est rechargée)
function xMakeFight(run,kind){
  const a=Math.min(run.act,2),seed=(xRnd(run)*4294967296)>>>0,F={kind,seed,act:run.act};
  if(kind==='boss'){const B=run.act>=3?XBOSS[3][run.final]:XBOSS[a][run.bossOf[a]];F.b=B.b;F.bk=B.k;F.nm=fullName(B.k);F.rule=B.tx;F.rx=JSON.parse(JSON.stringify(B.rx));
    F.hp=B.hp||EXP.ehp.boss[a];F.L=run.act>=3?3:EXP.lvl.boss[a];F.ai=run.act>=3?2:EXP.ai.boss[a];F.arch=xFamOf(B.b);
    if(run.tilt>=5&&run.act<2)F.rx.phase={at:Math.ceil(F.hp/2),buff:1,heal:5,tx:'entre en rage !'}}
  else if(kind==='elite'){const E=xPick(run,XELITE[a]);F.b=E.b;F.bk=E.b+'3';F.nm=CARDS[E.b+'3'].n+' (élite)';F.rule=E.tx;F.rx=Object.assign({},E.rx);
    F.hp=EXP.ehp.elite[a]+(run.tilt>=1?5:0);F.L=EXP.lvl.elite[a];F.ai=EXP.ai.elite[a];F.arch=xFamOf(E.b)}
  else{F.nm=xPick(run,XNAMES[a]);F.hp=EXP.ehp.normal[a];F.L=EXP.lvl.normal[a];F.ai=EXP.ai.normal[a];F.arch=xPick(run,ARCHK);F.rx={};
    if(run.tilt>=7&&a===2){const E=xPick(run,XELITE[2]);F.rule=E.tx;Object.assign(F.rx,E.rx)}}
  if(run.tilt>=3)F.rx.cap=(F.rx.cap||0)+1;
  if(xSum(run,'ecap'))F.rx.cap=(F.rx.cap||0)+xSum(run,'ecap');
  if(F.rx.phase&&F.rx.phase.raid)F.rx.phase.pool=POOL.filter(k=>CARDS[k].t==='c'&&CARDS[k].r<=2&&CARDS[k].c<=4&&(CARDS[k].sc||{}).wow===2);
  // deck ennemi
  const coll=xLvlColl(F.L,run);let d=autoDeck(coll,F.arch,ECON.deck,(seed%9973)+1);
  if(F.b){const inj=[];[1,2,3].forEach(r=>{const k=F.b+r;if(CARDS[k])for(let j=0;j<(r===3?1:2);j++)inj.push(k)});d=d.filter(k=>CARDS[k].base!==F.b).slice(0,ECON.deck-inj.length).concat(inj)}
  F.deck=d;F.av=typeof AVATARS!=='undefined'?xPick(run,AVATARS.map(x=>x[0])):'';
  const src=F.bk||(F.rule?'x:foe':'x:tilt');F.rx.src={};for(const k in F.rx)if(k!=='src')F.rx.src[k]=src;   // historique : la carte du boss ou de l'élite, sinon le Tilt
  return F}
function xFightCfg(run,F){
  const deck=run.deck.map(k=>xEnsure(k)).filter(Boolean),o=Object.assign({},OPTDEF,{rw:0,exped:1,tim:0,evt:0,tg:EXP.tg[Math.min(F.act,3)]});
  const first=xHas(run,'box')?1:xHas(run,'ping5')?0:null;
  return{names:[(typeof S!=='undefined'&&S&&S.name)||'Toi',F.nm],avs:[(typeof S!=='undefined'&&S&&S.av)||'',F.av],decks:[deck,F.deck.slice()],seed:F.seed,o,mull:true,first,
    hp:[run.hp,F.hp],mhp:[run.mhp,F.hp],rx:[xRx(run),F.rx]}}
function xAiSeat(run,F){const W=WGT[(ARCH[F.arch]||ARCH.ravages).w],lv=XAI[F.ai];
  const strong=lv==='strong'?(xHas(run,'vpn')?Object.assign({},MCTS_STRONG,{hide:1}):true):lv||0;return{kind:'ai',W,strong}}

// ---------- récompenses ----------
function xRollCards(run,kind){const n=Math.max(1,3+xSum(run,'pick')-(run.tilt>=9?1:0)),out=[],fam=XPAT[run.pat].fam;
  for(let j=0;j<n;j++){const x=xRnd(run),r=kind==='boss'?3:kind==='elite'?(x<.3?1:x<.8?2:3):(x<.6?1:x<.93?2:3);
    let L=POOL.filter(k=>CARDS[k].r===r&&out.indexOf(k)<0&&!(CARDS[k].fam&&CARDS[k].fam!==fam));
    if(xRnd(run)<.4){const Fm=L.filter(k=>xIsFam(k,fam));if(Fm.length)L=Fm}
    const k=xPick(run,L);if(k)out.push(k)}
  return out}
function xRollRelics(run,n,rar){const out=[];for(let j=0;j<n;j++){const r=rar||(xRnd(run)<.6?'c':'r');let L=xRelPool(run,r).filter(id=>out.indexOf(id)<0);
  if(!L.length)L=xRelPool(run,r==='c'?'r':'c').filter(id=>out.indexOf(id)<0);const id=xPick(run,L);if(id)out.push(id)}return out}
function xGoldFor(run,kind){const a=Math.min(run.act,2),b=kind==='boss'?70+xInt(run,21):kind==='elite'?30+xInt(run,15)+5*a:15+xInt(run,11)+5*a;return Math.round(b*xGoldMul(run))}

// ---------- entrer dans une case ----------
function xEnter(run,j){
  if(j==='boss'){run.node={t:'boss',st:'fight',F:xMakeFight(run,'boss')};XS().meta.codex.b[run.node.F.b]=Math.max(XS().meta.codex.b[run.node.F.b]||0,1);return}
  const nd=run.map[run.row+1][j];run.row++;run.col=j;run.stats.floors++;
  if(nd.t==='fight'||nd.t==='elite')run.node={t:nd.t,st:'fight',F:xMakeFight(run,nd.t==='elite'?'elite':'normal')};
  else if(nd.t==='event'){const L=XEV.filter(e=>!e.req||e.req(run)),pool=L.filter(e=>(run.seenEv||[]).indexOf(e.id)<0),e=xPick(run,pool.length?pool:L);
    run.seenEv=(run.seenEv||[]).concat([e.id]);XS().meta.codex.e[e.id]=1;run.node={t:'event',st:'event',ev:e.id}}
  else if(nd.t==='shop')run.node={t:'shop',st:'shop',shop:xMakeShop(run)};
  else if(nd.t==='rest')run.node={t:'rest',st:'rest'};
  else if(nd.t==='chest'){const r=xRnd(run)<.12?'b':xRnd(run)<.45?'r':'c';run.node={t:'chest',st:'chest',rel:xRollRelics(run,1,r)[0]||null,gold:Math.round((20+xInt(run,21))*xGoldMul(run))}}}
function xMakeShop(run){const m=xShopMul(run),pr=b=>Math.round(b*(0.9+xRnd(run)*.2)*m),cards=[],fam=XPAT[run.pat].fam;
  [1,1,2,2,3].forEach(r=>{let L=POOL.filter(k=>CARDS[k].r===r&&cards.every(c=>c.k!==k)&&!(CARDS[k].fam&&CARDS[k].fam!==fam));if(xRnd(run)<.4){const Fm=L.filter(k=>xIsFam(k,fam));if(Fm.length)L=Fm}
    const k=xPick(run,L);if(k)cards.push({k,p:pr([0,35,60,110][r])})});
  const rel=xRollRelics(run,2).map(id=>({id,p:pr(XREL[id].r==='r'?140:90)}));
  return{cards,rel,rm:Math.round(run.rmCost*m)}}
function xRestHeal(run){let f=(run.tilt>=4?.2:.3)+xSum(run,'rest');let v=Math.round(run.mhp*f)+(XPAT[run.pat].restFlat||0);for(const id of run.relics)if(XREL[id].restMul)v=Math.round(v*XREL[id].restMul);return Math.max(1,v)}

// ---------- fin d'un combat ----------
// w : 1 victoire, 0 défaite ; hp : PV restants du joueur
function xFightDone(run,w,hp,dealt){const nd=run.node;if(!nd||nd.st!=='fight')return null;const F=nd.F;run.stats.fights++;
  if(!w){run.hp=0;return xEndRun(run,0,F.nm)}
  run.stats.dmg+=Math.max(0,run.hp-hp);run.hp=Math.max(1,Math.min(run.mhp,hp));
  const heal=xSum(run,'healWin');if(heal)run.hp=Math.min(run.mhp,run.hp+heal);
  const kind=F.kind,gold=xGoldFor(run,kind);run.gold+=gold;
  const rw={gold,heal,cards:xRollCards(run,kind),rel:[],gems:0,took:null};
  if(kind==='elite'){run.stats.elites++;rw.rel=xRollRelics(run,2)}
  if(kind==='boss'){run.stats.bosses++;const M=XS().meta;M.codex.b[F.b]=2;
    if(run.act<3){rw.rel=xRollRelics(run,3,'b');if(run.act<2)rw.full=1;M.unl['boss'+(run.act+1)]=1;rw.gems=EXP.gems[run.act]}
    else rw.gems=0}
  if(rw.gems&&!run.daily){S.gems+=rw.gems;run.gems=(run.gems||0)+rw.gems}
  run.node={t:nd.t,st:'reward',rw,F:{nm:F.nm,kind,b:F.b,bk:F.bk}};
  if(kind==='boss'&&run.act>=3){if(run.tilt>=10&&run.final===0){run.node.rw.next=1}else return xEndRun(run,1,null)}
  return run.node}
// la récompense est prise : case suivante (ou acte suivant après un boss)
function xLeaveNode(run){const nd=run.node;if(!nd)return;
  if(nd.t==='boss'){
    if(run.act>=3){if(nd.rw&&nd.rw.next){run.final=1;run.node={t:'boss',st:'fight',F:xMakeFight(run,'boss')};XS().meta.codex.b[run.node.F.b]=Math.max(XS().meta.codex.b[run.node.F.b]||0,1);return}return}
    if(nd.rw&&nd.rw.full)run.hp=run.mhp;
    run.act++;if(run.act<3)xNewAct(run);else{run.map=null;run.node=null;if(xSum(run,'forge'))xForgeRandom(run)}return}
  run.node=null}
function xScore(run,won){return run.stats.floors*100+run.stats.bosses*250+(won?1000+run.hp*5:0)+run.tilt*150}
function xEndRun(run,won,by){const M=XS().meta;if(run.over)return run.node;
  const xp=run.stats.floors*5+run.stats.bosses*25+(won?100+20*run.tilt:0),lv0=xLevel(M.xp);M.xp+=xp;M.runs++;
  const unl=[];if(won){M.wins++;if(!M.unl.win){M.unl.win=1;unl.push('alien')}if(run.tilt>=3&&!M.unl.tilt3){M.unl.tilt3=1;unl.push('xeno')}
    if(!run.daily&&run.tilt>=M.tilt&&M.tilt<10)M.tilt=run.tilt+1;}
  let gems=0;if(won&&!run.daily){gems=EXP.gemRaid+EXP.gemTilt*run.tilt;S.gems+=gems}
  const score=xScore(run,won);M.best=Math.max(M.best,score);
  if(run.daily){const D=M.daily;D.d=run.daily;D.done=1;D.best=Math.max(D.best|0,score);if(won&&!D.won){D.won=1;S.gems+=EXP.gemDaily;gems+=EXP.gemDaily}}
  run.over={won:won?1:0,by,xp,lv:xLevel(M.xp),lvUp:xLevel(M.xp)>lv0,gems:gems+(run.gems||0),score,unl,act:run.act,floor:run.stats.floors};
  M.hist.unshift({d:Date.now(),pat:run.pat,won:won?1:0,act:run.act,fl:run.stats.floors,tilt:run.tilt,score,daily:run.daily?1:0,by:by||''});M.hist=M.hist.slice(0,10);
  run.node={t:'over',st:'over'};return run.node}

// ---------- événements du Bazar (narratifs) ----------
// chaque choix : t (libellé), ok(run) facultatif, go(run) → texte du résultat, ou {pick:{m,n}} pour choisir des cartes du deck
const XEV=[
  {id:'pizza',n:'Soirée pizza',ic:'🍕',tx:'Une boîte de pizza encore tiède traîne dans le salon vocal. Personne ne la réclame.',c:[
    {t:'Manger une part (récupère 12 PV)',go:r=>{const v=Math.min(12,r.mhp-r.hp);r.hp+=v;return'Tu récupères '+v+' PV.'}},
    {t:'Emporter la boîte (ajoute Pizza à ton deck, récupère 4 PV)',go:r=>{r.deck.push('pizza');r.hp=Math.min(r.mhp,r.hp+4);return'Pizza rejoint ton deck.'}}]},
  {id:'afk',n:'Le modo est AFK',ic:'😴',tx:'Le modérateur s’est endormi devant son écran. Sa vitrine d’objets confisqués est grande ouverte.',c:[
    {t:'Se servir (relique maudite au hasard)',go:r=>{const id=xPick(r,XRELK.filter(x=>XREL[x].r==='m'&&!xHas(r,x)));if(!id)return'La vitrine est vide.';xGainRelic(r,id);return'Tu obtiens '+XREL[id].n+'.'}},
    {t:'Ne rien toucher',go:()=>'Tu repars sur la pointe des pieds.'}]},
  {id:'panne',n:'Panne de Discord',ic:'🔌',tx:'Le serveur tombe. Le temps qu’il redémarre, tu peux faire le tri dans tes affaires.',c:[
    {t:'Faire le ménage (retire 2 cartes de ton deck)',ok:r=>r.deck.length>5,go:()=>({pick:{m:'rm',n:2}})},
    {t:'Copier une carte (perds 6 PV, duplique une carte)',ok:r=>r.hp>6,go:r=>{r.hp-=6;return{pick:{m:'dup',n:1}}}}]},
  {id:'louche',n:'Marchand louche',ic:'🧥',tx:'« Psst. Une relique, pas chère, tombée du camion. »',c:[
    {t:'Payer 40 Or (relique commune)',ok:r=>r.gold>=40,go:r=>{r.gold-=40;const id=xRollRelics(r,1,'c')[0];if(!id)return'Il n’a plus rien.';xGainRelic(r,id);return'Tu obtiens '+XREL[id].n+'.'}},
    {t:'Le voler (relique rare, mais Ping fantôme dans ton deck)',go:r=>{const id=xRollRelics(r,1,'r')[0];r.deck.push('xcurse1');if(!id)return'Il n’avait rien.';xGainRelic(r,id);return'Tu obtiens '+XREL[id].n+'… et un Ping fantôme.'}},
    {t:'Passer ton chemin',go:()=>'Tu ignores le marchand.'}]},
  {id:'give',n:'Giveaway',ic:'🎁',tx:'Un streamer fait gagner des cartes à ses viewers. Tu es tiré au sort !',c:[
    {t:'Choisir une carte rare ou légendaire',go:r=>({pick:{m:'gift',n:1,offer:xGiftOffer(r)}})},
    {t:'Prendre 35 Or',go:r=>{r.gold+=35;return'+35 Or.'}}]},
  {id:'banwave',n:'Ban wave',ic:'🔨',tx:'Une vague de bannissements frappe le serveur. Ta carte la plus chère est dans le viseur.',c:[
    {t:'La sacrifier (retire ta carte la plus chère, +60 Or)',go:r=>{let bi=0;r.deck.forEach((k,i)=>{if(CARDS[xEnsure(k)].c>CARDS[xEnsure(r.deck[bi])].c)bi=i});const k=r.deck.splice(bi,1)[0];r.gold+=60;return fullName(k)+' est bannie. +60 Or.'}},
    {t:'Faire profil bas (perds 5 PV)',go:r=>{r.hp=Math.max(1,r.hp-5);return'Tu perds 5 PV.'}}]},
  {id:'trolls',n:'Raid de trolls',ic:'👹',tx:'Une bande de trolls bloque le passage et réclame un droit de péage.',c:[
    {t:'Se battre (perds 8 PV, relique commune)',ok:r=>r.hp>8,go:r=>{r.hp-=8;const id=xRollRelics(r,1,'c')[0];if(id)xGainRelic(r,id);return id?'Tu gagnes '+XREL[id].n+'.':'Ils n’avaient rien.'}},
    {t:'Payer (perds 25 Or)',ok:r=>r.gold>=25,go:r=>{r.gold-=25;return'Tu passes, 25 Or plus léger.'}},
    {t:'Fuir (ajoute Mise à jour forcée à ton deck)',go:r=>{r.deck.push('xcurse2');return'Tu t’enfuis, mais ton client plante.'}}]},
  {id:'nitro',n:'Nitro offert',ic:'💎',tx:'Quelqu’un t’offre un mois de Nitro. Tes cartes brillent.',c:[
    {t:'Améliorer 2 cartes au hasard',go:r=>{const a=xForgeRandom(r),b=xForgeRandom(r);return[a,b].filter(Boolean).map(k=>fullName(k)+' ★').join(', ')+' : améliorée'+(a&&b?'s':'')+'.'}},
    {t:'Le revendre (+50 Or)',go:r=>{r.gold+=50;return'+50 Or.'}}]},
  {id:'vieux',n:'Le vieux membre',ic:'🧓',tx:'Un ancien du serveur raconte l’époque où tout était mieux avant.',c:[
    {t:'L’écouter (ajoute une carte Vestige au hasard)',go:r=>{const k=xPick(r,POOL.filter(x=>xIsFam(x,'vestige')&&CARDS[x].r<=2));r.deck.push(k);return fullName(k)+' rejoint ton deck.'}},
    {t:'Lui offrir un café (+5 PV maximum)',go:r=>{r.mhp+=5;r.hp+=5;return'+5 PV maximum.'}}]},
  {id:'andorre',n:'Duty free d’Andorre',ic:'🛍',tx:'Les rayons débordent de souvenirs à prix cassés.',c:[
    {t:'Payer 30 Or (2 cartes de ta famille)',ok:r=>r.gold>=30,go:r=>{r.gold-=30;const f=XPAT[r.pat].fam,L=POOL.filter(x=>xIsFam(x,f)&&CARDS[x].r<=2),a=xPick(r,L),b=xPick(r,L);r.deck.push(a,b);return fullName(a)+' et '+fullName(b)+' rejoignent ton deck.'}},
    {t:'Juste regarder',go:()=>'Tu repars les mains vides.'}]},
  {id:'lootbox',n:'Lootbox',ic:'📦',tx:'Une caisse scellée, garantie « au moins rare ». Probablement.',c:[
    {t:'L’ouvrir (50 Or : relique rare ou malédiction)',ok:r=>r.gold>=50,go:r=>{r.gold-=50;if(xRnd(r)<.55){const id=xRollRelics(r,1,'r')[0];if(id){xGainRelic(r,id);return'Jackpot : '+XREL[id].n+' !'}}r.deck.push(xPick(r,XCURSE));return'Raté : une malédiction rejoint ton deck.'}},
    {t:'La laisser',go:()=>'La caisse reste scellée.'}]},
  {id:'lan',n:'Tournoi de LAN',ic:'🏆',tx:'Un tournoi improvisé, une nuit blanche, un gros cashprize.',c:[
    {t:'Jouer toute la nuit (perds 10 PV, +100 Or)',ok:r=>r.hp>10,go:r=>{r.hp-=10;r.gold+=100;return'Tu remportes 100 Or, les yeux rouges.'}},
    {t:'Aller dormir',go:()=>'Une bonne nuit, ça n’a pas de prix.'}]},
  {id:'forge',n:'Forge de Bonta',ic:'⚒',tx:'Un forgemage te prête son atelier pour la soirée.',c:[
    {t:'Améliorer une carte de ton choix',ok:r=>r.deck.some(k=>xUpOpts(k).length),go:()=>({pick:{m:'up',n:1}})},
    {t:'Fondre une carte (retire-la de ton deck)',ok:r=>r.deck.length>5,go:()=>({pick:{m:'rm',n:1}})}]},
  {id:'kiwi',n:'Kiwi le chat',ic:'🐈',tx:'Le chat de Potatoll te fixe. Il a l’air d’attendre une caresse… ou pas.',c:[
    {t:'Le caresser',go:r=>{if(xRnd(r)<.5){const id=xRollRelics(r,1,'c')[0];if(id){xGainRelic(r,id);return'Il ronronne et te laisse '+XREL[id].n+'.'}}r.hp=Math.max(1,r.hp-5);return'Il te griffe : −5 PV.'}},
    {t:'Passer doucement',go:()=>'Kiwi te regarde partir avec mépris.'}]},
  {id:'mine',n:'Serveur Minecraft',ic:'⛏',tx:'Un vieux serveur Minecraft tourne encore. Ta base t’attend.',c:[
    {t:'Miner (+3 PV maximum)',go:r=>{r.mhp+=3;r.hp+=3;return'+3 PV maximum.'}},
    {t:'Dormir dans ton lit (récupère 30 % de tes PV)',go:r=>{const v=Math.min(r.mhp-r.hp,Math.round(r.mhp*.3));r.hp+=v;return'Tu récupères '+v+' PV.'}}]},
  {id:'smurf',n:'Compte smurf',ic:'🧢',tx:'Un compte de bas niveau, mais avec des cartes surprenantes.',c:[
    {t:'Échanger 3 cartes au hasard contre 3 autres',ok:r=>r.deck.length>=3,go:r=>{const out=[];for(let j=0;j<3;j++){const i=xInt(r,r.deck.length),old=xBase(r.deck[i]),rr=CARDS[old].tok?1:CARDS[old].r;const k=xPick(r,POOL.filter(x=>CARDS[x].r===rr&&!CARDS[x].fam));r.deck[i]=k;out.push(fullName(k))}return'Nouvelles cartes : '+out.join(', ')+'.'}},
    {t:'Ne pas y toucher',go:()=>'Tu gardes ton deck.'}]}];
const XEVK={};XEV.forEach(e=>XEVK[e.id]=e);
// applique un choix d'événement (hasard rejouable : la graine de la case est utilisée)
function xEvChoose(run,i){const nd=run.node,e=XEVK[nd.ev],ch=e&&e.c[i];if(!ch||nd.st!=='event'||(ch.ok&&!ch.ok(run)))return null;
  const r=ch.go(run);
  if(r&&typeof r==='object'&&r.pick){nd.st='pick';nd.pick=Object.assign({done:0,res:[]},r.pick);nd.ch=i;return nd}
  nd.st='done';nd.res=r||'';nd.ch=i;return nd}
// choix de cartes du deck : rm (retirer), dup (dupliquer), up (améliorer), gift (prendre parmi une offre)
function xPickApply(run,idx,u){const nd=run.node,p=nd.pick;if(!p)return null;
  if(p.m==='gift'){const k=p.offer[idx];if(!k)return null;run.deck.push(k);p.res.push(fullName(k));p.done=p.n}
  else{const k=run.deck[idx];if(k==null)return null;
    if(p.m==='rm'){run.deck.splice(idx,1);p.res.push(fullName(xEnsure(k))+' retirée')}
    else if(p.m==='dup'){run.deck.push(k);p.res.push(fullName(xEnsure(k))+' dupliquée')}
    else if(p.m==='up'){const o=xUpOpts(k);if(!o.length)return null;const v=o.indexOf(u)>=0?u:o[0];run.deck[idx]=xEnsure(k+'_'+v);p.res.push(fullName(k)+' ★ '+xUpTx(k,v))}
    p.done++}
  if(p.done>=p.n){if(nd.t==='shop'){nd.st='shop';nd.pick=null}else if(nd.t==='rest'){nd.st='done';nd.res=p.res.join(' · ')}else{nd.st='done';nd.res=p.res.join(' · ')}}
  return nd}
// libellé de la source d'un effet de course (historique du duel)
function xSrcInfo(src){const id=String(src||'').slice(2);
  if(id.slice(0,4)==='pat:'){const P=XPAT[id.slice(4)];return P?{ic:P.ic,n:P.n,c:'#d8b56c'}:null}
  if(XREL[id])return{ic:XREL[id].ic,n:XREL[id].n,c:XREL[id].r==='m'?'#c0506a':XREL[id].r==='b'?'#e0b04a':'#8fb27a'};
  if(id==='foe')return{ic:'💀',n:'Règle de l’adversaire',c:'#c45f5b'};if(id==='tilt')return{ic:'🔥',n:'Tilt',c:'#c45f5b'};return null}

// =====================================================================================
// ---------- interface ----------
// images du mode (png/ui/xp-*.webp) : à renseigner quand les illustrations sont ajoutées ; sinon un emoji les remplace
const XPIMG={'xp-defeat':1,'xp-ev-afk':1,'xp-ev-andorre':1,'xp-ev-banwave':1,'xp-ev-forge':1,'xp-ev-give':1,'xp-ev-kiwi':1,'xp-ev-lan':1,'xp-ev-lootbox':1,'xp-ev-louche':1,'xp-ev-mine':1,'xp-ev-nitro':1,'xp-ev-panne':1,'xp-ev-pizza':1,'xp-ev-smurf':1,'xp-ev-trolls':1,'xp-ev-vieux':1,'xp-gold':1,'xp-node-boss':1,'xp-node-chest':1,'xp-node-elite':1,'xp-node-event':1,'xp-node-fight':1,'xp-node-rest':1,'xp-node-shop':1,'xp-pat-alien':1,'xp-pat-expats':1,'xp-pat-farmer':1,'xp-pat-ravages':1,'xp-pat-toxic':1,'xp-pat-vestige':1,'xp-pat-weebos':1,'xp-pat-xeno':1,'xp-rel-box':1,'xp-rel-canette':1,'xp-rel-carton':1,'xp-rel-casque':1,'xp-rel-chaussons':1,'xp-rel-couronne':1,'xp-rel-dragodinde':1,'xp-rel-ego':1,'xp-rel-enclume':1,'xp-rel-fidelite':1,'xp-rel-lunettes':1,'xp-rel-marteau':1,'xp-rel-masque':1,'xp-rel-mug':1,'xp-rel-nitro':1,'xp-rel-oeuf':1,'xp-rel-ping5':1,'xp-rel-pizza':1,'xp-rel-pret':1,'xp-rel-replay':1,'xp-rel-sel':1,'xp-rel-serveur':1,'xp-rel-ticket':1,'xp-rel-tirelire':1,'xp-rel-usb':1,'xp-rel-valise':1,'xp-rel-vpn':1,'xp-rel-whey':1,'xp-rest-forge':1,'xp-rest-heal':1,'xp-victory':1};
function xIco(name,em,cls){return XPIMG[name]?uiIco(name,'xpim'+(cls?' '+cls:'')):h('span',{class:'xpem'+(cls?' '+cls:'')},em)}
const XNODE={fight:['⚔','Combat'],elite:['💀','Élite'],event:['🌀','Événement'],shop:['🛒','Marchand'],rest:['🍺','Taverne'],chest:['🎁','Coffre'],boss:['👑','Boss']};
const XAIN=['IA simple','IA calculatrice','IA experte'];
const XUI={pat:null,tilt:0};
function xSave(){saveS();refreshTop()}
function xRelIco(id,small){const R=XREL[id];return h('span',{class:'xrel kw r-'+R.r+(small?' sm':''),'data-t':R.n,'data-d':R.tx},xIco('xp-rel-'+id,R.ic))}
function xPatIco(p,cls){return xIco('xp-pat-'+p,XPAT[p].ic,cls)}
function xHpBar(hp,mhp){return h('div',{class:'xp-hp',title:hp+' / '+mhp+' PV'},h('i',{style:'width:'+Math.max(0,Math.min(100,hp/mhp*100))+'%'}),h('b',null,uiIco('ico-pv','ti'),' '+hp+' / '+mhp))}
function xCardName(k){return fullName(xEnsure(k)||k)+(xUpOf(k)?' ★':'')}
function xDailyKey(){return today()}
function xDailyPat(d){return XPATK[xHash('xp'+d)%XPATK.length]}

function vExped(v){const X=XS();if(X.run)X.run.deck.forEach(xEnsure);if(!X.run){xHub(v);return}xRunView(v,X.run)}

// ---------- accueil du mode ----------
function xHub(v){const M=XS().meta,lv=xLevel(M.xp),nx=EXP.xpLv[lv]||null,pv=EXP.xpLv[lv-1]||0;
  if(!XUI.pat||!xPatOk(XUI.pat))XUI.pat=XPATK.find(xPatOk);XUI.tilt=Math.min(XUI.tilt,M.tilt);
  const head=h('div',{class:'panel hl xp-head'},ph('🧭','Expédition','Niveau '+lv),
    h('p',{class:'mut sm',style:'line-height:1.55;margin:4px 0 10px'},'Un roguelite solo : tu pars avec un patron, ',h('b',null,EXP.deck0+' cartes'),' et ',h('b',null,EXP.hp+' PV'),'. Traverse les 3 actes du serveur sur une carte à embranchements, construis ton deck combat après combat et ramasse des reliques qui tordent les règles. Tes PV ne remontent pas tout seuls. Trois boss t’attendent, puis le Raid final. Toutes les cartes du jeu peuvent apparaître, quelle que soit ta collection. La course se sauvegarde après chaque étape.'),
    h('div',{class:'xp-lv'},h('b',null,'Niveau '+lv),h('div',{class:'bar'},h('i',{style:'width:'+(nx?Math.min(100,(M.xp-pv)/(nx-pv)*100):100)+'%'})),h('span',{class:'sm mut'},nx?M.xp+' / '+nx+' XP · le niveau suivant ajoute de nouvelles reliques':M.xp+' XP · niveau maximum'),
      h('span',{class:'sm'},M.wins+' victoire'+(M.wins>1?'s':'')+' · '+M.runs+' course'+(M.runs>1?'s':'')+(M.best?' · record '+M.best+' pts':''))));
  const pats=h('div',{class:'xp-pats'},XPATK.map(p=>{const P=XPAT[p],ok=xPatOk(p);
    return h('button',{class:'xp-pat'+(XUI.pat===p?' on':'')+(ok?'':' lock'),disabled:!ok,onclick:()=>{XUI.pat=p;go('exped')}},
      h('div',{class:'xp-pati'},xPatIco(p,'big'),famBadge(P.fam)),h('b',null,P.n),h('span',{class:'sm'},ok?P.tx:'🔒 '+P.ut))}));
  const tl=h('div',{class:'xp-tilt'},h('b',null,'Tilt'),Array.from({length:M.tilt+1},(_,t)=>h('span',{class:'chip'+(XUI.tilt===t?' on':''),onclick:()=>{XUI.tilt=t;go('exped')}},t?'🔥 '+t:'0')),
    M.tilt<10?h('span',{class:'sm mut'},'Termine une Expédition pour débloquer le Tilt '+(M.tilt+1)+'.'):null);
  const tlx=XUI.tilt?h('ul',{class:'xp-tiltl sm'},XTILT.slice(0,XUI.tilt).map((t,i)=>h('li',null,h('b',null,'Tilt '+(i+1)+' : '),t))):null;
  const start=h('div',{class:'panel'},ph('play','Nouvelle course'),pats,tl,tlx,
    h('div',{class:'row',style:'margin-top:14px'},h('button',{class:'btn gold big',onclick:()=>{XS().run=xNewRun({pat:XUI.pat,tilt:XUI.tilt});xSave();go('exped')}},'🧭 Partir en expédition avec '+XPAT[XUI.pat].n+(XUI.tilt?' · Tilt '+XUI.tilt:''))));
  const d=xDailyKey(),D=M.daily.d===d?M.daily:{done:0,best:0,won:0},dp=xDailyPat(d);
  const daily=h('div',{class:'panel xp-daily'},ph('📅','Défi du jour',d.split('-').reverse().join('/')),
    h('p',{class:'sm mut'},'Même patron, même carte, mêmes récompenses pour tout le monde aujourd’hui. Toutes les reliques sont disponibles, sans Tilt. Une seule tentative par jour : '+(EXP.gemDaily)+' 💎 si tu termines.'),
    h('div',{class:'xp-dpat'},xPatIco(dp,'big'),h('div',null,h('b',null,XPAT[dp].n),h('div',{class:'sm mut'},XPAT[dp].tx))),
    D.done?h('p',{class:'sm',style:'margin:10px 0 0'},(D.won?'✔ Défi réussi':'✕ Défi tenté')+' aujourd’hui · ton score : '+D.best+' pts. Reviens demain !'):
      h('button',{class:'btn pri',style:'margin-top:10px',onclick:()=>{XS().run=xNewRun({pat:dp,daily:1,date:d,seed:xHash('daily'+d)});xSave();go('exped')}},'Lancer le défi du jour'));
  const cx=M.codex,hist=M.hist;
  const side=h('div',null,daily,
    h('div',{class:'panel'},ph('📖','Codex'),h('p',{class:'sm mut'},'Reliques '+Object.keys(cx.r).length+' / '+XRELK.length+' · Événements '+Object.keys(cx.e).length+' / '+XEV.length+' · Boss vaincus '+Object.values(cx.b).filter(x=>x===2).length+' / '+XBOSS.flat().length),
      h('button',{class:'btn sm',onclick:xCodex},'Ouvrir le codex')),
    hist.length?h('div',{class:'panel'},ph('🪦','Dernières courses'),h('div',{class:'xp-hist'},hist.map(e=>h('div',{class:'xp-hrow'+(e.won?' w':'')},xPatIco(e.pat),
      h('span',null,(e.won?'🏆 Victoire':'✕ '+(e.by?'Éliminé par '+e.by:'Défaite'))+' · '+(e.won?'Raid final':'acte '+(Math.min(3,e.act)+1))+(e.tilt?' · Tilt '+e.tilt:'')+(e.daily?' · défi du jour':'')),h('b',null,e.score+' pts'))))):null);
  v.append(h('div',{class:'cols xp-cols'},h('div',null,head,start),side))}
function xCodex(){const cx=XS().meta.codex;
  modal(h('div',{class:'xp-codex'},h('h2',null,'📖 Codex de l’Expédition'),
    h('h3',null,'Reliques'),h('div',{class:'xp-cxg'},XRELK.map(id=>cx.r[id]?h('div',{class:'xp-cxi'},xRelIco(id),h('b',null,XREL[id].n),h('span',{class:'sm mut'},XREL[id].tx)):h('div',{class:'xp-cxi unk'},h('span',{class:'xrel'},'?'),h('b',null,'???'),h('span',{class:'sm mut'},XREL[id].lv>1?'Apparaît à partir du niveau '+XREL[id].lv+'.':'Pas encore trouvée.')))),
    h('h3',null,'Boss'),h('div',{class:'xp-cxg'},XBOSS.flat().map(B=>{const st=cx.b[B.b]||0;return h('div',{class:'xp-cxi'+(st?'':' unk')},st?h('span',{class:'xp-cxa'},miniAv(B.k)):h('span',{class:'xrel'},'?'),h('b',null,st?fullName(B.k):'???'),h('span',{class:'sm mut'},st?(st===2?'✔ Vaincu · ':'Rencontré · ')+B.tx:'Pas encore rencontré.'))})),
    h('h3',null,'Événements'),h('div',{class:'xp-cxg'},XEV.map(e=>cx.e[e.id]?h('div',{class:'xp-cxi'},XPIMG['xp-ev-'+e.id]?h('img',{class:'xp-cxe',src:uiSrc('xp-ev-'+e.id),alt:''}):h('span',{class:'xrel'},e.ic),h('b',null,e.n),h('span',{class:'sm mut'},e.tx)):h('div',{class:'xp-cxi unk'},h('span',{class:'xrel'},'?'),h('b',null,'???'),h('span',{class:'sm mut'},'Pas encore vécu.'))))))}

// ---------- course en cours ----------
function xTopBar(run){const P=XPAT[run.pat];
  return h('div',{class:'panel xp-top'},
    h('div',{class:'xp-who'},xPatIco(run.pat,'big'),h('div',null,h('b',null,P.n),h('div',{class:'sm mut'},run.daily?'Défi du jour':run.tilt?'Tilt '+run.tilt:'Tilt 0'))),
    xHpBar(run.hp,run.mhp),
    h('div',{class:'xp-gold',title:'Or d’expédition'},uiIco('ico-or','ti'),h('b',null,' '+run.gold)),
    h('div',{class:'xp-where'},h('b',null,run.act>=3?EXP.acts[3]:'Acte '+(run.act+1)+' · '+EXP.acts[run.act]),h('span',{class:'sm mut'},run.act>=3?'Dernier combat':'Étage '+Math.max(0,run.row+1)+' / '+EXP.floors)),
    h('div',{class:'xp-rels'},run.relics.length?run.relics.map(id=>xRelIco(id,true)):h('span',{class:'sm mut'},'Aucune relique')),
    h('div',{class:'xp-btns'},h('button',{class:'btn sm',onclick:()=>xDeckModal(run)},'🃏 Mon deck ('+run.deck.length+')'),
      run.over?null:h('button',{class:'btn sm',onclick:()=>ask('Abandonner l’expédition ?','La course s’arrête ici. Tu gardes l’XP et les 💎 déjà gagnés.',[{t:'Continuer'},{t:'Abandonner',c:'danger',f:()=>{xEndRun(run,0,'abandon');xSave();go('exped')}}])},'Abandonner')))}
function xDeckSort(a,b){const A=CARDS[xEnsure(a)],B=CARDS[xEnsure(b)];return A.c-B.c||B.r-A.r||fullName(A).localeCompare(fullName(B))}
function xDeckList(deck,onPick,filt){const idx=deck.map((k,i)=>i).filter(i=>!filt||filt(deck[i])).sort((x,y)=>xDeckSort(deck[x],deck[y]));
  return h('div',{class:'xp-deck'},idx.map(i=>{const k=xEnsure(deck[i]);return h('div',{class:'xp-dc'+(onPick?' pk':''),onclick:()=>onPick?onPick(i):showCard(k),oncontextmenu:e=>{e.preventDefault();showCard(k)}},cardEl(k,{}),xUpOf(k)?h('i',{class:'xp-star'},'★'):null)}))}
function xDeckModal(run){modal(h('div',{class:'xp-dm'},h('h2',null,'🃏 Ton deck ('+run.deck.length+' cartes)'),h('p',{class:'sm mut'},'Clique sur une carte pour sa fiche. ★ = carte améliorée par la forgemagie.'),xDeckList(run.deck)))}
function xRunView(v,run){const nd=run.node;v.append(xTopBar(run));const main=h('div',{class:'xp-main'});v.append(main);
  if(!nd){main.append(run.act>=3?xFinalEl(run):xMapEl(run));return}
  const f={fight:xFightEl,reward:xRewardEl,event:xEventEl,pick:xPickEl,done:xDoneEl,shop:xShopEl,rest:xRestEl,chest:xChestEl,over:xOverEl}[nd.st];
  main.append(f?f(run,nd):h('p',null,'…'))}

// carte de l'acte, de gauche à droite : le départ à gauche, le boss à droite ; seules les cases reliées à ta position sont cliquables
function xMapEl(run){const rows=run.map,nx=xNext(run),ROWS=EXP.floors,cw=118,rh=82,pad=46,Wd=pad*2+ROWS*cw+110,Hd=pad*2+4*rh;
  const X=r=>pad+r*cw+cw/2,Y=c=>pad+c*rh+rh/2,bx=pad+ROWS*cw+55,byy=Hd/2;
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 '+Wd+' '+Hd);svg.setAttribute('class','xp-svg');
  let ln='';rows.forEach((row,r)=>row.forEach((nd,j)=>{const on=run.row===r&&run.col===j,cl=(on?'on':'')+(run.row>r?' past':'');
    if(r<ROWS-1)nd.to.forEach(t=>{const m=rows[r+1][t];ln+='<line x1="'+X(r)+'" y1="'+Y(nd.c)+'" x2="'+X(r+1)+'" y2="'+Y(m.c)+'" class="'+cl+'"/>'});
    else ln+='<line x1="'+X(r)+'" y1="'+Y(nd.c)+'" x2="'+bx+'" y2="'+byy+'" class="'+cl+'"/>'}));
  svg.innerHTML=ln;
  const wrap=h('div',{class:'xp-map',style:'aspect-ratio:'+Wd+'/'+Hd},svg),pos=(x,y)=>'left:'+(x/Wd*100)+'%;top:'+(y/Hd*100)+'%';
  rows.forEach((row,r)=>row.forEach((nd,j)=>{const can=run.row===r-1&&nx.indexOf(j)>=0,cur=run.row===r&&run.col===j,past=r<run.row||(r===run.row&&!cur);const T=XNODE[nd.t];
    wrap.append(h('button',{class:'xp-nd t-'+nd.t+(can?' can':'')+(cur?' cur':'')+(past?' past':''),style:pos(X(r),Y(nd.c)),disabled:!can,title:T[1],onclick:()=>{xEnter(run,j);xSave();go('exped')}},xIco('xp-node-'+nd.t,T[0]),h('span',null,T[1])))}));
  const B=XBOSS[run.act][run.bossOf[run.act]],bc=nx[0]==='boss';
  wrap.append(h('button',{class:'xp-nd boss'+(bc?' can':''),style:pos(bx,byy),disabled:!bc,title:'Boss : '+fullName(B.k),onclick:()=>{xEnter(run,'boss');xSave();go('exped')}},h('span',{class:'xp-bav'},miniAv(B.k)),h('span',null,'Boss')));
  for(let r=0;r<ROWS;r++)wrap.append(h('span',{class:'xp-fln',style:pos(X(r),pad*.42)},'Étage '+(r+1)));
  return h('div',null,h('div',{class:'panel'},ph('🧭','Acte '+(run.act+1)+' · '+EXP.acts[run.act],run.row<0?'Choisis ton point de départ (à gauche)':run.row>=ROWS-1?'Le boss t’attend':'Choisis ta prochaine étape'),wrap,
      h('div',{class:'xp-leg sm'},Object.keys(XNODE).filter(k=>k!=='boss').map(k=>h('span',null,xIco('xp-node-'+k,XNODE[k][0]),' '+XNODE[k][1])))),
    h('div',{class:'cols xp-mapcols'},h('div',{class:'panel xp-bossp'},ph('👑','Boss de l’acte : '+fullName(B.k)),h('div',{class:'xp-fl'},h('div',{class:'xp-bossc'},cardEl(B.k,{})),h('div',null,h('p',{class:'xp-rule'},h('b',null,'Règle : '),B.tx),h('p',{class:'sm mut'},'Héros à '+EXP.ehp.boss[run.act]+' PV, '+XAIN[EXP.ai.boss[run.act]]+'. Récompense : une relique de boss parmi 3, une carte légendaire'+(run.act<2?', puis tous tes PV au début de l’acte suivant.':'.'))))),
      h('div',{class:'panel sm mut'},ph('📜','Rappel'),h('ul',{class:'xp-fi'},h('li',null,'Tes PV ne remontent qu’aux Tavernes, avec certaines reliques ou événements, et après les boss des actes 1 et 2.'),
        h('li',null,'Les élites 💀 sont dures, mais donnent une relique.'),h('li',null,'Le Marchand 🛒 vend des cartes, des reliques, et retire une carte de ton deck.'),h('li',null,'Clique sur « Mon deck » pour voir tes cartes à tout moment.')))))}
function xFinalEl(run){const B=XBOSS[3][run.final];
  return h('div',{class:'panel hl xp-final'},ph('👑','Le Raid final',run.tilt>=10?'Boss '+(run.final+1)+' / 2':''),h('div',{class:'xp-fl'},cardEl(B.k,{big:true}),
    h('div',null,h('h2',null,fullName(B.k)),h('p',null,B.tx),h('p',{class:'sm mut'},'Tu arrives avec tes PV restants : pas de Taverne avant ce combat. '+(B.hp||40)+' PV, IA experte, terrains de WoW.'),
      h('button',{class:'btn gold big',onclick:()=>{xEnter(run,'boss');xSave();go('exped')}},'Entrer dans le raid'))))}
function xFightEl(run,nd){const F=nd.F,T=F.kind==='boss'?['👑','Boss']:F.kind==='elite'?['💀','Élite']:['⚔','Combat'];
  return h('div',{class:'panel hl xp-fight'},ph(T[0],T[1]+' · '+F.nm,F.hp+' PV'),
    h('div',{class:'xp-fl'},F.bk?h('div',{class:'xp-foe'},cardEl(F.bk,{big:true})):h('div',{class:'xp-foe gen'},avEl(F.av,F.nm,'xpav'),h('b',null,F.nm)),
      h('div',null,F.rule?h('p',{class:'xp-rule'},h('b',null,'Règle : '),F.rule):null,
        h('ul',{class:'sm xp-fi'},h('li',null,'Héros adverse : ',h('b',null,F.hp+' PV'),' · toi : ',h('b',null,run.hp+' / '+run.mhp+' PV')),h('li',null,XAIN[F.ai]+' · deck ',ARCH[F.arch]?ARCH[F.arch].n:''),
          h('li',null,'Terrains : '+GAMES[EXP.tg[Math.min(3,F.act)]].n+' et Bazar'),run.relics.length?h('li',null,'Tes reliques s’appliquent pendant le combat.'):null),
        h('button',{class:'btn gold big',onclick:()=>xStartFight(run)},'⚔ Combattre'))))}
function xStartFight(run){const nd=run.node;if(!nd||nd.st!=='fight')return;const F=nd.F;
  const G=newGame(xFightCfg(run,F)),Hh=HostGame(G,[{kind:'me'},xAiSeat(run,F)],v=>applyView(v));
  newDuelState({mode:'exped',host:Hh,ctl:{act:a=>Hh.act(0,a),resign:()=>Hh.resign(0),close:()=>Hh.close()}});mountDuel();Hh.start()}
// fin d'un duel d'Expédition : le résultat compte une seule fois
function expAfterDuel(V,D){if(!V.o.exped||D.xpDone)return D.xpRes||null;D.xpDone=true;const run=XS().run;if(!run||!run.node||run.node.st!=='fight')return null;
  const me=V.me,w=V.over.w===me?1:0,hp=V.p[me].hp;xFightDone(run,w,hp);saveS();D.xpRes={w,over:!!run.over,run};return D.xpRes}
function xRewardEl(run,nd){const rw=nd.rw;
  const cardsDone=rw.took!=null,relDone=!rw.rel.length||rw.relTook!=null;
  const box=h('div',{class:'panel hl xp-rw'},ph('🏆','Victoire contre '+nd.F.nm),
    h('div',{class:'xp-rwl'},h('span',{class:'chip'},uiIco('ico-or','ti'),' +'+rw.gold+' Or'),rw.heal?h('span',{class:'chip'},uiIco('ico-pv','ti'),' +'+rw.heal+' PV (Pizza froide)'):null,rw.gems?h('span',{class:'chip'},'+'+rw.gems+' 💎'):null,rw.full?h('span',{class:'chip'},'Soin complet à l’acte suivant'):null));
  if(rw.rel.length){box.append(h('h3',{class:'xp-h3'},nd.F.kind==='boss'?'Choisis une relique de boss':'Choisis une relique'),
    h('div',{class:'xp-relc'},rw.rel.map((id,i)=>h('button',{class:'xp-relt r-'+XREL[id].r+(rw.relTook===i?' on':''),disabled:relDone,onclick:()=>{xGainRelic(run,id);rw.relTook=i;toast('✔ '+XREL[id].n);xRwNext(run);xSave();go('exped')}},xIco('xp-rel-'+id,XREL[id].ic,'big'),h('b',null,XREL[id].n),h('span',{class:'sm'},XREL[id].tx)))))}
  if(rw.cards.length){box.append(h('h3',{class:'xp-h3'},cardsDone?(rw.took>=0?'Carte ajoutée : '+fullName(rw.cards[rw.took]):'Aucune carte ajoutée'):'Ajoute une carte à ton deck (ou passe)'),
    h('div',{class:'apick xp-pick'},rw.cards.map((k,i)=>h('div',{class:'apc'+(rw.took===i?' on':'')+(cardsDone&&rw.took!==i?' off':''),onclick:()=>{if(cardsDone)return;run.deck.push(k);run.stats.cards++;rw.took=i;toast('✔ '+fullName(k)+' rejoint ton deck');xRwNext(run);xSave();go('exped')},oncontextmenu:e=>{e.preventDefault();showCard(k)}},cardEl(k,{big:true,tilt:1}),cardsDone?null:h('span',{class:'apx'},'✔ Prendre')))),
    cardsDone?null:h('button',{class:'btn sm',style:'margin-top:8px',onclick:()=>{rw.took=-1;xRwNext(run);xSave();go('exped')}},'Passer (garder un deck plus fin)'))}
  box.append(h('div',{class:'row',style:'margin-top:14px'},h('button',{class:'btn gold',disabled:!(cardsDone||!rw.cards.length)||!relDone,onclick:()=>{xLeaveNode(run);xSave();go('exped')}},nd.F.kind==='boss'?(run.act>=3?'Affronter le second boss':run.act>=2?'Vers le Raid final':'Vers l’acte suivant'):'Continuer')));
  return box}
// tout est choisi après un combat normal ou d'élite : retour direct à la carte (après un boss, on garde l'écran pour le bouton de changement d'acte)
function xRwNext(run){const nd=run.node,rw=nd&&nd.rw;if(!rw||nd.t==='boss')return;if((rw.took!=null||!rw.cards.length)&&(!rw.rel.length||rw.relTook!=null))xLeaveNode(run)}
function xEventEl(run,nd){const e=XEVK[nd.ev];
  return h('div',{class:'panel hl xp-ev'},ph('🌀','Événement · '+e.n),h('div',{class:'xp-fl'},h('div',{class:'xp-evi'},XPIMG['xp-ev-'+e.id]?h('img',{class:'xp-evimg',src:uiSrc('xp-ev-'+e.id),alt:''}):xIco('xp-ev-'+e.id,e.ic,'huge')),
    h('div',null,h('p',{class:'xp-evt'},e.tx),h('div',{class:'xp-evc'},e.c.map((c,i)=>{const ok=!c.ok||c.ok(run);return h('button',{class:'btn'+(ok?' pri':''),disabled:!ok,onclick:()=>{xEvChoose(run,i);xSave();go('exped')}},c.t)})))))}
function xPickEl(run,nd){const p=nd.pick,left=p.n-p.done;
  const title={rm:'Retire '+left+' carte'+(left>1?'s':'')+' de ton deck',dup:'Choisis la carte à dupliquer',up:'Choisis la carte à améliorer',gift:'Choisis ta carte'}[p.m];
  const box=h('div',{class:'panel hl xp-pk'},ph('🃏',title,p.res.length?p.res.join(' · '):''));
  if(p.m==='gift')box.append(h('div',{class:'apick xp-pick'},p.offer.map((k,i)=>h('div',{class:'apc',onclick:()=>{xPickApply(run,i);xSave();go('exped')},oncontextmenu:e=>{e.preventDefault();showCard(k)}},cardEl(k,{big:true,tilt:1}),h('span',{class:'apx'},'✔ Prendre')))));
  else box.append(h('p',{class:'sm mut'},p.m==='up'?'Une créature peut gagner +1/+1, ou −1 de coût si elle coûte 3 ou plus. Un sort peut coûter 1 de moins. Une carte ne s’améliore qu’une fois.':'Clique sur une carte · clic droit : fiche détaillée.'),
    xDeckList(run.deck,i=>{if(p.m==='up'){const k=run.deck[i],o=xUpOpts(k);if(o.length<2){xPickApply(run,i,o[0]);xSave();go('exped');return}
      ask('Forgemagie : '+fullName(k),'Comment améliorer cette carte ?',o.map(u=>({t:xUpTx(k,u),c:'pri',f:()=>{xPickApply(run,i,u);xSave();go('exped')}})).concat([{t:'Annuler'}]));return}
      xPickApply(run,i);xSave();go('exped')},p.m==='up'?k=>xUpOpts(k).length>0:p.m==='rm'&&nd.t==='shop'?null:null));
  if(nd.t==='shop'&&!p.done)box.append(h('button',{class:'btn sm',style:'margin-top:10px',onclick:()=>{const sh=nd.shop;run.gold+=sh.rm;sh.rmUsed=0;run.rmCost-=EXP.rmStep;nd.st='shop';nd.pick=null;xSave();go('exped')}},'Annuler (remboursé)'));
  if(nd.t==='rest'&&!p.done)box.append(h('button',{class:'btn sm',style:'margin-top:10px',onclick:()=>{nd.st='rest';nd.pick=null;xSave();go('exped')}},'Annuler'));
  return box}
function xDoneEl(run,nd){const e=nd.t==='event'?XEVK[nd.ev]:null;
  return h('div',{class:'panel hl xp-ev'},ph(e?'🌀':'🍺',e?e.n:'Taverne'),h('p',{class:'xp-evt'},nd.res||'C’est fait.'),
    h('button',{class:'btn gold',onclick:()=>{xLeaveNode(run);xSave();go('exped')}},'Continuer'))}
function xShopEl(run,nd){const sh=nd.shop;
  const buy=(p,f)=>{if(run.gold<p){toast('Pas assez d’Or.');return}run.gold-=p;f();xSave();go('exped')};
  return h('div',{class:'panel hl xp-shop'},ph('🛒','Marchand',run.gold+' Or'),
    h('h3',{class:'xp-h3'},'Cartes'),h('div',{class:'apick xp-pick'},sh.cards.map(c=>h('div',{class:'apc'+(c.sold?' off':''),onclick:()=>{if(!c.sold)buy(c.p,()=>{c.sold=1;run.deck.push(c.k)})},oncontextmenu:e=>{e.preventDefault();showCard(c.k)}},cardEl(c.k,{big:true}),h('span',{class:'apx xp-price'+(run.gold<c.p&&!c.sold?' no':'')},c.sold?'Vendu':c.p+' Or')))),
    h('h3',{class:'xp-h3'},'Reliques'),h('div',{class:'xp-relc'},sh.rel.map(r=>h('button',{class:'xp-relt r-'+XREL[r.id].r+(r.sold?' on':''),disabled:!!r.sold||run.gold<r.p,onclick:()=>buy(r.p,()=>{r.sold=1;xGainRelic(run,r.id)})},xIco('xp-rel-'+r.id,XREL[r.id].ic,'big'),h('b',null,XREL[r.id].n),h('span',{class:'sm'},XREL[r.id].tx),h('span',{class:'xp-price'},r.sold?'Vendu':r.p+' Or')))),
    h('h3',{class:'xp-h3'},'Services'),h('div',{class:'row'},h('button',{class:'btn',disabled:!!sh.rmUsed||run.gold<sh.rm||run.deck.length<=5,onclick:()=>{run.gold-=sh.rm;sh.rmUsed=1;run.rmCost+=EXP.rmStep;nd.st='pick';nd.pick={m:'rm',n:1,done:0,res:[]};xSave();go('exped')}},'🗑 Retirer une carte ('+sh.rm+' Or)'+(sh.rmUsed?' · fait':''))),
    h('div',{class:'row',style:'margin-top:14px'},h('button',{class:'btn gold',onclick:()=>{xLeaveNode(run);xSave();go('exped')}},'Quitter la boutique')))}
function xRestEl(run,nd){const v=Math.min(xRestHeal(run),run.mhp-run.hp),can=run.deck.some(k=>xUpOpts(k).length);
  return h('div',{class:'panel hl xp-rest'},ph('🍺','Taverne'),h('p',{class:'sm mut'},'Un feu, une bière, un canapé. Une seule chose avant de repartir :'),
    h('div',{class:'xp-restc'},h('button',{class:'xp-relt',onclick:()=>{run.hp=Math.min(run.mhp,run.hp+xRestHeal(run));nd.st='done';nd.res='Tu te reposes : +'+v+' PV.';xSave();go('exped')}},xIco('xp-rest-heal','🛏','big'),h('b',null,'Se reposer'),h('span',{class:'sm'},'Récupère '+v+' PV ('+run.hp+' → '+(run.hp+v)+').')),
      h('button',{class:'xp-relt',disabled:!can,onclick:()=>{nd.st='pick';nd.pick={m:'up',n:1,done:0,res:[]};xSave();go('exped')}},xIco('xp-rest-forge','⚒','big'),h('b',null,'Forgemagie'),h('span',{class:'sm'},can?'Améliore une carte de ton deck (★).':'Toutes tes cartes sont déjà améliorées.'))))}
function xChestEl(run,nd){const id=nd.rel;
  return h('div',{class:'panel hl xp-ev'},ph('🎁','Coffre'),h('div',{class:'xp-relc'},id?h('div',{class:'xp-relt r-'+XREL[id].r},xIco('xp-rel-'+id,XREL[id].ic,'big'),h('b',null,XREL[id].n),h('span',{class:'sm'},XREL[id].tx)):null,
      h('div',{class:'xp-relt'},xIco('xp-gold','🪙','big'),h('b',null,'+'+nd.gold+' Or'))),
    h('button',{class:'btn gold',style:'margin-top:12px',onclick:()=>{if(id)xGainRelic(run,id);run.gold+=nd.gold;xLeaveNode(run);xSave();go('exped')}},'Tout prendre'))}
function xOverEl(run){const o=run.over,M=XS().meta;
  return h('div',{class:'panel hl xp-over'+(o.won?' won':'')},ph(o.won?'🏆':'🪦',o.won?'Expédition réussie !':'Fin de l’expédition',o.score+' pts'),
    h('div',{class:'xp-fl'},h('div',{class:'xp-ovi'},xIco(o.won?'xp-victory':'xp-defeat',o.won?'🏆':'🪦','huge')),
      h('div',null,h('p',{class:'xp-evt'},o.won?'Le Raid final est tombé. Le serveur entier parle de toi.':o.by==='abandon'?'Tu as abandonné l’expédition à l’acte '+(Math.min(3,o.act)+1)+'.':'Éliminé par '+o.by+' à l’étage '+o.floor+' ('+(o.act>=3?'Raid final':'acte '+(o.act+1))+').'),
        h('ul',{class:'sm xp-fi'},h('li',null,'Combats : '+run.stats.fights+' · élites : '+run.stats.elites+' · boss : '+run.stats.bosses),h('li',null,'Deck final : '+run.deck.length+' cartes · reliques : '+run.relics.length),
          h('li',null,'+'+o.xp+' XP'+(o.lvUp?' · niveau '+o.lv+' atteint !':'')),o.gems?h('li',null,'+'+o.gems+' 💎 gagnés pendant la course'):null,
          o.unl.length?h('li',null,'Nouveau patron débloqué : '+o.unl.map(p=>XPAT[p].n).join(', ')):null,o.won&&!run.daily&&run.tilt>=M.tilt-1&&M.tilt<=10?h('li',null,'Tilt '+M.tilt+' débloqué.'):null),
        h('div',{class:'xp-rels'},run.relics.map(id=>xRelIco(id,true))),
        h('div',{class:'row',style:'margin-top:12px'},h('button',{class:'btn gold',onclick:()=>{XS().run=null;xSave();go('exped')}},'Retour au camp'),h('button',{class:'btn',onclick:()=>xDeckModal(run)},'Voir le deck final')))))}
// ---------- duel : reliques et règle de l'adversaire visibles pendant le combat ----------
function xDuelStrip(V){if(!V||!V.o.exped)return null;const run=XS().run;if(!run)return null;const F=run.node&&run.node.F;
  return h('div',{class:'xp-strip'},h('span',{class:'xp-sl'},'🧭 '+(run.act>=3?'Raid final':'Acte '+(run.act+1))),h('span',{class:'xrel kw','data-t':XPAT[run.pat].n,'data-d':XPAT[run.pat].tx},xPatIco(run.pat)),run.relics.map(id=>xRelIco(id,true)),
    F&&F.rule?h('span',{class:'xrel kw foe','data-t':'Règle de '+F.nm,'data-d':F.rule},'💀'):null)}
// ---------- carte de l'accueil ----------
function expHomeCard(){const X=XS(),run=X.run,M=X.meta,d=xDailyKey(),dd=M.daily.d===d&&M.daily.done;
  return homeCard({k:'exped',icon:'compass',title:'Expédition',
    desc:run?(run.over?['Ta dernière course est terminée : ',h('b',null,run.over.won?'victoire !':'défaite.'),' Consulte le bilan pour repartir.']:
      ['Course en cours avec ',h('b',null,XPAT[run.pat].n),' : ',h('b',null,run.act>=3?'Raid final':'acte '+(run.act+1)+', étage '+Math.max(0,run.row+1)),' · ',run.hp+' / '+run.mhp+' PV · '+run.relics.length+' relique'+(run.relics.length>1?'s':'')+'.']):
      ['Nouveau mode solo : un patron, ',h('b',null,'15 cartes'),' et ',h('b',null,'40 PV'),' pour traverser 3 actes et le Raid final. Construis ton deck en route, ramasse des reliques, affronte des boss. ',
        h('b',null,'Niveau '+xLevel(M.xp)),M.tilt?' · Tilt '+M.tilt+' débloqué':'',dd?' · défi du jour fait':' · défi du jour disponible','.'],
    btn:h('button',{class:'hm-btn',onclick:()=>go('exped')},run?(run.over?'Voir le bilan':'Reprendre l’expédition'):'Partir en expédition')})}
