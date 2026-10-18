// ============ IA MCTS : recherche Monte-Carlo dans l'arbre des actions ============
// aiPick évalue chaque coup d'un simple coup d'œil. Ce module ajoute deux recherches :
//   • aiMCTS   : MCTS classique (UCT) sur l'arbre des actions ;
//   • aiFlatMC : évaluation « plate appariée » — les quelques meilleurs coups sont simulés avec
//     les MÊMES tirages aléatoires, ce qui annule la part commune de la variance et rend la
//     comparaison bien plus fiable qu'un UCT à budget égal. C'est la variante de l'IA d'Arène.
// Dans les deux cas, chaque simulation joue la suite de la partie avec l'IA rapide (aiPick, des
// deux côtés) puis évalue la position obtenue : la décision retenue est la moyenne de plusieurs
// futurs possibles (les pioches, cibles aléatoires et événements sont refaits à chaque tirage).
//
// Interface :  aiFlatMC(G,s,W,opt) / aiMCTS(G,s,W,opt) → l'action à jouer pour le joueur s.
//              aiTurnMCTS(G,s,W,opt) → joue tout le tour de s (comme aiTurn ; opt.flat = variante plate).
// opt : { ms: budget de réflexion par action (défaut 150), roll: cycles de jeu simulés avant
//         l'évaluation (défaut 1), uct: constante d'exploration (défaut .7), min: playouts (ou
//         manches en mode plat) minimum (défaut 3), max: maximum (défaut 400), msMax: plafond dur
//         (défaut ms×1,5), seed: graine imposée (tests), now: horloge injectée, hide: 1 = la main
//         adverse est remplacée au hasard pendant les simulations, topK: ne garde que les K
//         meilleurs coups à la racine (0 = tous, défaut 0), trace: détail des décisions (mise au point) }
// Toutes les valeurs de l'arbre sont du point de vue du joueur racine.
//
// Le module n'utilise que le moteur : moves(), cloneG(), act(), evalG(), aiPick(), aiMull(), POOL.
// Coûts mesurés en Node : aiPick ≈ 0,6 ms, cloneG ≈ 0,005 ms, tour complet ≈ 1 ms : un budget de
// 150 ms laisse donc ~30-50 playouts (UCT) ou ~10-25 manches de quelques coups (plat). Le module
// n'est pas chargé dans le worker (tournoi de decks), seulement dans la page de jeu.
const MCTSOPT={ms:150,roll:1,uct:.7,min:3,max:400,msMax:0,seed:null,now:null,topK:0,hide:0};
// Réglages de l'IA d'Arène « experte » : recherche plate appariée (aiFlatMC), main adverse cachée
// pendant les simulations, budget court. Mesuré en miroir : ~61 % de victoires contre l'IA à un
// coup sur 80 parties (4 archétypes), ~0,6 s par tour. aiMCTS (UCT) sert d'alternative explorée.
const MCTS_ARENA={ms:150,topK:6,roll:1,hide:1};

// qui doit décider dans cet état (le joueur avec un choix en attente, sinon celui dont c'est le tour)
function mctsActor(G){
  if(G.phase==='rps')return G.rpsTo;
  const p=G.cur,q=G.p[1-p].pq;
  return q&&q.length?1-p:p}

// valeur bornée dans [-1, 1] du point de vue de me : ±1 si la partie est finie, tanh de l'évaluation sinon
function mctsValue(G,me,W){
  if(G.over)return G.over.w===me?1:G.over.w<0?0:-1;
  return Math.tanh(evalG(G,me,W)/30)}

// joue un tour complet avec l'IA rapide (celle qui sert au tournoi de decks) : les deux camps
// progressent ainsi de façon crédible, sans le coût d'une exploration complète.
function mctsTurn(G,me,W,Wopp){
  let g=0;
  while(!G.over&&g++<120){
    const s=mctsActor(G);
    if(G.phase==='rps'){if(!act(G,s,{t:'rps',v:RPSK[ri(G,3)]}).ok)break;continue}
    const m=aiPick(G,s,s===me?W:Wopp),r=act(G,s,m);
    if(!r.ok){act(G,s,{t:'end'});break}
    if(m.t==='end')break}}

// rollout : on joue jusqu'à ce que la main revienne au joueur racine, après au moins `roll` cycles
// de jeu complets, puis on évalue du point de vue de me. Toutes les branches sont ainsi comparées
// au même moment du cycle (et non après un nombre fixe de tours, qui avantage une branche).
// La copie est indispensable : l'état du nœud doit rester intact pour la suite de la recherche.
// Avec hide, la main adverse est remplacée au hasard par des cartes de la réserve : l'IA ne lit
// pas vos cartes exactes pendant les simulations.
function mctsRollout(G,me,W,Wopp,roll,seed,hide){
  const C=cloneG(G);C.lg=0;C.hist=[];
  C.rs=(seed>>>0)||1;
  if(hide&&!(C.p[1-me].pq&&C.p[1-me].pq.length)){
    const H=C.p[1-me].hand;
    for(let i=0;i<H.length;i++)H[i]={k:POOL[ri(C,POOL.length)],id:++C.uid}}
  const r0=C.round;
  for(let i=0;i<40&&!C.over;i++){
    if(C.round-r0>=roll&&mctsActor(C)===me)break;
    mctsTurn(C,me,W,Wopp)}
  return mctsValue(C,me,W)}

// sélection UCT : toutes les valeurs sont du point de vue de la racine, donc on maximise
// aux nœuds de la racine et on minimise aux nœuds de l'adversaire.
function mctsSelect(nd,C){
  const mx=nd.cu===nd.me;
  let b=null,bv=0,l=Math.sqrt(Math.log(nd.n+2));
  for(const c of nd.ch){
    if(!c.n)return c;                                            // un enfant jamais essayé d'abord
    const q=c.v/c.n,u=(mx?q:-q)+C*l/(c.n+1);
    if(b===null||u>bv){bv=u;b=c}}
  return b}

// expansion : une copie de l'état par coup possible (cloneG ≈ 0,005 ms, largement abordable)
function mctsExpand(nd,seed){
  const G=nd.G,s=nd.cu,M=moves(G,s);
  if(!G.phase&&s===G.cur&&!(G.p[s].pq&&G.p[s].pq.length))M.push({t:'end'});   // passer (finir son tour) est toujours une option
  nd.ch=[];
  for(const m of M){
    const C=cloneG(G);C.lg=0;C.hist=[];C.rs=(seed+nd.ch.length*7919)>>>0||1;
    if(act(C,nd.cu,m).ok)nd.ch.push({G:C,cu:mctsActor(C),me:nd.me,parent:nd,move:m,n:0,v:0,ch:null})
  }
  for(let i=nd.ch.length-1;i>0;i--){const j=ri({rs:(seed+i*131)>>>0||1},i+1),t=nd.ch[i];nd.ch[i]=nd.ch[j];nd.ch[j]=t}   // ordre mélangé
  return nd.ch}

// un playout complet : descente UCT, expansion, rollout, remontée des valeurs
function mctsPlayout(root,W,Wopp,o,seed){
  let nd=root;
  while(!nd.G.over&&nd.ch&&nd.ch.length)nd=mctsSelect(nd,o.uct);
  if(!nd.G.over&&(!nd.ch||!nd.ch.length)){
    mctsExpand(nd,seed);
    if(nd.ch.length)nd=mctsSelect(nd,o.uct)}
  let val=mctsRollout(nd.G,root.me,W,Wopp,o.roll,seed,o.hide);
  while(nd){nd.n++;nd.v+=val;nd=nd.parent}}

// élagage optionnel des coups de la racine : ne garde que les `k` mieux notés par l'évaluation
// immédiate (la brique d'aiPick), « passer » compris, pour donner plus de playouts à chacun.
function mctsPrune(G0,s,W,ch,k){
  if(!k||ch.length<=k)return ch;
  const sc=new Map();
  for(const c of ch){const C=c.move.t==='end'?null:sim(G0,s,c.move);sc.set(c,C?evalG(C,s,W):-1e9)}
  ch.sort((a,b)=>(sc.get(b)-sc.get(a))||0);
  const keep=ch.slice(0,k-1),e=ch.find(c=>c.move.t==='end');
  if(e&&keep.indexOf(e)<0)keep.push(e);
  return keep}

// choix final : meilleure valeur moyenne (au moins `pick` visites), la plus visitée en secours
function mctsBestMove(root,pick){
  let best=null,bv=-2;
  for(const c of root.ch){if(c.n<pick)continue;const q=c.v/c.n;
    if(q>bv||(q===bv&&best&&c.n>best.n)){bv=q;best=c}}
  if(!best)for(const c of root.ch)if(!best||c.n>best.n)best=c;
  return best?best.move:{t:'end'}}

function aiMCTS(G0,s,W,opt){
  const o=Object.assign({},MCTSOPT,opt||{});
  if(G0.over)return{t:'end'};
  if(G0.phase==='mull')return{t:'mull',idx:aiMull(G0,s)};
  if(G0.phase==='rps')return aiPick(G0,s,W);                     // aucun choix à explorer
  const Wopp=(o.opp&&o.opp.W)||WGT.bal;
  const now=o.now||Date.now,t0=now();
  const R=cloneG(G0);R.lg=0;R.hist=[];
  const root={G:R,cu:s,me:s,move:null,n:0,v:0,ch:null,parent:null};
  let seed=(o.seed!=null?o.seed:(G0.rs^Math.imul(G0.turn+1,2654435761)))>>>0||1;
  mctsExpand(root,seed);
  root.ch=mctsPrune(G0,s,W,root.ch,o.topK);
  if(!root.ch.length||root.ch.length===1)return root.ch.length?root.ch[0].move:aiPick(G0,s,W);
  const cap=o.msMax||Math.round(o.ms*1.5);
  let k=0;
  while(k<o.max){
    const el=now()-t0;
    if(k>=1&&(el>=cap||el+el/k>cap))break;                       // plafond dur : une manche de plus ferait déborder
    if(k>=o.min&&el>=o.ms)break;                                 // budget atteint
    seed=(Math.imul(seed,1664525)+1013904223)>>>0||1;
    mctsPlayout(root,W,Wopp,o,seed);
    k++}
  if(o.trace)o.trace.push({turn:G0.turn,act:s,n:k,ms:now()-t0,ch:root.ch.map(c=>({m:c.move,n:c.n,q:c.n?c.v/c.n:0}))});
  return mctsBestMove(root,o.pick||1)}

// Version « plate » : pas d'arbre. Les K meilleurs coups (prior = évaluation immédiate d'aiPick)
// sont comparés avec les MÊMES tirages aléatoires à chaque manche (mêmes graines pour tous les
// enfants) : la part commune de la variance s'annule et la comparaison est bien plus fine qu'un
// UCT à budget égal. `min`/`max` comptent alors des manches (une manche = un tirage par coup).
function aiFlatMC(G0,s,W,opt){
  const o=Object.assign({},MCTSOPT,opt||{});
  if(G0.over)return{t:'end'};
  if(G0.phase==='mull')return{t:'mull',idx:aiMull(G0,s)};
  if(G0.phase==='rps')return aiPick(G0,s,W);
  const Wopp=(o.opp&&o.opp.W)||WGT.bal;
  const now=o.now||Date.now,t0=now();
  const R=cloneG(G0);R.lg=0;R.hist=[];
  const root={G:R,cu:s,me:s,parent:null,move:null,n:0,v:0,ch:null};
  let seed=(o.seed!=null?o.seed:(G0.rs^Math.imul(G0.turn+3,2654435761)))>>>0||1;
  mctsExpand(root,seed);
  root.ch=mctsPrune(G0,s,W,root.ch,o.topK);
  if(!root.ch.length||root.ch.length===1)return root.ch.length?root.ch[0].move:aiPick(G0,s,W);
  const cap=o.msMax||Math.round(o.ms*1.5);
  let k=0;
  while(k<o.max){
    const el=now()-t0;
    if(k>=1&&(el>=cap||el+el/k>cap))break;                       // plafond dur : une manche de plus ferait déborder
    if(k>=o.min&&el>=o.ms)break;                                 // budget atteint
    seed=(Math.imul(seed,1664525)+1013904223)>>>0||1;
    for(const c of root.ch){c.n++;c.v+=mctsRollout(c.G,s,W,Wopp,o.roll,seed,o.hide)}
    k++}
  if(o.trace)o.trace.push({turn:G0.turn,act:s,n:k,ms:now()-t0,ch:root.ch.map(c=>({m:c.move,n:c.n,q:c.n?c.v/c.n:0}))});
  return mctsBestMove(root,o.pick||1)}

// même boucle qu'aiTurn, mais chaque décision passe par la recherche (UCT par défaut, ou
// évaluation plate appariée avec opt.flat)
function aiTurnMCTS(G,s,W,opt){
  const fn=opt&&opt.flat?aiFlatMC:aiMCTS;
  for(let n=0;n<80&&!G.over&&G.cur===s;n++){
    const m=fn(G,s,W,opt),r=act(G,s,m);
    if(!r.ok){act(G,s,{t:'end'});break}
    if(m.t==='end')break}
  if(!G.over&&G.cur===s)act(G,s,{t:'end'})}
