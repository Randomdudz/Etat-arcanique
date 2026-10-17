// ============ DATA : cartes, terrains, familles, règles ============
const GAMES={
  wow:{n:'WoW',ic:'⚔️',c:'#c8a046'},dofus:{n:'Dofus',ic:'🥚',c:'#5f9a57'},lol:{n:'LoL',ic:'🏆',c:'#5276aa'},
  cs:{n:'CS',ic:'🎯',c:'#c0703f'},bazar:{n:'Neutre',ic:'🌀',c:'#9a5d86'}};
// logos des vrais jeux (LoL et CS : Simple Icons, CC0 ; LoL aux couleurs de l'icône du client, intérieur bleu ; WoW et Dofus : dessinés d'après leurs emblèmes)
const GSVG={
  wow:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><radialGradient id="b" cx="50%" cy="36%" r="68%"><stop offset="0" stop-color="#3a6cc0"/><stop offset="1" stop-color="#0a1836"/></radialGradient><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2bf"/><stop offset=".5" stop-color="#ebbd4e"/><stop offset="1" stop-color="#93600f"/></linearGradient></defs><circle cx="12" cy="12" r="11.1" fill="url(#b)" stroke="#d9b45c" stroke-width="1.3"/><path d="M3.5 6.1h4.9l-.6 1 1.8 6.3 1.8-4.8-.5-1.5h2.2l-.5 1.5 1.8 4.8 1.8-6.3-.6-1h4.9l-1.1 1.1-3.8 11.5h-2.1L12 14l-1.6 4.7H8.3L4.6 7.2z" fill="url(#g)" stroke="#2e1b04" stroke-width=".55" stroke-linejoin="round"/></svg>',
  dofus:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><radialGradient id="e" cx="38%" cy="30%" r="78%"><stop offset="0" stop-color="#e2ffa8"/><stop offset=".33" stop-color="#6ad65c"/><stop offset=".78" stop-color="#1e7a34"/><stop offset="1" stop-color="#0d441d"/></radialGradient></defs><circle cx="12" cy="12" r="11.1" fill="#2a1a0b" stroke="#cfa64e" stroke-width="1.3"/><path d="M12 3.3c-3.6 0-6 5.4-6 9.5 0 3.8 2.7 6.9 6 6.9s6-3.1 6-6.9c0-4.1-2.4-9.5-6-9.5z" fill="url(#e)" stroke="#06260f" stroke-width=".7"/><ellipse cx="9.9" cy="8.4" rx="1.25" ry="2.1" fill="#fff" opacity=".6" transform="rotate(-22 9.9 8.4)"/><circle cx="14.3" cy="13.6" r=".95" fill="#c4ff96" opacity=".55"/><circle cx="11.3" cy="16.4" r=".7" fill="#c4ff96" opacity=".5"/><circle cx="14.6" cy="9.6" r=".6" fill="#c4ff96" opacity=".45"/></svg>',
  lol:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0e6d2"/><stop offset=".45" stop-color="#c8aa6e"/><stop offset="1" stop-color="#785a28"/></linearGradient><radialGradient id="b" cx="62%" cy="52%" r="55%"><stop offset="0" stop-color="#cdfaff"/><stop offset=".35" stop-color="#0ac8e8"/><stop offset=".75" stop-color="#0a5f9e"/><stop offset="1" stop-color="#062b52"/></radialGradient></defs><circle cx="12" cy="12" r="11.1" fill="#010a13" stroke="#c8aa6e" stroke-width="1.3"/><g transform="translate(4.3 4.3) scale(.64)"><path fill="url(#b)" d="M12 4.189c-.924 0-1.814.148-2.648.414v13.713h8.817a8.25 8.25 0 0 0 2.36-5.768c0-4.617-3.818-8.359-8.529-8.359Z"/><path fill="url(#g)" d="M12 1.516c-.913 0-1.798.112-2.648.312v1.74A9.7 9.7 0 0 1 12 3.2c5.267 0 9.536 4.184 9.536 9.348a9.2 9.2 0 0 1-2.3 6.086l-.273.954l-.602 2.112c2.952-1.993 4.89-5.335 4.89-9.122C23.25 6.468 18.213 1.516 12 1.516Z"/><path fill="url(#g)" d="M2.104 7.312A10.86 10.86 0 0 0 .75 12.576c0 1.906.492 3.7 1.355 5.266z"/><path fill="url(#g)" stroke="#2b1d08" stroke-width=".35" d="M1.912 0l1.212 2.474v19.053L1.912 24h14.73l1.337-4.682H8.33V0Z"/></g></svg>',
  cs:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11.1" fill="#f3ab3d" stroke="#2a1a06" stroke-width="1.1"/><g transform="translate(3.6 3.7) scale(.69)"><path fill="#141414" d="M21.71 3.235a.02.02 0 0 1-.022-.022c.002-.081.004-.37.005-.424c0-.129-.143-.183-.212-.083l-.229.333a.02.02 0 0 1-.02.01h-6.55a.047.047 0 0 1-.048-.046l-.013-.177a.048.048 0 0 1 .056-.048l.335.032a.06.06 0 0 0 .063-.045l.244-.989a.05.05 0 0 0-.03-.054l-.227-.085a.04.04 0 0 1-.026-.03c-.041-.171-.377-1.323-1.993-1.58c-.787-.125-1.302.21-1.577.478a1.6 1.6 0 0 0-.302.41l-.097.212a2 2 0 0 0-.046.234l.051.982a.11.11 0 0 0 .043.085l.354.153l-.196.325a.055.055 0 0 1-.053.04s-.417.01-.622.02c-.386.015-1.245.485-1.878 1.838l-.724 1.55a.07.07 0 0 1-.068.04l-.578.001c-.035 0-.073.028-.088.06L6.364 9a.11.11 0 0 0 .017.108l.627.392a.06.06 0 0 1 .02.058l-.328.967a.2.2 0 0 1-.023.062l-.435.382a.1.1 0 0 0-.035.06l-.598 1.53a.06.06 0 0 1-.06.045l-.336.002a.163.163 0 0 0-.162.149l-.201 2.288l-.016.121l-.158.908a.13.13 0 0 1-.034.055l-.558.427a4.8 4.8 0 0 0-.767 1.001l-1.86 3.924a.8.8 0 0 0-.078.322l.132.235c.002.084-.032.456-.07.53l-.624 1.09a.1.1 0 0 0-.003.085l.03.07l.094.187L2.829 24c.118.011.247-.14.251-.3l.103-1.297l-.027-.195l3.606-4.232c.095-.114.222-.317.286-.45l1.719-3.79a.17.17 0 0 1 .1-.088l.109-.035a.17.17 0 0 1 .183.053c.15.181.504.781.676 1.032c.143.208.85 1.23 1.158 1.567c.086.093.349.198.466.27a.083.083 0 0 1 .03.112l-1.03 1.808l-.455 2.136a1 1 0 0 0-.036.152l-.412 1.483c.003.188-.14.286-.153.507l-.15 1.084a.06.06 0 0 0 .059.061l2.544.014q.142-.001.286-.006l.075-.007c.124-.016.563-.076.75-.15a.6.6 0 0 0 .227-.13c.185-.194.2-.278.203-.398a.3.3 0 0 0-.028-.105a.12.12 0 0 0-.06-.047l-1.18-.356a.37.37 0 0 1-.19-.134l-.317-.47a.09.09 0 0 1 .018-.097l.618-.609a.2.2 0 0 0 .048-.072l1.904-4.488c.089-.285.059-.605 0-.944c-.044-.25-.686-1.326-.854-1.624l-1.286-2.251c-.079-.138-.19-.133-.228-.276l-.073-1.118a.04.04 0 0 1 .036-.05l.33-.028a.1.1 0 0 0 .075-.048l1.147-2.155a.1.1 0 0 0-.002-.094l-.235-.29a.09.09 0 0 1-.001-.088l.352-.38a.054.054 0 0 1 .073-.02l.934.526a.4.4 0 0 0 .186.05c.26-.001.686-.154.908-.29a.4.4 0 0 0 .139-.148l.458-1.07c.006-.014.027-.012.03.003l.127.595a.064.064 0 0 0 .079.05l1.35-.3a.066.066 0 0 0 .05-.078l-.319-1.344a.07.07 0 0 1 .01-.054l.13-.203a.3.3 0 0 0 .037-.082l.159-.725a.04.04 0 0 1 .04-.032l3.732.005a.09.09 0 0 0 .093-.093v-.634a.02.02 0 0 1 .022-.021h1.439a.047.047 0 0 0 .046-.047V3.28a.047.047 0 0 0-.046-.047h-1.44z"/></g></svg>'};
const GK=['wow','dofus','lol','cs','bazar'];
const AFG=['wow','dofus','lol','cs'];                       // jeux avec une affinité (le Bazar est neutre)
const CELLS=7;
const RAR=['','Commune','Rare','Légendaire'];
const RCOL=['','#a8a196','#b3c3cf','#d4ad5a'];
const RGEM=['','●','◆','★'];
const LIMIT=r=>r==3?1:2;                                   // exemplaires max par deck
const LEGMAX=7;                                            // légendaires max par deck (hors Arène)
const ECON={booster:75,pack:5,bulk:3,win:25,loss:10,first:25,cap:150,start:300,deck:30,decks:10,
  odds:[0,69.5,24,6.5],codeH:'180b8b09b9392a003fe48bef32683cdd48a402919ee679a2029927c9f639fc98',codeGems:2000,codeAll:'1ca55ef7da83c4d2eca12e1e02bf3fb4f00df3463c75b75322f2bb0f67404506'};

// ----- familles : tiers = [nombre de membres, effet] -----
const FAC={
  toxic:{n:'TOXIC',ic:'☣️',c:'#6f9442',d:'Le poison du serveur.',
    sum:'Chaque Toxic gagne Venin 1 pour chaque autre Toxic sur ton plateau (le Venin agit quand elle attaque).',
    tiers:[[2,'Tes Toxic ont Venin +1.'],[3,'Venin +2.'],[4,'Venin +3.'],[5,'Venin +4.'],[6,'Venin +5.']]},
  weebos:{n:'WEEBOS',ic:'🌸',c:'#b46a82',d:'Les fans d’animés.',
    sum:'À 3, tes Weebos gagnent +1 PV. À 5, tes Weebos (et seulement eux) subissent 1 dégât de combat de moins.',
    tiers:[[3,'Tes Weebos gagnent +1 PV.'],[5,'Tes Weebos subissent aussi 1 dégât de combat de moins.']]},
  farmer:{n:'FARMERS',ic:'🌾',c:'#c49b3c',d:'Les acharnés du farm.',
    sum:'Début de ton tour : gagne N−1 Or, N étant le nombre de Farmers sur ton plateau (4 Or au maximum).',
    tiers:[[2,'Début de ton tour : +1 Or.'],[3,'+2 Or.'],[4,'+3 Or.'],[5,'+4 Or (maximum).']]},
  expats:{n:'EXPATS',ic:'✈️',c:'#5079a8',d:'Ceux qui vivent à l’étranger.',
    sum:'Paie de l’Or pour qu’un Expat « disparaisse à l’étranger » : il est inciblable jusqu’à ton prochain tour.',
    tiers:[[1,'Disparaître à l’étranger : 4 Or.'],[2,'3 Or.'],[4,'2 Or (minimum).']]},
  ravages:{n:'RAVAGÉS',ic:'🌀',c:'#b4632f',d:'Le chaos incarné.',
    sum:'Fin de ton tour : 1 missile par palier débloqué (2 Ravagés = 1 missile, 3 = 2 missiles, etc.). Un missile inflige 1 dégât à un ennemi au hasard.',
    tiers:[[2,'Fin de ton tour : 1 missile.'],[3,'2 missiles.'],[4,'3 missiles.'],[5,'4 missiles.'],[6,'5 missiles.']]},
  alien:{n:'EXTRATERRITORIAUX',ic:'👽',c:'#81659f',d:'Venus d’ailleurs, de bien plus loin que l’Andorre.',
    sum:'Début de ton tour : vole N−1 Or à l’adversaire, N étant le nombre d’Extraterritoriaux sur ton plateau.',
    tiers:[[2,'Début de ton tour : vole 1 Or.'],[3,'Vole 2 Or.'],[4,'Vole 3 Or.'],[5,'Vole 4 Or.'],[6,'Vole 5 Or.']]},
  xeno:{n:'XÉNOPHOBES',ic:'🚧',c:'#a63c34',d:'Ils n’aiment pas trop les visiteurs venus d’ailleurs.',
    sum:'Quand un Xénophobe attaque un Extraterritorial, il gagne +1 ATK pour chaque autre Xénophobe sur ton plateau. Dès 3 Xénophobes, ce bonus s’applique contre toutes les créatures.',
    tiers:[[2,'+1 ATK contre les Extraterritoriaux.'],[3,'+2 ATK contre toutes les créatures.'],[4,'+3 ATK.'],[5,'+4 ATK.'],[6,'+5 ATK.']]},
  vestige:{n:'VESTIGES',ic:'🏛',c:'#8f7e60',d:'Les anciens du serveur : ils ont tout vu, et ils sont toujours là.',
    sum:'Tes Vestiges ont +1 PV par paire de Vestiges sur ton plateau (2 Vestiges : +1 PV, 4 : +2 PV, 6 : +3 PV).',
    tiers:[[2,'Tes Vestiges ont +1 PV.'],[4,'+2 PV.'],[6,'+3 PV.']]}};
const FACK=Object.keys(FAC);
function facTier(f,n){let t=null;for(const x of FAC[f].tiers)if(n>=x[0])t=x;return t}
function exCost(n){return n>=4?2:n>=2?3:4}

const KWI={rempart:['Rempart','⛊'],venin:['Venin','☠'],siphon:['Siphon','♥'],hate:['Hâte','⚡'],egide:['Égide','✧'],
  croissance:['Croissance','✚'],frenesie:['Frénésie','⚔⚔'],afk:['AFK','💤'],insolence:['Insolence','♛'],tilt:['Tilt','😡'],respawn:['Respawn','↺'],vip:['VIP','😎'],deso:['Désorienté','💫'],cleave:['Cleave','🪓']};
// glossaire : [regex, définition] — les mots reconnus dans les textes reçoivent une infobulle
const GLOS=[
  [/Cri d’arrivée/,'Effet qui se déclenche quand la créature arrive en jeu : jouée depuis la main, ou invoquée par un effet (la cible est alors choisie au hasard).'],
  [/Agonie/,'Effet qui se déclenche quand la créature meurt (pas si elle est Bannie ou Kick).'],
  [/Enchaînement/,'Bonus si tu as déjà joué une autre carte pendant ce tour.'],
  [/Rempart/,'Les ennemis doivent attaquer cette créature en premier.'],
  [/Venin/,'Venin X : quand la créature attaque et blesse sa cible, elle lui ajoute X cumuls de Venin ; rien en défense ni avec des dégâts indirects. Chaque cumul inflige 1 dégât au début du tour de sa cible, puis diminue de 1. Ces dégâts ne déclenchent pas le Tilt.'],
  [/Siphon/,'Les dégâts infligés en combat soignent ton héros d’autant.'],
  [/Hâte/,'Peut attaquer dès son arrivée.'],
  [/Égide/,'Annule la prochaine source de dégâts subie.'],
  [/Croissance/,'Gagne +1/+1 au début de chacun de tes tours, sans limite.'],
  [/Frénésie/,'Peut attaquer deux fois par tour.'],
  [/Ignore(?:nt)? (?:aussi )?les Remparts/,'Peut attaquer n’importe quelle cible, même quand l’adversaire a une créature avec Rempart.'],
  [/AFK/,'Tant qu’elle n’a pas attaqué, l’adversaire ne peut ni l’attaquer ni la cibler, sauf avec un effet aléatoire. Elle peut attaquer normalement, et tu peux toujours la cibler avec tes propres effets.'],
  [/Insolence/,'Ne peut pas être ciblée par les sorts et effets ennemis (elle peut être attaquée), sauf par les effets aléatoires.'],
  [/Tilt/,'Chaque fois que la créature subit des dégâts et survit, son effet « Tilt : … » se déclenche (chaque carte a le sien). Les dégâts du Venin ne le déclenchent pas.'],
  [/Respawn/,'Revient une fois avec 1 PV quand elle meurt.'],
  [/VIP/,'Beau gosse : ne peut être attaquée que s’il ne reste que des VIP parmi les créatures attaquables de son plateau (les créatures AFK ou à l’étranger ne la protègent pas). Les sorts et effets peuvent la cibler.'],
  [/Désorienté(?:e|es|s)?/,'Quand elle attaque, sa cible est tirée au hasard parmi tous les ennemis (héros compris), sans tenir compte des protections de ciblage ; la taxe de Maki s’applique toujours.'],
  [/Cleave/,'Cleave X : quand elle attaque une créature, elle inflige aussi X dégâts aux créatures à côté de sa cible.'],
  [/[Aa]rtefacts?|Dofus légendaire/,'Artefact : un objet permanent posé dans ta zone d’artefacts, à droite du plateau. Il ne peut pas être détruit.'],
  [/terrains? de jeu/,'Terrain de jeu : un terrain WoW, Dofus, LoL ou CS. Les autres terrains sont neutres.'],
  [/terrains? neutres?/,'Terrain neutre : un terrain qui n’est d’aucun jeu ; il profite à toutes les créatures, quelle que soit leur affinité.'],
  [/[Ii]nvincible/,'Ne subit aucun dégât et ne peut pas mourir.'],
  [/Reset/,'Après avoir détruit une créature en attaquant, peut attaquer à nouveau.'],
  [/Gremlin/,'Bonus de stats tant que la créature se trouve sur un terrain du jeu indiqué.'],
  [/missiles?/,'Missile : 1 dégât à un ennemi au hasard (héros ou créature).'],
  [/effets? du Bazar/,'Un effet au hasard parmi : les créatures ennemies changent de place, bannit une créature ennemie, soigne tout le monde de 5 PV, 1 dégât à tous les ennemis, l’adversaire perd 1 Démoflux maximum, invoque un Robot explosif, détruit un terrain ennemi, une carte de ton cimetière revient dans ta main, pioche 1 carte, 5 dégâts au héros adverse, Bloque une créature ennemie, 2 Venin à toutes les créatures, ou la créature gagne Égide.'],
  [/Mute/,'La créature perd son texte et ses mots-clés (elle garde ses stats, son Venin et ses bonus de famille). Ses effets « tant qu’elle est en jeu » s’arrêtent : un terrain désactivé par Kirua refonctionne, un terrain lié à elle (Blizzard, Grand Bazaar) dort.'],
  [/Bloque[sr]?|Bloquée?s?/,'Bloquée : ne peut pas attaquer pendant son prochain tour.'],
  [/Banni[st]?|Bannie?s?|Bannit/,'Retirée de la partie : aucune Agonie, et la carte ne va pas au cimetière.'],
  [/Kick/,'La créature retourne dans la main de son propriétaire (aucune Agonie). Si sa main est pleine, la carte va au cimetière.'],
  [/[Cc]imetière/,'Les sorts joués, les créatures détruites et les cartes défaussées ou brûlées y vont. Quand ton deck est vide, ton cimetière est mélangé pour former un nouveau deck.'],
  [/[Dd]éfausse/,'Défausser une carte : elle quitte la main et va au cimetière.'],
  [/Affinité/,'Score d’une créature sur un jeu (0, 1 ou 2). Les terrains de ce jeu donnent leur effet selon l’affinité ; 0 = aucun effet. Les terrains neutres profitent à tout le monde.'],
  [/à l’étranger/,'Disparaître à l’étranger (Expats) : la créature ne peut pas être attaquée ni ciblée par les effets ennemis jusqu’au début de ton prochain tour. Les effets aléatoires peuvent toutefois l’atteindre.'],
  [/Miroir de Kalandra/,'Jeton (sort à 0 ◆) : choisis une carte de ta main, une copie s’ajoute à ta main. Il faut une autre carte en main pour le jouer.'],
  [/Pierre, Feuille ou Ciseaux/,'Pierre bat Ciseaux, Ciseaux bat Feuille, Feuille bat Pierre. Égalité : rien ne se passe. Sans choix au bout de 15 s, le signe est tiré au hasard.'],
  [/Démoflux/,'Ressource du duel : +1 maximum par tour (10 au plus). Tu la dépenses pour jouer tes cartes ; ce que tu ne dépenses pas est perdu à la fin du tour. Certaines cartes en donnent en plus pour le tour, au-delà de 10.'],
  [/Or/,'Monnaie du duel : achète des terrains et paie les voyages des Expats.'],
  [/Terrain/,'Couvre 1 à 3 cases de ton plateau. Chaque créature posée dessus profite de l’effet du terrain selon son affinité avec le jeu (les terrains neutres profitent à toutes).']];

// ----- personnages : 3 versions chacun (commune, rare, légendaire), même illustration -----
// sc = affinité (0-2) sur chaque jeu ; cry = Cri d'arrivée, last = Agonie, sot/eot = début/fin de ton tour
const BASES={
mikalev:{n:'Mikalev',fac:[],sc:{wow:0,dofus:0,lol:1,cs:2},lore:'Vrai shinobi de CS : il entre et sort des smokes comme personne. Sait tout réparer, de la machine à laver au moteur de voiture, et prend la voix de Taz dès qu’on ne le regarde pas.',v:[
  {st:'Shinobi des smokes',c:1,a:2,h:1,kw:['afk'],eot:[{t:'heal',n:1}],tx:'AFK. Fin de ton tour : soigne ton héros de 1 PV.'},
  {st:'Homme à tout faire',c:3,a:2,h:2,allFamActive:1,tx:'A +1/+1 pour chaque famille active sur votre plateau.'},
  {st:'Chef habile',c:4,a:3,h:5,kw:['rempart','tilt'],tilt:[{t:'addRnd',list:['parisbrest','soupe','saumon']}],tx:'Rempart. Tilt : ajoute à ta main un repas au hasard : Paris-Brest, Soupe savoureuse ou Saumon à l’unilatéral revigorant.'}]},
coco:{n:'Coco',fac:['alien','ravages'],sc:{wow:1,dofus:0,lol:1,cs:1},lore:'« Si j’avais lancé mon E avant mon A, ça se passait bien ! » Flash en 1v4, meurt, et trouve toujours une explication absurde. A vécu en communauté autosuffisante avec des zadistes mangeurs de potiron.',v:[
  {st:'Esprit tourmenté',c:2,a:0,h:4,kw:['tilt'],tilt:[{t:'pick3',n:3}],tx:'Tilt : pioche 3 cartes, garde celle de ton choix et défausse les 2 autres.'},
  {st:'Flashin 1v4',c:2,a:2,h:2,last:[{t:'draw',n:1}],tx:'Agonie : pioche 1 carte.'},
  {st:'Communauté autosuffisante',c:6,a:3,h:4,cry:[{t:'eco'}],tx:'Cri d’arrivée : pose le terrain unique Éco village sur tout ton plateau. Fin de ton tour : une Graine 0/1 pousse sur chaque case libre de l’Éco village ; début de ton tour : chaque Graine dessus gagne +1/+1.'}]},
xulyes:{n:'Xulyes',fac:['alien','farmer'],sc:{wow:2,dofus:0,lol:1,cs:1},lore:'Tourelle de commandement du serveur : il distribue des directives, et gare à toi si tu ne les suis pas, il casse son clavier. 90 heures par semaine dans son resto, et toujours un ARAM Mayhem à lancer.',v:[
  {st:'Briseur d’écrans',c:2,a:2,h:2,last:[{t:'rnd2',n:1}],tx:'Agonie : 1 dégât à deux ennemis différents au hasard.'},
  {st:'Serveur charmant',c:3,a:3,h:3,cry:[{t:'healE',n:3,tg:'e',tgf:'hurt'}],tx:'Cri d’arrivée : rend jusqu’à 3 PV à un ennemi blessé (héros compris) et gagne 1 Or par PV rendu (3 max).'},
  {st:'Commandant des armées',c:4,a:4,h:4,kw:['vip'],aura:{others:1,a:1,h:1},tx:'VIP. Tes autres créatures ont +1/+1.'}]},
losk:{n:'Losk',fac:['xeno','expats'],sc:{wow:2,dofus:2,lol:1,cs:0},lore:'Déménagé en Andorre pour la fiscalité. Ne parle plus que de bitcoin. Sous son déguisement de requin, il optimise tout, surtout ta trésorerie.',v:[
  {r:1,st:'Crypto farmer',c:3,a:3,h:3,fac:['farmer','expats'],sc:{wow:0,dofus:1,lol:0,cs:1},sym:'🪙',col:'#d3b970',lore:'Il revient de voyage avec un portefeuille plein… ou vide.',travelGoldGuard:1,sot:[{t:'rndOr',min:-2,max:6}],tx:'Tant qu’il est en voyage, ton Or ne peut pas être volé. Début de ton tour : gagne aléatoirement entre −2 et 6 Or.'},
  {st:'Officier tyrannique',c:4,a:3,h:5,kw:['rempart','tilt'],tilt:[{t:'banOn',g:['wow','dofus']}],tx:'Rempart. Tilt : Bannit une créature ennemie au hasard posée sur un terrain WoW ou Dofus.'},
  {st:'Crypto farmer',c:5,a:4,h:5,sot:[{t:'or',n:5}],tx:'Début de ton tour : gagne 5 Or.'}]},
sadamie:{n:'Sadamie',fac:['ravages','alien'],sc:{wow:0,dofus:1,lol:1,cs:0},lore:'Pour lui, le jeu n’est pas une compétition, c’est un amusement ;). Son activité préférée : invoquer Chanssus pour atteindre le combo le plus broken de l’histoire. Triche aux jeux de cartes… et perd quand même.',v:[
  {st:'Adorateur de Chanssus',c:2,a:2,h:2,cry:[{t:'add',k:'chanssus',n:1}],last:[{t:'drawOpp',n:1}],tx:'Cri d’arrivée : ajoute un Chanssus à ta main (0/0, Hâte, +1/+1 par autre carte jouée ce tour). Agonie : l’adversaire pioche 1 carte.'},
  {st:'Agent du chaos',c:3,a:3,h:3,cry:[{t:'deckSummon'}],tx:'Cri d’arrivée : chaque joueur invoque une créature au hasard de son deck.'},
  {st:'Highroller ultime',c:8,a:1,h:1,cry:[{t:'highroll',n:4,k:4,min:5,onG:['dofus','lol']}],tx:'Cri d’arrivée : s’il arrive sur un terrain Dofus ou LoL, inflige 4 dégâts à toutes les créatures ennemies. Puis, si 4 créatures ennemies ou plus sont mortes ainsi, invoque 2 créatures au hasard de ton deck qui coûtent 5 ou plus.'}]},
lasorius:{n:'Lasorius',fac:['weebos','farmer'],sc:{wow:2,dofus:1,lol:0,cs:0},lore:'A honte de sa voix de fillette de 8 ans : mute 90 % du temps, pas de micro depuis 7 ans. Mille heures par mois sur WoW. Prêt à se couper le bras pour que son pire ennemi perde sa main.',v:[
  {st:'Mets une pierre',c:2,a:2,h:2,cry:[{t:'respawnT',tg:'ac'}],tx:'Cri d’arrivée : une de tes créatures gagne Respawn.'},
  {st:'Avatar de la rancune',c:3,a:3,h:3,cry:[{t:'hurtMe',n:3},{t:'dmg',n:3,tg:'ec'}],tx:'Cri d’arrivée : ton héros subit 3 dégâts, puis inflige 3 dégâts à une créature ennemie.'},
  {st:'Instigateur sournois',c:6,a:1,h:1,cry:[{t:'swap',tg:'ec'}],tx:'Cri d’arrivée : Lasorius s’échange contre une créature ennemie : chacun passe dans l’autre camp.'}]},
osiris:{n:'Osiris',fac:['toxic','expats'],sc:{wow:0,dofus:2,lol:1,cs:1},lore:'Capuche, lunettes noires, jamais un mot de trop. Son venin parle pour lui. Dreos le traite de débile, Laloutre le provoque ; il n’oublie rien. Il devient redoutable quand Maki est dans les parages.',v:[
  {st:'Joueur retraité',c:2,a:0,h:4,kw:['rempart'],eot:[{t:'draw',n:1,if:{ter:'lol'}},{t:'or',n:2,if:{ter:'dofus'}},{t:'grow',a:1,h:0,if:{ter:'cs'}}],tx:'Rempart. Fin de ton tour : sur un terrain LoL, pioche 1 carte ; sur un terrain Dofus, gagne 2 Or ; sur un terrain CS, gagne 1 d\'attaque.'},
  {st:'Jak',stl:'Jak',c:3,a:1,h:1,last:[{t:'summon',k:'mmejack',n:1}],tx:'Agonie : invoque Mme Jak, une vache 3/4 avec rempart.'},
  {st:'Expert bluffeur',c:5,a:4,h:5,eot:[{t:'rps'}],credit:'Photo © Caroline Darcourt / Winamax',lore:'« Haha, je savais que t’allais 3 barrel preflop sur la turn :\'D, tellement évident ! »',tx:'Fin de ton tour : choisis Pierre, Feuille ou Ciseaux. Au début de son tour, l’adversaire a 15 s pour choisir à son tour : s’il perd, Osiris vole tout son Or et tu pioches 3 cartes.'}]},
maki:{n:'Maki',fac:[],sc:{wow:0,dofus:2,lol:2,cs:0},withKw:{b:'osiris',kw:['siphon']},lore:'Représentante de la noblesse, nom à 14 particules. Son lait est réputé dans tout l’État Arcanique. Inséparable d’Osiris.',v:[
  {st:'Fan d’Osiris',c:2,a:2,h:3,cry:[{t:'tutor',b:'osiris'}],tx:'Siphon tant que tu contrôles un Osiris. Cri d’arrivée : pioche un Osiris au hasard dans ton deck.'},
  {st:'Chef coach de crêpe au sucre',c:2,a:2,h:2,sot:[{t:'affUpR',g:'lol'}],tx:'Siphon tant que tu contrôles un Osiris. Début de ton tour : une de tes créatures au hasard (en priorité sur un terrain LoL) gagne +1 d’affinité LoL ; si elle l’a déjà au maximum (2), elle gagne +1 ATK à la place.'},
  {st:'Aristocrate condescendant',c:4,a:3,h:5,tax:2,tx:'Siphon tant que tu contrôles un Osiris. Chaque créature doit payer 2 Or pour attaquer Maki, aristocrate condescendant.'}]},
randal:{n:'George Randall',fac:['expats','ravages'],sc:{wow:2,dofus:2,lol:2,cs:2},lore:'Anglais. A déjà tout fait, partout, avec tout le monde, selon lui. Chaque récit est invérifiable, et personne n’ose vérifier.',v:[
  {st:'Pornstar',c:2,a:2,h:2,cry:[{t:'blk',tg:'ec'}],tx:'Cri d’arrivée : Bloque une créature ennemie.'},
  {st:'The storyteller',c:3,a:3,h:2,cry:[{t:'rand',list:[[{t:'buff',a:1,h:1,self:1}],[{t:'dmgFace',n:4}],[{t:'draw',n:1}],[{t:'summon',k:'pleb',n:1}],[{t:'heal',n:5}]]}],tx:'Cri d’arrivée : raconte une histoire au hasard : +1/+1, 4 dégâts à l’adversaire, pioche 1, invoque 1 Pleb ou soigne 5.'},
  {st:'Rank 1 every game',c:5,a:5,h:5,dblGT:1,lore:'« I think I’m the best overall player in the world. »',tx:'Les effets de tes terrains de jeu s’appliquent deux fois (quand c’est possible : pas les mots-clés comme Siphon ou Hâte).'}]},
sada:{n:'Sadagod',fac:['alien'],sc:{wow:1,dofus:1,lol:1,cs:2},lore:'PAN PAN BOOM BOOM. Mémoire de poisson rouge, cœur d’or, poils partout. Instamute + block rien qu’à la voix. Docteur du serveur : il règle vos soucis informatiques depuis l’Australie, où il vient de s’installer.',v:[
  {st:'Instamuter',c:3,a:2,h:3,cry:[{t:'mute',tg:'c'}],tx:'Cri d’arrivée : Mute une créature.'},
  {st:'Poisson rouge',c:1,a:1,h:2,cry:[{t:'discSelf',n:1}],last:[{t:'draw',n:1}],tx:'Cri d’arrivée : défausse 1 carte au hasard. Agonie : pioche 1 carte.'},
  {st:'Master baiter',c:5,a:4,h:5,kw:['vip'],xatk:1,tx:'VIP. Chaque fois qu’une de tes créatures meurt pendant le tour adverse, il peut attaquer une fois de plus à ton prochain tour.'}]},
laloutre:{n:'Laloutre',fac:['toxic','xeno'],sc:{wow:1,dofus:0,lol:1,cs:2},lore:'Poste des clips CS toute la journée en écoutant du classique. Pense que la micro est un cerveau, et ne le lui dis surtout pas. Adore se clasher avec Osiris et sa bande.',v:[
  {st:'Débatteur invétéré',c:4,a:2,h:4,kw:['rempart','tilt'],vHeal:1,tilt:[{t:'pzRnd',n:1,k:2}],tx:'Rempart. Se soigne d’autant de PV que ses Venins infligent de dégâts. Tilt : 1 Venin à deux créatures ennemies au hasard.'},
  {st:'Élitiste de l’esport',c:4,a:3,h:3,cry:[{t:'tdesG',keep:'cs',all:1}],tx:'Cri d’arrivée : détruit tous les terrains de chaque côté, sauf les terrains CS.'},
  {st:'Démon de la custom',c:4,a:4,h:4,custom:1,tx:'Tant qu’il est sur un terrain de jeu, les autres créatures posées sur un terrain du même jeu (des deux côtés) ont 1 ATK et 1 PV de base ; elles gardent leurs effets et leurs bonus.'}]},
elkatrix:{n:'Elkatrix',fac:['toxic','xeno'],sc:{wow:2,dofus:2,lol:2,cs:1},lore:'Meilleur moine du monde, meilleur casino du monde ; sinon, à temps de jeu égal, il vous le fait payer. 25 comptes bannis sur LoL et il revient toujours. Vient de se faire opérer de l’appendicite.',v:[
  {st:'Doux comme un agneau',c:2,a:2,h:3,dblLol:1,tx:'Les effets des terrains LoL sous tes créatures s’appliquent deux fois.'},
  {st:'Top 3 Guardian',c:4,a:3,h:5,kw:['rempart'],sot:[{t:'healT',g:'wow',n:2},{t:'healT',g:'dofus',n:2}],tx:'Rempart. Début de ton tour : soigne de 2 PV tes créatures sur un terrain WoW ou Dofus.'},
  {st:'Unleashed',c:5,a:4,h:5,allyDieAff:{g:'lol',a:1,h:1},tx:'Chaque fois qu’une de tes autres créatures qui a une affinité LoL meurt, gagne +1/+1.'}]},
dreos:{n:'Dreos',fac:['alien','farmer'],sc:{wow:2,dofus:2,lol:1,cs:0},lore:'Fait son footing en forêt à 3 h du matin : il se couche ou il se lève, personne ne sait. Souffre-douleur d’Elkatrix, il se venge en traitant Osiris de débile. Gifted sur les MMO, ungifted sur le reste.',v:[
  {st:'Mot de merde',c:2,a:1,h:3,kw:['rempart'],pzBack:1,tx:'Rempart. Chaque créature qui l’attaque reçoit 1 Venin.'},
  {st:'Rusheur serveur',c:3,a:3,h:2,kw:['hate'],cry:[{t:'draw',n:1,if:{ter:'dofus'}}],tx:'Hâte. Cri d’arrivée : s’il est posé sur un terrain Dofus, pioche 1 carte.'},
  {st:'Surrender to madness',c:8,a:5,h:8,kw:['insolence','siphon'],cry:[{t:'madness',self:2}],sot:[{t:'madness',self:2}],tx:'Insolence. Siphon. Cri d’arrivée, puis début de chacun de tes tours : gagne N Démoflux et N Or, pioche N cartes, et ton héros perd 2×N PV (N = 1, puis 2, puis 3…).'}]},
minuit:{n:'Minuit',fac:['xeno','weebos'],sc:{wow:2,dofus:0,lol:1,cs:0},lore:'Chill, turbo weeb, fan inconditionnelle de Taylor Swift. Vit pour les GROS NOMBRES : son pire souvenir reste le stat squish de WoW, quand ses crits sont passés de 15 millions à 20 000.',v:[
  {st:'Raciste originel',c:3,a:3,h:3,cry:[{t:'dmgFac',f:'alien',n:3}],tx:'Cri d’arrivée : inflige 3 dégâts à tous les Extraterritoriaux (des deux camps).'},
  {st:'Guerrier enragé',c:4,a:3,h:3,cleave:2,tx:'Cleave 2 : quand il attaque une créature, inflige aussi 2 dégâts aux créatures à côté d’elle.'},
  {st:'Chef de raid',c:5,a:3,h:3,aura:{aff:'wow',a:1,h:1,scale:1},last:[{t:'killAll'}],tx:'Tes créatures avec une affinité WoW ont +1/+1 (WoW 1) ou +2/+2 (WoW 2). Agonie : détruit toutes les créatures.'}]},
lisdoon:{n:'Lisdoon',fac:['xeno'],sc:{wow:1,dofus:0,lol:2,cs:0},lore:'Tout doux d’habitude, ancien gros reconverti en séducteur. Lance une partie de LoL et le gremlin se réveille, sans pitié. Va bientôt être père, et ses commentaires ressemblent à ceux d’une IA de boomer.',v:[
  {st:'Gomuscu',c:2,a:2,h:3,onGT:{kw:['croissance']},tx:'Croissance tant qu’il est sur un terrain de jeu.'},
  {st:'Patriarche',c:3,a:3,h:2,last:[{t:'summon',k:'heritier',n:1}],tx:'Agonie : invoque un Héritier (Croissance).'},
  {st:'Roro',stl:'Roro',c:6,a:6,h:5,onT:{g:'lol',kw:['frenesie']},tx:'Rage de Roro : sur un terrain LoL, peut attaquer deux fois par tour.'}]},
loractys:{n:'Loractys',fac:['alien','weebos'],sc:{wow:1,dofus:2,lol:1,cs:1},lore:'Parle à toute vitesse, toujours depuis la Chine. Sigma player à l’esprit tordu : il trouve le bug que personne n’avait vu, sur tous les jeux. Goat fast learner. Se marie bientôt.',v:[
  {st:'Fast thinker',c:2,a:1,h:2,last:[{t:'cap',n:1}],tx:'Agonie : gagne 1 Démoflux maximum (10 au plus).'},
  {st:'De retour de Chine',c:3,a:2,h:3,fac:['alien','expats'],onBack:[{t:'draw',n:2}],tx:'À chaque retour de voyage : pioche 2 cartes.'},
  {st:'Abuseur du système',c:4,a:3,h:4,dbl:1,dblLast:1,tx:'Les Cris d’arrivée et les Agonies de tes autres créatures se déclenchent deux fois.'}]},
simon:{n:'Simon',fac:['toxic','ravages'],sc:{wow:0,dofus:0,lol:2,cs:1},lore:'Monologues sans fin sur n’importe quel sujet : mécaniques, 1v1, salle du temps. Roi de l’insolence : trop fort pour disrespect quelqu’un, il préfère l’ignorer.',v:[
  {st:'Monologueur insolent',c:3,a:3,h:3,cry:[{t:'blk',rnd:1}],tx:'Cri d’arrivée : Bloque une créature ennemie au hasard.'},
  {st:'Train ses mécaniques',c:2,a:2,h:2,trainUp:1,tx:'Chaque fois qu’il attaque une créature qui a autant d’ATK ou autant de PV que lui (ou moins), gagne +1/+1 avant le combat.'},
  {st:'Rusheur de ligue',c:6,a:5,h:6,kw:['hate'],killLoot:1,lore:'« Oh, j’ai drop un mirror ! »',tx:'Hâte. Chaque fois qu’il tue une créature ennemie en attaquant, gagne un butin au hasard, toujours au moins 2 Or : 2 ou 3 Or, ou 2 Or et 1 ou 2 cartes, ou 2 Or et 2 Démoflux ; plus rarement un Miroir de Kalandra (très rarement : 5 Or et 3 cartes).'}]},
homz:{n:'Homz',fac:['alien','farmer'],sc:{wow:2,dofus:0,lol:1,cs:1},lore:'Fan d’armes, de tanks, d’avions et de missiles ; OTP WoW Classic, rang 14 rien que ça. Scrolle plus de 2000 réels par jour. Très contrarié quand on lui confisque son joint.',v:[
  {st:'Scrolleur invétéré',c:2,a:2,h:4,cry:[{t:'blk',tg:'ec'},{t:'blkSelf',n:2}],tx:'Cri d’arrivée : Bloque une créature ennemie, mais il est lui-même Bloqué pendant son prochain tour.'},
  {st:'À la recherche du R14',c:4,a:2,h:5,kw:['rempart','tilt'],tilt:[{t:'grow',a:1,h:1,if:{ter:'wow'}}],tx:'Rempart. Tilt : s’il est sur un terrain WoW, gagne +1/+1.'},
  {st:'Porteur de la flamme',c:5,a:4,h:6,kw:['vip'],aura:{fac:'xeno',a:1},xenoAll:1,tx:'VIP. Tes Xénophobes ont +1 ATK et leur bonus de famille s’applique contre toutes les créatures.'}]},
boku:{n:'Boku',fac:['weebos'],sc:{wow:0,dofus:0,lol:2,cs:1},lore:'GM et turbo weeb, OTP Katarina : chaque kill donne envie d’en refaire un. Ne s’est énervé que DEUX fois dans toute sa vie. Il en reste une.',v:[
  {st:'Présence apaisante',c:2,a:2,h:3,eot:[{t:'healAdj',n:1}],tx:'Fin de ton tour : soigne de 1 PV les créatures à côté de lui.'},
  {st:'Japan Expo enjoyer',stl:'Japan Expo enjoyer',c:4,a:2,h:2,cry:[{t:'summon',k:'weeb',n:2}],tx:'Cri d’arrivée : invoque 2 Weebs 1/1 (Weebos).'},
  {st:'Maître KATARINA',c:8,a:6,h:6,kw:['hate'],reset:1,killAtk:[{t:'dmgAll',n:1}],tx:'Hâte. Après avoir tué une créature en attaquant, inflige 1 dégât à toutes les créatures ennemies et peut attaquer à nouveau.'}]},
haddmi:{n:'Haddmi',fac:['xeno'],sc:{wow:0,dofus:0,lol:1,cs:2},lore:'Meneur d’un discord rival : une armée à lui tout seul. Bosse chez Vitality, niveau 10 sur FACEIT. Se vexe au quart de tour, et ça le fait tilt.',v:[
  {st:'Chouineur professionnel',c:1,a:0,h:3,kw:['rempart','tilt'],tilt:[{t:'grow',a:1,h:0}],lore:'« Je peux plus jouer la lane, go next. »',tx:'Rempart. Tilt : gagne +1 ATK.'},
  {st:'Chef dissident',c:5,a:3,h:2,cry:[{t:'ctl',tg:'ec',tgf:'cm3'}],tx:'Cri d’arrivée : prend le contrôle d’une créature ennemie qui coûte 3 ou moins.'},
  {st:'Sniper d’élite',c:6,a:5,h:4,noRet:1,eot:[{t:'snipe',n:4}],tx:'Ne subit pas de dégâts quand il attaque. Fin de ton tour : inflige 4 dégâts à la créature ennemie la plus éloignée de lui (au hasard en cas d’égalité).'}]},
potatoll:{n:'Potatoll',fac:['alien','ravages'],sc:{wow:2,dofus:1,lol:2,cs:1},lore:'Plus gros troll du serveur, meneur de la bande et complètement ravagé. Quand il lance les dés, c’est tout l’État Arcanique qui tremble.',v:[
  {st:'Serviteur de Kiwi',c:2,a:2,h:1,cry:[{t:'summon',k:'kiwi',n:1}],tx:'Cri d’arrivée : invoque Kiwi, un chat 1/1.'},
  {st:'Désinstallation sauvage',c:3,a:3,h:3,last:[{t:'tdestroy'}],lore:'« Putain de jeu de merde, vas-y, je le réinstalle plus jamais de ma vie entière. »',tx:'Agonie : détruit un terrain adverse au hasard.'},
  {st:'Fou du Bazar',c:8,a:6,h:6,bazNoPz:1,cry:[{t:'gbazar'}],tx:'Il ne subit pas le Venin de son Bazaar. Cri d’arrivée : pose le terrain unique Le Grand Bazaar sur tout ton plateau. Fin de ton tour : chaque créature dessus déclenche un effet du Bazar au hasard. Le Bazaar disparaît quand Potatoll quitte le plateau, et dort s’il est Mute.'}]},
bambou:{n:'Gollwyd Bambou',fac:['vestige'],sc:{wow:1,dofus:0,lol:1,cs:1},lore:'Créateur du serveur. N’y a pas mis les pieds depuis 20 ans (??). Il revient, regarde l’état du salon, et décide de tout reformater.',v:[
  {st:'Kickeur compulsif',c:3,a:2,h:2,cry:[{t:'kick',tg:'ec',tgf:'cm5'}],tx:'Cri d’arrivée : Kick une créature ennemie qui coûte 5 ou moins (elle retourne dans la main de son propriétaire).'},
  {st:'Nostalgique de la vieille époque',c:4,a:3,h:5,muteAll:1,tx:'Tant qu’il est sur le plateau, toutes les autres créatures sont Mute.'},
  {st:'Grand Reformatage',stl:'grand reformatage',c:10,a:5,h:5,cry:[{t:'wipe'}],tx:'Cri d’arrivée : détruit toutes les autres créatures.'}]},
// nouveaux personnages : r = rareté de chaque version (toutes ne sont pas encore créées) ; sym/col = illustration en attendant une photo
takk:{n:'Takk',fac:['weebos','expats'],sc:{wow:2,dofus:1,lol:1,cs:0},sym:'✈',col:'#bc779a',lore:'Toujours entre deux voyages, et toujours avec une nouvelle waifu à son retour.',v:[
  {r:1,st:'TN Lacoste',stl:'TN Lacoste',c:2,a:2,h:2,kw:['hate'],cry:[{t:'stealOr',n:1}],tx:'Hâte. Cri d’arrivée : vole 1 Or à l’adversaire.'},
  {r:2,st:'Enchaîneur de waifus',c:3,a:1,h:3,cry:[{t:'summon',k:'waifu',n:1}],onBack:[{t:'summon',k:'waifu',n:1}],tx:'Cri d’arrivée, et à chaque retour de voyage : invoque une Waifu 1/1 (Weebos).'},
  {r:3,st:'Pourquoi il est mort ?',c:5,a:4,h:5,kw:['frenesie'],last:[{t:'buffAffN',g:'wow',a:3,h:3}],tx:'Frénésie. Agonie : tes créatures qui ont une affinité WoW gagnent +3/+3.'}]},
kirua:{n:'Kirua',fac:['alien','vestige'],sc:{wow:0,dofus:2,lol:0,cs:2},sym:'❄',col:'#8fb8d7',lore:'Panthère sur le terrain, reine des neiges en dehors, et le serveur plante dès que Kirua se connecte.',v:[
  {r:1,st:'Crasheur de serveur',c:2,a:2,h:3,cry:[{t:'tOff',tg:'terr'}],tx:'Cri d’arrivée : désactive un terrain (un des tiens ou un de l’adversaire) tant que Kirua, crasheur de serveur est en jeu. S’il est Mute, le terrain refonctionne.'},
  {r:2,st:'La panthère',c:4,a:4,h:2,kw:['hate','tilt'],tilt:[{t:'dmgFace',n:2}],jumpAttacked:1,tx:'Hâte. La première fois qu’elle est attaquée à chaque tour, esquive l’attaque en sautant sur une case libre aléatoire de ton plateau. Tilt : inflige 2 dégâts au héros adverse.'},
  {r:3,st:'La reine des neiges',c:5,a:5,h:5,cry:[{t:'blizzard',tg:'ecell'}],tx:'Cri d’arrivée : pose le terrain Blizzard (2 cases) où tu veux sur le plateau adverse : les créatures dessus ne peuvent pas attaquer. Il ne peut pas être détruit, peut être recouvert, disparaît quand elle meurt et dort tant qu’elle est Mute.'}]},
rasta:{n:'Rasta',fac:['ravages','vestige'],sc:{wow:0,dofus:2,lol:0,cs:1},sym:'☁',col:'#91ab64',lore:'On le sent arriver avant de le voir. Quand on lui dit « viens dehors », il le prend au pied de la lettre.',v:[
  {r:1,st:'Fardeau pour l’équipe',c:2,a:2,h:3,cry:[{t:'sumE',k:'poutch',tg:'eslot'}],tx:'Cri d’arrivée : choisis une case libre du plateau adverse où invoquer un Poutch 0/4.'},
  {r:2,st:'Viens dehors',c:3,a:3,h:3,cry:[{t:'summon',k:'piccolo',n:1,if:{gt:1}},{t:'tdestroy',self:1,here:1,if:{gt:1}}],tx:'Cri d’arrivée : s’il est posé sur un terrain de jeu, détruit ce terrain et invoque Piccolo (Extraterritorial 2/3, Siphon).'},
  {r:3,st:'Aura nauséabonde',c:6,a:4,h:5,noPz:1,cry:[{t:'pzEvery',n:2}],sot:[{t:'pzAll',n:1}],tx:'Insensible au Venin. Cri d’arrivée : 2 Venin à toutes les autres créatures. Début de ton tour : 1 Venin à tous les ennemis.'}]},
natingaz:{n:'Natinganz',fac:['weebos'],sc:{wow:2,dofus:1,lol:1,cs:0},sym:'⌨',col:'#ada398',lore:'Privé d’ordinateur : chaque fois qu’il s’approche d’un jeu, ça fait mal, mais il en tire toujours quelque chose.',v:[
  {r:1,st:'Privé d’ordinateur',c:2,a:1,h:3,kw:['tilt'],cry:[{t:'hurtSelf',n:2,if:{gt:1}}],tilt:[{t:'draw',n:1}],tx:'Cri d’arrivée : s’il est posé sur un terrain de jeu, subit 2 dégâts. Tilt : pioche 1 carte.'},
  {r:2,st:'Puits de connaissance',c:2,a:1,h:3,sot:[{t:'draw',n:1,if:{terIn:['wow','bazar']}}],tx:'Début de ton tour : s’il est sur un terrain WoW ou neutre, pioche 1 carte.'},
  {r:3,st:'J’ai dl le boss',c:5,a:2,h:6,laser:6,tx:'Au début de chaque tour (adverse compris), se déplace d’une case vers la droite : un LASER géant inflige 6 dégâts à la case qu’il quitte et à la créature en face. S’il ne peut pas bouger, c’est lui qui prend le laser.'}]},
gobi:{n:'Gobi',fac:['farmer','ravages'],sc:{wow:2,dofus:2,lol:0,cs:0},sym:'⚔',col:'#9f5b49',lore:'Il a vaincu Sludgefist. Il mène sa troupe de baveux au combat, sans trop savoir dans quelle direction.',v:[
  {r:1,st:'Chef des baveux',c:2,a:2,h:2,kw:['deso'],cry:[{t:'hurtSelf',n:1},{t:'summon',k:'baveux',n:2}],tx:'Désorienté. Cri d’arrivée : subit 1 dégât et invoque 2 Baveux 1/1 Désorientés.'},
  {r:2,st:'Slayer of Sludgefist',c:4,a:4,h:2,kw:['respawn'],tx:'Respawn (La première fois qu’il meurt, il réapparaît).'},
  {r:3,st:'Collectionneur de Dofus',c:6,a:5,h:5,cry:[{t:'dofus'}],tx:'Cri d’arrivée : obtiens un Dofus légendaire au hasard (artefact) : Pourpre, Ocre, Émeraude, Vulbis, Turquoise ou Cawotte.'}]},
lanfear:{n:'Lanfear',fac:['toxic','vestige'],sc:{wow:1,dofus:1,lol:1,cs:0},sym:'🎙',col:'#a288d2',lore:'Son micro grésille tellement que plus personne ne sait où il en est.',v:[
  {r:1,st:'Vapoteuse insoutenable',c:2,a:1,h:3,eot:[{t:'pzRnd',n:1,k:1}],tx:'Fin de ton tour : 1 Venin à une créature ennemie au hasard.'},
  {r:2,st:'Micro de merde',c:4,a:3,h:4,cry:[{t:'desoAll'}],tx:'Cri d’arrivée : toutes les créatures ennemies sont Désorientées pendant leur prochain tour.'},
  {r:3,st:'Lanfear, maître des trains',c:3,a:2,h:2,eot:[{t:'exil',tg:'right'}],tx:'Fin de ton tour : la créature à sa droite part en voyage.'}]},
saja:{n:'Saja',fac:['xeno'],sc:{wow:2,dofus:0,lol:1,cs:0},sym:'⚖',col:'#978d82',lore:'Tout ce qui est à sa gauche s’affaiblit, tout ce qui est à sa droite se renforce.',v:[
  {r:2,st:'Presque world first Rygelon',stl:'presque world first Rygelon',c:3,a:1,h:2,cry:[{t:'setHp1',tg:'ec'}],tx:'Cri d’arrivée : une créature ennemie tombe à 1 PV.'},
  {r:3,st:'Fascisme incarné',c:6,a:4,h:5,aura:{pos:2},tx:'Les créatures à sa gauche ont -2/-2, celles à sa droite +2/+2 (sur les deux plateaux).'}]},
korock:{n:'Korock',fac:['toxic','ravages'],sc:{wow:0,dofus:0,lol:2,cs:1},sym:'🤬',col:'#c4524e',lore:'Il insulte avant même de dire bonjour. Report, mute, ban : il a tout eu, et il revient toujours.',v:[
  {r:1,st:'Insulteur de lobby',c:1,a:1,h:1,cry:[{t:'dmgFace',n:1}],tx:'Cri d’arrivée : inflige 1 dégât au héros adverse.'},
  {r:2,st:'Écraseur de main',c:3,a:2,h:2,cry:[{t:'setAtk0',tg:'ec'}],tx:'Cri d’arrivée : passe l’ATK d’une créature ennemie à 0.'},
  {r:3,st:'Ban à vie',c:5,a:4,h:3,kw:['hate'],cry:[{t:'dmgHand'}],tx:'Hâte. Cri d’arrivée : inflige 1 dégât au héros adverse par carte dans sa main.'}]},
snoux:{n:'Snoux',fac:['xeno','farmer'],sc:{wow:1,dofus:0,lol:0,cs:2},sym:'🎯',col:'#d98a3a',lore:'Le Rempart ? Il ne l’a jamais vu. Lui, il va tout droit dans la tête, quoi qu’il arrive.',v:[
  {r:1,st:'Facecheck',c:3,a:3,h:3,faceHit:[{t:'disc',n:1}],tx:'Quand il attaque le héros adverse, l’adversaire défausse une carte au hasard.'},
  {r:2,st:'Tête la première',c:3,a:3,h:3,noTaunt:1,faceHit:[{t:'buff',a:1,h:0,self:1}],tx:'Ignore les Remparts. Chaque fois qu’il attaque le héros adverse, gagne +1 ATK.'},
  {r:3,st:'Le face, c’est la place',stl:'le face, c’est la place',c:4,a:4,h:4,kw:['hate'],noTaunt:1,noTauntAll:1,tx:'Hâte. Ignore les Remparts. Tes autres créatures ignorent aussi les Remparts.'}]},
miichi:{n:'Miichi',fac:['weebos','alien'],sc:{wow:1,dofus:0,lol:2,cs:0},sym:'🌸',col:'#d47fc0',lore:'Weeb venue d’ailleurs : elle a vu tous les animes, fini tous les jeux, et elle rush quand même.',v:[
  {r:1,st:'Cosplayeuse express',c:2,a:2,h:1,cry:[{t:'summon',k:'weeb',n:1}],tx:'Cri d’arrivée : invoque une Weeb 1/1 (Weebos).'},
  {r:2,st:'Speedrunneuse d’anime',c:3,a:3,h:2,kw:['hate'],aura:{fac:'weebos',a:1,others:1},tx:'Hâte. Tes autres Weebos ont +1 ATK.'},
  {r:3,st:'Waifu intergalactique',c:5,a:4,h:3,kw:['hate'],cry:[{t:'stealOr',n:2}],kwAura:{fac:'weebos',kw:'hate',others:1},tx:'Hâte. Cri d’arrivée : vole 2 Or à l’adversaire. Tes autres Weebos ont Hâte.'}]}};
// v22 : nouvelle légendaire
BASES.coach={n:'Le Coach',fac:['ravages'],sc:{wow:0,dofus:0,lol:1,cs:2},sym:'📣',col:'#c9773a',lore:'« Go go go ! » Il ne connaît qu’une stratégie : tout le monde fonce.',v:[
  {r:3,st:'Capitaine du rush',c:3,a:3,h:3,kw:['insolence'],atkLow:{max:3,n:2},tx:'Insolence. Chaque fois que tu attaques avec une créature qui coûte 3 ou moins, le héros adverse subit 2 dégâts.'}]};
const BASEK=Object.keys(BASES);

const CARDS={};
BASEK.forEach(b=>{const B=BASES[b];B.v.forEach((v,j)=>{const r=v.r||j+1;CARDS[b+r]=Object.assign({t:'c',n:B.n,base:b,art:b,r,fac:B.fac,sc:B.sc,lore:B.lore,sym:B.sym,col:B.col,withKw:B.withKw},v)})});
Object.assign(CARDS,{
// ----- jetons -----
pleb:{t:'c',n:'Pleb',r:1,c:1,a:1,h:1,fac:[],sc:{},tok:1,tx:'Jeton. Aucun effet.',sym:'·',col:'#81654c',lore:'Le rôle de base de chaque membre.'},
heritier:{t:'c',n:'Héritier',r:1,c:1,a:1,h:1,fac:[],sc:{},tok:1,kw:['croissance'],tx:'Jeton. Croissance.',sym:'♡',col:'#ae5e5a',lore:'Il grandit vite, comme son père… et il n’aime pas qu’on lui parle de LoL.'},
weeb:{t:'c',n:'Weeb',r:1,c:1,a:1,h:1,fac:['weebos'],sc:{},tok:1,tx:'Jeton (Weebos).',sym:'🌸',col:'#ca7f9f',lore:'Venu de la Japan Expo, il n’en est jamais reparti.'},
kiwi:{t:'c',n:'Kiwi',r:1,c:1,a:1,h:1,fac:[],sc:{},tok:1,tx:'Jeton.',sym:'🐈',col:'#b49e80',lore:'Le chat de Potatoll. Il griffe d’abord, il réfléchit ensuite.'},
waifu:{t:'c',n:'Waifu',r:1,c:1,a:1,h:1,fac:['weebos'],sc:{},tok:1,tx:'Jeton (Weebos).',sym:'💕',col:'#ca8aa9',lore:'Encore une, ramenée de voyage par Takk.'},
mmejack:{t:'c',n:'Mme Jak',r:1,c:2,a:3,h:4,fac:[],sc:{},tok:1,kw:['rempart'],tx:'Jeton. Une vache avec rempart?.',sym:'🐄',col:'#dbd1c5',lore:'La vache de Jak. Elle ne bouge pas beaucoup, mais elle a du caractère.'},
piccolo:{t:'c',n:'Piccolo',r:1,c:3,a:2,h:3,fac:['alien'],sc:{},tok:1,kw:['siphon'],tx:'Jeton (Extraterritorial). Siphon.',sym:'👽',col:'#8aab6b',lore:'Venu de Namek. Il a suivi Rasta dehors.'},
baveux:{t:'c',n:'Baveux',r:1,c:1,a:1,h:1,fac:[],sc:{},tok:1,kw:['deso'],tx:'Jeton. Désorienté.',sym:'?',col:'#ada398',lore:'Invoqué par Gobi, chef des baveux.'},
duck:{t:'c',n:'Canard',r:1,c:1,a:0,h:3,fac:[],sc:{},tok:1,tx:'Jeton. Aucun effet.',sym:'🦆',col:'#d0b44f',lore:'Coin coin. Il prend toute la place.'},
bot:{t:'c',n:'Bot de modération',r:1,c:3,a:2,h:5,fac:[],sc:{},tok:1,kw:['rempart'],tx:'Jeton. Rempart.',sym:'⚙',col:'#5e8987',lore:'Il applique le règlement, sans état d’âme.'},
chanssus:{t:'c',n:'Chanssus',r:1,c:1,a:0,h:0,fac:[],sc:{},tok:1,kw:['hate'],cry:[{t:'combo',a:1,h:1}],
  tx:'Jeton. Hâte. Cri d’arrivée : gagne +1/+1 pour chaque autre carte jouée ce tour.',sym:'✺',col:'#b3544b',lore:'Invoqué par Sadamie pour le combo le plus broken du monde.'},
chanssus0:{t:'c',n:'Chanssus truqué',r:1,c:0,a:1,h:1,fac:[],sc:{},tok:1,kw:['hate'],
  tx:'Jeton. Hâte.',sym:'✺',col:'#c9915b',lore:'Les dés étaient pipés depuis le début.'},
poutch:{t:'c',n:'Poutch',r:1,c:1,a:0,h:4,fac:[],sc:{},tok:1,tx:'Jeton. Aucun effet.',sym:'🥊',col:'#a58a5e',lore:'Le sac de frappe d’Incarnam. Il encaisse, il ne rend rien.'},
robot:{t:'c',n:'Robot explosif',r:1,c:1,a:1,h:1,fac:[],sc:{},tok:1,last:[{t:'rnd',n:3,times:1}],tx:'Jeton. Agonie : inflige 3 dégâts à un ennemi au hasard.',sym:'🤖',col:'#8a8f96',lore:'Fabriqué au Bazar. Garantie : aucune.'},
graine:{t:'c',n:'Graine',r:1,c:1,a:0,h:1,fac:[],sc:{},tok:1,tx:'Jeton. Sur l’Éco village : gagne +1/+1 au début de ton tour.',sym:'🌱',col:'#6f9a52',lore:'Cultivée sans pesticide, arrosée à l’eau de pluie.'},
wagon:{t:'c',n:'Wagon',r:1,c:1,a:1,h:1,fac:[],sc:{},tok:1,kw:['rempart'],tx:'Jeton. Rempart.',sym:'🚃',col:'#7d7466',lore:'Tout le monde à bord : le chef ne repassera pas.'},
// ----- sorts -----
ducksmuck:{t:'s',n:'Ducks in a muck',r:1,c:3,fx:[{t:'fillDucks'}],tx:'Remplit les deux plateaux avec des Canards 0/3, jusqu’à ce que chaque plateau soit plein.',sym:'🦆',col:'#d0b44f',lore:'Coin coin, du sol au plafond.'},
ping:{t:'s',n:'Ping',r:1,c:1,tg:'any',fx:[{t:'dmg',n:2}],tx:'Inflige 2 dégâts à une cible.',sym:'◎',col:'#af524f',lore:'@quelqu’un : une notification qui fait mal.'},
webhook:{t:'s',n:'Webhook',r:1,c:1,tg:'e',fx:[{t:'dmg',n:1},{t:'draw',n:1}],tx:'Inflige 1 dégât au héros adverse ou à une créature, et pioche 1 carte.',sym:'⇢',col:'#638ecf',lore:'Un petit message automatique, mais qui en déclenche d’autres.'},
boost:{t:'s',n:'Boost',r:1,c:2,tg:'ac',fx:[{t:'buff',a:2,h:1}],tx:'Une créature alliée gagne +2/+1.',sym:'⬆',col:'#ca7999',lore:'Merci pour le boost du serveur !'},
flame:{t:'s',n:'Flame',r:1,c:3,tg:'e',fx:[{t:'pz',n:3}],tx:'Ajoute 3 Venin au héros adverse ou à une créature.',sym:'🔥',col:'#869053',lore:'Un flame qui dérape et contamine tout le salon.'},
pizza:{t:'s',n:'Pizza Party',r:1,c:2,fx:[{t:'heal',n:4},{t:'healA',n:2,all:1}],tx:'Soigne ton héros de 4 PV et toutes tes créatures de 2 PV.',sym:'🍕',col:'#6c925d',lore:'Soirée pizzas à l’État Arcanique : tout le monde se sent mieux.'},
kick:{t:'s',n:'Kick',r:1,c:2,tg:'ec',fx:[{t:'kick'}],tx:'Kick une créature : elle retourne dans la main de son propriétaire.',sym:'⤴',col:'#5e8987',lore:'Un petit coup de pied hors du salon vocal.'},
mute:{t:'s',n:'Mute',r:1,c:1,tg:'ec',fx:[{t:'mute'}],tx:'Mute une créature : elle perd son texte et ses mots-clés.',sym:'🔇',col:'#5e8987',lore:'Le micro est coupé. Impossible de réunir ses idées.'},
spam:{t:'s',n:'Spam',r:1,c:2,fx:[{t:'summon',k:'pleb',n:3}],tx:'Invoque 3 Plebs 1/1.',sym:'❖',col:'#b4a364',lore:'Un appel général : tout le monde rapplique, même ceux qui n’étaient pas invités.'},
giveaway:{t:'s',n:'Giveaway',r:1,c:2,fx:[{t:'draw',n:2}],tx:'Pioche 2 cartes.',sym:'🎁',col:'#b3544b',lore:'Un giveaway tombé du ciel : tout le monde en profite.'},
botspell:{t:'s',n:'Mise à jour du Bot',r:1,c:3,fx:[{t:'summon',k:'bot',n:1}],tx:'Invoque un Bot 2/5 avec Rempart.',sym:'⚙',col:'#5e8987',lore:'Le bot de modération redémarre, plus strict que jamais.'},
nerf:{t:'s',n:'Nerf',r:2,c:1,tg:'ec',fx:[{t:'buff',a:-3,h:0}],tx:'Une créature perd 3 ATK définitivement.',sym:'▼',col:'#af524f',lore:'Notes de patch : trop fort, on baisse.'},
leave:{t:'s',n:'Quitter le serveur',r:2,c:1,tg:'ac',fx:[{t:'kill'},{t:'draw',n:2}],tx:'Détruit une de tes créatures (son Agonie se déclenche) et pioche 2 cartes.',sym:'🚪',col:'#5e8987',lore:'Elle claque la porte… et laisse sa trace derrière elle.'},
screenshot:{t:'s',n:'Screenshot',r:2,c:2,fx:[{t:'steal'},{t:'steal'}],tx:'Ajoute à ta main une copie de 2 cartes au hasard de la main adverse.',sym:'📸',col:'#638ecf',lore:'Win + Maj + S : il a tout vu.'},
flood:{t:'s',n:'Flood',r:2,c:3,fx:[{t:'disc',n:2}],tx:'L’adversaire défausse 2 cartes au hasard.',sym:'≋',col:'#638ecf',lore:'Cent messages en dix secondes : impossible de suivre.'},
premade:{t:'s',n:'Premade',r:2,c:3,fx:[{t:'buff',a:1,h:1,all:1}],tx:'Tes créatures gagnent +1/+1.',sym:'✦',col:'#b4a364',lore:'Quand on joue en premade, tout le monde progresse ensemble.'},
sanction:{t:'s',n:'Sanction',r:2,c:2,tg:'ec',tgf:'hurt',fx:[{t:'kill'}],tx:'Détruit une créature blessée.',sym:'⚖',col:'#5e8987',lore:'Un coup de marteau : la créature est bannie… enfin presque.'},
raid:{t:'s',n:'Raid',r:2,c:4,fx:[{t:'dmgAll',n:2,side:'e'},{t:'dmgFace',n:2}],tx:'Inflige 2 dégâts à tous les ennemis (héros compris).',sym:'✹',col:'#a34c49',lore:'Un raid de trolls déferle dans le salon général.'},
clutch:{t:'s',n:'Clutch',r:2,c:3,tg:'e',tg2:'any',fx:[{t:'dmg',n:3},{t:'heal2',n:3}],tx:'Inflige 3 dégâts à une cible, puis soigne une autre cible de 3 PV (héros compris).',sym:'♥',col:'#6c925d',lore:'1v4, 1 PV restant, et il le fait quand même.'},
slowmode:{t:'s',n:'Slowmode',r:2,c:5,fx:[{t:'blkAll'},{t:'draw',n:1}],tx:'Bloque toutes les créatures ennemies. Pioche 1 carte.',sym:'⏳',col:'#638ecf',lore:'Un message toutes les 6 heures. Le salon dort.'},
ragequit:{t:'s',n:'Ragequit',r:2,c:1,tg:'ac',fx:[{t:'rage'}],tx:'Détruit une de tes créatures : inflige son ATK à l’adversaire.',sym:'💢',col:'#af524f',lore:'Il claque sa souris et sa rage part dans la tronche de l’autre.'},
nitro:{t:'s',n:'Nitro',r:3,c:0,fx:[{t:'eth',n:2}],tx:'Gagne 2 Démoflux ce tour-ci.',sym:'⚡',col:'#ca7999',lore:'Merci pour le Nitro, génial donateur anonyme.'},
ban:{t:'s',n:'Ban',r:3,c:4,tg:'c',fx:[{t:'ban'}],tx:'Bannit une créature : aucune Agonie ne se déclenche.',sym:'⛔',col:'#5e8987',lore:'Le marteau tombe. Plus personne n’entendra parler d’elle.'},
everyone:{t:'s',n:'@everyone',r:3,c:4,fx:[{t:'dmgAll',n:4,side:'both'}],tx:'Inflige 4 dégâts à toutes les créatures.',sym:'@',col:'#a34c49',lore:'Il a osé. Tout le serveur est notifié, et tout le serveur le regrette.'},
reconnexion:{t:'s',n:'Reconnexion',r:3,c:2,fx:[{t:'rez'}],tx:'Invoque la dernière créature de ton cimetière.',sym:'↺',col:'#6c925d',lore:'« Je suis de retour, vous m’avez manqué ? »'},
toxicite:{t:'s',n:'Toxicité',r:3,c:5,fx:[{t:'pzAll',n:2}],tx:'Ajoute 2 Venin à tous les ennemis (créatures et héros).',sym:'☣',col:'#869053',lore:'Un message toxique et tout le salon est contaminé.'},
clip:{t:'s',n:'Clip',r:3,c:3,tg:'ac',fx:[{t:'clone'}],tx:'Invoque une copie d’une créature alliée.',sym:'🎬',col:'#ca7f60',lore:'Un clip à rejouer en boucle : la même action, deux fois.'},
// ----- sorts de famille : forts dans le bon deck, inutiles ailleurs (fam = famille concernée) -----
signalement:{t:'s',n:'Signalements',r:1,c:2,fam:'toxic',fx:[{t:'drawPz',n:1,max:3}],tx:'Pioche 1 carte, +1 pour chaque ennemi qui a du Venin (héros compris, 3 cartes max).',sym:'🚩',col:'#a6ba69',lore:'Signalé pour comportement toxique… par tout le salon, en même temps.'},
ambiance:{t:'s',n:'Ambiance toxique',r:2,c:1,fam:'toxic',fx:[{t:'pzBurst'}],tx:'Chaque créature ennemie subit autant de dégâts qu’elle a de Venin.',sym:'🤢',col:'#7b874b',lore:'Le vocal est devenu irrespirable. Même le bot est parti.'},
binge:{t:'s',n:'Binge-watching',r:1,c:3,fam:'weebos',cred:{f:'weebos',min:2},fx:[{t:'draw',n:2}],tx:'Coûte 1 de moins si tu contrôles un Weebos. Pioche 2 cartes.',sym:'📺',col:'#ca7999',lore:'« Encore un épisode. » Il est 6 h du matin.'},
genkidama:{t:'s',n:'Genkidama',r:1,c:2,fam:'weebos',tg:'ec',fx:[{t:'dmgFam',f:'weebos',n:0}],tx:'Inflige à une créature 1 dégât par Weebos que tu contrôles.',sym:'🔵',col:'#76a9d4',lore:'Weebos du monde entier, donnez-moi un peu de votre énergie !'},
achat:{t:'s',n:'Achat compulsif',r:1,c:0,fam:'farmer',fx:[{t:'goldDraw',max:6,per:2}],tx:'Dépense jusqu’à 6 Or : pioche 1 carte par tranche de 2 Or dépensés.',sym:'🛒',col:'#bea06f',lore:'On farme pour acheter, et on achète pour farmer.'},
p2w:{t:'s',n:'Pay to win',r:2,c:2,fam:'farmer',tg:'ec',fx:[{t:'goldDmg',max:5}],tx:'Dépense tout ton Or (5 max) : inflige autant de dégâts à une créature.',sym:'💳',col:'#a6895d',lore:'Pourquoi s’entraîner quand on peut payer ?'},
lowcost:{t:'s',n:'Vol low-cost',r:1,c:1,fam:'expats',tg:'ac',tgf:'f:expats',fx:[{t:'exilT'},{t:'draw',n:1}],tx:'Une de tes créatures Expats part à l’étranger (inciblable jusqu’à ton prochain tour). Pioche 1 carte.',sym:'🛫',col:'#75b5d6',lore:'Bagage cabine uniquement, siège non inclinable, café à 6 €.'},
valise:{t:'s',n:'Coup de valise',r:1,c:2,fam:'expats',tg:'ec',fx:[{t:'dmgEx',n:3,per:2}],tx:'Inflige 3 dégâts à une créature, +2 pour chaque créature que tu as à l’étranger.',sym:'🧳',col:'#6298b8',lore:'23 kg en soute, et toute la frustration du voyage.'},
folie:{t:'s',n:'Coup de folie',r:1,c:1,fam:'ravages',fx:[{t:'draw',n:2},{t:'discPick',n:1,if:{nfac:['ravages',2]}}],tx:'Pioche 2 cartes, puis défausse 1 carte de ton choix. Si tu contrôles 2 Ravagés ou plus, tu ne défausses rien.',sym:'🎲',col:'#c98859',lore:'Personne n’a compris le plan. Lui non plus.'},
soiree:{t:'s',n:'Soirée ravagée',r:2,c:2,fam:'ravages',fx:[{t:'rndFam',f:'ravages',n:2}],tx:'Lance 2 missiles, +1 par Ravagé que tu contrôles.',sym:'🎆',col:'#b77752',lore:'Le lendemain, personne ne se souvient de rien. Le salon, si.'},
immunite:{t:'s',n:'Immunité diplomatique',r:2,c:2,fam:'alien',fx:[{t:'exFam',f:'alien'},{t:'stealOr',n:'N-1',f:'alien'}],tx:'Tes Extraterritoriaux ne peuvent pas être attaqués ni ciblés par les effets ennemis jusqu’à ton prochain tour. Les effets aléatoires peuvent toutefois les atteindre. Vole N-1 Or à l’adversaire (N étant le nombre d’Extraterritoriaux que tu contrôles).',sym:'🛂',col:'#dbc37c',lore:'Valise diplomatique : on ne fouille pas.'},
enlevement:{t:'s',n:'Enlèvement',r:3,c:7,fam:'alien',cred:{f:'alien',min:0},tg:'ec',noAlly:1,tgf:'cf:alien',needSlot:1,fx:[{t:'ctl'}],tx:'Prends le contrôle d’une créature ennemie qui coûte au plus le nombre d’Extraterritoriaux que tu contrôles. Coûte 1 de moins pour chaque Extraterritorial que tu contrôles.',sym:'🛸',col:'#b5a86a',lore:'Un rayon lumineux, un « bip », et plus de voisin.'},
gatekeeping:{t:'s',n:'Gatekeeping',r:1,c:2,fam:'xeno',fx:[{t:'tempFam',f:'xeno',a:2},{t:'draw',n:1}],tx:'Tes Xénophobes gagnent +2 ATK pendant ce tour. Pioche 1 carte.',sym:'🙅',col:'#b5554a',lore:'« T’as pas le niveau pour venir ici. »'},
videur:{t:'s',n:'Réémigration prioritaire',r:2,c:1,fam:'xeno',tg:'ec',tgf:'cf:xeno',fx:[{t:'ban'}],tx:'Bannit une créature qui coûte au plus le nombre de Xénophobes que tu contrôles.',sym:'📋',col:'#9d4b41',lore:'Tamponné, plié, expédié. Le dossier n’a pas été lu.'},
mieuxavant:{t:'s',n:'C’était mieux avant',r:2,c:2,fam:'vestige',needSlot:1,fx:[{t:'rezFam',f:'vestige'}],tx:'Invoque le dernier Vestige de ton cimetière.',sym:'📼',col:'#b6aa93',lore:'« À l’époque, on jouait sans patch, et on était contents. »'},
nostalgie:{t:'s',n:'Nostalgie',r:1,c:2,fam:'vestige',fx:[{t:'drawFam',f:'vestige',n:1,max:3}],tx:'Pioche 1 carte, +1 par Vestige que tu contrôles (3 max).',sym:'🕰',col:'#9d927b',lore:'Il ressort les screenshots de 2009. Tout le monde a l’air si jeune.'},
// ----- sorts d'affinité : ils comptent l'affinité de tes créatures ou les terrains du jeu (gam = jeu concerné) -----
rois:{t:'s',n:'Bénédiction des rois',r:2,c:3,gam:'wow',fx:[{t:'buffAff',g:'wow'}],tx:'Tes créatures gagnent +1/+1 par point d’affinité WoW.',sym:'👑',col:'#c9ac71',lore:'Un buff de 30 minutes. Il dure toute la partie, c’est un bug.'},
drain:{t:'s',n:'Drain de vie',r:1,c:3,gam:'wow',tg:'ec',fx:[{t:'drainAff',g:'wow',max:5}],tx:'Inflige à une créature 1 dégât par point d’affinité WoW de tes créatures (5 max) et soigne ton héros d’autant.',sym:'🩸',col:'#8b60aa',lore:'Le démoniste ne s’arrête jamais de canaliser.'},
parchemin:{t:'s',n:'Parchemin de sagesse',r:1,c:1,gam:'dofus',fx:[{t:'drawAff',g:'dofus',lv:1,max:2}],tx:'Pioche 1 carte pour chaque créature que tu contrôles qui a une affinité Dofus (2 max).',sym:'📜',col:'#7faf72',lore:'+101 en Sagesse. Ça ne rend pas plus sage, mais ça aide.'},
feca:{t:'s',n:'Bouclier Féca',r:1,c:2,gam:'dofus',fx:[{t:'egideA',g:'dofus'}],tx:'Tes créatures qui ont une affinité Dofus gagnent Égide.',sym:'🛡',col:'#6b9363',lore:'Le Féca ne tape pas fort, mais personne ne le tape tout court.'},
flash:{t:'s',n:'Flash',r:1,c:2,gam:'lol',tg:'ac',fx:[{t:'flash',g:'lol',per:2}],tx:'Une de tes créatures peut attaquer dès ce tour et gagne +2 ATK par point d’affinité LoL pendant ce tour.',sym:'🏃',col:'#638ecf',lore:'Flash en 1v4. Coco approuve.'},
smite:{t:'s',n:'Smite',r:1,c:3,gam:'lol',tg:'ec',fx:[{t:'alt',c:{anyT:'lol'},a:[{t:'dmg',n:6}],b:[{t:'dmg',n:3}]}],tx:'Inflige 3 dégâts à une créature, ou 6 si tu contrôles une créature sur un terrain LoL.',sym:'🌩',col:'#b4a382',lore:'Le Nashor est à toi. Enfin, normalement.'},
fumigene:{t:'s',n:'Fumigène',r:1,c:2,gam:'cs',fx:[{t:'exilTer',g:'cs'},{t:'draw',n:1}],tx:'Tes créatures sur un terrain CS deviennent inciblables jusqu’à ton prochain tour. Pioche 1 carte.',sym:'💨',col:'#ca7f60',lore:'Il entre dans la smoke. Personne ne l’en a jamais vu ressortir.'},
headshot:{t:'s',n:'Headshot',r:2,c:3,gam:'cs',tg:'ec',fx:[{t:'alt',c:{aff:['cs',2]},a:[{t:'kill'}],b:[{t:'dmg',n:1}]}],tx:'Détruit une créature si tu contrôles une créature qui a 2 d’affinité CS ; sinon, inflige-lui 1 dégât.',sym:'⌖',col:'#d0a772',lore:'One tap. Pas de discussion.'},
smurf:{t:'s',n:'Smurf',r:1,c:1,tg:'ac',fx:[{t:'affAll',max:1},{t:'buff',a:1,h:1}],tx:'Une de tes créatures gagne +1/+1 et +1 d’affinité dans tous les jeux (1 max par créature).',sym:'🧢',col:'#7c75c5',lore:'Nouveau compte, même main. Il « découvre le jeu ».'},
freelance:{t:'s',n:'Freelance',r:1,c:0,tg:'ac',tgf:'nofam',fx:[{t:'buff',a:2,h:2}],tx:'Une de tes créatures sans famille gagne +2/+2.',sym:'💼',col:'#ada398',lore:'Pas de guilde, pas de clan, pas de patron. Que des factures.'},
multi:{t:'s',n:'Multi-casquettes',r:1,c:2,tg:'ac',fx:[{t:'buffFam',a:1,h:1,max:3}],tx:'Une de tes créatures gagne +1/+1 par famille à laquelle elle appartient (+3/+3 max).',sym:'🎩',col:'#b28ad3',lore:'Toxic le lundi, Farmer le mardi, Expat le reste de la semaine.'},
// ----- jetons sorts -----
cadeau:{t:'s',n:'Cadeau',r:1,c:0,tok:1,fx:[{t:'draw',n:1}],tx:'Jeton. Pioche 1 carte.',sym:'🎁',col:'#b3544b',lore:'Un petit paquet déposé au pied du sapin.'},
mirror:{t:'s',n:'Miroir de Kalandra',r:3,c:0,tok:1,needHand:1,fx:[{t:'dup'}],tx:'Jeton. Choisis une carte de ta main : une copie s’ajoute à ta main.',sym:'🪞',col:'#7fb0d6',lore:'« Il a drop un mirror. Le serveur entier s’arrête de jouer. »'},
piece:{t:'s',n:'Pièce',r:1,c:0,tok:1,fx:[{t:'eth',n:1}],tx:'Jeton. Gagne 1 Démoflux ce tour-ci.',sym:'●',col:'#dab77a',lore:'Pour le second joueur : un peu d’avance.'},
parisbrest:{t:'s',n:'Paris-Brest',r:1,c:0,tok:1,fx:[{t:'eth',n:2}],tx:'Jeton. Gagne 2 Démoflux ce tour-ci.',sym:'🥐',col:'#c99b5e',lore:'Pâte à choux, praliné, et une heure de sport en moins.'},
soupe:{t:'s',n:'Soupe savoureuse',r:1,c:1,tok:1,fx:[{t:'heal',n:5}],tx:'Jeton. Soigne ton héros de 5 PV.',sym:'🍲',col:'#b5703f',lore:'La recette de Mikalev. Il ne la donnera jamais.'},
saumon:{t:'s',n:'Saumon à l’unilatéral revigorant',r:1,c:1,tok:1,tg:'ac',fx:[{t:'buff',a:2,h:2}],tx:'Jeton. Une de tes créatures gagne +2/+2.',sym:'🐟',col:'#d98872',lore:'Cuit d’un seul côté, comme le veut la tradition.'}
});
Object.keys(CARDS).forEach(k=>{CARDS[k].k=k});
// ordre d'affichage normalisé : familles dans l'ordre de FACK, mots-clés dans l'ordre de KWORD (jamais « Farmer-Weebos » sur une carte et « Weebos-Farmer » sur une autre)
const KWORD=['vip','rempart','venin','siphon','hate','egide','croissance','frenesie','afk','insolence','tilt','respawn','deso','cleave'];
Object.values(CARDS).forEach(cd=>{if(cd.fac&&cd.fac.length>1)cd.fac=cd.fac.slice().sort((a,b)=>FACK.indexOf(a)-FACK.indexOf(b));
  if(cd.kw&&cd.kw.length>1)cd.kw=cd.kw.slice().sort((a,b)=>KWORD.indexOf(a)-KWORD.indexOf(b))});
// nom complet façon Magic : le titre suit le nom (« Lisdoon, patriarche ») ; stl = titre tel qu'il s'écrit dans le nom complet
function stOf(cd){return cd.stl||(cd.st?cd.st[0].toLowerCase()+cd.st.slice(1):'')}
function fullName(k){const cd=typeof k==='string'?CARDS[k]:k;return!cd?'':cd.st?cd.n+', '+stOf(cd):cd.n}
const POOL=Object.keys(CARDS).filter(k=>!CARDS[k].tok);                 // cartes collectionnables
// collection de départ : toutes les communes en 2 exemplaires
const STARTER=POOL.filter(k=>CARDS[k].r===1);

// ----- terrains (pioche commune, 1 exemplaire de chacun) -----
// f(affinité) -> effet sur la créature posée dessus : a/h stats, kw mots-clés, sot/eot début/fin de ton tour,
// arr quand une créature arrive dessus (pas quand le terrain est posé sous elle), last Agonie, vsC +ATK contre une créature, aram, noAtk
const TDEF=[
 {d:'rushb',g:'cs',n:'Rush B',size:2,cost:5,t1:'Hâte.',t2:'Hâte, +1 ATK.',f:x=>({kw:{hate:1},a:x>1?1:0})},
 {d:'smoke',g:'cs',n:'Smoke mid',size:1,cost:2,t1:'Insolence.',t2:'Insolence, +1/+1.',f:x=>({kw:{insolence:1},a:x>1?1:0,h:x>1?1:0})},
 {d:'awp',g:'cs',n:'Long A à l’AWP',size:1,cost:2,t1:'Début de ton tour : 1 dégât à une créature ennemie au hasard.',t2:'Début de ton tour : 2 dégâts à une créature ennemie au hasard.',f:x=>({sot:[{t:'rndC',n:x}]})},
 {d:'bomb',g:'cs',n:'Site A, bombe plantée',size:3,cost:5,t1:'+1 ATK.',t2:'+1 ATK. Fin de ton tour : 1 dégât au héros adverse.',f:x=>({a:1,eot:x>1?[{t:'dmgFace',n:1}]:null})},
 {d:'dust2',g:'cs',n:'Dust 2',size:2,cost:3,t1:'Tilt : gagne +1 ATK.',t2:'Tilt : gagne +1/+1.',f:x=>({tilt:[{t:'grow',a:1,h:x>1?1:0}]})},
 {d:'aram',g:'lol',n:'ARAM custom',size:2,cost:5,t1:'Arrivée : gagne un mot-clé au hasard (Hâte, Rempart, Égide, Venin, Siphon, Insolence ou Frénésie).',t2:'Arrivée : gagne deux mots-clés au hasard.',f:x=>({arr:[{t:'rndKw',n:x}]})},
 {d:'fontaine',g:'lol',n:'Fontaine',size:1,cost:1,t1:'Début de ton tour : récupère 3 PV.',t2:'Début de ton tour : récupère tous ses PV.',f:x=>({sot:[{t:'healSelf',n:x>1?99:3}]})},
 {d:'nashor',g:'lol',n:'Buff du Nashor',size:3,cost:7,t1:'+1 ATK.',t2:'+2/+1.',f:x=>({a:x,h:x>1?1:0})},
 {d:'jungle',g:'lol',n:'Jungle et Smite',size:2,cost:2,t1:'+1 ATK quand elle attaque une créature.',t2:'+2 ATK quand elle attaque une créature.',f:x=>({vsC:x})},
 {d:'zaap',g:'dofus',n:'Zaap d’Astrub',size:1,cost:3,t1:'Arrivée : pioche 1 carte, puis défausse 1 carte de ton choix.',t2:'Arrivée : pioche 1 carte.',f:x=>({arr:x>1?[{t:'draw',n:1}]:[{t:'draw',n:1},{t:'discPick',n:1}]})},
 {d:'bonta',g:'dofus',n:'Milice de Bonta',size:1,cost:6,t1:'Rempart.',t2:'Rempart, +1 PV.',f:x=>({kw:{rempart:1},h:x>1?1:0})},
 {d:'bouftou',g:'dofus',n:'Donjon Bouftou',size:3,cost:6,t1:'Fin de ton tour : +0/+1.',t2:'Fin de ton tour : +1/+1.',f:x=>({eot:[{t:'grow',a:x>1?1:0,h:1}]})},
 {d:'forge',g:'dofus',n:'Atelier de forgemagie',size:1,cost:5,t1:'Créature qui arrive dessus : gagne Égide.',t2:'Créature qui arrive dessus : gagne Égide et +1 ATK.',f:x=>({arr:x>1?[{t:'egide'},{t:'buff',a:1,h:0,self:1}]:[{t:'egide'}]})},
 {d:'sram',g:'dofus',n:'Temple Sram',size:1,cost:2,t1:'Arrivée : devient invisible (inciblable jusqu’à ton prochain tour).',t2:'Arrivée : devient invisible et gagne +1 ATK.',f:x=>({arr:x>1?[{t:'invis'},{t:'buff',a:1,h:0,self:1}]:[{t:'invis'}]})},
 {d:'taverne',g:'wow',n:'Taverne de Comté-de-l’Or',size:1,cost:5,t1:'Fin de ton tour : soigne ton héros de 2 PV.',t2:'Fin de ton tour : soigne ton héros de 3 PV.',f:x=>({eot:[{t:'heal',n:x+1}]})},
 {d:'hdv',g:'wow',n:'Hôtel des ventes',size:2,cost:4,t1:'Début de ton tour : gagne 1 Or.',t2:'Début de ton tour : gagne 2 Or.',f:x=>({sot:[{t:'or',n:x}]})},
 {d:'arene',g:'wow',n:'Arène 2v2',size:2,cost:4,t1:'+1 ATK si une autre de tes créatures est aussi sur l’arène.',t2:'+2 ATK si une autre de tes créatures est aussi sur l’arène.',f:x=>({duo:{a:x}})},
 {d:'raid40',g:'wow',n:'Raid 40 joueurs',size:3,cost:6,t1:'Siphon.',t2:'Siphon, +1 ATK.',f:x=>({kw:{siphon:1},a:x>1?1:0})},
 {d:'esprit',g:'wow',n:'Esprit guérisseur',size:1,cost:5,t1:'Agonie : ton héros récupère 3 PV.',t2:'Respawn : elle revient une fois, sans redéclencher ses effets.',f:x=>(x>1?{kw:{respawn:1},rsq:1}:{last:[{t:'heal',n:3}]})},
 {d:'canape',g:'bazar',n:'Le canapé de Xulyes',size:1,cost:1,tn:'+0/+1. Personne ne s’en est jamais relevé.',f:()=>({h:1})},
 {d:'kebab',g:'bazar',n:'Kebab de 4 h du mat’',size:1,cost:1,tn:'Agonie : soigne ton héros de 2 PV.',f:()=>({last:[{t:'heal',n:2}]})},
 {d:'vocal',g:'bazar',n:'Salon vocal AFK',size:1,cost:3,tn:'Rempart mais ne peut pas attaquer.',f:()=>({noAtk:1,kw:{rempart:1}})},
 {d:'andorre',g:'bazar',n:'Afterwork en Andorre',size:1,cost:2,tn:'Début de ton tour : gagne 1 Or.',f:()=>({eot:[{t:'or',n:1}]})},
 {d:'blizzard',g:'bazar',n:'Blizzard',size:2,cost:0,uniq:1,tn:'Terrain de Kirua, la reine des neiges : les créatures dessus ne peuvent pas attaquer. Il ne peut pas être détruit, peut être recouvert, disparaît quand elle meurt et dort tant qu’elle est Mute.',f:()=>({noAtk:1})},
 {d:'cave',g:'bazar',n:'La cave de Homz',size:2,cost:5,tn:'Fin de ton tour : lance 1 missile.',f:()=>({eot:[{t:'rnd',n:1,times:1}]})},
 {d:'minecraft',g:'bazar',n:'Serveur Minecraft',size:2,cost:4,tn:'Fin de ton tour : un Pleb 1/1 apparaît sur une case libre de ce terrain.',teot:'spawn',spawn:'pleb',f:()=>({})},
 {d:'gbazar',g:'bazar',n:'Le Grand Bazaar',size:7,cost:0,uniq:1,tn:'Terrain de Potatoll. Fin de ton tour : chaque créature dessus déclenche un effet du Bazar au hasard. Il disparaît quand Potatoll quitte le plateau, et dort tant qu’il est Mute.',f:()=>({eot:[{t:'bazaar'}]})},
 {d:'eco',g:'bazar',n:'Éco village',size:7,cost:0,uniq:1,tn:'Terrain de Coco. Fin de ton tour : une Graine 0/1 pousse sur chaque case libre. Début de ton tour : chaque Graine dessus gagne +1/+1.',teot:'seeds',f:()=>({sot:[{t:'seedGrow'}]})}];
const TD={};TDEF.forEach(t=>{t.e=t.g==='bazar'?[null,t.f(1),t.f(1)]:[null,t.f(1),t.f(2)];TD[t.d]=t});
function affOf(k,g){if(g==='bazar')return 1;const cd=CARDS[k];return(cd&&cd.sc&&cd.sc[g])||0}
function tTxt(t){return t.g==='bazar'?t.tn:'Affinité 1 : '+t.t1+' Affinité 2 : '+t.t2}

// effets du Grand Bazaar (Potatoll, fou du Bazar) : [nom, effet]
const BAZ=[
  ['Chaises musicales : les créatures ennemies changent de place',[{t:'shufE'}]],
  ['Bannissement d’une créature ennemie',[{t:'ban',rnd:'ec'}]],
  ['Tournée générale : tout le monde récupère 5 PV',[{t:'healAll',n:5}]],
  ['Pluie de pétards : 1 dégât à tous les ennemis',[{t:'dmgAll',n:1},{t:'dmgFace',n:1}]],
  ['Coupure de courant : l’adversaire perd 1 Démoflux maximum',[{t:'capDown',n:1}]],
  ['Robot explosif',[{t:'summon',k:'robot',n:1}]],
  ['Démolition d’un terrain ennemi',[{t:'tdestroy'}]],
  ['Fouille des poubelles : une carte du cimetière revient en main',[{t:'graveHand'}]],
  ['Pioche 1 carte',[{t:'draw',n:1}]],
  ['Coup de pied : 5 dégâts au héros adverse',[{t:'dmgFace',n:5}]],
  ['Une créature ennemie est Bloquée',[{t:'blk',rnd:1}]],
  ['Nuage toxique : 2 Venin à toutes les créatures',[{t:'pzAllC',n:2}]],
  ['La créature gagne Égide',[{t:'egide'}]]];
// artefacts : objets permanents posés dans la zone d'artefacts d'un joueur (Dofus légendaires de Gobi, collectionneur de Dofus)
const ARTS={
  pourpre:{n:'Dofus Pourpre',col:'#9b48c2',tx:'Tes créatures sur tes terrains Dofus ont +2 ATK.'},
  ocre:{n:'Dofus Ocre',col:'#d0882e',tx:'Début de ton tour : gagne 2 Démoflux de plus (au-delà du maximum si besoin).'},
  emeraude:{n:'Dofus Émeraude',col:'#3fa45f',tx:'Tes créatures sur tes terrains Dofus ont +2 PV.'},
  vulbis:{n:'Dofus Vulbis',col:'#4f7fd0',tx:'Tes créatures sur tes terrains Dofus ont Hâte.'},
  turquoise:{n:'Dofus Turquoise',col:'#34b5b0',tx:'Tes créatures ont Cleave 1.'},
  cawotte:{n:'Dofus Cawotte',col:'#e3782b',tx:'Fin de ton tour : pioche 2 cartes.'}};
const ARTK=Object.keys(ARTS),ARTMAX=3;
// événements de serveur (option « Événements du Bazar »)
const EVENTS=[
  {n:'Panne de Discord',tx:'Chaque joueur défausse 1 carte au hasard.',fx:[{t:'disc',n:1,both:1}]},
  {n:'Soirée pizza',tx:'Chaque héros récupère 5 PV.',fx:[{t:'heal',n:5,both:1}]},
  {n:'Raid de trolls',tx:'3 dégâts à une créature au hasard de chaque camp.',fx:[{t:'dmg',n:3,rnd:'c',both:1}]},
  {n:'Nitro offert',tx:'Chaque joueur gagne +1 Démoflux maximum.',fx:[{t:'cap',n:1,both:1}]},
  {n:'Ban wave',tx:'Chaque joueur bannit sa créature la plus coûteuse.',fx:[{t:'banTop',both:1}]},
  {n:'Giveaway général',tx:'Chaque joueur pioche 1 carte.',fx:[{t:'draw',n:1,both:1}]}];

// ----- réglages d'un défi -----
const OPTDEF={hp:30,tim:80,cap:10,ter:1,evt:0,hand:8,inc:1,rw:1,comp:1,mv:0,fat:1};
const COMP={hp:5,or:1};                                     // bonus du second joueur
const OPTSET=[
  {k:'tim',n:'Chrono par tour',v:[[0,'Aucun'],[45,'45 s'],[80,'80 s'],[120,'120 s']]},
  {k:'hp',n:'PV des héros',v:[[30,'30'],[40,'40'],[50,'50'],[60,'60']]},
  {k:'cap',n:'Démoflux maximum',v:[[8,'8'],[10,'10'],[12,'12']]},
  {k:'hand',n:'Taille de la main',v:[[8,'8'],[10,'10']]},
  {k:'inc',n:'Or par tour',v:[[1,'1'],[2,'2']]},
  {k:'ter',n:'Terrains',v:[[1,'Oui'],[0,'Non']]},
  {k:'evt',n:'Événements du Bazar (toutes les 3 manches)',v:[[0,'Non'],[1,'Oui']]},
  {k:'comp',n:'Bonus du second joueur (+'+COMP.hp+' PV, +'+COMP.or+' Or)',v:[[1,'Oui'],[0,'Non']]},
  {k:'fat',n:'Fatigue (deck épuisé : 1 dégât au début de chaque tour, puis 2, 3…)',v:[[1,'Oui'],[0,'Non']]},
  {k:'rw',n:'Récompenses en 💎',v:[[1,'Oui'],[0,'Duel amical']]}];

const ART=Object.fromEntries(Object.entries(ART_PATHS).map(([key,path])=>[key,path]));
// illustrations des terrains (clés « ter_ » de ART) : tuiles de la boutique, fiche du terrain, page des terrains
TDEF.forEach(t=>{t.img=ART['ter_'+t.d]||null});
// illustration : celle de la version (ex. boku2) si elle existe, sinon celle du personnage
function artOf(k){const cd=CARDS[k];return cd?(ART[k]||ART[cd.art||k]):null}
