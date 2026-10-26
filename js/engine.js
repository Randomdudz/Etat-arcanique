// ============ MOTEUR : sans DOM, déterministe, état JSON-clonable ============
const MAXT=120;
function rnd(G){let t=G.rs=(G.rs+0x6D2B79F5)|0;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}
function ri(G,n){return Math.floor(rnd(G)*n)}
function shuf(G,a){for(let i=a.length-1;i>0;i--){const j=ri(G,i+1);const t=a[i];a[i]=a[j];a[j]=t}return a}
function pick(G,a){return a.length?a[ri(G,a.length)]:null}
function er(m){return{ok:false,err:m}}
// cs = « cause » : la carte, le terrain ou la famille dont l'effet est en cours de résolution (pour l'historique)
function lg(G,e){if(!G.lg)return;e.a=G.aid;e.s=G.cur;e.tn=G.turn;if(G.cs&&e.src===undefined)e.cs=G.cs;
  if(SNAPT[e.t]&&e.st===undefined&&e.ts!=null&&e.i>=0){const c=G.p[e.ts]&&G.p[e.ts].board[e.i];if(c&&c.k===e.k)e.st=snap(G,e.ts,e.i)}
  G.hist.push(e)}
// historique : état d'une créature [ATK, PV restants, PV max] au moment de l'action (avant les dégâts pour un coup reçu,
// après l'effet pour un bonus, un soin, un Mute...)
const SNAPT={buff:1,hc:1,kwg:1,mute:1,tilt:1,save:1,hp1:1,pz:1,blk:1};
function snap(G,s,i){const c=G.lg&&i>=0&&G.p[s].board[i];if(!c)return undefined;const E=eff(G,s,i);return[E.a,E.hp,E.h]}
function hasF(k,f){const cd=CARDS[k];return!!cd&&cd.fac.indexOf(f)>=0}

// ---------- création ----------
function mkCard(G,k){return{k,id:++G.uid}}
function newGame(cfg){
  const o=Object.assign({},OPTDEF,cfg.o||{});
  const G={o,rs:(cfg.seed>>>0)||1,uid:0,aid:0,turn:0,round:0,cur:0,first:0,over:null,lg:cfg.lg===false?0:1,hist:[],played:0,
    rp:0,cs:null,tq:[],tf:0,p:[],shop:[],tdeck:[],tdis:[],nev:0};
  G.first=cfg.first!=null?cfg.first:(rnd(G)<.5?0:1);
  for(let s=0;s<2;s++){
    const P={nm:(cfg.names&&cfg.names[s])||('Joueur '+(s+1)),av:String((cfg.avs&&cfg.avs[s])||'').slice(0,16),hp:o.hp,mhp:o.hp,pz:0,deck:[],hand:[],board:Array(CELLS).fill(null),
      grave:[],terrs:[],cells:Array(CELLS).fill(0),cap:0,eth:0,or:0,fat:0,rsh:0,arts:[],pq:[]};
    if(cfg.hp&&cfg.hp[s]!=null){P.hp=cfg.hp[s];P.mhp=cfg.mhp&&cfg.mhp[s]!=null?cfg.mhp[s]:Math.max(o.hp,P.hp)}   // Expédition : PV de départ et maximum propres à chaque camp
    if(cfg.rx&&cfg.rx[s])P.rx=cfg.rx[s];                                                                        // Expédition : reliques, pouvoir du patron, règles d'élite ou de boss
    P.deck=cfg.decks[s].map(e=>mkCard(G,String(e).replace('*','')));
    shuf(G,P.deck);G.p.push(P)}
  if(o.ter){G.tdeck=shuf(G,TDEF.filter(t=>!t.uniq&&(!o.tg||TD[t.d].g===o.tg||TD[t.d].g==='bazar')).map(t=>({d:t.d})));   // o.tg (Expédition) : terrains du jeu de l'acte, plus ceux du Bazar
  G.shop=[];for(let j=0;j<2;j++){const t=drawTerr(G);if(t)G.shop.push(t)}}
  G.nev=ri(G,EVENTS.length);
  for(let s=0;s<2;s++){const n=s===G.first?3:4;const P=G.p[s];for(let j=0;j<n;j++){const c=P.deck.pop();if(c)P.hand.push(c)}}
  if(G.p[0].rx||G.p[1].rx)rxStart(G);
  const sec=G.p[1-G.first];
  if(o.comp){sec.or+=COMP.or;if(!o.arena&&!o.exped){sec.hp+=COMP.hp;sec.mhp+=COMP.hp}}   // compensation du second joueur (en Arène : pas de PV bonus)
  // mulligan : chaque joueur choisit d'abord les cartes de sa main de départ à remplacer (la Pièce arrive après)
  if(cfg.mull){G.phase='mull';G.mull=[0,0];G.cur=G.first;return G}
  sec.hand.push(mkCard(G,'piece'));
  startTurn(G,G.first);
  return G}
// mulligan : les cartes choisies (indices dans la main) sont remplacées par les premières cartes du deck, à la même place,
// puis remélangées dans le deck. Quand les deux joueurs ont choisi, le second reçoit la Pièce et la partie commence.
function mullAct(G,s,a){
  if(G.mull[s])return er('Tu as déjà choisi ta main.');
  const P=G.p[s],idx=Array.isArray(a.idx)?a.idx:[];
  if(idx.length>P.hand.length||new Set(idx).size!==idx.length||idx.some(i=>!Number.isInteger(i)||i<0||i>=P.hand.length))return er('Choix de cartes invalide.');
  G.aid++;const old=[];
  for(const i of idx.slice().sort((x,y)=>x-y)){if(!P.deck.length)break;old.push(P.hand[i]);P.hand[i]=P.deck.pop()}
  if(old.length){P.deck.push(...old);shuf(G,P.deck)}
  G.mull[s]=1;lg(G,{t:'mull',ts:s,n:old.length});
  if(G.mull[0]&&G.mull[1]){G.phase=null;G.p[1-G.first].hand.push(mkCard(G,'piece'));startTurn(G,G.first)}
  return{ok:true}}

function mkC(G,k){const cd=CARDS[k];return{id:++G.uid,k,a:cd.a,h:cd.h,dm:0,mut:0,pm:0,pz:0,eg:(cd.kw&&cd.kw.indexOf('egide')>=0)?1:0,sick:1,af:0,blk:0,aw:0,rs:0,ex:0,sm:0}}

// ---------- copie rapide ----------
function cloneG(G){
  const o=Object.assign({},G);o.hist=G.lg?G.hist.slice():[];
  o.p=G.p.map(P=>{const q=Object.assign({},P);q.deck=P.deck.slice();q.hand=P.hand.slice();q.grave=P.grave.slice();
    q.board=P.board.map(c=>c?Object.assign({},c):null);q.cells=P.cells.slice();q.terrs=P.terrs.map(t=>Object.assign({},t));q.arts=P.arts?P.arts.slice():[];q.pq=P.pq?P.pq.map(x=>Object.assign({},x,{c:x.c.slice()})):[];return q});
  o.shop=G.shop.slice();o.tdeck=G.tdeck.slice();o.tdis=G.tdis.slice();if(G.rps)o.rps=G.rps.map(r=>Object.assign({},r));o.tq=G.tq?G.tq.slice():[];if(G.mull)o.mull=G.mull.slice();return o}

// ---------- familles, terrains, statistiques ----------
// fl : nombre de créatures de chaque famille sur le plateau
function facC(c){const cd=CARDS[c.k];return cd.allFam&&!c.mut?FACK:cd.fac}
function hasFC(c,f){return facC(c).indexOf(f)>=0}
function fl(G,s){const n={};for(const c of G.p[s].board)if(c)for(const f of facC(c))n[f]=(n[f]||0)+1;return n}
// artefacts d'un joueur (Dofus légendaires)
function hasArt(P,k){return!!P.arts&&P.arts.some(a=>a.k===k)}
function artAny(G,k){return hasArt(G.p[0],k)||hasArt(G.p[1],k)}
// terrain désactivé (Kirua, crasheur de serveur) : sans effet tant que la créature qui l'a désactivé est en jeu
function cOn(G,id){for(const P of G.p)for(const b of P.board)if(b&&b.id===id)return b;return null}
// terrain sans effet : désactivé par une Kirua (crasheur) en jeu et pas Mute, ou lié à une créature (Blizzard, Grand Bazaar) qui est Mute
function tOff(G,T){if(!T)return false;if(T.off){const k=cOn(G,T.off);if(k&&!k.mut)return true}
  const o=T.lk||T.by;if(o){const c=cOn(G,o);if(c&&c.mut)return true}return false}
// jeux (WoW, Dofus, LoL, CS) dont le joueur a un terrain actif : ni désactivé ni entièrement recouvert (Sadamie, highroller ultime)
function hrGames(G,s){const P=G.p[s],gs={};P.terrs.forEach(T=>{if(!tOff(G,T)&&P.cells.indexOf(T.id)>=0)gs[TD[T.d].g]=1});return AFG.filter(g=>gs[g])}
function terrOf(G,s,i){const P=G.p[s],id=P.cells[i];if(!id)return null;for(const t of P.terrs)if(t.id===id)return tOff(G,t)?null:t;return null}
function tfx(T,k){if(!T)return null;const t=TD[T.d];return t.e[affOf(k,t.g)]||null}
// terrain de jeu = WoW, Dofus, LoL ou CS ; les autres terrains sont neutres
function isGT(T){return!!T&&TD[T.d].g!=='bazar'}
function tgOf(G,s,i){const T=terrOf(G,s,i);return T?TD[T.d].g:null}
// affinité d'une créature en jeu (Maki, chef coach : +1 d'affinité LoL ; Smurf : +1 dans tous les jeux ; 2 maximum)
function affC(c,g){if(g==='bazar')return 1;const b=affOf(c.k,g),x=(c.ab||0)+(g==='lol'?(c.lb||0):0);return x?Math.min(2,b+x):b}
function tfxC(T,c){if(!T)return null;const t=TD[T.d];return t.e[affC(c,t.g)]||null}
// Elkatrix (doux comme un agneau) : les effets des terrains LoL de son camp s'appliquent deux fois
function tMul(G,s,T){if(!T)return 1;const g=TD[T.d].g;if(g==='bazar')return 1;for(const b of G.p[s].board)if(b&&!b.mut&&(CARDS[b.k].dblGT||(g==='lol'&&CARDS[b.k].dblLol)))return 2;return 1}
function runT(G,s,T,l,x){const n=tMul(G,s,T);for(let j=0;j<n&&!G.over;j++)runFx(G,l,x)}
// auras des créatures en jeu (Xulyes, Minuit, Homz, Saja) : bonus reçu par la créature c en (s,i)
function auraOf(G,s,i,c){let a=0,h=0;
  for(const t of[0,1]){const B=G.p[t].board;for(let j=0;j<CELLS;j++){const b=B[j];if(!b||b.mut)continue;const au=CARDS[b.k].aura;if(!au)continue;
    if(au.pos){if(t===s&&j===i)continue;if(i<j){a-=au.pos;h-=au.pos}else if(i>j){a+=au.pos;h+=au.pos}continue}
    if(t!==s||(au.others&&j===i))continue;
    if(au.aff){
      const affLvl = affC(c, au.aff);
      if(!affLvl) continue; // Pas d'affinité WoW = pas de bonus
      const mult = au.scale ? affLvl : 1; // Multiplie le bonus selon l'affinité (WoW 1 -> x1, WoW 2 -> x2)
      a += (au.a || 0) * mult;
      h += (au.h || 0) * mult;
      continue;
    }
    if(au.g){if(tgOf(G,s,i)!==au.g)continue;}
    if(au.fac&&!hasF(c.k,au.fac))continue;
    a+=au.a||0;h+=au.h||0}}
  return{a,h}}
// une aura qui disparaît ne tue pas : les PV qu'elle donnait sont retirés des dégâts subis d'abord
function auraOff(G,s,i){const src=G.p[s].board[i];if(!src||src.mut||!CARDS[src.k].aura)return;
  const before=[[],[]];for(const t of[0,1])G.p[t].board.forEach((c,j)=>{before[t][j]=c?auraOf(G,t,j,c).h:0});
  const sv=src.mut;src.mut=1;
  for(const t of[0,1])G.p[t].board.forEach((c,j)=>{if(!c||c===src)return;const d=before[t][j]-auraOf(G,t,j,c).h;if(d>0)c.dm=Math.max(0,c.dm-d)});
  src.mut=sv}
function xenoAll(G,s){return G.p[s].board.some(b=>b&&!b.mut&&CARDS[b.k].xenoAll)}
function kwOf(G,s,c,L,TE,T){
  const cd=CARDS[c.k],r={};if(!c.mut&&cd.kw)for(const x of cd.kw)r[x]=1;
  if(!c.mut&&c.tr)r.rempart=1;                                       // Rempart gagné en jeu (Tilt du Provocateur)
  if(!c.mut&&c.gk)for(const x in c.gk)r[x]=1;                         // mots-clés gagnés en jeu (ARAM custom)
  if(!c.mut&&c.rsp)r.respawn=1;                                       // Respawn donné (Lasorius, mets une pierre)
  if(c.ds)r.deso=1;                                                  // Désorienté (Lanfear) : un état, il reste même Mute
  if(!c.mut&&c.th)r.hate=1;                                          // Flash : peut attaquer dès ce tour
  if(!c.mut&&cd.withKw&&G.p[s].board.some(b=>b&&b!==c&&CARDS[b.k].base===cd.withKw.b))for(const x of cd.withKw.kw)r[x]=1;   // Maki : Siphon avec un Osiris
  if(!c.mut&&cd.onT&&T&&TD[T.d].g===cd.onT.g)for(const x of cd.onT.kw)r[x]=1;   // mots-clés gagnés sur un terrain d'un jeu (Lisdoon, Roro)
  if(!c.mut&&cd.offGT&&!isGT(T))for(const x of cd.offGT.kw)r[x]=1;             // ... hors d'un terrain de jeu
  if(!c.mut&&cd.onGT&&isGT(T))for(const x of cd.onGT.kw)r[x]=1;               // ... sur un terrain de jeu (Lisdoon, Gomuscu)
  if(TE&&TE.kw)for(const x in TE.kw)r[x]=1;
  if(TE&&TE.tilt)r.tilt=1;
  for(const b of G.p[s].board){if(!b||b.mut)continue;const ka=CARDS[b.k].kwAura;if(ka&&!(ka.others&&b===c)&&(!ka.fac||hasFC(c,ka.fac)))r[ka.kw]=1}   // Miichi : Hâte pour tes autres Weebos
  if(T&&TD[T.d].g==='dofus'&&hasArt(G.p[s],'vulbis'))r.hate=1;      // Dofus Vulbis : Hâte sur tes terrains Dofus
  let v=r.venin?1:0;if(hasFC(c,'toxic')&&(L.toxic||0)>=2)v+=L.toxic-1;   // Toxic : Venin +1 par autre Toxic
  if(v>0)r.venin=v;else delete r.venin;
  const cl=((!c.mut&&cd.cleave)||0)+(hasArt(G.p[s],'turquoise')?1:0);if(cl>0)r.cleave=cl;   // Cleave X (Dofus Turquoise : Cleave 1 pour tes créatures)
  return r}
// Laloutre (démon de la custom) : sur un terrain de jeu, les autres créatures posées sur un terrain du même jeu ont 1 ATK et 1 PV de base
function custOn(G,s,i,c){const g=tgOf(G,s,i);if(!g||g==='bazar')return false;
  for(const t of[0,1]){const B=G.p[t].board;for(let j=0;j<CELLS;j++){const b=B[j];if(b&&b!==c&&!b.mut&&CARDS[b.k].custom&&tgOf(G,t,j)===g)return true}}return false}
function eff(G,s,i,L){
  const P=G.p[s],c=P.board[i],cd=CARDS[c.k];L=L||fl(G,s);
  const cu=custOn(G,s,i,c);let a=(cu?1:c.a)+(c.ta||0),h=cu?1:c.h;
  const T=terrOf(G,s,i),TE=tfxC(T,c);
  if(TE){const m=tMul(G,s,T);a+=(TE.a||0)*m;h+=(TE.h||0)*m;
    if(TE.duo&&P.board.some((b,j)=>b&&j!==i&&P.cells[j]===P.cells[i]))a+=(TE.duo.a||0)*m}   // Arène 2v2 : une autre de tes créatures sur l'arène
  if(T&&!c.mut&&cd.gr&&cd.gr.g===TD[T.d].g){a+=cd.gr.a;h+=cd.gr.h}
  if(T&&P.arts&&P.arts.length&&TD[T.d].g==='dofus'){if(hasArt(P,'pourpre'))a+=2;if(hasArt(P,'emeraude'))h+=2}   // Dofus Pourpre et Émeraude
  if(hasFC(c,'weebos')&&(L.weebos||0)>=3)h+=1;
  if(hasFC(c,'vestige')&&(L.vestige||0)>=2)h+=Math.floor(L.vestige/2);   // Vestiges : +1 PV par paire de Vestiges
  if(!c.mut&&cd.withB&&P.board.some(b=>b&&b!==c&&CARDS[b.k].base===cd.withB.b)){a+=cd.withB.a;h+=cd.withB.h}   // Maki : +1/+2 avec un Osiris
  if(!c.mut&&cd.allFamActive){const fams=new Set();P.board.forEach(b=>{if(b&&CARDS[b.k].fac)CARDS[b.k].fac.forEach(f=>fams.add(f))});a+=fams.size;h+=fams.size}
  const au=auraOf(G,s,i,c);a+=au.a;h+=au.h;
  const R=P.rx;if(R){if(R.atk)a+=R.atk;if(R.atk3&&P.board.filter(Boolean).length>=3)a+=R.atk3}   // Expédition : +ATK de camp (relique, patron, élite)
  return{a:a<0?0:a,h,hp:h-c.dm,kw:kwOf(G,s,c,L,TE,T),T,TE,cu}}
// valeur approximative d'un effet de terrain (IA)
function tval(TE){if(!TE)return 0;let v=(TE.a||0)*1.1+(TE.h||0)*.9;
  if(TE.kw){if(TE.kw.hate)v+=.8;if(TE.kw.insolence)v+=1;if(TE.kw.rempart)v+=1;if(TE.kw.siphon)v+=1.4}
  if(TE.kw&&TE.kw.respawn)v+=1.5;if(TE.vsC)v+=TE.vsC*.7;if(TE.noAtk)v-=2.5;if(TE.duo)v+=(TE.duo.a||0)*.6;
  const ops=l=>{let s=0;if(l)for(const o of l)s+=o.t==='heal'?o.n*.6:o.t==='or'?o.n*.6:o.t==='rnd'||o.t==='rndC'?o.n*(o.times||1)*.9:
    o.t==='grow'?(o.a+o.h)*1.1:o.t==='healSelf'?Math.min(o.n,4)*.4:o.t==='dmgFace'?o.n*.9:o.t==='draw'?1.5:o.t==='retHand'?2.4:o.t==='egide'?1.6:o.t==='buff'?(o.a+o.h):.5;return s};
  return v+ops(TE.sot)*1.4+ops(TE.eot)*1.4+ops(TE.arr)+ops(TE.last)*.7+ops(TE.tilt)*.8}
function slotBonus(G,s,i,k){const T=terrOf(G,s,i);if(!T)return 0;let b=tval(tfx(T,k));const cd=CARDS[k];
  if(cd.gr&&cd.gr.g===TD[T.d].g)b+=cd.gr.a+cd.gr.h;return b}
function bestSlot(G,s,k){const B=G.p[s].board;let bi=-1,bv=-1e9;for(let i=0;i<CELLS;i++){if(B[i])continue;const v=slotBonus(G,s,i,k);if(v>bv){bv=v;bi=i}}return bi}
function slotOf(G,s,c){const B=G.p[s].board;for(let i=0;i<CELLS;i++)if(B[i]&&B[i].id===c.id)return i;return -1}
function hidden(E,c){return(E.kw.afk&&!c.aw)||c.ex}

// ---------- cibles ----------
function targets(G,s,spec,tgf,exc,includeProtected){
  const r=[],e=1-s;
  const hero=sd=>{if(tgf==='hurt'&&G.p[sd].hp>=G.p[sd].mhp)return;r.push({s:sd,i:-1})};   // « blessé » vaut aussi pour les héros (Xulyes)
  const cr=sd=>{const L=fl(G,sd);G.p[sd].board.forEach((c,i)=>{if(!c||c.id===exc)return;const E=eff(G,sd,i,L);
    if(sd!==s&&!includeProtected&&E.kw.afk&&!c.aw)return;if(sd!==s&&!includeProtected&&(c.ex||E.kw.insolence))return;if(!tgfOk(G,s,c,tgf))return;r.push({s:sd,i})})};   // les effets aléatoires passent outre les protections de ciblage
  switch(spec){case 'any':hero(s);hero(e);cr(s);cr(e);break;case 'e':hero(e);cr(e);break;case 'c':cr(s);cr(e);break;
    case 'ec':cr(e);break;case 'ac':cr(s);break;
    case 'ea':hero(e);cr(s);cr(e);break;                                                                 // sorts : héros adverse ou n'importe quelle créature
    case 'ecell':for(let j=0;j<CELLS;j++)if(blzAt(G.p[e],j)>=0)r.push({s:e,i:j});break;             // Blizzard : n'importe quelle case (il couvre celle-ci et sa voisine de droite, ou de gauche au bord)
    case 'eslot':G.p[e].board.forEach((c,i)=>{if(!c)r.push({s:e,i})});break;
    case 'eterr':{const P=G.p[e];P.cells.forEach((id,j)=>{if(!id)return;const T=P.terrs.find(q=>q.id===id);if(T&&!tOff(G,T))r.push({s:e,i:j})});break}
    case 'terr':for(const sd of[e,s]){const P=G.p[sd];P.cells.forEach((id,j)=>{if(!id)return;const T=P.terrs.find(q=>q.id===id);if(T&&!tOff(G,T))r.push({s:sd,i:j})})}break}   // n'importe quel terrain actif, des deux côtés (Kirua, crasheur de serveur)
  return r}
// filtres de cible : blessée, coût 2 ou moins (c2), coût N ou moins (cm5 = 5 ou moins), d'une famille (f:toxic), sans famille,
// coût au plus égal au nombre de tes créatures d'une famille (cf:alien = Enlèvement, cf:xeno = Videur)
function tgfOk(G,s,c,tgf){if(!tgf)return true;const cd=CARDS[c.k];
  if(tgf==='hurt')return c.dm>0;if(tgf==='c2')return cd.c<=2;if(tgf==='nofam')return!cd.fac.length;if(tgf==='abroad')return!!c.ex&&!c.fum;   // abroad : en voyage (Vol retour)
  if(/^cm\d+$/.test(tgf))return cd.c<=+tgf.slice(2);
  if(tgf.slice(0,2)==='f:')return hasFC(c,tgf.slice(2));
  if(tgf.slice(0,3)==='cf:')return cd.c<=(fl(G,s)[tgf.slice(3)]||0);
  return true}
// VIP : attaquable seulement quand il n'y a plus que des VIP parmi les créatures attaquables (les AFK et les créatures à l'étranger ne le protègent pas) ;
// Maki (aristocrate) : il faut payer sa taxe en Or pour l'attaquer
function atkTargets(G,s,f){
  const e=1-s,L=fl(G,e),r=[],B=G.p[e].board;let taunt=false;
  const Es=B.map((c,i)=>c?eff(G,e,i,L):null),vipOnly=B.every((c,i)=>!c||Es[i].kw.vip||hidden(Es[i],c));
  B.forEach((c,i)=>{if(!c)return;const E=Es[i];if(hidden(E,c))return;if(E.kw.vip&&!vipOnly)return;
    if(!c.mut&&CARDS[c.k].tax&&G.p[s].or<CARDS[c.k].tax)return;r.push({s:e,i});if(E.kw.rempart)taunt=true});
  const A=f!=null?G.p[s].board[f]:null;if(A&&!A.mut&&CARDS[A.k].noTaunt)taunt=false;          // Snoux : ignore les Remparts
  if(A&&G.p[s].board.some(b=>b&&b!==A&&!b.mut&&CARDS[b.k].noTauntAll))taunt=false;             // … et le fait ignorer à tes autres créatures
  if(taunt)return r.filter(t=>eff(G,e,t.i,L).kw.rempart);
  r.push({s:e,i:-1});return r}
// Désorienté : la cible est tirée au hasard parmi tous les ennemis, sans tenir compte des protections de ciblage ; la taxe de Maki reste appliquée
function desoTargets(G,s){const e=1-s,r=[{s:e,i:-1}];G.p[e].board.forEach((c,i)=>{if(!c)return;if(!c.mut&&CARDS[c.k].tax&&G.p[s].or<CARDS[c.k].tax)return;r.push({s:e,i})});return r}
// choix en attente (Coco, esprit tourmenté) : rien d'autre n'est possible avant de l'avoir fait
function pend(G,s){const q=G.p[s].pq;return!!G.phase||!!(q&&q.length)}                // choix en attente (Coco, Miroir), main de départ ou pierre-feuille-ciseaux : rien d'autre
function canAtk(G,s,i){
  if(G.over||G.cur!==s||pend(G,s))return false;const c=G.p[s].board[i];if(!c||c.blk>0)return false;
  // une créature à 0 ATK peut attaquer (elle n'inflige pas de dégâts)
  const E=eff(G,s,i);if(E.TE&&E.TE.noAtk)return false;if(c.sick&&!E.kw.hate)return false;return c.af<(E.kw.frenesie?2:1)+(c.xat||0)}
function costOf(G,s,h){const cd=CARDS[h.k];let c=cd.c;if(cd.cred&&G)c=Math.max(cd.cred.min||0,c-(fl(G,s)[cd.cred.f]||0));   // Binge-watching : moins cher par Weebos
  const P=G&&G.p&&G.p[s];if(P&&P.cdis>0)c=Math.max(0,c-1);return c}                                                   // Expédition : cartes −1 pendant tes premiers tours
// les sorts qui visent un ennemi peuvent aussi viser une de tes créatures (jamais imposé : on choisit toujours sa cible)
const SPX={ec:'c',e:'ea'};
function cryTg(cd){if(cd.t==='s')return cd.tg?{tg:(!cd.noAlly&&SPX[cd.tg])||cd.tg,tgf:cd.tgf,sg2:cd.tg2}:null;
  const l=cd.cry;if(!l)return null;for(const o of l)if(o.tg)return{tg:o.tg,tgf:o.tgf,tg2:o.tg2};return null}
// 2e cible (Lasorius, instigateur) : une de tes créatures, ou la case où il arrive (lui-même)
function tg2List(G,s,sl){const r=targets(G,s,'ac');if(sl!=null)r.push({s,i:sl});return r}
// 2e cible d'un sort (Clutch : la cible soignée) : n'importe quel héros ou créature, sauf la 1re cible
function sp2List(G,s,t1){return targets(G,s,'any').filter(t=>!(t1&&t.s===t1.s&&t.i===t1.i))}
function playable(G,s,i){
  if(G.over||G.cur!==s||pend(G,s))return false;const P=G.p[s],h=P.hand[i];if(!h||h.k==='?')return false;const cd=CARDS[h.k];
  if(costOf(G,s,h)>P.eth)return false;
  if(cd.needHand&&P.hand.length<2)return false;                     // Miroir de Kalandra : une autre carte à dupliquer
  if(cd.t==='c'||cd.needSlot){if(!P.board.some(c=>!c))return false;if(cd.t==='c')return true}
  const sp=cryTg(cd);if(sp)return targets(G,s,sp.tg,sp.tgf).length>0;return true}
function terrCost(G,s,t){let c=TD[t.d].cost;if(G&&s!=null)for(const b of G.p[s].board)if(b&&!b.mut&&CARDS[b.k].tdisc)c-=1;return Math.max(1,c)}
// ---------- déplacements : coût et plafond ----------
// Une créature déplacée (ou échangée) coûte du Démoflux, un terrain déplacé coûte de l'Or. Le n-ième déplacement du tour coûte n.
// Le plafond par tour se règle dans les options du défi (mv : 0 = interdits).
function mvMax(G){return 0}                                      // les déplacements de créatures et de terrains ont été retirés
function mvCost(G,s){return 1+(G.p[s].mvn||0)}
function mvLeft(G,s){return Math.max(0,mvMax(G)-(G.p[s].mvn||0))}
function canMoveC(G,s){return!G.over&&G.cur===s&&!pend(G,s)&&mvLeft(G,s)>0&&G.p[s].eth>=mvCost(G,s)}
function canMoveT(G,s){return!G.over&&G.cur===s&&!pend(G,s)&&!!G.o.ter&&mvLeft(G,s)>0&&G.p[s].or>=mvCost(G,s)}
function mvWhy(G,s,terr){
  if(mvMax(G)<=0)return 'Les créatures et les terrains ne se déplacent plus.';
  if(mvLeft(G,s)<=0)return 'Déplacements épuisés pour ce tour (maximum '+mvMax(G)+').';
  const c=mvCost(G,s);return terr?'Pas assez d’Or pour déplacer un terrain (coût : '+c+' 🪙).':'Pas assez de Démoflux pour déplacer une créature (coût : '+c+' ◆).'}
function canBuy(G,s,n){if(G.over||G.cur!==s||!G.o.ter||pend(G,s))return false;const t=G.shop[n];return!!t&&G.p[s].or>=terrCost(G,s,t)}
// relancer la boutique de terrains : les 2 terrains proposés sont remplacés par 2 nouveaux, pour 2 Or
const ROLLC=2;
function canRoll(G,s){return!G.over&&G.cur===s&&!!G.o.ter&&!pend(G,s)&&G.p[s].or>=ROLLC&&(G.tdeck.length+G.tdis.length+G.shop.length)>0}
function canExil(G,s,i){if(G.over||G.cur!==s||pend(G,s))return false;const P=G.p[s],c=P.board[i];if(!c||c.ex||!hasFC(c,'expats'))return false;
  const n=fl(G,s).expats||0;return n>=1&&P.or>=trCost(G,s)}
// prix d'un voyage Expats : gratuit tant qu'un Nomade (citoyen du monde) est en jeu
function trCost(G,s){const P=G.p[s],R=P.rx;if(P.board.some(b=>b&&!b.mut&&CARDS[b.k].freeTr))return 0;
  if(R&&R.tr1&&!P.xt)return 0;return Math.max(0,exCost(fl(G,s).expats||0)-((R&&R.trDisc)||0))}   // Expédition : 1er voyage gratuit (l'Expat), Valise diplomatique
// une de tes créatures part à l'étranger (vrai voyage, pas la fumée) : Nomade (collectionneur de tampons) gagne 1 Or
function goneAbroad(G,s){G.p[s].board.forEach((b,i)=>{if(b&&!b.mut&&CARDS[b.k].abrOr)gold(G,s,1,b.k,{ss:s,si:i})})}
// retour de voyage : effets « à son retour » (Takk, Loractys), puis Nomade (chargé de souvenirs : pioche ; citoyen du monde : +1/+1)
function backHooks(G,s,list){const P=G.p[s];
  for(const c of list){const i=slotOf(G,s,c);if(i<0||G.over)continue;const cd=CARDS[c.k];
    if(c.xb){c.xb=0;c.a++;c.h++;lg(G,{t:'buff',ts:s,i,k:c.k,ba:1,bh:1,cs:P.rx&&P.rx.src&&P.rx.src.tr1})}   // l'Expat : revient avec +1/+1
    if(!c.mut&&cd.onBack)runFx(G,cd.onBack,{s,src:c.k,self:c,tg:null,pc:0,sl:i,ss:s,si:i});
    P.board.forEach((b,j)=>{if(!b||b.mut||G.over)return;const bd=CARDS[b.k];
      if(bd.backDraw)draw(G,s,1);
      if(bd.backBuff){const k=slotOf(G,s,c);if(k>=0){c.a++;c.h++;lg(G,{t:'buff',ts:s,i:k,k:c.k,ba:1,bh:1,cs:b.k})}}})}}
// événement du Bazar lancé par une carte (Organisateur), du point de vue de celui qui la joue
function runEv(G,s,n,src){const ev=EVENTS[n];if(!ev)return;lg(G,{t:'ev',n:ev.n,cs:src});runFx(G,ev.fx,{s,src:'ev',tg:null,pc:0})}

// ---------- dégâts, soins, pioche ----------
function heroHit(G,s,n,src,q,x){if(n<=0)return 0;G.p[s].hp-=n;if(!q)lg(G,{t:'dmg',ts:s,i:-1,src,n,ss:x?x.ss:null,si:x?x.si:null});return n}
function dmgC(G,s,i,n,src,q,x){
  const c=G.p[s].board[i];if(!c||n<=0)return 0;
  if(c.eg){c.eg=0;lg(G,{t:'egide',ts:s,i,k:c.k});return 0}
  if(c.inv){lg(G,{t:'inv',ts:s,i,k:c.k});return 0}
  const st=q?undefined:snap(G,s,i);c.dm+=n;
  if(!q)lg(G,{t:'dmg',ts:s,i,k:c.k,src,n,ss:x?x.ss:null,si:x?x.si:null,st});
  if(src!=='venin'&&eff(G,s,i).hp>0)tiltQ(G,s,i);return n}   // v20 : les dégâts du Venin ne déclenchent pas le Tilt
// Tilt : quand une créature subit des dégâts et survit, son effet « Tilt : … » se déclenche (celui de la carte,
// puis celui du terrain sous elle). Les déclenchements sont mis en file et résolus après le coup en cours
// (après les dégâts de riposte d'un combat, par exemple), au plus 40 par action pour éviter les boucles.
function tiltQ(G,s,i){const c=G.p[s].board[i];if(!c)return;const TE=tfxC(terrOf(G,s,i),c);
  if((!c.mut&&CARDS[c.k].tilt)||(TE&&TE.tilt))G.tq.push({s,id:c.id})}
function flushTilt(G){
  if(G.tf||!G.tq||!G.tq.length)return;G.tf=1;
  try{for(let n=0;n<40&&G.tq.length&&!G.over;n++){
    const q=G.tq.shift(),P=G.p[q.s],i=P.board.findIndex(b=>b&&b.id===q.id);if(i<0)continue;
    const c=P.board[i],cd=CARDS[c.k],T=terrOf(G,q.s,i),TE=tfxC(T,c);if(eff(G,q.s,i).hp<=0)continue;
    const L=[];if(!c.mut&&cd.tilt)L.push([cd.tilt,c.k]);if(TE&&TE.tilt)L.push([TE.tilt,'T:'+T.d]);if(!L.length)continue;
    c.tc=(c.tc||0)+1;lg(G,{t:'tilt',ts:q.s,i,k:c.k});
    for(const[l,src]of L){if(G.over)break;const j=slotOf(G,q.s,c);if(j<0)break;const x={s:q.s,src,self:c,tg:null,pc:0,sl:j,ss:q.s,si:j};if(src[0]==='T')runT(G,q.s,T,l,x);else runFx(G,l,x)}}
  }finally{G.tf=0;G.tq.length=0}}
function hit(G,s,i,n,src,x){return i<0?heroHit(G,s,n,src,false,x):dmgC(G,s,i,n,src,false,x)}
function heal(G,s,n,src){const P=G.p[s],v=Math.min(n,P.mhp-P.hp);if(v>0){P.hp+=v;lg(G,{t:'heal',ts:s,n:v,src})}return v}
function healC(G,s,i,n){const c=G.p[s].board[i];if(!c||c.dm<=0)return 0;const v=Math.min(n,c.dm);c.dm-=v;lg(G,{t:'hc',ts:s,i,k:c.k,n:v});
  if(!c.mut&&CARDS[c.k].healGrow){c.a+=1;lg(G,{t:'buff',ts:s,i,k:c.k,ba:1,bh:0})}       // Minuit (golem Pfizer) : +1 ATK à chaque soin
  return v}
function addPz(G,s,i,n,x){
  if(n<=0)return;
  const sid=x&&(x.sid||(x.self&&x.self.id));

  if(i<0){
    const old=G.p[s].pz;
    G.p[s].pz=Math.min(4,old+n);
    const added=G.p[s].pz-old;
    if(added<=0)return;
    if(sid)G.p[s].pzBy=sid;
    n=added;
  }else{
    const c=G.p[s].board[i];
    if(!c||(!c.mut&&(CARDS[c.k].noPz||(CARDS[c.k].bazNoPz&&x&&x.baz))))return;
    c.pz+=n;
    if(sid)c.pzBy=sid;
  }

  lg(G,{t:'pz',ts:s,i,k:i<0?null:G.p[s].board[i].k,n,src:x?x.src:undefined,ss:x?x.ss:null,si:x?x.si:null})
}
function gold(G,s,n,src,x){if(n<=0)return;G.p[s].or+=n;lg(G,{t:'gold',ts:s,n,src,ss:x?x.ss:null,si:x?x.si:null})}
function goldStealBlocked(G,s){return G.p[s].board.some(c=>c&&!c.mut&&c.ex&&CARDS[c.k].travelGoldGuard)}
// cimetière : sorts joués, créatures mortes, cartes défaussées ou brûlées (les jetons n'y vont pas)
function toGrave(P,c){if(c&&!CARDS[c.k].tok)P.grave.push({k:c.k,id:c.id})}
// deck vide : le cimetière est remélangé pour former un nouveau deck
function refill(G,s){const P=G.p[s];if(P.deck.length)return true;if(!P.grave.length)return false;
  P.deck=shuf(G,P.grave.map(c=>({k:c.k,id:++G.uid})));P.grave=[];P.rsh++;lg(G,{t:'reshuf',ts:s,n:P.deck.length});return true}
function draw(G,s,n){const P=G.p[s];
  for(let j=0;j<n;j++){
    if(!refill(G,s)){if(G.o.exped){give(G,s,'pleb',1);continue}   // Expédition : pas de Fatigue, un Pleb rejoint la main quand tout est déjà joué
      P.fat++;lg(G,{t:'fat',ts:s,n:P.fat});heroHit(G,s,P.fat,'fat');continue}
    const c=P.deck.pop();
    if(P.hand.length>=G.o.hand){toGrave(P,c);lg(G,{t:'burn',ts:s,k:c.k})}else{P.hand.push(c);lg(G,{t:'draw',ts:s,n:1})}}}
function give(G,s,k,n){const P=G.p[s];for(let j=0;j<n;j++){
  if(P.hand.length>=G.o.hand){lg(G,{t:'burn',ts:s,k});continue}P.hand.push(mkCard(G,k));lg(G,{t:'add',ts:s,k,pv:s})}}
// une créature arrive sur une case : effet « Arrivée » du terrain
function arrive(G,s,i){const c=G.p[s].board[i];if(!c)return;const T=terrOf(G,s,i),TE=tfxC(T,c);
  if(TE&&TE.arr){lg(G,{t:'tfx',ts:s,i,d:T.d,k:c.k});runT(G,s,T,TE.arr,{s,src:'T:'+T.d,self:c,sl:i,ss:s,si:i,tg:null,pc:0})}}
// invocation : sur la case libre la plus à droite (sinon vers la gauche), sauf case imposée ; son Cri d'arrivée se déclenche, avec une cible tirée au hasard
function rightSlot(G,s){const B=G.p[s].board;for(let i=CELLS-1;i>=0;i--)if(!B[i])return i;return -1}
// case libre la plus proche d'une source : d'abord à sa droite, puis sa propre case (si elle est libre), puis à sa gauche
function nearSlot(G,s,n){const B=G.p[s].board;for(let i=n+1;i<CELLS;i++)if(!B[i])return i;if(isCell(n)&&!B[n])return n;for(let i=n-1;i>=0;i--)if(!B[i])return i;return -1}
function srcSlot(G,x){if(x.self){const i=slotOf(G,x.s,x.self);if(i>=0)return i}return x.ss===x.s&&isCell(x.si)?x.si:null}
function summon(G,s,k,o){
  o=o||{};const P=G.p[s];let sl=o.sl;if(!isCell(sl)||P.board[sl])sl=o.near!=null&&isCell(o.near)?nearSlot(G,s,o.near):rightSlot(G,s);if(sl<0)return null;
  const c=mkC(G,k);c.o=o.o!=null?o.o:s;c.sm=o.real?0:1;if(o.a!=null){c.a=o.a;c.h=o.h}if(c.h<=0&&CARDS[k].cry)c.pd=1;P.board[sl]=c;lg(G,{t:'sum',ts:s,i:sl,k});arrive(G,s,sl);
  if(!o.noCry)autoCry(G,s,c);
  c.pd=0;return c}
// Cri d'arrivée d'une créature qui arrive sans être jouée depuis la main (invocation, Respawn…) : plus de hasard.
// Un joueur humain choisit la cible (choix en attente « tg »), l'IA prend la meilleure : un ennemi pour un effet nuisible, un allié sinon
const HARM={dmg:1,mute:1,kick:1,blk:1,ctl:1,ban:1,kill:1,pz:1,swap:1,clashT:1,setHp1:1,healE:1,tOff:1,dmgFam:1,dmgEx:1,goldDmg:1,drainAff:1};
function cryList(G,s,c,cd){const sp=cryTg(cd);if(!sp||sp.tg==='ecell')return null;                     // Blizzard : il choisit seul le meilleur endroit
  if(sp.tg==='eslot')return{cell:1,list:targets(G,s,sp.tg)};
  if(sp.tg==='eterr'||sp.tg==='terr')return{terr:1,list:targets(G,s,'eterr')};
  const op=cd.cry.find(o=>o.tg)||{},harm=!!HARM[op.t];
  return{harm,list:targets(G,s,sp.tg,sp.tgf,op.t==='bounceOwn'?c.id:null).filter(q=>harm?q.s!==s:q.s===s)}}
function cryBest(G,s,L){let b=null,bv=-1e9;for(const t of L.list){let v;                                   // la cible la plus intéressante (créature la plus forte, terrain le plus cher)
  if(L.cell)return t;
  if(L.terr){const P=G.p[t.s],T=P.terrs.find(q=>q.id===P.cells[t.i]);v=T?TD[T.d].cost||0:0}else if(t.i<0)v=L.harm?4:1;else{const E=eff(G,t.s,t.i);v=E.a*1.2+E.hp*.8+CARDS[G.p[t.s].board[t.i].k].r}
  if(v>bv){bv=v;b=t}}return b}
function cryTgOf(G,L,t){return!t?null:L.terr||L.cell?{s:t.s,i:t.i,cell:1}:resolveTg(G,t,false)}
function autoTg(G,s,c,cd){const L=cryList(G,s,c,cd);return L?cryTgOf(G,L,cryBest(G,s,L)):null}
function cryRun(G,s,c,tg,i){G.cdp=(G.cdp||0)+1;try{runCry(G,s,c,{s,src:c.k,self:c,tg,tg2:'self',pc:G.played,sl:i,ss:s,si:i})}finally{G.cdp--}}
function autoCry(G,s,c){const cd=CARDS[c.k];if(!cd.cry||G.over)return;const i=slotOf(G,s,c);if(i<0||(G.cdp||0)>=3)return;   // 3 cris imbriqués au plus
  const L=cryList(G,s,c,cd);
  if(L&&!L.terr&&!L.cell&&L.list.length>1&&G.p[s].hum){G.p[s].pq.push({m:'tg',id:c.id,k:c.k,t:L.list,c:L.list.map(t=>{const b=t.i>=0&&G.p[t.s].board[t.i];return b?{k:b.k,id:b.id,s:t.s,i:t.i}:{k:null,id:0,s:t.s,i:-1}})});return}   // le joueur choisira
  cryRun(G,s,c,L?cryTgOf(G,L,cryBest(G,s,L)):null,i)}
// Loractys (abuseur du système) : les Cris d'arrivée (dbl) et les Agonies (dblLast) de tes autres créatures se déclenchent deux fois
function dblOn(G,s,c,key){return G.p[s].board.some(b=>b&&b.id!==c.id&&!b.mut&&CARDS[b.k][key])}
function runCry(G,s,c,x){const cd=CARDS[c.k],tw=dblOn(G,s,c,'dbl');runFx(G,cd.cry,x);if(tw&&!G.over){lg(G,{t:'echo',ts:s,i:x.sl,k:c.k});runFx(G,cd.cry,x)}}
// ban : true = Bannie, 2 = Kick (retour en main)
function removeC(G,s,i,ban){const c=G.p[s].board[i];if(!c)return null;auraOff(G,s,i);G.p[s].board[i]=null;
  lg(G,{t:'die',ts:s,i,k:c.k,ban:ban===true||ban===1?1:0,kick:ban===2?1:0});return c}
// Gollwyd (nostalgique de la vieille époque) : tant qu'il est sur un plateau, toutes les autres créatures sont Mute.
// c.pm = Mute permanent (sort Mute, Instamuter…), c.mut = Mute effectif ; un bonus de PV perdu ainsi ne tue pas
function syncMute(G){
  const on=[];for(const P of G.p)for(const b of P.board)if(b&&!b.pm&&CARDS[b.k].muteAll)on.push(b.id);
  for(let s=0;s<2;s++){const B=G.p[s].board;for(let i=0;i<CELLS;i++){const c=B[i];if(!c)continue;
    const m=(c.pm||on.some(id=>id!==c.id))?1:0;if(m===c.mut)continue;
    if(m){const hb=eff(G,s,i).hp;auraOff(G,s,i);c.mut=1;const ha=eff(G,s,i).hp;if(hb>=1&&ha<1)c.dm=Math.max(0,c.dm-(1-ha))}else c.mut=0}}}

// une créature change de camp et arrive sur la case ti (elle garde son état ; elle ne peut pas attaquer ce tour-ci)
function moveCtl(G,fs,fi,ts,ti){const c=G.p[fs].board[fi];if(!c||G.p[ts].board[ti])return null;auraOff(G,fs,fi);G.p[fs].board[fi]=null;
  c.sick=1;c.af=0;c.ex=0;c.xa=0;c.xat=0;G.p[ts].board[ti]=c;lg(G,{t:'ctl',ts:fs,i:fi,to:ts,ti,k:c.k});moveBoundTerrains(G,[{id:c.id,from:fs,to:ts}]);return c}

// ---------- Expédition : reliques, pouvoirs de patron, règles d'élite et de boss ----------
// P.rx (lecture seule, partagé par les copies de l'IA) : effets du camp ; P.rx.src[effet] = source affichée (« x:id »).
// Compteurs propres à la partie, copiés avec le joueur : xh (1re créature), xe (1re Égide), xc (sorts à annuler), xr (Replay), xt (1er voyage), xo (Or des premiers tours), xk (tours du boss), xph (2e phase), cdis (tours à coût réduit).
function rxSrc(P,k){return P.rx&&P.rx.src?P.rx.src[k]:null}
function rxStart(G){for(let s=0;s<2;s++){const P=G.p[s],R=P.rx;if(!R)continue;
  if(R.cap)P.cap+=R.cap;if(R.or)P.or+=R.or;
  for(let j=0;j<(R.draw||0);j++){const c=P.deck.pop();if(c)P.hand.push(c)}
  for(let j=0;j<(R.dofus||0);j++)OPS.dofus(G,{},{s});
  if(R.coin)P.hand.push(mkCard(G,'piece'));                                                        // Pièce truquée
  for(let j=0;j<(R.plebStart||0);j++)summon(G,s,'pleb',{noCry:1});                                // Sac de Plebs
  const E=G.p[1-s];for(let j=0;j<(R.junkFoe||0);j++)if(E.hand.length<G.o.hand)E.hand.push(mkCard(G,'xcurse1'));   // Micro ouvert : des Pings fantômes chez l'adversaire
  for(let j=0;j<(R.discFoe||0)&&E.hand.length;j++){const c=E.hand.splice(ri(G,E.hand.length),1)[0];toGrave(E,c);lg(G,{t:'disc',ts:1-s,k:c.k,cs:rxSrc(P,'discFoe')})}   // Clavier mécanique
  P.cdis=R.ncost||0;P.xc=R.counter||0;P.xr=R.replay||0;P.xes=R.echoSpell||0}}
function rxPlay(G,s,c){const P=G.p[s],R=P.rx||{},i=slotOf(G,s,c),Q=G.p[1-s];if(i<0)return;
  const kw=(k,src)=>{c.gk=Object.assign({},c.gk);c.gk[k]=1;lg(G,{t:'kwg',ts:s,i,k:c.k,kw:k,cs:rxSrc(P,src)})};
  if(R.hasteFirst&&!P.xh){P.xh=1;kw('hate','hasteFirst')}
  else if(R.hasteTurn&&P.xht!==G.turn){P.xht=G.turn;kw('hate','hasteTurn')}
  else if(R.hasteAll)kw('hate','hasteAll');
  if(R.egFirst&&!P.xe){P.xe=1;c.eg=1;lg(G,{t:'kwg',ts:s,i,k:c.k,kw:'egide',cs:rxSrc(P,'egFirst')})}
  if(R.hpPlus){c.h+=R.hpPlus;lg(G,{t:'buff',ts:s,i,k:c.k,ba:0,bh:R.hpPlus,cs:rxSrc(P,'hpPlus')})}
  if(R.tauntFirst&&!P.xtf){P.xtf=1;kw('rempart','tauntFirst')}                                        // Gros tank : sa 1re créature a Rempart
  if(R.plebPlay&&!CARDS[c.k].tok){const p=summon(G,s,'pleb',{near:i,noCry:1});if(p)lg(G,{t:'rx',ts:s,src:rxSrc(P,'plebPlay'),tx:'un fan débarque'})}   // Fan club
  if(Q.rx&&Q.rx.copyFoe&&!Q.xcp&&!CARDS[c.k].tok){Q.xcp=1;const cp=summon(G,1-s,c.k,{noCry:1});if(cp)lg(G,{t:'rx',ts:1-s,src:rxSrc(Q,'copyFoe'),k:c.k,tx:'copie'})}}   // Copieur : ta 1re créature est copiée chez lui
function rxDeath(G,s,c,E){const Q=G.p[1-s],Pw=G.p[s];
  if(Pw.rx&&Pw.rx.boom&&!G.over)heroHit(G,1-s,Pw.rx.boom,rxSrc(Pw,'boom'));                           // Kamikaze : ses créatures explosent en mourant
  if(Q.rx&&Q.rx.ping&&!G.over)heroHit(G,s,Q.rx.ping,rxSrc(Q,'ping'));                               // Sel de rage, le Rageux : une créature ennemie meurt
  const os=c.o!=null?c.o:s,O=G.p[os];
  if(O.rx&&O.xr>0&&!CARDS[c.k].tok&&!c.sm&&!(E&&E.kw.respawn&&!c.rs)&&O.hand.length<G.o.hand){      // Replay : la créature revient dans la main (une fois par combat)
    const gi=O.grave.findIndex(q=>q.id===c.id);if(gi>=0){O.grave.splice(gi,1);O.xr--;O.hand.push({k:c.k,id:++G.uid});lg(G,{t:'rx',ts:os,src:rxSrc(O,'replay'),k:c.k,tx:'revient dans la main'})}}}
function rxTurn(G,s){const P=G.p[s],R=P.rx,E=G.p[1-s];
  if(R.afk1&&!P.xafk){P.xafk=1;lg(G,{t:'rx',ts:s,src:rxSrc(P,'afk1'),tx:'est AFK et passe son tour'});return true}   // AFK : passe son premier tour
  if(R.junkTurn&&E.hand.length<G.o.hand){E.hand.push(mkCard(G,'xcurse1'));lg(G,{t:'rx',ts:s,src:rxSrc(P,'junkTurn'),tx:'te spamme un Ping fantôme'})}   // Spammeur
  if(R.steal&&E.or>0&&!goldStealBlocked(G,1-s)){const n=Math.min(E.or,R.steal);E.or-=n;P.or+=n;lg(G,{t:'gold',ts:s,n,from:1-s,src:rxSrc(P,'steal'),ss:1-s,si:-1})}   // Voleur
  if(R.venomFoe){E.pz=(E.pz||0)+R.venomFoe;E.pzBy=null;lg(G,{t:'rx',ts:s,src:rxSrc(P,'venomFoe'),tx:'te flamme : +'+R.venomFoe+' Venin à ton héros'})}   // Flammeur
  if(R.burn){const L=[];E.board.forEach((c,i)=>{if(c&&!c.ex)L.push(i)});if(L.length){const i=pick(G,L);lg(G,{t:'rx',ts:s,src:rxSrc(P,'burn'),tx:'met le feu'});hit(G,1-s,i,R.burn,rxSrc(P,'burn'));reap(G);if(G.over)return}}   // Pyromane
  if(R.botEvery){P.xbt=(P.xbt||0)+1;if(P.xbt%R.botEvery===0){const b=summon(G,s,'bot',{noCry:1});if(b)lg(G,{t:'rx',ts:s,src:rxSrc(P,'botEvery'),tx:'invoque un Bot de modération'})}}   // Bot Discord
  if(R.selfDmg){heroHit(G,s,R.selfDmg,rxSrc(P,'selfDmg'));reap(G);if(G.over)return}
  if(R.orTurn&&(P.xo||0)<R.orTurn){P.xo=(P.xo||0)+1;gold(G,s,1,rxSrc(P,'orTurn'))}
  if(R.drawTurn){lg(G,{t:'rx',ts:s,src:rxSrc(P,'drawTurn'),tx:'pioche '+R.drawTurn+' carte'+(R.drawTurn>1?'s':'')+' de plus'});draw(G,s,R.drawTurn);if(G.over)return}
  if(R.evTurn){runEv(G,s,ri(G,EVENTS.length),R.evTurn);reap(G);if(G.over)return}
  if(R.snipe){let bi=-1,bv=-1;const L=fl(G,1-s);E.board.forEach((c,i)=>{if(!c)return;const e=eff(G,1-s,i,L),v=e.a*10+e.hp;if(v>bv){bv=v;bi=i}});
    if(bi>=0){lg(G,{t:'rx',ts:s,src:rxSrc(P,'snipe'),tx:'tir d’élite'});hit(G,1-s,bi,R.snipe,rxSrc(P,'snipe'));reap(G);if(G.over)return}}
  if(R.balance){const src=rxSrc(P,'balance');let l=-1,r=-1;for(let i=0;i<CELLS;i++)if(E.board[i]){l=i;break}for(let i=CELLS-1;i>=0;i--)if(P.board[i]){r=i;break}
    if(l>=0){const c=E.board[l];c.a=Math.max(0,c.a-1);c.h-=1;lg(G,{t:'buff',ts:1-s,i:l,k:c.k,ba:-1,bh:-1,cs:src})}
    if(r>=0){const c=P.board[r];c.a++;c.h++;lg(G,{t:'buff',ts:s,i:r,k:c.k,ba:1,bh:1,cs:src})}
    reap(G);if(G.over)return}
  if(R.crash){P.xk=(P.xk||0)+1;if(P.xk%R.crash===0){let bi=-1,bv=-1;E.board.forEach((c,i)=>{if(c&&!CARDS[c.k].tok){const v=CARDS[c.k].c*10+eff(G,1-s,i).a;if(v>bv){bv=v;bi=i}}});
    if(bi>=0){const c=E.board[bi];lg(G,{t:'rx',ts:s,src:rxSrc(P,'crash'),tx:'crashe le serveur'});OPS.kick(G,{},{s,tg:{s:1-s,i:bi,id:c.id}});reap(G)}}}}
function rxPhase(G){let hit2=false;
  for(let s=0;s<2;s++){const P=G.p[s],R=P.rx;if(R&&R.rq&&!P.xrq&&P.hp>0&&P.hp<=R.rq.at&&!G.over){P.xrq=1;hit2=true;lg(G,{t:'rx',ts:s,src:rxSrc(P,'rq'),tx:'rage-quit !'});heroHit(G,1-s,R.rq.n,rxSrc(P,'rq'))}}   // Bouton Rage-quit
  for(let s=0;s<2;s++){const P=G.p[s],R=P.rx;if(!R||!R.phase||P.xph||P.hp<=0||P.hp>R.phase.at||G.over)continue;
  P.xph=1;hit2=true;const F=R.phase,src=rxSrc(P,'phase');lg(G,{t:'rx',ts:s,src,tx:F.tx||'passe en 2e phase'});
  if(F.wipe)G.p[1-s].board.forEach(c=>{if(c)c.dm+=99999});
  for(let j=0;j<(F.sum||0);j++){const k=pick(G,F.pool||['pleb']);const c=summon(G,s,k,{noCry:1});if(!c)break}
  if(F.buff)P.board.forEach((c,i)=>{if(c){c.a+=F.buff;c.h+=F.buff;lg(G,{t:'buff',ts:s,i,k:c.k,ba:F.buff,bh:F.buff,cs:src})}});
  if(F.heal)heal(G,s,F.heal,src)}
  return hit2}

// ---------- morts ----------
function checkOver(G){
  if(G.over)return;const a=G.p[0].hp<=0,b=G.p[1].hp<=0;
  if(a||b)G.over={w:a&&b?-1:(a?1:0)}}
function reap(G){
  if(G.rp)return;G.rp=1;
  try{syncMute(G);for(let it=0;it<60;it++){
    let d=null;
    outer:for(const s of [G.cur,1-G.cur]){const L=fl(G,s);for(let i=0;i<CELLS;i++){const c=G.p[s].board[i];if(c&&!c.pd){const E=eff(G,s,i,L);if(E.hp<=0){d={s,i,c,E};break outer}}}}
    if(!d)break;
    const{s,i,c,E}=d,cd=CARDS[c.k],P=G.p[s];
    if(E.h>0&&c.inv){c.dm=Math.max(0,E.h-1);continue}       // invincible : ne meurt pas ce tour-ci
    // Respawn (mot-clé ou donné par Lasorius, mets une pierre) : la créature revient une fois avec 1 PV (voir plus bas)
    const OP=G.p[c.o!=null?c.o:s];removeC(G,s,i,false);if(!c.sm)toGrave(OP,c);syncMute(G);lockSweep(G);   // au cimetière de son propriétaire
    if(G.p[0].rx||G.p[1].rx)rxDeath(G,s,c,E);
    const oppT=G.cur!==s;
    P.board.forEach((b,j)=>{if(!b||b.mut)return;const bd=CARDS[b.k];
      if(bd.allyDieAff&&affC(c,bd.allyDieAff.g)>0){const y=bd.allyDieAff;b.a+=y.a;b.h+=y.h;lg(G,{t:'buff',ts:s,i:j,k:b.k,ba:y.a,bh:y.h})}   // Elkatrix (unleashed) : une créature avec une affinité LoL est morte
      if(oppT&&bd.xatk){b.xa=(b.xa||0)+1;lg(G,{t:'xa',ts:s,i:j,k:b.k,n:b.xa})}});
    const x={s,src:c.k,self:c,tg:null,pc:G.played,sl:i,ss:s,si:i};
    if(!c.mut&&cd.last){const tw=dblOn(G,s,c,'dblLast');runFx(G,cd.last,x);if(tw&&!G.over){lg(G,{t:'echo',ts:s,i,k:c.k,last:1});runFx(G,cd.last,x)}}
    if(E.TE&&E.TE.last&&!G.over){lg(G,{t:'tfx',ts:s,i,d:E.T.d,k:c.k});runT(G,s,E.T,E.TE.last,Object.assign({},x,{src:'T:'+E.T.d}))}
    if(E.kw.respawn&&(c.rsp||!c.rs)&&!c.rh&&!G.over&&!P.board[i]){
      const gi=OP.grave.findIndex(q=>q.id===c.id);if(gi>=0)OP.grave.splice(gi,1);
      const n=mkC(G,c.k);n.o=c.o;n.a=c.a;n.h=c.h;n.rs=1;n.sick=1;n.sm=c.sm;n.pm=c.pm;n.mut=c.mut;P.board[i]=n;
      if(!cd.rsFull){const E2=eff(G,s,i);n.dm=Math.max(0,E2.h-1)}
      lg(G,{t:'sum',ts:s,i,k:c.k,rs:1});if(!(E.TE&&E.TE.rsq))autoCry(G,s,n)}   // Esprit guérisseur : sans redéclencher ses effets
  }lockSweep(G)}finally{G.rp=0}
  if(((G.p[0].rx&&(G.p[0].rx.phase||G.p[0].rx.rq))||(G.p[1].rx&&(G.p[1].rx.phase||G.p[1].rx.rq)))&&rxPhase(G)){reap(G);return}   // Expédition : 2e phase d'un boss, Rage-quit
  checkOver(G);flushTilt(G)}

// ---------- effets ----------
function cond(G,c,x){
  if(c.has){const B=G.p[x.s].board;return B.some(b=>b&&CARDS[b.k].base===c.has&&(!x.self||b.id!==x.self.id))}
  if(c.comb)return G.played>0;
  if(c.fac)return(fl(G,x.s)[c.fac[0]]||0)>=c.fac[1];                // au moins N créatures d'une famille
  if(c.nfac)return(fl(G,x.s)[c.nfac[0]]||0)<c.nfac[1];
  if(c.anyT)return G.p[x.s].board.some((b,i)=>b&&tgOf(G,x.s,i)===c.anyT);   // une de tes créatures sur un terrain de ce jeu
  if(c.aff)return G.p[x.s].board.some(b=>b&&affC(b,c.aff[0])>=c.aff[1]);   // une de tes créatures avec cette affinité
  if(c.ter||c.gt||c.ngt||c.terIn){const i=selfI(G,x),T=i>=0?terrOf(G,x.s,i):null;if(c.terIn)return!!T&&c.terIn.indexOf(TD[T.d].g)>=0;if(c.ter)return!!T&&TD[T.d].g===c.ter;if(c.gt)return isGT(T);return!isGT(T)}
  return true}
function sides(op,x){return op.both?[0,1]:[x.s]}
function allEnemy(G,s){const r=[{s:1-s,i:-1}];G.p[1-s].board.forEach((c,i)=>{if(c)r.push({s:1-s,i})});return r}
function vt(G,t){return!!t&&(t.i<0||(G.p[t.s].board[t.i]&&G.p[t.s].board[t.i].id===t.id))}
function tgC(G,x){const t=x.tg;if(!t||t.i<0)return null;const c=G.p[t.s].board[t.i];return c&&c.id===t.id?c:null}
function selfI(G,x){return x.self?slotOf(G,x.s,x.self):-1}
function runFx(G,list,x){const pc=G.cs;if(typeof x.src==='string')G.cs=x.src;fx0(G,list,x);G.cs=pc}
function fx0(G,list,x){
  for(const op of list){if(G.over)return;if(op.if&&!cond(G,op.if,x))continue;OPS[op.t](G,op,x);reap(G)}}
const OPS={
  dmg(G,op,x){
    if(op.rnd){for(const s of(op.both?[0,1]:[1-x.s])){const cs=[];G.p[s].board.forEach((c,i)=>{if(c)cs.push(i)});
      if(cs.length)hit(G,s,pick(G,cs),op.n,x.src,x);reap(G)}return}
    if(!vt(G,x.tg))return;hit(G,x.tg.s,x.tg.i,op.n,x.src,x)},
  dmgAll(G,op,x){for(const s of(op.side==='both'?[0,1]:[1-x.s]))G.p[s].board.forEach((c,i)=>{if(c)dmgC(G,s,i,op.n,x.src,false,x)})},
  dmgFace(G,op,x){heroHit(G,1-x.s,op.n,x.src,false,x)},
  hurtMe(G,op,x){heroHit(G,x.s,op.n,x.src,false,x)},
  rnd(G,op,x){for(let j=0;j<(op.times||1);j++){const L=targets(G,x.s,'e',null,null,true);if(!L.length)return;const t=pick(G,L);hit(G,t.s,t.i,op.n,x.src,x);reap(G);if(G.over)return}},
  rndC(G,op,x){const L=targets(G,x.s,'ec',null,null,true);if(!L.length)return;const t=pick(G,L);hit(G,t.s,t.i,op.n,x.src,x)},
  heal(G,op,x){for(const s of sides(op,x))heal(G,s,op.n,x.src)},
  healA(G,op,x){const B=G.p[x.s].board,me=selfI(G,x);
    if(op.all){B.forEach((c,i)=>{if(c)healC(G,x.s,i,op.n)});return}
    const cs=[];B.forEach((c,i)=>{if(c&&c.dm>0&&i!==me)cs.push(i)});if(cs.length)healC(G,x.s,pick(G,cs),op.n)},
  healSelf(G,op,x){const i=selfI(G,x);if(i>=0)healC(G,x.s,i,op.n)},
  grow(G,op,x){const i=selfI(G,x);if(i<0)return;const c=G.p[x.s].board[i];c.a+=op.a;c.h+=op.h;lg(G,{t:'buff',ts:x.s,i,k:c.k,ba:op.a,bh:op.h})},
  egide(G,op,x){const i=selfI(G,x);if(i<0)return;const c=G.p[x.s].board[i];if(c.eg)return;c.eg=1;lg(G,{t:'kwg',ts:x.s,i,k:c.k,kw:'egide'})},
  draw(G,op,x){for(const s of sides(op,x))draw(G,s,op.n)},
  drawOpp(G,op,x){draw(G,1-x.s,op.n)},
  disc(G,op,x){for(const s of(op.both?[0,1]:[1-x.s])){const P=G.p[s];for(let j=0;j<op.n&&P.hand.length;j++){const c=P.hand.splice(ri(G,P.hand.length),1)[0];toGrave(P,c);lg(G,{t:'disc',ts:s,k:c.k})}}},
  add(G,op,x){give(G,x.s,op.k,op.n)},
  summon(G,op,x){const n=srcSlot(G,x);for(let j=0;j<op.n;j++)summon(G,x.s,op.k,{near:n})},
  sumE(G,op,x){if(!x.tg||!x.tg.cell)return;summon(G,1-x.s,op.k,{sl:x.tg.i,o:1-x.s})},                 // Rasta : un Poutch sur la case choisie du plateau adverse
  buff(G,op,x){
    const ap=(s,i)=>{const c=G.p[s].board[i];if(!c)return;c.a=Math.max(0,c.a+op.a);c.h+=op.h;lg(G,{t:'buff',ts:s,i,k:c.k,ba:op.a,bh:op.h})};
    if(op.self){const i=selfI(G,x);if(i>=0)ap(x.s,i);return}
    if(op.all||op.others){const me=selfI(G,x);G.p[x.s].board.forEach((c,i)=>{if(c&&!(op.others&&i===me))ap(x.s,i)});return}
    if(op.rnd){const cs=[];G.p[x.s].board.forEach((c,i)=>{if(c)cs.push(i)});if(cs.length)ap(x.s,pick(G,cs));return}
    if(op.k){G.p[x.s].board.forEach((c,i)=>{if(c&&c.k===op.k)ap(x.s,i)});return}            // toutes tes créatures d'un type (ex. tes Plebs)
    if(tgC(G,x))ap(x.tg.s,x.tg.i)},
  pairBuff(G,op,x){OPS.buff(G,{a:op.a,h:op.h,self:1},x);const B=G.p[x.s].board;
    const i=B.findIndex(b=>b&&CARDS[b.k].base===op.k&&(!x.self||b.id!==x.self.id));if(i>=0){const c=B[i];c.a+=op.a;c.h+=op.h;lg(G,{t:'buff',ts:x.s,i,k:c.k,ba:op.a,bh:op.h})}},
  dbl(G,op,x){const c=tgC(G,x);if(!c)return;const E=eff(G,x.tg.s,x.tg.i),n=Math.min(E.a,op.max||99);c.a+=n;lg(G,{t:'buff',ts:x.tg.s,i:x.tg.i,k:c.k,ba:n,bh:0})},
  dblAH(G,op,x){const c=tgC(G,x);if(!c)return;const E=eff(G,x.tg.s,x.tg.i),m=op.max||99,a=Math.min(E.a,m),hh=Math.min(E.h,m);c.a+=a;c.h+=hh;lg(G,{t:'buff',ts:x.tg.s,i:x.tg.i,k:c.k,ba:a,bh:hh})},
  pz(G,op,x){if(!vt(G,x.tg))return;addPz(G,x.tg.s,x.tg.i,op.n,x)},
  pzAll(G,op,x){for(const t of allEnemy(G,x.s))addPz(G,t.s,t.i,op.n,x)},
  pzDbl(G,op,x){const e=1-x.s,P=G.p[e];if(P.pz>0)addPz(G,e,-1,P.pz,x);P.board.forEach((c,i)=>{if(c&&c.pz>0)addPz(G,e,i,c.pz,x)})},
  kill(G,op,x){const c=tgC(G,x);if(c)c.dm+=99999},
  dmgHand(G,op,x){const n=Math.min(op.max||99,G.p[1-x.s].hand.length);if(n>0)heroHit(G,1-x.s,n,x.src,false,x)},   // Korock (ban à vie)
  ban(G,op,x){
    if(op.rnd){const cs=targets(G,x.s,op.rnd,null,null,true);if(cs.length){const t=pick(G,cs);removeC(G,t.s,t.i,true)}return}
    if(tgC(G,x))removeC(G,x.tg.s,x.tg.i,true)},
  banTop(G,op,x){for(const s of sides(op,x)){let bi=-1,bv=-1;G.p[s].board.forEach((c,i)=>{if(!c)return;const v=CARDS[c.k].c*100+c.a;if(v>bv){bv=v;bi=i}});if(bi>=0)removeC(G,s,bi,true)}},
  banTopE(G,op,x){const e=1-x.s;let bi=-1,bv=-1;G.p[e].board.forEach((c,i)=>{if(!c||c.ex)return;const v=CARDS[c.k].c*100+c.a;if(v>bv){bv=v;bi=i}});if(bi>=0)removeC(G,e,bi,true)},
  kick(G,op,x){const c=tgC(G,x);if(!c)return;const t=x.tg,os=c.o!=null?c.o:t.s;                                   // retourne dans la main de celui qui l'a invoquée
    removeC(G,t.s,t.i,2);lg(G,{t:'kick',ts:os,k:c.k});const P=G.p[os],card={k:c.k,id:++G.uid};
    if(P.hand.length<G.o.hand)P.hand.push(card);else toGrave(P,card)},
  mute(G,op,x){const c=tgC(G,x);if(!c)return;auraOff(G,x.tg.s,x.tg.i);c.pm=1;c.mut=1;lg(G,{t:'mute',ts:x.tg.s,i:x.tg.i,k:c.k})},
  blk(G,op,x){
    if(op.rnd){for(let j=0;j<(op.n||1);j++){const L=targets(G,x.s,'ec',null,null,true).filter(t=>!G.p[t.s].board[t.i].blk);if(!L.length)return;
      const t=pick(G,L),c=G.p[t.s].board[t.i];c.blk=1;lg(G,{t:'blk',ts:t.s,i:t.i,k:c.k,ss:x.ss,si:x.si})}return}
    const c=tgC(G,x);if(!c)return;c.blk=1;lg(G,{t:'blk',ts:x.tg.s,i:x.tg.i,k:c.k})},
  blkAll(G,op,x){G.p[1-x.s].board.forEach((c,i)=>{if(c&&!c.ex){c.blk=1;lg(G,{t:'blk',ts:1-x.s,i,k:c.k})}})},
  or(G,op,x){gold(G,x.s,op.n,x.src,x)},
  dblOr(G,op,x){gold(G,x.s,Math.min(G.p[x.s].or,op.max),x.src,x)},
  eth(G,op,x){G.p[x.s].eth+=op.n},
  cap(G,op,x){for(const s of sides(op,x)){const P=G.p[s],v=Math.min(G.o.cap,P.cap+op.n)-P.cap;if(v>0){P.cap+=v;lg(G,{t:'capu',ts:s,n:v,src:x.src})}}},
  steal(G,op,x){const H=G.p[1-x.s].hand;if(!H.length)return;const c=pick(G,H);const P=G.p[x.s];
    if(P.hand.length<G.o.hand){P.hand.push({k:c.k,id:++G.uid});lg(G,{t:'steal',ts:x.s,k:c.k,pv:x.s})}},
  clone(G,op,x){const c=tgC(G,x);if(!c)return;summon(G,x.s,c.k,{a:c.a,h:c.h,near:x.tg.s===x.s?x.tg.i:null})},          // la copie arrive juste à droite de l'original
  rez(G,op,x){const P=G.p[x.s];for(let j=P.grave.length-1;j>=0;j--)if(CARDS[P.grave[j].k].t==='c'){const g=P.grave.splice(j,1)[0];summon(G,x.s,g.k,{real:1});return}},   // la dernière CRÉATURE du cimetière
  rage(G,op,x){const c=tgC(G,x);if(!c)return;const n=eff(G,x.tg.s,x.tg.i).a;c.dm+=99999;heroHit(G,1-x.s,n,x.src,false,x)},
  rand(G,op,x){for(let j=0;j<(op.times||1);j++){if(G.over)return;const l=pick(G,op.list);lg(G,{t:'story',ts:x.s,n:op.list.indexOf(l)});runFx(G,l,x)}},
  clash(G,op,x){const e=1-x.s;const B=G.p[e].board;let f=-1;B.forEach((c,i)=>{if(c&&!c.ex&&CARDS[c.k].base===op.k&&f<0)f=i});
    if(f>=0)dmgC(G,e,f,op.n,x.src,false,x);else{const L=targets(G,x.s,'e',null,null,true);if(L.length){const t=pick(G,L);hit(G,t.s,t.i,op.n2,x.src,x)}}},
  clashT(G,op,x){const c=tgC(G,x);if(!c)return;if(CARDS[c.k].base===op.k){lg(G,{t:'dmg',ts:x.tg.s,i:x.tg.i,k:c.k,src:x.src,n:99,ss:x.ss,si:x.si});c.dm+=99999}
    else dmgC(G,x.tg.s,x.tg.i,op.n,x.src,false,x)},
  combo(G,op,x){const i=selfI(G,x);if(i<0)return;const n=Math.min(x.pc||0,op.max||99);if(n<=0)return;
    const c=G.p[x.s].board[i];c.a+=op.a*n;c.h+=op.h*n;lg(G,{t:'buff',ts:x.s,i,k:c.k,ba:op.a*n,bh:op.h*n})},
  wipe(G,op,x){for(const s of[0,1])G.p[s].board.forEach(c=>{if(c&&!(x.self&&c.id===x.self.id))c.dm+=99999})},   // détruit toutes les autres créatures (leurs Agonies se déclenchent)
  exil(G,op,x){const me=selfI(G,x);if(me<0)return;const i=op.tg==='right'?me+1:(op.tg==='left'?me-1:me),B=G.p[x.s].board;if(B[i]&&!B[i].ex){B[i].ex=1;lg(G,{t:'exil',ts:x.s,i,k:B[i].k,n:0});goneAbroad(G,x.s)}},
  // ----- effets ajoutés avec les nouvelles cartes -----
  taunt(G,op,x){const i=selfI(G,x);if(i<0)return;const c=G.p[x.s].board[i];if(c.tr)return;c.tr=1;lg(G,{t:'kwg',ts:x.s,i,k:c.k,kw:'rempart'})},
  healT(G,op,x){G.p[x.s].board.forEach((c,i)=>{if(c&&tgOf(G,x.s,i)===op.g)healC(G,x.s,i,op.n)})},                  // tes créatures sur un terrain du jeu op.g
  healAdj(G,op,x){const me=selfI(G,x);if(me<0)return;for(const j of[me-1,me+1])if(j>=0&&j<CELLS&&G.p[x.s].board[j])healC(G,x.s,j,op.n)},   // créatures à côté
  bounceOwn(G,op,x){const P=G.p[x.s];let j=-1;if(tgC(G,x)&&x.tg.s===x.s)j=x.tg.i;else j=selfI(G,x);if(j<0)return;   // une de tes créatures (sinon lui-même) retourne en main
    const c=P.board[j],OP=G.p[c.o!=null?c.o:x.s];removeC(G,x.s,j,2);lg(G,{t:'kick',ts:c.o!=null?c.o:x.s,k:c.k});const card={k:c.k,id:++G.uid};if(OP.hand.length<G.o.hand)OP.hand.push(card);else toGrave(OP,card)},
  blkSelf(G,op,x){const i=selfI(G,x);if(i<0)return;const c=G.p[x.s].board[i];c.blk=Math.max(c.blk,op.n);lg(G,{t:'blk',ts:x.s,i,k:c.k})},
  tdestroy(G,op,x){const e=op.self?x.s:1-x.s,P=G.p[e];let id=0;                                                    // détruit un terrain (le sien sous lui, ou un adverse au hasard) ; jamais un Blizzard verrouillé
    if(op.here){const i=selfI(G,x);id=i>=0?P.cells[i]:0;if(id&&lockedId(P,id))id=0}else{const ids=[...new Set(P.cells.filter(Boolean))].filter(v=>!lockedId(P,v));id=ids.length?pick(G,ids):0}
    if(!id)return;const T=P.terrs.find(q=>q.id===id);P.cells=P.cells.map(v=>v===id?0:v);P.terrs=P.terrs.filter(q=>q.id!==id);
    lg(G,{t:'tdes',ts:e,d:T?T.d:null});keepAlive(G,e)},
  madness(G,op,x){const i=selfI(G,x);if(i<0)return;const c=G.p[x.s].board[i],P=G.p[x.s];c.mn=(c.mn||0)+1;const n=c.mn;   // Dreos : N Démoflux, N Or, N cartes
    P.eth+=n;lg(G,{t:'eth',ts:x.s,n});gold(G,x.s,n,x.src,x);draw(G,x.s,n);if(op.dmg&&!G.over)heroHit(G,1-x.s,n*op.dmg,x.src,false,x);
    if(op.self&&!G.over)heroHit(G,x.s,n*op.self,x.src,false,x)},                                                    // ... et ton héros perd N×self PV (Dreos : 2×N)
  lose(G,op,x){if(G.over)return;lg(G,{t:'lose',ts:x.s});G.over={w:1-x.s,lose:1}},
  discSelf(G,op,x){const P=G.p[x.s];for(let j=0;j<op.n&&P.hand.length;j++){const c=P.hand.splice(ri(G,P.hand.length),1)[0];toGrave(P,c);lg(G,{t:'disc',ts:x.s,k:c.k})}},
  rnd2(G,op,x){const L=targets(G,x.s,'e',null,null,true);const a=pick(G,L);if(!a)return;const ida=a.i<0?-1:G.p[a.s].board[a.i].id;hit(G,a.s,a.i,op.n,x.src,x);reap(G);if(G.over)return;   // 2 ennemis différents
    const L2=targets(G,x.s,'e',null,null,true).filter(t=>!(t.s===a.s&&(a.i<0?t.i<0:G.p[t.s].board[t.i]&&G.p[t.s].board[t.i].id===ida)));const b=pick(G,L2);if(b)hit(G,b.s,b.i,op.n,x.src,x)},
  dmgFac(G,op,x){for(const s of[0,1])G.p[s].board.forEach((c,i)=>{if(c&&hasFC(c,op.f))dmgC(G,s,i,op.n,x.src,false,x)})},   // toutes les créatures d'une famille, des deux camps
  killAll(G,op,x){for(const s of[0,1])G.p[s].board.forEach(c=>{if(c)c.dm+=99999})},
  deckSummon(G,op,x){for(const s of[x.s,1-x.s]){const P=G.p[s],ix=[];P.deck.forEach((c,j)=>{if(CARDS[c.k].t==='c')ix.push(j)});   // chaque joueur invoque une créature de son deck
    if(!ix.length||!P.board.some(b=>!b))continue;const c=P.deck.splice(pick(G,ix),1)[0];summon(G,s,c.k,{real:1})}},
  ctl(G,op,x){const c=tgC(G,x);if(!c)return;const j=G.p[x.s].board.findIndex(b=>!b);if(j<0)return;moveCtl(G,x.tg.s,x.tg.i,x.s,j);keepAlive(G,x.tg.s);keepAlive(G,x.s);arrive(G,x.s,j)},   // prend le contrôle
  swap(G,op,x){const e=tgC(G,x);if(!e)return;const me=(!op.tg2||x.tg2==='self')?selfI(G,x):(x.tg2&&vt(G,x.tg2)?x.tg2.i:-1);if(me<0)return;   // Lasorius : il change de camp contre une créature ennemie
    const A=G.p[x.s].board[me],B=e,bi=x.tg.i,bs=x.tg.s;auraOff(G,x.s,me);auraOff(G,bs,bi);G.p[x.s].board[me]=null;G.p[bs].board[bi]=null;
    for(const c of[A,B]){c.sick=1;c.af=0;c.ex=0;c.xa=0;c.xat=0}G.p[x.s].board[me]=B;G.p[bs].board[bi]=A;
    lg(G,{t:'swap',ts:x.s,i:me,k:A.k,k2:B.k,ti:bi});moveBoundTerrains(G,[{id:A.id,from:x.s,to:bs},{id:B.id,from:bs,to:x.s}]);keepAlive(G,0);keepAlive(G,1);arrive(G,x.s,me);arrive(G,bs,bi)},
  affUp(G,op,x){const c=tgC(G,x);if(!c)return;const before=affC(c,op.g);c.lb=Math.min(2,(c.lb||0)+1);if(affC(c,op.g)>before)lg(G,{t:'aff',ts:x.tg.s,i:x.tg.i,k:c.k,g:op.g,n:affC(c,op.g)})},
  hurtSelf(G,op,x){const i=selfI(G,x);if(i>=0)dmgC(G,x.s,i,op.n,x.src,false,x)},
  pzEvery(G,op,x){for(const s of[0,1])G.p[s].board.forEach((c,i)=>{if(c&&!(x.self&&c.id===x.self.id))addPz(G,s,i,op.n,x)})},   // Venin à toutes les autres créatures
  tutor(G,op,x){const P=G.p[x.s],ix=[];P.deck.forEach((c,j)=>{if(CARDS[c.k].base===op.b)ix.push(j)});if(!ix.length)return;   // pioche un personnage précis au hasard dans le deck
    const c=P.deck.splice(pick(G,ix),1)[0];if(P.hand.length>=G.o.hand){toGrave(P,c);lg(G,{t:'burn',ts:x.s,k:c.k})}else{P.hand.push(c);lg(G,{t:'draw',ts:x.s,n:1})}},
  // ----- sorts de famille et d'affinité -----
  alt(G,op,x){fx0(G,cond(G,op.c,x)?op.a:op.b,x)},                                                                // effet A si la condition est remplie, sinon B
  drawPz(G,op,x){const P=G.p[1-x.s];let n=(op.n||0)+(P.pz>0?1:0);P.board.forEach(c=>{if(c&&c.pz>0)n++});draw(G,x.s,Math.min(n,op.max||99))},   // Signalements : 1 carte par ennemi empoisonné
  pzBurst(G,op,x){const e=1-x.s;G.p[e].board.forEach((c,i)=>{if(c&&c.pz>0)dmgC(G,e,i,c.pz,x.src,false,x)})},          // Ambiance toxique : dégâts = Venin
  dmgFam(G,op,x){if(!vt(G,x.tg))return;hit(G,x.tg.s,x.tg.i,(op.n||0)+(fl(G,x.s)[op.f]||0),x.src,x)},                  // Genkidama : +1 dégât par membre de la famille
  goldDraw(G,op,x){const P=G.p[x.s],per=op.per||2,n=Math.floor(Math.min(P.or,op.max||99)/per);if(n<=0)return;      // Achat compulsif : Or -> cartes
    P.or-=n*per;lg(G,{t:'pay',ts:x.s,n:n*per,k:x.src});draw(G,x.s,n)},
  goldDmg(G,op,x){if(!vt(G,x.tg))return;const P=G.p[x.s],n=Math.min(P.or,op.max||99);if(n<=0)return;               // Pay to win : Or -> dégâts
    P.or-=n;lg(G,{t:'pay',ts:x.s,n,k:x.src});hit(G,x.tg.s,x.tg.i,n,x.src,x)},
  exilT(G,op,x){const c=tgC(G,x);if(!c||c.ex)return;c.ex=1;lg(G,{t:'exil',ts:x.tg.s,i:x.tg.i,k:c.k,n:0});goneAbroad(G,x.tg.s)},             // Vol low-cost : part à l'étranger gratuitement
  dmgEx(G,op,x){if(!vt(G,x.tg))return;let n=op.n||0;G.p[x.s].board.forEach(c=>{if(c&&c.ex&&!c.fum)n+=op.per||0});hit(G,x.tg.s,x.tg.i,n,x.src,x)},   // Coup de valise
  rndFam(G,op,x){OPS.rnd(G,{n:1,times:(op.n||0)+(fl(G,x.s)[op.f]||0)},x)},                                          // Soirée ravagée : missiles
  stealOr(G,op,x){const E=G.p[1-x.s];if(goldStealBlocked(G,1-x.s))return;const n=Math.min(E.or,op.n==='N-1'?Math.max(0,(op.f?(fl(G,x.s)[op.f]||0):0)-1):(op.n||0)+(op.f?(fl(G,x.s)[op.f]||0):0));if(n<=0)return; // vole de l'Or
    E.or-=n;G.p[x.s].or+=n;lg(G,{t:'gold',ts:x.s,n,from:1-x.s,src:x.src,ss:1-x.s,si:-1})},
  rndOr(G,op,x){const P=G.p[x.s],roll=ri(G,op.max-op.min+1)+op.min,n=roll<0?-Math.min(P.or,-roll):roll;P.or+=n;lg(G,{t:'orRoll',ts:x.s,n,roll,k:x.src,ss:x.ss,si:x.si})},
  setAtk0(G,op,x){const c=tgC(G,x);if(!c)return;c.a=0;c.ta=0;lg(G,{t:'atk0',ts:x.tg.s,i:x.tg.i,k:c.k})},
  fillDucks(G,op,x){for(const s of[0,1])for(let i=0;i<CELLS;i++)if(!G.p[s].board[i])summon(G,s,'duck',{sl:i})},
  tempFam(G,op,x){G.p[x.s].board.forEach((c,i)=>{if(c&&hasFC(c,op.f)){c.ta=(c.ta||0)+op.a;lg(G,{t:'buff',ts:x.s,i,k:c.k,ba:op.a,bh:0,tmp:1})}})},   // +ATK pendant ce tour
  rezFam(G,op,x){const P=G.p[x.s];if(!P.board.some(b=>!b))return;                                                   // C'était mieux avant : dernier membre de la famille au cimetière
    for(let j=P.grave.length-1;j>=0;j--){const k=P.grave[j].k;if(CARDS[k].t==='c'&&hasF(k,op.f)){const g=P.grave.splice(j,1)[0];summon(G,x.s,g.k,{real:1});return}}},
  drawFam(G,op,x){draw(G,x.s,Math.min(op.max||99,(op.n||0)+(fl(G,x.s)[op.f]||0)))},                                   // Nostalgie
  buffAff(G,op,x){G.p[x.s].board.forEach((c,i)=>{if(!c)return;const n=affC(c,op.g);if(n>0){c.a+=n;c.h+=n;lg(G,{t:'buff',ts:x.s,i,k:c.k,ba:n,bh:n})}})},   // Bénédiction des rois
  drainAff(G,op,x){if(!vt(G,x.tg))return;let n=0;G.p[x.s].board.forEach(c=>{if(c)n+=affC(c,op.g)});n=Math.min(n,op.max||99);if(n<=0)return;   // Drain de vie
    hit(G,x.tg.s,x.tg.i,n,x.src,x);heal(G,x.s,n,x.src)},
  drawAff(G,op,x){let n=0;G.p[x.s].board.forEach(c=>{if(c&&affC(c,op.g)>=(op.lv||1))n++});draw(G,x.s,Math.min(n,op.max||99))},   // Parchemin de sagesse
  egideT(G,op,x){G.p[x.s].board.forEach((c,i)=>{if(c&&!c.eg&&tgOf(G,x.s,i)===op.g){c.eg=1;lg(G,{t:'kwg',ts:x.s,i,k:c.k,kw:'egide'})}})},   // Bouclier Féca
  flash(G,op,x){const c=tgC(G,x);if(!c)return;const n=affC(c,op.g)*(op.per||1);if(n>0){c.ta=(c.ta||0)+n;lg(G,{t:'buff',ts:x.tg.s,i:x.tg.i,k:c.k,ba:n,bh:0,tmp:1})}   // Flash
    if(!c.th){c.th=1;lg(G,{t:'kwg',ts:x.tg.s,i:x.tg.i,k:c.k,kw:'hate'})}},
  exilTer(G,op,x){G.p[x.s].board.forEach((c,i)=>{if(c&&!c.ex&&tgOf(G,x.s,i)===op.g){c.ex=1;c.fum=1;lg(G,{t:'exil',ts:x.s,i,k:c.k,n:0,fum:1})}})},   // Fumigène : inciblables
  exFam(G,op,x){G.p[x.s].board.forEach((c,i)=>{if(c&&!c.ex&&hasFC(c,op.f)){c.ex=1;c.fum=2;lg(G,{t:'exil',ts:x.s,i,k:c.k,n:0,fum:2})}})},   // Immunité diplomatique : inciblables
  egideA(G,op,x){G.p[x.s].board.forEach((c,i)=>{if(c&&!c.eg&&affC(c,op.g)>0){c.eg=1;lg(G,{t:'kwg',ts:x.s,i,k:c.k,kw:'egide'})}})},   // Bouclier Féca : selon l'affinité
  affAll(G,op,x){const c=tgC(G,x);if(!c||(c.ab||0)>=(op.max||2))return;c.ab=(c.ab||0)+1;lg(G,{t:'aff',ts:x.tg.s,i:x.tg.i,k:c.k,g:'all',n:c.ab})},   // Smurf
  buffFam(G,op,x){const c=tgC(G,x);if(!c)return;const n=Math.min(facC(c).length,op.max||99);if(n>0)OPS.buff(G,{a:n*op.a,h:n*op.h},x)},   // Multi-casquettes (+3/+3 max)   // Multi-casquettes
  tOff(G,op,x){if(!x.tg||!x.tg.cell||!x.self)return;const P=G.p[x.tg.s],id=P.cells[x.tg.i],T=id&&P.terrs.find(q=>q.id===id);if(!T)return;   // Kirua : désactive un terrain adverse
    T.off=x.self.id;lg(G,{t:'toff',ts:x.tg.s,d:T.d,k:x.src});keepAlive(G,x.tg.s)},
  desoAll(G,op,x){G.p[1-x.s].board.forEach((c,i)=>{if(c&&!c.ds){c.ds=1;lg(G,{t:'kwg',ts:1-x.s,i,k:c.k,kw:'deso'})}})},
  blizzard(G,op,x){const e=1-x.s,P=G.p[e],n=TD.blizzard.size;let at=-1,bv=-1;                                       // Kirua : terrain Blizzard sur le plateau adverse, à la case choisie
    if(x.tg&&x.tg.cell)at=blzAt(P,x.tg.i);
    if(at<0)for(let st=0;st+n<=CELLS;st++){if(!freeSpan(P,st,n))continue;let v=0;for(let j=st;j<st+n;j++)if(P.board[j])v+=1+eff(G,e,j).a*.1;if(v>bv){bv=v;at=st}}
    if(at<0)return;                                                                                                // plus de place : un autre Blizzard verrouillé occupe tout
    lg(G,{t:'tgift',d:'blizzard',at,ts:e});const T=buyTerr(G,e,{d:'blizzard'},at);
    if(T&&x.self&&P.terrs.indexOf(T)>=0)T.lk=x.self.id;                                                            // ne peut pas être détruit, peut être recouvert, fond quand cette Kirua quitte le plateau
    keepAlive(G,e);lockSweep(G)},
  // ----- v14 -----
  respawnT(G,op,x){const c=tgC(G,x);if(!c||c.rsp)return;c.rsp=1;lg(G,{t:'kwg',ts:x.tg.s,i:x.tg.i,k:c.k,kw:'respawn'})},          // Lasorius : donne Respawn
  banOn(G,op,x){const t=pick(G,targets(G,x.s,'ec',null,null,true).filter(q=>op.g.indexOf(tgOf(G,q.s,q.i))>=0));if(t)removeC(G,t.s,t.i,true)},     // Losk (officier tyrannique)
  addRnd(G,op,x){give(G,x.s,pick(G,op.list),1)},                                                                                     // Mikalev (chef habile) : un repas au hasard
  pzRnd(G,op,x){const used=[];for(let j=0;j<(op.k||1);j++){const t=pick(G,targets(G,x.s,'ec',null,null,true).filter(q=>used.indexOf(q.i)<0));if(!t)return;used.push(t.i);addPz(G,t.s,t.i,op.n,x)}},
  tdesG(G,op,x){for(const s of[0,1]){const P=G.p[s];let del=P.terrs.filter(T=>{const g=TD[T.d].g;return(op.all||g!=='bazar')&&g!==op.keep&&!T.lk&&P.cells.indexOf(T.id)>=0});if(!del.length)continue;   // Laloutre (élitiste de l'esport) : un terrain de jeu au hasard de chaque côté (op.one), sauf CS
    if(op.one)del=[pick(G,del)];
    const ids=del.map(T=>T.id);for(const T of del)lg(G,{t:'tdes',ts:s,d:T.d});P.cells=P.cells.map(v=>ids.indexOf(v)>=0?0:v);P.terrs=P.terrs.filter(q=>ids.indexOf(q.id)<0);keepAlive(G,s)}},
  buffAffN(G,op,x){G.p[x.s].board.forEach((c,i)=>{if(c&&affC(c,op.g)>0){c.a+=op.a;c.h+=op.h;lg(G,{t:'buff',ts:x.s,i,k:c.k,ba:op.a,bh:op.h})}})},   // Takk (pourquoi il est mort ?)
  affUpR(G,op,x){const B=G.p[x.s].board,cs=[];B.forEach((c,i)=>{if(c)cs.push(i)});if(!cs.length)return;                                  // Maki (chef coach) : au hasard, en priorité sur un terrain du jeu
    const onG=cs.filter(i=>tgOf(G,x.s,i)===op.g),i=pick(G,onG.length?onG:cs),tg={s:x.s,i,id:B[i].id},y=Object.assign({},x,{tg});
    if(affC(B[i],op.g)>=2){OPS.buff(G,{a:1,h:0},y);return}                                                                                 // affinité déjà au maximum : +1 ATK à la place
    OPS.affUp(G,op,y)},
  setHp1(G,op,x){const c=tgC(G,x);if(!c)return;const E=eff(G,x.tg.s,x.tg.i);if(E.hp<=1)return;c.dm+=E.hp-1;lg(G,{t:'hp1',ts:x.tg.s,i:x.tg.i,k:c.k,n:E.hp-1})},   // Saja (presque world first)
  healE(G,op,x){if(!vt(G,x.tg))return;const t=x.tg,v=t.i<0?heal(G,t.s,op.n,x.src):healC(G,t.s,t.i,op.n);if(v>0)gold(G,x.s,v,x.src,x)},   // Xulyes (serveur charmant)
  heal2(G,op,x){const t=x.tg2;if(!t||!vt(G,t))return;if(t.i<0)heal(G,t.s,op.n,x.src);else healC(G,t.s,t.i,op.n)},   // Clutch : soigne la 2e cible
  // Sadamie (highroller ultime) : avec allG, seulement s'il a un terrain actif de chaque jeu ; N dégâts à toutes les créatures ennemies ;
  // si K meurent ou plus, 2 créatures au hasard du deck qui coûtent MIN ou plus
  highroll(G,op,x){const P=G.p[x.s],e=1-x.s;const T0=op.onG&&terrOf(G,x.s,x.sl!=null?x.sl:selfI(G,x));if((op.allG&&hrGames(G,x.s).length<AFG.length)||(op.onG&&!(T0&&op.onG.indexOf(TD[T0.d].g)>=0))){lg(G,{t:'hr',ts:x.s,n:-1});return}   // v23 : seulement sur un terrain Dofus ou LoL
    const before=G.p[e].board.filter(Boolean).map(c=>c.id);
    G.p[e].board.forEach((c,i)=>{if(c)dmgC(G,e,i,op.n||4,x.src,false,x)});reap(G);
    const n=before.filter(id=>!G.p[e].board.some(b=>b&&b.id===id)).length;lg(G,{t:'hr',ts:x.s,n});if(n<(op.k||4)||G.over)return;
    for(let j=0;j<2;j++){const ix=[];P.deck.forEach((c,q)=>{if(CARDS[c.k].t==='c'&&CARDS[c.k].c>=(op.min||4))ix.push(q)});if(!ix.length||!P.board.some(b=>!b))break;
      const c=P.deck.splice(pick(G,ix),1)[0];summon(G,x.s,c.k,{real:1});reap(G);if(G.over)return}},
  gbazar(G,op,x){lg(G,{t:'tgift',d:'gbazar',at:0,ts:x.s});const T=buyTerr(G,x.s,{d:'gbazar'},0);if(T&&x.self)T.by=x.self.id;keepAlive(G,x.s);lockSweep(G)},                              // Potatoll : Le Grand Bazaar
  eco(G,op,x){lg(G,{t:'tgift',d:'eco',at:0,ts:x.s});buyTerr(G,x.s,{d:'eco'},0);keepAlive(G,x.s)},                                       // Coco : Éco village
  bazaar(G,op,x){const j=ri(G,BAZ.length);lg(G,{t:'baz',ts:x.s,i:selfI(G,x),k:x.self?x.self.k:null,n:j});fx0(G,BAZ[j][1],Object.assign({},x,{baz:1}))},
  snipe(G,op,x){const i=selfI(G,x);if(i<0)return;const ts=targets(G,x.s,'e',null,null,true).filter(t=>t.i>=0);if(!ts.length)return;   // Haddmi (sniper d'élite) : la créature ennemie la plus éloignée
    const md=Math.max(...ts.map(t=>Math.abs(t.i-i))),t=pick(G,ts.filter(q=>Math.abs(q.i-i)===md));dmgC(G,t.s,t.i,op.n,x.src,false,x);reap(G)},          // un effet du Bazar au hasard
  shufE(G,op,x){const e=1-x.s,B=G.p[e].board;if(!B.some(Boolean))return;for(let i=0;i<CELLS;i++)if(B[i])auraOff(G,e,i);
    const nb=shuf(G,B.slice());for(let i=0;i<CELLS;i++)B[i]=nb[i];lg(G,{t:'shuf',ts:e});keepAlive(G,0);keepAlive(G,1)},
  healAll(G,op,x){for(const s of[0,1]){heal(G,s,op.n,x.src);G.p[s].board.forEach((c,i)=>{if(c)healC(G,s,i,op.n)})}},
  capDown(G,op,x){const P=G.p[1-x.s];if(P.cap<=0)return;const v=Math.min(P.cap,op.n);P.cap-=v;lg(G,{t:'capd',ts:1-x.s,n:v})},
  graveHand(G,op,x){const P=G.p[x.s];if(!P.grave.length||P.hand.length>=G.o.hand)return;const g=P.grave.splice(ri(G,P.grave.length),1)[0];
    P.hand.push({k:g.k,id:++G.uid});lg(G,{t:'add',ts:x.s,k:g.k,pv:x.s,gr:1})},
  pzAllC(G,op,x){for(const s of[0,1])G.p[s].board.forEach((c,i)=>{if(c)addPz(G,s,i,op.n,x)})},
  rndKw(G,op,x){const i=selfI(G,x);if(i<0)return;const c=G.p[x.s].board[i],E=eff(G,x.s,i),pool=RKW.filter(k=>k==='egide'?!c.eg:!E.kw[k]);   // ARAM custom
    for(let j=0;j<op.n&&pool.length;j++){const k=pool.splice(ri(G,pool.length),1)[0];if(k==='egide')c.eg=1;else{c.gk=Object.assign({},c.gk);c.gk[k]=1}lg(G,{t:'kwg',ts:x.s,i,k:c.k,kw:k})}},
  invis(G,op,x){const i=selfI(G,x);if(i<0)return;const c=G.p[x.s].board[i];if(c.ex)return;c.ex=1;c.fum=1;lg(G,{t:'exil',ts:x.s,i,k:c.k,n:0,fum:1})},   // Temple Sram
  seedGrow(G,op,x){const i=selfI(G,x);if(i<0)return;const c=G.p[x.s].board[i];if(c.k!=='graine')return;c.a+=1;c.h+=1;lg(G,{t:'buff',ts:x.s,i,k:c.k,ba:1,bh:1})},
  dofus(G,op,x){const P=G.p[x.s];if(P.arts.length>=ARTMAX)return;const L=ARTK.filter(k=>!hasArt(P,k));if(!L.length)return;               // Gobi : un Dofus légendaire
    const k=pick(G,L);P.arts=P.arts.concat([{k,id:++G.uid}]);lg(G,{t:'art',ts:x.s,k});keepAlive(G,x.s)},
  evRnd(G,op,x){runEv(G,x.s,ri(G,EVENTS.length),x.src)},                                                         // Organisateur : un événement du Bazar au hasard
  evPick(G,op,x){const L=EVENTS.map((_,j)=>j),c=[];for(let j=0;j<(op.n||3)&&L.length;j++){const n=L.splice(ri(G,L.length),1)[0];c.push({id:n,n})}   // Organisateur (maître de cérémonie) : choisir parmi 3
    const P=G.p[x.s];if(!P.pq)P.pq=[];P.pq.push({m:'ev',c,src:x.src});lg(G,{t:'evc',ts:x.s,cs:x.src})},
  kwT(G,op,x){const c=tgC(G,x);if(!c)return;if(op.kw==='egide')c.eg=1;else{c.gk=Object.assign({},c.gk);c.gk[op.kw]=1}if(op.kw==='afk')c.aw=0;   // BRB, Arrosage automatique : un mot-clé donné
    lg(G,{t:'kwg',ts:x.tg.s,i:x.tg.i,k:c.k,kw:op.kw})},
  backT(G,op,x){const c=tgC(G,x);if(!c||!c.ex||c.fum)return;const s=x.tg.s;c.ex=0;lg(G,{t:'back',ts:s,i:x.tg.i,k:c.k,fum:0});   // Vol retour : revient tout de suite, +2/+2
    c.a+=op.a;c.h+=op.h;lg(G,{t:'buff',ts:s,i:x.tg.i,k:c.k,ba:op.a,bh:op.h});backHooks(G,s,[c])},
  orAbroad(G,op,x){const n=G.p[x.s].board.filter(b=>b&&b.ex&&!b.fum).length;gold(G,x.s,Math.min(op.max||99,n*op.n),x.src,x)},   // Souvenirs d'Andorre
  muteAll(G,op,x){for(const s of[0,1])G.p[s].board.forEach((c,i)=>{if(c&&!c.mut){auraOff(G,s,i);c.pm=1;c.mut=1;lg(G,{t:'mute',ts:s,i,k:c.k})}})},   // Mute général
  reboot(G,op,x){for(const s of[x.s,1-x.s])for(let i=0;i<CELLS;i++){const c=G.p[s].board[i];if(!c)continue;const os=c.o!=null?c.o:s;   // Reboot du serveur : tout retourne en main, sans Agonie ; les jetons disparaissent
      removeC(G,s,i,2);if(CARDS[c.k].tok)continue;lg(G,{t:'kick',ts:os,k:c.k});const P=G.p[os],card={k:c.k,id:++G.uid};
      if(P.hand.length<G.o.hand)P.hand.push(card);else{toGrave(P,card);lg(G,{t:'burn',ts:os,k:c.k})}}},
  buffCost(G,op,x){const me=selfI(G,x);G.p[x.s].board.forEach((c,i)=>{if(c&&i!==me&&CARDS[c.k].c<=op.max){c.a+=op.a;c.h+=op.h;lg(G,{t:'buff',ts:x.s,i,k:c.k,ba:op.a,bh:op.h})}})},   // Le Coach (temps mort tactique)
  buffSide(G,op,x){const me=selfI(G,x);if(me<0)return;const j=me+(op.side||1),c=G.p[x.s].board[j];if(!c)return;c.a+=op.a;c.h+=op.h;lg(G,{t:'buff',ts:x.s,i:j,k:c.k,ba:op.a,bh:op.h})},   // Saja (main droite)
  killWeak(G,op,x){for(const s of[0,1]){const L=fl(G,s);G.p[s].board.forEach((c,i)=>{if(c&&eff(G,s,i,L).a<=op.max)c.dm+=99999})}},   // Wipe de raid : les créatures à 3 ATK ou moins
  pick3(G,op,x){const P=G.p[x.s],g=[];                                                                           // Coco (esprit tourmenté) : pioche 3, garde 1 au choix
    for(let j=0;j<op.n;j++){if(!refill(G,x.s)){P.fat++;lg(G,{t:'fat',ts:x.s,n:P.fat});heroHit(G,x.s,P.fat,'fat');if(G.over)return;continue}g.push(P.deck.pop())}
    if(!g.length)return;if(g.length===1){keepPick(G,x.s,g,0);return}
    if(!P.pq)P.pq=[];P.pq.push({m:'keep',c:g});lg(G,{t:'pick3',ts:x.s,n:g.length})},
  discPick(G,op,x){const P=G.p[x.s],c=P.hand.map(h=>({k:h.k,id:h.id}));if(!c.length)return;                                    // Coup de folie : la carte défaussée est au choix
    if(!P.pq)P.pq=[];P.pq.push({m:'disc',c});lg(G,{t:'discc',ts:x.s})},
  retHand(G,op,x){const c=x.self;if(!c||CARDS[c.k].tok)return;const cd=CARDS[c.k];                                            // Esprit guérisseur : à sa mort, la créature retourne dans la main de son propriétaire
    if(c.rsp||(!c.mut&&!c.rs&&(cd.kw||[]).indexOf('respawn')>=0))return;                                                     // elle a Respawn : elle revient plutôt sur le plateau
    const own=c.o!=null?c.o:x.s,OP=G.p[own],gi=OP.grave.findIndex(q=>q.id===c.id);if(gi>=0)OP.grave.splice(gi,1);c.rh=1;
    if(OP.hand.length>=G.o.hand){toGrave(OP,{k:c.k,id:c.id});lg(G,{t:'burn',ts:own,k:c.k});return}
    OP.hand.push({k:c.k,id:++G.uid});lg(G,{t:'rethand',ts:own,k:c.k})},
  dup(G,op,x){const P=G.p[x.s],c=P.hand.map(h=>({k:h.k,id:h.id}));if(!c.length)return;                                         // Miroir de Kalandra : choisir la carte à dupliquer
    if(!P.pq)P.pq=[];P.pq.push({m:'dup',c});lg(G,{t:'dupc',ts:x.s})},
  rps(G,op,x){const i=selfI(G,x);if(i<0)return;const c=G.p[x.s].board[i],P=G.p[x.s];                                                  // Osiris : pierre, feuille ou ciseaux (choisi en fin de tour)
    const v=RPSK.indexOf(P.rpsv)>=0?P.rpsv:pick(G,RPSK);if(!G.rps)G.rps=[];G.rps.push({s:x.s,id:c.id,k:c.k,v});lg(G,{t:'rpsb',ts:x.s,i,k:c.k,pv:x.s,v})}
};
const RKW=['hate','rempart','egide','venin','siphon','insolence','frenesie'];
// choix en attente : garder une carte (Coco) ou dupliquer une carte de sa main (Miroir de Kalandra)
function pickDo(G,s,q,i){if(q.m==='tg'){const c=G.p[s].board.find(b=>b&&b.id===q.id);if(!c||c.mut||G.over)return;const cd=CARDS[c.k],L=cryList(G,s,c,cd);if(!L)return;   // cible choisie pour un Cri d'arrivée
    let t=i>=0?q.t[i]:null;if(t&&!L.list.some(u=>u.s===t.s&&u.i===t.i&&(u.i<0||(G.p[u.s].board[u.i]||{}).id===q.c[i].id)))t=null;cryRun(G,s,c,cryTgOf(G,L,t||cryBest(G,s,L)),slotOf(G,s,c));reap(G);return}
  if(q.m==='test'){const P=G.p[s],c=q.c[i],j=P.deck.findIndex(d=>d.id===c.id);if(j<0||P.hand.length>=G.o.hand)return;
    const card=P.deck.splice(j,1)[0];P.hand.push(card);lg(G,{t:'add',ts:s,k:card.k,pv:s,test:1});return}
  if(q.m==='disc'){const P=G.p[s],o=q.c[i],j=P.hand.findIndex(h=>h.id===o.id);if(j<0)return;const c=P.hand.splice(j,1)[0];toGrave(P,c);lg(G,{t:'disc',ts:s,k:c.k});return}
  if(q.m==='ev'){const o=q.c[i];if(o&&!G.over){runEv(G,s,o.n,q.src);reap(G)}return}
  if(q.m==='dup'){const P=G.p[s],o=q.c[i];if(P.hand.length>=G.o.hand){lg(G,{t:'burn',ts:s,k:o.k});return}P.hand.push(mkCard(G,o.k));lg(G,{t:'add',ts:s,k:o.k,pv:s,dup:1});return}
  keepPick(G,s,q.c,i)}
// Coco (esprit tourmenté) : la carte gardée va en main (brûlée si la main est pleine), les autres au cimetière
function keepPick(G,s,g,i){const P=G.p[s],c=g[i];
  if(P.hand.length>=G.o.hand){toGrave(P,c);lg(G,{t:'burn',ts:s,k:c.k})}else{P.hand.push(c);lg(G,{t:'pickd',ts:s,k:c.k,pv:s})}
  g.forEach((o,j)=>{if(j!==i){toGrave(P,o);lg(G,{t:'disc',ts:s,k:o.k})}})}
// Blizzard lié à Kirua : il ne peut pas être détruit, peut être recouvert et fond quand Kirua quitte le plateau
function lockedId(P,id){const T=P.terrs.find(q=>q.id===id);return!!(T&&T.lk)}
function lockedAt(P,j){return!!P.cells[j]&&lockedId(P,P.cells[j])}
function freeSpan(P,at,n){return at>=0&&at+n<=CELLS}
function blzAt(P,i){const n=TD.blizzard.size,at=Math.max(0,Math.min(i,CELLS-n));return freeSpan(P,at,n)?at:-1}   // case visée -> 1re case couverte (-1 : bloqué)
// terrains liés à une créature : le Blizzard verrouillé de Kirua (T.lk) et Le Grand Bazaar de Potatoll (T.by) disparaissent quand elle quitte le plateau
function lockSweep(G){for(const s of[0,1]){const P=G.p[s],gone=P.terrs.filter(T=>{const o=T.lk||T.by;return o&&!G.p.some(Q=>Q.board.some(b=>b&&b.id===o))});if(!gone.length)continue;
  for(const T of gone){P.cells=P.cells.map(v=>v===T.id?0:v);P.terrs=P.terrs.filter(q=>q!==T);lg(G,T.lk?{t:'tdes',ts:s,d:T.d,melt:1}:{t:'tdes',ts:s,d:T.d,gone:1})}keepAlive(G,s)}}
function moveBoundTerrains(G,moves){
  const moving=[];
  for(const m of moves){const P=G.p[m.from];for(const T of P.terrs.filter(q=>q.by===m.id)){
    const at=P.cells.indexOf(T.id),size=Math.min(TD[T.d].size,CELLS-at);if(at<0||size<=0)continue;
    P.cells=P.cells.map(v=>v===T.id?0:v);P.terrs=P.terrs.filter(q=>q!==T);moving.push({T,from:m.from,to:m.to,at,size})}}
  for(const P of G.p)P.terrs=P.terrs.filter(T=>P.cells.includes(T.id));
  for(const m of moving){const P=G.p[m.to],at=Math.min(m.at,CELLS-m.size);
    for(let i=at;i<at+m.size;i++)if(!lockedAt(P,i))P.cells[i]=m.T.id;
    P.terrs.push(m.T);P.terrs=P.terrs.filter(T=>P.cells.includes(T.id));
    lg(G,{t:'tmove',ts:m.to,d:m.T.d,id:m.T.id,from:m.at,at,c:0,r:'bound',bound:1})}
}
// Osiris (expert bluffeur) : pierre (p), feuille (f), ciseaux (c). L'adversaire choisit au début de son tour, avant qu'il commence ;
// s'il perd, Osiris vole tout son Or et son propriétaire pioche 3 cartes (seulement si cet Osiris est encore en jeu et pas Mute)
const RPSK=['p','f','c'],RPSN={p:'Pierre',f:'Feuille',c:'Ciseaux'};
function rpsWin(a,b){return a===b?0:((a==='p'&&b==='c')||(a==='c'&&b==='f')||(a==='f'&&b==='p'))?1:-1}   // 1 : a gagne
function rpsAct(G,s,a){
  if(s!==G.rpsTo)return er('C’est à l’adversaire de choisir.');if(RPSK.indexOf(a.v)<0)return er('Choisis Pierre, Feuille ou Ciseaux.');
  G.aid++;const L=G.rps||[];G.rps=[];G.phase=null;G.rpsTo=null;
  for(const r of L){const O=G.p[r.s],i=O.board.findIndex(b=>b&&b.id===r.id),c=i>=0?O.board[i]:null,res=rpsWin(r.v,a.v);
    lg(G,{t:'rpsr',ts:r.s,i,k:r.k,v:r.v,o:a.v,r:res,ok:res===1&&c&&!c.mut?1:0});
    if(res===1&&c&&!c.mut){const n=G.p[s].or;if(n>0&&!goldStealBlocked(G,s)){G.p[s].or=0;O.or+=n;lg(G,{t:'gold',ts:r.s,n,from:s,src:r.k,ss:s,si:-1})}draw(G,r.s,3);if(G.over)return{ok:true}}}
  startTurn(G,s);return{ok:true}}
// Natinganz (j'ai dl le boss) : au début de chaque tour, il avance d'une case vers la droite et un laser frappe la colonne qu'il quitte
function lasers(G){for(const t of[G.cur,1-G.cur]){const B=G.p[t].board,ids=B.filter(b=>b&&!b.mut&&CARDS[b.k].laser).map(b=>b.id);
  for(const id of ids){if(G.over)return;const i=B.findIndex(b=>b&&b.id===id);if(i>=0)laser(G,t,i)}}}
function laser(G,s,i){const P=G.p[s],c=P.board[i],e=1-s,n=CARDS[c.k].laser,x={ss:s,si:i,src:c.k,sid:c.id};
  if(i+1<CELLS&&!P.board[i+1]){auraOff(G,s,i);P.board[i+1]=c;P.board[i]=null;lg(G,{t:'nmove',ts:s,i,to:i+1,k:c.k});keepAlive(G,s);
    lg(G,{t:'laser',ts:s,i,k:c.k});if(G.p[e].board[i])dmgC(G,e,i,n,c.k,false,x)}
  else{lg(G,{t:'laser',ts:s,i,k:c.k,self:1});dmgC(G,s,i,n,c.k,false,x);if(G.p[e].board[i])dmgC(G,e,i,n,c.k,false,x)}
  reap(G)}
// effets propres à un terrain (pas à la créature posée dessus) : Éco village, Serveur Minecraft
function terrHooks(G,s){const P=G.p[s];for(const T of P.terrs.slice()){const td=TD[T.d];if(!td.teot||tOff(G,T)||P.terrs.indexOf(T)<0)continue;
  const cs=[];P.cells.forEach((id,j)=>{if(id===T.id&&!P.board[j])cs.push(j)});if(!cs.length)continue;
  lg(G,{t:'tfx2',ts:s,d:T.d});if(td.teot==='seeds')for(const j of cs)summon(G,s,'graine',{sl:j});else summon(G,s,td.spawn,{sl:cs[cs.length-1]});   // Éco village : une Graine sur chaque case libre ; Minecraft : un Pleb
  reap(G);if(G.over)return}}
function venHeal(G,s,id,n){const B=G.p[s].board;for(let i=0;i<CELLS;i++){const b=B[i];if(b&&b.id===id&&!b.mut&&CARDS[b.k].vHeal){healC(G,s,i,n);return}}}

// ---------- événements ----------
function doEvent(G){const ev=EVENTS[G.nev];G.nev=ri(G,EVENTS.length);lg(G,{t:'ev',n:ev.n});
  runFx(G,ev.fx,{s:G.first,src:'ev',tg:null,pc:0})}

// ---------- tours ----------
// effets de début / fin de tour des créatures (key = 'sot' | 'eot') puis des terrains sous elles
function boardHooks(G,s,key){
  const P=G.p[s];
  for(let i=0;i<CELLS;i++){const c=P.board[i];if(c&&!c.mut&&CARDS[c.k][key]){runFx(G,CARDS[c.k][key],{s,src:c.k,self:c,tg:null,pc:0,sl:i,ss:s,si:i});if(G.over)return}}
  for(let i=0;i<CELLS;i++){const c=P.board[i];if(!c)continue;const T=terrOf(G,s,i),TE=tfxC(T,c);
    if(TE&&TE[key]){lg(G,{t:'tfx',ts:s,i,d:T.d,k:c.k});runT(G,s,T,TE[key],{s,src:'T:'+T.d,self:c,tg:null,pc:0,sl:i,ss:s,si:i});if(G.over)return}}}
function startTurn(G,s){
  const P=G.p[s],o=G.o;G.cur=s;G.turn++;G.aid++;G.played=0;if(s===G.first)G.round++;
  lg(G,{t:'turn',n:G.round});
  if(o.evt&&s===G.first&&G.round>0&&G.round%3===0){doEvent(G);if(G.over)return}
  if(o.ter&&G.turn>1&&G.turn%2===0)cycleShop(G);                 // tous les 2 tours (au début des tours du second joueur)
  P.cap=Math.min(o.cap,P.cap+1);P.eth=P.cap;                       // le Démoflux non dépensé est perdu
  if(hasArt(P,'ocre')){P.eth+=2;lg(G,{t:'eth',ts:s,n:2,src:'art:ocre'})}   // Dofus Ocre : au-delà du maximum si besoin
  P.or+=o.inc;P.mvn=0;
  const back=[];
  P.board.forEach((c,i)=>{if(c){c.af=0;c.sick=0;c.inv=0;c.xat=c.xa||0;c.xa=0;if(c.ex){c.ex=0;lg(G,{t:'back',ts:s,i,k:c.k,fum:c.fum||0});if(!c.fum)back.push(c)}c.fum=0}});
  backHooks(G,s,back);   // Takk, Loractys, Nomade : au retour de voyage
  for(let i=0;i<CELLS;i++){const c=P.board[i];if(c&&c.pz>0){const d=dmgC(G,s,i,c.pz,'venin');if(d>0&&c.pzBy)venHeal(G,1-s,c.pzBy,d);c.pz--}}
  if(P.pz>0){const d=heroHit(G,s,P.pz,'venin');if(d>0&&P.pzBy)venHeal(G,1-s,P.pzBy,d);P.pz--}
  reap(G);if(G.over)return;
  lasers(G);if(G.over)return;
  if(o.fat&&P.rsh>0){P.fat++;lg(G,{t:'fat',ts:s,n:P.fat,turn:1});heroHit(G,s,P.fat,'fat');if(G.over)return}   // fatigue : 1, puis 2, puis 3… à chaque début de tour
  draw(G,s,1);if(G.over)return;
  for(let i=0;i<CELLS;i++){const c=P.board[i];if(c&&eff(G,s,i).kw.croissance){c.a++;c.h++;lg(G,{t:'buff',ts:s,i,k:c.k,ba:1,bh:1})}}   // Croissance : au début de ton tour
  const L=fl(G,s);
  if((L.farmer||0)>=2){const n=Math.min(4,L.farmer-1);lg(G,{t:'fac',f:'farmer',ts:s,n:L.farmer,or:n});gold(G,s,n,'farmer',{ss:s,si:-2})}   // Farmers : N−1 Or, 4 au maximum
  if((L.alien||0)>=2){const E=G.p[1-s],n=Math.min(L.alien-1,E.or);lg(G,{t:'fac',f:'alien',ts:s,n:L.alien});if(n>0&&!goldStealBlocked(G,1-s)){E.or-=n;P.or+=n;lg(G,{t:'gold',ts:s,n,from:1-s,src:'alien',ss:1-s,si:-1})}}   // Extraterritoriaux : volent N−1 Or
  if(P.rx){const skip=rxTurn(G,s);if(G.over)return;if(skip){endTurn(G,s);return}}
  boardHooks(G,s,'sot')}
function endTurn(G,s){
  const P=G.p[s];if(P.cdis>0)P.cdis--;
  boardHooks(G,s,'eot');if(G.over)return;
  terrHooks(G,s);if(G.over)return;
  if(hasArt(P,'cawotte')){lg(G,{t:'artfx',ts:s,k:'cawotte'});draw(G,s,2);if(G.over)return}   // Dofus Cawotte
  const L=fl(G,s);
  if((L.ravages||0)>=2){lg(G,{t:'fac',f:'ravages',ts:s,n:L.ravages});const x={ss:s,si:-2};
    for(let j=0;j<L.ravages-1;j++){const tl=targets(G,s,'e',null,null,true);if(!tl.length)break;const t=pick(G,tl);hit(G,t.s,t.i,1,'ravages',x);reap(G);if(G.over)return}}
  P.board.forEach(c=>{if(!c)return;if(c.blk>0)c.blk--;c.ds=0;c.ta=0;c.th=0});   // Désorienté (Lanfear) : seulement pendant son prochain tour ; bonus « pendant ce tour »
  if(G.turn>=MAXT){const a=G.p[0].hp,b=G.p[1].hp;G.over={w:a===b?-1:(a>b?0:1)};return}
  delete P.rpsv;
  if(G.rps&&G.rps.length){G.phase='rps';G.rpsTo=1-s;G.cur=1-s;lg(G,{t:'rpsw',ts:1-s});return}   // Osiris : l'adversaire choisit avant que son tour commence
  startTurn(G,1-s)}

// ---------- actions ----------
const CELLT={ecell:1,eslot:1,eterr:1,terr:1};                               // cibles qui désignent une case du plateau, pas une créature
function resolveTg(G,t,cell){if(!t)return null;if(t.i<0)return{s:t.s,i:-1,id:0};if(cell)return{s:t.s,i:t.i,cell:1};const c=G.p[t.s].board[t.i];return c?{s:t.s,i:t.i,id:c.id}:null}
function inList(L,t){return !!t&&L.some(r=>r.s===t.s&&r.i===t.i)}
function act(G,s,a){
  if(G.over)return er('La partie est terminée.');
  if(!a||typeof a!=='object'||(s!==0&&s!==1))return er('Action invalide.');
  if(a.t==='resign'){G.aid++;G.cur=s;lg(G,{t:'res'});G.over={w:1-s,res:1};return{ok:true}}
  if(a.t==='devdisc'){
    if(G.o.arena||G.p[1-s].hum)return er('Commande de test désactivée : elle ne fonctionne qu’en duel local contre l’IA.');
    G.aid++;const P=G.p[1-s],pc=G.cs;G.cs=null;                       // commande de test (« defaussesvp » dans le chat du duel) : l'adversaire défausse toute sa main
    while(P.hand.length){const c=P.hand.pop();toGrave(P,c);lg(G,{t:'disc',ts:1-s,k:c.k,anon:1})}G.cs=pc;return{ok:true}}
  if(a.t==='test'){
    if(G.o.arena||G.p[1-s].hum)return er('Code test désactivé : il ne fonctionne qu’en duel local contre l’IA.');
    if(G.phase||G.cur!==s)return er('Le code test fonctionne uniquement pendant ton tour.');
    const P=G.p[s];if(P.pq&&P.pq.length)return er('Termine d’abord le choix en attente.');
    if(P.hand.length>=G.o.hand)return er('Ta main est pleine : libère une place avant d’utiliser le code test.');
    if(!P.deck.length)return er('Ton deck ne contient plus de cartes.');
    G.aid++;P.eth=10;P.pq.push({m:'test',c:P.deck.map(c=>({k:c.k,id:c.id}))});return{ok:true}}
  if(G.phase==='mull')return a.t==='mull'?mullAct(G,s,a):er('Choisis d’abord les cartes de ta main de départ à remplacer.');
  if(G.phase==='rps')return a.t==='rps'?rpsAct(G,s,a):er('Pierre, feuille, ciseaux : il faut d’abord choisir.');
  if(G.cur!==s&&!(a.t==='pick'&&G.p[s].pq&&G.p[s].pq.length))return er('Ce n’est pas ton tour.');   // un choix en attente (cible d'un Cri) se fait aussi hors de son tour
  const P=G.p[s];G.aid++;
  if(P.pq&&P.pq.length&&a.t!=='pick'&&a.t!=='end')return er(P.pq[0].m==='tg'?'Choisis d’abord la cible du Cri d’arrivée.':P.pq[0].m==='disc'?'Choisis d’abord la carte à défausser (Coup de folie).':P.pq[0].m==='dup'?'Choisis d’abord la carte à dupliquer (Miroir de Kalandra).':P.pq[0].m==='test'?'Choisis d’abord une carte de ton deck (code test).':P.pq[0].m==='ev'?'Choisis d’abord l’événement du Bazar (Organisateur).':'Choisis d’abord la carte à garder (Coco, esprit tourmenté).');
  switch(a.t){
  case 'play':{
    const h=P.hand[a.i];if(!h)return er('Carte introuvable.');const cd=CARDS[h.k],cost=costOf(G,s,h);
    if(cost>P.eth)return er('Pas assez de Démoflux.');
    const sp=cryTg(cd);let tg=null;
    if(cd.t==='c'){
      if(!isCell(a.sl)||P.board[a.sl])return er('Emplacement invalide.');
      let tg2=null;
      if(sp){const L=targets(G,s,sp.tg,sp.tgf);if(L.length){if(!inList(L,a.tg))return er('Choisis une cible.');tg=resolveTg(G,a.tg,CELLT[sp.tg]);
        if(sp.tg2){if(!inList(tg2List(G,s,a.sl),a.tg2))return er('Choisis la créature à échanger.');tg2=a.tg2.s===s&&a.tg2.i===a.sl?'self':resolveTg(G,a.tg2)}}}
      P.hand.splice(a.i,1);P.eth-=cost;
      const c=mkC(G,h.k);c.o=s;if(c.h<=0&&cd.cry)c.pd=1;P.board[a.sl]=c;                      // 0 PV de base (Chanssus) : vit jusqu'à son Cri d'arrivée
      if(P.rx||G.p[1-s].rx)rxPlay(G,s,c);
      const pc=G.played;G.played++;
      lg(G,{t:'play',k:h.k,i:a.sl,c:cost,ts:s});
      arrive(G,s,a.sl);
      if(cd.cry&&!G.over)runCry(G,s,c,{s,src:h.k,self:c,tg,tg2,pc,sl:a.sl,ss:s,si:a.sl});c.pd=0;
    }else{
      if(cd.needSlot&&!P.board.some(c=>!c))return er('Il te faut une case libre.');
      let tg2=null;
      if(sp){const L=targets(G,s,sp.tg,sp.tgf);if(!inList(L,a.tg))return er('Choisis une cible valide.');tg=resolveTg(G,a.tg);
        if(sp.sg2){if(!inList(sp2List(G,s,a.tg),a.tg2))return er('Choisis la seconde cible.');tg2=resolveTg(G,a.tg2)}}
      P.hand.splice(a.i,1);P.eth-=cost;
      const pc=G.played;G.played++;
      const tgl=t=>t?{s:t.s,i:t.i,k:(t.i>=0&&G.p[t.s].board[t.i])?G.p[t.s].board[t.i].k:null}:null;
      lg(G,{t:'play',k:h.k,c:cost,ts:s,tg:tgl(tg),tg2:tgl(tg2)});
      const Q=G.p[1-s];if(Q.xc>0){Q.xc--;lg(G,{t:'rx',ts:1-s,src:Q.rx&&Q.rx.src&&Q.rx.src.counter,k:h.k,tx:'annule le sort'});toGrave(P,h);break}   // Expédition : sort annulé
      runFx(G,cd.fx,{s,src:h.k,self:null,tg,tg2,pc,ss:s,si:-1});
      if(P.xes>0&&!cd.tok&&!G.over){P.xes--;lg(G,{t:'rx',ts:s,src:rxSrc(P,'echoSpell'),k:h.k,tx:'rejoue le sort'});reap(G);if(!G.over)runFx(G,cd.fx,{s,src:h.k,self:null,tg,tg2,pc,ss:s,si:-1})}   // Manette sans fil
      if(Q.rx&&Q.rx.spellTax&&!cd.tok&&!G.over){heroHit(G,s,Q.rx.spellTax,rxSrc(Q,'spellTax'))}         // Insulteur : chaque sort te coûte 1 PV
      toGrave(P,h)}
    break}
  case 'atk':{
    if(!P.board[a.f]||!canAtk(G,s,a.f))return er('Cette créature ne peut pas attaquer.');
    let t=a.tg;const A=P.board[a.f];
    if(eff(G,s,a.f).kw.deso){const DT=desoTargets(G,s);if(!inList(DT,a.tg))return er('Cible invalide.');t=pick(G,DT);lg(G,{t:'deso',ts:s,i:a.f,k:A.k,to:t.i})}   // Désorienté : cible au hasard parmi tous les ennemis
    else if(!inList(atkTargets(G,s,a.f),a.tg))return er('Cible invalide (Rempart, VIP ?).');
    if(t.i>=0){const D=G.p[t.s].board[t.i];if(D&&!D.mut&&CARDS[D.k].tax){const n=CARDS[D.k].tax;P.or-=n;lg(G,{t:'tax',ts:s,k:D.k,n})}}   // Maki : chaque attaque contre lui coûte 2 Or
    attack(G,s,a.f,t);break}
  case 'exil':{
    if(!canExil(G,s,a.i))return er('Voyage impossible.');const cost=trCost(G,s),c=P.board[a.i];
    if(P.rx&&P.rx.tr1&&!P.xt&&cost===0&&!P.board.some(b=>b&&!b.mut&&CARDS[b.k].freeTr)){P.xt=1;c.xb=1}
    P.or-=cost;c.ex=1;lg(G,{t:'exil',ts:s,i:a.i,k:c.k,n:cost});goneAbroad(G,s);break}
  case 'move':{                                                       // déplacer une créature (ou échanger deux créatures) : coûte du Démoflux
    const c=isCell(a.f)&&P.board[a.f];if(!c)return er('Aucune créature ici.');
    if(!isCell(a.to)||a.to===a.f)return er('Case invalide.');
    if(!canMoveC(G,s))return er(mvWhy(G,s,0));
    const cost=mvCost(G,s),o=P.board[a.to];P.eth-=cost;P.board[a.to]=c;P.board[a.f]=o||null;
    lg(G,{t:'move',ts:s,i:a.f,to:a.to,k:c.k,k2:o?o.k:null,c:cost,r:'eth'});
    keepAlive(G,s);P.mvn=(P.mvn||0)+1;break}
  case 'tmove':{                                                      // déplacer un de ses terrains : coûte de l'Or
    const T=P.terrs.find(q=>q.id===a.id);if(!T)return er('Terrain introuvable.');
    const cells=terrLayout(P,a.id,a.at);if(!cells)return er('Pas assez de place pour déplacer ce terrain ici.');
    if(cells.every((x,j)=>x===P.cells[j]))return er('Le terrain est déjà là.');
    if(!canMoveT(G,s))return er(mvWhy(G,s,1));
    const cost=mvCost(G,s),from=P.cells.indexOf(a.id);P.or-=cost;P.cells=cells;
    lg(G,{t:'tmove',ts:s,d:T.d,id:a.id,from,at:a.at,c:cost,r:'or'});
    keepAlive(G,s);P.mvn=(P.mvn||0)+1;break}
  case 'buy':{
    if(!G.o.ter)return er('Terrains désactivés.');const t=G.shop[a.n];if(!t)return er('Terrain indisponible.');
    const cost=terrCost(G,s,t);if(P.or<cost)return er('Pas assez d’Or.');const sz=TD[t.d].size;
    if(!(isCell(a.at)&&a.at+sz<=CELLS))return er('Emplacement invalide.');
    if(!freeSpan(P,a.at,sz))return er('Emplacement invalide.');
    P.or-=cost;G.shop.splice(a.n,1);G.tdis.push(t);
    lg(G,{t:'buy',d:t.d,at:a.at,ts:s,c:cost});
    buyTerr(G,s,t,a.at);const nt=drawTerr(G);if(nt)G.shop.push(nt);keepAlive(G,s);break}
  case 'roll':{
    if(!G.o.ter)return er('Terrains désactivés.');if(P.or<ROLLC)return er('Il faut '+ROLLC+' Or pour relancer les terrains.');
    if(!canRoll(G,s))return er('Impossible de relancer les terrains.');
    P.or-=ROLLC;const old=G.shop.map(t=>t.d);for(const t of G.shop)G.tdis.push(t);G.shop=[];
    for(let j=0;j<2;j++){const nt=drawTerr(G);if(nt)G.shop.push(nt)}
    lg(G,{t:'roll',ts:s,c:ROLLC,old,nd:G.shop.map(t=>t.d)});break}
  case 'pick':{const q=P.pq&&P.pq[0];if(!q)return er('Aucune carte à choisir.');if(!Number.isInteger(a.i)||a.i<0||a.i>=q.c.length)return er('Choix invalide.');
    P.pq.shift();pickDo(G,s,q,a.i);break}
  case 'end':G.aid++;while(P.pq&&P.pq.length){const q=P.pq.shift();pickDo(G,s,q,q.m==='tg'?-1:0)}                  // choix non fait : la 1re carte
    if(RPSK.indexOf(a.rps)>=0)P.rpsv=a.rps;                                                  // Osiris : le signe choisi en finissant le tour
    endTurn(G,s);return{ok:true};
  default:return er('Action inconnue.')}
  reap(G);
  return{ok:true}}
// pioche de terrains : quand elle est vide, la défausse est remélangée
function drawTerr(G){
  const available=t=>!G.p.some(P=>P.terrs.some(T=>T.d===t.d&&P.cells.includes(T.id)));
  let i=G.tdeck.findIndex(available);
  if(i<0){
    const ready=G.tdis.filter(available);
    if(!ready.length)return null;
    G.tdis=G.tdis.filter(t=>!available(t));
    G.tdeck=shuf(G,G.tdeck.concat(ready));
    i=G.tdeck.findIndex(available);
  }
  return i<0?null:G.tdeck.splice(i,1)[0]}
// tous les 2 tours, le terrain le plus ancien de la zone commune est remplacé
function cycleShop(G){
  if(G.shop.length<2)return;const old=G.shop.shift();G.tdis.push(old);const nt=drawTerr(G);
  if(nt){G.shop.push(nt);lg(G,{t:'tcyc',d:old.d,nd:nt.d})}else G.shop.unshift(old)}
function buyTerr(G,s,t,at){
  const P=G.p[s],sz=TD[t.d].size;const T={id:++G.uid,d:t.d};P.terrs.push(T);
  for(let j=at;j<at+sz;j++)P.cells[j]=T.id;
  P.terrs=P.terrs.filter(q=>P.cells.indexOf(q.id)>=0);
  return T}   // v20 : un terrain posé ne déclenche pas son effet « Arrivée » sur les créatures déjà là : seulement quand une créature arrive dessus
// un bonus de PV perdu (créature ou terrain déplacé, terrain recouvert) ne tue jamais : il reste au moins 1 PV
function keepAlive(G,s){const L=fl(G,s);G.p[s].board.forEach((c,i)=>{if(!c)return;const E=eff(G,s,i,L);if(E.hp<1)c.dm=Math.max(0,E.h-1)})}
// nouvelle disposition des terrains quand on déplace le terrain `id` pour qu'il commence en `at` :
// il garde sa taille actuelle ; les terrains qu'il chevauche sont poussés vers les cases libres les plus proches (null si impossible)
const isCell=x=>Number.isInteger(x)&&x>=0&&x<CELLS;   // index de case valide (protège des actions forgées en ligne)
function terrLayout(P,id,at){
  const n=P.cells.filter(x=>x===id).length;if(!n||!(isCell(at)&&at+n<=CELLS))return null;
  const cells=Array(CELLS).fill(0);for(let j=at;j<at+n;j++)cells[j]=id;
  const others=[...new Set(P.cells.filter(x=>x&&x!==id))],move=[];
  for(const x of others){const cs=[];P.cells.forEach((c,j)=>{if(c===x)cs.push(j)});if(cs.every(j=>!cells[j]))cs.forEach(j=>cells[j]=x);else move.push({x,m:cs.length,p:cs[0]})}
  move.sort((u,v)=>u.p-v.p);
  for(const o of move){let best=-1,bd=99;
    for(let st=0;st+o.m<=CELLS;st++){let ok=true;for(let j=st;j<st+o.m;j++)if(cells[j]){ok=false;break}if(ok&&Math.abs(st-o.p)<bd){bd=Math.abs(st-o.p);best=st}}
    if(best<0)return null;for(let j=best;j<best+o.m;j++)cells[j]=o.x}
  return cells}
// Simon (rusheur de ligue) : butin au hasard, toujours au moins 2 Or : 2 ou 3 Or, 2 Or et 1 ou 2 cartes, 2 Or et 2 Démoflux ;
// 10 % : 2 Or et un Miroir de Kalandra (jeton) ; 5 % : 5 Or et 3 cartes
const LOOT=[[{t:'or',n:2}],[{t:'or',n:3}],[{t:'or',n:2},{t:'draw',n:1}],[{t:'or',n:2},{t:'draw',n:2}],[{t:'or',n:2},{t:'eth',n:2}],[{t:'or',n:2},{t:'add',k:'mirror',n:1}],[{t:'or',n:5},{t:'draw',n:3}]];
function loot(G,s,k){const r=rnd(G),j=r<.05?6:r<.15?5:ri(G,5);lg(G,{t:'loot',ts:s,k,n:j});runFx(G,LOOT[j],{s,src:k,self:null,tg:null,pc:0,ss:s,si:-1})}
// dégâts d'une attaque (combat et aperçu de l'interface) : pa = dégâts infligés, ra = riposte subie, xb = bonus Xénophobe
function atkCalc(G,s,i,t){const e=1-s,A=G.p[s].board[i],L=fl(G,s),EA=eff(G,s,i,L);
  if(!t||t.i<0)return{pa:EA.a,ra:0,xb:0,rd:0,ra0:0,vs:0};
  const D=G.p[e].board[t.i],LD=fl(G,e),ED=eff(G,e,t.i,LD);let pa=EA.a,xb=0,vs=0;
  if(hasFC(A,'xeno')&&(hasFC(D,'alien')||(L.xeno||0)>=3||xenoAll(G,s))&&(L.xeno||0)>=2){xb=L.xeno-1;pa+=xb}   // contre toutes les créatures dès 3 Xénophobes, ou avec Homz (porteur de la flamme)
  if(EA.TE&&EA.TE.vsC){vs=EA.TE.vsC*tMul(G,s,EA.T);pa+=vs}
  const rd=(LD.weebos||0)>=5&&hasFC(D,'weebos')&&pa>0?1:0,ra0=(L.weebos||0)>=5&&hasFC(A,'weebos')&&ED.a>0?1:0;   // Weebos : -1 dégât de combat à partir de 5
  const noRet=!A.mut&&CARDS[A.k].noRet;                                  // Haddmi (sniper) : ne subit pas de riposte
  return{pa:Math.max(0,pa-rd),ra:noRet?0:Math.max(0,ED.a-ra0),xb,rd,ra0,vs}}
// Simon (train ses mécaniques) : +1/+1 avant le combat contre une créature qui a autant d'ATK ou autant de PV que lui (ou moins)
function trainOk(G,s,i,t){const A=G.p[s].board[i];if(!A||A.mut||!CARDS[A.k].trainUp||!t||t.i<0||!G.p[1-s].board[t.i])return false;
  const EA=eff(G,s,i),ED=eff(G,1-s,t.i);return ED.a<=EA.a||ED.hp<=EA.hp}
function attack(G,s,i,t){
  const e=1-s,A=G.p[s].board[i];A.af++;A.aw=1;
  const L=fl(G,s),EA=eff(G,s,i,L),xa={ss:s,si:i,src:A.k,sid:A.id};
  G.p[s].board.forEach((b,j)=>{const bd=b&&CARDS[b.k];if(bd&&bd.atkLow&&CARDS[A.k].c<=bd.atkLow.max&&!b.mut&&!G.over)heroHit(G,e,bd.atkLow.n,b.k,false,{ss:s,si:j,src:b.k})});if(G.over)return   // Le Coach : dégâts au héros adverse
  if(t.i>=0){const D=G.p[e].board[t.i];
    if(D&&!D.mut&&CARDS[D.k].jumpAttacked&&D.jt!==G.turn){const defenderSlot=slotOf(G,e,D),free=[];
      G.p[e].board.forEach((c,j)=>{if(!c)free.push(j)});
      if(free.length){D.jt=G.turn;const to=pick(G,free);auraOff(G,e,defenderSlot);G.p[e].board[defenderSlot]=null;G.p[e].board[to]=D;
        lg(G,{t:'jump',ts:e,i:defenderSlot,to,k:D.k,evade:1});keepAlive(G,e);return}}}
  if(trainOk(G,s,i,t)){A.a+=1;A.h+=1;lg(G,{t:'buff',ts:s,i,k:A.k,ba:1,bh:1})}
  const as=snap(G,s,i);
  if(t.i<0){
    const n=EA.a,hp0=G.p[e].hp;heroHit(G,e,n,A.k,true);lg(G,{t:'atk',k:A.k,i,ts:e,ti:-1,to:'hero',n,r:0,as,hp0});
    if(EA.kw.siphon)heal(G,s,n,A.k);
    if(EA.kw.venin&&n>0)addPz(G,e,-1,EA.kw.venin,xa);       // 2 Venin max par attaque sur un héros (s'il l'a blessé)
    if(!G.over&&!A.mut&&CARDS[A.k].faceHit)runFx(G,CARDS[A.k].faceHit,{s,src:A.k,self:A,tg:null,pc:G.played,sl:i,ss:s,si:i})}   // Korock, Snoux : quand il attaque le héros
  else{
    const D=G.p[e].board[t.i],ED=eff(G,e,t.i),did=D.id,K=atkCalc(G,s,i,t),ds=snap(G,e,t.i);
    const d1=dmgC(G,e,t.i,K.pa,A.k,true),d2=dmgC(G,s,i,K.ra,D.k,true);
    lg(G,{t:'atk',k:A.k,i,ts:e,ti:t.i,to:D.k,n:d1,r:d2,xb:K.xb,rd:K.rd,ra:K.ra0,as,ds});
    // Cleave X : X dégâts aux créatures à côté de la cible
    if(EA.kw.cleave)for(const j of[t.i-1,t.i+1])if(j>=0&&j<CELLS&&G.p[e].board[j]){lg(G,{t:'cleave',ts:e,i:j,k:A.k,n:EA.kw.cleave});dmgC(G,e,j,EA.kw.cleave,A.k,false,xa)}
    if(!D.mut&&CARDS[D.k].pzBack&&G.p[s].board[i]===A)addPz(G,s,i,CARDS[D.k].pzBack,{ss:e,si:t.i,src:D.k,sid:D.id});   // Dreos (mot de merde) : Venin à qui l'attaque
    if(EA.kw.venin&&d1>0)addPz(G,e,t.i,EA.kw.venin,xa);
    // le Venin n'agit qu'à l'attaque : la créature qui se défend n'empoisonne pas (sauf effet propre, comme Dreos, mot de merde)
    if(EA.kw.siphon&&d1>0)heal(G,s,d1,A.k);if(ED.kw.siphon&&d2>0)heal(G,e,d2,D.k);
    const aT=EA.T,dT=ED.T;
    reap(G);
    const nd=G.p[e].board[t.i],killed=!nd||nd.id!==did;
    if(!G.over&&killed&&!A.mut&&CARDS[A.k].killLoot)loot(G,s,A.k);
    if(!G.over&&killed&&!A.mut&&CARDS[A.k].killAtk)runFx(G,CARDS[A.k].killAtk,{s,src:A.k,self:A,tg:null,pc:G.played,sl:i,ss:s,si:i});
    const attackerAlive=G.p[s].board[i]&&G.p[s].board[i].id===A.id;
    if(!G.over&&killed&&!A.mut&&CARDS[A.k].reset&&attackerAlive)A.af=Math.max(0,A.af-1);
    // Homz (R14) : chaque créature tuée en combat sur un terrain WoW lui donne +1/+1
    const kg=(C,cs,ci,T)=>{const g=!C.mut&&CARDS[C.k].killGrow;if(g&&T&&TD[T.d].g===g.g){C.a+=g.a;C.h+=g.h;lg(G,{t:'buff',ts:cs,i:ci,k:C.k,ba:g.a,bh:g.h})}};
    if(!G.over&&attackerAlive&&killed)kg(A,s,i,aT);
    if(!G.over&&nd&&nd.id===did&&!attackerAlive)kg(D,e,t.i,dT);
  }
}

// ---------- vue d'un joueur (main adverse et pioches masquées) ; hist = nouveautés depuis `from` ----------
function view(G,me,from){
  from=from||0;const hh=G.hist;G.hist=[];const V=cloneG(G);G.hist=hh;
  V.rs=0;V.me=me;V.hs=from;V.tdn=G.tdeck.length;V.tdeck=[];V.tdis=[];
  const peek=!!(G.p[me]&&G.p[me].rx&&G.p[me].rx.peek);                                             // Expédition : Webcam piratée
  V.p.forEach((P,s)=>{P.dn=P.deck.length;P.deck=[];if(s!==me){if(!peek)P.hand=P.hand.map(()=>({k:'?',id:0,p:0}));P.pq=(P.pq||[]).map(q=>({m:q.m,c:q.c.map(()=>({k:'?',id:0}))}));P.board=P.board.slice()}});
  if(G.rps)V.rps=G.rps.map(r=>r.s===me?Object.assign({},r):Object.assign({},r,{v:'?'}));   // le signe d'Osiris reste secret pour l'adversaire
  V.hist=hh.slice(from).map(e=>{if(e.pv!=null&&e.pv!==me){const q=Object.assign({},e);if(e.t==='rpsb')delete q.v;else delete q.k;return q}return e});
  return V}
