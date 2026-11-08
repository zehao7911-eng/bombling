import * as Core from './core.mjs';
import {View} from './art.mjs';
import {bridge} from './sdk.mjs';

const $=id=>document.getElementById(id);
const storageKey='bombling-v1';
const scene=new View($('game'));
const dialog=$('dialog');
const held=new Map();
const keys=new Set();
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let sdk,run,player,viewTime=0,last=0,accumulator=0,paintNeeded=true,needsResize=true;
let mode='',audio=null,frame=0,savedAt=0,uiSignature='',winOnce=false;

function readLocal(){
 try{return JSON.parse(localStorage.getItem(storageKey))||{};}
 catch{return {};}
}
const local=readLocal();
player=Core.profile(local.profile);
run=Core.restore(local.active,player);

function save(){
 player=Core.mergeProfile(player,readLocal().profile);
 try{localStorage.setItem(storageKey,JSON.stringify({profile:player,active:Core.snapshot(run)}));}catch{}
 savedAt=run.time;
}

function connect(){
 sdk=bridge({
  read:()=>player,
  write:(incoming,merge)=>{
   player=merge?Core.mergeProfile(player,incoming):Core.profile(incoming);
   save();paintNeeded=true;
  },
  changed:event=>{
   needsResize=true;
   if(event.type==='reward'){
    scene.effects([{type:'flower',x:run.x,y:run.y-15}],player.gentle,player.rewards.comment);
    sound('flower');
   }
   if(dialog.open&&mode==='settings')menuContents();
  },
 });
}

function fit(){
 needsResize=false;
 const viewport=sdk?.viewport();
 $('app').style.width=viewport?Math.min(viewport.width,innerWidth)+'px':'';
 scene.resize();
 paintNeeded=true;
}

function sound(type){
 if(!player.sound)return;
 try{
  const Context=window.AudioContext||window.webkitAudioContext;
  if(!Context)return;
  if(!audio)audio=new Context();
  if(audio.state==='suspended')audio.resume().catch(()=>{});
  const sequence={
   plant:[330,440],pop:[135,75,265],break:[170,100],
   flower:[659,784,1047],gate:[220,330,523],death:[220,165],
   win:[392,523,659,784,1047],
  }[type];
  if(!sequence||audio.state!=='running')return;
  sequence.forEach((frequency,i)=>{
   const time=audio.currentTime+i*.055;
   const oscillator=audio.createOscillator(),gain=audio.createGain();
   oscillator.type=type==='pop'||type==='break'?'triangle':'sine';
   oscillator.frequency.setValueAtTime(frequency,time);
   oscillator.frequency.exponentialRampToValueAtTime(Math.max(40,frequency*(type==='pop'?.5:1.025)),time+.17);
   gain.gain.setValueAtTime(.001,time);gain.gain.exponentialRampToValueAtTime(.075,time+.009);
   gain.gain.exponentialRampToValueAtTime(.001,time+.19);
   oscillator.connect(gain);gain.connect(audio.destination);
   oscillator.start(time);oscillator.stop(time+.205);
  });
 }catch{}
}

function neutral(){
 held.clear();keys.clear();
 for(const name of ['left','right'])$(name).classList.remove('held');
}

function events(){
 const queue=run.events.splice(0);
 if(!queue.length)return;
 scene.effects(queue,player.gentle||reduced.matches,player.rewards.comment);
 let persist=false;
 for(const event of queue){
  sound(event.type);
  if(['plant','pop','gate','flower','death','respawn'].includes(event.type))persist=true;
  if(event.type==='death'){neutral();winOnce=false;}
  if(event.type==='win'&&!winOnce){
   winOnce=true;
   Core.earn(run,player);
   persist=true;neutral();sdk.save();
  }
 }
 if(persist)save();
 paintNeeded=true;
 updateUI();
}

function action(name){
 if(dialog.open)return;
 const accepted=name==='plant'?Core.plant(run,sdk):Core.pop(run,sdk);
 if(accepted){events();updateUI();}
}

for(const name of ['left','right']){
 const button=$(name),direction=name==='left'?-1:1;
 button.addEventListener('pointerdown',event=>{
  if(event.button!==0||dialog.open||run.phase==='won')return;
  event.preventDefault();button.setPointerCapture(event.pointerId);
  held.set(event.pointerId,direction);button.classList.add('held');
 });
 const release=event=>{
  held.delete(event.pointerId);button.classList.remove('held');
 };
 button.addEventListener('pointerup',release);
 button.addEventListener('pointercancel',release);
 button.addEventListener('lostpointercapture',release);
}

$('plant').addEventListener('click',()=>action('plant'));
$('pop').addEventListener('click',()=>action('pop'));
addEventListener('keydown',event=>{
 if(dialog.open)return;
 if(['ArrowLeft','ArrowRight','KeyA','KeyD','KeyZ','KeyX','Space'].includes(event.code)){
  event.preventDefault();
  if(!event.repeat&&(event.code==='KeyZ'||event.code==='Space'))action('plant');
  if(!event.repeat&&event.code==='KeyX')action('pop');
  keys.add(event.code);
 }
 if(event.code==='Escape')openMenu('settings');
});
addEventListener('keyup',event=>keys.delete(event.code));
addEventListener('blur',neutral);

function direction(){
 let value=Number(keys.has('ArrowRight')||keys.has('KeyD'))-Number(keys.has('ArrowLeft')||keys.has('KeyA'));
 for(const d of held.values())value+=d;
 return Math.max(-1,Math.min(1,value));
}

function updateUI(){
 const data=Core.rooms[run.index],signature=[run.index,run.phase,run.bombs.length,run.flower,player.stars.join(','),player.best.join(','),run.cooldown>.001].join('|');
 if(signature===uiSignature)return;
 uiSignature=signature;
 $('roomTitle').textContent=data.name;
 $('roomNumber').textContent=String(run.index+1).padStart(2,'0')+' / 12';
 $('zone').textContent=['VIOLET ROOTS','TIDAL GARDEN','ROSE AFTERGLOW'][data.theme];
 $('collection').textContent='✿ '+player.best.reduce((a,b)=>a+b,0)+' / 12';
 $('seedCount').textContent='● '.repeat(2-run.bombs.length)+'○ '.repeat(run.bombs.length);
 $('flowerState').textContent=run.flower?'✿ FOUND':'✿';
 const won=run.phase==='won',dead=run.phase==='dead';
 $('controls').hidden=won;$('next').hidden=!won;$('roomResult').hidden=!won;
 $('plant').disabled=won||dead||run.bombs.length>=2;
 $('pop').disabled=won||dead||!run.bombs.length;
 $('status').textContent=won?'The bloom remembers your little adventure.'
   :dead?'A soft landing is one retry away.'
   :run.index===0&&run.bombs.length?'POP the seed, then hold ▶ in the air.'
   :data.tip;
 if(won){
  const stars=1+Number(run.deaths===0)+Number(run.flower);
  $('resultTitle').textContent=run.index===11?'The garden woke up.':'A little victory!';
  $('stars').textContent='✦ '.repeat(stars)+'· '.repeat(3-stars);
  $('resultNote').textContent=run.flower?'A flower for the garden.':'There is still a flower to find.';
  $('next').textContent=run.index===11?'Visit the garden →':'Next chamber →';
 }
}

function swap(index){
 neutral();sdk.end();sdk.prepare();
 run=Core.newRoom(index);winOnce=false;uiSignature='';savedAt=0;
 scene.blasts=[];scene.particles=[];scene.shake=0;scene.flash=0;
 save();updateUI();paintNeeded=true;
}

function addButton(parent,title,detail,handler,{disabled=false,selected=false}={}){
 const button=document.createElement('button');button.type='button';
 button.className='row'+(selected?' current':'');button.disabled=disabled;button.append(title);
 if(detail){const small=document.createElement('small');small.textContent=detail;button.append(small);}
 button.addEventListener('click',handler);parent.append(button);
}

function menuContents(){
 const body=$('modalBody');body.replaceChildren();
 if(mode==='guide'){
  $('modalTitle').textContent='Make a little pop.';
  const p=document.createElement('div');p.className='instructions';
  p.innerHTML='<b>1. PLACE</b> leaves a seed beneath you.<br><b>2. POP</b> bursts the oldest seed.<br><b>3. STEER</b> with ◀ or ▶ while you fly.<br><br>Carry two seeds. A nearby burst can chain both. Cracked stones break. Gold buttons open gates. A flower is optional. Reach the glowing bloom to continue.';
  body.append(p);
 }else if(mode==='map'){
  $('modalTitle').textContent='Tiny chambers';
  const rows=document.createElement('div');rows.className='rows';body.append(rows);
  Core.rooms.forEach((data,i)=>{
   const locked=i>0&&!player.stars[i-1],stars=player.stars[i];
   addButton(rows,String(i+1).padStart(2,'0')+'  '+data.name,locked?'Clear the previous chamber':
    stars?'✦'.repeat(stars)+(player.best[i]?' · Flower found':' · Flower hidden'):'A little adventure awaits.',
    ()=>{swap(i);dialog.close();},{disabled:locked,selected:i===run.index});
  });
 }else{
  $('modalTitle').textContent='A quiet moment';
  const rows=document.createElement('div');rows.className='rows';body.append(rows);
  addButton(rows,'Resume',null,()=>{
   if(Core.airborne(run))sdk.start();
   dialog.close();
  });
  addButton(rows,'Sound '+(player.sound?'on':'off'),null,()=>{player.sound=!player.sound;save();menuContents();});
  addButton(rows,'Gentle flashes '+(player.gentle?'on':'off'),'Calmer explosions and camera.',()=>{
   player.gentle=!player.gentle;save();menuContents();paintNeeded=true;
  });
  addButton(rows,'How to pop',null,()=>{mode='guide';menuContents();});
  addButton(rows,'Restart chamber','Fresh seeds, stones and boxes.',()=>{swap(run.index);dialog.close();});
  const support=sdk.support();
  if(support.like)addButton(rows,player.rewards.like?'Gold seed buds earned':'Gold seed buds','Optional GameWave like cosmetic.',()=>{},{disabled:true});
  if(support.comment)addButton(rows,player.rewards.comment?'Prism sparks earned':'Prism sparks','Optional GameWave direct comment cosmetic.',()=>{},{disabled:true});
 }
}

function openMenu(type){
 neutral();mode=type;menuContents();
 if(!dialog.open)dialog.showModal();
 paintNeeded=true;
}
$('pause').addEventListener('click',()=>openMenu('settings'));
$('book').addEventListener('click',()=>openMenu('map'));
$('guide').addEventListener('click',()=>openMenu('guide'));
$('close').addEventListener('click',()=>{
 if(Core.airborne(run))sdk.start();
 dialog.close();
});
$('restart').addEventListener('click',()=>swap(run.index));
$('next').addEventListener('click',()=>{
 if(run.index===11)openMenu('map');
 else swap(run.index+1);
});
dialog.addEventListener('close',()=>{last=0;paintNeeded=true;});

function loop(time){
 frame=requestAnimationFrame(loop);
 if(needsResize)fit();
 if(document.hidden)return;
 const elapsed=last?(time-last)/1000:0;
 if(last&&elapsed<1/45&&!paintNeeded)return;
 last=time;
 const dt=dialog.open?0:Math.min(.1,elapsed);
 if(dialog.open&&!paintNeeded)return;
 viewTime+=dt;
 if(!dialog.open){
  accumulator+=dt;
  while(accumulator>=1/120){
   accumulator-=1/120;Core.tick(run,1/120,direction(),sdk);events();
  }
  if(run.phase==='active'&&run.time-savedAt>2)save();
 }
 updateUI();
 scene.paint(run,player,dt,viewTime);
 paintNeeded=false;
}

addEventListener('resize',()=>{needsResize=true;});
new ResizeObserver(()=>{needsResize=true;}).observe($('screen'));
document.addEventListener('visibilitychange',()=>{
 neutral();last=0;
 if(document.hidden){save();audio?.suspend().catch(()=>{});}
 else if(run.phase==='active'&&!dialog.open)openMenu('settings');
});
addEventListener('pagehide',()=>{save();sdk.stop();cancelAnimationFrame(frame);});
addEventListener('pageshow',event=>{
 if(event.persisted){connect();last=0;frame=requestAnimationFrame(loop);openMenu('settings');}
});
connect();updateUI();
if(run.phase==='active'||run.phase==='dead')openMenu('settings');
frame=requestAnimationFrame(loop);
