// ============ UI : écran de duel ============
var DUEL=null, CHALLENGE_UI=null, TRADE_UI=null;
const AINAMES=['Bot Modérateur','Troll anonyme','Xx_DarkSasuke_xX','Newbie du salon','Le Vieux Membre','Spammeur fou','Invité #4242','Admin fantôme','Lurker du vocal'];
const CHAOSN=['3 dégâts','+2/+2','Pioche 1','Soin 4','Bannissement','2 Plebs'];

function newDuelState(x){DUEL=Object.assign({V:null,hist:[],sel:null,info:null,rects:{},newE:[],filt:'all',overShown:false,disc:false,prevIds:null,
  started:false,drag:null,dragT:0,dragHand:null,tl0:0,tlAt:0,endArm:0,tmr:0},x)}

function startAIDuel(di){
  const d=S.decks[di],chk=deckCheck(d);if(!chk.ok){toast('Deck invalide : '+chk.err);return}
  const o=Object.assign({},S.opt),seed=(Math.random()*4294967296)>>>0,ai=bestAIDeckFast(S.coll,seed,o),arch=ai.arch;
  const G=newGame({names:[S.name||'Moi',AINAMES[rint(0,AINAMES.length-1)]],
    decks:[deckKeys(d.cards),ai.cards],seed,o,mull:true});
  const Hh=HostGame(G,[{kind:'me'},{kind:'ai',W:WGT[ARCH[arch].w],strong:1}],v=>applyView(v));   // duels : même IA experte que l'Arène
  newDuelState({mode:'ai',deck:di,host:Hh,ctl:{act:a=>Hh.act(0,a),resign:()=>Hh.resign(0),close:()=>Hh.close()}});
  mountDuel();Hh.start()}

// l'hôte est celui qui a lancé le défi : il fait tourner le moteur pour les deux joueurs
function startHostDuel(conn,m,di,opt){
  const arena=!!(opt&&opt.arena),mine=arena?S.arena.run.picks.slice():deckKeys(S.decks[di].cards);   // Arène : les decks draftés, sans limite d'exemplaires
  const lim={};const gd=(Array.isArray(m.deck)?m.deck:[]).filter(e=>{const k=String(e).replace('*','');if(!CARDS[k]||CARDS[k].tok)return false;
    lim[k]=(lim[k]||0)+1;if(!arena&&CARDS[k].r===3&&(lim.$leg=(lim.$leg||0)+1)>LEGMAX)return false;return arena||lim[k]<=LIMIT(CARDS[k].r)}).slice(0,ECON.deck);   // hors Arène : 7 légendaires au plus
  const G=newGame({names:[S.name||'Moi',String(m.name||'Ami').slice(0,18)],decks:[mine,gd],
    seed:(Math.random()*4294967296)>>>0,o:opt,mull:true});
  const Hh=HostGame(G,[{kind:'me'},{kind:'net',send:x=>{try{conn.send(x)}catch(e){}}}],v=>applyView(v));
  newDuelState({mode:'host',deck:di,host:Hh,conn,ctl:{act:a=>Hh.act(0,a),resign:()=>Hh.resign(0),close:()=>{Hh.close();try{conn.close()}catch(e){}}}});
  conn.on('data',x=>{if(!x)return;if(x.t==='act')Hh.act(1,x.a);else if(x.t==='resign')Hh.resign(1);else if(x.t==='chat')chatLine(String(m.name||'Ami').slice(0,18),String(x.m||'').slice(0,140))});
  conn.on('close',()=>{const D=DUEL;if(!D||D.host!==Hh||Hh.G.over)return;D.disc=true;renderDuel();
    D.discT=setTimeout(()=>{if(DUEL===D&&!Hh.G.over)Hh.resign(1)},25000)});
  mountDuel();Hh.start()}

function beginGuestDuel(conn,V0){
  newDuelState({mode:'guest',conn,ctl:{act:a=>{try{conn.send({t:'act',a})}catch(e){toast('Connexion perdue.')}},resign:()=>{try{conn.send({t:'resign'})}catch(e){}},close:()=>{try{conn.close()}catch(e){}}}});
  conn.on('data',x=>{if(!x||!DUEL||DUEL.conn!==conn)return;if(x.t==='st')applyView(x.v);else if(x.t==='err')toast(x.m);else if(x.t==='chat'&&DUEL.V)chatLine(DUEL.V.p[1-DUEL.V.me].nm,String(x.m||'').slice(0,140))});
  conn.on('close',()=>{const D=DUEL;if(!D||D.conn!==conn||(D.V&&D.V.over))return;D.disc=true;renderDuel()});
  mountDuel();applyView(V0)}

function applyView(V){
  const D=DUEL;if(!D)return;
  if(V.hs===0)D.hist=[];
  if(V.hs===0||V.hs===D.hist.length){D.newE=V.hist;D.hist.push(...V.hist)}else D.newE=[];
  V.hist=D.hist;D.V=V;D.tl0=V.tl;D.tlAt=performance.now();renderDuel()}

function mountDuel(){
  const el=$('#duel');el.hidden=false;el.innerHTML='';
  el.append(
    h('div',{class:'dtop'},h('div',{class:'dtl'},h('button',{class:'ibtn',onclick:duelMenu,title:'Menu'},'☰'),duelLogo()),h('div',{class:'tt',id:'dtt'}),h('div',{class:'info empty',id:'info'}),
      h('div',{class:'dtr'},h('div',{class:'tm',id:'dtm'},ico('timer'),h('span',{id:'dts'},'—')))),
    h('div',{id:'tbar'},h('i')),
    h('div',{class:'dmain'},
      h('div',{class:'field',id:'field',onclick:()=>{const D=DUEL;if(D&&(D.sel||D.info)){D.sel=null;D.info=null;renderDuel()}}},
        h('section',{class:'zone zopp'},h('div',{id:'hOpp'}),h('div',{class:'fxrow',id:'fOpp'}),h('div',{class:'tstrip',id:'tOpp'}),h('div',{class:'board o',id:'bOpp'})),
        h('section',{class:'zone zmid mid'},h('div',{class:'shopz',id:'shop'}),h('div',{class:'evb',id:'evb'}),
          h('button',{class:'endb',id:'endb',onclick:e=>{e.stopPropagation();endTurnClick()}},h('span',{id:'ebt'},'Fin du tour'),h('small',{id:'ebs'}),h('i',{class:'eb',id:'ebb'}))),
        h('section',{class:'zone zme'},h('div',{class:'board m',id:'bMe'}),h('div',{class:'tstrip',id:'tMe'}),h('div',{class:'fxrow',id:'fMe'}),h('div',{id:'hMe'})),
        h('div',{class:'hand',id:'hand'}),
        h('div',{class:'shopL',id:'shopL'}),
        h('div',{class:'pile2 opp'},h('div',{class:'deck opp',id:'dkOpp'}),h('div',{class:'grave opp',id:'gvOpp'}),h('div',{class:'arts opp',id:'aOpp'})),
        h('div',{class:'pile2 me'},h('div',{class:'arts me',id:'aMe'}),h('div',{class:'acts',id:'acts'}),h('div',{class:'grave me',id:'gvMe'}),h('div',{class:'deck me',id:'dkMe'}))),
      h('aside',{id:'hist'},h('div',{id:'hlist'}),duelChat())));
  const aim=h('div',{id:'aim'});aim.innerHTML='<svg width="100%" height="100%"><path class="ab"/><path class="al"/><polygon class="ah"/></svg>';el.append(aim);
  DUEL.onMove=e=>{const D=DUEL;if(!D)return;D.mx=e.clientX;D.my=e.clientY;if(!D.aimRaf)D.aimRaf=requestAnimationFrame(()=>{if(DUEL){DUEL.aimRaf=0;aimDraw()}})};
  window.addEventListener('pointermove',DUEL.onMove,{passive:true});
  clearInterval(DUEL.tmr);DUEL.tmr=setInterval(updTimer,250)}

// logo du jeu dans la barre du haut du duel (comme dans les menus)
function duelLogo(){const lg=h('div',{class:'dlogo'});lg.innerHTML=EMBLEM;lg.append(h('b',null,'L’ÉTAT ARCANIQUE'));return lg}
// chat du duel (sous l'historique) : avec un ami en ligne, ou pour « parler » à l'IA
const AICHAT=['gg','Bien joué.','C’est tout ce que tu as ?','Je calcule…','😴','Tu as de la chance.','Le Bazar est avec moi.','Joue plus vite !','ez','On verra au prochain tour.','Pas mal, pour un humain.','Mon deck est mieux que le tien.'];
function duelChat(){const i=h('input',{placeholder:'Écris un message… (Entrée)',maxlength:140,autocomplete:'off'});
  i.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'){sendDuelChat(i.value);i.value=''}else if(e.key==='Escape')i.blur()});
  return h('div',{id:'dchat'},h('div',{class:'chh'},'💬 Chat'),h('div',{class:'chl',id:'chl'}),i)}
function chatLine(who,txt,mine){const l=$('#chl');if(!l)return;l.append(h('div',{class:'chm'+(mine?' me':'')},h('b',null,who+' : '),String(txt)));l.scrollTop=l.scrollHeight;
  if(!mine){const c=$('#dchat');if(c){c.classList.remove('ping');void c.offsetWidth;c.classList.add('ping')}}}
function sendDuelChat(t){t=String(t||'').trim().slice(0,140);const D=DUEL;if(!t||!D)return;
  const dev=D.mode==='ai'&&!(D.V&&D.V.o.arena);                                        // outils de test : seulement en duel local contre l'IA (pas en Arène, pas en ligne)
  if(dev&&t.toLowerCase()==='defaussesvp'){D.ctl.act({t:'devdisc'});return}            // commande de test : l'adversaire défausse toute sa main (rien n'apparaît dans le chat)
  if(dev&&t.toLowerCase()==='test'){doAct({t:'test'});return}
  chatLine('Toi',t,true);
  if(D.mode==='ai'){if(Math.random()<.6)setTimeout(()=>{if(DUEL===D&&D.V)chatLine(D.V.p[1-D.V.me].nm,AICHAT[rint(0,AICHAT.length-1)])},900+Math.random()*1600);return}
  try{D.conn.send({t:'chat',m:t})}catch(e){toast('Message non envoyé.')}}
function leaveDuel(){
  const D=DUEL;if(D){clearInterval(D.tmr);clearTimeout(D.discT);if(D.onMove)window.removeEventListener('pointermove',D.onMove);try{D.ctl.close&&D.ctl.close()}catch(e){}}closePop();
  DUEL=null;const el=$('#duel');el.hidden=true;el.innerHTML='';closeModal();if(typeof arenaCheckStale==='function')arenaCheckStale();
  $$('.pop,.proj,.trail,.boom,.fburst,.castc,.banner,.ghostc').forEach(x=>x.remove());
  if(typeof refreshTop==='function')refreshTop();if(typeof go==='function')go(CUR||'play')}

function duelMenu(){
  const D=DUEL;if(!D||!D.V)return;
  if(D.V.over){leaveDuel();return}
  ask('Quitter le duel ?','Si tu abandonnes, tu perds le duel.',[{t:'Continuer'},{t:S.lowfx?'✨ Effets visuels complets':'🍃 Effets visuels réduits',f:()=>{S.lowfx=!S.lowfx;saveS()}},{t:'Abandonner',c:'danger',f:()=>{D.ctl.resign();if(D.mode==='guest'){setTimeout(()=>{if(DUEL===D&&!(D.V&&D.V.over))leaveDuel()},1500)}}}])}

function mine(){const V=DUEL.V;return V.cur===V.me&&!V.over&&!V.phase}
function updTimer(){
  const D=DUEL;if(!D||!D.V)return;const el=$('#dtm');if(!el)return;const V=D.V,s=$('#dts'),bar=$('#tbar'),eb=$('#ebs'),ebb=$('#ebb');
  const m=V.phase==='mull'?!(V.mull&&V.mull[V.me]):V.cur===V.me&&!V.over,fill=bar.firstChild;
  if(V.over){s.textContent='Fin';el.className='tm off';bar.className='';fill.style.width='0';if(eb)eb.textContent='';if(ebb)ebb.style.width='0';return}
  if(!V.tim){s.textContent='∞';el.className='tm '+(m?'':'opp');bar.className=m?'':'opp';fill.style.width='100%';if(eb)eb.textContent='';if(ebb)ebb.style.width='0';return}
  const ms=Math.max(0,D.tl0-(performance.now()-D.tlAt)),left=Math.ceil(ms/1000),pct=Math.min(100,ms/(V.tim*1000)*100);
  const st=!m?'opp':left<=10?'lo':left<=20?'mid':'';
  el.className='tm '+st;bar.className=st;s.textContent=left+' s';fill.style.width=pct+'%';const rt=$('#rpst');if(rt)rt.textContent=left+' s';
  if(eb)eb.textContent=left+' s';if(ebb)ebb.style.width=pct+'%'}

// ---------- sélection et surbrillance ----------
function fixSel(){
  const D=DUEL,V=D.V,me=V.me,s=D.sel;if(!s)return;
  if(!mine()){D.sel=null;return}
  if(s.t==='hand'||s.t==='cry'||s.t==='sp2'){const hd=V.p[me].hand[s.i];if(!hd||hd.k!==s.k)D.sel=null}
  else if(s.t==='atk'){if(!canAtk(V,me,s.f))D.sel=V.p[me].board[s.f]?{t:'mv',f:s.f}:null}
  else if(s.t==='mv'){if(!V.p[me].board[s.f])D.sel=null}
  else if(s.t==='tm'){if(!V.p[me].terrs.some(t=>t.id===s.id))D.sel=null}
  else if(s.t==='terr'){if(!V.shop[s.n]||!canBuy(V,me,s.n))D.sel=null}}
function effectPreview(V,s,k){
  const cd=CARDS[k],highlight={},lines=[],P=V.p[s],enemy=1-s,ops=cd.t==='c'?(cd.cry||[]):(cd.fx||[]);
  const label=(side,i)=>i<0?(side===s?'ton héros':'le héros adverse'):(V.p[side].board[i]&&fullName(CARDS[V.p[side].board[i].k])+' ('+eff(V,side,i).hp+' PV)');
  const report=(text,list)=>{lines.push(text);if(list.length)lines.push(list.map(t=>'• '+label(t.s,t.i)).join('  '));};
  for(const op of ops){
    if(op.t==='dmgFac'){
      const list=[];for(const side of[0,1])V.p[side].board.forEach((c,i)=>{if(c&&hasFC(c,op.f)){highlight[side+':'+i]=1;list.push({s:side,i})}});
      report((op.n||0)+' dégâts à tous les '+FAC[op.f].n+' ('+list.length+') :',list);continue}
    if(op.t==='dmgAll'||op.t==='killAll'){
      const sides=op.t==='killAll'||op.side==='both'?[0,1]:[enemy],list=[];
      sides.forEach(side=>V.p[side].board.forEach((c,i)=>{if(c){highlight[side+':'+i]=1;list.push({s:side,i})}}));
      report(op.t==='killAll'?'Détruit toutes les créatures :':'Inflige '+op.n+' dégât(s) à toutes les créatures ennemies ('+list.length+') :',list);continue}
    if(op.t==='pzBurst'){
      const list=[];V.p[enemy].board.forEach((c,i)=>{if(c&&c.pz>0){highlight[enemy+':'+i]=1;list.push({s:enemy,i})}});
      report('Dégâts égaux au Venin actuel sur ('+list.length+') :',list);continue}
    if(op.t==='rnd'||op.t==='rnd2'||op.t==='rndC'){
      const list=targetsForPreview(V,s,op.t==='rndC'?'ec':'e');list.forEach(t=>{if(t.i>=0)highlight[t.s+':'+t.i]=1});
      const text=op.t==='rnd2'?(op.n||1)+' dégât(s) à 2 ennemis différents au hasard parmi :':
        op.t==='rndC'?(op.n||0)+' dégât(s) à une créature ennemie au hasard parmi :':
        (op.n||0)+' dégât(s) à '+(op.times||1)+' cible(s) ennemie(s) au hasard parmi :';
      report(text,list);continue}
    if(op.t==='blk'&&op.rnd){
      const list=targets(V,s,'ec',null,null,true).filter(t=>!V.p[t.s].board[t.i].blk);
      list.forEach(t=>highlight[t.s+':'+t.i]=1);report('Bloque '+(op.n||1)+' créature(s) ennemie(s) au hasard parmi :',list);continue}
    if(op.t==='ban'&&op.rnd){
      const list=targets(V,s,op.rnd,null,null,true);list.forEach(t=>{if(t.i>=0)highlight[t.s+':'+t.i]=1});
      report('Bannit une cible au hasard parmi :',list);continue}
    if(op.t==='dmg'&&op.rnd){
      const sides=op.both?[0,1]:[enemy],list=[];sides.forEach(side=>V.p[side].board.forEach((c,i)=>{if(c){highlight[side+':'+i]=1;list.push({s:side,i})}}));
      report(op.n+' dégâts à une créature au hasard '+(op.both?'de chaque camp':'parmi les créatures ennemies')+' parmi :',list);continue}
    if(op.t==='buff'&&op.rnd){
      const list=[];P.board.forEach((c,i)=>{if(c){highlight[s+':'+i]=1;list.push({s,i})}});
      report('Renforce une de tes créatures au hasard parmi :',list);continue}
    if(op.t==='setAtk0'){
      const list=targets(V,s,op.tg||'ec',op.tgf);list.forEach(t=>{if(t.i>=0)highlight[t.s+':'+t.i]=1});
      report('Passe l’ATK à 0 sur la créature choisie.',list);continue}
    if(op.t==='fillDucks'){
      const n0=P.board.filter(c=>!c).length,n1=V.p[enemy].board.filter(c=>!c).length;
      lines.push('Invoque '+n0+' Canard'+(n0===1?'':'s')+' chez toi et '+n1+' chez l’adversaire.');continue}
    if(op.t==='summon'){const n=Math.min(op.n||1,P.board.filter(c=>!c).length),name=CARDS[op.k]?CARDS[op.k].n:'créature';lines.push('Invoque '+n+' '+name+(n===1?'':'s')+', selon les cases libres.');continue}
  }
  if(!lines.length){const x=liveX(V,s,k);if(x)lines.push('Effet estimé : '+x+'.')}
  return{lines,targets:highlight}}
function targetsForPreview(V,s,spec){return targets(V,s,spec,null,null,true)}
function computeHL(){
  const D=DUEL,V=D.V,me=V.me,s=D.sel,hl={};D.previewHl={};if(!s||!mine())return hl;
  const put=L=>L.forEach(t=>hl[t.s+':'+t.i]=1);
  if(s.t==='hand'){const cd=CARDS[V.p[me].hand[s.i].k],pv=effectPreview(V,me,cd.k);D.previewHl=pv.targets;if(cd.t==='s'){const sp=cryTg(cd);if(sp)put(targets(V,me,sp.tg,sp.tgf))}}
  else if(s.t==='cry')put(s.t1?tg2List(V,me,s.sl):targets(V,me,s.sp.tg,s.sp.tgf));
  else if(s.t==='sp2')put(sp2List(V,me,s.t1));                      // Clutch : la cible à soigner
  else if(s.t==='atk')put(atkTargets(V,me,s.f));
  return hl}
function isHL(s,i){return !!(DUEL.hl&&DUEL.hl[s+':'+i])}
function hintText(){
  const D=DUEL,V=D.V,s=D.sel;if(!s)return '';
  if(s.t==='hand'){const cd=CARDS[V.p[V.me].hand[s.i].k];
    if(cd.t==='c')return bigTerrOf(cd.k)?'Choisis sa case : '+bigTerrOf(cd.k).n+' recouvrira tout ton plateau':'Clique sur un emplacement libre (ou glisse la carte)';
    return cryTg(cd)?'Choisis une cible':'Clique à nouveau sur la carte pour la jouer'}
  if(s.t==='sp2')return 'Choisis la cible à soigner de 3 PV : un héros ou une créature (pas la cible des dégâts)';
  if(s.t==='cry'&&s.sp.tg==='ecell')return 'Choisis où poser le Blizzard sur le plateau adverse : survole une case pour voir les 2 cases couvertes';
  if(s.t==='cry'&&s.sp.tg==='eslot')return 'Choisis une case libre du plateau adverse où invoquer le Poutch 0/4';
  if(s.t==='cry'&&s.sp.tg==='eterr')return 'Choisis le terrain adverse à désactiver';
  if(s.t==='cry'&&s.sp.tg==='terr')return 'Choisis le terrain à désactiver : un des tiens ou un de l’adversaire';
  if(s.t==='cry')return s.t1?'Choisis ta créature à échanger (ou sa propre case pour l’échanger lui-même)':s.sp.tg2?'Choisis la créature ennemie à prendre':'Choisis la cible du Cri d’arrivée';
  const me=V.me,mc=canMoveC(V,me),mt=canMoveT(V,me);
  if(s.t==='atk')return 'Choisis qui attaquer'+(mc?', ou une case de ton plateau pour déplacer cette créature (◆ '+mvCost(V,me)+')':'')+' · Ctrl+clic gauche sur ta créature : attaquer le héros';
  if(s.t==='mv')return mc?'Choisis une case de ton plateau pour déplacer cette créature (◆ '+mvCost(V,me)+')':mvWhy(V,me,0);
  if(s.t==='tm')return mt?'Choisis où déplacer ce terrain sur ton plateau (🪙 '+mvCost(V,me)+')':mvWhy(V,me,1);
  if(s.t==='terr')return s.at==null?'Clique où poser le terrain sur ton plateau':'Clique à nouveau pour confirmer';
  return ''}

// ---------- rendu ----------
function renderDuel(){
  const D=DUEL;if(!D||!D.V||!$('#hOpp'))return;if(!$('.cpop'))hideTip();const V=D.V,me=V.me,op=1-me;
  const rects={},idr={};$$('#duel .slot').forEach(sl=>{const c=sl.firstElementChild;if(c&&c.classList.contains('card')){const r=sl.getBoundingClientRect();rects[sl.dataset.s+':'+sl.dataset.i]={r,n:c};if(c.dataset.id)idr[c.dataset.id]=r}});   // n = carte vivante : clonée seulement si une animation en a besoin (pas à chaque rendu)
  D.rects=rects;
  fixSel();D.hl=computeHL();
  const m=mine();
  $('#duel').classList.toggle('myturn',m);$('#duel').classList.toggle('oppturn',!m&&!V.over);
  $('#dtt').textContent=(V.o.arena?'Arène · ':'')+(V.over?'Duel terminé':V.phase==='mull'?'Mulligan · choisis ta main de départ':V.phase==='rps'?'Pierre, feuille, ciseaux · '+(V.rpsTo===me?'à toi de choisir':V.p[op].nm+' choisit'):'Manche '+V.round+' · '+(m?'À toi de jouer':'Tour de '+V.p[op].nm));updTimer();
  $('#hOpp').replaceChildren(heroNode(op));$('#hMe').replaceChildren(heroNode(me));
  const ids=new Set();
  for(const s of [op,me]){const B=$(s===me?'#bMe':'#bOpp');B.replaceChildren(...boardNodes(s,ids))}
  stripNode(op,$('#tOpp'));stripNode(me,$('#tMe'));fxNode(op,$('#fOpp'));fxNode(me,$('#fMe'));deckNode(op,$('#dkOpp'));deckNode(me,$('#dkMe'));graveNode(op,$('#gvOpp'));graveNode(me,$('#gvMe'));
  if(HOV.el&&!HOV.el.isConnected)hovOff();
  shopNode();evNode();endNode();showInfo();handNode();mullNode();pickNode();rpsNode();rpsEndNode();artsNode(op,$('#aOpp'));artsNode(me,$('#aMe'));actsNode();
  D.prevIds=ids;
  // une créature déplacée glisse de son ancienne case vers la nouvelle
  $$('#duel .slot .card[data-id]').forEach(c=>{const r0=idr[c.dataset.id];if(!r0)return;const r=c.parentElement.getBoundingClientRect(),dx=r0.left-r.left,dy=r0.top-r.top;
    if(Math.abs(dx)+Math.abs(dy)>3)c.animate([{transform:'translate('+dx+'px,'+dy+'px)',zIndex:20},{transform:'none',zIndex:20}],{duration:380*ANIM,easing:'cubic-bezier(.2,.8,.2,1)'})});
  renderHist();aimDraw();
  discNode();
  if(D.started)animate(D.newE);else{D.started=true;banner(m?'À TOI DE JOUER':'TOUR ADVERSE',m?'#e9cd86':'#c45f5b')}
  D.newE=[];
  if(V.over&&!D.overShown){D.overShown=true;if(V.o.arena&&!D.arenaRes)D.arenaRes=arenaAfterDuel(V,D);setTimeout(showResult,1600*ANIM)}}   // Arène : le résultat compte dès la fin de la partie

// zone d'artefacts d'un joueur (Dofus légendaires de Gobi ; les futures cartes Artefact s'y poseront)
function artsNode(s,el){if(!el)return;const V=DUEL.V,P=V.p[s],A=P.arts||[];
  el.replaceChildren(h('b',{class:'al'},'Artefacts'),h('div',{class:'ar'},Array.from({length:ARTMAX},(_,j)=>{const a=A[j];if(!a)return h('i',{class:'ae'});const R=ARTS[a.k];
    return h('i',{class:'egg kw','data-t':R.n,'data-d':R.tx,style:'--ec:'+R.col})})));el.classList.toggle('none',!A.length)}
// actions spéciales disponibles pendant ton tour (voyage des Expats…) : à droite du plateau, au-dessus du deck
function actsNode(){const el=$('#acts');if(!el)return;const D=DUEL,V=D.V,me=V.me,P=V.p[me],L=fl(V,me),bt=[];
  if(mine()&&D.mode==='ai'&&!V.o.arena&&!V.over&&!V.phase&&!(P.pq&&P.pq.length)){const b=h('button',{class:'actb',title:'Code test (duel local contre l’IA) : choisis une carte de ton deck et passe à 10 Démoflux.',
      disabled:P.hand.length>=V.o.hand||!P.dn,onclick:e=>{e.stopPropagation();doAct({t:'test'})}},'🧪',h('span',null,'Test'));
    bt.push(b)}
  if(mine())P.board.forEach((c,i)=>{if(c&&canExil(V,me,i)){const b=h('button',{class:'actb',title:'Disparaître à l’étranger : '+fullName(c.k)+' devient inciblable jusqu’à ton prochain tour ('+exCost(L.expats)+' Or)',
      onclick:e=>{e.stopPropagation();doAct({t:'exil',i})}},miniAv(c.k),h('span',null,'✈️ '+exCost(L.expats)+'🪙'));
    b.addEventListener('pointerenter',()=>{const sl=elAt(me,i);if(sl)sl.classList.add('acth')});b.addEventListener('pointerleave',()=>$$('.slot.acth').forEach(x=>x.classList.remove('acth')));bt.push(b)}});
  el.replaceChildren(...(bt.length?[h('b',{class:'al'},'Actions'),...bt]:[]));el.classList.toggle('none',!bt.length)}
function discNode(){
  $$('.disc').forEach(x=>x.remove());const D=DUEL;if(!D.disc||(D.V&&D.V.over))return;
  $('#duel').append(h('div',{class:'disc'},'Ton adversaire s’est déconnecté.',
    h('button',{class:'btn sm',onclick:()=>{if(D.mode==='host')D.host.resign(1);else leaveDuel()}},D.mode==='host'?'Réclamer la victoire':'Quitter')))}

// pourquoi une de tes créatures ne peut pas attaquer (icône, explication)
function atkWhy(V,s,i){const c=V.p[s].board[i];if(!c)return null;if(pend(V,s))return['⏳','Termine d’abord le choix en attente avant d’attaquer'];const E=eff(V,s,i);
  if(c.blk>0)return['🔒','Bloquée : ne peut pas attaquer ce tour'];if(E.TE&&E.TE.noAtk)return['⛔','Ne peut pas attaquer sur ce terrain'];
  if(c.sick&&!E.kw.hate)return['⏳','Vient d’arriver : pourra attaquer au prochain tour'];return['✓','A déjà attaqué ce tour']}
function faceAttackBlockReason(V,s,i){
  const c=V.p[s].board[i];if(!c)return'Aucune créature à cet emplacement.';
  if(!canAtk(V,s,i)){const why=atkWhy(V,s,i);return why?why[1]:'Cette créature ne peut pas attaquer.'}
  if(eff(V,s,i).kw.deso)return'Désorientée : sa cible d’attaque est aléatoire, le héros ne peut pas être choisi directement.';
  const legal=atkTargets(V,s,i);if(legal.some(t=>t.s===1-s&&t.i===-1))return null;
  const guards=legal.filter(t=>t.s===1-s&&t.i>=0).map(t=>fullName(V.p[t.s].board[t.i].k));
  return guards.length?'Rempart adverse : tu dois d’abord attaquer '+guards.join(', ')+'.':'Cette attaque ne peut pas cibler le héros.';
}
function heroNode(s){
  const D=DUEL,V=D.V,me=V.me,P=V.p[s],isMe=s===me;
  const tot=Math.max(P.cap,P.eth),cr=[];for(let i=0;i<tot;i++)cr.push(h('i',{class:i<P.eth?(i>=P.cap?'x':'f'):''}));
  const pct=Math.max(0,Math.min(100,P.hp/P.mhp*100));
  const cls='hero '+(isMe?'me':'opp')+(V.cur===s&&!V.over?' act':'')+(D.hl&&D.hl[s+':-1']?(s===me?' tgo':' tg'):'')+(pct<=30?' low':'');
  // une case par ressource : l'icône et la valeur ; le nom n'apparaît qu'au survol (.hl)
  const st=(cl,lab,val,extra)=>h('div',{class:'hst '+cl},h('span',{class:'hl'},lab),h('b',null,...val),extra||null);
  const ml=mvLeft(V,s),mm=mvMax(V);
  const el=h('div',{class:cls,'data-s':s,'data-i':-1},
    h('div',{class:'hav'},(P.nm||'?').trim().charAt(0).toUpperCase()),
    h('div',{class:'hid'},
      h('div',{class:'hrow'},h('div',{class:'hn'},P.nm)),
      h('div',{class:'hpl'},h('span',{class:'hl'},'Points de vie'),h('div',{class:'hbar'},h('i',{style:'width:'+pct+'%'})),h('b',{class:'hpn'},h('i',null,'♥'),' '+P.hp,h('small',null,'/'+P.mhp)))),
    P.pz>0?h('div',{class:'hpz'},'☠ '+P.pz):null,
    st('mana','Démoflux',[h('i',null,'◆'),' '+P.eth,h('small',null,'/'+P.cap)],h('div',{class:'crys'},cr)),
    V.o.ter?st('gold','Or',[h('i',null,'🪙'),' '+P.or]):null,
    st('handc','Cartes en main',[h('i',null,'✋'),' '+P.hand.length]),
    isMe&&V.o.ter&&mm>0?st('mvc'+(ml?'':' out'),ml?'Déplacements · prochain : '+mvCost(V,s)+' ◆ ou '+mvCost(V,s)+' 🪙':'Déplacements épuisés ce tour',[h('i',null,'↔'),' '+ml+'/'+mm]):null);
  el._dz={t:'hero',s};
  el.addEventListener('click',e=>{e.stopPropagation();clickSlot(s,-1)});
  return el}

// synergies de familles : une pastille par famille présente, avec la progression
function fxNode(s,el){
  const V=DUEL.V,cnt=fl(V,s);
  el.innerHTML='';const fs=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a]);
  if(!fs.length){el.append(h('span',{class:'none'},s===V.me?'Synergies : pose 2 créatures de la même famille.':'Aucune synergie en jeu.'));return}
  for(const f of fs){const F=FAC[f],n=cnt[f],tag=facTag(f,n);
    const c=h('div',{class:'fx'+(n>=2?' on':''),style:'--fc:'+F.c,title:F.n+' — '+F.sum,'data-f':f},
      h('span',{class:'fi'},F.ic),h('span',null,F.n),
      h('span',{class:'pp'},Array.from({length:Math.max(3,n)},(_,j)=>h('i',{class:j<n?'f':''}))),
      tag?h('span',{class:'tag'},tag):null);
    c.addEventListener('click',e=>{e.stopPropagation();cardPop({fac:f,s},e.clientX,e.clientY)});      // clic : fiche de la famille
    el.append(c)}}

function boardNodes(s,ids){
  const D=DUEL,V=D.V,me=V.me,out=[],B=V.p[s].board,L=fl(V,s);
  for(let i=0;i<CELLS;i++){
    const c=B[i];const sl=h('div',{class:'slot'+(c?'':' empty'),'data-s':s,'data-i':i});sl._dz={t:'slot',s,i};
    if(c&&s===me&&mine())sl.title=faceAttackBlockReason(V,me,i)||'Ctrl+clic gauche : attaquer le héros adverse';
    if(c&&D.previewHl&&D.previewHl[s+':'+i])sl.classList.add('preview');
    const T=V.o.ter?terrOf(V,s,i):null;if(T&&TD[T.d]){sl.classList.add('ter');sl.style.setProperty('--tc',GAMES[TD[T.d].g].c)}   // case couverte par un terrain
    const sel=D.sel,cellT=sel&&sel.t==='cry'&&CELLT[sel.sp.tg];
    if(!c&&s===me&&sel&&((sel.t==='hand'&&CARDS[sel.k].t==='c')||(sel.t==='cry'&&sel.sl===i))){sl.classList.add('hi');
      if(sel.t==='hand'&&bigTerrOf(sel.k)){sl.addEventListener('pointerenter',()=>bigTerrPreview(sel.k,true));sl.addEventListener('pointerleave',()=>bigTerrPreview(null,false))}}
    if(cellT&&D.hl&&D.hl[s+':'+i]){sl.classList.add('cellt');sl.addEventListener('pointerenter',()=>cellHover(s,i,sel.sp.tg,true));sl.addEventListener('pointerleave',()=>cellHover(s,i,sel.sp.tg,false))}
    if(s===me&&sel&&(sel.t==='atk'||sel.t==='mv')&&sel.f!==i&&mine()&&canMoveC(V,me))sl.classList.add(c?'swp':'mvd');
    if(c){
      ids.add(c.id);const E=eff(V,s,i,L);
      // pendant ton tour : tes créatures prêtes à attaquer sont marquées ⚔ en vert, les autres sont assombries avec la raison
      const ready=s===me&&mine()&&canAtk(V,me,i),why=s===me&&mine()&&!ready?atkWhy(V,me,i):null;
      const cls=[];if(ready)cls.push('can');else if(why)cls.push('nrdy');if(D.hl&&D.hl[s+':'+i]&&!cellT)cls.push(s===me?'tgo':'tg');
      if(sel&&(sel.t==='atk'||sel.t==='mv')&&s===me&&sel.f===i)cls.push('sel');
      if(sel&&sel.t==='sp2'&&sel.t1.s===s&&sel.t1.i===i)cls.push('tg1');
      if(D.prevIds&&!D.prevIds.has(c.id))cls.push('enter');
      sl.append(cardEl(c.k,{bd:true,cr:c,E,cls,L,rdy:ready,why,rps:rpsOf(V,c)}));
      if(s===me)makeDrag(sl,()=>{const V2=DUEL.V;if(!mine()||!V2.p[V2.me].board[i]||!canAtk(V2,V2.me,i))return null;return{t:'atk',f:i,k:c.k,atk:true}});
    }
    sl.addEventListener('click',e=>{e.stopPropagation();clickSlot(s,i,e)});
    out.push(sl)}
  return out}

// cible « case » : aperçu des cases que le Blizzard couvrirait, ou du terrain qui serait désactivé
function cellHover(s,i,tg,on){$$('#duel .slot.cellh').forEach(x=>x.classList.remove('cellh'));$$('#duel .tcell.pv.cpv').forEach(x=>x.remove());if(!on)return;const V=DUEL.V,P=V.p[s];let L=[];
  if(tg==='ecell'){const n=TD.blizzard.size,st=Math.max(0,Math.min(i,CELLS-n));for(let j=st;j<st+n;j++)L.push(j)}else if(tg==='eslot')L.push(i);else{const id=P.cells[i];P.cells.forEach((x,j)=>{if(id&&x===id)L.push(j)})}
  for(const j of L){const e=$('#duel .slot[data-s="'+s+'"][data-i="'+j+'"]');if(e)e.classList.add('cellh')}
  // aperçu exact sur la bande des terrains : le Blizzard couvrira ces cases-là
  const st=$(s===V.me?'#tMe':'#tOpp');if(tg!=='eslot'&&st&&L.length){const td=tg==='ecell'?TD.blizzard:null;
    st.append(h('div',{class:'tcell pv cpv',style:'grid-row:1;grid-column:'+(L[0]+1)+' / span '+L.length+';z-index:4;--gc:'+(td?'#9cc8e8':'#c15c58')},td?'❄ Blizzard : cases '+(L[0]+1)+'–'+(L[L.length-1]+1):'⛔ Désactiver ce terrain'))}}
// une carte qui pose un terrain sur tout ton plateau (Le Grand Bazaar, Éco village) : aperçu pendant qu'on choisit sa case
function bigTerrOf(k){const cd=CARDS[k];if(!cd||!cd.cry)return null;for(const o of cd.cry)if(o.t==='gbazar'||o.t==='eco')return TD[o.t];return null}
function bigTerrPreview(k,on){$$('#tMe .tcell.pv.bigpv').forEach(x=>x.remove());const td=on&&bigTerrOf(k),st=$('#tMe');if(!td||!st)return;
  st.append(h('div',{class:'tcell pv bigpv',style:'grid-row:1;grid-column:1 / span '+CELLS+';z-index:4;--gc:'+GAMES.bazar.c},'🌀 '+td.n+' recouvrira tout ton plateau'+(DUEL.V.p[DUEL.V.me].terrs.length?' (tes terrains actuels disparaissent)':'')))}
function stripNode(s,el){
  const V=DUEL.V,P=V.p[s];el.innerHTML='';let i=0;
  if(!V.o.ter){el.style.visibility='hidden';return}el.style.visibility='';
  const cellAt=x=>{const r=el.getBoundingClientRect();return Math.max(0,Math.min(CELLS-1,Math.floor((x-r.left)/r.width*CELLS)))};
  const own=s===V.me,sel=DUEL.sel;
  while(i<CELLS){const id=P.cells[i];
    if(!id){el.append(h('div',{class:'tcell none',style:'grid-column:'+(i+1),'data-c':i}));i++;continue}
    let j=i;while(j<CELLS&&P.cells[j]===id)j++;const T=P.terrs.find(t=>t.id===id),td=TD[T.d],g=GAMES[td.g],st=i,n=P.cells.filter(x=>x===id).length;
    const off=tOff(V,T);
    const c=h('div',{class:'tcell'+(own?' own':'')+(off?' off':'')+(T.lk?' lk':''),style:'--gc:'+g.c+';grid-column:'+(i+1)+' / span '+(j-i),title:td.n+' — '+tTxt(td)+(off?'\n⛔ Désactivé tant que Kirua, crasheur de serveur est en jeu.':'')+(T.lk?'\n🔒 Indestructible, recouvrable : il fond quand Kirua, la reine des neiges quitte le plateau.':''),'data-c':i,'data-tid':id},h('span',{class:'tn'},off?'⛔ ':T.lk?'🔒 ':gi(td.g),' '+td.n));
    c.addEventListener('click',e=>{const S=DUEL.sel;if(S&&S.t==='terr'&&own)return;e.stopPropagation();
      if(S&&S.t==='cry'&&CELLT[S.sp.tg]){const x=cellAt(e.clientX);if(isHL(s,x)){clickSlot(s,x);return}}
      cardPop({terr:T,s},e.clientX,e.clientY)});
    el.append(c);i=j}
  if(sel&&sel.t==='terr'&&own&&sel.at!=null){const t=V.shop[sel.n];if(t){const td=TD[t.d];el.append(h('div',{class:'tcell pv',style:'grid-row:1;grid-column:'+(sel.at+1)+' / span '+td.size+';z-index:3;--gc:'+GAMES[td.g].c},gi(td.g),' '+td.n))}}
  el.onclick=e=>{const S=DUEL.sel;if(!S||!mine())return;const x=cellAt(e.clientX);
    if(S.t==='cry'&&CELLT[S.sp.tg]&&isHL(s,x)){e.stopPropagation();clickSlot(s,x);return}
    if(!own)return;e.stopPropagation();if(S.t==='terr')setTerrAt(x)};
  if(sel&&sel.t==='terr'&&own){el._cellAt=cellAt;el._dz={t:'strip',s}}else el._dz=null}
// aperçu de l'emplacement pendant qu'on glisse un terrain (sans tout redessiner)
function stripPreview(at,n,col,txt){const el=$('#tMe');if(!el)return;let p=el.querySelector('.tcell.pv.drag');
  if(at==null){if(p)p.remove();return}
  if(!p){p=h('div',{class:'tcell pv drag'});el.append(p)}
  p.style.cssText='grid-row:1;grid-column:'+(at+1)+' / span '+n+';z-index:3;--gc:'+col;p.replaceChildren(...[].concat(txt))}

// le terrain le plus ancien est remplacé au début des tours pairs (tous les 2 tours) : est-ce au prochain tour ?
function cycSoon(V){return(V.turn+1)%2===0}
// boutique de terrains : dans la marge gauche du plateau quand il y a la place (un terrain à la hauteur de chaque plateau,
// la relance entre les deux), sinon dans la zone du milieu ; chaque terrain ne montre que son coût, sa taille et son effet
// v21 : boutique, plateau et piles (deck, cimetière, artefacts) forment un bloc centré dans la zone de jeu :
// le plateau, la main et le titre du tour sont décalés de --zx (vers la droite quand la boutique est à gauche)
function shopLayout(){const f=$('#field'),z=$('#field .zopp'),pl=$('#field .pile2');if(!f||!z)return null;
  const W=f.getBoundingClientRect().width,Z=z.getBoundingClientRect().width,P=pl?pl.getBoundingClientRect().width:0,GS=16,GP=14,M=8;
  return{R:(W-Z)/2,P,GS,GP,M,ws:Math.min(230,Math.floor(W-2*M-GS-Z-GP-P))}}   // R : marge de chaque côté du plateau centré ; ws : largeur possible de la boutique
function shopNode(){
  const D=DUEL,V=D.V,me=V.me,L=shopLayout(),side=!!(L&&V.o.ter&&L.ws>=98);
  const zx=!L?0:side?Math.round((L.ws+L.GS-L.GP-L.P)/2):-Math.round(Math.min((L.GP+L.P)/2,Math.max(0,L.R-L.M)));
  $('#duel').style.setProperty('--zx',zx+'px');
  $('#duel').classList.toggle('shopside',side);
  if(side){shopSide(L,zx);$('#shop').innerHTML='';return}
  $('#shopL').innerHTML='';
  const el=$('#shop');el.innerHTML='';el.append(h('div',{class:'lb'},'TERRAINS'));
  if(!V.o.ter){el.append(h('div',{class:'mut sm',style:'align-self:center'},'Terrains désactivés'));return}
  const rc=mine()&&canRoll(V,me);
  el.append(h('button',{class:'rollb'+(rc?' can':''),disabled:!rc,title:'Relancer les terrains : 2 nouveaux terrains pour '+ROLLC+' Or'+(mine()&&!rc?' (il te faut '+ROLLC+' Or)':''),
    onclick:e=>{e.stopPropagation();doAct({t:'roll'})}},h('span',{class:'ri'},'🎲'),h('small',null,ROLLC+' 🪙')));
  const keys=V.shop.map(t=>t?t.d:''),prev=D.prevShop||keys;
  V.shop.forEach((t,n)=>{
    if(!t){el.append(h('div',{class:'shT void'},'épuisé'));return}
    const td=TD[t.d],g=GAMES[td.g],cost=terrCost(V,me,t),can=mine()&&canBuy(V,me,n),old=n===0&&V.shop.length>1,soon=cycSoon(V);
    const d=h('div',{'data-n':n,class:'shT'+(can?' can':' no')+(D.sel&&D.sel.t==='terr'&&D.sel.n===n?' sel':'')+(prev.indexOf(keys[n])<0?' fresh':''),style:'--gc:'+g.c,title:td.n+' (terrain '+g.n+') — '+tTxt(td)},
      old?h('span',{class:'agetag'+(soon?'':' later'),title:soon?'Remplacé au début du prochain tour':'Remplacé dans 2 tours'},soon?'⏳ part bientôt':'⏳ dans 2 tours'):null,
      h('div',{class:'r1'},h('span',{class:'sz'},Array.from({length:td.size},()=>h('i'))),h('span',{class:'pr'},'🪙'+cost)),
      h('div',{class:'ef'},td.g==='bazar'?td.tn:'1 : '+td.t1+' · 2 : '+td.t2));
    d.addEventListener('click',e=>{e.stopPropagation();clickShop(n)});
    makeDrag(d,()=>{const V2=DUEL.V;if(!mine()||!canBuy(V2,V2.me,n))return null;return{t:'terr',n}});
    el.append(d)});
  D.prevShop=keys}
// une tuile de terrain de la boutique (vue latérale) : illustration (logo du jeu en attendant), coût, taille, effet
function shopTile(n,prev,keys){
  const D=DUEL,V=D.V,me=V.me,t=V.shop[n];if(!t)return h('div',{class:'shT side void'},'épuisé');
  const td=TD[t.d],g=GAMES[td.g],cost=terrCost(V,me,t),can=mine()&&canBuy(V,me,n),old=n===0&&V.shop.length>1,soon=cycSoon(V);
  const fx=td.g==='bazar'?[h('div',null,td.tn)]:[h('div',null,h('em',null,'1'),' '+td.t1),h('div',null,h('em',null,'2'),' '+td.t2)];
  const d=h('div',{'data-n':n,class:'shT side'+(can?' can':' no')+(D.sel&&D.sel.t==='terr'&&D.sel.n===n?' sel':'')+(prev.indexOf(keys[n])<0?' fresh':''),style:'--gc:'+g.c,title:td.n+' (terrain '+g.n+') — clic droit : détails'},
    h('div',{class:'tart'},td.img?h('img',{src:td.img,alt:'',draggable:'false'}):h('div',{class:'tph'})),
    h('span',{class:'tsz2'},Array.from({length:td.size},()=>h('i'))),h('span',{class:'tco'},'🪙 '+cost),
    old?h('span',{class:'agetag'+(soon?'':' later'),title:soon?'Remplacé au début du prochain tour':'Remplacé dans 2 tours'},soon?'⏳':'⏳ 2'):null,
    h('div',{class:'tfx2'},fx));
  d.addEventListener('click',e=>{e.stopPropagation();clickShop(n)});
  makeDrag(d,()=>{const V2=DUEL.V;if(!mine()||!canBuy(V2,V2.me,n))return null;return{t:'terr',n}});
  return d}
function shopSide(L,zx){
  const D=DUEL,V=D.V,me=V.me,el=$('#shopL'),f=$('#field');if(!el||!f)return;
  const keys=V.shop.map(t=>t?t.d:''),prev=D.prevShop||keys;
  const rc=mine()&&canRoll(V,me);
  const roll=h('button',{class:'rollb side'+(rc?' can':''),disabled:!rc,title:'Relancer les terrains : 2 nouveaux terrains pour '+ROLLC+' Or',
    onclick:e=>{e.stopPropagation();doAct({t:'roll'})}},h('span',{class:'ri'},'🎲'),h('small',null,ROLLC+' 🪙'));
  const n=V.tdn||0,tdk=h('div',{class:'tdk',title:'Pioche de terrains : '+n+' terrain'+(n>1?'s':'')+'. La boutique s’y réapprovisionne.'},
    h('div',{class:'tdkc'},n?backEl():null),h('div',{class:'tdkt'},h('b',null,'Terrains'),h('span',null,n+' en pioche')));
  const t0=shopTile(0,prev,keys),t1=shopTile(1,prev,keys);el.replaceChildren(tdk,t0,roll,t1);
  // positions : à la hauteur du plateau adverse, de la zone du milieu et de ton plateau
  const fr=f.getBoundingClientRect(),st=f.scrollTop,w=L.ws,x=Math.max(L.M,L.R+zx-L.GS-w);   // collée au plateau, à gauche
  const at=(node,ref,hgt)=>{const r=ref.getBoundingClientRect();node.style.left=x+'px';node.style.width=w+'px';node.style.top=(r.top-fr.top+st+(r.height-hgt)/2)+'px';node.style.height=hgt+'px'};
  const bo=$('#bOpp'),bm=$('#bMe'),zm=$('#field .zmid');
  if(bo&&bm){const hb=Math.min(bo.getBoundingClientRect().height,w*1.25);at(t0,bo,hb);at(t1,bm,hb)}
  if(zm){const r=zm.getBoundingClientRect();roll.style.left=x+'px';roll.style.width=w+'px';roll.style.top=(r.top-fr.top+st+r.height/2-22)+'px';roll.style.height='44px'}
  const ho=$('#hOpp');if(ho){const r=ho.getBoundingClientRect(),hh=Math.max(40,r.height);tdk.style.left=x+'px';tdk.style.width=w+'px';tdk.style.top=(r.top-fr.top+st+(r.height-hh)/2)+'px';tdk.style.height=hh+'px'}
  D.prevShop=keys}
function evNode(){
  const V=DUEL.V,el=$('#evb');el.innerHTML='';
  if(V.o.evt){const nr=Math.floor(V.round/3)*3+3,ev=EVENTS[V.nev];
    el.append(h('b',null,'🌀 Manche '+nr),ev.n+' : '+ev.tx)}
  else{el.hidden=true;return}el.hidden=false}
function endNode(){
  const D=DUEL,V=D.V,me=V.me,el=$('#endb'),m=mine();
  let idle=false;if(m){idle=true;const P=V.p[me];for(let i=0;i<P.hand.length;i++)if(playable(V,me,i)){idle=false;break}
    if(idle)for(let i=0;i<CELLS;i++)if(canAtk(V,me,i)){idle=false;break}}
  el.className='endb'+(m?(idle?' pulse':''):' wait');
  $('#ebt').textContent=V.over?'Terminé':m?(D.endArm&&!idle?'Sûr ?':'Fin du tour'):'Tour adverse…'}
function handNode(){
  const D=DUEL,V=D.V,me=V.me,el=$('#hand'),m=mine(),sc=el.scrollLeft;el.innerHTML='';
  V.p[me].hand.forEach((hd,i)=>{
    const cost=costOf(V,me,hd),can=m&&playable(V,me,i);
    const w=h('div',{class:'hc'+(can?' can':'')+(m&&!can?' np':'')+(D.sel&&(D.sel.t==='hand'||D.sel.t==='cry')&&D.sel.i===i?' sel':'')+(D.dragHand===i?' drag':'')},
      cardEl(hd.k,{cost,xv:liveX(V,me,hd.k)}));
    w.addEventListener('click',e=>{e.stopPropagation();clickHand(i)});
    w.addEventListener('pointerenter',()=>famHover(hd.k,true));w.addEventListener('pointerleave',()=>{if(DUEL&&DUEL.dragHand!==i)famHover(hd.k,false)});
    makeDrag(w,()=>{const V2=DUEL.V;if(!mine()||!playable(V2,V2.me,i))return null;return{t:'hand',i,k:hd.k}});
    el.append(w)});
  el.scrollLeft=sc;fitHand();
  if(D.dragHand!=null&&V.p[me].hand[D.dragHand])famHover(V.p[me].hand[D.dragHand].k,true)}
// valeur actuelle des effets « X par … » (affichée en direct sur les cartes de ta main)
function liveX(V,s,k){const cd=CARDS[k];if(!cd)return null;const L=fl(V,s),P=V.p[s],E=V.p[1-s],pl=(n,w,ws)=>n+' '+(n>1?(ws||w+'s'):w);
  for(const op of(cd.fx||[]).concat(cd.cry||[])){switch(op.t){
    case 'dmgFam':return pl((op.n||0)+(L[op.f]||0),'dégât');
    case 'dmgHand':return pl(Math.min(op.max||99,E.hand.length),'dégât');
    case 'rndFam':return pl((op.n||0)+(L[op.f]||0),'missile');
    case 'drawFam':return pl(Math.min(op.max||99,(op.n||0)+(L[op.f]||0)),'carte');
    case 'drawPz':{let n=(op.n||0)+(E.pz>0?1:0);E.board.forEach(c=>{if(c&&c.pz>0)n++});return pl(Math.min(n,op.max||99),'carte')}
    case 'drawAff':{let n=0;P.board.forEach(c=>{if(c&&affC(c,op.g)>=(op.lv||1))n++});return pl(Math.min(n,op.max||99),'carte')}
    case 'drainAff':{let n=0;P.board.forEach(c=>{if(c)n+=affC(c,op.g)});return pl(Math.min(n,op.max||99),'dégât')+' et +'+Math.min(n,op.max||99)+' PV'}
    case 'buffAff':{let n=0;P.board.forEach(c=>{if(c&&affC(c,op.g)>0)n++});return pl(n,'créature')+' renforcée'+(n>1?'s':'')}
    case 'goldDraw':{const n=Math.floor(Math.min(P.or,op.max||99)/(op.per||2));return pl(n,'carte')+' (−'+n*(op.per||2)+' Or)'}
    case 'goldDmg':return pl(Math.min(P.or,op.max||99),'dégât');
    case 'dmgEx':{let n=op.n||0;P.board.forEach(c=>{if(c&&c.ex&&!c.fum)n+=op.per||0});return pl(n,'dégât')}
    case 'stealOr':return pl(Math.min(E.or,(op.n||0)+(op.f?(L[op.f]||0):0)),'Or volé','Or volés');
    case 'highroll':{if(!op.allG)return null;const n=hrGames(V,s).length;return n+'/4 jeux de terrain'+(n>=4?' ✔':'')}
    case 'alt':{const ok=cond(V,op.c,{s}),o=(ok?op.a:op.b)[0];return o.t==='kill'?'détruit la cible':o.t==='dmg'?pl(o.n,'dégât'):null}}}
  return null}
// survol (ou glisser) d'une carte de la main : les créatures de la même famille et les compteurs de famille au-dessus de tes PV s'allument,
// et le compteur montre le point (et le bonus) que la carte ajouterait
function famHover(k,on){
  const fm=$('#fMe'),bm=$('#bMe');if(!fm||!bm)return;
  fm.querySelectorAll('.fx.hot').forEach(e=>e.classList.remove('hot'));fm.querySelectorAll('.fx.ghost,.pp i.gh.nw,.tag.nx').forEach(e=>e.remove());
  fm.querySelectorAll('.pp i.gh').forEach(e=>e.classList.remove('gh'));fm.querySelectorAll('.none').forEach(e=>e.hidden=false);
  bm.querySelectorAll('.card.famhi').forEach(e=>{e.classList.remove('famhi');e.style.removeProperty('--hc')});
  const cd=on&&CARDS[k];if(!cd)return;const fs=famsOf(cd),add=cd.t==='c';if(!fs.length)return;
  const V=DUEL&&DUEL.V,cnt=V?fl(V,V.me):{};
  for(const f of fs){const F=FAC[f],n=cnt[f]||0;let pill=fm.querySelector('.fx[data-f="'+f+'"]');
    if(!pill&&add){fm.querySelectorAll('.none').forEach(e=>e.hidden=true);
      pill=h('div',{class:'fx ghost',style:'--fc:'+F.c,'data-f':f},h('span',{class:'fi'},F.ic),h('span',null,F.n),h('span',{class:'pp'},Array.from({length:3},()=>h('i'))));fm.append(pill)}
    if(pill){pill.classList.add('hot');
      if(add){const dots=pill.querySelectorAll('.pp i');if(dots[n])dots[n].classList.add('gh');else pill.querySelector('.pp').append(h('i',{class:'gh nw'}));
        const t2=facTag(f,n+1);if(t2&&t2!==facTag(f,n))pill.append(h('span',{class:'tag nx'},'→ '+t2))}}
    bm.querySelectorAll('.card[data-k]').forEach(c=>{const cc=CARDS[c.dataset.k];if(cc&&(cc.fac||[]).indexOf(f)>=0){c.classList.add('famhi');c.style.setProperty('--hc',F.c)}})}}
// si la main est plus large que la place disponible, les cartes se chevauchent (au lieu de déborder de l'écran)
function fitHand(){const el=$('#hand');if(!el)return;const cs=[...el.children];if(!cs.length)return;
  cs.forEach(c=>c.style.marginLeft='');const W=el.clientWidth-16,w=cs[0].offsetWidth,n=cs.length,g=8;   // offsetWidth : une carte survolée (agrandie) ne fausse pas le calcul
  if(n>1&&n*w+(n-1)*g>W){const m=Math.max(-w*.62,(W-n*w)/(n-1));cs.forEach((c,j)=>{if(j)c.style.marginLeft=(m-g)+'px'})}}
window.addEventListener('resize',()=>{if(DUEL&&DUEL.V){fitHand();clearTimeout(DUEL._rs);DUEL._rs=setTimeout(()=>{if(DUEL&&DUEL.V)shopNode()},120)}});
// deck face cachée : une pile de dos de cartes avec le nombre de cartes restantes
function deckNode(s,el){if(!el)return;const P=DUEL.V.p[s],n=P.dn||0,k=Math.min(4,Math.ceil(n/8));
  el.replaceChildren(...Array.from({length:Math.max(1,k)},(_,j)=>h('div',{class:'dkc'+(n?'':' none'),style:'--j:'+j},n?backEl():null)),
    h('b',{class:'dkn',title:'Cartes dans le deck'},String(n)),...(DUEL.V.o.fat&&P.rsh>0?[h('i',{class:'dkf',title:'Fatigue : '+(P.fat+1)+' dégât'+(P.fat?'s':'')+' au début du prochain tour'},'🥵'+(P.fat+1))]:[]));
  el.title=(s===DUEL.V.me?'Ton deck':'Deck adverse')+' : '+n+' carte'+(n>1?'s':'')+(DUEL.V.o.fat&&P.rsh>0?' · deck déjà épuisé une fois : Fatigue '+(P.fat+1)+' au prochain tour':'')}
// mulligan : avant le premier tour, chaque joueur choisit les cartes de sa main de départ à remplacer
function mullNode(){
  const D=DUEL,V=D.V,old=$('#mullov');
  if(!V||V.phase!=='mull'||V.over){if(old)old.remove();D.mullSel=null;D.mullSent=0;return}
  const me=V.me,op=1-me,P=V.p[me],done=!!(V.mull&&V.mull[me])||!!D.mullSent;if(!D.mullSel)D.mullSel=new Set();const sel=D.mullSel;
  const sig=(done?'d':'c')+P.hand.map(c=>c.id).join(',');if(old&&old.dataset.sig===sig)return;   // rien n'a changé : la sélection se met à jour sur place
  const lab=()=>sel.size?'Remplacer '+sel.size+' carte'+(sel.size>1?'s':''):'Garder ma main';
  const go=done?null:h('button',{class:'btn green mgo',onclick:()=>{const idx=[...sel].sort((x,y)=>x-y);D.mullSel=new Set();D.mullSent=1;
    const r=doAct({t:'mull',idx});if(r&&r.ok===false){D.mullSent=0;mullNode();return}mullNode();
    setTimeout(()=>{if(DUEL===D&&D.mullSent&&D.V&&D.V.phase==='mull'&&!(D.V.mull&&D.V.mull[me])){D.mullSent=0;mullNode()}},4000)}},lab());
  const cards=P.hand.map((c,i)=>{const el=h('div',{class:'mc'+(!done&&sel.has(i)?' out':''),oncontextmenu:e=>{e.preventDefault();showCard(c.k)}},
      cardEl(c.k,{big:true}),h('div',{class:'mx'},'♻ Remplacer'));
    el.onclick=()=>{if(done)return;if(sel.has(i))sel.delete(i);else sel.add(i);el.classList.toggle('out',sel.has(i));if(go)go.textContent=lab()};return el});
  const ov=h('div',{id:'mullov','data-sig':sig},h('div',{class:'mbox'},
    h('h2',null,done?'Main validée':'Ta main de départ'),
    h('p',{class:'mut'},done?'En attente de '+V.p[op].nm+'…':'Clique sur les cartes que tu veux remplacer, puis valide : elles retournent dans ton deck et tu en pioches autant de nouvelles. Clic droit : voir une carte en détail.'),
    h('div',{class:'mrow'+(done?' done':'')},cards),
    h('p',{class:'sm mfirst'},V.first===me?'Tu joues en premier.':'Tu joues en second : tu recevras la Pièce (+1 ◆ pendant un tour) après le mulligan.'),go));
  if(old)old.replaceWith(ov);else $('#duel').append(ov)}
// Coco (esprit tourmenté) : à ton tour, choisis la carte à garder parmi celles piochées (les autres vont au cimetière)
function pickNode(){
  const D=DUEL,V=D.V,old=$('#pickov'),me=V?V.me:0,q=V&&!V.over&&!V.phase&&V.p[me].pq&&V.p[me].pq[0],g=q&&q.c;
  if(!g){if(old)old.remove();D.pickSent=0;return}
  const dup=q.m==='dup',dis=q.m==='disc',tgm=q.m==='tg',test=q.m==='test',sig=q.m+':'+g.map(c=>c.id).join(',');if(old&&old.dataset.sig===sig)return;D.pickSent=0;
  const cards=g.map((c,i)=>{const el=h('div',{class:'mc',oncontextmenu:e=>{e.preventDefault();showCard(c.k)}},c.k?cardEl(c.k,{big:true}):h('div',{class:'mhero'},h('b',null,c.s===me?'Ton héros':'Héros adverse'),h('span',null,'❤ '+V.p[c.s].hp)),h('div',{class:'mx'},test?'＋ Ajouter':tgm?'🎯 '+(c.s===me?'Allié':'Ennemi'):dis?'✝ Défausser':dup?'🪞 Dupliquer':'✔ Garder'));
    el.onclick=()=>{if(D.pickSent)return;D.pickSent=1;const r=doAct({t:'pick',i});if(r&&r.ok===false)D.pickSent=0;
      setTimeout(()=>{if(DUEL===D&&D.pickSent){D.pickSent=0;pickNode()}},3000)};return el});
  const full=V.p[me].hand.length>=V.o.hand;
  const ov=h('div',{id:'pickov','data-sig':sig},h('div',{class:'mbox'},
    h('h2',null,test?'Code test : choisis une carte':tgm?'Cri d’arrivée : '+fullName(CARDS[q.k]):dis?'Coup de folie':dup?'Miroir de Kalandra':'Coco, esprit tourmenté'),
    h('p',{class:'mut'},test?'Choisis une carte de ton deck : elle va dans ta main. Tu as 10 Démoflux. Clic droit : voir une carte en détail.':tgm?'Choisis sa cible. '+(CARDS[q.k].tx||''):dis?'Choisis la carte de ta main à défausser : elle va au cimetière. Clic droit : voir une carte en détail.':dup?'Choisis une carte de ta main : une copie s’ajoute à ta main. Clic droit : voir une carte en détail.':'Garde une des '+g.length+' cartes piochées : '+(g.length>2?'les autres vont':'l’autre va')+' au cimetière. Clic droit : voir une carte en détail.'),
    h('div',{class:'mrow'+(g.length>5?' many':'')},cards),
    full&&!dis&&!tgm&&!test?h('p',{class:'sm mfirst'},dup?'⚠ Ta main est pleine : la copie sera brûlée.':'⚠ Ta main est pleine : la carte gardée sera brûlée.'):null));
  if(old)old.replaceWith(ov);else $('#duel').append(ov)}
// Osiris (expert bluffeur) : avant son tour, l'adversaire d'Osiris choisit pierre, feuille ou ciseaux (15 s, sinon au hasard)
function rpsBtns(on,pick){return h('div',{class:'rpsrow'},RPSK.map(v=>h('button',{class:'rpsbtn',type:'button',disabled:!on,onclick:()=>pick(v)},h('b',null,RPSI[v]),h('span',null,RPSN[v]))))}
function rpsNode(){
  const D=DUEL,V=D.V,old=$('#rpsov');
  if(!V||V.over||V.phase!=='rps'){if(old)old.remove();D.rpsSent=0;return}
  const me=V.me,op=1-me,ch=V.rpsTo===me,sent=ch&&D.rpsSent;
  const sig=(ch?'c'+(sent||''):'w')+(V.rps||[]).map(r=>r.id+r.v).join(',');if(old&&old.dataset.sig===sig)return;
  const n=(V.rps||[]).length,mineL=(V.rps||[]).filter(r=>r.s===me);
  const pick=v=>{if(D.rpsSent)return;D.rpsSent=v;const r=doAct({t:'rps',v});if(r&&r.ok===false)D.rpsSent=0;rpsNode();
    setTimeout(()=>{if(DUEL===D&&D.rpsSent&&D.V&&D.V.phase==='rps'&&D.V.rpsTo===me){D.rpsSent=0;rpsNode()}},4000)};
  const box=ch?h('div',{class:'mbox rpsbox'},
      h('h2',null,'Pierre, feuille, ciseaux'),
      h('p',{class:'mut'},(n>1?n+' Osiris ont':'Osiris a')+' choisi en secret. Choisis ton signe avant le début de ton tour : si tu perds, Osiris vole tout ton Or et son camp pioche 3 cartes. Égalité : rien ne se passe.'),
      rpsBtns(!sent,pick),
      h('p',{class:'sm rpst'},sent?'Signe choisi : '+RPSI[sent]+' '+RPSN[sent]+'…':h('span',null,'Sans choix, signe au hasard dans ',h('b',{id:'rpst'},'15 s'))))
    :h('div',{class:'rpsw'},h('b',{class:'rpsk'},'Pierre, feuille, ciseaux'),
      mineL.length?h('span',{class:'rpsme'},(mineL.length>1?'Tes signes : ':'Ton signe : ')+mineL.map(r=>RPSI[r.v]+' '+RPSN[r.v]).join(', ')):null,
      h('span',{class:'mut'},V.p[op].nm+' choisit… ',h('b',{id:'rpst'},'15 s')));
  const ov=h('div',{id:'rpsov',class:ch?'':'wait','data-sig':sig},box);
  if(old)old.replaceWith(ov);else(ch?$('#duel'):$('#field .zmid')||$('#duel')).append(ov)}
// fin du tour avec Osiris sur le plateau : on choisit d'abord son signe secret
function rpsEndPop(){
  const D=DUEL;if(!mine()||$('#rpsend'))return;
  const go=v=>{const p=$('#rpsend');if(p)p.remove();doAct(v?{t:'end',rps:v}:{t:'end'})};
  const el=h('div',{id:'rpsend',onclick:e=>{if(e.target.id==='rpsend')e.currentTarget.remove()}},h('div',{class:'mbox rpsbox'},
    h('h2',null,'Osiris, expert bluffeur'),
    h('p',{class:'mut'},'Choisis ton signe secret, puis ton tour se termine. Au début de son tour, ton adversaire choisit le sien : s’il perd, tu voles tout son Or et tu pioches 3 cartes.'),
    rpsBtns(true,go),
    h('div',{class:'rpsfoot'},h('button',{class:'btn',type:'button',onclick:()=>go(RPSK[Math.random()*3|0])},'🎲 Au hasard'),h('button',{class:'btn',type:'button',onclick:()=>{const p=$('#rpsend');if(p)p.remove()}},'Annuler'))));
  $('#duel').append(el)}
function rpsEndNode(){const p=$('#rpsend');if(p&&(!DUEL.V||!mine()))p.remove()}
// révélation : les deux signes côte à côte, puis le résultat
function rpsShow(e,t){
  setTimeout(()=>{const V=DUEL&&DUEL.V;if(!V)return;const me=V.me,own=e.ts===me,nm=s=>s===me?'Toi':V.p[s].nm;
    const res=e.r===0?'Égalité : rien ne se passe':e.r>0?(e.ok?(own?'Osiris gagne : tu voles tout l’Or et pioches 3 cartes':'Osiris gagne : il vole tout ton Or'):'Osiris gagne… mais il n’est plus là'):(own?'Raté : ton adversaire a vu clair':'Gagné : Osiris repart bredouille');
    const el=h('div',{class:'rpsrv '+(e.r===0?'tie':(e.r>0)===own?'good':'bad')},
      h('div',{class:'rpsd'},h('div',{class:'rpsh l'},h('b',null,RPSI[e.v]),h('span',null,'Osiris · '+nm(e.ts))),h('i',null,'contre'),h('div',{class:'rpsh r'},h('b',null,RPSI[e.o]),h('span',null,nm(1-e.ts)))),
      h('p',null,res));
    document.body.append(el);setTimeout(()=>el.remove(),1500*ANIM)},t*ANIM)}
// cimetière : pile face visible (la dernière carte arrivée dessus), à côté du deck ; clic = tout le cimetière
function graveNode(s,el){if(!el)return;const V=DUEL.V,P=V.p[s],L=P.grave||[],n=L.length,top=n?L[n-1]:null,k=n?Math.min(3,Math.ceil(n/6)):0;
  el.replaceChildren(...Array.from({length:Math.max(0,k-1)},(_,j)=>h('div',{class:'gvl',style:'--j:'+(k-1-j)})),
    top?h('div',{class:'gvt'},cardEl(top.k)):h('div',{class:'gve'},'✝'),
    h('b',{class:'dkn'},'✝ '+n));
  el.classList.toggle('none',!n);
  el.title=(s===V.me?'Ton cimetière':'Cimetière adverse')+' : '+n+' carte'+(n>1?'s':'')+(n?' (clique pour le voir)':'');
  el.onclick=e=>{e.stopPropagation();pileModal(s,'grave')}}
// animation de pioche : un dos de carte part du deck vers la main
function drawFly(s,idx,delay){
  setTimeout(()=>{const D=DUEL;if(!D||!D.V)return;const me=D.V.me,from=$(s===me?'#dkMe':'#dkOpp');if(!from)return;
    let to;if(s===me){const hs=$$('#hand .hc');to=hs[idx]||hs[hs.length-1]}else to=$('#hOpp .hst.handc')||$('#hOpp');
    if(!to||!from.isConnected)return;const top=from.lastElementChild&&from.lastElementChild.previousElementSibling||from;
    const a=top.getBoundingClientRect(),b=to.getBoundingClientRect();if(!a.width)return;
    const f=h('div',{class:'flyc',style:'left:'+a.left+'px;top:'+a.top+'px;width:'+a.width+'px'},backEl());document.body.append(f);
    if(s===me)to.classList.add('incoming');
    const sc=s===me?b.width/a.width:.45,dx=b.left-a.left+(s===me?0:b.width/2-a.width*sc/2),dy=b.top-a.top;
    const an=f.animate([{transform:'translate(0,0) rotate(0deg) scale(1)'},{transform:'translate('+dx*.45+'px,'+(dy*.45-70)+'px) rotate(-10deg) scale('+(1+sc)*.6+')',offset:.5},
      {transform:'translate('+dx+'px,'+dy+'px) rotate(0deg) scale('+sc+')',opacity:s===me?1:.15}],{duration:560*ANIM,easing:'cubic-bezier(.3,.6,.3,1)'});
    an.onfinish=()=>{f.remove();if(s===me&&to.isConnected){to.classList.remove('incoming');to.classList.add('drawn');setTimeout(()=>to.classList.remove('drawn'),520*ANIM)}}},(delay||0)*ANIM)}

// ---------- bandeau d'information (barre du haut) ----------
function terrDetail(ctx){
  const V=DUEL.V,me=V.me,t=ctx.t,td=TD[t.d],g=GAMES[td.g],P=V.p[ctx.s],out=[];
  out.push(...[h('h4',null,gi(td.g),' '+td.n),
    h('div',{class:'mut sm'},'Terrain '+g.n+' · '+td.size+' case'+(td.size>1?'s':'')+(ctx.cost!=null?' · 🪙 '+ctx.cost:'')+(ctx.placed?' · posé sur '+(ctx.s===me?'ton':'son')+' plateau':'')),
    terrFxEl(td),
    td.g==='lol'?h('div',{class:'sm',style:'color:#dcc38d'},'Lisdoon (Roro) y attaque deux fois par tour.'):null,
    td.g==='bazar'?h('div',{class:'sm mut'},'Terrain neutre : profite à toutes les créatures, quelle que soit leur affinité.'):h('div',{class:'sm mut'},'L’effet dépend de l’affinité '+g.n+' de chaque créature (points sur la carte).')].filter(Boolean));
  let cells=null;
  if(ctx.placed){cells=[];for(let i=0;i<CELLS;i++)if(P.cells[i]===t.id)cells.push(i)}
  else if(ctx.at!=null){const at=Math.max(0,Math.min(ctx.at,CELLS-td.size));cells=[];for(let i=at;i<at+td.size;i++)cells.push(i)}
  const rows=[];let empty=0,over=0;
  const addRow=c=>{const r=terrFor(c.k,t.d);
    rows.push(h('div',{class:'pv'},miniAv(c.k),h('b',null,fullName(c.k)+(td.g==='bazar'?'':' · aff. '+r.a)),h('span',{class:r.a?'gn':'nn'},r.a?'✔':'✕')),
      h('div',{class:'sm',style:'margin:-2px 0 2px 34px;color:'+(r.a?'#c5d8c3':'#a69d91')},r.tx))};
  if(cells){cells.forEach(i=>{const c=P.board[i];if(c)addRow(c);else empty++;if(!ctx.placed&&P.cells[i]&&P.cells[i]!==t.id)over++})}
  else if(!ctx.placed){const L=[];P.board.forEach(c=>{if(c)L.push({c,v:affOf(c.k,td.g)})});L.sort((a,b)=>b.v-a.v).slice(0,4).forEach(x=>addRow(x.c))}
  if(cells&&!ctx.placed)out.push(h('div',{class:'sm',style:'margin-top:7px'},h('b',{style:'color:#dcc38d'},'Cases '+(cells[0]+1)+(cells.length>1?' à '+(cells[cells.length-1]+1):'')+' : '),rows.length?'voici l’effet sur tes créatures :':'aucune créature dessus pour l’instant.'));
  else if(!cells&&!ctx.placed)out.push(h('div',{class:'sm',style:'margin-top:7px'},rows.length?'Sur tes créatures en jeu :':'Clique (ou glisse vers) une case de ton plateau pour choisir l’emplacement.'));
  else if(ctx.placed)out.push(h('div',{class:'sm',style:'margin-top:7px'},rows.length?'Créatures dessus :':'Aucune créature dessus pour l’instant.'));
  if(rows.length)out.push(h('div',{class:'tp-l'},rows));
  if(empty&&cells&&!ctx.placed)out.push(h('div',{class:'sm mut',style:'margin-top:5px'},empty+' case'+(empty>1?'s':'')+' vide'+(empty>1?'s':'')+' : l’effet s’appliquera aux créatures que tu y poseras.'));
  if(over)out.push(h('div',{class:'sm',style:'margin-top:5px;color:#bc8c94'},'⚠ Remplace le terrain déjà posé sur '+over+' de ces cases.'));
  if(ctx.buy&&!ctx.placed&&V.p[me].or<ctx.cost)out.push(h('div',{class:'sm',style:'margin-top:5px;color:#bc8c94'},'Il te manque 🪙 '+(ctx.cost-V.p[me].or)+' pour l’acheter.'));
  if(ctx.buy&&V.shop.length>1&&ctx.n===0)out.push(h('div',{class:'sm',style:'margin-top:5px;color:#cab095'},cycSoon(V)?'⏳ Ce terrain sera remplacé au début du prochain tour.':'⏳ Ce terrain sera remplacé dans 2 tours.'));
  if(ctx.placed&&t.lk)out.push(h('div',{class:'sm',style:'margin-top:6px;color:#9cc8e8'},'🔒 Posé par Kirua, la reine des neiges : indestructible, recouvrable, et fond quand elle quitte le plateau.'));
  return out}
function facDetail(I){
  const V=DUEL.V,f=I.fac,F=FAC[f],P=V.p[I.s],mem=[];
  P.board.forEach(c=>{if(c&&CARDS[c.k].fac.indexOf(f)>=0)mem.push(c.k)});
  const n=mem.length,t=facTier(f,n);
  return[h('h4',null,F.ic+' '+F.n),
    h('div',{class:'pd'},F.sum),
    h('div',{class:'mut sm'},(I.s===V.me?'Sur ton plateau':'Sur son plateau')+' : '+n+' créature'+(n>1?'s':'')+(t?' → palier ×'+t[0]+' actif.':' → il en faut 2 pour activer la famille.')),
    facTiers(f,n),h('div',{class:'members'},mem.map(memEl))]}
function showInfo(){
  const D=DUEL,V=D.V,box=$('#info'),I=D.info;box.innerHTML='';
  if(I&&I.cr){const c0=V.p[I.s].board[I.i];if(!c0||c0.id!==I.cr.id){D.info=null;showInfo();return}I.cr=c0}   // la créature a changé ou disparu
  const sel=D.sel,ht=hintText(),act=[];
  const preview=I&&I.hand!=null&&sel&&(sel.t==='hand'||sel.t==='cry')&&sel.i===I.hand?effectPreview(V,V.me,I.k):null;
  if(I&&(I.terr||I.shop!=null)){if(sel&&sel.t==='terr'){
    if(sel.at!=null)act.push(h('button',{class:'btn gold sm',onclick:e=>{e.stopPropagation();buyTerr_(sel.n,sel.at)}},'Placer ici'));
    act.push(h('button',{class:'btn sm',onclick:e=>{e.stopPropagation();D.sel=null;renderDuel()}},'Annuler'))}}
  else if(I&&!I.fac&&I.k&&CARDS[I.k]){
    if(sel&&sel.t==='hand'&&CARDS[sel.k].t==='s'&&!cryTg(CARDS[sel.k]))act.push(h('button',{class:'btn pri sm',style:'--h:#73b0ad;--ht:#241e17',onclick:e=>{e.stopPropagation();playSpellOn(sel.i,null)}},'Jouer le sort'));
    if(sel)act.push(h('button',{class:'btn sm',onclick:e=>{e.stopPropagation();D.sel=null;renderDuel()}},'Annuler'))}
  box.classList.toggle('empty',!ht&&!act.length&&!preview);const tp=$('.dtop');if(tp)tp.classList.toggle('hashint',!!(ht||act.length||preview));
  if(ht)box.append(h('div',{class:'hintline'},'👉 '+ht));
  if(act.length)box.append(h('div',{class:'acts'},act));
  if(preview){const cd=CARDS[I.k];box.append(h('div',{class:'effect-preview'},
    h('b',null,'Aperçu des effets · '+cd.n),
    cd.tx?h('div',{class:'previewtext'},txNodes(cd.tx)):null,
    preview.lines.map(line=>h('div',{class:'previewtargets'},line))))}}

// ---------- interactions ----------
function clickHand(i){
  const D=DUEL,V=D.V,me=V.me,hd=V.p[me].hand[i];if(!hd||Date.now()-D.dragT<300)return;
  D.info={k:hd.k,hand:i};
  if(!mine()){D.sel=null;renderDuel();return}
  const cd=CARDS[hd.k];
  if(D.sel&&D.sel.t==='hand'&&D.sel.i===i){
    if(cd.t==='s'&&!cryTg(cd)&&playable(V,me,i)){playSpellOn(i,null);return}
    D.sel=null;renderDuel();return}
  if(!playable(V,me,i)){toast(costOf(V,me,hd)>V.p[me].eth?'Pas assez de Démoflux.':cd.t==='c'||(cd.needSlot&&!V.p[me].board.some(c=>!c))?'Plateau plein.':'Aucune cible valide.');D.sel=null;renderDuel();return}
  D.sel={t:'hand',i,k:hd.k};renderDuel()}
function clickShop(n){
  const D=DUEL,V=D.V,me=V.me,t=V.shop[n];if(!t||Date.now()-D.dragT<300)return;
  D.info={shop:n};
  if(!mine()){D.sel=null;renderDuel();return}
  if(V.p[me].or<terrCost(V,me,t)){toast('Il te faut 🪙 '+terrCost(V,me,t)+' pour ce terrain.');D.sel=null;renderDuel();return}
  D.sel=(D.sel&&D.sel.t==='terr'&&D.sel.n===n)?null:{t:'terr',n,at:null};renderDuel()}
function setTerrAt(i){
  const D=DUEL,V=D.V,s=D.sel;if(!s||s.t!=='terr')return;const t=V.shop[s.n];if(!t)return;
  const at=Math.max(0,Math.min(i,CELLS-TD[t.d].size));
  if(!freeSpan(V.p[V.me],at,TD[t.d].size)){toast('Emplacement invalide.');return}
  if(s.at===at){buyTerr_(s.n,at);return}
  s.at=at;renderDuel()}
function buyTerr_(n,at){const D=DUEL;D.info=null;doAct({t:'buy',n,at})}
function clickSlot(s,i,event){
  const D=DUEL,V=D.V,me=V.me,c=i>=0?V.p[s].board[i]:null,sel=D.sel;
  if(Date.now()-D.dragT<300)return;
  if(event&&event.ctrlKey&&event.button===0&&s===me&&c){
    event.preventDefault();D.info={k:c.k,cr:c,s,i};
    if(!mine()){D.sel=null;toast('Tu ne peux attaquer que pendant ton tour.');renderDuel();return}
    const blocked=faceAttackBlockReason(V,me,i);
    if(blocked){D.sel=canAtk(V,me,i)?{t:'atk',f:i}:null;toast(blocked);renderDuel();return}
    doAct({t:'atk',f:i,tg:{s:1-me,i:-1}});return}
  if(sel&&mine()){
    if(sel.t==='hand'){const cd=CARDS[V.p[me].hand[sel.i].k];
      if(cd.t==='c'){if(s===me&&i>=0&&!c){playCreatureAt(sel.i,i);return}}
      else if(cd.tg&&isHL(s,i)){const sp=cryTg(cd);if(sp&&sp.sg2){D.sel={t:'sp2',i:sel.i,k:sel.k,t1:{s,i}};renderDuel();return}playSpellOn(sel.i,{s,i});return}}
    else if(sel.t==='sp2'){if(isHL(s,i)){doAct({t:'play',i:sel.i,tg:sel.t1,tg2:{s,i}});return}}
    else if(sel.t==='cry'){if(isHL(s,i)){if(sel.sp.tg2&&!sel.t1){D.sel=Object.assign({},sel,{t1:{s,i}});renderDuel();return}
      const a={t:'play',i:sel.i,sl:sel.sl,tg:sel.t1||{s,i}};if(sel.t1)a.tg2={s,i};doAct(a);return}}
    else if(sel.t==='atk'||sel.t==='mv'){
      if(sel.t==='atk'&&isHL(s,i)){doAct({t:'atk',f:sel.f,tg:{s,i}});return}
      if(s===me&&i>=0&&i===sel.f){D.sel=null;renderDuel();return}
      if(s===me&&c){D.sel=canAtk(V,me,i)?{t:'atk',f:i}:null;D.info={k:c.k,cr:c,s,i};renderDuel();return}}
    else if(sel.t==='terr'){if(s===me&&i>=0){setTerrAt(i);return}}}
  if(c){
    D.info={k:c.k,cr:c,s,i};
    D.sel=(s===me&&mine()&&canAtk(V,me,i))?{t:'atk',f:i}:null;renderDuel()}
  else{D.info=null;D.sel=null;renderDuel()}}
function playCreatureAt(hi,slot){
  const D=DUEL,V=D.V,me=V.me,hd=V.p[me].hand[hi],cd=CARDS[hd.k],sp=cryTg(cd);
  if(sp&&targets(V,me,sp.tg,sp.tgf).length){D.sel={t:'cry',i:hi,sl:slot,k:hd.k,sp};renderDuel()}
  else doAct({t:'play',i:hi,sl:slot})}
function playSpellOn(hi,tg){const a={t:'play',i:hi};if(tg)a.tg=tg;doAct(a)}
function doAct(a){
  const D=DUEL;D.sel=null;D.endArm=0;
  const r=D.ctl.act(a);
  if(r&&r.ok===false){toast(r.err);renderDuel()}
  else if(D.mode==='guest')renderDuel();
  return r}
function endTurnClick(){
  const D=DUEL,V=D.V;if(!mine())return;
  const me=V.me;let idle=true;for(let i=0;i<V.p[me].hand.length;i++)if(playable(V,me,i)){idle=false;break}
  if(idle)for(let i=0;i<CELLS;i++)if(canAtk(V,me,i)){idle=false;break}
  if(!idle&&!D.endArm){D.endArm=1;endNode();setTimeout(()=>{if(DUEL===D){D.endArm=0;if(D.V&&mine())endNode()}},2200);return}
  if(osirisUp(V,me)){rpsEndPop();return}                                                    // Osiris : choisir son signe secret avant de finir le tour
  doAct({t:'end'})}
document.addEventListener('keydown',e=>{if(!DUEL||!DUEL.V||$('#modal').classList.contains('on')||$('#pickov')||$('#rpsov:not(.wait)'))return;
  if($('#rpsend')){if(e.key==='Escape')$('#rpsend').remove();return}
  if(e.key==='Escape'&&$('.cpop')){closePop();return}
  if(e.key==='Escape'&&(DUEL.sel||DUEL.info)){DUEL.sel=null;DUEL.info=null;renderDuel();return}
  if(e.key==='Escape'&&!DUEL.drag){e.preventDefault();duelMenu();return}
  if((e.key===' '||e.key==='Enter')&&e.target===document.body){e.preventDefault();endTurnClick()}});

// ---------- glisser-déposer (souris) ----------
function makeDrag(el,getPayload){
  el.addEventListener('pointerdown',e=>{
    if(e.button>0||!DUEL||!DUEL.V||e.target.closest('.exb'))return;
    const D=DUEL,p=getPayload(e);if(!p)return;
    const sx=e.clientX,sy=e.clientY,pid=e.pointerId;let started=false,ghost=null;
    const clean=()=>{window.removeEventListener('pointermove',mv);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',cn);
      if(ghost)ghost.remove();stripPreview(null);atkPreview(null);$$('.hov').forEach(x=>x.classList.remove('hov'));D.drag=null;if(D.dragHand!=null){D.dragHand=null}};
    const mv=ev=>{
      if(ev.pointerId!==pid)return;const dx=ev.clientX-sx,dy=ev.clientY-sy;
      if(!started){
        if(Math.hypot(dx,dy)<8)return;
        started=true;D.drag=p;D.dragT=Date.now();
        ghost=h('div',{class:'ghost'+(p.t==='terr'||p.t==='tm'?' terr':'')+(p.t==='atk'?' cr':'')});
        if(p.t==='hand')ghost.append(cardEl(p.k));
        else if(p.t==='atk')ghost.append(cardEl(p.k,{bd:true}));
        else{const td=TD[p.t==='tm'?p.d:DUEL.V.shop[p.n].d];ghost.append(h('div',{class:'shT',style:'--gc:'+GAMES[td.g].c+';min-width:130px'},h('b',null,gi(td.g),' '+td.n)))}
        document.body.append(ghost);
        D.info=p.t==='hand'?{k:p.k,hand:p.i}:p.t==='atk'?D.info:p.t==='tm'?D.info:{shop:p.n};
        D.sel=p.t==='hand'?{t:'hand',i:p.i,k:p.k}:p.t==='atk'?(p.atk?{t:'atk',f:p.f}:{t:'mv',f:p.f}):p.t==='tm'?{t:'tm',id:p.id,n:p.n,off:p.off}:{t:'terr',n:p.n,at:null};
        D.dragHand=p.t==='hand'?p.i:null;renderDuel()}
      ghost.style.left=ev.clientX+'px';ghost.style.top=ev.clientY+'px';
      $$('.hov').forEach(x=>x.classList.remove('hov'));const dz=hitTest(ev.clientX,ev.clientY);
      if(dz){const t=dz.t==='slot'?$('.slot[data-s="'+dz.s+'"][data-i="'+dz.i+'"]'):dz.t==='hero'?$('.hero[data-s="'+dz.s+'"]'):null;if(t)t.classList.add('hov')}
      if(p.t==='terr'||p.t==='tm'){const V=DUEL.V,td=TD[p.t==='tm'?p.d:V.shop[p.n].d],n=p.t==='tm'?p.n:td.size;
        if(dz&&dz.t==='slot'&&dz.s===V.me)stripPreview(Math.max(0,Math.min(dz.i-(p.off||0),CELLS-n)),n,GAMES[td.g].c,[gi(td.g),' '+td.n]);else stripPreview(null)}};
    const up=ev=>{
      if(ev.pointerId!==pid)return;const was=started,dz=was?hitTest(ev.clientX,ev.clientY):null;clean();
      if(was){D.dragT=Date.now();dropOn(p,dz,ev)}};
    const cn=ev=>{if(ev.pointerId!==pid)return;const was=started;clean();if(was){D.sel=null;D.dragHand=null;renderDuel()}};
    window.addEventListener('pointermove',mv);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',cn)})}
function hitTest(x,y){
  for(const el of document.elementsFromPoint(x,y)){let n=el;while(n&&n!==document.body){if(n._dz){
      if(n._dz.t==='strip'&&n._cellAt)return{t:'slot',s:n._dz.s,i:Math.max(0,Math.min(CELLS-1,n._cellAt(x))),strip:1};return n._dz}n=n.parentElement}}
  const f=$('#field'),hd=$('#hand');if(f&&hd){const r=f.getBoundingClientRect(),hr=hd.getBoundingClientRect();if(x>=r.left&&x<=r.right&&y>=r.top&&y<hr.top-8)return{t:'field'}}
  return null}
function dropOn(p,dz,ev){
  const D=DUEL;if(!D||!D.V)return;const V=D.V,me=V.me;
  if(!mine()){D.sel=null;renderDuel();return}
  const ti=dz?(dz.t==='hero'?-1:dz.i):null;
  if(p.t==='hand'){
    const hd=V.p[me].hand[p.i];if(!hd||hd.k!==p.k){D.sel=null;renderDuel();return}
    const cd=CARDS[hd.k];let sp=null;
    if(cd.t==='c'){if(dz&&dz.t==='slot'&&dz.s===me&&!V.p[me].board[dz.i]){playCreatureAt(p.i,dz.i);return}}
    else{sp=cryTg(cd);
      if(sp){if(dz&&(dz.t==='slot'||dz.t==='hero')&&isHL(dz.s,ti)){if(sp.sg2){D.sel={t:'sp2',i:p.i,k:hd.k,t1:{s:dz.s,i:ti}};renderDuel();return}playSpellOn(p.i,{s:dz.s,i:ti});return}}
      else if(dz){playSpellOn(p.i,null);return}}
    toast(cd.t==='c'?'Dépose la carte sur un emplacement libre de ton plateau.':sp?'Dépose le sort sur une cible en surbrillance.':'Dépose le sort sur le plateau.');
    D.sel=null;renderDuel();return}
  if(p.t==='atk'){
    if(p.atk&&dz&&(dz.t==='slot'||dz.t==='hero')&&isHL(dz.s,ti)){doAct({t:'atk',f:p.f,tg:{s:dz.s,i:ti}});return}
    D.sel=null;renderDuel();return}
  if(p.t==='terr'){
    const t=V.shop[p.n];if(dz&&dz.t==='slot'&&dz.s===me&&t){buyTerr_(p.n,Math.max(0,Math.min(dz.i,CELLS-TD[t.d].size)));return}
    D.sel=null;renderDuel()}}

// ---------- flèche de visée : relie l'attaquant (ou le sort) à la cible ----------
function aimSrc(){const D=DUEL,s=D&&D.sel;if(!s||!D.V||!mine())return null;const me=D.V.me;
  if(s.t==='atk'||s.t==='mv')return{el:elAt(me,s.f),mv:s.t==='mv'};
  if(s.t==='cry')return{el:elAt(me,s.sl)};
  if(s.t==='sp2')return{el:elAt(s.t1.s,s.t1.i)};
  if(s.t==='hand'){const hd=D.V.p[me].hand[s.i],cd=hd&&CARDS[hd.k];if(cd&&cd.t==='s'&&cryTg(cd))return{el:$$('#hand .hc')[s.i]}}
  return null}
function aimDraw(){
  const D=DUEL,box=$('#aim');if(!box)return;const src=aimSrc();
  if(!src||!src.el||D.mx==null){box.style.display='none';atkPreview(null);return}
  const a=ctr(src.el);let b={x:D.mx,y:D.my},col=src.mv?'#93c489':'#dcc38d',snap=false;
  const dz=hitTest(D.mx,D.my),me=D.V.me;
  if(dz&&(dz.t==='slot'||dz.t==='hero')&&!dz.strip){const ti=dz.t==='hero'?-1:dz.i;
    if(!src.mv&&isHL(dz.s,ti)){b=ctr(elAt(dz.s,ti));col=dz.s===me?'#75b5d6':'#c15c58';snap=true}
    else if((D.sel.t==='atk'||D.sel.t==='mv')&&dz.s===me&&ti>=0&&ti!==D.sel.f){b=ctr(elAt(me,ti));col='#93c489';snap=true}}
  atkPreview(snap&&(D.sel.t==='atk')&&dz?{f:D.sel.f,s:dz.s,i:dz.t==='hero'?-1:dz.i}:null);
  const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<24){box.style.display='none';return}
  const cx=a.x+dx/2-dy*.18,cy=a.y+dy/2+dx*.18-Math.min(90,d*.18);
  const t=.92,ex=(1-t)*(1-t)*a.x+2*(1-t)*t*cx+t*t*b.x,ey=(1-t)*(1-t)*a.y+2*(1-t)*t*cy+t*t*b.y;  // base de la pointe
  const ux=(b.x-ex),uy=(b.y-ey),ul=Math.hypot(ux,uy)||1,nx=-uy/ul,ny=ux/ul,w=13;
  const path='M'+a.x+' '+a.y+' Q'+cx+' '+cy+' '+ex+' '+ey;
  box.querySelector('.ab').setAttribute('d',path);box.querySelector('.al').setAttribute('d',path);
  box.querySelector('.ah').setAttribute('points',(b.x)+','+(b.y)+' '+(ex+nx*w)+','+(ey+ny*w)+' '+(ex-nx*w)+','+(ey-ny*w));
  box.style.color=col;box.classList.toggle('snap',snap);box.style.display='block'}

// pendant qu'on vise une cible : stats de l'attaquant mises à jour avec les bonus de cette attaque (Xénophobe, Jungle…), dégâts infligés et riposte
function atkPreview(t){
  const D=DUEL,key=t?t.f+'>'+t.s+':'+t.i:'';if(D._apk===key)return;D._apk=key;
  $$('.atkpv').forEach(x=>x.remove());$$('.card .st .at.pvw').forEach(x=>{x.textContent=x.dataset.v;x.className=x.dataset.c});
  if(!t||!D.V||t.s===D.V.me)return;const V=D.V,me=V.me,A=V.p[me].board[t.f];if(!A)return;
  const K=atkCalc(V,me,t.f,t),E0=eff(V,me,t.f),tr=trainOk(V,me,t.f,t)?1:0,pa=K.pa+tr,base=E0.a;
  const o0=CARDS[A.k].a,show=(el)=>{const at=el&&el.querySelector('.st .at');if(!at)return;if(!at.classList.contains('pvw')){at.dataset.v=at.textContent;at.dataset.c=at.className}at.textContent=pa;at.className='at pvw '+stc(pa,o0)};
  show(elAt(me,t.f));const g=$('.ghost');if(g)show(g);
  const te=elAt(t.s,t.i);if(!te)return;const r=te.getBoundingClientRect();
  const bits=[h('b',{class:'pd'},'⚔ −'+pa)];if(K.xb)bits.push(h('small',null,'🚧 Xénophobe +'+K.xb));if(K.vs)bits.push(h('small',null,'🏟 terrain +'+K.vs));if(tr)bits.push(h('small',null,'💪 +1/+1'));
  if(t.i>=0)bits.push(h('b',{class:'pr'},K.ra>0?'↩ −'+K.ra:'↩ 0'));
  document.body.append(h('div',{class:'atkpv',style:'left:'+(r.left+r.width/2)+'px;top:'+(r.top-6)+'px'},bits))}
// ---------- fiche épinglée au clic droit (carte, créature, terrain, famille) ----------
function closePop(){$$('.cpop').forEach(x=>x.remove());hideTip();hideHoverCard()}
function cardNodes(I){
  const D=DUEL,cd=CARDS[I.k],out=[];
  if(I.cr&&D&&D.V){const V=D.V,c=V.p[I.s].board[I.i];if(c&&c.id===I.cr.id){const E=eff(V,I.s,I.i);
    out.push(h('div',{class:'pd'},h('b',null,'En jeu : '),'ATK ',h('span',{class:'sv '+stc(E.a,cd.a)},E.a),' · PV ',h('span',{class:'sv '+stc(E.hp,cd.h)},E.hp),' / '+E.h+(c.pz?' · ☠ '+c.pz+' Venin subi':'')+(c.blk?' · bloquée':'')+(c.mut?' · mute':'')+(c.sick&&!E.kw.hate?' · vient d’arriver':'')));
    if(E.T){const r=terrFor(c.k,E.T.d);out.push(h('div',{class:'pd'},h('b',null,'Terrain '+TD[E.T.d].n+' : '),r.tx))}
    if(c.ex)out.push(h('div',{class:'pd'},h('b',null,'✈️ À l’étranger : '),'inciblable jusqu’au prochain tour de son propriétaire.'));
    if(E.kw.venin)out.push(h('div',{class:'pd'},h('b',null,'Venin '+E.kw.venin),' (avec les bonus Toxic).'))}}
  return[h('div',{class:'pn'},fullName(cd)),
    h('div',{class:'pd'},(cd.t==='c'?'Créature':'Sort')+' · '+RAR[cd.r]+' · coût '+cd.c+(cd.tok?' · jeton':'')),
    h('div',{class:'pd txt'},txNodes(cd.tx||'')),
    ...out,
    madeRow(I.k,false),
    tagRow(cd),
    cd.t==='c'&&!cd.tok?h('div',{class:'pd kw','data-t':'Affinités','data-d':defOf('Affinité')},AFG.map(g=>h('span',{class:'afi'},gi(g),' '+((cd.sc&&cd.sc[g])||0)))):null,
    cd.lore?h('div',{class:'lore'},cd.lore):null,
    cd.credit?h('div',{class:'pd sm mut'},'📷 '+cd.credit):null].filter(Boolean)}
function ctxInfo(t){
  const D=DUEL;if(!D||!D.V)return null;const V=D.V;
  const sl=t.closest('.slot[data-s]');if(sl){const s=+sl.dataset.s,i=+sl.dataset.i,c=V.p[s].board[i];return c?{k:c.k,cr:c,s,i}:null}
  const hc=t.closest('.hc');if(hc){const i=$$('#hand .hc').indexOf(hc),hd=V.p[V.me].hand[i];return hd?{k:hd.k,hand:i}:null}
  const sh=t.closest('.shT[data-n]');if(sh)return{shop:+sh.dataset.n};
  const tc=t.closest('.tcell[data-tid]');if(tc){const s=tc.closest('#tMe')?V.me:1-V.me,T=V.p[s].terrs.find(x=>x.id===+tc.dataset.tid);return T?{terr:T,s}:null}
  const fx=t.closest('.fx[data-f]');if(fx)return{fac:fx.dataset.f,s:fx.closest('#fMe')?V.me:1-V.me};
  const c=t.closest('[data-k]');if(c&&CARDS[c.dataset.k])return{k:c.dataset.k};
  return null}
function cardPop(I,x,y){
  closePop();const D=DUEL,V=D.V,me=V.me;let left=null,right=[];
  if(I.fac){const F=FAC[I.fac];left=h('div',{class:'fbadge',style:'--gc:'+F.c+';margin:0 auto'},F.ic);right=facDetail(I)}
  else if(I.terr||I.shop!=null){const ctx=I.terr?{t:I.terr,s:I.s,at:null,placed:true}:{t:V.shop[I.shop],cost:terrCost(V,me,V.shop[I.shop]),s:me,at:null,n:I.shop,buy:true};
    if(!ctx.t)return;left=tcardEl(ctx.t,{cost:ctx.cost});right=terrDetail(ctx)}
  else if(I.k&&CARDS[I.k]){left=cardEl(I.k,{big:true});right=cardNodes(I)}
  else return;
  const box=h('div',{class:'cpop'},h('div',{class:'cph'},h('span',null,'📌 Fiche épinglée'),h('span',{class:'mut sm'},'Échap ou clic ailleurs pour fermer'),h('button',{class:'x',onclick:closePop},'✕')),
    h('div',{class:'cpb'},h('div',{class:'cpl'},left),h('div',{class:'cpr'},right)));
  box.addEventListener('pointerdown',e=>e.stopPropagation());box.addEventListener('click',e=>e.stopPropagation());
  document.body.append(box);
  const r=box.getBoundingClientRect(),W=innerWidth,H=innerHeight;
  let px=x+18;if(px+r.width>W-10)px=Math.max(10,x-18-r.width);let py=Math.min(Math.max(10,y-r.height/3),H-r.height-10);
  box.style.left=px+'px';box.style.top=Math.max(10,py)+'px'}
document.addEventListener('pointerdown',e=>{if(e.button===0&&$('.cpop')&&!e.target.closest('.cpop'))closePop()},true);
document.addEventListener('contextmenu',e=>{
  if(e.defaultPrevented)return;
  if(DUEL&&e.target.closest&&e.target.closest('#duel')){e.preventDefault();const I=ctxInfo(e.target);if(I)cardPop(I,e.clientX,e.clientY);else closePop();return}
  const c=e.target.closest&&e.target.closest('.card[data-k]');
  if(c&&!e.target.closest('.mbox')){e.preventDefault();showCard(c.dataset.k)}});

// ---------- survol en duel : la fiche apparaît d'elle-même au bout d'un instant (le clic droit l'épingle) ----------
let HOV={el:null,t:0};
function hovOff(){clearTimeout(HOV.t);HOV.t=0;HOV.el=null;$$('.cpop.hov').forEach(x=>x.remove())}
function hovParts(I){const V=DUEL.V,me=V.me;
  if(I.fac){const F=FAC[I.fac];return[h('div',{class:'fbadge',style:'--gc:'+F.c+';margin:0 auto'},F.ic),facDetail(I)]}
  if(I.terr||I.shop!=null){const t=I.terr||V.shop[I.shop];if(!t)return null;const td=TD[t.d],g=GAMES[td.g],cost=I.shop!=null?terrCost(V,me,t):null;
    return[tcardEl(t,{cost}),[h('h4',null,gi(td.g),' '+td.n),h('div',{class:'mut sm'},'Terrain '+g.n+' · '+td.size+' case'+(td.size>1?'s':'')+(cost!=null?' · 🪙 '+cost:'')),terrFxEl(td),
      I.terr&&t.lk?h('div',{class:'sm',style:'margin-top:6px;color:#9cc8e8'},'🔒 Indestructible, recouvrable : il fond quand Kirua, la reine des neiges quitte le plateau.'):null,
      I.terr&&tOff(V,t)?h('div',{class:'sm',style:'margin-top:6px;color:#bc8c94'},'⛔ Désactivé tant que Kirua, crasheur de serveur est en jeu.'):null,
      I.shop===0&&V.shop.length>1?h('div',{class:'sm',style:'margin-top:6px;color:#cab095'},cycSoon(V)?'⏳ Remplacé au début du prochain tour.':'⏳ Remplacé dans 2 tours.'):null].filter(Boolean)]}
  if(I.k&&CARDS[I.k])return[cardEl(I.k),cardNodes(I).filter(n=>!(n.classList&&n.classList.contains('lore')))];
  return null}
function hoverPop(I,el){$$('.cpop.hov').forEach(x=>x.remove());const pp=hovParts(I);if(!pp)return;
  const box=h('div',{class:'cpop hov'},h('div',{class:'cpb'},h('div',{class:'cpl'},pp[0]),h('div',{class:'cpr'},pp[1])));document.body.append(box);
  // à l'extérieur du plateau (vers le bord de l'écran le plus proche) pour ne pas cacher les autres cartes
  const r=el.getBoundingClientRect(),b=box.getBoundingClientRect(),W=innerWidth,H=innerHeight,lf=r.left+r.width/2<W/2;
  let x=lf?r.left-12-b.width:r.right+12;if(x<8||x+b.width>W-8)x=lf?r.right+12:r.left-12-b.width;x=Math.max(8,Math.min(W-b.width-8,x));
  const y=Math.min(Math.max(8,r.top+r.height/2-b.height/2),H-b.height-8);box.style.left=x+'px';box.style.top=Math.max(8,y)+'px'}
document.addEventListener('pointerover',e=>{
  if(!DUEL||!DUEL.V||e.pointerType==='touch'||!e.target.closest)return;
  const el=e.target.closest('#duel .slot[data-s],#duel .tcell[data-tid],#duel .shT[data-n],#duel .fx[data-f]');
  if(el===HOV.el)return;hovOff();if(!el||(el.classList.contains('slot')&&!el.querySelector('.card')))return;
  HOV.el=el;HOV.t=setTimeout(()=>{if(HOV.el!==el||!el.isConnected||!DUEL||!DUEL.V||DUEL.drag||$('.cpop:not(.hov)')||$('#pickov')||$('#mullov'))return;const I=ctxInfo(el);if(I)hoverPop(I,el)},380)});
document.addEventListener('pointerout',e=>{if(HOV.el&&!(e.relatedTarget&&HOV.el.contains(e.relatedTarget)))hovOff()});
document.addEventListener('pointerdown',()=>hovOff(),true);

// ---------- animations ----------
function elAt(s,i){return i<0?$('.hero[data-s="'+s+'"]'):$('.slot[data-s="'+s+'"][data-i="'+i+'"]')}
function famEl(s,f){const V=DUEL.V,row=$(s===V.me?'#fMe':'#fOpp');return(row&&row.querySelector('.fx[data-f="'+f+'"]'))||$(s===V.me?'#bMe':'#bOpp')}
function ctr(el){const r=el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}}
// point de départ d'un effet : créature, héros (-1) ou pastille de famille (-2)
function srcEl(e){if(e.ss==null||e.si==null)return null;if(e.si===-2)return famEl(e.ss,typeof e.src==='string'&&FAC[e.src]?e.src:'ravages');return elAt(e.ss,e.si)}
function srcCol(src){if(typeof src!=='string')return '#c45f5b';if(FAC[src])return FAC[src].c;if(src.slice(0,2)==='T:'){const t=TD[src.slice(2)];return t?GAMES[t.g].c:'#fff'}
  if(src==='venin')return '#a6ba69';const cd=CARDS[src];return cd&&cd.t==='s'?(cd.col||'#c45f5b'):'#c99163'}
function popAt(s,i,txt,cls,delay){
  setTimeout(()=>{const el=elAt(s,i);if(!el)return;const r=el.getBoundingClientRect();
    const p=h('div',{class:'pop '+cls,style:'left:'+(r.left+r.width/2)+'px;top:'+(r.top+r.height*.3)+'px'},txt);document.body.append(p);setTimeout(()=>p.remove(),1300*ANIM);
    if(/dmg/.test(cls)){const c=i<0?el:el.firstElementChild;if(c){c.classList.remove('shk');void c.offsetWidth;c.classList.add('shk')}}},(delay||0)*ANIM)}
function popEl(el,txt,cls,delay){setTimeout(()=>{if(!el||!el.isConnected)return;const r=el.getBoundingClientRect();
  const p=h('div',{class:'pop '+cls,style:'left:'+(r.left+r.width/2)+'px;top:'+(r.top+r.height*.3)+'px'},txt);document.body.append(p);setTimeout(()=>p.remove(),1300*ANIM)},(delay||0)*ANIM)}
function banner(t,col){const b=h('div',{class:'banner',style:'--bc:'+(col||'#73b0ad')},t);document.body.append(b);
  const f=$('#field'),z=$('#field .zmid');if(f&&z){const fr=f.getBoundingClientRect(),zr=z.getBoundingClientRect();b.classList.add('onb');
    b.style.left=fr.left+'px';b.style.right=Math.max(0,innerWidth-fr.right)+'px';b.style.top=Math.round(zr.top+zr.height/2-b.offsetHeight/2)+'px'}
  setTimeout(()=>b.remove(),1600*ANIM)}
// projectile : une boule lumineuse (ou une icône) vole de `from` à `to` en arc, avec une traînée
function proj(from,to,col,icon,delay,dur){
  dur=dur*ANIM;
  setTimeout(()=>{if(!from||!to||!from.isConnected||!to.isConnected)return;const a=ctr(from),b=ctr(to);
    const p=h('div',{class:'proj'+(icon?' ic':''),style:'left:0;top:0;--pc:'+col},icon||'');document.body.append(p);
    const dx=b.x-a.x,dy=b.y-a.y,arc=-Math.min(140,Math.hypot(dx,dy)*.3);
    const an=p.animate([{transform:'translate('+a.x+'px,'+a.y+'px) scale(.5)'},{transform:'translate('+(a.x+dx/2)+'px,'+(a.y+dy/2+arc)+'px) scale(1.35)'},{transform:'translate('+b.x+'px,'+b.y+'px) scale(1)'}],{duration:dur,easing:'ease-in'});
    const tr=setInterval(()=>{const r=p.getBoundingClientRect();const t=h('div',{class:'trail',style:'left:'+(r.left+r.width/2)+'px;top:'+(r.top+r.height/2)+'px;--pc:'+col});document.body.append(t);setTimeout(()=>t.remove(),460)},28);
    an.onfinish=()=>{clearInterval(tr);p.remove();fxEmit(b.x,b.y,{n:8,col:[col,'#fff'],sh:'spark',spd:[90,220],life:[180,360],size:[1.2,2.4],drag:3});const bm=h('div',{class:'boom',style:'left:'+b.x+'px;top:'+b.y+'px;--pc:'+col});document.body.append(bm);setTimeout(()=>bm.remove(),520*ANIM)}},(delay||0)*ANIM)}
// annonce de famille au-dessus du plateau + halo sur les membres
function famBurst(s,f,sub,delay){
  setTimeout(()=>{const V=DUEL&&DUEL.V;if(!V)return;const F=FAC[f],B=$(s===V.me?'#bMe':'#bOpp');if(!B)return;const r=B.getBoundingClientRect();
    const b=h('div',{class:'fburst',style:'--fc:'+F.c+';left:'+(r.left+r.width/2)+'px;top:'+(r.top+r.height/2)+'px'},h('span',{class:'fi'},F.ic),h('span',null,F.n,h('br'),h('small',null,sub)));
    document.body.append(b);setTimeout(()=>b.remove(),1750*ANIM);
    const chip=famEl(s,f);if(chip&&chip.classList.contains('fx')){chip.classList.remove('fxp');void chip.offsetWidth;chip.classList.add('fxp')}
    $$('.slot[data-s="'+s+'"]').forEach(sl=>{const c=sl.firstElementChild;if(c&&c.classList.contains('card')&&CARDS[c.dataset.k]&&CARDS[c.dataset.k].fac.indexOf(f)>=0){
      c.style.setProperty('--fg',F.c);c.classList.remove('fam');void c.offsetWidth;c.classList.add('fam')}})},(delay||0)*ANIM)}
function flashSlot(s,i,col,delay){setTimeout(()=>{const el=elAt(s,i);if(!el)return;el.style.setProperty('--gc',col);el.classList.remove('flash');void el.offsetWidth;el.classList.add('flash');
  const V=DUEL&&DUEL.V;if(!V||i<0)return;const st=$(s===V.me?'#tMe':'#tOpp');if(!st)return;let best=null;$$('.tcell',st).forEach(c=>{if(+c.dataset.c<=i)best=c});
  if(best&&!best.classList.contains('none')){best.classList.remove('tfl');void best.offsetWidth;best.classList.add('tfl')}},(delay||0)*ANIM)}
function castShow(k,delay){setTimeout(()=>{$$('.castc').forEach(x=>x.remove());const c=h('div',{class:'castc'},h('span',{class:'lbl'},'L’adversaire joue'),cardEl(k,{big:true}));document.body.append(c);setTimeout(()=>c.remove(),1650*ANIM)},(delay||0)*ANIM)}
function ghostDie(s,i,ban,delay){
  const D=DUEL,g=D.rects[s+':'+i];if(!g)return;
  setTimeout(()=>{const n=g.n.cloneNode(true);n.classList.add('ghostc');n.style.cssText='left:'+g.r.left+'px;top:'+g.r.top+'px;width:'+g.r.width+'px;height:'+g.r.height+'px;'+(ban?'filter:hue-rotate(160deg)':'');
    document.body.append(n);setTimeout(()=>n.remove(),900*ANIM)},(delay||0)*ANIM)}
function lunge(s,i,ts,ti,delay){
  setTimeout(()=>{const a=elAt(s,i),t=elAt(ts,ti);if(!a||!t||!a.firstElementChild)return;
    const ra=a.getBoundingClientRect(),rt=t.getBoundingClientRect();
    const dx=(rt.left+rt.width/2-ra.left-ra.width/2)*.75,dy=(rt.top+rt.height/2-ra.top-ra.height/2)*.75;
    const c=a.firstElementChild;c.style.zIndex=60;
    // élan (recul), charge jusqu'à la cible, court arrêt à l'impact, puis retour
    const T=(k,sc,o,e)=>({transform:'translate('+dx*k+'px,'+dy*k+'px) scale('+sc+')',offset:o,easing:e}),an=fxOff()?
      c.animate([{transform:'translate(0,0)'},{transform:'translate('+dx+'px,'+dy+'px) scale(1.15)',offset:.45},{transform:'translate(0,0)'}],{duration:560*ANIM,easing:'ease-in-out'}):
      c.animate([T(0,1,0,'ease-out'),T(-.12,1.04,.22,'cubic-bezier(.5,0,.9,.4)'),T(1.06,1.16,.45,'linear'),T(.98,1.12,.55,'ease-in-out'),T(0,1,1)],{duration:560*ANIM});
    an.onfinish=()=>{c.style.zIndex=''}},(delay||0)*ANIM)}
// laser géant de Natinganz : un rayon vertical traverse la colonne qu'il quitte (les deux plateaux)
function laserFx(s,i,delay){setTimeout(()=>{const a=elAt(s,i),b=elAt(1-s,i);if(!a||!b)return;const ra=a.getBoundingClientRect(),rb=b.getBoundingClientRect();
  const top=Math.min(ra.top,rb.top)-30,bot=Math.max(ra.bottom,rb.bottom)+30,x=ra.left+ra.width/2,w=Math.max(26,ra.width*.42);
  const L=h('div',{class:'laser',style:'left:'+(x-w/2)+'px;top:'+top+'px;width:'+w+'px;height:'+(bot-top)+'px'});document.body.append(L);setTimeout(()=>L.remove(),1100*ANIM)},(delay||0)*ANIM)}
// éclats de verre : la cloche de l'Égide se brise
function shatter(s,i,delay){
  setTimeout(()=>{const el=elAt(s,i);if(!el)return;const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height*.42;
    const dm=h('div',{class:'domefx',style:'left:'+(r.left-r.width*.04)+'px;top:'+(r.top-r.height*.05)+'px;width:'+r.width*1.08+'px;height:'+r.height*1.08+'px'});document.body.append(dm);
    dm.animate([{opacity:1,transform:'scale(1)',filter:'brightness(1)'},{opacity:1,transform:'scale(1.04)',filter:'brightness(2.2)',offset:.25},{opacity:0,transform:'scale(1.12)',filter:'brightness(1)'}],{duration:520*ANIM,easing:'ease-out'}).onfinish=()=>dm.remove();
    for(let j=0;j<18;j++){const a=-Math.PI*(.05+.9*Math.random())+(j%2?0:Math.PI*.15),d=40+Math.random()*Math.max(60,r.width*.8),sz=.6+Math.random()*.9;
      const sh=h('div',{class:'shard',style:'left:'+(x+(Math.random()-.5)*r.width*.6)+'px;top:'+(y+(Math.random()-.5)*r.height*.4)+'px'});document.body.append(sh);
      const an=sh.animate([{transform:'translate(0,0) rotate(0deg) scale('+sz+')',opacity:1},{transform:'translate('+Math.cos(a)*d+'px,'+(Math.sin(a)*d*.7+60)+'px) rotate('+(Math.random()*540-270)+'deg) scale('+sz*.7+')',opacity:0}],
        {duration:(700+Math.random()*350)*ANIM,easing:'cubic-bezier(.2,.7,.4,1)'});an.onfinish=()=>sh.remove()}},(delay||0)*ANIM)}
const STORY=['+2/+2','dégâts au héros adverse','pioche','renforts','soin'];
function animate(es){
  const D=DUEL,V=D.V,me=V.me;let t=0;const FL=420;D._dk=0;
  for(const e of es){
    switch(e.t){
    case 'turn':{const f=()=>banner(e.s===me?'À TOI DE JOUER':'TOUR ADVERSE',e.s===me?'#e9cd86':'#c45f5b');if(t>0)setTimeout(f,t*ANIM);else f();t+=250;break}   // après la révélation d'Osiris, s'il y en a une
    case 'draw':{if(e.ts===me){const hl=V.p[me].hand.length,nd=es.filter(x=>x.t==='draw'&&x.ts===me).length;D._dk=(D._dk||0);drawFly(me,hl-nd+(D._dk++),t)}else drawFly(e.ts,0,t);t+=160;break}
    case 'play':if(e.ts!==me&&e.s!==me){castShow(e.k,t);t+=650}
      if(e.i!=null&&CARDS[e.k]&&CARDS[e.k].t==='c')fxSummon(e.ts,e.i,(CARDS[e.k].kw||[]).indexOf('hate')>=0,t);
      if(e.tg&&CARDS[e.k]&&CARDS[e.k].t==='s'&&!es.some(x=>x.t==='dmg'&&x.si===-1&&x.ss===e.ts))proj(elAt(e.ts,-1),elAt(e.tg.s,e.tg.i),CARDS[e.k].col||'#fff',CARDS[e.k].sym,t,FL);break;
    case 'atk':lunge(1-e.ts,e.i,e.ts,e.ti,t);
      if(e.xb)popAt(1-e.ts,e.i,'🚧 +'+e.xb,'txt',t);
      if(e.n>0){popAt(e.ts,e.ti,'−'+e.n,e.ti<0&&e.n>=5?'dmg big':'dmg',t+260);fxHitAt(e.ts,e.ti,null,e.n,t+250)}if(e.r>0)fxHitAt(1-e.ts,e.i,null,e.r,t+290);
      if(e.rd)popAt(e.ts,e.ti,'🌸 −1','txt',t+420);if(e.r>0)popAt(1-e.ts,e.i,'−'+e.r,'dmg',t+300);if(e.ra)popAt(1-e.ts,e.i,'🌸 −1','txt',t+460);
      if(e.ti<0&&e.n>0){const he=elAt(e.ts,-1);setTimeout(()=>{if(he){he.classList.remove('shk');void he.offsetWidth;he.classList.add('shk')}},t+260)}
      t+=480;break;
    case 'dmg':{const se=srcEl(e);
      if(e.src==='venin'){popAt(e.ts,e.i,'☠ −'+e.n,'pz',t);fxPoison(e.ts,e.i,t);t+=160;break}
      if(se&&!(e.ss===e.ts&&e.si===e.i)){proj(se,elAt(e.ts,e.i),srcCol(e.src),e.src==='ravages'?'🚀':null,t,FL);popAt(e.ts,e.i,'−'+(e.n>=99?'💀':e.n),'dmg',t+FL);fxHitAt(e.ts,e.i,srcCol(e.src),e.n,t+FL);t+=e.src==='ravages'||(CARDS[e.src]&&CARDS[e.src].t==='c')?300:200}
      else{popAt(e.ts,e.i,'−'+e.n,'dmg',t);fxHitAt(e.ts,e.i,null,e.n,t);t+=150}
      break}
    case 'heal':popAt(e.ts,-1,'+'+e.n+' ♥','heal',t);fxHeal(e.ts,-1,t);t+=150;break;
    case 'hc':popAt(e.ts,e.i,'+'+e.n,'heal',t);fxHeal(e.ts,e.i,t);t+=100;break;
    case 'pz':{const se=srcEl(e);if(se&&!(e.ss===e.ts&&e.si===e.i)){proj(se,elAt(e.ts,e.i),'#a6ba69','☠',t,FL*.8);popAt(e.ts,e.i,'☠+'+e.n,'pz',t+FL*.8);fxPoison(e.ts,e.i,t+FL*.8);t+=180}else{popAt(e.ts,e.i,'☠+'+e.n,'pz',t);fxPoison(e.ts,e.i,t);t+=120}break}
    case 'gold':{if(e.from!=null){proj(elAt(e.from,-1),elAt(e.ts,-1),'#dab77a','🪙',t,FL*1.2);popAt(e.ts,-1,'+'+e.n+' 🪙','gold',t+FL*1.2);popAt(e.from,-1,'−'+e.n+' 🪙','gold',t);t+=300}
      else{const se=srcEl(e);if(se&&e.si!==-1){proj(se,elAt(e.ts,-1),'#dab77a','🪙',t,FL);popAt(e.ts,-1,'+'+e.n+' 🪙','gold',t+FL);t+=220}else{popAt(e.ts,-1,'+'+e.n+' 🪙','gold',t);t+=150}}
      break}
    case 'orRoll':popAt(e.ts,-1,(e.n>0?'+':'')+e.n+' 🪙','gold',t);t+=180;break;
    case 'fac':{const F=FAC[e.f],n=e.n;famBurst(e.ts,e.f,e.f==='ravages'?(n-1)+' missile'+(n>2?'s':'')+' !':e.f==='farmer'?'+'+(e.or||n)+' Or':e.f==='alien'?'Vol de '+(n-1)+' Or':'×'+n,t);t+=550;break}
    case 'tfx':{const td=TD[e.d];if(!td)break;flashSlot(e.ts,e.i,GAMES[td.g].c,t);popAt(e.ts,e.i,[gi(td.g),' '+td.n],'txt',t);t+=260;break}
    case 'buff':popAt(e.ts,e.i,e.tmp?sg(e.ba)+' ATK ce tour':sg(e.ba)+'/'+sg(e.bh),'buf',t);fxBuff(e.ts,e.i,e.ba<0||e.bh<0,t);t+=110;break;
    case 'tilt':flashSlot(e.ts,e.i,'#ba574e',t+120);fxTilt(e.ts,e.i,t+120);popAt(e.ts,e.i,'😡 Tilt !','txt',t+120);t+=320;break;
    case 'egide':shatter(e.ts,e.i,t+280);popAt(e.ts,e.i,'✧ Égide brisée','txt',t+280);t+=160;break;
    case 'kwg':popAt(e.ts,e.i,(KWI[e.kw]?KWI[e.kw][1]+' '+KWI[e.kw][0]:e.kw),'buf',t);fxBuff(e.ts,e.i,false,t);t+=100;break;
    case 'deso':popAt(1-e.ts,e.i,'💫 au hasard','txt',t);t+=200;break;
    case 'ctl':popAt(e.to,e.ti,'⇄ change de camp','txt',t);t+=250;break;
    case 'swap':popAt(e.ts,e.i,'⇄ échange','txt',t);popAt(1-e.ts,e.ti,'⇄ échange','txt',t);t+=300;break;
    case 'tdes':banner(e.melt?'💧 Le Blizzard fond':e.gone?'🌫 '+(TD[e.d]?TD[e.d].n:'Le terrain')+' disparaît':'💥 Terrain détruit',e.melt?'#9cc8e8':e.gone?'#b6aa93':'#c98859');t+=300;break;
    case 'tgift':{const td=TD[e.d];if(td)for(let j=e.at;j<e.at+td.size;j++)flashSlot(e.ts,j,'#b9d0dd',t);popAt(e.ts,-1,[gi(td?td.g:'bazar'),' '+(td?td.n:'')],'txt',t);t+=300;break}
    case 'save':popAt(e.ts,e.i,'✨ 1 PV, invincible !','buf',t);t+=250;break;
    case 'inv':popAt(e.ts,e.i,'✨ invincible','txt',t);break;
    case 'aff':popAt(e.ts,e.i,e.g==='all'?'🧢 affinité +1 partout':[gi(e.g),' affinité '+e.n],'buf',t);t+=150;break;
    case 'pay':popAt(e.ts,-1,'🪙 −'+e.n,'txt',t);t+=150;break;
    case 'loot':popAt(e.ts,-1,e.n===6?'💰 Drop exceptionnel !':e.n===5?'🪞 Oh, j’ai drop un mirror !':'🎁 Butin','txt',t);t+=e.n>=5?700:300;break;
    case 'dupc':popAt(e.ts,-1,'🪞 Miroir de Kalandra','txt',t);t+=250;break;
    case 'discc':popAt(e.ts,-1,'🎲 défausse au choix','txt',t);t+=200;break;
    case 'jump':popAt(e.ts,e.to,e.evade?'🌀 esquive !':'🌀 saute','txt',t);t+=180;break;
    case 'atk0':popAt(e.ts,e.i,'ATK → 0','txt',t);t+=150;break;
    case 'rethand':popAt(e.ts,-1,'↩ retour en main','txt',t);t+=200;break;
    case 'pick3':popAt(e.ts,-1,'🃏 garde 1 carte sur '+e.n,'txt',t);t+=250;break;
    case 'tax':popAt(e.ts,-1,'🪙 −'+e.n,'txt',t);break;
    case 'xa':popAt(e.ts,e.i,'⚔ +1 attaque','buf',t);break;
    case 'eth':popAt(e.ts,-1,'◆ +'+e.n,'buf',t);break;
    case 'lose':banner('☠ Surrender to madness','#c15c58');t+=400;break;
    case 'die':ghostDie(e.ts,e.i,e.ban,t);if(!e.kick){const g=D.rects[e.ts+':'+e.i];if(g)fxLater(t,()=>fxDeath(g.r,e.ban))}if(e.ban)popAt(e.ts,e.i,'⛔ Banni','txt',t);else if(e.kick)popAt(e.ts,e.i,'⤴ Kick','txt',t);t+=90;break;
    case 'sum':if(e.rs)popAt(e.ts,e.i,'↺ Respawn','buf',t);fxSummon(e.ts,e.i,CARDS[e.k]&&(CARDS[e.k].kw||[]).indexOf('hate')>=0,t);break;
    case 'mute':popAt(e.ts,e.i,'🔇 Mute','txt',t);t+=100;break;
    case 'blk':{const se=srcEl(e);if(se)proj(se,elAt(e.ts,e.i),'#75b5d6','🔒',t,FL*.8);popAt(e.ts,e.i,'🔒','txt',t+(se?FL*.8:0));t+=120;break}
    case 'exil':if(e.fum){popAt(e.ts,e.i,e.fum===2?'🛂 Immunité':'💨 Dans la fumée','txt',t);t+=150;break}popAt(e.ts,e.i,'✈️ À l’étranger !','txt',t);if(e.n)famBurst(e.ts,'expats','Voyage : −'+e.n+' Or',t);t+=e.n?500:150;break;
    case 'back':popAt(e.ts,e.i,e.fum===2?'🛂 Fin de l’immunité':e.fum?'💨 Sort de la fumée':'🏠 De retour','txt',t);t+=100;break;
    case 'tmove':{const td=TD[e.d];if(td){const P=V.p[e.ts];for(let j=0;j<CELLS;j++)if(P.cells[j]===e.id)flashSlot(e.ts,j,GAMES[td.g].c,t)}t+=150;break}
    case 'reshuf':banner('♻ '+(e.ts===me?'Ton':'Son')+' cimetière est remélangé dans '+(e.ts===me?'ton':'son')+' deck','#a6ba69');t+=400;break;
    case 'echo':popAt(e.ts,e.i,e.last?'×2 Agonie':'×2 Cri d’arrivée','buf',t);t+=200;break;
    case 'laser':laserFx(e.ts,e.i,t);popAt(e.ts,e.self?e.i:e.i+1,e.self?'🔫 Il prend le laser !':'🔫 LASER','txt',t);t+=650;break;
    case 'nmove':t+=120;break;
    case 'rpsb':popAt(e.ts,e.i,'🤫 Signe secret','txt',t);t+=250;break;
    case 'rpsr':rpsShow(e,t);t+=1500;break;
    case 'baz':{const b=BAZ[e.n];if(e.i>=0){flashSlot(e.ts,e.i,GAMES.bazar.c,t);popAt(e.ts,e.i,'🌀 '+(b?b[0].split(' :')[0]:'Bazar'),'txt',t)}t+=380;break}
    case 'art':{const R=ARTS[e.k];banner('🥚 '+(R?R.n:'Artefact'),R?R.col:'#dab77a');t+=600;break}
    case 'artfx':popAt(e.ts,-1,'🥕 Cawotte : +2 cartes','buf',t);t+=200;break;
    case 'hr':if(e.n<0)popAt(e.ts,-1,'🎰 Highroll raté : pas sur un terrain Dofus ou LoL','txt',t);else banner('🎰 HIGHROLL : '+e.n+' créature'+(e.n>1?'s':'')+' détruite'+(e.n>1?'s':''),'#dab77a');t+=500;break;
    case 'capd':popAt(e.ts,-1,'◆ −'+e.n+' max','dmg',t);t+=200;break;
    case 'capu':popAt(e.ts,-1,'◆ +'+e.n+' max','buf',t);t+=200;break;
    case 'tfx2':{const td=TD[e.d],P=V.p[e.ts];if(td)for(let j=0;j<CELLS;j++)if(P.cells[j]&&P.terrs.some(T=>T.id===P.cells[j]&&T.d===e.d))flashSlot(e.ts,j,GAMES[td.g].c,t);t+=200;break}
    case 'shuf':banner('🔀 Chaises musicales !','#9a5d86');t+=450;break;
    case 'cleave':popAt(e.ts,e.i,'🪓 −'+e.n,'dmg',t);fxCleave(e.ts,e.i,t);break;
    case 'hp1':popAt(e.ts,e.i,'💔 1 PV','dmg',t);t+=200;break;
    case 'story':popAt(e.ts,-1,'📖 '+STORY[e.n],'txt',t);t+=250;break;
    case 'chaos':if(e.i>=0){flashSlot(e.ts,e.i,GAMES.bazar.c,t);popAt(e.ts,e.i,'🌀 '+CHAOSN[e.n],'txt',t)}else popAt(e.ts,-1,'🌀 '+CHAOSN[e.n],'txt',t);t+=300;break;
    case 'ev':banner('🌀 '+e.n,'#c76d90');t+=400;break;
    case 'buy':{const td=TD[e.d];if(td){popAt(e.ts,-1,[gi(td.g),' '+td.n],'txt',t);for(let j=e.at;j<e.at+td.size;j++)flashSlot(e.ts,j,GAMES[td.g].c,t)}t+=200;break}
    case 'tcyc':{const td=TD[e.nd];if(td)popEl($('#shop'),'🔄 '+td.n,'txt',t);break}
    case 'steal':popAt(e.ts,-1,'📸 copie','txt',t);break;
    case 'disc':popAt(e.ts,-1,'✝ défausse','txt',t);t+=100;break;
    case 'burn':popAt(e.ts,-1,'🔥 main pleine','txt',t);break;
    case 'fat':popAt(e.ts,-1,'🥵 Fatigue −'+e.n,'dmg',t);t+=200;break}}}

// aperçu au survol : petite carte et texte exact (historique, liste du deck, récapitulatif des boosters…)
function hoverCard(el){const k=el.getAttribute('data-hk'),cd=CARDS[k];if(!cd)return;let p=$('#hcard');if(!p){p=h('div',{id:'hcard'});document.body.append(p)}
  // historique : la carte telle qu'elle était au moment de l'action (ATK, PV restants / PV max)
  const hs=(el.getAttribute('data-hs')||'').split(',').map(Number),st=cd.t==='c'&&hs.length===3&&!hs.some(isNaN)?hs:null;
  const E=st?{a:st[0],hp:st[1],h:st[2],kw:(()=>{const r={};(cd.kw||[]).forEach(x=>r[x]=1);if(cd.cleave)r.cleave=cd.cleave;return r})()}:null;
  p.replaceChildren(h('div',{class:'hcc'},cardEl(k,E?{E}:null)),h('div',{class:'hct'},h('b',null,fullName(cd)),h('div',{class:'mut sm'},(cd.t==='c'?'Créature':'Sort')+' · '+RAR[cd.r]+' · coût '+cd.c+(cd.t==='c'?' · '+cd.a+'/'+cd.h:'')),
    st?h('div',{class:'hsn'},'Au moment de l’action : ',h('b',{class:'a '+stc(st[0],cd.a)},st[0]+' ATK'),' · ',h('b',{class:'h '+stc(st[1],cd.h)},st[1]+(st[1]<st[2]?' / '+st[2]:'')+' PV')):null,
    h('div',{class:'hx'},txNodes(cd.tx||''))));
  p.style.display='flex';const r=el.getBoundingClientRect(),pr=p.getBoundingClientRect();let x=r.left-pr.width-12;if(x<8)x=Math.min(innerWidth-pr.width-8,r.right+12);
  const y=Math.min(Math.max(8,r.top+r.height/2-pr.height/2),innerHeight-pr.height-8);p.style.left=x+'px';p.style.top=y+'px'}
function hideHoverCard(){const p=$('#hcard');if(p)p.style.display='none'}
document.addEventListener('pointerover',e=>{const w=e.target.closest&&e.target.closest('[data-hk]');if(w)hoverCard(w)});
document.addEventListener('pointerout',e=>{const w=e.target.closest&&e.target.closest('[data-hk]');if(w&&!(e.relatedTarget&&w.contains(e.relatedTarget)))hideHoverCard()});
// l'élément survolé peut disparaître sans « pointerout » (fiche fermée avec Échap, historique redessiné) : l'aperçu se ferme dès que le pointeur n'est plus sur une carte
document.addEventListener('pointermove',e=>{const p=$('#hcard');if(p&&p.style.display!=='none'&&!(e.target.closest&&e.target.closest('[data-hk]')))hideHoverCard()},{passive:true});
document.addEventListener('keydown',e=>{if(e.key==='Escape')hideHoverCard()});
// ---------- historique latéral ----------
// Chaque ligne montre qui a fait quoi : pastille de la carte (illustration + nom), du terrain, de la famille ou du héros concerné.
function chip(ic,name,col,title){return h('span',{class:'mi sx',title:title||name,style:'--mc:'+col},h('u',{style:'background:'+col},ic),name)}
// nombre signé pour les bonus de stats (+2, -1, +0)
function sg(n){n=n||0;return(n>0?'+':'')+n}
// coût payé pour une action (déplacement) : pastille « −1 ◆ » ou « −1 🪙 »
function costTag(e){return e.c?h('span',{class:'cst'},'−'+e.c+(e.r==='or'?' 🪙':' ◆')):null}
function mini(k,st){const cd=CARDS[k];if(!cd)return h('span',{class:'mi'},'?');st=cd.t==='c'&&Array.isArray(st)&&st.length===3?st:null;
  return h('span',{class:'mi','data-k':k,'data-hk':k,'data-hs':st?st.join(','):null,style:'--mc:'+RCOL[cd.r]},miniAv(k),fullName(cd),
    st?h('span',{class:'hsnap',title:'État au moment de l’action : '+st[0]+' ATK, '+st[1]+' PV'+(st[1]<st[2]?' sur '+st[2]:'')},h('b',{class:stc(st[0],cd.a)||null},st[0]),h('i',{class:stc(st[1],cd.h)||null},st[1])):null)}
function heroChip(s){const V=DUEL.V,P=V.p[s];return h('span',{class:'mi hch'+(s===V.me?' me':' op')},h('u',null,(P.nm||'?').charAt(0).toUpperCase()),s===V.me?'Toi':P.nm)}
function tgChip(s,i,k,st){return i<0?heroChip(s):mini(k,st)}
function terrChip(d){const t=TD[d];if(!t)return h('span',{class:'mut'},'terrain');const g=GAMES[t.g];return chip(gi(t.g),t.n,g.c,'Terrain '+g.n+' — '+t.n)}
function facChip(f){const F=FAC[f];return F?chip(F.ic,F.n,F.c,'Famille '+F.n):null}
// d'où vient un effet : une carte, un terrain (« T:xxx »), une famille, le Venin, la Fatigue ou un événement
function srcChip(src){
  if(!src)return null;
  if(CARDS[src])return mini(src);
  if(FAC[src])return facChip(src);
  if(typeof src==='string'&&src.slice(0,2)==='T:'&&TD[src.slice(2)])return terrChip(src.slice(2));
  if(src==='venin')return chip('☠','Venin','#a6ba69');
  if(src==='fat')return chip('🥵','Fatigue','#ca7f60');
  if(src==='ev')return chip('🌀','Événement','#dab77a');
  return chip('💥','Effet','#a69d91')}
// « par … » : la cause de l'événement quand elle est connue (et différente de la créature concernée)
// héros concerné quand ce n'est pas celui qui joue (pioche ou défausse de l'adversaire...)
function who(e){return e.ts!=null&&e.ts!==e.s?heroChip(e.ts):null}
function by(e){return e.cs&&e.cs!==e.k?[h('span',{class:'by'},'par'),srcChip(e.cs)]:null}
// [catégorie de couleur, éléments de la ligne] pour un événement de l'historique
function histNodes(e){
  const A=h('span',{class:'ar'},'→'),sc=e.src?srcChip(e.src):null;
  switch(e.t){
  case 'play':return['play',[h('span',{class:'vb'},'▶'),h('span',{class:'vt'},CARDS[e.k]&&CARDS[e.k].t==='s'?'lance':'joue'),mini(e.k),e.c>0?h('span',{class:'cst'},e.c+' ◆'):null,e.tg?[h('span',{class:'vt'},'sur'),tgChip(e.tg.s,e.tg.i,e.tg.k)]:null,e.tg2?[h('span',{class:'vt'},'puis'),tgChip(e.tg2.s,e.tg2.i,e.tg2.k)]:null]];
  case 'atk':return['atk',[h('span',{class:'vb'},'⚔'),mini(e.k,e.as),h('span',{class:'vt'},'attaque'),e.to==='hero'?heroChip(e.ts):mini(e.to,e.ds),h('span',{class:'dm'},'−'+e.n),e.xb?h('span',{class:'mut'},'(🚧+'+e.xb+')'):null,e.r>0?h('span',{class:'rc',title:'Riposte subie'},'↩ −'+e.r):null]];
  case 'dmg':return['dmg',[sc,sc?A:null,tgChip(e.ts,e.i,e.k,e.st),h('span',{class:'dm'},e.n>=99?'détruit':'−'+e.n),sc?null:by(e)]];
  case 'heal':return['heal',[sc||(e.cs?srcChip(e.cs):null),h('span',{class:'vb'},'♥'),heroChip(e.ts),h('span',{class:'hl'},'+'+e.n)]];
  case 'hc':return['heal',[e.cs&&e.cs!==e.k?srcChip(e.cs):null,h('span',{class:'vb'},'♥'),mini(e.k,e.st),h('span',{class:'hl'},'+'+e.n)]];
  case 'pz':return['pz',[sc||(e.cs?srcChip(e.cs):null),h('span',{class:'vb'},'☠'),tgChip(e.ts,e.i,e.k,e.st),h('span',{class:'pzc'},'+'+e.n)]];
  case 'gold':return['gold',[e.from!=null?h('span',{class:'mut'},'vol :'):(sc||(e.cs?srcChip(e.cs):null)),h('span',{class:'vb'},'🪙'),heroChip(e.ts),h('span',{class:'gd'},'+'+e.n),e.from!=null&&sc?sc:null]];
  case 'orRoll':return['gold',[mini(e.k),h('span',{class:'vb'},'🎲'),heroChip(e.ts),'résultat : '+(e.roll>0?'+':'')+e.roll+' Or',e.n!==e.roll?h('span',{class:'mut'},'(variation réelle '+(e.n>0?'+':'')+e.n+')'):null]];
  case 'fac':return['fac',[facChip(e.f),h('b',{style:'color:'+FAC[e.f].c},'×'+e.n)]];
  case 'tfx':return TD[e.d]?['tfx',[terrChip(e.d),e.k?[A,mini(e.k)]:null]]:null;
  case 'die':return e.kick?null:['die',[h('span',{class:'vb'},e.ban?'⛔':'✝'),mini(e.k),h('span',{class:'vt'},e.ban?'Bannie':'meurt'),by(e)]];
  case 'sum':return['sum',[by(e),h('span',{class:'vb'},'＋'),mini(e.k),e.rs?h('span',{class:'mut'},'(respawn)'):null]];
  case 'draw':return['card',[by(e),h('span',{class:'vb'},'🂠'),who(e),'pioche']];
  case 'burn':return['card',[h('span',{class:'vb'},'🔥'),who(e),e.k?mini(e.k):'une carte','brûlée (main pleine)',by(e)]];
  case 'add':return['card',[by(e),h('span',{class:'vb'},e.dup?'🪞':'🂱 +'),who(e),e.dup?(e.k?['copie de',mini(e.k)]:'copie une carte de sa main'):e.k?mini(e.k):'une carte']];
  case 'mull':return['card',[h('span',{class:'vb'},'♻'),heroChip(e.ts),e.n?'remplace '+e.n+' carte'+(e.n>1?'s':'')+' (mulligan)':'garde sa main (mulligan)']];
  case 'disc':return['card',[h('span',{class:'vb'},'✝'),e.anon?heroChip(e.ts):who(e),mini(e.k),'défaussée (cimetière)',e.anon?null:by(e)]];
  case 'buff':return['buff',[by(e),h('span',{class:'vb'},'⬆'),mini(e.k,e.st),h('span',{class:'bf'},e.tmp?sg(e.ba)+' ATK':sg(e.ba)+'/'+sg(e.bh)),e.tmp?'pendant ce tour':null]];
  case 'tilt':return['buff',[h('span',{class:'vb'},'😡'),mini(e.k,e.st),'est tilt : son effet Tilt se déclenche']];
  case 'kwg':return['buff',[by(e),h('span',{class:'vb'},KWI[e.kw]?KWI[e.kw][1]:'✧'),mini(e.k,e.st),e.kw==='deso'?'devient Désorienté':'gagne '+(KWI[e.kw]?KWI[e.kw][0]:e.kw)+(e.kw==='insolence'?' jusqu’au prochain tour':e.kw==='hate'?' pour ce tour':'')]];
  case 'mute':return['ctl',[by(e),h('span',{class:'vb'},'🔇'),mini(e.k,e.st),'réduit au silence']];
  case 'blk':return['ctl',[by(e),h('span',{class:'vb'},'🔒'),mini(e.k,e.st),'bloquée']];
  case 'kick':return['ctl',[by(e),h('span',{class:'vb'},'⤴'),h('span',{class:'vt'},'Kick :'),mini(e.k),'retourne dans la main']];
  case 'egide':return['buff',[h('span',{class:'vb'},'✧'),mini(e.k),'Égide : dégâts annulés']];
  case 'steal':return['card',[by(e),h('span',{class:'vb'},'📸'),e.k?mini(e.k):'copie une carte']];
  case 'exil':return['move',e.fum?[h('span',{class:'vb'},e.fum===2?'🛂':'💨'),mini(e.k),e.fum===2?'immunité diplomatique (inciblable)':'disparaît dans la fumée (inciblable)']:[h('span',{class:'vb'},'✈️'),mini(e.k),'part à l’étranger',e.n?h('span',{class:'cst'},'−'+e.n+' 🪙'):'(gratuit)']];
  case 'move':return['move',[h('span',{class:'vb'},'↔'),mini(e.k),e.k2?['⇄',mini(e.k2)]:'déplacé(e)',costTag(e)]];
  case 'jump':return['move',[mini(e.k),h('span',{class:'vb'},'🌀'),e.evade?'esquive une attaque et saute de la case '+(e.i+1)+' à la case '+(e.to+1):'saute de la case '+(e.i+1)+' à la case '+(e.to+1)]];
  case 'tmove':return['move',[h('span',{class:'vb'},'↔'),terrChip(e.d),e.bound?'suit son propriétaire':'déplacé',costTag(e)]];
  case 'back':return['move',[h('span',{class:'vb'},e.fum===2?'🛂':e.fum?'💨':'🏠'),mini(e.k),e.fum===2?'n’est plus inciblable':e.fum?'sort de la fumée':'est de retour']];
  case 'atk0':return['ctl',[mini(e.k),h('span',{class:'vb'},'⬇'), 'ATK passe à 0']];
  case 'reshuf':return['card',[h('span',{class:'vb'},'♻'),who(e),'Cimetière remélangé : deck reformé ('+e.n+' cartes)',DUEL.V.o.fat?h('span',{class:'mut'},'· la Fatigue commence'):null]];
  case 'echo':return['play',[h('span',{class:'vb'},'×2'),mini(e.k)]];
  case 'story':return['sys',[by(e),h('span',{class:'vb'},'📖'),STORY[e.n]]];
  case 'chaos':return['sys',[by(e),h('span',{class:'vb'},'🌀'),CHAOSN[e.n]]];
  case 'tcyc':return TD[e.d]&&TD[e.nd]?['tfx',[h('span',{class:'vb'},'🔄'),terrChip(e.d),A,terrChip(e.nd)]]:null;
  case 'buy':return['buy',[h('span',{class:'vb'},'🏟'),terrChip(e.d),h('span',{class:'cst'},'−'+e.c+' 🪙')]];
  case 'roll':return['buy',[h('span',{class:'vb'},'🎲'),'Terrains relancés',h('span',{class:'cst'},'−'+e.c+' 🪙'),A,...(e.nd||[]).filter(d=>TD[d]).map(terrChip)]];
  case 'ev':return['sys',[chip('🌀','Événement','#dab77a'),e.n]];
  case 'fat':return['dmg',[srcChip('fat'),h('span',{class:'dm'},'−'+e.n)]];
  case 'res':return['sys',[h('span',{class:'vb'},'🏳'),'Abandon']];
  case 'deso':return['atk',[h('span',{class:'vb'},'💫'),mini(e.k),'Désorienté : cible tirée au hasard']];
  case 'ctl':return['ctl',[by(e),h('span',{class:'vb'},'⇄'),mini(e.k),'change de camp']];
  case 'swap':return['ctl',[by(e),h('span',{class:'vb'},'⇄'),mini(e.k),'et',mini(e.k2),'échangent de camp']];
  case 'tdes':return e.melt?['tfx',[h('span',{class:'vb'},'💧'),terrChip(e.d),'fond : sa Kirua a quitté le plateau',who(e)]]:e.gone?['tfx',[h('span',{class:'vb'},'🌫'),terrChip(e.d),'disparaît : '+(e.d==='eco'?'Coco':'Potatoll')+' a quitté le plateau',who(e)]]:['tfx',[by(e),h('span',{class:'vb'},'💥'),e.d?terrChip(e.d):'terrain','détruit',who(e)]];
  case 'pick3':return['card',[by(e),h('span',{class:'vb'},'🃏'),who(e),'pioche '+e.n+' cartes et en garde 1 au choix']];
  case 'pickd':return['card',[h('span',{class:'vb'},'✔'),who(e),'garde',e.k?mini(e.k):'une des cartes']];
  case 'tgift':return['tfx',[by(e),h('span',{class:'vb'},'❄'),terrChip(e.d),'posé chez',heroChip(e.ts)]];
  case 'save':return['buff',[h('span',{class:'vb'},'✨'),mini(e.k,e.st),'reste à 1 PV et devient invincible']];
  case 'inv':return['buff',[h('span',{class:'vb'},'✨'),mini(e.k),'invincible : aucun dégât']];
  case 'aff':return['buff',[by(e),h('span',{class:'vb'},'↑'),mini(e.k),...(e.g==='all'?['+1 d’affinité dans tous les jeux']:['affinité',gi(e.g),String(e.n)])]];
  case 'pay':return['gold',[h('span',{class:'vb'},'🪙'),heroChip(e.ts),'dépense '+e.n+' Or',e.k?mini(e.k):null]];
  case 'toff':return['tfx',[by(e),h('span',{class:'vb'},'⛔'),terrChip(e.d),'désactivé',who(e)]];
  case 'loot':return['buff',[h('span',{class:'vb'},e.n===6?'💰':e.n===5?'🪞':'🎁'),mini(e.k),e.n===5?'« Oh, j’ai drop un mirror ! » : 2 Or et un Miroir de Kalandra':e.n===6?'drop exceptionnel : 5 Or et 3 cartes':'butin : '+['2 Or','3 Or','2 Or et 1 carte','2 Or et 2 cartes','2 Or et 2 Démoflux'][e.n]]];
  case 'dupc':return['card',[h('span',{class:'vb'},'🪞'),who(e),'choisit une carte de sa main à dupliquer']];
  case 'discc':return['card',[h('span',{class:'vb'},'🎲'),who(e),'choisit une carte de sa main à défausser']];
  case 'rethand':return['move',[by(e),h('span',{class:'vb'},'↩'),mini(e.k),'retourne dans la main',who(e)]];
  case 'tax':return['gold',[h('span',{class:'vb'},'🪙'),heroChip(e.ts),'paie '+e.n+' Or pour attaquer',mini(e.k)]];
  case 'xa':return['buff',[by(e),h('span',{class:'vb'},'⚔'),mini(e.k),'pourra attaquer une fois de plus']];
  case 'eth':return['buff',[by(e),h('span',{class:'vb'},'◆'),heroChip(e.ts),'+'+e.n+' Démoflux']];
  case 'lose':return['sys',[h('span',{class:'vb'},'☠'),heroChip(e.ts),'perd la partie (Surrender to madness)']];
  case 'laser':return['dmg',[h('span',{class:'vb'},'🔫'),mini(e.k),e.self?'ne peut pas avancer : il prend le laser':'avance : LASER sur la colonne '+(e.i+1)]];
  case 'nmove':return null;
  case 'rpsb':return['sys',[h('span',{class:'vb'},e.v?RPSI[e.v]:'🤫'),mini(e.k),e.v?'signe secret : '+RPSN[e.v]:'choisit en secret pierre, feuille ou ciseaux']];
  case 'rpsw':return null;
  case 'rpsr':return['sys',[h('span',{class:'vb'},RPSI[e.v]+' '+RPSI[e.o]),mini(e.k),RPSN[e.v]+' contre '+RPSN[e.o]+' : '+(e.r===0?'égalité, rien ne se passe':e.r<0?'perdu':e.ok?'gagné, vol de tout l’Or et pioche 3':'gagné, mais Osiris n’est plus là')]];
  case 'baz':return['sys',[e.k?mini(e.k):null,h('span',{class:'vb'},'🌀'),BAZ[e.n]?BAZ[e.n][0]:'Effet du Bazar']];
  case 'art':return['buff',[by(e),h('span',{class:'vb'},'🥚'),heroChip(e.ts),'obtient le',h('b',{style:'color:'+(ARTS[e.k]?ARTS[e.k].col:'#fff')},ARTS[e.k]?ARTS[e.k].n:'?'),ARTS[e.k]?h('span',{class:'mut'},'('+ARTS[e.k].tx+')'):null]];
  case 'artfx':return['card',[h('span',{class:'vb'},'🥕'),heroChip(e.ts),'Dofus Cawotte : pioche 2']];
  case 'hr':return['sys',[by(e),h('span',{class:'vb'},'🎰'),e.n<0?'Highroll raté : pas sur un terrain Dofus ou LoL':'Highroll : '+e.n+' créature'+(e.n>1?'s':'')+' ennemie'+(e.n>1?'s':'')+' détruite'+(e.n>1?'s':'')]];
  case 'capd':return['dmg',[by(e),h('span',{class:'vb'},'◆'),heroChip(e.ts),'perd '+e.n+' Démoflux maximum']];
  case 'capu':return['buff',[by(e),h('span',{class:'vb'},'◆'),heroChip(e.ts),'+'+e.n+' Démoflux maximum']];
  case 'tfx2':return TD[e.d]?['tfx',[terrChip(e.d),e.d==='eco'?'des Graines poussent':'un Pleb apparaît']]:null;
  case 'shuf':return['ctl',[by(e),h('span',{class:'vb'},'🔀'),'les créatures de',heroChip(e.ts),'changent de place']];
  case 'cleave':return['dmg',[mini(e.k),h('span',{class:'vb'},'🪓'),'Cleave : −'+e.n+' à côté de sa cible']];
  case 'hp1':return['dmg',[by(e),h('span',{class:'vb'},'💔'),mini(e.k,e.st),'tombe à 1 PV']];
  default:return null}}
function renderHist(){
  const D=DUEL,V=D.V,me=V.me,el=$('#hlist');if(!el)return;
  // rien de neuf (ex. simple sélection d'une carte) : on ne reconstruit pas tout l'historique
  if(D._hLen===D.hist.length&&D._hFilt===D.filt&&el.firstChild)return;
  const atBottom=el.scrollTop+el.clientHeight>=el.scrollHeight-40;
  el.innerHTML='';
  el.append(h('div',{class:'hh'},h('b',null,'Historique'),
    h('span',{class:'chip'+(D.filt==='all'?' on':''),style:'--h:#73b0ad;--ht:#241e17',onclick:()=>{D.filt='all';renderHist()}},'Tout'),
    h('span',{class:'chip'+(D.filt==='opp'?' on':''),style:'--h:#c45f5b;--ht:#24060b',onclick:()=>{D.filt='opp';renderHist()}},'Adversaire')));
  const list=h('div');let grp=null;
  const flush=()=>{if(grp&&grp.n.length){list.append(h('div',{class:'hact'+(grp.anon?' anon':grp.s===me?'':' opp')},grp.n))}grp=null};
  for(const e of D.hist){
    if(e.t==='turn'){flush();list.append(h('div',{class:'hturn'+(e.s===me?'':' opp')},'Manche '+e.n+' · '+V.p[e.s].nm));continue}
    if(D.filt==='opp'&&e.s===me)continue;
    if(!grp||grp.a!==e.a){flush();grp={a:e.a,s:e.s,n:[],anon:e.anon}}
    const r=histNodes(e);if(r){if(!grp.n.length&&!grp.anon)grp.n.push(h('div',{class:'hwho'},e.s===me?'Toi':V.p[e.s].nm));grp.n.push(h('div',{class:'hr k-'+r[0]+(grp.n.length>1?' sub':' main')},r[1]))}}
  flush();el.append(list);if(atBottom||!D._hs)el.scrollTop=el.scrollHeight;D._hs=1;D._hLen=D.hist.length;D._hFilt=D.filt}

// ---------- fin de duel ----------
function showResult(){
  const D=DUEL;if(!D||!D.V)return;const V=D.V,me=V.me,w=V.over.w,win=w===me,draw=w<0;
  let rw=null;if(V.o.rw&&!D.rewarded){D.rewarded=true;rw=rewardDuel(win)}
  const ar=V.o.arena?(D.arenaRes||(D.arenaRes=arenaAfterDuel(V,D))):null;
  if(V.o.duelQueue&&!D.dqDone){D.dqDone=true;duelQueueFinished()}
  const box=h('div',{style:'text-align:center'},
    h('h2',{style:'font-size:34px;color:'+(win?'#dcc38d':draw?'#fff':'#c07772')},draw?'Égalité':win?'Victoire !':'Défaite'),
    h('p',{class:'mut'},V.over.res?(win?'Ton adversaire a abandonné.':'Tu as abandonné.'):V.over.lose?(win?'Son Dreos (Surrender to madness) est mort : il perd la partie.':'Ton Dreos (Surrender to madness) est mort : tu perds la partie.'):win?'L’État Arcanique est à toi.':'Ton adversaire a eu le dernier mot.'),
    rw?h('div',{class:'panel'},h('div',{style:'font-size:24px;font-weight:800'},'+'+rw.gain+' 💎'),
      h('div',{class:'mut sm'},(win?'Victoire : '+rw.base:'Participation : '+rw.base)+(rw.bonus?' · 1re victoire du jour : +'+rw.bonus:'')+(rw.capped?' · plafond quotidien atteint ('+ECON.cap+')':''))):
      (V.o.rw||V.o.arena?null:h('p',{class:'mut sm'},'Duel amical : pas de récompense.')),
    ar?h('div',{class:'panel arres'},h('div',{style:'font-size:20px;font-weight:800'},'⚔ Arène : '+ar.w+' V – '+ar.l+' D'),arenaPips(ar.w,ar.l),
      ar.over?h('div',{style:'margin-top:8px;font-size:18px;font-weight:800;color:#f1c96a'},'Course terminée : +'+ar.g+' 💎'):h('div',{class:'mut sm',style:'margin-top:6px'},ar.redraft?'Choisis 5 remplaçantes, puis les cartes qu’elles remplaceront.':'La course continue : tu peux rejouer avec ton deck actuel.')):null,
    h('div',{class:'row',style:'justify-content:center;margin-top:12px'},
      D.mode==='ai'?h('button',{class:'btn pri',style:'--h:#73b0ad;--ht:#241e17',onclick:()=>{const di=D.deck;leaveDuel();startAIDuel(di)}},'Rejouer'):null,
      V.o.arena?h('button',{class:'btn pri',onclick:()=>{leaveDuel();go('arena')}},'Retour à l’Arène'):null,
      V.o.duelQueue&&!V.o.arena?h('button',{class:'btn pri',onclick:()=>{leaveDuel();duelQueueStart()}},'Chercher un autre adversaire'):null,
      h('button',{class:'btn',onclick:leaveDuel},'Retour au menu')));
  modal(box,{sticky:true});if(typeof refreshTop==='function')refreshTop()}
