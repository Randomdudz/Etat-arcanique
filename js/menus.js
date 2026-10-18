// ============ UI : menus (jouer, boutique, collection, decks, amis, code) ============
var CUR='play';let DECKI=null,FR_T=0,CT='cards',SETOPEN=false;
// filtres : q (recherche), t/r/cost = un choix parmi ceux cochés (OU), fac/aff/kw = tous ceux cochés (ET), own = possédées, sort = tri
const CF={q:'',t:[],r:[],cost:[],fac:[],aff:[],kw:[],own:false,sort:'cost'},DF={q:'',t:[],r:[],cost:[],fac:[],aff:[],kw:[],own:true,sort:'cost'};
const TABS=[['play','Jouer','play'],['shop','Boutique','shop'],['coll','Collection','coll'],['decks','Decks','decks'],['friends','Amis','friends'],['acct','Compte','acct'],['code','Code','code']];
const TABART={play:'png/nav-play.png',shop:'png/nav-shop.png',coll:'png/nav-collection.png',decks:'png/nav-decks.png',friends:'png/nav-friends.png',acct:'png/nav-account.png',code:'png/nav-code.png'};
const THUE={play:['#d9a24e','#24170a'],shop:['#2f8fe0','#fff'],coll:['#2f8fe0','#fff'],decks:['#2f8fe0','#fff'],friends:['#d6409a','#fff'],acct:['#8a72e0','#fff'],code:['#3fae7a','#fff']};
function refreshTop(){const g=$('#gemn');if(g)g.textContent=S.gems;const n=$('#pname');if(n)n.textContent=S.name||'';
  const c=$('#accb');if(c){c.textContent=ACC?(ACC_ST==='err'?'⚠️':ACC_ST==='sync'?'⏳':'☁️'):'';c.title=ACC?'Compte '+ACC.id+' · '+accStTxt():'';c.hidden=!ACC}}
function ph(icon,title,right){const art=icon==='💎'?'png/diamond.png':icon==='arena'?'png/arena.png':null;
  return h('h3',null,h('span',{class:'pi'},art?h('img',{class:'panel-art',src:art,alt:''}):ICONS[icon]?ico(icon):icon),title,right?h('span',{class:'phr',style:'margin-left:auto;font-size:13px;font-weight:700'},right):null)}
function go(t){
  CUR=t;hideTip();hideHoverCard();clearInterval(FR_T);if(t!=='decks')DECKI=null;
  const nav=$('#nav');nav.innerHTML='';
  const nt=t==='arena'?'play':t;
  TABS.forEach(x=>nav.append(h('button',{class:x[0]===nt?'on':'',style:'--h:'+THUE[x[0]][0]+';--ht:'+THUE[x[0]][1],onclick:()=>go(x[0])},
    h('span',{class:'ni'},TABART[x[0]]?h('img',{class:'nav-art',src:TABART[x[0]],alt:''}):ico(x[2])),h('span',{class:'nl'},x[1]))));
  const v=$('#view');v.innerHTML='';v.scrollTop=0;v.dataset.t=t;
  ({play:vPlay,arena:vArena,shop:vShop,coll:vColl,decks:vDecks,friends:vFriends,acct:vAcct,code:vCode})[t](v);refreshTop()}
function gotoGuide(sec){CT=sec;go('coll')}

// ---------- JOUER ----------
const OPTI={tim:'⏳',hp:'❤️',cap:'🔷',hand:'🃏',inc:'🪙',ter:'⛰️',evt:'🌀',comp:'✨',rw:'🎁'};       // icônes des réglages du duel
function settingsPanel(){
  const summ=OPTSET.filter(g=>S.opt[g.k]!==OPTDEF[g.k]).length;
  const box=h('div',{class:'panel v-settings'},ph('gear','Réglages du duel',h('button',{class:'btn sm',onclick:()=>{SETOPEN=!SETOPEN;go('play')}},SETOPEN?'Masquer':'Modifier'+(summ?' ('+summ+')':''))),
    h('div',{class:'sm mut'},'S’appliquent à ton prochain duel (IA ou défi lancé à un ami).'),
    SETOPEN?null:h('div',{class:'sm setchips',style:'margin-top:8px;line-height:1.5'},OPTSET.map(g=>{const x=g.v.find(y=>y[0]===S.opt[g.k]);return h('span',{class:'chip',style:'cursor:default;margin:2px 4px 2px 0;padding:2px 9px;font-size:12px'},OPTI[g.k]?h('i',null,OPTI[g.k]):null,g.n.split(' (')[0].replace(' en 💎','')+(g.k==='rw'?' en 💎':'')+' : '+(x?x[1]:'?'))})));
  if(SETOPEN){
    OPTSET.forEach(g=>{
      box.append(h('div',{class:'setgrp'},h('b',null,g.n),h('div',{class:'row'},g.v.map(([val,lab])=>
        h('span',{class:'chip'+(S.opt[g.k]===val?' on':''),onclick:()=>{S.opt[g.k]=val;saveS();go('play')}},(S.opt[g.k]===val?'☑ ':'☐ ')+lab)))))});
    box.append(h('button',{class:'btn sm',style:'margin-top:6px',onclick:()=>{S.opt=Object.assign({},OPTDEF);saveS();go('play')}},'Réglages par défaut'))}
  return box}
function deckFacs(d){const c={};d.cards.forEach(e=>{const k=e.replace('*','');if(CARDS[k])for(const f of (CARDS[k].fac||[]))c[f]=(c[f]||0)+1});return Object.keys(c).sort((a,b)=>c[b]-c[a]).map(f=>[f,c[f]])}
function facDots(d,n){return h('span',{class:'fdots'},deckFacs(d).slice(0,n||4).map(([f,c])=>h('span',{class:'fdot',title:FAC[f].n+' ×'+c,style:'--fc:'+FAC[f].c},famBadge(f),String(c))))}
function deckPicker(onPick){
  const ok=S.decks.map(d=>deckCheck(d));
  return h('div',{class:'deckchips'},S.decks.map((d,i)=>h('div',{class:'dchip'+(S.sel===i?' on':'')+(ok[i].ok?'':' bad'),onclick:()=>{S.sel=i;saveS();onPick(i)}},
    h('b',null,d.name),h('small',null,ok[i].ok?'Prêt · '+ECON.deck+' cartes':ok[i].err),h('div',{style:'margin-top:4px;min-height:20px'},facDots(d,3)))))}
// choix du deck, au moment de lancer un duel ou un défi (ou d'en accepter un)
function deckStep(title,sub,onPick,onBack){
  const ok=S.decks.map(d=>deckCheck(d));
  return h('div',null,h('h2',null,title),sub?h('p',{class:'mut sm',style:'margin:0 0 10px'},sub):null,
    S.decks.length?h('div',{class:'deckchips wrap'},S.decks.map((d,i)=>h('div',{class:'dchip'+(S.sel===i?' on':'')+(ok[i].ok?'':' bad'),onclick:()=>{if(!ok[i].ok){toast('Deck invalide : '+ok[i].err);return}S.sel=i;saveS();onPick(i)}},
      h('b',null,d.name),h('small',null,ok[i].ok?'Prêt · '+ECON.deck+' cartes':ok[i].err),h('div',{style:'margin-top:4px;min-height:20px'},facDots(d,3))))):h('p',{class:'mut'},'Aucun deck : crée-en un dans l’onglet Decks.'),
    h('div',{class:'row',style:'justify-content:space-between;margin-top:14px'},h('button',{class:'btn sm',onclick:()=>{closeModal();go('decks')}},'Gérer mes decks'),h('button',{class:'btn',onclick:onBack||closeModal},onBack?'Retour':'Annuler')))}
function pickDeckModal(title,sub,onPick){modal(deckStep(title,sub,i=>{closeModal();onPick(i)}))}
function vPlay(v){
  const anyOk=S.decks.some(d=>deckCheck(d).ok);
  v.append(h('div',{class:'cols'},
    h('div',null,
      h('div',{class:'panel hl v-ia'},ph('play','Duel contre l’IA'),
        h('p',{class:'mut sm',style:'margin:0 0 12px'},'L’IA construit son deck avec des cartes de ton niveau de collection, autour d’une famille. Gagne des 💎 pour ouvrir des boosters. Tu choisis ton deck juste après avoir cliqué sur Jouer.'),
        h('button',{class:'btn gold big'+(anyOk?' art-button':''),disabled:!anyOk,onclick:()=>pickDeckModal('Choisis ton deck','Ton adversaire ne saura jamais lequel tu as pris.',i=>startAIDuel(i))},
          anyOk?h('img',{class:'button-art',src:'png/play-button.png',alt:'Jouer'}):'Crée d’abord un deck valide')),
      arenaPanel(),
      settingsPanel()),
    h('div',null,
      h('div',{class:'panel v-friend'},ph('friends','Défier un ami'),
        h('p',{class:'mut sm',style:'margin:0 0 12px'},'Ajoute un ami avec son code, puis lance-lui un défi en ligne. Vous devez être connectés tous les deux.'),
        h('button',{class:'btn gold art-button',onclick:()=>go('friends')},h('img',{class:'button-art',src:'png/friends-button.png',alt:'Ouvrir mes amis'}))),
      duelQueuePanel(),
      h('div',{class:'panel v-guide'},ph('guide','Tout savoir avant de jouer'),
        h('p',{class:'mut sm',style:'margin:0 0 10px'},'Terrains, familles, mots-clés et règles : toutes les infos sont dans la Collection.'),
        h('div',{class:'row'},[['terr','🏟 Terrains'],['fam','🧬 Familles'],['kw','📖 Mots-clés'],['rules','📜 Règles']].map(([s,l])=>h('button',{class:'btn sm g-'+s,onclick:()=>gotoGuide(s)},l)))),
      h('div',{class:'panel v-gain'},ph('💎','Gains du jour',S.daily.earned+' / '+ECON.cap),
        h('div',{class:'bar',style:'margin:2px 0 10px'},h('i',{style:'width:'+Math.min(100,S.daily.earned/ECON.cap*100)+'%'})),
        h('div',{class:'row',style:'justify-content:space-between'},h('span',{class:'sm mut'},'💎 Victoire +'+ECON.win+' · Défaite +'+ECON.loss+' · 1re victoire du jour +'+ECON.first),h('b',{class:'sm vstat',title:'Victoires et défaites'},S.stats.w+' V · '+S.stats.l+' D'))))));duelQueueRender()}
// Arène : draft, remplacements partiels, duels contre l'IA et matchmaking
function arenaPanel(){const r=S.arena&&S.arena.run;
  return h('div',{class:'panel v-arenap'},ph('arena','Arène',r?r.w+' V · '+r.l+' D':h('span',{class:'arena-cost'},ARENA.cost,h('img',{class:'arena-gem',src:'png/diamond.png',alt:'diamants'}))),
    h('p',{class:'mut sm',style:'margin:0 0 12px'},r?(r.swap?(r.swap.stage==='remove'?'Choisis les '+ARENA.redraft+' cartes à remplacer.':'Choisis '+ARENA.redraft+' remplaçantes avant de sélectionner les cartes à remplacer.'):r.picks.length<ARENA.picks?'Ton draft initial : '+r.picks.length+' / '+ARENA.picks+' cartes choisies.':'Ton deck d’Arène est prêt : défie l’IA au palier '+Math.min(ARENA.maxW,r.w+1)+' ou cherche un joueur.'):
      'Draft de 30 cartes, puis affronte l’IA ou cherche un joueur avec le matchmaking. 9 paliers, jusqu’à '+ARENA.rw[ARENA.maxW]+' 💎 à gagner.'),
    h('button',{class:'btn gold'+(!r?' art-button':''),onclick:()=>go('arena')},r?(r.swap||r.picks.length<ARENA.picks?'Continuer':'Ouvrir l’Arène'):h('img',{class:'button-art',src:'png/arena-button.png',alt:"Découvrir l’Arène"})))}
function rulesNodes(){
  const li=(t,d)=>h('div',{style:'margin:10px 0;line-height:1.45'},h('b',{class:'gold'},t+' '),d);
  return[
    li('But :','réduis les PV du héros adverse à 0.'),
    li('Decks :',ECON.deck+' cartes, 2 exemplaires maximum par carte (1 seul pour les légendaires). Chaque personnage existe en 3 versions : commune, rare et légendaire.'),
    li('Mulligan :','au début du duel, tu vois ta main de départ : clique sur les cartes que tu veux remplacer, puis valide. Elles retournent dans ton deck et tu en pioches autant de nouvelles. Le second joueur reçoit la Pièce juste après.'),
    li('Démoflux ◆ :','ta ressource. +1 maximum à chaque tour (jusqu’à '+OPTDEF.cap+'). Ce que tu ne dépenses pas est perdu à la fin du tour. Certaines cartes en donnent en plus pour le tour, même au-delà de '+OPTDEF.cap+'.'),
    li('Jouer :','glisse une carte de ta main sur un emplacement libre de ton plateau (6 emplacements). Glisse une de tes créatures sur un ennemi pour attaquer (ou clique, puis clique sur la cible) : ses stats affichent les bonus de cette attaque. Espace / Entrée : fin du tour. Échap : menu (abandon).'),
    li('Placement :','une créature reste sur la case où tu la poses, et un terrain là où tu l’achètes : choisis bien leur emplacement.'),
    li('Cimetière ✝ :','les sorts joués, les créatures détruites et les cartes défaussées ou brûlées (main pleine) vont toutes au cimetière, affiché à côté de ton deck (clique dessus pour le voir). Quand ton deck est vide, ton cimetière est mélangé pour former un nouveau deck. Les cartes Bannies et les jetons disparaissent.'),
    li('Familles :','chaque créature appartient à une, deux ou trois familles (certaines à aucune). Leurs bonus s’activent dès 2 créatures de la même famille sur ton plateau, et la plupart grandissent avec chaque membre en plus. La barre au-dessus de ton héros montre les familles en jeu.'),
    li('Terrains 🏟 :','la zone du milieu propose 2 terrains ; tous les 2 tours, le plus ancien est remplacé. Achète-les avec ton Or 🪙 (+'+OPTDEF.inc+' par tour), autant que tu peux en payer, et pose-les sur 1 à 3 de tes cases. Le bouton 🎲 à gauche des terrains relance la boutique (2 nouveaux terrains) pour 2 Or. Chaque créature posée dessus profite de son effet selon son affinité avec le jeu (les points à côté des logos des jeux sur la carte : 0, 1 ou 2). WoW, Dofus, LoL et CS sont des terrains de jeu ; les terrains neutres 🌀 profitent à tout le monde.'),
    li('Second joueur :','commence avec une carte de plus, la Pièce (+1 Démoflux, donnée après le mulligan), '+COMP.or+' Or et '+COMP.hp+' PV de plus ('+(OPTDEF.hp+COMP.hp)+' au lieu de '+OPTDEF.hp+' par défaut). En Arène, le second joueur ne reçoit pas les '+COMP.hp+' PV bonus (la Pièce et l’Or restent).'),
    li('VIP 😎 :','« beau gosse » : une créature VIP ne peut être attaquée que s’il ne reste que des VIP parmi les créatures attaquables de son plateau (les créatures AFK ou à l’étranger ne la protègent pas). Les sorts et effets peuvent toujours la viser.'),
    li('Désorienté 💫 :','quand une créature Désorientée attaque, sa cible est tirée au hasard parmi tous les ennemis (héros compris), sans tenir compte des protections de ciblage ; la taxe de Maki s’applique toujours.'),
    li('Invocations :','une créature invoquée par un effet arrive sur la case libre la plus à droite de ton plateau, et son Cri d’arrivée se déclenche (avec une cible au hasard).'),
    li('Sorts :','un sort qui vise un ennemi peut aussi viser une de tes créatures, si tu le choisis.'),
    li('Cleave 🪓 :','une créature avec Cleave X qui attaque une créature inflige aussi X dégâts aux créatures à côté de sa cible.'),
    li('Artefacts :','objets permanents posés dans ta zone d’artefacts, à droite du plateau (les Dofus légendaires de Gobi, par exemple).'),
    li('Terrains de jeu :','les terrains WoW, Dofus, LoL et CS sont des terrains de jeu ; les autres sont neutres. Certaines cartes réagissent selon qu’elles sont posées sur un terrain de jeu ou non.'),
    li('Tilt 😡 :','quand une créature avec Tilt subit des dégâts et survit, son effet « Tilt : … » se déclenche. Chaque carte a le sien : missile, Rempart, Venin sur tous les ennemis, Plebs, dégâts au héros…'),
    li('Fiche détaillée :','clic droit sur n’importe quelle carte, créature, terrain ou famille pour afficher sa fiche complète, épinglée tant que tu ne la fermes pas.'),
    li('Effets en combat :','sur le plateau, les états importants se voient sur la carte : Égide = reflet de verre, Rempart = cadre de bouclier, Tilt = brume rouge (plus forte une fois déclenché), AFK = carte grisée (inciblable tant qu’elle n’a pas attaqué), Venin subi = teinte verte, Bloquée = givre. Une case couverte par un terrain prend la couleur de ce terrain.'),
    li('Historique :','chaque ligne montre qui a fait quoi : la carte, le terrain ou la famille qui a causé l’effet, puis la cible. Survole une pastille pour voir la fiche, clic droit pour l’épingler.'),
    li('Échanges :','dans l’onglet Amis, « ⇄ Échanger » propose un échange à un ami connecté. Chacun choisit UNE carte à donner ; vous voyez tous les deux les deux cartes avant de valider, et l’échange n’a lieu que si les deux valident la même paire. Changer de carte annule les validations.'),
    li('Chrono :','tu as '+OPTDEF.tim+' secondes par tour (réglable). À la fin du temps, ton tour passe tout seul.'),
    li('Boosters :','gagne des 💎 en duel, ouvre des boosters de '+ECON.pack+' cartes en boutique.'),
    li('Duel en ligne 🌐 :','le matchmaking te trouve un adversaire humain qui cherche aussi une partie normale, en réglages standard (30 PV, 80 s par tour) avec les récompenses habituelles. 5 minutes de recherche maximum. La file nécessite un compte Firebase en ligne et les règles Firestore indiquées dans cloud-config.js.'),
    li('Arène ⚔ :','entrée '+ARENA.cost+' 💎. Draft de '+ARENA.picks+' cartes (1 parmi 3 à chaque choix, mêmes chances pour tout le monde, sans limite d’exemplaires), puis affronte l’IA ou cherche un humain avec le matchmaking (5 minutes max). La file nécessite un compte Firebase en ligne et les règles Firestore indiquées dans cloud-config.js. Le classement hebdomadaire affiche les meilleurs joueurs et leurs victoires contre l’IA et contre des humains ; un compte en ligne est nécessaire pour y figurer. L’IA joue son meilleur deck possible (toutes raretés) dès le premier palier. La course s’arrête à '+ARENA.maxW+' victoires ou '+ARENA.maxL+' défaites ; après une défaite non éliminatoire, choisis d’abord '+ARENA.redraft+' nouvelles cartes, puis les cartes de ton deck qu’elles remplaceront. Récompense : de '+ARENA.rw[0]+' à '+ARENA.rw[ARENA.maxW]+' 💎 selon tes victoires. Une partie quittée avant la fin compte comme une défaite.')] }
function howto(){
  modal(h('div',null,h('h2',null,'Comment jouer'),...rulesNodes(),
    h('div',{class:'row',style:'justify-content:flex-end;margin-top:12px'},h('button',{class:'btn pri',style:'--h:#73b0ad;--ht:#241e17',onclick:closeModal},'Compris'))))}

// ---------- BOUTIQUE ----------
function oddsRow(odds){return h('div',{class:'odds'},odds.map((p,i)=>p?h('span',{style:'color:'+RCOL[i]},RAR[i]+' '+p+'%'):null))}
function packEl(){return h('div',{class:'pk'},h('div',{class:'pl'},h('b',null,'✦'),h('span',null,'L’ÉTAT',h('br'),'ARCANIQUE')),h('span',{class:'x5'},'×'+ECON.pack))}
function vShop(v){
  const b1=ECON.booster,b3=ECON.booster*ECON.bulk;
  v.append(
    h('div',{class:'panel'},ph('💎','Gains du jour',S.daily.earned+' / '+ECON.cap),
      h('div',{class:'bar',style:'margin:2px 0 6px'},h('i',{style:'width:'+Math.min(100,S.daily.earned/ECON.cap*100)+'%'})),
      h('div',{class:'sm mut'},'Les 💎 s’obtiennent en duel (victoire +'+ECON.win+', défaite +'+ECON.loss+', 1re victoire du jour +'+ECON.first+'). Au-delà du plafond de '+ECON.cap+' par jour, tu ne gagnes plus rien jusqu’à demain.')),
    h('div',{class:'packs'},
      h('div',{class:'pkc'},h('h3',null,'Booster Arcanique'),packEl(),
        h('div',{class:'mut sm'},ECON.pack+' cartes par booster · chances par carte :'),oddsRow(ECON.odds),
        h('div',{class:'buyrow'},
          h('button',{class:'btn blue tip',disabled:S.gems<b1,onclick:()=>openPacks(1)},'1 booster',h('small',null,b1+' 💎')),
          h('button',{class:'btn gold tip',disabled:S.gems<b3,onclick:()=>openPacks(ECON.bulk)},ECON.bulk+' boosters',h('small',null,b3+' 💎 · au moins 1 Rare garantie'))),
        h('div',{class:'sm mut',style:'margin-top:10px'},'♻ Doublons : au-delà de '+RECY.keep+' exemplaires, recycle-les dans ta Collection (commune '+RECY.v[1]+' 💎, rare '+RECY.v[2]+' 💎, légendaire '+RECY.v[3]+' 💎).'))))}

// ouverture animée : le paquet s'ouvre, les cartes sortent une par une
async function openPacks(n){
  const packs=buyBoosters(n);if(!packs){toast('Pas assez de 💎');return}
  refreshTop();
  const ov=h('div',{id:'packov'});document.body.append(ov);
  let skip=false;
  for(let b=0;b<packs.length&&!skip;b++)skip=await revealPack(ov,packs[b],b,packs.length);
  lootScreen(ov,packs.flat(),n)}
function revealPack(ov,pack,idx,total){
  return new Promise(async resolve=>{
    ov.innerHTML='';let stop=false,tapRes=null;
    const waitTap=()=>new Promise(r=>{tapRes=r});
    const doTap=()=>{if(tapRes){const r=tapRes;tapRes=null;r()}};
    const skipAll=()=>{stop=true;doTap()};
    const pk=h('div',{class:'pk idle'},h('div',{class:'pl'},h('b',null,'✦'),h('span',null,'L’ÉTAT',h('br'),'ARCANIQUE')),h('span',{class:'x5'},'×'+pack.length));
    const top=h('div',{class:'top'}),beam=h('div',{class:'beam'}),glow=h('div',{class:'glow'});
    const pcard=h('div',{class:'pcard'});
    const stage=h('div',{class:'stage'},glow,pk,top,beam,pcard);
    const slots=h('div',{class:'pslots'},pack.map(()=>h('i')));
    const msg=h('div',{class:'pmsg mut'},'Clique sur le booster pour l’ouvrir');
    const btns=h('div',{class:'row',style:'justify-content:center;min-height:46px'});
    ov.append(h('div',{class:'mut sm',style:'min-height:18px'},total>1?'Booster '+(idx+1)+' sur '+total:''),stage,slots,msg,btns);
    stage.onclick=doTap;
    btns.append(h('button',{class:'btn sm',onclick:skipAll},'Tout révéler'));
    await Promise.race([waitTap(),sleep(5000)]);if(stop)return resolve(true);
    msg.textContent='';
    pk.classList.remove('idle');pk.classList.add('shake');await sleep(760);
    pk.classList.remove('shake');top.classList.add('fly');beam.classList.add('on');await sleep(380);
    pk.classList.add('open');
    for(let i=0;i<pack.length;i++){
      if(stop)return resolve(true);
      const c=pack[i],cd=CARDS[c.k],gc=RCOL[c.rar],big=c.rar>=3;
      slots.children[i].classList.add('cur');
      const front=h('div',{class:'fr'},cardEl(c.k,{big:true,tilt:1})),back=h('div',null,backEl());
      pcard.className='pcard';pcard.replaceChildren(h('div',{class:'fl'},h('div',{class:'fi'},back,front)));
      stage.style.setProperty('--gc',gc);glow.classList.remove('on');
      stage.querySelectorAll('.newr').forEach(x=>x.remove());
      void pcard.offsetWidth;pcard.classList.add('up');await sleep(560);
      pcard.classList.add('rev');glow.classList.add('on');await sleep(420);
      if(big)for(let j=0;j<22;j++){const a=Math.random()*6.283,d=90+Math.random()*150;
        const sp=h('div',{class:'spark',style:'--dx:'+Math.cos(a)*d+'px;--dy:'+Math.sin(a)*d+'px;--gc:'+gc});stage.append(sp);setTimeout(()=>sp.remove(),1300)}
      if(c.isNew)stage.append(h('div',{class:'newr'},'NOUVELLE CARTE'));
      msg.innerHTML='';msg.append(h('b',{style:'color:'+RCOL[c.rar]+';font-size:17px'},fullName(cd)),h('br'),RAR[c.rar]+' · '+(cd.t==='c'?'Créature':'Sort')+' · tu en possèdes '+ownedN(c.k));
      const s=slots.children[i];s.classList.remove('cur');s.classList.add('f');s.style.setProperty('--rc',gc);s.append(miniAv(c.k));
      const last=i===pack.length-1;
      btns.replaceChildren(h('button',{class:'btn pri',style:'--h:#73b0ad;--ht:#241e17',onclick:doTap},last?(idx<total-1?'Booster suivant':'Voir le butin'):'Carte suivante'),h('button',{class:'btn sm',onclick:skipAll},'Tout révéler'));
      await waitTap();if(stop)return resolve(true);
      pcard.classList.remove('up');pcard.classList.add('out');await sleep(300)}
    resolve(false)})}
function lootScreen(ov,all,n){
  ov.innerHTML='';
  const sorted=all.slice().sort((a,b)=>b.rar-a.rar||CARDS[a.k].c-CARDS[b.k].c);
  const best=sorted[0],rare=all.filter(c=>c.rar>=2).length,nw=all.filter(c=>c.isNew).length;
  const price=ECON.booster;
  const byR=[3,2,1].map(r=>[r,all.filter(c=>c.rar===r).length]).filter(x=>x[1]);
  ov.classList.add('recap');
  ov.append(h('h2',{class:'rtitle'},'Récapitulatif : '+all.length+' cartes'),
    h('div',{class:'rsum'},byR.map(([r,n])=>h('span',{style:'--rc:'+RCOL[r]},RGEM[r]+' '+n+' '+RAR[r]+(n>1?'s':''))),h('span',null,'✦ '+nw+' nouvelle'+(nw>1?'s':'')),h('span',null,'Meilleure : '+fullName(best.k))),
    h('div',{class:'loot big'},h('div',{class:'rgrid'},sorted.map((c,i)=>
      h('div',{class:'rc r'+c.rar+(c.isNew?' isnew':''),style:'--i:'+i+';--rc:'+RCOL[c.rar],onclick:()=>showCard(c.k)},cardEl(c.k,{big:true,tilt:1}),c.isNew?h('span',{class:'nw'},'NOUVELLE'):null,
        h('span',{class:'rown'},'×'+ownedN(c.k)))))),
    h('div',{class:'mut sm'},'Survole une carte pour l’agrandir et lire ses mots-clés · clic : fiche détaillée'),
    h('div',{class:'row',style:'justify-content:center'},
      h('button',{class:'btn gold',disabled:S.gems<price*n,onclick:()=>{ov.remove();openPacks(n)}},'Encore '+(n>1?n+' boosters':'1 booster')+' ('+price*n+' 💎)'),
      h('button',{class:'btn pri',style:'--h:#73b0ad;--ht:#241e17',onclick:()=>{ov.remove();if(CUR==='shop')go('shop');refreshTop()}},'Fermer')))}

// ---------- FILTRES (collection et decks) ----------
const norm=t=>String(t||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
// mots-clés et mécaniques filtrables
const KWF=[['cry','Cri d’arrivée',cd=>!!cd.cry],['last','Agonie',cd=>!!cd.last],['turn','Début / fin de tour',cd=>!!(cd.sot||cd.eot)],['draw','Pioche',cd=>kwHas(cd,'draw')],
  ...KWORD.map(x=>[x,KWI[x][0],cd=>x==='cleave'?!!cd.cleave:(cd.kw||[]).indexOf(x)>=0])];
function cardFilter(F){const q=norm(F.q).trim(),A=x=>Array.isArray(x)?x:(x?[x]:[]);
  return k=>{const c=CARDS[k];
    if(A(F.t).length&&A(F.t).indexOf(c.t)<0)return false;                          // type, rareté, coût : l'un des choix (OU)
    if(A(F.r).length&&A(F.r).indexOf(c.r)<0)return false;
    if(A(F.cost).length&&!A(F.cost).some(v=>v>=7?c.c>=7:c.c===v))return false;
    if(!A(F.fac).every(f=>(c.fac||[]).indexOf(f)>=0||c.fam===f))return false;          // familles, affinités, mots-clés : tous (ET)
    if(!A(F.aff).every(g=>(c.t==='c'&&!c.tok&&((c.sc&&c.sc[g])||0)>=1)||c.gam===g))return false;
    if(!A(F.kw).every(x=>{const f=KWF.find(y=>y[0]===x);return f&&f[2](c)}))return false;
    if(F.own&&ownedN(k)<=0)return false;
    if(q&&norm(c.n+' '+(c.st||'')+' '+c.tx+' '+(c.fac||[]).concat(c.fam?[c.fam]:[]).map(f=>FAC[f].n).join(' ')+(c.gam?' '+GAMES[c.gam].n:'')).indexOf(q)<0)return false;
    return true}}
const FXK=['t','r','cost','fac','aff','kw'];
function filterCount(F){return FXK.reduce((n,k)=>n+(Array.isArray(F[k])?F[k].length:F[k]?1:0),0)+(F.q?1:0)}
function resetF(F,own){F.q='';FXK.forEach(k=>F[k]=[]);F.own=!!own}
// tri : coût (par défaut), ATK, PV, nom ou rareté
const SORTS=[['cost','Coût'],['atk','ATK'],['hp','PV'],['name','Nom'],['rar','Rareté']];
function sortFor(F){const by=F&&F.sort||'cost',st=(k,f)=>CARDS[k].t==='c'?CARDS[k][f]:-1;
  return(a,b)=>(by==='atk'?st(b,'a')-st(a,'a'):by==='hp'?st(b,'h')-st(a,'h'):by==='name'?fullName(a).localeCompare(fullName(b)):by==='rar'?CARDS[b].r-CARDS[a].r:0)||sortK(a,b)}
function mkFilters(F,opt,onChange){
  const box=h('div',{class:'fbar'});
  const q=h('input',{placeholder:'Rechercher un nom, un titre ou un effet…',value:F.q||'',autocomplete:'off'});
  q.addEventListener('input',()=>{F.q=q.value;onChange()});
  const draw=()=>{
    // chaque pastille : actif / inactif (2 états). Familles, affinités et mots-clés se cumulent (la carte doit tout avoir).
    const tog=(k,v)=>{const X=F[k]=Array.isArray(F[k])?F[k]:[],i=X.indexOf(v);if(i>=0)X.splice(i,1);else X.push(v);draw();onChange()};
    const on=(k,v)=>Array.isArray(F[k])&&F[k].indexOf(v)>=0?' on':'';
    const row=(lab,kids,hint)=>h('div',{class:'fr'},h('span',{class:'fl',title:hint||''},lab),kids);
    const extra=[];
    if(opt.own)extra.push(h('span',{class:'chip'+(F.own?' on':''),onclick:()=>{F.own=!F.own;draw();onChange()}},'Possédées seulement'));
    if(filterCount(F))extra.push(h('span',{class:'chip',onclick:()=>{resetF(F,F.own);q.value='';draw();onChange()}},'✕ Effacer les filtres'));
    box.replaceChildren(q,
      row('Type',[['c','Créatures'],['s','Sorts']].map(([v,l])=>h('span',{class:'chip'+on('t',v),onclick:()=>tog('t',v)},l)),'Un des choix cochés'),
      row('Rareté',[1,2,3].map(r=>h('span',{class:'chip'+on('r',r),style:on('r',r)?'':'color:'+RCOL[r],onclick:()=>tog('r',r)},RAR[r])),'Un des choix cochés'),
      row('Coût',[1,2,3,4,5,6,7].map(c=>h('span',{class:'chip cchip'+on('cost',c),onclick:()=>tog('cost',c)},c===7?'7+':String(c))),'Un des coûts cochés'),
      row('Famille',FACK.map(f=>h('span',{class:'chip fchip'+on('fac',f),style:'--fc:'+FAC[f].c,'data-tipf':f,onclick:()=>tog('fac',f)},FAC[f].ic,h('em',null,FAC[f].n))),'Toutes les familles cochées (ex. Toxic + Expats = les cartes qui ont les deux)'),
      row('Affinité',AFG.map(g=>h('span',{class:'chip achip'+on('aff',g),style:'--fc:'+GAMES[g].c,title:'Créatures qui ont une affinité avec '+GAMES[g].n,onclick:()=>tog('aff',g)},gi(g),h('em',null,GAMES[g].n))),'Toutes les affinités cochées'),
      row('Mots-clés',KWF.map(([x,l])=>h('span',{class:'chip kchip'+on('kw',x),onclick:()=>tog('kw',x),title:x==='draw'?'Cartes qui font piocher':defOf(l)||''},(KWI[x]?KWI[x][1]+' ':x==='draw'?'🂠 ':'')+l)),'Tous les mots-clés cochés'),
      row('Trier par',SORTS.map(([v,l])=>h('span',{class:'chip'+((F.sort||'cost')===v?' on':''),onclick:()=>{F.sort=v;draw();onChange()}},l))),
      ...(extra.length?[row('',extra)]:[]))};
  draw();return box}

// ---------- COLLECTION ----------
function vColl(v){
  const SEC=[['cards','Cartes','coll'],['terr','Terrains','terr'],['fam','Familles','friends'],['kw','Mots-clés','kw'],['rules','Règles','guide']];
  v.append(h('div',{class:'seg'},SEC.map(([k,l,i])=>h('button',{class:CT===k?'on':'',onclick:()=>{CT=k;go('coll')}},ico(i),l))));
  ({cards:cCards,terr:cTerr,fam:cFam,kw:cKw,rules:cRules})[CT](v)}
function sortK(a,b){return CARDS[a].c-CARDS[b].c||CARDS[a].r-CARDS[b].r||CARDS[a].n.localeCompare(CARDS[b].n)}
function cCards(v){
  const owned=POOL.filter(k=>ownedN(k)>0).length;
  const grid=h('div',{class:'cgrid'}),cnt=h('b',{class:'count'});
  const draw=()=>{
    const list=POOL.filter(cardFilter(CF)).sort(sortFor(CF));
    cnt.textContent=list.length+' carte'+(list.length>1?'s':'');untilt();grid.replaceChildren();
    if(!list.length){grid._gen=(grid._gen||0)+1;grid.append(h('div',{class:'mut'},'Aucune carte ne correspond à ces filtres.'));return}
    fillGrid(grid,list,k=>{const n=ownedN(k);return h('div',{class:'cc2'+(n?'':' no'),'data-ck':k,onclick:()=>collModal(k)},cardEl(k,{tilt:1}),n?h('span',{class:'own'},'×'+n):null,
      n>RECY.keep?h('span',{class:'rcy',title:(n-RECY.keep)+' exemplaire'+(n-RECY.keep>1?'s':'')+' en trop : recyclable'+(n-RECY.keep>1?'s':'')+' (clic pour la fiche)'},'♻ '+(n-RECY.keep)):null)})};
  v.append(h('div',{class:'panel'},ph('coll','Collection',owned+' / '+POOL.length+' cartes'),mkFilters(CF,{own:true},draw),
    h('div',{style:'margin-top:8px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap'},rcyBtn(),cnt)),grid);draw()}
// recyclage : les exemplaires au-delà de 2 rapportent quelques 💎 (commune 1, rare 3, légendaire 10)
function rcyBtn(){const r=recycleSum(),b=h('button',{class:'btn sm',id:'rcyall',disabled:!r.n,title:'Tu gardes toujours '+RECY.keep+' exemplaires de chaque carte',onclick:recycleModal},
  r.n?'♻ Recycler les doublons ('+r.n+' carte'+(r.n>1?'s':'')+' → +'+r.g+' 💎)':'♻ Aucun doublon à recycler (au-delà de '+RECY.keep+' exemplaires)');return b}
function rcyRefresh(k){const b=$('#rcyall');if(b)b.replaceWith(rcyBtn());const el=k&&$('.cc2[data-ck="'+k+'"]');if(!el)return;const n=ownedN(k),o=el.querySelector('.own'),r=el.querySelector('.rcy');
  if(o)o.textContent='×'+n;if(r){if(n>RECY.keep)r.textContent='♻ '+(n-RECY.keep);else r.remove()}}
function recycleModal(){const r=recycleSum();if(!r.n){toast('Aucun doublon à recycler.');return}
  ask('♻ Recycler les doublons ?',h('div',null,h('p',{class:'mut'},'Tu gardes '+RECY.keep+' exemplaires de chaque carte : tes decks ne changent pas. Les '+r.n+' exemplaire'+(r.n>1?'s':'')+' en trop rapporte'+(r.n>1?'nt':'')+' '+r.g+' 💎.'),
      h('p',{class:'sm mut'},'Par exemplaire : commune '+RECY.v[1]+' 💎 · rare '+RECY.v[2]+' 💎 · légendaire '+RECY.v[3]+' 💎.')),
    [{t:'Annuler'},{t:'♻ Recycler (+'+r.g+' 💎)',c:'gold',f:()=>{const x=recycleAll();refreshTop();toast('♻ '+x.n+' exemplaire'+(x.n>1?'s':'')+' recyclé'+(x.n>1?'s':'')+' : +'+x.g+' 💎');go('coll')}}])}
function collModal(k){
  const n=ownedN(k),x=extraN(k),v=recycleVal(k);
  const done=g=>{refreshTop();rcyRefresh(k);toast('♻ Recyclé : +'+g+' 💎');closeModal();collModal(k)};
  const box=showCard(k,{plain:true,coll:true,extra:h('div',{class:'panel',style:'margin-top:10px'},
    h('div',null,h('b',null,'Exemplaires : '),n?String(n):'aucun'),
    n?null:h('div',{class:'sm mut',style:'margin-top:4px'},'Ouvre des boosters ou échange avec un ami pour l’obtenir.'),
    x?h('div',{class:'row',style:'margin-top:8px;gap:8px;flex-wrap:wrap'},
      h('button',{class:'btn sm',onclick:()=>done(recycleCard(k,1))},'♻ Recycler 1 exemplaire (+'+v+' 💎)'),
      x>1?h('button',{class:'btn sm',onclick:()=>done(recycleCard(k,x))},'♻ Recycler les '+x+' en trop (+'+x*v+' 💎)'):null)
     :n?h('div',{class:'sm mut',style:'margin-top:4px'},'♻ Au-delà de '+RECY.keep+' exemplaires, chaque carte en trop se recycle contre '+v+' 💎.'):null)});
  return box}
// terrains : toutes les infos avant le duel
function cTerr(v){
  v.append(h('div',{class:'panel hl'},ph('🏟','Les terrains'),
    h('div',{style:'line-height:1.5;font-size:14.5px'},
      'Pendant un duel, la zone du milieu propose ',h('b',null,'2 terrains'),'. ',h('b',{style:'color:#cab095'},'Tous les 2 tours, le plus ancien est remplacé'),' par un nouveau tiré dans la pioche commune ; si tu en achètes un, il est aussi remplacé tout de suite. Tu l’achètes avec ton ',h('b',null,'Or 🪙'),' et tu le poses sur ',h('b',null,'1 à 3 cases'),' de ton plateau (le dernier terrain posé remplace les cases qu’il recouvre).'),
    h('div',{style:'line-height:1.5;font-size:14.5px;margin-top:8px'},'Chaque créature a une ',h('b',null,'affinité'),' de 0 à 2 avec chaque jeu (les points à côté de ',AFG.map(g=>[gi(g),' ']),'sur sa carte). Sur un terrain de ce jeu, elle reçoit l’effet « affinité 1 » ou « affinité 2 » ; à 0, rien. WoW, Dofus, LoL et CS sont des terrains de jeu ; les terrains ',h('b',{style:'color:'+GAMES.bazar.c},'neutres 🌀'),' profitent à toutes les créatures.')));
  const grid=h('div',{class:'ggrid'});
  GK.forEach(g=>{
    const G=GAMES[g],ts=TDEF.filter(t=>t.g===g);
    const b2=BASEK.filter(b=>(BASES[b].sc[g]||0)>=2),b1=BASEK.filter(b=>(BASES[b].sc[g]||0)===1);
    grid.append(h('div',{class:'gcard',style:'--gc:'+G.c},
      h('div',{class:'gh'},h('div',{class:'gi'},gi(g)),h('div',null,h('b',null,g==='bazar'?'Terrains neutres':'Terrains '+G.n),h('small',null,ts.length+' terrains'+(g==='bazar'?' · neutres':' · '+b2.length+' personnages d’affinité 2, '+b1.length+' d’affinité 1')))),
      h('div',{class:'tlist'},ts.map(t=>h('div',{class:'trow',style:'--gc:'+G.c},h('div',{class:'tic'},t.img?h('img',{class:'tthumb',src:t.img,alt:'',draggable:'false'}):gi(g)),h('b',null,t.n),szEl(t.size),h('span',{class:'pr'},t.uniq?({blizzard:'Kirua',gbazar:'Potatoll',eco:'Coco'}[t.d]||'unique'):'🪙'+t.cost),
        h('div',{class:'tx'},g==='bazar'?t.tn:[h('b',null,'Aff. 1 : '),t.t1,' ',h('b',null,'Aff. 2 : '),t.t2])))),
      g==='bazar'?h('div',{class:'sm',style:'margin-top:8px;color:#dcc38d'},'Terrains uniques : le Blizzard (Kirua, reine des neiges), Le Grand Bazaar (Potatoll, fou du Bazar) et l’Éco village (Coco, communauté autosuffisante) ne sont pas en boutique : la carte les pose elle-même.'):
      [h('div',{class:'sm',style:'margin:10px 0 2px;font-weight:700'},'Affinité 2 :'),h('div',{class:'members'},b2.length?b2.map(b=>baseEl(b)):h('span',{class:'mut sm'},'Personne.')),
       h('div',{class:'sm',style:'margin:8px 0 2px;font-weight:700'},'Affinité 1 :'),h('div',{class:'members'},b1.length?b1.map(b=>baseEl(b)):h('span',{class:'mut sm'},'Personne.')),
       g==='lol'?h('div',{class:'sm',style:'margin-top:8px;color:#dcc38d'},'Sur un terrain LoL, Lisdoon (Roro) attaque deux fois par tour ; Elkatrix (doux comme un agneau) double les effets des terrains LoL de ton camp.'):null,
       POOL.some(k=>CARDS[k].gam===g)?h('div',{class:'sm',style:'margin-top:8px'},h('b',null,'Sorts d’affinité : '),POOL.filter(k=>CARDS[k].gam===g).map(k=>memEl(k))):null]))});
  v.append(grid)}
function cFam(v){
  v.append(h('div',{class:'panel hl'},ph('🧬','Les familles'),
    h('div',{style:'line-height:1.5;font-size:14.5px'},'Chaque personnage appartient à une, deux ou trois familles (parfois aucune), et toutes ses versions aussi. Compte les créatures d’une même famille ',h('b',null,'sur ton plateau'),' : dès ',h('b',null,'2'),', le bonus s’active, et la plupart grandissent avec chaque membre supplémentaire. Pendant le duel, la barre au-dessus de ton héros affiche chaque famille et son bonus actuel, et chaque déclenchement est annoncé à l’écran.')));
  const grid=h('div',{class:'ggrid'});
  FACK.forEach(f=>{
    const F=FAC[f],mem=BASEK.filter(b=>BASES[b].fac.indexOf(f)>=0),nc=POOL.filter(k=>CARDS[k].t==='c'&&CARDS[k].fac.indexOf(f)>=0).length,sp=POOL.filter(k=>CARDS[k].fam===f);
    grid.append(h('div',{class:'gcard',style:'--gc:'+F.c},
      h('div',{class:'gh'},h('div',{class:'gi'},famIco(f)),h('div',null,h('b',null,F.n),h('small',null,F.d+' · '+mem.length+' personnages ('+nc+' cartes)'))),
      h('div',{class:'sm',style:'line-height:1.4'},F.sum),
      facTiers(f,0),h('div',{class:'members'},mem.map(b=>baseEl(b))),
      sp.length?h('div',{class:'sm',style:'margin-top:8px'},h('b',null,'Sorts de famille : '),sp.map(k=>memEl(k))):null))});
  v.append(grid)}
function cKw(v){
  v.append(h('div',{class:'panel hl'},ph('📖','Mots-clés'),h('div',{class:'kwrow'},
    Object.keys(KWI).map(k=>[h('b',null,h('span',{class:'kwi'},KWI[k][1]),KWI[k][0]),h('span',null,defOf(KWI[k][0])||'')]).flat())),
    h('div',{class:'panel'},ph('📜','Autres termes'),h('div',{class:'kwrow'},
      ['Cri d’arrivée','Agonie','Reset','missile','effet du Bazar','Mute','Bloque','Banni','Kick','Artefact','Cimetière','Défausser','Affinité','à l’étranger','Démoflux','Or','Terrain','terrain de jeu','terrain neutre','Invincible'].map(w=>[h('b',null,w==='Bloque'?'Bloquée':w==='Banni'?'Bannie':w==='missile'?'Missile':w==='à l’étranger'?'À l’étranger':w==='effet du Bazar'?'Effet du Bazar':w[0].toUpperCase()+w.slice(1)),h('span',null,defOf(w)||'')]).flat())))}
function cRules(v){v.append(h('div',{class:'panel hl'},ph('guide','Comment jouer'),...rulesNodes()))}

// ---------- DECKS ----------
function vDecks(v){
  if(DECKI!=null&&!S.decks[DECKI])DECKI=null;
  if(DECKI!=null)return vDeckEdit(v,DECKI);
  v.append(h('div',{class:'panel'},ph('decks','Mes decks',S.decks.length+' / '+ECON.decks),h('div',{class:'sm mut'},'Jusqu’à '+ECON.decks+' decks de '+ECON.deck+' cartes (2 exemplaires max, 1 pour les légendaires). Tu choisis ton deck au moment de jouer, et ton adversaire ne le voit pas.'),
    h('div',{class:'row',style:'margin-top:12px'},h('button',{class:'btn gline tip',onclick:()=>importDeckModal(null)},ico('upload'),' Importer un code de deck'),h('span',{class:'sm mut'},'Un ami t’a envoyé un code ? Colle-le : le deck se construit tout seul avec tes cartes.'))));
  const grid=h('div',{style:'display:grid;grid-template-columns:1fr 1fr;gap:14px'});
  S.decks.forEach((d,i)=>{
    const c=deckCheck(d),f0=deckFacs(d)[0],dc=f0?FAC[f0[0]].c:'#2f8fe0';
    grid.append(h('div',{class:'panel deckrow',style:'--dc:'+dc+';display:flex;gap:14px;align-items:center;cursor:pointer;margin:0',onclick:()=>{DECKI=i;go('decks')}},
      h('div',{class:'hav'},String(i+1)),
      h('div',{class:'pennant',title:f0?FAC[f0[0]].n:''},h('i',null,f0?famIco(f0[0]):'🃏')),
      h('div',{style:'flex:1;min-width:0'},h('b',{class:'dname'},d.name),h('div',{class:'sm mut'},d.cards.length+'/'+ECON.deck+' cartes'),h('div',{style:'margin-top:5px'},facDots(d,5))),
      h('span',{class:'vpill '+(c.ok?'ok':'ko')},c.ok?'✔ Valide':'✕ '+c.err),
      h('button',{class:'btn sm danger trash',title:'Supprimer ce deck',onclick:e=>{e.stopPropagation();ask('Supprimer « '+d.name+' » ?','Le deck est supprimé (tes cartes restent dans ta collection).',[{t:'Annuler'},{t:'Supprimer',c:'danger',f:()=>{
        S.decks.splice(i,1);if(S.sel>=S.decks.length)S.sel=Math.max(0,S.decks.length-1);else if(S.sel>i)S.sel--;saveS();go('decks')}}])}},ico('trash'))))});
  if(S.decks.length<ECON.decks)grid.append(h('div',{class:'panel newdeck',onclick:()=>{S.decks.push({name:'Deck '+(S.decks.length+1),cards:[]});saveS();DECKI=S.decks.length-1;go('decks')}},
    h('div',{class:'hav'},'+'),h('b',null,'Nouveau deck'),h('span',{class:'sm mut',style:'margin-left:auto;font-family:var(--disp);font-size:16px'},S.decks.length+' / '+ECON.decks)));
  v.append(grid)}
function deckAff(d){const t={};AFG.forEach(g=>t[g]=0);d.cards.forEach(e=>{const cd=CARDS[String(e).replace('*','')];if(cd&&cd.t==='c'&&cd.sc)AFG.forEach(g=>t[g]+=cd.sc[g]||0)});return t}
function affMini(k){const cd=CARDS[k];if(!cd||cd.t!=='c'||cd.tok)return null;
  return h('span',{class:'afm'},AFG.map(g=>{const a=(cd.sc&&cd.sc[g])||0;return a?h('i',{style:'--gc:'+GAMES[g].c,title:'Affinité '+GAMES[g].n+' : '+a},gi(g),a>1?h('b',null,'2'):null):null}))}
function vDeckEdit(v,di){
  const d=S.decks[di];
  const inp=h('input',{value:d.name,maxlength:16,style:'flex:1;font-weight:800;font-size:16px'});inp.addEventListener('change',()=>{d.name=inp.value.trim()||('Deck '+(di+1));saveS()});
  const left=h('div',{class:'panel hl dside'}),grid=h('div',{class:'cgrid',style:'grid-template-columns:repeat(auto-fill,minmax(132px,1fr))'}),cn=h('b',{class:'count'});
  const add=(k,anchor)=>{const cnt=deckCount(d),inDeck=cnt[k]||0,lim=Math.min(LIMIT(CARDS[k].r),ownedN(k));
    if(ownedN(k)<=0){toast('Tu ne possèdes pas cette carte.');return}if(inDeck>=lim){toast('Maximum atteint pour cette carte.');return}if(d.cards.length>=ECON.deck){toast('Deck complet ('+ECON.deck+' cartes).');return}
    if(CARDS[k].r===3&&deckKeys(d.cards).filter(x=>CARDS[x]&&CARDS[x].r===3).length>=LEGMAX){toast(LEGMAX+' légendaires au maximum par deck.');return}
    d.cards.push(k);saveS();refresh()};
  const rem=k=>{const i=d.cards.indexOf(k);if(i<0){toast('Cette carte n’est pas dans le deck.');return}d.cards.splice(i,1);saveS();refresh()};
  const drawLeft=()=>{
    const cnt=deckCount(d),chk=deckCheck(d),facs=deckFacs(d),aff=deckAff(d),y=left.scrollTop;
    const nLeg=deckKeys(d.cards).filter(x=>CARDS[x]&&CARDS[x].r===3).length;
    left.replaceChildren(...[h('div',{class:'row',style:'justify-content:space-between;margin-bottom:6px'},h('h3',{style:'margin:0'},'Deck : '+d.cards.length+' / '+ECON.deck),
        h('span',{class:'chip legc'+(nLeg>=LEGMAX?' full':''),title:'Légendaires dans le deck : '+LEGMAX+' au maximum',style:'cursor:default'},h('i',{style:'background:'+RCOL[3]}),'Légendaires '+nLeg+' / '+LEGMAX),
        h('span',{class:'chip',style:'cursor:default;'+(chk.ok?'color:#a4db99;border-color:#93c489':'color:#bc8c94;border-color:#c15c58')},chk.ok?'Valide':chk.err)),
      curve(d),
      facs.length?h('div',{class:'row',style:'margin-top:8px'},facs.map(([f,c])=>h('span',{class:'chip','data-tipf':f,style:'cursor:help;border-color:'+FAC[f].c+';background:'+FAC[f].c+'26;padding:3px 10px'},FAC[f].ic+' '+FAC[f].n+' ×'+c))):null,
      h('div',{class:'row affrow',style:'margin-top:6px'},AFG.map(g=>h('span',{class:'chip kw','data-t':'Affinité '+GAMES[g].n+' du deck','data-d':'Somme des affinités '+GAMES[g].n+' de tes créatures ('+aff[g]+'). '+defOf('Affinité'),style:'cursor:help;border-color:'+GAMES[g].c+';background:'+GAMES[g].c+'22;padding:3px 10px'},gi(g),' '+GAMES[g].n+' '+aff[g]))),
      h('div',{class:'row',style:'margin:10px 0'},
        h('button',{class:'btn sm',onclick:()=>autoModal(di)},'✨ Construire automatiquement'),
        h('button',{class:'btn sm gold',disabled:d.cards.length>=ECON.deck,title:d.cards.length>=ECON.deck?'Ton deck est déjà complet.':'L’IA complète ton deck autour de ce que tu coches',onclick:()=>completeModal(di)},'🧩 Compléter automatiquement')),
      h('div',{class:'row',style:'margin:-2px 0 10px'},
        h('button',{class:'btn sm',disabled:!d.cards.length,onclick:()=>shareDeckModal(di)},'📤 Code du deck'),
        h('button',{class:'btn sm',onclick:()=>importDeckModal(di)},'📥 Importer un code'),
        h('button',{class:'btn sm danger',onclick:()=>{d.cards=[];saveS();refresh()}},'Vider')),
      h('div',{class:'sm mut',style:'margin:0 0 6px'},'Survol : la carte · clic droit : en retirer une'),
      h('div',{class:'dlist',style:'grid-template-columns:1fr'},Object.keys(cnt).sort(sortK).map(k=>
        h('div',{class:'dl'+(CARDS[k].r===3?' leg':'')+(DKNEW&&DKNEW.indexOf(k)>=0?' added':''),'data-hk':k,style:'border-left:4px solid '+RCOL[CARDS[k].r],oncontextmenu:e=>{e.preventDefault();rem(k)}},h('span',{class:'dc'},CARDS[k].c),miniAv(k),
          h('span',{class:'dn',style:'color:'+RCOL[CARDS[k].r],onclick:()=>showCard(k)},RGEM[CARDS[k].r]+' '+fullName(k)),CARDS[k].r===3?legBadge():null,affMini(k),h('span',{class:'mut'},'×'+cnt[k]),
          h('button',{class:'btn sm',title:'Retirer un exemplaire',onclick:()=>rem(k)},'−')))),
      d.cards.length?null:h('div',{class:'mut sm'},'Deck vide : ajoute des cartes à droite (clic).')].filter(Boolean));
    left.scrollTop=y};
  // tuiles construites une fois puis réutilisées : un ajout ou un retrait ne change que leur état (grisée, dans le deck, compteur)
  const tiles=new Map();
  const setTile=(k,el,cnt)=>{const inDeck=cnt[k]||0,lim=Math.min(LIMIT(CARDS[k].r),ownedN(k)),t=inDeck+'/'+lim;
    el.classList.toggle('no',inDeck>=lim||d.cards.length>=ECON.deck);el.classList.toggle('indk',inDeck>0);if(el._own.textContent!==t)el._own.textContent=t};
  const tileOf=k=>{let el=tiles.get(k);
    if(!el){const own=h('span',{class:'own'});
      el=h('div',{class:'cc2',onclick:()=>add(k,left),oncontextmenu:e=>{e.preventDefault();e.stopPropagation();rem(k)}},
        cardEl(k,{tilt:1}),own,h('button',{class:'cinfo',title:'Fiche détaillée',onclick:e=>{e.stopPropagation();showCard(k)}},'ⓘ'));el._own=own;tiles.set(k,el)}
    setTile(k,el,deckCount(d));return el};
  const drawGrid=()=>{
    const list=POOL.filter(cardFilter(DF)).sort(sortFor(DF));
    cn.textContent=list.length+' carte'+(list.length>1?'s':'');untilt();grid.replaceChildren();
    if(!list.length){grid._gen=(grid._gen||0)+1;grid.append(h('div',{class:'mut'},'Aucune carte ne correspond à ces filtres.'));return}
    fillGrid(grid,list,tileOf)};
  const syncTiles=()=>{const cnt=deckCount(d);for(const [k,el] of tiles)if(el.isConnected)setTile(k,el,cnt)};
  const refresh=()=>{hideHoverCard();drawLeft();syncTiles()};
  const right=h('div',{class:'panel dmainc'},ph('coll','Ma collection'),h('div',{class:'sm mut',style:'margin:-6px 0 8px'},'Clic : ajouter · clic droit : retirer · ⓘ : fiche détaillée'),mkFilters(DF,{own:true},drawGrid),h('div',{style:'margin:8px 0 12px;text-align:right'},cn),grid);
  v.append(h('div',{class:'row',style:'margin-bottom:14px'},h('button',{class:'btn sm',onclick:()=>{DECKI=null;go('decks')}},'← Decks'),inp),
    h('div',{class:'dedit'},left,right));
  drawLeft();DKNEW=null;drawGrid()}
function curve(d){
  const c=Array(11).fill(0);d.cards.forEach(k=>c[Math.min(10,CARDS[k].c)]++);const m=Math.max(1,...c);
  return h('div',{style:'display:flex;gap:4px;align-items:flex-end;height:66px;margin-top:6px'},c.map((n,i)=>
    h('div',{style:'flex:1;text-align:center;font-size:11px;font-weight:700;color:#e3d9cc'},h('div',{style:'height:'+(n/m*38)+'px;background:linear-gradient(180deg,#bbd7df,#619fc2);border-radius:3px;min-height:'+(n?3:0)+'px'}),n||'',h('div',{style:'color:#9b9186'},i===10?'10':i))))}
const ARCHD={toxic:'Empile le Venin : chaque Toxic renforce les autres.',weebos:'Des créatures rapides et solides, protégées en groupe.',farmer:'Accumule l’Or et achète les meilleurs terrains.',
  expats:'Or, contrôle et voyages à l’étranger pour protéger tes pièces clés.',ravages:'Chaos, missiles aléatoires et effets du Bazar.',alien:'Soins, vol d’Or et gros bannissements.',
  xeno:'Créatures Tilt robustes qui punissent les Extraterritoriaux, puis toutes les créatures dès 3 Xénophobes.',rush:'Cartes bon marché, Hâte et dégâts directs : finir vite.',ctrl:'Retire les menaces, soigne, puis gagne avec les gros monstres.',vestige:'Les anciens du serveur : plus ils sont nombreux sur ton plateau, plus ils encaissent.',
  wow:'Créatures très affinées WoW, terrains WoW et sorts qui comptent ton affinité WoW.',dofus:'Affinité Dofus : pioche, Égide et créatures solides sur les terrains Dofus.',
  lol:'Affinité LoL : attaques surprises (Flash) et Smite sur les terrains LoL.',cs:'Affinité CS : Headshot, fumigènes et terrains CS.'};
function autoModal(di){
  const d=S.decks[di];
  modal(h('div',null,h('h2',null,'Construire automatiquement'),h('p',{class:'mut sm'},'Choisis un style : le deck est composé avec ce que tu possèdes.'),
    h('div',{class:'grid',style:'grid-template-columns:1fr 1fr'},ARCHK.map(a=>h('button',{class:'btn',style:'text-align:left;border-color:'+ARCH[a].c,onclick:()=>{
      d.cards=autoDeck(S.coll,a);if(/^Deck \d$/.test(d.name)||ARCHK.some(x=>ARCH[x].n===d.name))d.name=ARCH[a].n;saveS();closeModal();go('decks')}},
      h('b',null,ARCH[a].ic+' '+ARCH[a].n),h('div',{class:'sm mut',style:'font-weight:500'},ARCHD[a]||''))))))}

// ---------- COMPLÉTER UN DECK AUTOMATIQUEMENT ----------
// l'IA ajoute des cartes jusqu'à 30 sans toucher à celles déjà choisies, autour des familles, affinités et mots-clés cochés
let CPF={fac:[],aff:[],kw:[]},DKNEW=null;
function completeModal(di){
  const d=S.decks[di],box=h('div',{class:'cpbox'});
  const draw=()=>{const miss=ECON.deck-d.cards.length,nsel=CPF.fac.length+CPF.aff.length+CPF.kw.length;
    const chip=(grp,x,cls,lab,o)=>h('span',Object.assign({class:'chip '+cls+(CPF[grp].indexOf(x)>=0?' on':''),onclick:()=>{const a=CPF[grp],i=a.indexOf(x);if(i>=0)a.splice(i,1);else a.push(x);draw()}},o||{}),lab);
    box.replaceChildren(h('h2',null,'🧩 Compléter mon deck automatiquement'),
      h('p',{class:'mut sm'},'L’IA ajoute des cartes de ta collection jusqu’à '+ECON.deck+', sans toucher à celles déjà dans ton deck. Coche ce autour de quoi tu veux qu’elle construise ; si tu ne coches rien, elle suit les familles et le jeu que ton deck contient déjà. Elle garde une courbe de coût et une part de sorts équilibrées.'),
      h('div',{class:'cpsec'},h('b',null,'Familles'),h('div',{class:'row'},FACK.map(f=>chip('fac',f,'fchip',[FAC[f].ic,h('em',null,FAC[f].n)],{style:'--fc:'+FAC[f].c,'data-tipf':f})))),
      h('div',{class:'cpsec'},h('b',null,'Affinités'),h('div',{class:'row'},AFG.map(g=>chip('aff',g,'achip',[gi(g),h('em',null,GAMES[g].n)],{style:'--fc:'+GAMES[g].c,title:'Créatures très affinées '+GAMES[g].n+' et sorts '+GAMES[g].n})))),
      h('div',{class:'cpsec'},h('b',null,'Mots-clés'),h('div',{class:'row'},KWF.filter(([x])=>POOL.some(k=>kwHas(CARDS[k],x))).map(([x,l])=>chip('kw',x,'kchip',(KWI[x]?KWI[x][1]+' ':x==='draw'?'🂠 ':'')+l,{title:x==='draw'?'Cartes qui font piocher':defOf(l)||''})))),
      h('div',{class:'sm cpinfo'},miss>0?'Ton deck : '+d.cards.length+' / '+ECON.deck+' → '+miss+' carte'+(miss>1?'s':'')+' à ajouter'+(nsel?'.':', en suivant ce qu’il contient déjà.'):'Ton deck est déjà complet ('+ECON.deck+' cartes).'),
      h('div',{class:'row',style:'margin-top:14px;justify-content:flex-end'},
        nsel?h('button',{class:'btn sm',onclick:()=>{CPF={fac:[],aff:[],kw:[]};draw()}},'Tout décocher'):null,
        h('button',{class:'btn',onclick:closeModal},'Annuler'),
        h('button',{class:'btn gold',disabled:miss<=0,onclick:()=>{
          const n0=d.cards.length,res=completeDeck(S.coll,d.cards,CPF,1+Math.floor(Math.random()*233000)),added=res.slice(n0);   // un peu de variété d'une fois sur l'autre
          d.cards=res;saveS();closeModal();DKNEW=added;go('decks');
          toast(added.length?'✔ '+added.length+' carte'+(added.length>1?'s ajoutées':' ajoutée')+(res.length<ECON.deck?' : ta collection ne permet pas d’aller plus loin.':'.'):'Aucune carte de ta collection ne peut être ajoutée.')}},'🧩 Compléter le deck')))};
  draw();modal(box)}

// ---------- CODES DE DECK (copier-coller entre amis) ----------
function copyCode(t){const ok=()=>toast('✔ Code copié : colle-le à ton ami.'),ko=()=>{try{if(document.execCommand('copy'))return ok()}catch(e){}toast('Sélectionne le code puis Ctrl+C.')};
  try{navigator.clipboard.writeText(t).then(ok,ko)}catch(e){ko()}}
function shareDeckModal(di){
  const d=S.decks[di],code=deckCode(d),ta=h('textarea',{class:'acccode dcode',readonly:true});ta.value=code;
  modal(h('div',{style:'max-width:560px'},h('h2',null,'Partager « '+d.name+' »'),
    h('p',{class:'mut sm'},'Envoie ce code à un ami. Dans Decks → « Importer un code de deck », il le colle et le deck se construit avec ses propres cartes ; celles qui lui manquent peuvent être remplacées automatiquement.'),
    d.cards.length<ECON.deck?h('p',{class:'sm',style:'color:#c5af89'},'Ce deck n’a que '+d.cards.length+' cartes sur '+ECON.deck+' : il sera complété automatiquement chez ton ami.'):null,
    ta,h('div',{class:'row',style:'margin-top:12px;justify-content:flex-end'},
      h('button',{class:'btn',onclick:closeModal},'Fermer'),h('button',{class:'btn pri',onclick:()=>{ta.focus();ta.select();copyCode(code)}},'📋 Copier le code'))));
  setTimeout(()=>{ta.focus();ta.select()},40)}
// di : deck à remplacer (depuis l'éditeur) ou null (le joueur choisit l'emplacement)
function importDeckModal(di){
  let tgt=di!=null?di:S.decks.findIndex(d=>!d.cards.length);if(tgt<0)tgt=null;
  const ta=h('textarea',{class:'acccode dcode',placeholder:'Colle ici le code du deck (il commence par EAD1-)…'});
  const fill=h('input',{type:'checkbox',checked:true}),info=h('div',{class:'dimp'}),slots=h('div',{class:'row'});
  const run=()=>{const I=readDeckCode(ta.value);if(!I||tgt==null)return;const D=S.decks[tgt];
    const r=deckFromCode(I,S.coll,fill.checked);D.cards=r.cards;if(I.name)D.name=I.name;saveS();closeModal();DECKI=tgt;go('decks');
    const mk=Object.keys(r.miss),lst=o=>Object.keys(o).map(k=>fullName(k)+(o[k]>1?' ×'+o[k]:'')).join(', ');
    if(!mk.length&&!r.added.length){toast('✔ Deck « '+D.name+' » importé.');return}
    const ad={};r.added.forEach(k=>ad[k]=(ad[k]||0)+1);
    setTimeout(()=>ask('Deck importé',h('div',{class:'sm',style:'line-height:1.5'},
      mk.length?h('p',null,h('b',null,'Cartes du code que tu n’as pas : '),lst(r.miss)):null,
      r.added.length?h('p',null,h('b',null,'Ajoutées à leur place : '),lst(ad)):null,
      D.cards.length<ECON.deck?h('p',{style:'color:#c5af89'},'Le deck a '+D.cards.length+' cartes sur '+ECON.deck+' : complète-le avec ta collection.'):h('p',{class:'mut'},'Le deck est complet ('+D.cards.length+' cartes).')),
      [{t:'Compris',c:'pri'}]),80)};
  const go_=h('button',{class:'btn pri',disabled:true,onclick:run},'📥 Importer');
  const upd=()=>{info.replaceChildren();const v=ta.value.trim();go_.disabled=true;if(!v)return;
    const I=readDeckCode(v);
    if(!I){info.append(h('div',{class:'sm',style:'color:#ad7f7f'},'Code invalide ou incomplet : vérifie que tu l’as copié en entier.'));return}
    const r=deckFromCode(I,S.coll,false),mk=Object.keys(r.miss);
    info.append(...[h('div',{class:'sm'},h('b',null,'« '+(I.name||'Deck')+' »'),' · '+I.total+' carte'+(I.total>1?'s':'')+' · tu en possèdes '+r.cards.length),
      mk.length?h('div',{class:'sm mut',style:'margin-top:3px'},'Il te manque : '+mk.map(k=>fullName(k)+(r.miss[k]>1?' ×'+r.miss[k]:'')).join(', ')):h('div',{class:'sm',style:'color:#a8ba98;margin-top:3px'},'✔ Tu possèdes toutes les cartes de ce deck.'),
      I.unknown.length?h('div',{class:'sm mut'},I.unknown.length+' carte'+(I.unknown.length>1?'s inconnues ignorées':' inconnue ignorée')+' (version différente du jeu).'):null].filter(Boolean));
    go_.disabled=tgt==null};
  ta.addEventListener('input',upd);
  const drawSlots=()=>slots.replaceChildren(...S.decks.map((d,i)=>h('span',{class:'chip'+(tgt===i?' on':''),onclick:()=>{tgt=i;drawSlots();upd()}},(i+1)+' · '+d.name+' ('+d.cards.length+')')));
  modal(h('div',{style:'max-width:600px'},h('h2',null,'Importer un deck'),
    h('p',{class:'mut sm'},'Colle le code envoyé par un ami : le deck se construit tout seul avec les cartes de ta collection.'),ta,info,
    di==null?[h('div',{class:'sm',style:'margin:12px 0 6px;font-weight:800'},'Emplacement (son contenu sera remplacé) :'),slots]:h('div',{class:'sm mut',style:'margin-top:8px'},'Le deck « '+S.decks[di].name+' » sera remplacé.'),
    h('label',{class:'sm',style:'display:flex;gap:8px;align-items:center;margin-top:12px;cursor:pointer'},fill,'Remplacer les cartes qui me manquent par des cartes de ma collection (même coût si possible)'),
    h('div',{class:'row',style:'margin-top:14px;justify-content:flex-end'},h('button',{class:'btn',onclick:closeModal},'Annuler'),go_)));
  if(di==null)drawSlots();setTimeout(()=>ta.focus(),40)}

// ---------- AMIS ----------
function netLine(){return NET.ok?'🟢 En ligne — tes amis peuvent te défier':NET.err?'🔴 '+NET.err:'🟡 Connexion au serveur de rencontre…'}
function vFriends(v){
  const nameI=h('input',{value:S.name,maxlength:16,placeholder:'Ton pseudo',style:'flex:1'});                  // le crayon : on peut changer son pseudo ici
  nameI.addEventListener('change',()=>{S.name=nameI.value.trim().slice(0,16)||S.name;saveS();refreshTop()});
  const link=location.href.split('#')[0]+'#'+S.code;
  const statusEl=h('div',{class:'sm',id:'netl'},netLine());
  const codeI=h('input',{placeholder:'Code ou lien d’invitation',style:'flex:1;text-transform:uppercase'});
  const list=h('div');
  v.append(h('div',{class:'cols'},
    h('div',null,
      h('div',{class:'panel hl'},ph('friends','Mon profil'),h('div',{class:'row'},h('label',{class:'inico pen'},nameI,ico('pen'))),
        h('div',{class:'row',style:'margin-top:12px'},h('div',{style:'flex:1;min-width:150px'},h('div',{class:'sm mut'},'Mon code ami'),h('b',{style:'font-size:22px;letter-spacing:.1em',class:'gold codebig'},S.code)),
          h('button',{class:'btn sm pri',onclick:()=>copy(S.code,'Code copié')},ico('copy'),' Copier le code'),h('button',{class:'btn sm pri',onclick:()=>copy(link,'Lien d’invitation copié')},ico('link'),' Copier le lien')),
        h('div',{style:'margin-top:10px'},statusEl)),
      h('div',{class:'panel'},ph('adduser','Ajouter un ami'),h('div',{class:'row'},h('label',{class:'inico'},codeI,ico('adduser')),h('button',{class:'btn pri',onclick:()=>addFriend(codeI.value,list)},ico('adduser'),' Ajouter')),
        h('p',{class:'mut sm',style:'margin:8px 0 0'},'Colle le code ARCANE ou le lien d’invitation associé à son compte.'))),
    h('div',null,h('div',{class:'panel'},ph('friends','Mes amis'),list))));list.id='flist';
  drawFriends(list);
  pingAll(list);FR_T=setInterval(()=>{const e=$('#netl');if(e)e.textContent=netLine();pingAll(list)},20000)}
function copy(t,m){try{navigator.clipboard.writeText(t).then(()=>toast(m),()=>toast(t))}catch(e){toast(t)}}
// ----- chat entre amis (les deux doivent avoir le jeu ouvert) ; l'historique reste sur cet ordinateur -----
const CHATS={},UNREAD={};let CHATW=null,CHATL=0;
function chatKey(){return'etat_arcanique_chat_'+((S&&S.code)||'')}
function chatLoad(){if(CHATL===chatKey())return;CHATL=chatKey();for(const k in CHATS)delete CHATS[k];try{Object.assign(CHATS,JSON.parse(localStorage.getItem(chatKey())||'{}'))}catch(e){}}
function chatSave(){try{const o={};for(const k in CHATS)o[k]=CHATS[k].slice(-80);localStorage.setItem(chatKey(),JSON.stringify(o))}catch(e){}}
function onFriendMsg(m){chatLoad();const code=String(m.code||'').toUpperCase();if(!validCode(code))return;const t=String(m.m||'').slice(0,300);
  (CHATS[code]=CHATS[code]||[]).push({f:1,m:t,ts:Date.now()});chatSave();
  const f=S.friends.find(x=>x.code===code)||{code,name:String(m.name||'Un joueur').slice(0,18)};
  if(CHATW===code&&$('#fchat'))drawChat(f);else{UNREAD[code]=(UNREAD[code]||0)+1;toast('💬 '+f.name+' : '+t);if(CUR==='friends'&&!window.DUEL){const l=$('#flist');if(l)drawFriends(l)}}}
function openChat(f){chatLoad();CHATW=f.code;UNREAD[f.code]=0;drawChat(f);const l=$('#flist');if(l)drawFriends(l)}
function drawChat(f){let w=$('#fchat');if(!w){w=h('div',{id:'fchat'});document.body.append(w)}
  const L=CHATS[f.code]||[],inp=h('input',{placeholder:'Message à '+f.name+'…',maxlength:300,autocomplete:'off'}),list=h('div',{class:'fcl'});
  L.forEach(x=>list.append(h('div',{class:'chm'+(x.f?'':' me')+(x.ko?' ko':'')},h('b',null,(x.f?f.name:'Toi')+' : '),x.m,x.ko?h('small',null,' (non envoyé : hors ligne)'):null)));
  if(!L.length)list.append(h('div',{class:'mut sm'},'Aucun message. Ton ami doit avoir le jeu ouvert pour les recevoir.'));
  const send=()=>{const t=inp.value.trim().slice(0,300);if(!t)return;inp.value='';const x={f:0,m:t,ts:Date.now()};(CHATS[f.code]=CHATS[f.code]||[]).push(x);chatSave();drawChat(f);
    sendMsg(f,t,ok=>{if(!ok){x.ko=1;chatSave();if(CHATW===f.code&&$('#fchat'))drawChat(f);toast(f.name+' est hors ligne : message non envoyé.')}})};
  inp.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter')send();if(e.key==='Escape'){w.remove();CHATW=null}});
  w.replaceChildren(h('div',{class:'fch'},h('b',null,'💬 '+f.name),h('span',{class:'sm mut'},PRES[f.code]&&PRES[f.code].on?'en ligne':''),h('button',{class:'x',onclick:()=>{w.remove();CHATW=null}},'✕')),
    list,h('div',{class:'row fci'},inp,h('button',{class:'btn sm pri',onclick:send},'Envoyer')));
  list.scrollTop=list.scrollHeight;setTimeout(()=>{try{inp.focus()}catch(e){}},30)}
const PRES={};
function drawFriends(list){
  list.innerHTML='';
  if(!S.friends.length){list.append(h('div',{class:'mut sm'},'Aucun ami pour le moment. Donne-lui ton code, ou partage-lui le lien d’invitation.'));return}
  S.friends.forEach(f=>{
    const st=PRES[f.code];
    list.append(h('div',{class:'row frow'},
      h('span',{class:'fav'},String(f.name||'?').trim().charAt(0).toUpperCase()||'?'),
      h('div',{style:'flex:1;min-width:0'},h('b',null,f.name),h('div',{class:'sm mut'},h('span',{class:'dot'+(st&&st.on?' on':'')}),' '+f.code+(st?(st.on?(st.busy?' · en duel':' · en ligne'):' · hors ligne'):''))),
      h('div',{class:'fbtns'},h('button',{class:'btn sm pri',onclick:()=>challengeFriend(f)},'⚔ Défier'),
      h('button',{class:'btn sm chb',title:'Discuter avec '+f.name,onclick:()=>openChat(f)},'💬',UNREAD[f.code]?h('span',{class:'unr'},String(UNREAD[f.code])):null),
      h('button',{class:'btn sm',title:'Échanger une carte avec '+f.name,onclick:()=>startTrade(f)},'⇄ Échanger'),
      h('button',{class:'btn sm',title:'Retirer '+f.name,onclick:()=>ask('Retirer '+f.name+' ?',null,[{t:'Annuler'},{t:'Retirer',c:'danger',f:()=>{S.friends=S.friends.filter(x=>x!==f);saveS();drawFriends(list)}}])},'✕'))))})}
function pingAll(list){S.friends.forEach(f=>pingFriend(f.code,r=>{PRES[f.code]=r?{on:true,busy:r.busy}:{on:false};if(r&&r.name&&r.name!==f.name&&!f.custom){f.name=r.name;saveS()}if(CUR==='friends'&&document.body.contains(list))drawFriends(list)}))}
function addFriend(raw,list){
  const input=String(raw||'').trim().toUpperCase(),match=input.match(/(?:^|[^A-Z0-9])(ARCANE-[A-Z0-9]{6})(?:$|[^A-Z0-9])/),code=match?match[1]:input;
  if(!validCode(code)){toast('Code invalide (format ARCANE-XXXXXX).');return}
  if(code===S.code){toast('C’est ton propre code !');return}
  if(S.friends.some(f=>f.code===code)){toast('Déjà dans ta liste.');return}
  const f={code,name:'Ami '+code.slice(7)};S.friends.push(f);saveS();toast('Ami ajouté.');
  pingFriend(code,r=>{if(r&&r.name){f.name=r.name;saveS()}PRES[code]=r?{on:true,busy:r.busy}:{on:false};if(CUR==='friends'&&list&&document.body.contains(list))drawFriends(list)});
  drawFriends(list);const i=$('#view input[placeholder="Code ou lien d’invitation"]');if(i)i.value=''}
function cleanOpt(o){const r=Object.assign({},OPTDEF);OPTSET.forEach(g=>{if(o&&g.v.some(x=>x[0]===o[g.k]))r[g.k]=o[g.k]});return r}
function optSummary(o){return OPTSET.map(g=>{const x=g.v.find(y=>y[0]===o[g.k]);return g.n.split(' (')[0]+' : '+(x?x[1]:'?')}).join(' · ')}
function challengeFriend(f){pickDeckModal('Défier '+f.name,'Choisis ton deck pour ce défi (il restera secret).',i=>sendDuelTo(f,i))}
function sendDuelTo(f,di){
  const chk=deckCheck(S.decks[di]);if(!chk.ok){toast('Deck invalide : '+chk.err);return}
  const opt=Object.assign({},S.opt);let h1=null;
  modal(h('div',{style:'text-align:center'},h('h2',null,'Défi envoyé à '+f.name),h('p',{class:'mut'},'En attente de sa réponse…'),
    h('div',{class:'sm mut'},optSummary(opt)),
    h('div',{class:'row',style:'justify-content:center;margin-top:14px'},h('button',{class:'btn',onclick:()=>{h1&&h1.cancel();closeModal()}},'Annuler'))),{sticky:true});
  h1=sendChallenge(f,null,opt,{
    fail:m=>{closeModal();toast(m)},
    accepted:(c,m)=>{closeModal();if(m.ver!==APPV)toast('Versions différentes du jeu : des bugs sont possibles.');startHostDuel(c,m,di,opt)}})}
function onChallenge(c,m){
  if(!validCode(m.code)){try{c.close()}catch(e){}return}
  CHALLENGE_UI=true;const opt=cleanOpt(m.o),known=S.friends.some(f=>f.code===m.code);
  const nm=String(m.name||'Un joueur').slice(0,18);
  const close=()=>{CHALLENGE_UI=null};
  c.on('close',()=>{if(CHALLENGE_UI&&!DUEL){close();closeModal();toast('Le défi a été annulé.')}});
  if(m.o&&m.o.arenaQueue)return onArenaQueueChallenge(c,m,nm,close);
  if(m.o&&m.o.duelQueue)return onDuelQueueChallenge(c,m,nm,close);
  if(m.o&&m.o.arena){try{c.send({t:'dec',why:'arena'})}catch(e){}close();setTimeout(()=>{try{c.close()}catch(e){}},300);
    toast('Les défis directs d’Arène ne sont plus disponibles : utilise le matchmaking.');return}
  const accept=di=>{
    const d=S.decks[di];if(!deckCheck(d).ok){toast('Choisis un deck valide.');return}
    c.on('data',x=>{if(x&&x.t==='st'&&!DUEL){close();closeModal();beginGuestDuel(c,x.v)}});
    c.send({t:'acc',name:S.name,deck:deckKeys(d.cards),ver:APPV});
    modal(h('div',{style:'text-align:center'},h('h2',null,'Défi accepté'),h('p',{class:'mut'},'Le duel démarre…')),{sticky:true})};
  // on accepte d'abord, puis on choisit son deck
  const ask1=()=>modal(h('div',null,h('h2',null,'⚔ '+nm+' te défie !'),h('div',{class:'sm mut'},optSummary(opt)),
    h('div',{class:'row',style:'justify-content:flex-end;margin-top:14px'},
      known?null:h('button',{class:'btn sm',onclick:()=>{S.friends.push({code:m.code,name:nm});saveS();toast(nm+' ajouté(e) aux amis.')}},'+ Ami'),
      h('button',{class:'btn danger',onclick:()=>{try{c.send({t:'dec'})}catch(e){}close();closeModal();setTimeout(()=>{try{c.close()}catch(e){}},300)}},'Refuser'),
      h('button',{class:'btn pri',style:'--h:#73b0ad;--ht:#241e17',onclick:()=>modal(deckStep('Choisis ton deck','Défi de '+nm+' : ton deck restera secret.',accept,ask1),{sticky:true})},'Accepter'))),{sticky:true});
  ask1()}

// ---------- ÉCHANGES DE CARTES ----------
// 1) je clique sur « Échanger » : l'ami reçoit la proposition ; 2) il accepte ; 3) chacun choisit UNE carte à donner ;
// 4) les deux voient les deux cartes ; 5) l'échange n'a lieu que quand les deux ont validé (voir TradeSession dans trade.js).
function startTrade(f){
  if(window.DUEL||CHALLENGE_UI||TRADE_UI)return;
  let h1=null;TRADE_UI=true;
  const end=()=>{TRADE_UI=null;closeModal()};
  modal(h('div',{style:'text-align:center','data-sticky':1},h('h2',null,'Échange proposé à '+f.name),h('p',{class:'mut'},'En attente de sa réponse…'),
    h('div',{class:'row',style:'justify-content:center;margin-top:14px'},h('button',{class:'btn',onclick:()=>{h1&&h1.cancel();end()}},'Annuler'))),{sticky:true});
  h1=sendTrade(f,{fail:m=>{end();toast(m)},accepted:(c,m)=>{closeModal();tradeWindow(c,{name:f.name,code:f.code})}})}
// réception d'une proposition d'échange
function onTrade(c,m){
  if(!validCode(m.code)){try{c.close()}catch(e){}return}
  TRADE_UI=true;const nm=String(m.name||'Un joueur').slice(0,18),known=S.friends.some(f=>f.code===m.code);
  let answered=false;const end=()=>{TRADE_UI=null;closeModal()};
  c.on('data',x=>{if(x&&x.t==='tcancel'&&!answered){answered=true;end();toast(nm+' a annulé sa proposition d’échange.')}});
  c.on('close',()=>{if(!answered){answered=true;end();toast('La proposition d’échange a été annulée.')}});
  modal(h('div',{'data-sticky':1},h('h2',null,'⇄ '+nm+' te propose un échange'),
    h('p',{class:'mut'},'Chacun choisit une carte à donner. Vous verrez tous les deux les deux cartes avant de valider : rien n’est échangé sans ton accord.'),
    h('div',{class:'row',style:'justify-content:flex-end;margin-top:14px'},
      known?null:h('button',{class:'btn sm',onclick:()=>{S.friends.push({code:m.code,name:nm});saveS();toast(nm+' ajouté(e) aux amis.')}},'+ Ami'),
      h('button',{class:'btn danger',onclick:()=>{answered=true;try{c.send({t:'dec'})}catch(e){}end();setTimeout(()=>{try{c.close()}catch(e){}},300)}},'Refuser'),
      h('button',{class:'btn pri',style:'--h:#73b0ad;--ht:#241e17',onclick:()=>{answered=true;try{c.send({t:'tacc',name:S.name})}catch(e){end();return}closeModal();tradeWindow(c,{name:nm,code:m.code})}},'Accepter'))),{sticky:true})}
// fenêtre d'échange : « Tu donnes » à gauche, « Tu reçois » à droite, validation des deux côtés
function tradeWindow(conn,peer){
  TRADE_UI=true;let mode='trade';const TF={q:'',t:0,r:0,fac:'',cost:0,own:true};
  const box=modal(h('div',{'data-sticky':1}),{sticky:true});box.classList.add('tradebox');const root=box.firstChild;
  const leave=()=>{TRADE_UI=null;closeModal();refreshTop();if(['friends','coll','decks'].indexOf(CUR)>=0)go(CUR)};
  const T=TradeSession(conn,peer,{
    change:()=>{if(mode==='pick'&&T.state==='open')return;mode='trade';render()},
    done:()=>{mode='trade';render()},
    closed:why=>{leave();toast(why==='cancel'?'Échange annulé.':why==='peer'?peer.name+' a annulé l’échange. Rien n’a été échangé.':why==='fail'?'Échange impossible : une des cartes n’est plus disponible. Rien n’a été échangé.':'Connexion coupée : rien n’a été échangé.')}});
  const info=o=>{const cd=CARDS[o.k];
    return h('div',{class:'tinfo'},h('b',null,fullName(cd)),
      h('div',{class:'sm mut'},(cd.t==='c'?'Créature':'Sort')+' · '+RAR[cd.r]+' · coût '+cd.c),
      h('div',{class:'sm ttx'},txNodes(cd.tx)),
      (cd.fac&&cd.fac.length||cd.fam)?h('div',{class:'tfs'},(cd.fac||[cd.fam]).map(f=>h('span',{class:'chip',style:'cursor:default;padding:2px 9px;font-size:12px;border-color:'+FAC[f].c+';background:'+FAC[f].c+'33'},FAC[f].ic+' '+FAC[f].n))):null)};
  const side=(cls,title,o,foot)=>h('div',{class:'tside '+cls},h('div',{class:'tl'},title),
    o?h('div',{class:'tcw'},cardEl(o.k,{big:true,tilt:1})):h('div',{class:'tempty'},cls==='me'?'Aucune carte choisie':peer.name+' n’a pas encore choisi de carte'),
    o?info(o):null,foot);
  const tradeView=()=>{
    const me=T.mine,th=T.theirs,done=T.state==='done';
    if(done){const r=T.res;
      return[h('h2',{style:'color:#a9db9d'},'✔ Échange réussi !'),h('p',{class:'mut'},'Les cartes ont été ajoutées à ta collection.'),
        h('div',{class:'tw'},side('them','Tu as reçu',r.get),h('div',{class:'tmid'},'⇄'),side('me','Tu as donné',r.give)),
        r.fixed.length?h('div',{class:'sm',style:'color:#dcc38d;margin-top:8px'},'⚠ '+r.fixed.map(x=>'« '+x.name+' » a perdu '+x.n+' exemplaire'+(x.n>1?'s':'')).join(' · ')+' de la carte donnée : pense à compléter tes decks.'):null,
        h('div',{class:'row',style:'justify-content:center;margin-top:14px'},h('button',{class:'btn pri',style:'--h:#73b0ad;--ht:#241e17',onclick:()=>{T.cancel();leave()}},'Fermer'))]}
    const status=!me&&!th?'Chacun choisit la carte qu’il donne.':!me?'Choisis la carte que tu donnes.':!th?'En attente de la carte de '+peer.name+'…':
      T.myLock?'Tu as validé. En attente de '+peer.name+'…':T.theirLock?peer.name+' a validé : vérifie les deux cartes, puis valide à ton tour.':'Vérifie bien les deux cartes, puis valide.';
    const lockPill=(on,txt)=>h('div',{class:'tok'+(on?' on':'')},on?'✔ '+txt+' validé':'… pas encore validé');
    return[h('h2',null,'⇄ Échange avec '+peer.name),h('div',{class:'tstat'},status),
      h('div',{class:'tw'},
        side('me','Tu donnes',me,h('div',{class:'tfoot'},
          h('button',{class:'btn sm',onclick:()=>{mode='pick';render()}},me?'Changer de carte':'Choisir une carte'),
          me?h('button',{class:'btn sm',onclick:()=>T.setOffer(null)},'Retirer'):null,lockPill(T.myLock,'Tu as'))),
        h('div',{class:'tmid'},'⇄'),
        side('them','Tu reçois',th,h('div',{class:'tfoot'},lockPill(T.theirLock,peer.name+' a')))),
      h('div',{class:'sm mut',style:'text-align:center;margin-top:8px'},'Les deux joueurs doivent valider la même paire de cartes. Si l’un change sa carte, les validations sont annulées.'),
      h('div',{class:'row',style:'justify-content:space-between;margin-top:14px'},
        h('button',{class:'btn danger',onclick:()=>T.cancel()},'Annuler l’échange'),
        T.myLock?h('button',{class:'btn',onclick:()=>T.unlock()},'Retirer ma validation'):
          h('button',{class:'btn green',disabled:!T.canLock(),onclick:()=>T.lock()},'Valider l’échange'))]};
  const pickView=()=>{
    const list=h('div',{class:'cgrid tgrid'});
    const draw=()=>{const ks=POOL.filter(cardFilter(TF)).sort(sortK).filter(k=>(S.coll[k]||{n:0}).n>0);untilt();list.replaceChildren();
      if(!ks.length){list._gen=(list._gen||0)+1;list.append(h('div',{class:'mut'},'Aucune carte ne correspond à ces filtres.'));return}
      fillGrid(list,ks,k=>h('div',{class:'cc2'+(T.mine&&T.mine.k===k?' sel':''),onclick:()=>{if(T.setOffer({k,p:0})){mode='trade';render()}else toast('Cette carte n’est plus disponible.')}},
        cardEl(k,{tilt:1}),h('span',{class:'own'},'×'+S.coll[k].n)))};
    const f=mkFilters(TF,{own:false},draw);draw();
    return[h('div',{class:'row',style:'justify-content:space-between;margin-bottom:8px'},h('h2',{style:'margin:0'},'Quelle carte donnes-tu à '+peer.name+' ?'),h('button',{class:'btn sm',onclick:()=>{mode='trade';render()}},'← Retour')),
      h('div',{class:'sm mut',style:'margin-bottom:6px'},'Tu ne donnes qu’un exemplaire.'),f,list]};
  function render(){root.replaceChildren(...(mode==='pick'&&T.state==='open'?pickView():tradeView()))}
  render()}

// ---------- CODE ----------
function vCode(v){
  const i=h('input',{placeholder:'Entre un code',style:'flex:1',autocapitalize:'off',autocomplete:'off',spellcheck:'false'}),out=h('div',{style:'margin-top:10px'});
  const go_=()=>{const r=redeemCode(i.value);i.value='';
    out.innerHTML='';out.append(r.ok?h('div',{style:'color:#a4db99;font-weight:800'},r.all?(r.n?'✔ Code valide : toute la collection est débloquée ('+r.n+' cartes ajoutées) !':'✔ Code valide : tu possèdes déjà toute la collection.'):'✔ Code valide : +'+r.n+' 💎 ajoutés !'):h('div',{style:'color:#bc8c94;font-weight:700'},'Code invalide.'));refreshTop()};
  i.addEventListener('keydown',e=>{if(e.key==='Enter')go_()});
  v.append(h('div',{class:'panel hl',style:'max-width:620px'},ph('code','Code'),h('p',{class:'mut sm',style:'margin:0 0 10px'},'Entre un code pour recevoir des 💎 ou débloquer toute la collection (réservé aux tests).'),
    h('div',{class:'row'},i,h('button',{class:'btn pri',onclick:go_},'Valider')),out))}

// ---------- COMPTE : sauvegarde en ligne et transfert de la progression ----------
let ACCM='in';                                                        // formulaire : 'in' = connexion, 'up' = création
function accStTxt(){if(!ACC)return'';const t=ACC.last?new Date(ACC.last).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}):'';
  return ACC_ST==='sync'?'☁️ Synchronisation…':ACC_ST==='err'?'⚠️ '+(ACC.err||'Synchronisation impossible.')+' Tes changements restent sur cet ordinateur et seront envoyés plus tard.':
    ACC_ST==='ok'?'✔ Progression sauvegardée en ligne'+(t?' (à '+t+')':'')+'.':''}
function accRefresh(){const e=$('#accst');if(e){e.textContent=accStTxt();e.style.color=ACC_ST==='err'?'#bc8c94':ACC_ST==='ok'?'#a4db99':''}}
function dlFile(name,txt){const a=h('a',{href:URL.createObjectURL(new Blob([txt],{type:'application/json'})),download:name});document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
function askImport(st,src){ask('Remplacer ta progression ?','La progression de '+src+' ('+Object.keys(st.coll).length+' cartes différentes, '+st.gems+' 💎) va remplacer celle de cet ordinateur. Une copie de secours de ta progression actuelle est gardée.',
  [{t:'Annuler'},{t:'Remplacer',c:'pri',f:()=>{importSave(st);toast('✔ Progression importée.');refreshTop();go('acct')}}])}
function vAcct(v){
  const pan=h('div',{class:'panel hl',style:'max-width:700px;--h:'+THUE.acct[0]},ph('acct',cloudOn()?'Compte en ligne':'Compte'));
  if(!cloudOn()){const k=locSession(),a=k&&locAll()[k];
    pan.append(h('p',{style:'margin:0 0 6px'},'Connecté avec le compte local ',h('b',null,a?a.id:'?'),'.'),
      h('p',{class:'mut sm'},'Ce compte et sa progression restent sur cet ordinateur. Les comptes en ligne (pour retrouver ta collection partout) s’activent dès que le fichier ',h('b',null,'cloud-config.js'),' à côté du jeu est rempli. En attendant, le transfert ci-dessous emporte ta progression sur un autre ordinateur.'),
      h('div',{class:'row'},h('button',{class:'btn',onclick:()=>ask('Se déconnecter ?','Ta progression reste enregistrée dans ce compte, sur cet ordinateur.',[{t:'Annuler'},{t:'Se déconnecter',c:'pri',f:()=>{locLogout();location.reload()}}])},'Se déconnecter')))}
  else if(ACC){
    pan.append(h('p',{style:'margin:0 0 6px'},'Connecté avec le compte ',h('b',null,ACC.id),'.'),h('div',{id:'accst',class:'sm',style:'margin-bottom:8px'}),
      h('p',{class:'mut sm'},'Ta collection, tes decks, tes 💎, tes amis et tes réglages sont envoyés sur ton compte à chaque changement. Sur un autre ordinateur, connecte-toi avec le même pseudo et le même mot de passe : tu retrouves tout.'),
      h('div',{class:'row'},h('button',{class:'btn pri',onclick:()=>{ACC_DIRTY=true;cloudSync()}},'☁️ Synchroniser maintenant'),
        h('button',{class:'btn',onclick:()=>ask('Se déconnecter ?','Ta progression est sauvegardée sur ton compte. Il faudra te reconnecter pour jouer.',[{t:'Annuler'},{t:'Se déconnecter',c:'pri',f:()=>{accLogout();location.reload()}}])},'Se déconnecter')))}
  else{
    const idI=h('input',{placeholder:'Pseudo (ou adresse e-mail)',autocomplete:'username',maxlength:60,spellcheck:'false',autocapitalize:'off'}),
      pwI=h('input',{type:'password',placeholder:'Mot de passe (6 caractères minimum)',autocomplete:ACCM==='up'?'new-password':'current-password'}),
      pw2=h('input',{type:'password',placeholder:'Confirme le mot de passe',autocomplete:'new-password'}),msg=h('div',{class:'sm accmsg'});
    if(ACCM==='up'&&S.name)idI.value=S.name;
    const say=(t,ok)=>{msg.textContent=t;msg.style.color=ok?'#a4db99':'#bc8c94'};
    const submit=async()=>{
      if(ACCM==='up'&&pwI.value!==pw2.value){say('Les deux mots de passe ne sont pas identiques.');return}
      btn.disabled=true;msg.style.color='';msg.textContent='Connexion…';
      try{const r=await accLogin(ACCM==='up'?'signUp':'signInWithPassword',idI.value,pwI.value);
        toast(r==='new'?'✔ Compte créé : ta progression est sauvegardée en ligne.':r==='loaded'?'✔ Connecté : progression du compte chargée.':'✔ Connecté : ta progression est maintenant sauvegardée sur ton compte.');
        refreshTop();go('acct')}catch(e){say(e.message)}finally{btn.disabled=false}};
    const btn=h('button',{class:'btn gold',onclick:submit},ACCM==='up'?'Créer mon compte':'Se connecter');
    [idI,pwI,pw2].forEach(i=>i.addEventListener('keydown',e=>{if(e.key==='Enter')submit()}));
    pan.append(h('div',{class:'row',style:'margin-bottom:10px'},[['in','Se connecter'],['up','Créer un compte']].map(([k,l])=>h('span',{class:'chip'+(ACCM===k?' on':''),style:'--h:'+THUE.acct[0]+';--ht:#fff',onclick:()=>{ACCM=k;go('acct')}},l))),
      h('p',{class:'mut sm',style:'margin:0 0 10px'},ACCM==='up'?'Crée un compte pour sauvegarder en ligne ta progression actuelle (collection, decks, 💎, amis) et la retrouver sur n’importe quel ordinateur.':
        'Connecte-toi pour retrouver la progression de ton compte. Celle de cet ordinateur est remplacée (une copie de secours est gardée).'),
      h('div',{class:'accf'},idI,pwI,ACCM==='up'?pw2:null),
      h('div',{class:'row',style:'margin-top:10px'},btn,ACCM==='in'?h('button',{class:'btn sm',onclick:async()=>{try{await accReset(idI.value);say('E-mail de réinitialisation envoyé.',1)}catch(e){say(e.message)}}},'Mot de passe oublié ?'):null),msg,
      h('p',{class:'mut sm',style:'margin:8px 0 0'},'Avec un pseudo, un mot de passe oublié ne peut pas être récupéré ; avec une adresse e-mail, si.'))}
  // transfert sans compte : code à copier ou fichier
  const code=h('textarea',{class:'acccode',readonly:true,placeholder:'Ton code de sauvegarde apparaîtra ici.'}),paste=h('textarea',{class:'acccode',placeholder:'Colle ici un code de sauvegarde (il commence par EA1-)…'});
  const file=h('input',{type:'file',accept:'.json,application/json,text/plain',style:'display:none'});
  file.addEventListener('change',()=>{const f=file.files&&file.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{const st=readSave(r.result);file.value='';if(!st){toast('Fichier de sauvegarde invalide.');return}askImport(st,'ce fichier')};r.readAsText(f)});
  let bak=null;try{bak=localStorage.getItem(BAK_KEY)}catch(e){}
  const tr=h('div',{class:'panel',style:'max-width:700px'},ph('decks','Transférer sans compte'),
    h('p',{class:'mut sm',style:'margin:0 0 10px'},'Sur l’ancien ordinateur, copie ton code de sauvegarde (ou télécharge le fichier). Sur le nouveau, colle le code (ou ouvre le fichier) ici.'),
    h('div',{class:'row'},h('button',{class:'btn pri',onclick:()=>{code.value=saveCode();code.select();try{navigator.clipboard.writeText(code.value).then(()=>toast('✔ Code copié.'),()=>toast('Code prêt : copie-le (Ctrl+C).'))}catch(e){toast('Code prêt : copie-le (Ctrl+C).')}}},'📋 Copier mon code de sauvegarde'),
      h('button',{class:'btn',onclick:()=>dlFile('etat-arcanique-sauvegarde-'+today()+'.json',JSON.stringify(S))},'⬇ Télécharger le fichier')),code,
    h('div',{class:'row',style:'margin-top:12px'},h('button',{class:'btn gold',onclick:()=>{const st=readSave(paste.value);if(!st){toast('Code de sauvegarde invalide ou incomplet.');return}askImport(st,'ce code')}},'Importer ce code'),
      h('button',{class:'btn',onclick:()=>file.click()},'📂 Ouvrir un fichier'),file,
      bak?h('button',{class:'btn sm',onclick:()=>{let st=null;try{st=fixS(JSON.parse(bak))}catch(e){}if(st)askImport(st,'la copie de secours');else toast('Copie de secours illisible.')}},'↺ Restaurer la copie de secours'):null),paste);
  v.append(pan,tr);accRefresh()}

// ---------- démarrage : écran de connexion obligatoire ----------
// Compte en ligne (Firebase) si cloud-config.js est rempli, sinon compte local à cet ordinateur (pseudo + mot de passe).
let LOGM='in';
function loginScreen(then){
  const cloud=cloudOn(),known=cloud?[]:Object.values(locAll()).map(a=>a.id);if(!cloud&&!known.length)LOGM='up';
  const ov=h('div',{id:'login'});
  const draw=()=>{
    const idI=h('input',{placeholder:cloud?'Pseudo (ou adresse e-mail)':'Pseudo',autocomplete:'username',maxlength:cloud?60:16,spellcheck:'false',autocapitalize:'off'}),
      pwI=h('input',{type:'password',placeholder:'Mot de passe (6 caractères minimum)',autocomplete:LOGM==='up'?'new-password':'current-password'}),
      pw2=h('input',{type:'password',placeholder:'Confirme le mot de passe',autocomplete:'new-password'}),msg=h('div',{class:'lmsg'});
    if(LOGM==='in'&&known.length===1)idI.value=known[0];
    const say=(t,ok)=>{msg.textContent=t;msg.className='lmsg '+(ok?'ok':'ko')};
    const submit=async()=>{
      if(LOGM==='up'&&pwI.value!==pw2.value){say('Les deux mots de passe ne sont pas identiques.');return}
      btn.disabled=true;say(LOGM==='up'?'Création du compte…':'Connexion…',1);
      try{let r;
        if(cloud){r=await accLogin(LOGM==='up'?'signUp':'signInWithPassword',idI.value,pwI.value);if(LOGM==='up'||!S.name){S.name=String(idI.value).trim().split('@')[0].slice(0,16);saveS()}}
        else r=LOGM==='up'?locSignUp(idI.value,pwI.value):locSignIn(idI.value,pwI.value);
        ov.classList.add('out');setTimeout(()=>ov.remove(),420);then(LOGM==='up');
        toast(LOGM==='up'?'✔ Compte créé : bienvenue, '+S.name+' !':'✔ Connecté : bon retour, '+S.name+' !')}
      catch(e){say(e.message||String(e))}finally{btn.disabled=false}};
    const btn=h('button',{class:'btn gold lg',onclick:submit},LOGM==='up'?'Créer mon compte':'Se connecter');
    [idI,pwI,pw2].forEach(x=>x.addEventListener('keydown',e=>{if(e.key==='Enter')submit()}));
    const lg=h('div',{class:'llogo'});lg.innerHTML=EMBLEM;
    ov.replaceChildren(h('div',{class:'lbox'},lg,h('h1',null,'L’ÉTAT ARCANIQUE'),h('p',{class:'lsub'},'Le jeu de cartes du serveur'),
      h('div',{class:'ltabs'},[['in','Se connecter'],['up','Créer un compte']].map(([k,l])=>h('button',{class:LOGM===k?'on':'',onclick:()=>{LOGM=k;draw()}},l))),
      h('div',{class:'lform'},idI,pwI,LOGM==='up'?pw2:null),btn,msg,
      h('p',{class:'lnote'},cloud?(LOGM==='up'?'Ta progression (collection, decks, 💎, amis) sera sauvegardée en ligne et te suivra sur n’importe quel ordinateur.':'Connecte-toi pour retrouver ta progression, sur n’importe quel ordinateur.'):
        (LOGM==='up'?(known.length?'Nouveau compte sur cet ordinateur : il commence avec la collection de départ.':'Ta progression actuelle sur cet ordinateur sera rattachée à ce compte.')+' Compte local : il reste sur cet ordinateur (les comptes en ligne s’activent avec le fichier cloud-config.js).':
          'Compte local à cet ordinateur.'+(known.length>1?' Comptes ici : '+known.join(', ')+'.':''))),
      cloud&&LOGM==='in'?h('button',{class:'btn sm',onclick:async()=>{try{await accReset(idI.value);say('E-mail de réinitialisation envoyé.',1)}catch(e){say(e.message)}}},'Mot de passe oublié ?'):null));
    setTimeout(()=>{try{(idI.value?pwI:idI).focus()}catch(e){}},60)};
  draw();document.body.append(ov)}
function startApp(isNew){
  go('play');refreshTop();
  setTimeout(()=>{if(typeof warmBestDeck==='function')try{warmBestDeck(S.coll,S.opt)}catch(e){}},1500);   // prépare le deck de l'IA en fond (ne bloque jamais l'interface)
  accBoot(()=>{if(!DUEL)go(CUR);refreshTop();toast('☁️ Progression chargée depuis ton compte.')});   // compte en ligne : on récupère la sauvegarde la plus récente
  const m=location.hash.match(/#(ARCANE-[A-Z0-9]{6})/i);
  if(m){const code=m[1].toUpperCase();history.replaceState(null,'',location.pathname+location.search);
    if(code!==S.code&&!S.friends.some(f=>f.code===code))ask('Invitation reçue','Ajouter le joueur '+code+' à tes amis ?',[{t:'Plus tard'},{t:'Ajouter',c:'pri',f:()=>{S.friends.push({code,name:'Ami '+code.slice(7)});saveS();go('friends')}}])}
  if(!S.seen.howto){S.seen.howto=1;saveS();howto()}
  arenaCheckStale();                                                                   // une partie d'Arène laissée en plan compte comme une défaite
  netStart(()=>{const e=$('#netl');if(e)e.textContent=netLine()})}
function boot(){
  loadS();
  const lg=h('div',{class:'logo'});lg.innerHTML=EMBLEM;lg.append(h('b',null,'L’ÉTAT ARCANIQUE'));
  $('#top').append(lg,h('nav',{id:'nav'}),h('span',{id:'appver',title:'Version du jeu'},'v'+APPV),h('span',{id:'pname',title:'Ton compte',onclick:()=>go('acct')}),h('span',{id:'accb',hidden:true,onclick:()=>go('acct')}),h('div',{class:'gems',title:'Tes diamants'},h('span',{class:'gi'},'💎'),h('span',{id:'gemn'},S.gems)));
  if(loggedIn())startApp(false);else loginScreen(startApp)}
window.addEventListener('load',boot);
