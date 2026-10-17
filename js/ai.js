// ============ IA : évaluation à un coup d'avance + constructeur de decks ============
// mode : 'face' = attaque toujours le héros quand c'est possible, 'clear' = nettoie le plateau d'abord
// Poids d’évaluation. Calibrés par comparaison directe (auto-jeu, sièges alternés, ~2000 parties) :
// le plateau adverse (eb) est le levier principal — l’IA l’évaluait trop bas et échangeait/défendait
// trop peu (+2,6 % de victoires contre l’ancienne évaluation, à échantillon constant).
const WGT={
  bal:{me:1,op:1.2075,atk:1.265,hpw:.95,eb:1.4,hand:.75,gold:.45,lam:.4},
  agro:{me:.8,op:1.725,atk:1.43,hpw:.8,eb:1.33,hand:.675,gold:.4,lam:.5},
  ctrl:{me:1.25,op:.8625,atk:1.1,hpw:1.1,eb:1.47,hand:.9,gold:.45,lam:.3}};
// PV du héros : linéaires (l’ancienne courbe comprimait les PV bas et faussait la défense).
function hpv(h){return h>=0?h:h*3}
function cval(G,s,i,W,L){
  const c=G.p[s].board[i],cd=CARDS[c.k],E=eff(G,s,i,L),hp=Math.max(E.hp,0),k=E.kw;
  const noA=E.TE&&E.TE.noAtk;
  let v=(noA?E.a*.2:E.a)*W.atk+hp*W.hpw;
  if(k.rempart)v+=1+hp*.15;if(k.venin)v+=.6+k.venin*.5+E.a*.2;if(k.siphon)v+=E.a*.35;if(k.hate)v+=.3;
  if(c.eg)v+=1.8;if(k.croissance)v+=2.2;if(k.frenesie)v+=E.a*.9;if(k.tilt)v+=.8;if(k.afk&&!c.aw)v+=.8;
  if(k.insolence)v+=1.2;if(k.respawn&&(c.rsp||!c.rs))v+=1.6;if(k.vip)v+=1.2;if(k.deso)v-=.5;if(c.inv)v+=3;if(k.cleave)v+=k.cleave*.7;
  if(!c.mut){if(cd.aura)v+=2;if(cd.tax)v+=.8;if(cd.noRet)v+=E.a*.3;if(cd.xatk)v+=.6;if(cd.dblLol)v+=1;if(cd.killGrow||cd.allyDieAff)v+=.8;if(cd.noTaunt)v+=.4+E.a*.25;if(cd.noTauntAll)v+=2.5;if(cd.faceHit)v+=1;if(cd.kwAura)v+=1.5;if(cd.killLoot)v+=1.2;if(cd.healGrow)v+=.4;if(cd.pzBack)v+=.6}
  if(c.xat)v+=E.a*.8*c.xat;
  if(c.ta)v-=c.ta*W.atk*.75;
  if(!c.mut&&cd.last&&cd.last.some(o=>o.t==='lose')){let th=0;for(const b of G.p[1-s].board)if(b&&!b.blk&&!b.mut)th+=Math.max(0,b.a);v-=th>=hp?28:40/(hp+1)}           // Dreos (surrender to madness) : s'il meurt, son camp perd ; plus il est blessé, plus c'est risqué                                   // ATK temporaire (Gatekeeping, Flash) : seulement pour ce tour
  if(!c.mut){if(cd.sot)v+=2;if(cd.eot)v+=1.5;if(cd.last)v+=1.2;if(cd.reset)v+=1;if(cd.dbl)v+=3;if(cd.tdisc)v+=1;
    if(cd.dblLast)v+=1.5;if(cd.dblGT)v+=1.5;if(cd.trainUp)v+=1;if(cd.vHeal)v+=.6;if(cd.allFam)v+=1.2;if(cd.onBack)v+=1;
    if(cd.laser){let f=0;for(let j=i+1;j<CELLS&&!G.p[s].board[j];j++)f++;v+=Math.min(f,3)*1.8-(f?0:2.5)}   // Natinganz : place pour avancer
    if(cd.muteAll){let d=0;for(const t of[0,1])G.p[t].board.forEach(b=>{if(b&&b!==c&&!b.pm)d+=t===s?-1:1});v+=d*.8}
    if(cd.custom)v+=1}
  if(E.TE){if(E.TE.sot||E.TE.eot)v+=tval({sot:E.TE.sot,eot:E.TE.eot});if(E.TE.vsC)v+=E.TE.vsC*.6;if(E.TE.aram)v+=E.TE.aram*.5;if(E.TE.last)v+=1}
  if(c.blk)v-=E.a*.8;if(c.pz)v-=Math.min(c.pz*(c.pz+1)/2,hp)*.9;
  if(c.ex){let th=0;G.p[1-s].board.forEach(b=>{if(b)th+=b.a});v+=th>=hp?v*.45:v*.1}
  return v}
function facePressure(G,s,W){
  const P=G.p[s];let dmg=0;
  for(let i=0;i<CELLS;i++){const c=P.board[i];if(!c||c.blk>0)continue;
    const E=eff(G,s,i);if((E.TE&&E.TE.noAtk)||(c.sick&&!E.kw.hate))continue;
    const hits=(E.kw.frenesie?2:1)+(c.xat||0)-c.af;if(hits<=0)continue;
    if(atkTargets(G,s,i).some(t=>t.i<0))dmg+=E.a*hits}
  return dmg*W.atk*.35}
function evalG(G,me,W){
  if(G.over)return G.over.w===me?1e5:(G.over.w<0?0:-1e5);
  const A=G.p[me],B=G.p[1-me];
  let v=W.me*hpv(A.hp)-W.op*hpv(B.hp)-(A.pz*(A.pz+1)/2)*.8+(B.pz*(B.pz+1)/2)*.8;
  const LA=fl(G,me),LB=fl(G,1-me);
  for(let i=0;i<CELLS;i++){if(A.board[i])v+=cval(G,me,i,W,LA);if(B.board[i])v-=cval(G,1-me,i,W,LB)*W.eb}
  v+=facePressure(G,me,W)-facePressure(G,1-me,W)*W.eb; // les Remparts protègent le héros et bloquent les attaques accessibles
  for(const h of A.hand){const cd=CARDS[h.k];v+=W.hand+.12*cd.c;
    if(cd.t==='c'){let m=0;for(let i=0;i<CELLS;i++)if(!A.board[i]){const b=slotBonus(G,me,i,h.k);if(b>m)m=b}v+=.4*m}}
  v+=(A.pq||[]).reduce((t,q)=>t+(q.m==='disc'?-1:1),0)*(W.hand+.6);                  // choix en attente : une carte de plus (Coco, Miroir) ou de moins (Coup de folie)                                                  // choix en attente (Coco, Miroir) : une carte de plus
  v-=B.hand.length*.55;v+=A.or*W.gold-B.or*W.gold*.6;
  v+=((A.arts||[]).length-(B.arts||[]).length)*4.5;                                   // artefacts (Dofus) : permanents
  const tv=P=>P.terrs.reduce((n,T)=>n+(TD[T.d].teot?3:0),0);v+=tv(A)-tv(B)*.8;         // terrains qui invoquent (Éco village, Serveur Minecraft)
  // synergies de familles
  const fv=(L)=>{let s=0;for(const f in L){const n=L[f];if(n<2)continue;
    s+=f==='farmer'?Math.min(n,4)*.9:f==='ravages'?(n-1)*1.3:f==='toxic'?(n-1)*.6:f==='weebos'?(n>=5?2.5:n>=3?.8:0):f==='expats'?.6:f==='vestige'?Math.floor(n/2)*1.3:f==='xeno'?(n>=3?(n-1)*.9:.4):.4}return s};
  v+=fv(LA)-fv(LB);
  return v}

// ---------- coups possibles ----------
function candSlots(G,s,k){const B=G.p[s].board;const b=bestSlot(G,s,k);const r=[b];for(let i=0;i<CELLS;i++)if(!B[i]&&i!==b&&!terrOf(G,s,i)){r.push(i);break}
  if(r.length<2)for(let i=0;i<CELLS;i++)if(!B[i]&&i!==b){r.push(i);break}
  if(CARDS[k].laser){const l=B.findIndex(c=>!c);if(l>=0&&r.indexOf(l)<0)r.push(l)}             // Natinganz : le plus à gauche possible
  return r}
function atkMoves(G,s){const M=[];
  for(let i=0;i<CELLS;i++)if(canAtk(G,s,i)){if(eff(G,s,i).kw.deso){M.push({t:'atk',f:i,tg:{s:1-s,i:-1}});continue}
    for(const t of atkTargets(G,s,i))M.push({t:'atk',f:i,tg:t})}
  return M}
function moves(G,s){
  const P=G.p[s],M=[],seen={};
  if(G.phase==='rps')return G.rpsTo===s?RPSK.map(v=>({t:'rps',v})):[];                   // Osiris (expert bluffeur) : l'adversaire choisit son signe avant son tour
  if(P.pq&&P.pq.length)return P.pq[0].c.map((_,i)=>({t:'pick',i}));                 // Coco (esprit tourmenté) : d'abord choisir la carte à garder
  P.hand.forEach((h,i)=>{
    if(!playable(G,s,i))return;const key=h.k;if(seen[key])return;seen[key]=1;
    const cd=CARDS[h.k],sp=cryTg(cd);
    if(cd.t==='c'){const L=sp?targets(G,s,sp.tg,sp.tgf):[];
      for(const sl of candSlots(G,s,h.k)){if(L.length)for(const t of L){if(sp.tg2)for(const t2 of tg2List(G,s,sl))M.push({t:'play',i,sl,tg:t,tg2:t2});else M.push({t:'play',i,sl,tg:t})}else M.push({t:'play',i,sl})}}
    else{if(sp)for(const t of targets(G,s,sp.tg,sp.tgf)){
        if(sp.sg2){for(const t2 of sp2List(G,s,t))if(t2.s===s&&(t2.i<0||P.board[t2.i].dm>0))M.push({t:'play',i,tg:t,tg2:t2})}   // Clutch : soigner son héros ou une de ses créatures blessées
        else M.push({t:'play',i,tg:t})}
      else M.push({t:'play',i})}});
  M.push(...atkMoves(G,s));
  for(let i=0;i<CELLS;i++)if(canExil(G,s,i))M.push({t:'exil',i});
  // déplacements utiles : seulement ceux qui changent le terrain sous une créature (ils coûtent du Démoflux ou de l'Or, et sont plafonnés)
  if(G.o.ter&&P.terrs.length){
    if(canMoveC(G,s))for(let i=0;i<CELLS;i++){if(!P.board[i])continue;
      for(let j=0;j<CELLS;j++){if(j===i||P.cells[j]===P.cells[i]||(P.board[j]&&j<i))continue;M.push({t:'move',f:i,to:j})}}
    if(canMoveT(G,s))for(const T of P.terrs){const n=P.cells.filter(x=>x===T.id).length;for(let at=0;at+n<=CELLS;at++){const c=terrLayout(P,T.id,at);if(c&&!c.every((x,j)=>x===P.cells[j]))M.push({t:'tmove',id:T.id,at})}}}
  if(G.o.ter)G.shop.forEach((t,n)=>{if(t&&canBuy(G,s,n))for(let at=0;at+TD[t.d].size<=CELLS;at++)if(freeSpan(P,at,TD[t.d].size))M.push({t:'buy',n,at})});
  return M}
function hasEth(k){const cd=CARDS[k];return cd.t==='s'&&cd.fx.some(o=>o.t==='eth')}
function sim(G,s,m){const C=cloneG(G);C.lg=0;C.rs=(G.rs^0x9E3779B9)|0;const r=act(C,s,m);return r.ok?C:null}
// Coco (esprit tourmenté) : l'IA garde la carte la plus utile qu'elle pourra jouer bientôt
// Coup de folie : défausser la carte qui vaut le moins (la plus faible, ou trop chère pour bientôt)
function aiDisc(G,s,g){const P=G.p[s];let bi=0,bv=1e9;
  g.forEach((c,i)=>{const cd=CARDS[c.k];if(!cd)return;let v=cd.c*.6+cd.r*.8+(cd.t==='c'?(cd.a+cd.h)*.35:1);if(cd.c>P.cap+2)v-=(cd.c-P.cap-2)*1.5;if(v<bv){bv=v;bi=i}});
  return bi}
function aiKeep(G,s,g){const P=G.p[s];let bi=0,bv=-1e9;
  g.forEach((c,i)=>{const cd=CARDS[c.k];if(!cd)return;let v=cd.c*.6+cd.r*.8+(cd.t==='c'?(cd.a+cd.h)*.35:1);if(cd.c>P.cap+1)v-=(cd.c-P.cap-1)*1.5;if(v>bv){bv=v;bi=i}});
  return bi}
function aiPick(G,s,W){
  W=W||WGT.bal;
  if(G.phase==='rps')return{t:'rps',v:RPSK[ri(G,3)]};                                    // pierre-feuille-ciseaux : au hasard, il n'y a rien à lire
  const PQ=G.p[s].pq;if(PQ&&PQ.length){const q=PQ[0];if(q.m==='tg'){const c=G.p[s].board.find(b=>b&&b.id===q.id),L=c&&cryList(G,s,c,CARDS[c.k]),b=L&&cryBest(G,s,L);return{t:'pick',i:Math.max(0,b?q.t.findIndex(t=>t.s===b.s&&t.i===b.i):0)}}
    return{t:'pick',i:q.m==='disc'?aiDisc(G,s,q.c):aiKeep(G,s,q.c)}}
  // létal direct ?
  const en=G.p[1-s],ats=atkTargets(G,s);
  if(ats.some(t=>t.i<0)){let sum=0,first=-1;
    for(let i=0;i<CELLS;i++)if(canAtk(G,s,i)){const E=eff(G,s,i),c=G.p[s].board[i];if(E.kw.deso)continue;sum+=E.a*((E.kw.frenesie?2:1)-c.af);if(first<0)first=i}
    if(first>=0&&sum>=en.hp)return{t:'atk',f:first,tg:{s:1-s,i:-1}}}
  // créature dont la mort fait perdre son camp (Dreos, surrender to madness) : si nos attaques réunies peuvent l'achever ce tour, on commence par la plus forte
  for(const t of ats){if(t.i<0)continue;const c=en.board[t.i];if(!c||c.mut||!(CARDS[c.k].last||[]).some(o=>o.t==='lose'))continue;
    const ED=eff(G,1-s,t.i);let sum=0,first=-1,fa=-1;
    for(let i=0;i<CELLS;i++)if(canAtk(G,s,i)){const A=eff(G,s,i),cc=G.p[s].board[i];if(A.kw.deso)continue;sum+=A.a*((A.kw.frenesie?2:1)+(cc.xat||0)-cc.af);if(A.a>fa){fa=A.a;first=i}}
    if(first>=0&&fa>0&&sum>=ED.hp+(c.eg?fa:0))return{t:'atk',f:first,tg:t}}
  let M=moves(G,s);
  if(W.mode==='face'){M=M.filter(m=>m.t!=='atk'||m.tg.i<0||!ats.some(t=>t.i<0))}
  else if(W.mode==='clear'){const hasC=ats.some(t=>t.i>=0);M=M.filter(m=>m.t!=='atk'||m.tg.i>=0||!hasC)}
  let best={m:{t:'end'},v:evalG(G,s,W)-W.lam*G.p[s].eth};
  if(W.mode&&M.some(m=>m.t==='atk'))best.v-=1e3;      // les modes forcés attaquent toujours
  for(const m of M){
    const C=sim(G,s,m);if(!C)continue;
    let v=evalG(C,s,W)-W.lam*C.p[s].eth;
    if(m.t==='atk'&&m.tg.i>=0&&eff(G,1-s,m.tg.i).kw.rempart){
      for(const m2 of atkMoves(C,s)){const C2=sim(C,s,m2);if(!C2)continue;
        const v2=evalG(C2,s,W)-W.lam*C2.p[s].eth;if(v2>v)v=v2}
    }
    if(m.t==='move')v-=mvCost(G,s)*(W.lam+.5);           // le Démoflux d'un déplacement n'est pas « gratuit » : il aurait pu servir à jouer une carte
    else if(m.t==='tmove')v-=mvCost(G,s)*.3;             // (l'Or dépensé est déjà compté par evalG)
    if(m.t==='play'&&hasEth(G.p[s].hand[m.i].k)){        // sorts de Démoflux : on regarde un coup plus loin
      let b2=-1e9;for(const m2 of moves(C,s)){const C2=sim(C,s,m2);if(!C2)continue;const v2=evalG(C2,s,W)-W.lam*C2.p[s].eth;if(v2>b2)b2=v2}
      if(b2>v)v=b2}
    if(v>best.v+(m.t==='move'||m.t==='tmove'?.3:1e-6))best={m,v}}
  return best.m}
function aiTurn(G,s,W){
  for(let n=0;n<80&&!G.over&&G.cur===s;n++){const m=aiPick(G,s,W);const r=act(G,s,m);if(!r.ok){act(G,s,{t:'end'});break}if(m.t==='end')break}
  if(!G.over&&G.cur===s)act(G,s,{t:'end'})}

// ---------- decks : archétypes ----------
// mulligan de l'IA : remplace les cartes chères (5+), et la plus chère des 4 si la main n'a rien à jouer avant le tour 3
function aiMull(G,s){const H=G.p[s].hand,r=[];H.forEach((c,i)=>{if(CARDS[c.k].c>=5)r.push(i)});
  if(!H.some(c=>CARDS[c.k].c<=2)){let bi=-1,bc=3;H.forEach((c,i)=>{const k=CARDS[c.k].c;if(r.indexOf(i)<0&&k>bc){bc=k;bi=i}});if(bi>=0)r.push(bi)}
  return r}
const ARCH={
  toxic:{n:'Toxic',ic:'☣️',c:'#a6ba69',w:'bal',fam:['toxic'],pri:['ambiance','signalement','flame','toxicite','sanction','ping','clutch']},
  weebos:{n:'Weebos',ic:'🌸',c:'#ca7999',w:'bal',fam:['weebos'],pri:['genkidama','binge','boost','premade','clutch','ping']},
  farmer:{n:'Farmers',ic:'🌾',c:'#d3b970',w:'ctrl',fam:['farmer'],pri:['p2w','achat','pizza','botspell','raid','clutch']},
  expats:{n:'Expats',ic:'✈️',c:'#75b5d6',w:'bal',fam:['expats'],pri:['valise','lowcost','nitro','webhook','boost','ping']},
  ravages:{n:'Ravagés',ic:'🌀',c:'#c98859',w:'agro',fam:['ravages'],pri:['soiree','folie','raid','ping','webhook','premade']},
  alien:{n:'Extraterritoriaux',ic:'👽',c:'#9a7ece',w:'bal',fam:['alien'],pri:['enlevement','immunite','screenshot','kick','pizza']},
  xeno:{n:'Xénophobes',ic:'🚧',c:'#b5554a',w:'bal',fam:['xeno'],pri:['videur','gatekeeping','nerf','sanction','boost']},
  vestige:{n:'Vestiges',ic:'🏛',c:'#b6aa93',w:'ctrl',fam:['vestige'],pri:['mieuxavant','nostalgie','pizza','clutch','sanction']},
  wow:{n:'Affinité WoW',ic:'⚔️',c:'#c9ac71',w:'bal',fam:[],aff:'wow',pri:['rois','drain','smurf','pizza','clutch']},
  dofus:{n:'Affinité Dofus',ic:'🥚',c:'#7faf72',w:'bal',fam:[],aff:'dofus',pri:['parchemin','feca','smurf','sanction','giveaway']},
  lol:{n:'Affinité LoL',ic:'🏆',c:'#638ecf',w:'bal',fam:[],aff:'lol',pri:['smite','flash','smurf','boost','ping']},
  cs:{n:'Affinité CS',ic:'🎯',c:'#ca7f60',w:'bal',fam:[],aff:'cs',pri:['headshot','fumigene','smurf','ping','webhook']},
  rush:{n:'Rush',ic:'⚡',c:'#ca7f60',w:'agro',fam:[],pri:['korock1','snoux1','miichi1','korock2','snoux2','miichi2','korock3','snoux3','miichi3','takk1','coco2','loractys1','boku1','mikalev1','lisdoon1','randal1','sada1','ping','webhook','boost','premade','kirua2','dreos2','minuit2','simon2','boku3','takk3'],agro:1},
  ctrl:{n:'Contrôle',ic:'🛡️',c:'#638ecf',w:'ctrl',fam:[],pri:['raid','clutch','sanction','pizza','everyone','ban','giveaway','laloutre1','natingaz3','simon3','dreos3','maki3','sada3','bambou2','bambou3','mikalev3','minuit3'],ctrl:1}};
const ARCHK=Object.keys(ARCH);
// coll : {clé:{n}} (exemplaires possédés) ou null = tout
function availOf(coll,k){if(!coll)return LIMIT(CARDS[k].r);const e=coll[k];return e?Math.min(LIMIT(CARDS[k].r),(e.n||0)+(e.p||0)):0}
function cardScore(k,A){
  const cd=CARDS[k];let v=cd.r*1.2;
  if(cd.t==='c'){const ef=cd.a+cd.h-2*cd.c-1;v+=(ef<0?ef*.9:ef*.6)+(cd.kw?cd.kw.length*.5:0)+(cd.cry||cd.last||cd.sot||cd.eot||cd.aura||cd.tilt?1:0);   // une créature très en dessous de son coût n'entre plus juste pour sa famille
    for(const f of cd.fac)if(A.fam.indexOf(f)>=0)v+=6;
    if(A.agro){if(cd.c<=3)v+=2;if(cd.kw&&cd.kw.indexOf('hate')>=0)v+=2}
    if(A.ctrl){if(cd.c>=5)v+=1.5;if(cd.kw&&(cd.kw.indexOf('rempart')>=0||cd.kw.indexOf('insolence')>=0))v+=1.5}
    if(A.aff){const x=(cd.sc&&cd.sc[A.aff])||0;v+=x===2?7:x===1?1.5:-1}
    if(!cd.fac.length&&A.pri.indexOf('freelance')>=0)v+=2}
  else{v+=1;if(cd.fam)v+=A.fam.indexOf(cd.fam)>=0?2:-6;if(cd.gam)v+=A.aff===cd.gam?2:-6}           // sorts de famille / d'affinité : seulement dans le bon deck
  const pi=A.pri.indexOf(k);if(pi>=0)v+=6-pi*.4;
  return v}
// courbe visée pour 30 cartes
const CURVE=[[1,2,9],[3,4,11],[5,6,6],[7,99,4]];
function autoDeck(coll,arch,size,rs){
  size=size||ECON.deck;const A=ARCH[arch]||ARCH.rush,out=[],cnt={};let r0=rs||0;
  const jit=()=>{r0=(r0*9301+49297)%233280;return r0/233280};
  const sc={};POOL.forEach(k=>sc[k]=cardScore(k,A)+(rs?jit()*2.5:0));
  const avail=POOL.filter(k=>availOf(coll,k)>0).sort((a,b)=>sc[b]-sc[a]);
  const legN=()=>out.filter(x=>CARDS[x].r===3).length;                                // 7 légendaires au plus
  const add=k=>{if(out.length>=size||(cnt[k]||0)>=availOf(coll,k)||(CARDS[k].r===3&&legN()>=LEGMAX))return false;cnt[k]=(cnt[k]||0)+1;out.push(k);return true};
  const bucket=c=>CURVE.findIndex(b=>c>=b[0]&&c<=b[1]);
  const inB=b=>out.filter(k=>bucket(CARDS[k].c)===b).length;
  const spells=()=>out.filter(k=>CARDS[k].t==='s').length;
  // 1) on remplit chaque tranche de coût avec les meilleures cartes
  for(let b=0;b<CURVE.length;b++)for(const k of avail){if(inB(b)>=CURVE[b][2])break;if(bucket(CARDS[k].c)!==b)continue;
    if(CARDS[k].t==='s'&&spells()>=9)continue;add(k);if(inB(b)<CURVE[b][2])add(k)}
  // 2) complète avec le reste
  for(let r=0;r<2&&out.length<size;r++)for(const k of avail){if(CARDS[k].t==='s'&&spells()>=11)continue;add(k)}
  for(const k of avail)add(k);
  return out}
// ----- compléter un deck existant (deckbuilder) -----
// garde les cartes déjà là ; pref = {fac:[familles], aff:[jeux], kw:[mots-clés]} cochés ; rien de coché = on suit les familles et le jeu déjà présents.
// Même courbe de coût et même plafond de sorts que les decks automatiques, pour un deck équilibré.
function kwHas(cd,x){return x==='draw'?/pioch/i.test(cd.tx||''):x==='cry'?!!cd.cry:x==='last'?!!cd.last:x==='turn'?!!(cd.sot||cd.eot):x==='cleave'?!!cd.cleave:(cd.kw||[]).indexOf(x)>=0}
function completeDeck(coll,cards,pref,rs){
  pref=pref||{};const size=ECON.deck,out=cards.map(e=>String(e).replace('*','')).slice(0,size),cnt={};out.forEach(k=>cnt[k]=(cnt[k]||0)+1);
  if(out.length>=size)return out;
  let fam=(pref.fac||[]).slice(),aff=(pref.aff||[]).slice(),pri=[],agro=0,ctrl=0;const kws=(pref.kw||[]).slice();
  if(!fam.length&&!aff.length&&!kws.length){
    if(out.length){const fc={},gc={};                                                       // rien de coché : familles (2 cartes ou plus) et jeu dominant du deck
      out.forEach(k=>{const cd=CARDS[k];if(!cd)return;(cd.fac||[]).forEach(f=>fc[f]=(fc[f]||0)+1);if(cd.fam)fc[cd.fam]=(fc[cd.fam]||0)+1;if(cd.t==='c'&&cd.sc)for(const g in cd.sc)if(cd.sc[g]>=2)gc[g]=(gc[g]||0)+1});
      fam=Object.keys(fc).filter(f=>fc[f]>=2).sort((a,b)=>fc[b]-fc[a]).slice(0,2);
      const g=Object.keys(gc).sort((a,b)=>gc[b]-gc[a])[0];if(g&&gc[g]>=3)aff=[g]}
    if(!fam.length&&!aff.length){const A=ARCH[coverArch(coll,rs?(rs%1000)/1000:0)];   // deck vide : l'archétype le mieux fourni par la collection
      fam=A.fam.slice();if(A.aff)aff=[A.aff];pri=A.pri;agro=A.agro;ctrl=A.ctrl}}
  // cartes clés des archétypes qui correspondent aux choix (sorts de famille, sorts de jeu, cartes phares)
  const pl=[pri].concat(fam.map(f=>ARCH[f]?ARCH[f].pri:[]),aff.map(g=>ARCH[g]?ARCH[g].pri:[]));
  const priB=k=>{let b=0;for(const L of pl){const i=L.indexOf(k);if(i>=0)b=Math.max(b,6-i*.4)}return b};
  let r0=rs||0;const jit=()=>{r0=(r0*9301+49297)%233280;return r0/233280};
  const sc={};POOL.forEach(k=>{const cd=CARDS[k];let v=cd.r*1.2;
    if(cd.t==='c'){const ef=cd.a+cd.h-2*cd.c-1;v+=(ef<0?ef*.9:ef*.6)+(cd.kw?cd.kw.length*.5:0)+(cd.cry||cd.last||cd.sot||cd.eot||cd.aura||cd.tilt?1:0);
      for(const f of cd.fac)if(fam.indexOf(f)>=0)v+=6;
      if(aff.length){const x=Math.max(...aff.map(g=>(cd.sc&&cd.sc[g])||0));v+=x===2?7:x===1?1.5:-1}
      if(agro){if(cd.c<=3)v+=2;if(cd.kw&&cd.kw.indexOf('hate')>=0)v+=2}
      if(ctrl){if(cd.c>=5)v+=1.5;if(cd.kw&&(cd.kw.indexOf('rempart')>=0||cd.kw.indexOf('insolence')>=0))v+=1.5}}
    else{v+=1;if(cd.fam)v+=fam.indexOf(cd.fam)>=0?2:-6;if(cd.gam)v+=aff.indexOf(cd.gam)>=0?2:-6}   // sorts de famille ou de jeu : seulement s'ils vont avec le deck
    for(const x of kws)if(kwHas(cd,x))v+=6;
    sc[k]=v+priB(k)+(rs?jit()*2.5:0)});
  const avail=POOL.filter(k=>availOf(coll,k)>(cnt[k]||0)).sort((a,b)=>sc[b]-sc[a]);
  const legN=()=>out.filter(x=>CARDS[x]&&CARDS[x].r===3).length;                      // 7 légendaires au plus
  const add=k=>{if(out.length>=size||(cnt[k]||0)>=availOf(coll,k)||(CARDS[k].r===3&&legN()>=LEGMAX))return false;cnt[k]=(cnt[k]||0)+1;out.push(k);return true};
  const bucket=c=>CURVE.findIndex(b=>c>=b[0]&&c<=b[1]);
  const inB=b=>out.filter(k=>bucket(CARDS[k].c)===b).length,spells=()=>out.filter(k=>CARDS[k].t==='s').length;
  // 1) tranches de coût qui manquent encore (courbe visée pour 30 cartes), meilleures cartes d'abord, par 2 exemplaires
  for(let b=0;b<CURVE.length;b++)for(const k of avail){if(out.length>=size||inB(b)>=CURVE[b][2])break;if(bucket(CARDS[k].c)!==b)continue;
    if(CARDS[k].t==='s'&&spells()>=9)continue;add(k);if(inB(b)<CURVE[b][2])add(k)}
  // 2) le reste avec les meilleures cartes, 11 sorts au plus
  for(let r=0;r<2&&out.length<size;r++)for(const k of avail){if(CARDS[k].t==='s'&&spells()>=11)continue;add(k)}
  for(const k of avail)add(k);
  return out}
// choisit l'archétype dont la collection fournit le plus de cartes (rapide, sans auto-jeu).
// Sert au deckbuilder (compléter un deck vide) et de repli.
function coverArch(coll,rs){
  const sc=ARCHK.map(a=>{const d=autoDeck(coll,a);const A=ARCH[a];return{a,v:d.filter(k=>CARDS[k].fac&&CARDS[k].fac.some(f=>A.fam.indexOf(f)>=0)||A.pri.indexOf(k)>=0||(A.aff&&CARDS[k].sc&&CARDS[k].sc[A.aff]===2)).length}});
  const mx=Math.max(...sc.map(x=>x.v));const top=sc.filter(x=>x.v>=mx-4).map(x=>x.a);return top[Math.floor(rs*top.length)%top.length]}

// ----- sélection du « meilleur deck » -----
// Les archétypes ne se valent pas (écart de ~25 pts de winrate) et aucun score statique ne le
// prédit : seul l'auto-jeu tranche. On fait donc un tournoi round-robin (2 parties/paire incluant
// l'alternance des sièges) entre les decks de tous les archétypes, et l'IA joue le vainqueur.
// Résultat mis en cache par collection : le tournoi ne tourne qu'une fois par session.
const BEST_GPP=2;                       // parties par paire (2 = fiable ; 1 = ~2x plus rapide mais peu fiable ; 0 = désactivé)
var _bdCache={};
function bdSig(coll,opts){const settings=Object.assign({},OPTDEF,opts||{}),ok=['hp','cap','ter','evt','hand','inc','mv','fat','rw','comp','arena'];
  const os=ok.map(k=>settings[k]).join(',');if(!coll)return'ALL_'+os;const ks=Object.keys(coll).sort();let h=5381;
  for(const k of ks)h=((h*33)+(((coll[k]&&coll[k].n)||0)*7+((coll[k]&&coll[k].p)||0)))>>>0;
  return'C'+h+'_'+ks.length+'_'+os}
function bdPlay(d0,d1,a0,a1,seed,first,opts){
  const G=newGame({seed:(seed>>>0)||1,decks:[d0.slice(),d1.slice()],o:opts||{},first:first?1:0,lg:false});
  let g=0;
  while(!G.over&&g++<4000){const s=G.cur,W=WGT[(ARCH[s===0?a0:a1]||{}).w]||WGT.bal;
    if(G.phase==='rps'){const r=act(G,s,aiPick(G,s,W));if(!r.ok)act(G,s,{t:'end'});continue}
    aiTurn(G,s,W)}
  return G.over?G.over.w:-1}
function bestDeck(coll,rs,opts){
  if(BEST_GPP<=0)return null;                    // tournoi désactivé : pickArch retombe sur coverArch
  const sig=bdSig(coll,opts);if(sig in _bdCache)return _bdCache[sig];
  let out=null;
  try{
    const cands=ARCHK.map(a=>autoDeck(coll,a,ECON.deck,(rs||1)+a.length*131));
    const wins=cands.map(()=>0),pl=cands.map(()=>0);
    for(let i=0;i<cands.length;i++)for(let j=i+1;j<cands.length;j++)for(let q=0;q<BEST_GPP;q++){
      const first=(i+j+q)&1;
      const w=bdPlay(cands[i],cands[j],ARCHK[i],ARCHK[j],(((rs||1)*2654435761)+i*131+j*17+q*7+1)>>>0,first,opts);
      pl[i]++;pl[j]++;if(w===0){wins[i]++;}else if(w===1){wins[j]++;}else{wins[i]+=.5;wins[j]+=.5}}
    let bi=0,bv=-1;for(let i=0;i<cands.length;i++){const p=pl[i]?wins[i]/pl[i]:0;if(p>bv){bv=p;bi=i}}
    out={arch:ARCHK[bi],cards:cands[bi],p:bv};
  }catch(e){console.error('Le tournoi de decks de l’IA a échoué :',e);out=null}
  _bdCache[sig]=out;return out}
function pickArch(coll,rs){
  // l'IA joue le meilleur deck pour la collection (tournoi), pas un archétype tiré au hasard.
  const b=bestDeck(coll,rs);if(b&&b.arch)return b.arch;
  return coverArch(coll,rs)}
function bestAIDeck(coll,rs,opts){
  const b=bestDeck(coll,rs,opts);if(b&&b.cards&&b.cards.length===ECON.deck)return{arch:b.arch,cards:b.cards.slice()};
  const arch=coverArch(coll,rs);return{arch,cards:autoDeck(coll,arch,ECON.deck,rs)}}

// ----- codes de deck : un deck se partage par copier-coller -----
// code = « EAD1- » + somme de contrôle (4 car.) + « - » + base64url de « nom|clé*n.clé.… » (clés des cartes : le code reste valable quand on ajoute des cartes)
function dckSum(s){let x=2166136261;for(let i=0;i<s.length;i++){x^=s.charCodeAt(i);x=Math.imul(x,16777619)>>>0}return(x%1679616).toString(36).padStart(4,'0')}
function b64u(s){let t='';new TextEncoder().encode(s).forEach(c=>t+=String.fromCharCode(c));return btoa(t).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function unb64u(s){const t=atob(s.replace(/-/g,'+').replace(/_/g,'/'));return new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(t,c=>c.charCodeAt(0)))}
function deckCode(d){const c={},ord=[];for(const e of d.cards){const k=String(e).replace('*','');if(!c[k])ord.push(k);c[k]=(c[k]||0)+1}
  const p=String(d.name||'').replace(/[|\r\n]/g,' ').trim().slice(0,16)+'|'+ord.map(k=>c[k]>1?k+'*'+c[k]:k).join('.');
  return 'EAD1-'+dckSum(p)+'-'+b64u(p)}
// lit un code collé (texte autour et retours à la ligne tolérés : la somme de contrôle dit où le code s'arrête) :
// {name, want:{clé:n}, unknown:[clés inconnues], total} ou null s'il est invalide ou abîmé
function readDeckCode(txt){
  const s=String(txt||''),at=s.search(/EAD1-[0-9a-z]{4}-/);if(at<0)return null;
  const sum=s.slice(at+5,at+9);let b='';
  for(const part of s.slice(at+10).split(/\s+/)){const m=part.match(/^[A-Za-z0-9_-]*/)[0];b+=m;
    const r=m?deckPayload(sum,b):null;if(r)return r;if(m.length<part.length)break}
  return null}
function deckPayload(sum,b){
  let p;try{p=unb64u(b)}catch(e){return null}if(dckSum(p)!==sum)return null;
  const i=p.indexOf('|');if(i<0)return null;
  const name=p.slice(0,i).trim().slice(0,16),want={},unknown=[];let total=0;
  for(const it of p.slice(i+1).split('.')){if(!it)continue;const j=it.indexOf('*'),k=j<0?it:it.slice(0,j),n=j<0?1:(parseInt(it.slice(j+1),10)||1);
    if(!Object.prototype.hasOwnProperty.call(CARDS,k)||POOL.indexOf(k)<0){if(unknown.indexOf(k)<0)unknown.push(k);continue}
    const q=Math.min(n,LIMIT(CARDS[k].r)-(want[k]||0),ECON.deck-total);if(q>0){want[k]=(want[k]||0)+q;total+=q}}
  return{name,want,unknown,total}}
// construit le deck d'un code avec la collection `coll` (null = tout) : les cartes possédées d'abord ;
// si fill, chaque carte manquante est remplacée par une carte possédée de même coût (ou proche), choisie pour le style du deck
function deckFromCode(info,coll,fill){
  const cards=[],cnt={},miss={},added=[];
  for(const k in info.want){const n=Math.min(info.want[k],availOf(coll,k));for(let j=0;j<n;j++)cards.push(k);cnt[k]=n;if(info.want[k]>n)miss[k]=info.want[k]-n}
  if(fill&&cards.length<ECON.deck){
    let A=ARCH.rush,bv=-1e9;for(const a of ARCHK){const v=Object.keys(info.want).reduce((s,k)=>s+cardScore(k,ARCH[a])*info.want[k],0);if(v>bv){bv=v;A=ARCH[a]}}
    const sc={};POOL.forEach(k=>sc[k]=cardScore(k,A));
    const pool=POOL.filter(k=>availOf(coll,k)>0).sort((a,b)=>sc[b]-sc[a]);
    const free=k=>(cnt[k]||0)<availOf(coll,k);
    const slots=[];for(const k in miss)for(let j=0;j<miss[k];j++)slots.push(CARDS[k].c);
    while(cards.length+slots.length<ECON.deck)slots.push(null);
    slots.sort((a,b)=>(a==null)-(b==null));
    for(const c of slots){let k=null;
      if(c!=null)for(const d of[0,1,-1,2,-2]){k=pool.find(x=>free(x)&&CARDS[x].c===c+d);if(k)break}
      if(!k)k=pool.find(free);if(!k)break;
      cnt[k]=(cnt[k]||0)+1;cards.push(k);added.push(k)}}
  return{cards,miss,added}}
