// ---------- effets visuels du duel ----------
// Un calque <canvas> transparent au-dessus du plateau : étincelles, braises, fumée, éclats de carte…
// Rien ne change dans la partie : ce ne sont que des décors joués en même temps que les animations existantes.
const FX={cv:null,cx:null,ps:[],raf:0,last:0,dpr:1};
function fxOff(){try{return !!(typeof S!=='undefined'&&S&&S.lowfx)||matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}}
function fxCanvas(){
  if(FX.cv&&FX.cv.isConnected)return FX.cx;
  const cv=document.createElement('canvas');cv.className='fxcv';document.body.append(cv);FX.cv=cv;FX.cx=cv.getContext('2d');
  const fit=()=>{FX.dpr=Math.min(2,devicePixelRatio||1);cv.width=innerWidth*FX.dpr;cv.height=innerHeight*FX.dpr;FX.cx.setTransform(FX.dpr,0,0,FX.dpr,0,0)};
  fit();addEventListener('resize',fit);return FX.cx}
const fxR=(a,b)=>a+Math.random()*(b-a);
// o : n, col (couleur ou liste), spd [min,max] en px/s, ang [min,max] en radians, life [min,max] en ms, size [min,max],
//     grav (px/s²), drag (0-1 par seconde), sh : spark | dot | smoke | shard | ring | arc | plus, add (mélange lumineux), spin
function fxEmit(x,y,o){
  if(fxOff())return;fxCanvas();
  const cols=[].concat(o.col||'#fff'),n=o.n||10,sp=o.spd||[80,260],an=o.ang||[0,Math.PI*2],lf=o.life||[400,800],sz=o.size||[2,4],w=o.w||0,hgt=o.hgt||0;
  for(let j=0;j<n&&FX.ps.length<900;j++){const a=fxR(an[0],an[1]),v=fxR(sp[0],sp[1]),l=fxR(lf[0],lf[1]);
    FX.ps.push({x:x+fxR(-w/2,w/2),y:y+fxR(-hgt/2,hgt/2),vx:Math.cos(a)*v,vy:Math.sin(a)*v,l,L:l,s:fxR(sz[0],sz[1]),c:cols[j%cols.length],
      g:o.grav||0,d:o.drag==null?1.5:o.drag,sh:o.sh||'dot',add:o.add!==false,r:Math.random()*6.3,vr:o.spin?fxR(-o.spin,o.spin):0,a0:o.a0||0,sw:o.sweep||0})}
  if(!FX.raf){FX.last=performance.now();FX.raf=requestAnimationFrame(fxLoop)}}
function fxLoop(now){
  const cx=FX.cx,dt=Math.min(50,now-FX.last)/1000;FX.last=now;cx.clearRect(0,0,innerWidth,innerHeight);
  const ps=FX.ps;let k=0;
  for(let j=0;j<ps.length;j++){const p=ps[j];p.l-=dt*1000;if(p.l<=0)continue;ps[k++]=p;
    const f=Math.max(0,1-p.d*dt);p.vx*=f;p.vy=p.vy*f+p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.r+=p.vr*dt;
    const t=p.l/p.L;cx.globalCompositeOperation=p.add?'lighter':'source-over';cx.globalAlpha=Math.min(1,t*1.6);
    switch(p.sh){
    case 'spark':{cx.strokeStyle=p.c;cx.lineWidth=p.s*t+.8;cx.lineCap='round';cx.beginPath();cx.moveTo(p.x,p.y);cx.lineTo(p.x-p.vx*.06,p.y-p.vy*.06);cx.stroke();break}
    case 'smoke':{const r=p.s*(1.8-t);const g=cx.createRadialGradient(p.x,p.y,0,p.x,p.y,r);g.addColorStop(0,p.c);g.addColorStop(1,'transparent');cx.globalAlpha=t*.5;cx.fillStyle=g;cx.beginPath();cx.arc(p.x,p.y,r,0,7);cx.fill();break}
    case 'shard':{cx.save();cx.translate(p.x,p.y);cx.rotate(p.r);cx.fillStyle=p.c;cx.beginPath();cx.moveTo(-p.s,-p.s*.6);cx.lineTo(p.s*.9,-p.s*.3);cx.lineTo(p.s*.3,p.s*.8);cx.closePath();cx.fill();cx.restore();break}
    case 'ring':{cx.strokeStyle=p.c;cx.lineWidth=3*t+.5;cx.beginPath();cx.arc(p.x,p.y,p.s*(1.15-t)*1.4,0,7);cx.stroke();break}
    case 'arc':{const r=p.s,a=p.a0+(1-t)*p.sw;cx.strokeStyle=p.c;cx.lineCap='round';cx.lineWidth=10*t+1;cx.shadowColor=p.c;cx.shadowBlur=14;
      cx.beginPath();cx.arc(p.x,p.y,r,a-1.1,a);cx.stroke();cx.shadowBlur=0;break}
    case 'plus':{const s=p.s;cx.fillStyle=p.c;cx.fillRect(p.x-s,p.y-s*.3,s*2,s*.6);cx.fillRect(p.x-s*.3,p.y-s,s*.6,s*2);break}
    default:{const g=cx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.s*2.2);g.addColorStop(0,p.c);g.addColorStop(.35,p.c);g.addColorStop(1,'transparent');cx.fillStyle=g;cx.beginPath();cx.arc(p.x,p.y,p.s*2.2,0,7);cx.fill()}}}
  ps.length=k;cx.globalAlpha=1;cx.globalCompositeOperation='source-over';
  FX.raf=k?requestAnimationFrame(fxLoop):0;if(!k)cx.clearRect(0,0,innerWidth,innerHeight)}
// rectangle de l'élément (créature ou héros), ou null
function fxRect(el){if(!el||!el.isConnected)return null;const c=el.classList&&el.classList.contains('slot')&&el.firstElementChild||el;return c.getBoundingClientRect()}
function fxLater(delay,f){if(fxOff())return;setTimeout(f,(delay||0)*ANIM)}

// ----- effets prêts à l'emploi -----
// impact d'un coup : gerbe d'étincelles + onde ; plus c'est fort, plus ça éclate
function fxHit(x,y,col,pw){pw=Math.min(10,pw||2);col=col||'#ffcf7a';
  fxEmit(x,y,{n:10+pw*3,col:['#fff4d6',col,'#ffb347'],sh:'spark',spd:[160,420+pw*30],life:[220,520],size:[1.5,3],drag:3.5,grav:260});
  fxEmit(x,y,{n:1,col,sh:'ring',spd:[0,0],life:[380,380],size:[30+pw*6,30+pw*6]});
  fxEmit(x,y,{n:4+pw,col:['#ffd27a','#ff8a3d'],spd:[30,120],life:[500,900],size:[1.5,3],grav:-40,drag:1})}
function fxHitAt(s,i,col,pw,delay){fxLater(delay,()=>{const r=fxRect(elAt(s,i));if(!r)return;fxHit(r.left+r.width/2,r.top+r.height*.45,col,pw);
  const c=i<0?elAt(s,i):elAt(s,i)&&elAt(s,i).firstElementChild;if(c){c.classList.remove('hitw');void c.offsetWidth;c.classList.add('hitw')}
  if(pw>=5||i<0&&pw>=3)fxShake(Math.min(10,pw))})}
// le plateau tremble (gros coups, héros touché)
function fxShake(pw){if(fxOff())return;const f=$('#field');if(!f)return;const a=2+pw*.8;
  f.animate([{transform:'translate(0,0)'},{transform:`translate(${-a}px,${a*.5}px)`},{transform:`translate(${a}px,${-a*.4}px)`},{transform:`translate(${-a*.6}px,${-a*.3}px)`},{transform:`translate(${a*.3}px,${a*.2}px)`},{transform:'translate(0,0)'}],{duration:320,easing:'ease-out'})}
// mort : la carte vole en éclats, avec de la fumée et des braises
function fxDeath(r,ban){if(!r)return;const x=r.left+r.width/2,y=r.top+r.height/2,cs=ban?['#7fd3ff','#b48cff','#e6f4ff']:['#c99a4a','#e8c47a','#2c4a86','#7a5426','#d9d2c0'];
  fxEmit(x,y,{n:26,col:cs,sh:'shard',w:r.width*.8,hgt:r.height*.8,spd:[60,260],ang:[-Math.PI*.95,-Math.PI*.05],life:[700,1200],size:[4,9],grav:620,drag:.8,spin:9,add:false});
  fxEmit(x,y+r.height*.2,{n:8,col:ban?'#8fb8ff':'#4a4a55',sh:'smoke',w:r.width*.6,spd:[10,50],ang:[-Math.PI*.9,-Math.PI*.1],life:[700,1100],size:[18,30],grav:-30,add:false});
  fxEmit(x,y,{n:14,col:ban?['#bfe6ff','#9d7bff']:['#ffcf7a','#ff7a3d'],w:r.width*.7,hgt:r.height*.6,spd:[20,90],ang:[-Math.PI,0],life:[600,1300],size:[1.5,3],grav:-60,drag:.6})}
// soin : particules vertes qui montent, quelques croix
function fxHeal(s,i,delay){fxLater(delay,()=>{const r=fxRect(elAt(s,i));if(!r)return;const x=r.left+r.width/2,y=r.top+r.height*.75;
  fxEmit(x,y,{n:16,col:['#a4f5a0','#5fd38a','#e8ffe0'],w:r.width*.8,spd:[30,90],ang:[-Math.PI*.6,-Math.PI*.4],life:[700,1200],size:[2,3.5],grav:-90,drag:.4});
  fxEmit(x,y,{n:4,col:'#8ff0a0',sh:'plus',w:r.width*.6,spd:[20,50],ang:[-Math.PI*.6,-Math.PI*.4],life:[800,1100],size:[4,6],grav:-60,drag:.3})})}
// bonus : étincelles dorées qui montent / malus : particules violettes qui tombent
function fxBuff(s,i,down,delay){fxLater(delay,()=>{const r=fxRect(elAt(s,i));if(!r)return;const x=r.left+r.width/2;
  if(down)fxEmit(x,r.top+r.height*.3,{n:14,col:['#b47cff','#6c3ab0','#d9b8ff'],w:r.width*.8,spd:[20,60],ang:[Math.PI*.4,Math.PI*.6],life:[600,1000],size:[2,3],grav:120,drag:.4});
  else{fxEmit(x,r.top+r.height*.85,{n:18,col:['#ffe08a','#f2b84b','#fff6d8'],w:r.width*.85,spd:[40,110],ang:[-Math.PI*.6,-Math.PI*.4],life:[600,1100],size:[1.5,3.2],grav:-120,drag:.5});
    fxEmit(x,r.top+r.height/2,{n:1,col:'#f2c35a',sh:'ring',spd:[0,0],life:[450,450],size:[r.width*.55,r.width*.55]})}})}
// Venin : gouttes vertes qui coulent et bulles
function fxPoison(s,i,delay){fxLater(delay,()=>{const r=fxRect(elAt(s,i));if(!r)return;const x=r.left+r.width/2;
  fxEmit(x,r.top+r.height*.35,{n:12,col:['#a6d65a','#6f9e2a','#d6f28a'],w:r.width*.7,spd:[10,40],ang:[Math.PI*.4,Math.PI*.6],life:[600,1000],size:[2.5,4],grav:380,drag:.6,add:false});
  fxEmit(x,r.top+r.height*.6,{n:8,col:'#c8ec7e',sh:'ring',w:r.width*.6,hgt:r.height*.3,spd:[10,30],ang:[-Math.PI*.6,-Math.PI*.4],life:[500,900],size:[3,6],grav:-50})})}
// Cleave : un arc de lame balaie la créature touchée par le coup de hache
function fxCleave(s,i,delay){fxLater(delay,()=>{const r=fxRect(elAt(s,i));if(!r)return;const x=r.left+r.width/2,y=r.top+r.height/2;
  fxEmit(x,y,{n:1,col:'#ffe2b0',sh:'arc',spd:[0,0],life:[300,300],size:[r.width*.55,r.width*.55],a0:-2.4,sweep:2.6});
  fxEmit(x,y,{n:10,col:['#fff1d6','#ffb35c'],sh:'spark',spd:[150,320],ang:[-.6,.6],life:[200,400],size:[1.5,2.5],drag:3})})}
// arrivée sur le plateau : cercle doré au sol, poussière et étincelles ; Hâte = éclairs bleus
function fxSummon(s,i,haste,delay){fxLater(delay,()=>{const r=fxRect(elAt(s,i));if(!r)return;const x=r.left+r.width/2,y=r.top+r.height*.92;
  fxEmit(x,y,{n:1,col:'#f2c35a',sh:'ring',spd:[0,0],life:[520,520],size:[r.width*.5,r.width*.5]});
  fxEmit(x,y,{n:12,col:['#d8c39a','#a8916a'],sh:'smoke',w:r.width*.6,spd:[30,80],ang:[-Math.PI,0],life:[500,800],size:[8,14],drag:2.5,add:false});
  fxEmit(x,r.top+r.height/2,{n:12,col:['#fff2c4','#f2c35a'],w:r.width,hgt:r.height,spd:[10,40],ang:[-Math.PI*.6,-Math.PI*.4],life:[500,900],size:[1.2,2.5],grav:-50});
  if(haste)fxEmit(x,r.top+r.height/2,{n:14,col:['#bfe8ff','#5fb8ff','#ffffff'],sh:'spark',w:r.width*.8,hgt:r.height*.8,spd:[200,420],life:[150,300],size:[1.2,2.2],drag:4})})}
// Tilt : la créature fulmine
function fxTilt(s,i,delay){fxLater(delay,()=>{const r=fxRect(elAt(s,i));if(!r)return;
  fxEmit(r.left+r.width/2,r.top+r.height*.25,{n:14,col:['#ff6a4a','#ffb347','#ff3b3b'],sh:'spark',spd:[120,280],ang:[-Math.PI*.85,-Math.PI*.15],life:[250,500],size:[1.5,3],grav:300,drag:2})})}
