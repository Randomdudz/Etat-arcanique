// ============ UI : outils, cartes, infobulles, fenêtres ============
const $=(s,r)=>(r||document).querySelector(s);
const $$=(s,r)=>[...(r||document).querySelectorAll(s)];
function h(tag,a,...kids){
  const e=document.createElement(tag);
  if(a)for(const k in a){const v=a[k];if(v==null||v===false)continue;
    if(k==='class')e.className=v;else if(k==='style')e.style.cssText=v;else if(k.slice(0,2)==='on')e.addEventListener(k.slice(2),v);
    else if(k==='html')e.innerHTML=v;else e.setAttribute(k,v===true?'':v)}
  for(const c of kids.flat(9)){if(c==null||c===false)continue;e.append(c.nodeType?c:document.createTextNode(String(c)))}
  return e}
function rint(a,b){return a+Math.floor(Math.random()*(b-a+1))}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}

// ----- icônes SVG (couleur = currentColor, --ic2 = évidement) -----
const ICONS={
 play:'<g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4l10 10M20 4L10 14"/><path d="M11 17l6-6M13 17L7 11"/><path d="M14 14l5 5M10 14l-5 5"/></g><circle cx="19.7" cy="19.7" r="1.7"/><circle cx="4.3" cy="19.7" r="1.7"/>',
 shop:'<path d="M5.5 8.5h13l1.2 11.2a1 1 0 0 1-1 1.1H5.3a1 1 0 0 1-1-1.1z"/><path d="M8.8 8.5V7a3.2 3.2 0 0 1 6.4 0v1.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M12 11.4l1.1 2.3 2.5.3-1.8 1.7.5 2.5-2.3-1.3-2.3 1.3.5-2.5-1.8-1.7 2.5-.3z" fill="var(--ic2,#17110b)"/>',
 coll:'<rect x="2.5" y="5.5" width="10" height="14" rx="2" transform="rotate(-14 7.5 12.5)" opacity=".55"/><rect x="11.5" y="5.5" width="10" height="14" rx="2" transform="rotate(14 16.5 12.5)" opacity=".55"/><rect x="7" y="3.5" width="10" height="16" rx="2.2"/><path d="M12 8.2l2.1 2.6-2.1 2.6-2.1-2.6z" fill="var(--ic2,#17110b)"/>',
 decks:'<rect x="4" y="3.5" width="16" height="4.2" rx="1.6"/><rect x="3" y="9.9" width="18" height="4.2" rx="1.6" opacity=".75"/><rect x="2" y="16.3" width="20" height="4.2" rx="1.6" opacity=".5"/>',
 friends:'<circle cx="9" cy="8" r="3.4"/><path d="M2.5 20.2c0-3.7 2.9-6.2 6.5-6.2s6.5 2.5 6.5 6.2z"/><circle cx="17.2" cy="9" r="2.7" opacity=".7"/><path d="M16.2 14.3c3 .1 5.3 2.1 5.3 5.4h-4.6c0-2-.4-3.6-.7-5.4z" opacity=".7"/>',
 code:'<circle cx="8" cy="12" r="5"/><circle cx="8" cy="12" r="1.9" fill="var(--ic2,#17110b)"/><path d="M12.5 10.8H21v2.6h-2v2.6h-2.6v-2.6h-3.9z"/>',
 timer:'<circle cx="12" cy="13.2" r="7.8" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M12 8.6v4.8l3.2 1.8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M9.2 2.8h5.6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
 guide:'<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" opacity=".55"/><path d="M5 17a3 3 0 0 1 3-3h11v6H8a3 3 0 0 1-3-3z"/>',
 acct:'<circle cx="12" cy="7.6" r="3.9"/><path d="M4.3 20.6c0-4.4 3.4-7.4 7.7-7.4s7.7 3 7.7 7.4z"/><path d="M15.6 18.4h5.2a2.2 2.2 0 0 0 .2-4.4 3 3 0 0 0-5.7-.8 2.3 2.3 0 0 0 .3 5.2z" fill="var(--ic2,#17110b)" stroke="currentColor" stroke-width="1.3"/>',
 gear:'<circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M18.5 5.5l-2.1 2.1M7.6 16.4l-2.1 2.1" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
 hist:'<path d="M5 3.5h14v17l-3.5-2-3.5 2-3.5-2L5 20.5z" opacity=".9"/><path d="M8.5 8h7M8.5 11.5h7M8.5 15h4" stroke="var(--ic2,#17110b)" stroke-width="1.8" stroke-linecap="round"/>',
 terr:'<path d="M1.8 20 L8.6 7.6 L12.6 14 L15.6 9.6 L22.2 20Z"/><path d="M8.6 7.6 L10.4 10.6 L8.6 9.8 L7 10.9Z" fill="var(--ic2,#17110b)" opacity=".6"/>',
 kw:'<path d="M3 12.4 L11.4 4 H20 V12.6 L11.6 21Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><circle cx="15.8" cy="8.2" r="1.9"/>',
 trash:'<path d="M5 7h14M10 4h4M7 7l1 13h8l1-13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M10.5 10.5v6M13.5 10.5v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
 copy:'<rect x="8" y="8" width="12" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 16V5a2 2 0 0 1 2-2h9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
 link:'<path d="M10 14a4 4 0 0 0 5.7 0l3.6-3.6a4 4 0 0 0-5.7-5.7L12 6.3M14 10a4 4 0 0 0-5.7 0l-3.6 3.6a4 4 0 0 0 5.7 5.7L12 17.7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
 adduser:'<circle cx="9" cy="8" r="3.6"/><path d="M2.5 20.5c0-3.9 2.9-6.5 6.5-6.5s6.5 2.6 6.5 6.5z"/><path d="M18.5 7.5v6M15.5 10.5h6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
 chat:'<path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H10l-4.5 3.5V17H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/><circle cx="8.5" cy="11" r="1.3" fill="var(--ic2,#17110b)"/><circle cx="12" cy="11" r="1.3" fill="var(--ic2,#17110b)"/><circle cx="15.5" cy="11" r="1.3" fill="var(--ic2,#17110b)"/>',
 swap:'<path d="M4 8h14l-3.5-3.5M20 16H6l3.5 3.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
 upload:'<path d="M12 15V4M7.5 8.5L12 4l4.5 4.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
 close:'<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
 cal:'<rect x="3.5" y="5" width="17" height="15.5" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
 pen:'<path d="M4 20 L5 15 L16 4 L20 8 L9 19Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M13.5 6.5 L17.5 10.5" stroke="currentColor" stroke-width="2"/>'};
function ico(n,cls){const e=document.createElement('span');e.className='icw'+(cls?' '+cls:'');e.style.display='contents';
  e.innerHTML='<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">'+(ICONS[n]||'')+'</svg>';return e.firstChild}
const EMBLEM='<svg viewBox="0 0 64 64"><defs><linearGradient id="lgE" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbeec4"/><stop offset=".55" stop-color="#e2c072"/><stop offset="1" stop-color="#a77c35"/></linearGradient></defs><circle cx="32" cy="32" r="17" fill="none" stroke="url(#lgE)" stroke-width="2"/><polygon points="32.0,2.0 35.1,24.6 41.2,22.8 39.4,28.9 62.0,32.0 39.4,35.1 41.2,41.2 35.1,39.4 32.0,62.0 28.9,39.4 22.8,41.2 24.6,35.1 2.0,32.0 24.6,28.9 22.8,22.8 28.9,24.6" fill="url(#lgE)" stroke="#3a2a12" stroke-width=".9"/><circle cx="32" cy="32" r="4.2" fill="#fff2c8"/></svg>';

// ----- terrains, familles, affinités : visuels -----
// icône d'un jeu : le vrai logo (WoW, Dofus, LoL, CS), l'emoji pour les terrains neutres
// icônes des jeux et illustrations en URL blob: : chaque image est décodée une seule fois, et les grilles de 140 cartes ne recopient plus des chaînes de plusieurs Ko
const blobURL=(data,type)=>{try{return URL.createObjectURL(new Blob([data],{type}))}catch(e){return null}};
const GURI={};for(const g in GSVG)GURI[g]=blobURL(GSVG[g],'image/svg+xml')||'data:image/svg+xml,'+encodeURIComponent(GSVG[g]);
(()=>{for(const k in ART){const v=ART[k],i=v.indexOf(',');if(!v.startsWith('data:')||v.slice(i-7,i)!==';base64')continue;
  try{const s=atob(v.slice(i+1)),u=new Uint8Array(s.length);for(let j=0;j<s.length;j++)u[j]=s.charCodeAt(j);const b=blobURL(u,v.slice(5,i-7));if(b)ART[k]=b}catch(e){}}
  TDEF.forEach(t=>{t.img=ART['ter_'+t.d]||null})})();
// grille de cartes rendue par paquets : le premier écran tout de suite, le reste pendant les temps morts (l'écran ne fige plus)
function fillGrid(grid,list,mk,first){const g=grid._gen=(grid._gen||0)+1;let i=0;
  const put=n=>{const f=document.createDocumentFragment();for(const e=Math.min(list.length,i+n);i<e;i++)f.append(mk(list[i]));grid.append(f)};
  put(first||28);if(i>=list.length)return;
  const idle=window.requestIdleCallback?(f=>requestIdleCallback(f,{timeout:150})):(f=>setTimeout(()=>f({timeRemaining:()=>10}),16));
  const more=dl=>{if(grid._gen!==g||!grid.isConnected)return;do put(4);while(i<list.length&&dl.timeRemaining()>5);if(i<list.length)idle(more)};idle(more)}
function gi(g){return GURI[g]?h('img',{class:'gico',src:GURI[g],alt:GAMES[g].n,draggable:'false'}):h('span',{class:'gico ge'},GAMES[g]?GAMES[g].ic:'?')}
function pips(n,max){return h('b',null,Array.from({length:max||2},(_,j)=>h('i',{class:j<n?'f':''})))}
function szEl(n){return h('span',{class:'tsz'},Array.from({length:n},()=>h('i')))}
// effet d'un terrain pour une créature donnée (texte)
function terrFor(k,d){const t=TD[d],a=affOf(k,t.g);if(t.g==='bazar')return{a:1,tx:t.tn};if(!a)return{a:0,tx:'aucun effet (affinité 0)'};return{a,tx:a>1?t.t2:t.t1}}
function terrFxEl(t){
  if(t.g==='bazar')return h('div',{class:'tiers',style:'--gc:'+GAMES.bazar.c},h('div',{class:'tier on'},h('span',{class:'tn'},'Tous'),h('span',null,t.tn)));
  const g=GAMES[t.g];
  return h('div',{class:'tiers',style:'--gc:'+g.c},
    h('div',{class:'tier on'},h('span',{class:'tn'},gi(t.g),' 1'),h('span',null,t.t1)),
    h('div',{class:'tier on'},h('span',{class:'tn'},gi(t.g),' 2'),h('span',null,t.t2)),
    h('div',{class:'tier'},h('span',{class:'tn'},gi(t.g),' 0'),h('span',{class:'mut'},'Affinité 0 : aucun effet.')))}
function tcardEl(t,o){o=o||{};const td=TD[t.d],g=GAMES[td.g];
  return h('div',{class:'tcard'+(td.img?' wimg':''),style:'--gc:'+g.c},o.cost!=null?h('span',{class:'tp'},'🪙'+o.cost):null,
    td.img?h('div',{class:'timg'},h('img',{src:td.img,alt:'',draggable:'false'})):null,h('span',{class:'tg'},gi(td.g)),h('b',null,td.n),szEl(td.size))}
function miniAv(k){const cd=CARDS[k],a=artOf(k);return a?h('img',{src:a,alt:''}):h('u',{style:'background:'+(cd.col||'#423c34')},cd.sym||'✦')}
function memEl(k){return h('span',{class:'mem',style:'border-color:'+RCOL[CARDS[k].r],onclick:()=>showCard(k)},miniAv(k),fullName(k))}
// versions existantes d'un personnage (les nouveaux n'ont pas encore leurs 3 raretés)
function versOf(b){return[1,2,3].filter(r=>CARDS[b+r])}
function baseEl(b){const B=BASES[b],k0=b+versOf(b)[0];return h('span',{class:'mem',onclick:()=>showCard(k0)},miniAv(k0),B.n,h('span',{class:'rd'},versOf(b).map(r=>h('i',{style:'background:'+RCOL[r]}))))}
// pastille « Légendaire » : les légendaires se repèrent d'un coup d'œil dans les listes et résumés de deck
function legBadge(){return h('span',{class:'legt',title:'Carte légendaire'},'★ Légendaire')}
function facTiers(f,n){const F=FAC[f];
  return h('div',{class:'tiers',style:'--gc:'+F.c},F.tiers.map(t=>h('div',{class:'tier'+(n>=t[0]?' on':'')},h('span',{class:'tn'},'×'+t[0]),h('span',null,t[1]))))}
function facTag(f,n){if(n<2)return null;
  return({toxic:'☠+'+(n-1),weebos:n>=5?'+1 PV 🛡':n>=3?'+1 PV':null,farmer:'+'+Math.min(4,n)+'🪙',expats:'✈ '+exCost(n)+'🪙',ravages:'🚀×'+(n-1),alien:'vol '+(n-1)+'🪙',xeno:n>=3?'+'+(n-1)+' ATK':'+1 ATK 👽',vestige:'+'+Math.floor(n/2)+' PV'})[f]}

// ----- texte des cartes avec mots-clés survolables -----
const KWRE=new RegExp('(?<![\\p{L}])(?:'+GLOS.map(g=>g[0].source).join('|')+')(?![\\p{L}])','gu');
const GLOSA=GLOS.map(g=>[new RegExp('^(?:'+g[0].source+')$'),g[1]]);
function defOf(w){for(const g of GLOSA)if(g[0].test(w))return g[1];return null}
function txNodes(tx){
  const out=[];let last=0,m;KWRE.lastIndex=0;
  while((m=KWRE.exec(tx))){const d=defOf(m[0]);if(!d)continue;
    if(m.index>last)tokNodes(tx.slice(last,m.index),out);
    out.push(h('span',{class:'kw','data-t':m[0],'data-d':d},m[0]));last=m.index+m[0].length}
  if(last<tx.length)tokNodes(tx.slice(last),out);return out}
// ----- jetons et cartes créées par les effets (absentes de la collection : Plebs, plats de Mikalev, Miroir…) -----
// leur nom dans un texte s'affiche en aperçu au survol, et la fiche d'une carte liste les cartes qu'elle crée
const TOKA={};for(const k in CARDS)if(CARDS[k].tok&&!TOKA[CARDS[k].n])TOKA[CARDS[k].n]=k;TOKA['Bot']='bot';
const TOKRE=new RegExp('(?<![\\p{L}])('+Object.keys(TOKA).sort((a,b)=>b.length-a.length).map(n=>n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')s?(?![\\p{L}’\'-])','gu');
function tokNodes(s,out){let last=0,m;TOKRE.lastIndex=0;
  while((m=TOKRE.exec(s))){const k=TOKA[m[1]];if(!k)continue;if(m.index>last)out.push(s.slice(last,m.index));
    out.push(h('span',{class:'tkn','data-hk':k},m[0]));last=m.index+m[0].length}
  if(last<s.length)out.push(s.slice(last))}
function madeOf(k){const cd=CARDS[k],r=new Set();if(!cd)return[];
  const scan=o=>{if(o==null)return;if(typeof o==='string'){if(o!==k&&CARDS[o]&&CARDS[o].tok)r.add(o);return}
    if(Array.isArray(o))return o.forEach(scan);if(typeof o==='object')for(const f in o)if(typeof o[f]==='object'||f==='k'||f==='spawn')scan(o[f])};
  scan(cd);if(cd.killLoot)r.add('mirror');
  TOKRE.lastIndex=0;let m;while((m=TOKRE.exec(cd.tx||''))){const t=TOKA[m[1]];if(t&&t!==k)r.add(t)}
  return[...r]}
function madeRow(k,big){const L=madeOf(k);if(!L.length)return null;
  return h('div',{class:'made'},h('div',{class:'mdh'},'Cartes créées par ses effets'),
    h('div',{class:'mdl'},L.map(t=>big?h('div',{class:'mdc',title:fullName(CARDS[t])+' : '+(CARDS[t].tx||''),onclick:()=>showCard(t)},cardEl(t)):mini(t))))}
function defsFor(k,extra){
  const cd=CARDS[k],txt=(cd.tx||'')+' '+(extra||''),seen={},out=[];KWRE.lastIndex=0;let m;
  const add=(w,d)=>{if(!d)return;const n=GLOSA.findIndex(g=>g[0].test(w));if(seen[n])return;seen[n]=1;out.push([w,d])};
  while((m=KWRE.exec(txt)))add(m[0],defOf(m[0]));
  (cd.kw||[]).forEach(x=>{const nm=KWI[x][0];add(nm,defOf(nm))});
  if(cd.reset)add('Reset',defOf('Reset'));if(cd.gr)add('Gremlin',defOf('Gremlin'));
  return out}

// ----- carte -----
const KWORDER=KWORD;                                               // ordre normalisé (data.js)
const RPSI={p:'✊',f:'✋',c:'✌️'};                                                       // Osiris (expert bluffeur) : pierre, feuille, ciseaux
function rpsOf(V,c){const r=c&&(V.rps||[]).find(x=>x.id===c.id);return r?r.v:null}
function osirisUp(V,s){return V.p[s].board.some(c=>c&&!c.mut&&(CARDS[c.k].eot||[]).some(o=>o.t==='rps'))}
function artNode(k){
  const cd=CARDS[k],a=artOf(k);
  if(a)return h('img',{src:a,alt:'',draggable:'false'});
  return h('div',{class:'sy',style:'background:radial-gradient(circle at 50% 40%,'+(cd.col||'#5e8987')+'dd,'+(cd.col||'#5e8987')+'33 72%,#130e07)'},cd.sym||'✦')}
function backEl(){return h('div',{class:'card cardback'},h('div',{class:'ci'}))}
function affRow(k){const cd=CARDS[k];return h('div',{class:'afr kw','data-t':'Affinités','data-d':defOf('Affinité')},AFG.map(g=>{const a=(cd.sc&&cd.sc[g])||0;
  return h('span',{class:a?'':'z',style:'--gc:'+GAMES[g].c,title:'Affinité '+GAMES[g].n+' : '+a},gi(g),pips(a))}))}
// o : {bd plateau, cr créature, E stats effectives, L familles, big, cost, cls[]}
// le nom complet (« Lisdoon, patriarche ») rapetisse quand il est long, comme sur une carte Magic
// familles qui colorent le cadre d'une carte : celles de la créature, ou celle d'un sort de famille
function famsOf(cd){return cd.t==='c'?(cd.fac||[]).slice(0,2):(cd.fam?[cd.fam]:[])}
function nmCls(cd){const n=fullName(cd).length;return n>29?' n4':n>24?' n3':n>19?' n2':n>15?' n1':''}
// ligne de type, entre l'illustration et le texte : « Sort · Toxic », familles de la créature… et la gemme de rareté à droite
// icônes des familles, dessinées en SVG (identiques sur tous les appareils, contrairement aux émojis) ; --fcd = teinte sombre de la famille
const FAMSVG={"toxic": "<path d=\"M10.35 9.14L7.2 3.69A9.6 9.6 0 0 1 16.8 3.69L13.65 9.14A3.3 3.3 0 0 0 10.35 9.14ZM15.3 12L21.6 12A9.6 9.6 0 0 1 16.8 20.31L13.65 14.86A3.3 3.3 0 0 0 15.3 12ZM10.35 14.86L7.2 20.31A9.6 9.6 0 0 1 2.4 12L8.7 12A3.3 3.3 0 0 0 10.35 14.86Z\"/><circle cx=\"12\" cy=\"12\" r=\"2\"/>", "weebos": "<g transform=\"rotate(0 12 12)\"><circle cx=\"12\" cy=\"7.1\" r=\"3.6\"/><path d=\"M11 3.4 12 5 13 3.4z\" style=\"fill:var(--fcd)\"/></g><g transform=\"rotate(72 12 12)\"><circle cx=\"12\" cy=\"7.1\" r=\"3.6\"/><path d=\"M11 3.4 12 5 13 3.4z\" style=\"fill:var(--fcd)\"/></g><g transform=\"rotate(144 12 12)\"><circle cx=\"12\" cy=\"7.1\" r=\"3.6\"/><path d=\"M11 3.4 12 5 13 3.4z\" style=\"fill:var(--fcd)\"/></g><g transform=\"rotate(216 12 12)\"><circle cx=\"12\" cy=\"7.1\" r=\"3.6\"/><path d=\"M11 3.4 12 5 13 3.4z\" style=\"fill:var(--fcd)\"/></g><g transform=\"rotate(288 12 12)\"><circle cx=\"12\" cy=\"7.1\" r=\"3.6\"/><path d=\"M11 3.4 12 5 13 3.4z\" style=\"fill:var(--fcd)\"/></g><circle cx=\"12\" cy=\"12\" r=\"2.3\" style=\"fill:var(--fcd)\"/><circle cx=\"12\" cy=\"12\" r=\"1\"/>", "farmer": "<path d=\"M12 21.5V6.2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\"/><ellipse cx=\"9.7\" cy=\"15.6\" rx=\"1.75\" ry=\"2.9\" transform=\"rotate(-38 9.7 15.6)\"/><ellipse cx=\"14.3\" cy=\"15.6\" rx=\"1.75\" ry=\"2.9\" transform=\"rotate(38 14.3 15.6)\"/><ellipse cx=\"9.7\" cy=\"11.6\" rx=\"1.75\" ry=\"2.9\" transform=\"rotate(-38 9.7 11.6)\"/><ellipse cx=\"14.3\" cy=\"11.6\" rx=\"1.75\" ry=\"2.9\" transform=\"rotate(38 14.3 11.6)\"/><ellipse cx=\"9.9\" cy=\"7.8\" rx=\"1.75\" ry=\"2.9\" transform=\"rotate(-34 9.9 7.8)\"/><ellipse cx=\"14.1\" cy=\"7.8\" rx=\"1.75\" ry=\"2.9\" transform=\"rotate(34 14.1 7.8)\"/><ellipse cx=\"12\" cy=\"4.6\" rx=\"1.6\" ry=\"2.6\"/>", "expats": "<path transform=\"rotate(42 12 12)\" d=\"M12 2.4c1 0 1.4 1.1 1.4 2.1v5l7.6 4.6v2l-7.6-2.4v4.6l2.2 1.6v1.6L12 20.6l-3.6.9v-1.6l2.2-1.6v-4.6L3 16.1v-2l7.6-4.6v-5c0-1 .4-2.1 1.4-2.1z\"/>", "ravages": "<path d=\"M11 12a1.1 1.1 0 0 1 2.2 0a2.3 2.3 0 0 1-4.6 0a3.5 3.5 0 0 1 7 0a4.7 4.7 0 0 1-9.4 0a5.9 5.9 0 0 1 11.8 0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" transform=\"translate(12.7 12) scale(1.18) translate(-12 -12)\"/>", "alien": "<path d=\"M12 2.8c-5.1 0-7.6 3.6-7.6 7.4 0 4.5 4.1 9.1 7.6 11 3.5-1.9 7.6-6.5 7.6-11 0-3.8-2.5-7.4-7.6-7.4z\"/><ellipse cx=\"8.8\" cy=\"11.6\" rx=\"2.7\" ry=\"1.55\" transform=\"rotate(32 8.8 11.6)\" style=\"fill:var(--fcd)\"/><ellipse cx=\"15.2\" cy=\"11.6\" rx=\"2.7\" ry=\"1.55\" transform=\"rotate(-32 15.2 11.6)\" style=\"fill:var(--fcd)\"/>", "xeno": "<rect x=\"5.6\" y=\"12.6\" width=\"1.9\" height=\"6.6\"/><rect x=\"16.5\" y=\"12.6\" width=\"1.9\" height=\"6.6\"/><rect x=\"3.9\" y=\"18.8\" width=\"5.3\" height=\"1.7\" rx=\".6\"/><rect x=\"14.8\" y=\"18.8\" width=\"5.3\" height=\"1.7\" rx=\".6\"/><rect x=\"2.6\" y=\"6.2\" width=\"18.8\" height=\"6.8\" rx=\"1\"/><path d=\"M6.8 6.2h2.6l-3.2 6.8H3.6 z\" style=\"fill:var(--fcd)\"/><path d=\"M11.6 6.2h2.6l-3.2 6.8H8.4 z\" style=\"fill:var(--fcd)\"/><path d=\"M16.4 6.2h2.6l-3.2 6.8H13.2 z\" style=\"fill:var(--fcd)\"/><circle cx=\"5.2\" cy=\"4.6\" r=\"1.3\"/><circle cx=\"18.8\" cy=\"4.6\" r=\"1.3\"/>", "vestige": "<path d=\"M12 2.6l9.2 4.9H2.8z\"/><rect x=\"3.4\" y=\"8.3\" width=\"17.2\" height=\"1.6\" rx=\".3\"/><rect x=\"5\" y=\"10.6\" width=\"2\" height=\"7.6\" rx=\".4\"/><rect x=\"9\" y=\"10.6\" width=\"2\" height=\"7.6\" rx=\".4\"/><rect x=\"13\" y=\"10.6\" width=\"2\" height=\"7.6\" rx=\".4\"/><rect x=\"17\" y=\"10.6\" width=\"2\" height=\"7.6\" rx=\".4\"/><rect x=\"3\" y=\"18.8\" width=\"18\" height=\"1.6\" rx=\".3\"/><rect x=\"2.2\" y=\"20.8\" width=\"19.6\" height=\"1.4\" rx=\".3\"/>"};
const FAMICO={};
function famIco(f){if(!FAMSVG[f])return document.createTextNode(FAC[f]?FAC[f].ic:'');
  if(!FAMICO[f]){const t=document.createElement('template');t.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+FAMSVG[f]+'</svg>';FAMICO[f]=t.content.firstChild}
  return FAMICO[f].cloneNode(true)}
// médaillon d'une famille (bandeau des cartes, filtres, decks…) : son nom et son effet au survol
function famBadge(f,cls){return h('i',{class:'fm'+(cls?' '+cls:''),style:'--fc:'+FAC[f].c,'data-tipf':f,'aria-label':FAC[f].n},famIco(f))}
function typeLine(cd){
  const isC=cd.t==='c',fams=isC?(cd.fac||[]):(cd.fam?[cd.fam]:[]),it=[];let len=0;
  if(!isC){it.push(h('b',{class:'ty'},'Sort'));len+=5}else if(cd.tok){it.push(h('b',{class:'ty'},'Jeton'));len+=6}
  if(cd.gam){it.push(h('i',{class:'gm',style:'--fc:'+GAMES[cd.gam].c,title:'Sort d’affinité '+GAMES[cd.gam].n},gi(cd.gam),h('em',null,GAMES[cd.gam].n)));len+=GAMES[cd.gam].n.length+3}
  if(isC&&!cd.tok&&!fams.length){it.push(h('b',{class:'ty'},'Créature'));len+=8}
  // familles : médaillons centrés sur le bandeau, sans leur nom
  return h('div',{class:'tl'+(len>27?' n3':len>21?' n2':len>16?' n1':'')},h('span',{class:'tlx'},it),fams.length?h('span',{class:'fms'},fams.map(f=>famBadge(f))):null,h('i',{class:'rg',title:RAR[cd.r]}))}
// ATK et PV comparées à la valeur imprimée sur la carte : 'up' au-dessus (vert), 'dn' en dessous (rouge)
function stc(v,o){return v>o?'up':v<o?'dn':''}
function cardEl(k,o){
  o=o||{};if(!k||k==='?'||!CARDS[k])return backEl();
  const cd=CARDS[k],isC=cd.t==='c',E=o.E,cr=o.cr;
  const cls=['card',isC?'c':'s','r'+cd.r];if(o.bd)cls.push('bd');if(o.big)cls.push('big');
  if(cr&&cr.eg)cls.push('eg');if(cr&&cr.mut)cls.push('mut-x');if(cr&&cr.ex)cls.push('exil');if(o.tilt)cls.push('tilt');if(o.cls)cls.push(...o.cls);
  // plateau : effets de combat visibles sur la carte (Rempart, AFK, Tilt, Venin, Bloquée...)
  if(o.bd&&cr&&E){if(E.kw.rempart)cls.push('rp');if(E.kw.afk&&!cr.aw)cls.push('afkx');if(E.TE&&E.TE.noAtk)cls.push('noatk');
    if(E.kw.tilt)cls.push('tlt',cr.tc>0?'tlton':'tltoff');if(cr.pz>0)cls.push('pzn');if(cr.blk>0)cls.push('blkx');if(E.kw.deso)cls.push('desox');if(cr.inv)cls.push('invx')}
  const tx=cd.tx||'',tc=tx.length>160?'ct xl xxl':tx.length>118?'ct xl':tx.length>76?'ct l':'ct';
  const kwset=E?E.kw:(()=>{const r={};(cd.kw||[]).forEach(x=>r[x]=1);if(cd.cleave)r.cleave=cd.cleave;return r})();
  // icônes des mots-clés : leur définition s'affiche au survol, partout (collection, boosters, défis, duel)
  const kws=KWORDER.filter(x=>kwset[x]||(x==='egide'&&cr&&cr.eg)).map(x=>{const nm=KWI[x][0],d=defOf(nm);
    return x==='venin'?h('i',{class:'vn kw','data-t':'Venin'+(kwset.venin>1?' '+kwset.venin:''),'data-d':d},'☠'+(kwset.venin>1?kwset.venin:'')):
      x==='cleave'?h('i',{class:'kw','data-t':'Cleave '+kwset.cleave,'data-d':d},'🪓'+kwset.cleave):h('i',{class:'kw','data-t':nm,'data-d':d},KWI[x][1])});
  const vip=!!kwset.vip;
  let a=cd.a,hp=cd.h,ac='',hc='';
  if(isC&&E){a=E.a;hp=E.hp;ac=stc(a,cd.a);hc=stc(hp,cd.h)}
  const bdg=[];if(cr){if(cr.pz>0)bdg.push(h('i',{class:'pz kw','data-t':'Venin subi : '+cr.pz,'data-d':'Début de son tour : '+cr.pz+' dégât(s), puis le Venin baisse de 1.'},'☠'+cr.pz));
    if(cr.blk>0)bdg.push(h('i',{class:'blk kw','data-t':'Bloquée','data-d':defOf('Bloquée')},'🔒'));
    if(o.rps)bdg.push(h('i',{class:'rpsg kw','data-t':'Pierre, feuille, ciseaux','data-d':o.rps==='?'?'Osiris a choisi son signe en secret. Au début de ton tour, tu as 15 s pour choisir le tien : si tu perds, il vole tout ton Or et son camp pioche 3 cartes.':'Ton signe secret : '+RPSN[o.rps]+'. Si ton adversaire perd, Osiris vole tout son Or et tu pioches 3 cartes.'},o.rps==='?'?'❔':RPSI[o.rps]));
    if(cr.inv)bdg.push(h('i',{class:'inv',title:'Invincible jusqu’à son prochain tour'},'✨'));if(cr.xat>0||cr.xa>0)bdg.push(h('i',{title:'Attaques en plus'},'⚔+'+((cr.xat||0)+(cr.xa||0))));
    if(cr.lb)bdg.push(h('i',{title:'Affinité LoL +'+cr.lb},gi('lol'),'+'+cr.lb));if(cr.ab)bdg.push(h('i',{title:'Smurf : affinité +'+cr.ab+' dans tous les jeux'},'🧢+'+cr.ab))}
  let tb=null;
  if(o.bd&&E&&E.T){const td=TD[E.T.d],g=GAMES[td.g],af=cr?affC(cr,td.g):affOf(k,td.g);tb=h('div',{class:'tb'+(af?'':' z'),style:'--gc:'+g.c,title:td.n+' : '+terrFor(k,E.T.d).tx},gi(td.g),td.g==='bazar'?null:pips(af))}
  const fm=famsOf(cd);if(!fm.length)cls.push('nofam');
  const cost=o.cost!=null?o.cost:cd.c;
  return h('div',{class:cls.join(' '),'data-k':k,'data-id':cr?cr.id:null,style:fm.length?'--f1:'+FAC[fm[0]].c+';--f2:'+FAC[fm[fm.length>1?1:0]].c:null},
    // bulle de coût hors du cadre (le dragon des légendaires peut déborder)
    h('span',{class:'cc'+(cost<cd.c?' lo':cost>cd.c?' hi':''),title:'Coût : '+cost+' Démoflux · '+RAR[cd.r]},cost),
    h('div',{class:'ci'},
      h('div',{class:'cn'},h('span',{class:'nm'+nmCls(cd)},fullName(cd))),
      h('div',{class:'ca'},artNode(k),
        h('div',{class:'bnm'+(cd.st?' ful':'')},cd.st?cd.n+',':cd.n,cd.st?h('small',null,stOf(cd)):null),
        h('div',{class:'kws'},kws)),
      typeLine(cd),
      h('div',{class:'box'},isC&&!cd.tok?affRow(k):null,h('div',{class:tc},h('span',null,txNodes(tx))),o.xv?h('div',{class:'xv',title:'Valeur actuelle de l’effet'},'⟶ '+o.xv):null),
      isC?h('div',{class:'st'},h('b',{class:'at '+ac,title:'Attaque'},a),h('b',{class:'hpv '+hc,title:'Points de vie'},hp)):null,
      bdg.length?h('div',{class:'bdg'},bdg):null,tb,
      vip?h('div',{class:'vipb kw','data-t':'VIP','data-d':defOf('VIP')},'😎',h('span',null,'Beau gosse')):null,
      cr&&cr.mut?h('div',{class:'mutb kw','data-t':'Mute','data-d':defOf('Mute')},h('span',null,'🔇'),h('b',null,'MUTE')):null,
      o.bd?h('div',{class:'vfx'},h('i',{class:'v-tlt'}),h('i',{class:'v-pzn'}),h('i',{class:'v-blk'})):null,
      o.rdy?h('div',{class:'atkb ok',title:'Peut attaquer'},'⚔'):o.why?h('div',{class:'atkb no',title:o.why[1]},o.why[0]):null,
      cr?h('div',{class:'exo',title:cr.fum===2?'Immunité diplomatique : inciblable':cr.fum?'Dans la fumée : inciblable':'À l’étranger : inciblable'},cr.fum===2?'🛂':cr.fum?'💨':'✈️'):null),
    // ornements de rareté : filet intérieur (bronze, argent ou or), coins ciselés (rare, légendaire) et cimier (légendaire)
    h('div',{class:'orn'},cd.r>=2?[h('i'),h('i'),h('i'),h('i')]:null,cd.r===3?h('b'):null),
    o.bd?h('div',{class:'v-rp'},h('span',null,'⛊')):null,
    o.bd?h('div',{class:'dome',title:'Égide : le prochain dégât est annulé'}):null,
    o.tilt?h('div',{class:'glr'}):null)}
// inclinaison 3D et reflets qui suivent la souris (cartes marquées .tilt)
let TILT=null;
function untilt(){if(!TILT)return;TILT.classList.remove('hov');['--mx','--my','--rx','--ry'].forEach(p=>TILT.style.removeProperty(p));TILT=null}
document.addEventListener('pointermove',e=>{
  const c=e.target.closest?e.target.closest('.card.tilt'):null;if(c!==TILT)untilt();if(!c)return;TILT=c;
  const r=c.getBoundingClientRect(),x=Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)),y=Math.min(1,Math.max(0,(e.clientY-r.top)/r.height));
  c.style.setProperty('--mx',(x*100).toFixed(1)+'%');c.style.setProperty('--my',(y*100).toFixed(1)+'%');
  c.style.setProperty('--rx',((.5-y)*16).toFixed(2)+'deg');c.style.setProperty('--ry',((x-.5)*18).toFixed(2)+'deg');c.classList.add('hov')},{passive:true});
document.addEventListener('pointerleave',untilt);

// ----- infobulle -----
const tipEl=()=>$('#tip');
function showTip(el,nodes){
  const t=tipEl();t.innerHTML='';t.append(...(nodes||[h('b',null,el.getAttribute('data-t')+' — '),el.getAttribute('data-d')]));
  t.style.display='block';const r=el.getBoundingClientRect(),tr=t.getBoundingClientRect();
  let x=Math.min(Math.max(8,r.left+r.width/2-tr.width/2),innerWidth-tr.width-8),y=r.top-tr.height-8;if(y<8)y=r.bottom+8;
  t.style.left=x+'px';t.style.top=y+'px'}
function hideTip(){const t=tipEl();if(t)t.style.display='none'}
document.addEventListener('pointerover',e=>{const w=e.target.closest&&e.target.closest('.kw[data-d]');if(w)showTip(w)});
document.addEventListener('pointerout',e=>{const w=e.target.closest&&e.target.closest('.kw[data-d]');if(w)hideTip()});
// pastille de famille : son effet et ses paliers apparaissent au survol
document.addEventListener('pointerover',e=>{const w=e.target.closest&&e.target.closest('[data-tipf]');if(!w)return;const f=w.getAttribute('data-tipf'),F=FAC[f];if(!F)return;
  showTip(w,[h('b',null,F.ic+' '+F.n+' — '),F.sum,facTiers(f,0),w.hasAttribute('data-sp')?h('div',{class:'tsp'},'Sort de famille : pensé pour un deck '+F.n+', presque inutile ailleurs.'):null].filter(Boolean))});
document.addEventListener('pointerout',e=>{const w=e.target.closest&&e.target.closest('[data-tipf]');if(w)hideTip()});

// ----- messages -----
let toastT=0;
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),2400)}
function modal(node,opt){
  const m=$('#modal');m.innerHTML='';const box=h('div',{class:'mbox'},node);m.append(box);m.classList.add('on');
  m.onclick=e=>{if(e.target===m&&!(opt&&opt.sticky))closeModal()};return box}
function closeModal(){const m=$('#modal');m.classList.remove('on');m.innerHTML='';hideTip();if(typeof hideHoverCard==='function')hideHoverCard()}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#modal').classList.contains('on')&&!$('#modal .mbox [data-sticky]'))closeModal()});
function ask(title,msg,btns,opt){
  const box=h('div',null,h('h2',null,title),msg&&(typeof msg==='string'?h('p',{class:'mut'},msg):msg),
    h('div',{class:'row',style:'margin-top:14px;justify-content:flex-end'},btns.map(b=>h('button',{class:'btn '+(b.c||''),onclick:()=>{closeModal();b.f&&b.f()}},b.t))));
  return modal(box,opt)}

// ----- fiche détaillée d'une carte -----
// pastilles de la fiche : familles, sort de famille ou d'affinité, mots-clés ; leurs explications n'apparaissent qu'au survol
const NOTAG=/^(?:Or|Démoflux|Terrain|[Cc]imetière|[Dd]éfausse)$/;
function tagRow(cd){const out=[];
  for(const f of cd.fac||[])out.push(h('span',{class:'chip ftag','data-tipf':f,style:'--fc:'+FAC[f].c},FAC[f].ic+' '+FAC[f].n));
  if(cd.fam)out.push(h('span',{class:'chip ftag','data-tipf':cd.fam,'data-sp':'1',style:'--fc:'+FAC[cd.fam].c},'Sort de famille : '+FAC[cd.fam].ic+' '+FAC[cd.fam].n));
  if(cd.gam)out.push(h('span',{class:'chip ftag kw','data-t':'Sort d’affinité '+GAMES[cd.gam].n,'data-d':'Pensé pour un deck de créatures très affinées '+GAMES[cd.gam].n+' (et leurs terrains) : presque inutile ailleurs.',style:'--fc:'+GAMES[cd.gam].c},gi(cd.gam),' Sort d’affinité '+GAMES[cd.gam].n));
  for(const [w,d] of defsFor(cd.k))if(!NOTAG.test(w))out.push(h('span',{class:'chip ktag kw','data-t':w,'data-d':d},w));
  return out.length?h('div',{class:'tags'},out):null}
function showCard(k,opts){
  opts=opts||{};const cd=CARDS[k];
  const box=h('div',null,
    h('div',{class:'detail'},
      h('div',null,cardEl(k,{big:true,tilt:1})),
      h('div',null,
        h('h2',null,fullName(cd)),
        h('div',{class:'mut sm'},(cd.t==='c'?'Créature':'Sort')+' · '+RAR[cd.r]+' · coût '+cd.c+(cd.tok?' · jeton':'')),
        tagRow(cd),
        cd.t==='c'&&!cd.tok?h('div',{class:'scores kw','data-t':'Affinités','data-d':defOf('Affinité')},AFG.map(g=>h('span',{style:'border-color:'+GAMES[g].c},gi(g),' '+GAMES[g].n+' : '+((cd.sc&&cd.sc[g])||0)))):null,
        madeRow(k,true),
        cd.lore?h('div',{class:'lore'},cd.lore):null,
        cd.credit?h('div',{class:'sm mut',style:'margin-top:6px'},'📷 '+cd.credit):null,
        opts.extra||null)));
  return modal(box)}
// cimetière : cartes numérotées dans l'ordre d'arrivée (n° 1 = la dernière arrivée, celle que reprennent les effets « dernière créature du cimetière »)
function pileModal(s,key){
  const V=DUEL&&DUEL.V;if(!V)return;const P=V.p[s],L=P[key]||[],n=L.length;
  modal(h('div',null,h('h2',null,'✝ Cimetière de '+(s===V.me?'toi':P.nm)+' ('+n+')'),
    h('p',{class:'mut sm'},'Sorts joués, créatures détruites, cartes défaussées ou brûlées (les jetons n’y vont jamais). Quand le deck est vide, le cimetière est mélangé pour former un nouveau deck'+(V.o.fat?' et la Fatigue commence : 1 dégât au début de chaque tour, puis 2, 3…':'.')),
    h('ul',{class:'gyo'},
      h('li',null,h('b',null,'N° 1'),' = la dernière carte arrivée (celle que reprennent les effets « la dernière créature de ton cimetière »).'),
      h('li',null,'Un sort arrive ',h('b',null,'après'),' la résolution de son effet : les créatures qu’il détruit arrivent avant lui.'),
      h('li',null,'Créatures détruites en même temps : celles du joueur dont c’est le tour d’abord, de gauche à droite, puis celles de l’adversaire. Chacune va dans le cimetière de son propriétaire.')),
    n?h('div',{class:'pilegrid'},L.slice().reverse().map((c,j)=>h('div',{class:'cc2',onclick:()=>showCard(c.k)},
      h('span',{class:'gyn'+(j===0?' last':'')},'N° '+(j+1)+(j===0?' · dernière arrivée':j===n-1&&n>1?' · la plus ancienne':'')),cardEl(c.k,{tilt:1})))):h('p',{class:'mut'},'Vide.')))}
