import {world,rooms,tilesFor} from './core.mjs';

const palettes=[
 {back:'#100d27',pattern:'#1b1241',rock:'#8137e6',light:'#b56dff',dark:'#462282',vine:'#393779',accent:'#eaa4ed',seed:'#f7a8db'},
 {back:'#081f2c',pattern:'#103749',rock:'#267e96',light:'#60c8d3',dark:'#164662',vine:'#24556b',accent:'#e9d08b',seed:'#ffc8a2'},
 {back:'#22132d',pattern:'#3a2144',rock:'#a04982',light:'#e888b5',dark:'#512b5e',vine:'#743b6b',accent:'#f3ce91',seed:'#c2e8df'},
];
const ink='#171329';
const pink='#f7a7db', mint='#89f0df', pale='#ffffae';
const rand=seed=>()=>{
 seed=(Math.imul(seed,1664525)+1013904223)>>>0;
 return seed/4294967296;
};
const px=(c,x,y,w,h,color)=>{
 c.fillStyle=color;
 c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));
};
const line=(c,x,y,xx,yy,color)=>{
 c.strokeStyle=color;c.lineWidth=1;c.beginPath();c.moveTo(Math.round(x)+.5,Math.round(y)+.5);
 c.lineTo(Math.round(xx)+.5,Math.round(yy)+.5);c.stroke();
};
function ring(c,x,y,r,color){
 c.strokeStyle=color;c.lineWidth=1;
 c.beginPath();
 c.moveTo(x-r+2,y-r);c.lineTo(x+r-2,y-r);c.lineTo(x+r,y-r+2);
 c.lineTo(x+r,y+r-2);c.lineTo(x+r-2,y+r);c.lineTo(x-r+2,y+r);
 c.lineTo(x-r,y+r-2);c.lineTo(x-r,y-r+2);c.closePath();c.stroke();
}
function petal(c,x,y,shade,stem=false){
 if(stem){px(c,x,y,1,12,shade);px(c,x-4,y+5,4,2,shade);px(c,x+1,y+7,4,2,shade);}
 px(c,x-1,y-5,3,3,shade);px(c,x-5,y-1,3,3,shade);
 px(c,x-1,y+3,3,3,shade);px(c,x+3,y-1,3,3,shade);
 px(c,x-1,y-1,3,3,pale);
}
function backdrop(index){
 const room=rooms[index],colors=palettes[room.theme],rnd=rand(885+index);
 const canvas=document.createElement('canvas');canvas.width=320;canvas.height=256;
 const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
 px(c,0,0,320,256,colors.back);
 for(let y=16;y<256;y+=16)for(let x=16;x<320;x+=16){
   const xx=x+(y%32?0:8);
   px(c,xx+2,y+1,10,2,colors.pattern);px(c,xx,y+3,14,3,colors.pattern);
   px(c,xx+2,y+6,10,2,colors.pattern);px(c,xx+4,y+8,6,2,colors.pattern);
 }
 // Fixed organic silhouettes give each chamber a readable depth behind its collision tiles.
 for(let i=0;i<13;i++){
  const x=Math.floor(rnd()*298)+11,y=Math.floor(rnd()*205)+20;
  let xx=x;
  for(let j=0;j<3+Math.floor(rnd()*5);j++){
   const yy=y+j*5;
   line(c,xx,yy,xx,yy+5,colors.vine);
   if(j%2){line(c,xx,yy+5,xx+3,yy+5,colors.vine);xx+=3;}
  }
  if(i%3===0)ring(c,x,y,4,colors.vine);
 }
 const grove=room.theme===0?'#252152':room.theme===1?'#1b4957':'#492640';
 for(let j=0;j<4;j++){
  const x=24+j*85+Math.round(rnd()*20),y=225;
  px(c,x,y-39,2,39,grove);
  for(let i=0;i<5;i++){px(c,x-7-i%2*3,y-34+i*7,8,2,grove);px(c,x+2,y-37+i*7,8+i%2*3,2,grove);}
 }
 for(let i=0;i<90;i++){
  const x=Math.floor(rnd()*320),y=Math.floor(rnd()*256);
  if(i%11===0){px(c,x-1,y,3,1,colors.vine);px(c,x,y-1,1,3,colors.vine);}
  else px(c,x,y,1,1,colors.pattern);
 }
 return canvas;
}
function stone(c,x,y,type,colors,index){
 if(type===3){
  px(c,x,y,16,16,'#16192e');
  px(c,x+2,y,3,16,'#57c6dc');px(c,x+10,y,3,16,'#57c6dc');
  px(c,x+3,y+2,1,11,'#b6fff0');px(c,x+11,y+2,1,11,'#b6fff0');
  if(index%2===0)px(c,x,y+7,16,2,'#5d9fad');
  return;
 }
 const broken=type===2;
 const main=broken?'#e2b471':colors.rock;
 const light=broken?'#ffdf95':colors.light;
 const dark=broken?'#936152':colors.dark;
 px(c,x,y,16,16,main);
 px(c,x+1,y,14,1,light);
 px(c,x,y+1,1,14,light);
 px(c,x+1,y+15,14,1,dark);
 px(c,x+15,y+1,1,14,dark);
 const flip=index%3;
 line(c,x+5+flip,y,x+5+flip,y+5,dark);
 line(c,x,y+8+flip,x+5,y+8+flip,dark);
 line(c,x+10,y+15,x+10,y+12,dark);
 if(broken){
  line(c,x+7,y+4,x+11,y+8,dark);line(c,x+11,y+8,x+7,y+11,dark);
  px(c,x+4,y+4,2,1,light);px(c,x+11,y+12,2,1,light);
 }else{
  px(c,x+11,y+4,2,1,light);px(c,x+4,y+12,2,1,light);
 }
}
function seed(c,x,y,t,ready,color,like){
 const s=Math.sin(t*6)*.5;
 x=Math.round(x);y=Math.round(y+s);
 px(c,x-4,y-5,8,1,ink);px(c,x-6,y-3,12,7,ink);px(c,x-4,y+4,8,2,ink);
 px(c,x-4,y-4,8,8,color);px(c,x-5,y-2,10,5,color);
 px(c,x-3,y-3,3,1,'#ffe8ec');px(c,x-4,y-2,1,2,'#ffe8ec');
 px(c,x-3,y+3,6,1,'#c273b2');
 px(c,x-1,y-8,2,4,like?'#ffe4a2':'#e5bae1');
 px(c,x-2,y-9,4,2,like?'#ffe4a2':'#e5bae1');
 if(ready)px(c,x-1,y,2,2,pale);
}
function hero(c,run,t,like,won,ghost=false){
 const x=Math.round(run.x),y=Math.round(run.y),walk=Math.abs(run.vx)>10&&run.ground;
 const step=walk?Math.floor(t*16)%4:0;
 const bounce=walk?[0,-1,0,1][step]:0;
 c.save();c.translate(x,y+bounce);
 if(ghost)c.globalAlpha=.45;
 if(!run.ground&&!won)c.rotate(Math.max(-.15,Math.min(.15,run.vx/1000)));
 // Segmented shell, separate face, antennae and feet remain legible at a single pixel scale.
 px(c,-12,-6,3,10,ink);px(c,-10,-9,15,16,ink);
 px(c,3,-6,9,12,ink);px(c,-7,-11,9,3,ink);
 px(c,-11,-5,3,8,'#cd75b9');px(c,-9,-8,13,14,pink);
 px(c,-7,-9,8,1,'#ffd2ed');px(c,-8,-8,2,1,'#ffd2ed');
 px(c,-6,-10,1,2,'#ffb6e3');
 px(c,-7,-12,1,3,pink);px(c,1,-12,1,3,pink);
 px(c,-9,-14,4,3,pink);px(c,0,-14,4,3,pink);
 px(c,-4,-12,2,2,like?'#ffe499':pink);
 px(c,-7,4,3,3,'#b56eab');px(c,-2,5,3,3,'#b56eab');px(c,4,4,3,3,'#b56eab');
 px(c,-6+[0,1,0,-1][step],7,3,1,'#ffb4e3');
 px(c,3-[0,1,0,-1][step],7,3,1,'#ffb4e3');
 px(c,-4,-5,13,10,ink);px(c,-2,-7,9,2,ink);
 px(c,-2,-5,10,8,mint);px(c,0,-6,6,1,mint);
 px(c,-2,2,10,1,'#4db6ba');
 const blink=Math.floor(t*2)%17===13;
 const face=run.face;
 px(c,1+face,-2,2,blink?1:2,ink);px(c,5+face,-2,2,blink?1:2,ink);
 px(c,4,1,2,1,'#1c7e8c');
 if(won){px(c,0,-2,3,1,ink);px(c,5,-2,3,1,ink);}
 c.restore();
}

function doorway(c,room,t,won){
 const [x,y]=room.exit;
 const colors=palettes[room.theme];
 ring(c,x,y-3,12,colors.vine);
 px(c,x-13,y-4,2,17,colors.rock);px(c,x+12,y-4,2,17,colors.rock);
 px(c,x-10,y-9,21,2,colors.rock);px(c,x-7,y-12,14,3,colors.rock);
 px(c,x-11,y+10,23,3,colors.rock);
 px(c,x-8,y-6,17,15,colors.pattern);
 const pulse=Math.sin(t*3)>0;
 px(c,x-7,y+8,15,2,pulse?mint:'#4ba6b4');
 petal(c,x,y-3,won?pale:colors.accent);
 if(won){ring(c,x,y-3,15+(Math.floor(t*5)%2),mint);}
}

function critters(c,room,t){
 const colors=palettes[room.theme];
 const x=room.index===0?258:265,y=33;
 const wing=Math.floor(t*8)%2;
 px(c,x-4,y-3,8,5,colors.vine);px(c,x-2,y-5,4,8,colors.vine);
 px(c,x-9,y-(wing?6:1),5,3,colors.vine);px(c,x+4,y-(wing?6:1),5,3,colors.vine);
 px(c,x-1,y-2,1,1,colors.light);px(c,x+2,y-2,1,1,colors.light);
}

function guardian(c,room,t,heroX){
 const x=room.exit[0]-32,base=room.exit[1]+8;
 const breathing=Math.floor(Math.sin(t*2)*.8);
 const y=base+breathing;
 const asleep=Math.floor(t*.65)%7===4;
 px(c,x-12,y-15,24,12,ink);px(c,x-15,y-11,30,10,ink);
 px(c,x-13,y-13,26,12,pale);px(c,x-15,y-9,30,8,pale);
 px(c,x-10,y-22,7,10,ink);px(c,x+4,y-22,7,10,ink);
 px(c,x-9,y-21,5,9,pale);px(c,x+5,y-21,5,9,pale);
 const look=heroX>x?1:0;
 px(c,x-8+look,y-18,2,asleep?1:3,ink);
 px(c,x+6+look,y-18,2,asleep?1:3,ink);
 px(c,x-7,y-8,14,1,'#7f6d64');
 px(c,x-10,y-3,3,2,'#e6c887');px(c,x+8,y-3,3,2,'#e6c887');
 px(c,x-15,y,7,2,pale);px(c,x+8,y,7,2,pale);
 if(Math.floor(t*1.2)%5===0)px(c,x+3,y-7,4,5,'#f7a7db');
}
export class View{
 constructor(canvas){
  this.canvas=canvas;this.context=canvas.getContext('2d',{alpha:false});
  this.buffer=document.createElement('canvas');this.buffer.width=320;this.buffer.height=256;
  this.c=this.buffer.getContext('2d',{alpha:false});this.cache=new Map();
  this.particles=[];this.blasts=[];this.shake=0;this.flash=0;
 }
 resize(){
  const rect=this.canvas.getBoundingClientRect();
  if(!rect.width||!rect.height)return;
  const d=Math.min(devicePixelRatio||1,2);
  const width=Math.round(rect.width*d),height=Math.round(rect.height*d);
  if(width!==this.canvas.width||height!==this.canvas.height){
    this.canvas.width=width;this.canvas.height=height;this.context.imageSmoothingEnabled=false;
  }
 }
 effects(events,gentle,comment){
  for(const event of events){
   if(['pop','win','flower','gate','death','break'].includes(event.type)){
    const count=event.type==='win'?36:event.type==='pop'?22:8;
    const rnd=rand(Math.round(event.x*513+event.y*51+this.particles.length));
    for(let i=0;i<count;i++){
     const palette=comment?[mint,pale,pink,'#ae9aff']:event.type==='break'?['#f7d387','#a9776d']:event.type==='death'?[mint,pink]:[mint,pink,pale];
     this.particles.push({x:event.x,y:event.y,vx:(rnd()-.5)*170,vy:-rnd()*170,
       age:0,life:.3+rnd()*.5,color:palette[i%palette.length],size:i%5===0?2:1});
    }
    if(event.type==='pop'){
     this.blasts.push({x:event.x,y:event.y,age:0});
     if(!gentle){this.shake=.13;this.flash=.045;}
    }
   }
  }
  if(this.particles.length>100)this.particles.splice(0,this.particles.length-100);
 }
 paint(run,p,dt,anim){
  const c=this.c,colors=palettes[rooms[run.index].theme],room=rooms[run.index];
  const seconds=anim;
  if(!this.cache.has(run.index))this.cache.set(run.index,backdrop(run.index));
  c.drawImage(this.cache.get(run.index),0,0);
  critters(c,{...room,index:run.index},seconds);
  const grid=tilesFor(run.index),broken=new Set(run.broken);
  for(let index=0;index<grid.length;index++){
   const type=grid[index];
   if(!type||broken.has(index)||type===3&&run.gate)continue;
   stone(c,index%20*16,Math.floor(index/20)*16,type,colors,index);
  }
  for(const [x,y,w] of room.spikes||[]){
   for(let i=0;i<w*4;i++){
    const xx=x*16+i*4,yy=y*16;
    px(c,xx+1,yy,1,3,mint);px(c,xx,yy+3,3,3,mint);
    px(c,xx-1,yy+6,5,3,'#3cb7ce');px(c,xx+1,yy+6,1,1,pale);
   }
  }
  if(room.plate){
   const [x,y]=room.plate;
   line(c,x,y+3,232,y+3,run.gate?mint:colors.vine);
   line(c,232,y+3,232,98,run.gate?mint:colors.vine);
   px(c,x-12,y-2,24,3,run.gate?mint:'#ffe294');px(c,x-10,y-4,20,2,run.gate?'#8bffe0':'#b89665');
   ring(c,232,92,4,run.gate?mint:colors.vine);
  }
  guardian(c,room,seconds,run.x);
  doorway(c,room,seconds,run.phase==='won');
  if(!run.flower){
   const [x,y]=room.flower;
   petal(c,x,Math.round(y+Math.sin(seconds*3)*2),colors.accent);
   ring(c,x,y,11,colors.vine);
  }
  for(const box of run.boxes){
   const x=Math.round(box.x)-8,y=Math.round(box.y)-8;
   px(c,x,y,16,16,ink);px(c,x+1,y+1,14,14,'#cfaa73');
   px(c,x+2,y+2,12,2,'#ffe8a0');px(c,x+2,y+4,2,9,'#efce8b');
   px(c,x+12,y+4,2,9,'#8d6b60');px(c,x+4,y+12,8,2,'#8d6b60');
   px(c,x+6,y+5,4,6,'#6d5262');px(c,x+7,y+6,2,4,'#f0d7a0');
  }
  const held=2-run.bombs.length;
  if(run.phase!=='dead'&&run.phase!=='won'){
   for(let i=0;i<held;i++){
    const x=run.x-run.face*(18+i*12),y=run.y+2+Math.sin(seconds*8-i)*1.1;
    line(c,run.x-run.face*7,run.y+2,x,y,'#b36aab');
    seed(c,x,y,seconds+i,true,pink,p.rewards.like);
   }
  }
  for(const bomb of run.bombs)seed(c,bomb.x,bomb.y,seconds,bomb.age>.12,colors.seed,p.rewards.like);
  if(run.phase!=='dead')hero(c,run,seconds,p.rewards.like,run.phase==='won');
  for(const burst of this.blasts){
   burst.age+=dt;
   if(burst.age>.28)continue;
   const size=5+burst.age*174;
   c.save();c.globalAlpha=1-burst.age/.28;
   ring(c,Math.round(burst.x),Math.round(burst.y),Math.round(size),burst.age<.06?pale:mint);
   if(burst.age<.06){
    px(c,burst.x-3,burst.y-12,6,24,pale);
    px(c,burst.x-12,burst.y-3,24,6,pale);
    px(c,burst.x-7,burst.y-7,14,14,pale);
   }
   c.restore();
  }
  this.blasts=this.blasts.filter(b=>b.age<.28);
  for(const particle of this.particles){
   particle.age+=dt;
   if(particle.age>particle.life)continue;
   particle.vy+=210*dt;particle.x+=particle.vx*dt;particle.y+=particle.vy*dt;
   c.globalAlpha=Math.min(1,(particle.life-particle.age)*5);
   px(c,particle.x,particle.y,particle.size,particle.size,particle.color);
  }
  c.globalAlpha=1;
  this.particles=this.particles.filter(s=>s.age<s.life);
  this.shake=Math.max(0,this.shake-dt);this.flash=Math.max(0,this.flash-dt);
  const context=this.context,w=this.canvas.width,h=this.canvas.height;
  context.fillStyle=colors.back;context.fillRect(0,0,w,h);
  const scale=Math.min(w/320,h/256);
  const offsetX=Math.round((w-320*scale)*.5),offsetY=Math.round((h-256*scale)*.5);
  const jitter=this.shake>0&&!p.gentle?Math.sin(seconds*187)*scale:0;
  context.imageSmoothingEnabled=false;
  context.drawImage(this.buffer,Math.round(offsetX+jitter),offsetY,Math.round(320*scale),Math.round(256*scale));
  if(this.flash>0&&!p.gentle){context.fillStyle='#f6edb51f';context.fillRect(0,0,w,h);}
 }
}

