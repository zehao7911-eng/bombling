const tile = 16;
export const world = {width:320,height:256,tile};
const shelf=(x,y,w)=>[x,y,w,1,1];
const wall=(x,y,h,type=1)=>[x,y,1,h,type];
const crumble=(x,y,h)=>wall(x,y,h,2);
const platform=(x,y,w)=>[x,y,w,16-y,1];
const floor=[1,14,18,2,1];
const sides=[[0,0,1,16,1],[19,0,1,16,1],[1,0,18,1,1]];
const room=(name,theme,rects,start,exit,flower,extras={})=>({
  name,theme,rects:[...sides,...rects],start,exit,flower,...extras
});

export const rooms=[
  room('A Little Lift',0,[floor,shelf(2,3,5),shelf(13,3,5),platform(10,10,9)],[136,216],[280,152],[208,134],
    {tip:'Place a seed. Pop it. Steer toward the flower.'}),
  room('Mind the Gap',0,[shelf(2,3,6),shelf(12,3,6),platform(1,13,7),platform(12,13,7)],[62,200],[278,200],[167,132],
    {spikes:[[8,15,4]],tip:'A pop carries you across.'}),
  room('Soft Stone',0,[floor,crumble(10,9,5)],[58,216],[278,216],[237,197],
    {tip:'Cracked stone loves a good pop.'}),
  room('One More Step',0,[floor,platform(8,10,4),platform(14,6,5)],[52,216],[280,88],[172,137],
    {tip:'Two seeds. Two little lifts.'}),
  room('Weight of a Wish',1,[floor,wall(14,5,9,3)],[48,216],[280,216],[253,196],
    {boxes:[[96,216]],plate:[168,224],tip:'Roll the block onto the gold button.'}),
  room('Under the Roots',1,[floor,shelf(4,7,9),crumble(10,10,4),platform(14,10,5)],[52,216],[282,152],[174,193],
    {tip:'Leave a seed by the cracked wall.'}),
  room('Petal Crossing',1,[platform(1,14,6),platform(9,10,3),platform(15,7,4)],[54,216],[281,104],[178,132],
    {spikes:[[7,15,8]],tip:'Pop, land, and pop again.'}),
  room('The Glass Bell',1,[floor,platform(4,10,6),platform(13,5,6)],[46,216],[280,72],[143,131],
    {tip:'Stand close to the ledge before you pop.'}),
  room('Moonseed Gate',2,[floor,wall(14,6,8,3),shelf(3,10,5)],[48,216],[280,216],[109,132],
    {boxes:[[96,216]],plate:[168,224],tip:'The gate remembers a pressed button.'}),
  room('The Hidden Garden',2,[floor,platform(4,10,6),crumble(11,9,5),platform(13,7,6)],[48,216],[282,104],[254,83],
    {tip:'A hidden flower waits past the soft stone.'}),
  room('Up, Up, Bloom',2,[floor,platform(6,10,5),platform(13,6,6)],[48,216],[282,88],[154,133],
    {tip:'Try planting your second seed while in the air.'}),
  room('Somewhere Soft',2,[floor,platform(6,10,4),platform(12,6,7),crumble(11,10,4)],[48,216],[280,88],[143,134],
    {tip:'One last climb. The garden is waiting.'}),
];

const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const isObject=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const integer=(x,a,b)=>Number.isInteger(x)&&x>=a&&x<=b;
const clone=x=>JSON.parse(JSON.stringify(x));

export function profile(data={}) {
  if(!isObject(data))data={};
  return {
    stars:rooms.map((_,i)=>integer(data.stars?.[i],0,3)?data.stars[i]:0),
    best:rooms.map((_,i)=>integer(data.best?.[i],0,1)?data.best[i]:0),
    sound:data.sound!==false,
    gentle:data.gentle===true,
    rewards:{like:data.rewards?.like===true,comment:data.rewards?.comment===true},
  };
}

export function mergeProfile(local,cloud) {
  const a=profile(local),b=profile(cloud);
  rooms.forEach((_,i)=>{
    a.stars[i]=Math.max(a.stars[i],b.stars[i]);
    a.best[i]=Math.max(a.best[i],b.best[i]);
  });
  a.rewards.like ||= b.rewards.like;
  a.rewards.comment ||= b.rewards.comment;
  return a;
}

export function tilesFor(index) {
  const grid=Array(20*16).fill(0);
  for(const [x,y,w,h,type] of rooms[index].rects) {
    for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)grid[j*20+i]=type;
  }
  return grid;
}

export function newRoom(index=0) {
  const data=rooms[index];
  return {index,phase:'ready',time:0,x:data.start[0],y:data.start[1],vx:0,vy:0,
    face:1,ground:true,bombs:[],nextBomb:1,broken:[],boxes:(data.boxes||[]).map(([x,y])=>({x,y,vy:0})),
    gate:false,plateTime:0,flower:false,deaths:0,pops:0,respawn:0,cooldown:0,events:[]};
}

export function snapshot(run) {
  const data=clone(run);
  delete data.events;
  return data;
}

export function restore(data,saved) {
  if(!isObject(data)||!integer(data.index,0,rooms.length-1))return newRoom();
  if(data.index>0&&!saved.stars[data.index-1])return newRoom();
  const run=newRoom(data.index);
  if(!['ready','active','dead','won'].includes(data.phase))return run;
  if(![data.x,data.y,data.vx,data.vy,data.time,data.respawn,data.cooldown].every(Number.isFinite))return run;
  if(data.x<7||data.x>313||data.y<8||data.y>272||Math.abs(data.vx)>700||Math.abs(data.vy)>1000)return run;
  if(!Array.isArray(data.broken)||data.broken.length>80||
    data.broken.some(n=>!integer(n,0,319)||tilesFor(data.index)[n]!==2))return run;
  if(!Array.isArray(data.bombs)||data.bombs.length>2||
    data.bombs.some(b=>!isObject(b)||![b.x,b.y,b.vy,b.age].every(Number.isFinite)||b.x<7||b.x>313||b.y<7||b.y>270))return run;
  if(!Array.isArray(data.boxes)||data.boxes.length!==run.boxes.length||
    data.boxes.some(b=>![b.x,b.y,b.vy].every(Number.isFinite)||b.x<8||b.x>312||b.y<8||b.y>270))return run;
  Object.assign(run,clone(data));
  run.events=[];
  run.deaths=integer(data.deaths,0,999999)?data.deaths:0;
  run.pops=integer(data.pops,0,999999)?data.pops:0;
  run.nextBomb=integer(data.nextBomb,1,999999)?data.nextBomb:1;
  run.gate=data.gate===true;
  run.flower=data.flower===true;
  run.ground=data.ground===true;
  run.face=data.face===-1?-1:1;
  run.cooldown=clamp(data.cooldown,0,.25);
  run.plateTime=clamp(Number(data.plateTime)||0,0,1);
  if(data.phase==='won'&&!saved.stars[data.index])return newRoom(data.index);
  return run;
}

export function solids(run) {
  const grid=tilesFor(run.index);
  const broken=new Set(run.broken);
  const result=[];
  for(let index=0;index<grid.length;index++){
    const type=grid[index];
    if(!type||broken.has(index)||type===3&&run.gate)continue;
    result.push({x:index%20*tile,y:Math.floor(index/20)*tile,w:tile,h:tile,type,id:index});
  }
  return result;
}

function overlap(a,b) {
  return a.x-a.rx<b.x+b.w&&a.x+a.rx>b.x&&a.y-a.ry<b.y+b.h&&a.y+a.ry>b.y;
}

function moveAxis(body,amount,axis,obstacles) {
  if(!amount)return false;
  body[axis]+=amount;
  let blocked=false;
  for(const block of obstacles){
    if(!overlap(body,block))continue;
    body[axis]=axis==='x' ? amount>0?block.x-body.rx:block.x+block.w+body.rx
      : amount>0?block.y-body.ry:block.y+block.h+body.ry;
    blocked=true;
  }
  return blocked;
}

function activate(run,host) {
  if(run.phase==='ready')run.phase='active';
  host?.start();
}

export function plant(run,host) {
  if(!['ready','active'].includes(run.phase)||run.bombs.length>=2||run.cooldown>0)return false;
  activate(run,host);
  run.bombs.push({id:run.nextBomb++,x:run.x,y:run.y+10,vy:Math.max(0,run.vy),age:0});
  run.cooldown=.15;
  run.events.push({type:'plant',x:run.x,y:run.y});
  return true;
}

export function pop(run,host) {
  if(!['ready','active'].includes(run.phase)||!run.bombs.length||run.cooldown>0)return false;
  const bomb=run.bombs.shift();
  if(bomb.age<.12){run.bombs.unshift(bomb);return false;}
  activate(run,host);
  run.pops++;
  run.cooldown=.13;
  const field=solids(run);
  const queue=[bomb];
  while(queue.length){
    const b=queue.shift();
    const dx=run.x-b.x,dy=run.y-b.y;
    if(Math.hypot(dx,dy)<70){
      const distance=Math.hypot(dx,dy);
      if(Math.abs(dx)>18&&distance>18){
        run.vx=clamp(dx/distance*415,-340,340);
        run.vy=dy>18?dy/distance*340:Math.min(-60,dy/distance*415);
      }else{
        run.vx=clamp(dx*10,-235,235);
        run.vy=dy>18?320:Math.max(-470,Math.min(-390,dy*9-340));
      }
      run.ground=false;
    }
    for(const box of run.boxes){
      if(Math.hypot(box.x-b.x,box.y-b.y)<62){
        box.x=clamp(box.x+(box.x-b.x)*.4,24,296);
        box.vy=-285;
      }
    }
    for(const block of field){
      if(block.type===2&&!run.broken.includes(block.id)&&
        Math.hypot(block.x+8-b.x,block.y+8-b.y)<45){
        run.broken.push(block.id);
        run.events.push({type:'break',x:block.x+8,y:block.y+8});
      }
    }
    for(let i=run.bombs.length-1;i>=0;i--){
      if(Math.hypot(run.bombs[i].x-b.x,run.bombs[i].y-b.y)<41)queue.push(run.bombs.splice(i,1)[0]);
    }
    run.events.push({type:'pop',x:b.x,y:b.y});
  }
  return true;
}

export function airborne(run) {
  return run.phase==='active'&&(!run.ground||run.bombs.length>0);
}

function die(run,host) {
  if(run.phase==='dead')return;
  run.phase='dead';run.respawn=.55;run.deaths++;
  run.events.push({type:'death',x:run.x,y:run.y});
  host?.end();
}

export function tick(run,dt,direction=0,host) {
  if(run.phase==='won')return;
  if(run.phase==='dead'){
    run.respawn-=dt;
    if(run.respawn<=0){
      const next=newRoom(run.index);
      next.flower=run.flower;next.deaths=run.deaths;next.pops=run.pops;
      Object.assign(run,next);
      host?.prepare();
      run.events.push({type:'respawn'});
    }
    return;
  }
  run.time+=dt;
  run.cooldown=Math.max(0,run.cooldown-dt);
  const input=clamp(Number.isFinite(direction)?direction:0,-1,1);
  if(input)run.face=Math.sign(input);
  const obstacles=solids(run);
  for(const box of run.boxes){
    const body={...box,rx:8,ry:8};
    box.vy=Math.min(520,box.vy+760*dt);
    if(moveAxis(body,box.vy*dt,'y',obstacles))box.vy=0;
    box.y=body.y;
  }
  const oldX=run.x;
  const goal=input*101;
  run.vx+=(goal-run.vx)*Math.min(1,dt*(run.ground?17:6.5));
  const hero={x:run.x,y:run.y,rx:7,ry:8};
  const delta=run.vx*dt;
  for(const box of run.boxes){
    const collider={x:box.x-8,y:box.y-8,w:16,h:16};
    const future={...hero,x:hero.x+delta};
    if(!overlap(future,collider))continue;
    const crate={x:box.x,y:box.y,rx:8,ry:8};
    if(moveAxis(crate,delta,'x',obstacles))run.vx=0;
    box.x=crate.x;
  }
  const boxes=run.boxes.map(b=>({x:b.x-8,y:b.y-8,w:16,h:16}));
  if(moveAxis(hero,run.vx*dt,'x',[...obstacles,...boxes]))run.vx=0;
  run.x=hero.x;
  if(input&&Math.abs(run.x-oldX)>.001)activate(run,host);
  run.vy=Math.min(540,run.vy+760*dt);
  const grounded=moveAxis(hero,run.vy*dt,'y',[...obstacles,...boxes]);
  run.ground=grounded&&run.vy>0;
  if(grounded)run.vy=0;
  run.y=hero.y;
  for(const bomb of run.bombs){
    bomb.age+=dt;bomb.vy=Math.min(540,bomb.vy+760*dt);
    const body={x:bomb.x,y:bomb.y,rx:5,ry:5};
    if(moveAxis(body,bomb.vy*dt,'y',obstacles))bomb.vy=0;
    bomb.y=body.y;
  }
  if(rooms[run.index].plate){
    const [x,y]=rooms[run.index].plate;
    const pressed=run.boxes.some(b=>Math.abs(b.x-x)<16&&Math.abs(b.y+8-y)<5);
    if(pressed)run.plateTime=Math.min(1,run.plateTime+dt);
    if(!run.gate&&run.plateTime>.16){
      run.gate=true;run.events.push({type:'gate',x,y});
    }
  }
  const flower=rooms[run.index].flower;
  if(!run.flower&&Math.hypot(run.x-flower[0],run.y-flower[1])<17){
    run.flower=true;run.events.push({type:'flower',x:flower[0],y:flower[1]});
  }
  for(const [x,y,w] of rooms[run.index].spikes||[]){
    if(run.x+6>x*16&&run.x-6<(x+w)*16&&run.y+8>y*16-2){
      die(run,host);return;
    }
  }
  if(run.y>265){die(run,host);return;}
  const [exitX,exitY]=rooms[run.index].exit;
  if(Math.abs(run.x-exitX)<13&&Math.abs(run.y-exitY)<18){
    run.phase='won';run.vx=0;run.vy=0;
    run.events.push({type:'win',x:exitX,y:exitY});
    host?.end();
  }
}

export function earn(run,p) {
  if(run.phase!=='won')return 0;
  const value=1+Number(run.deaths===0)+Number(run.flower);
  p.stars[run.index]=Math.max(p.stars[run.index],value);
  p.best[run.index]=Math.max(p.best[run.index],Number(run.flower));
  return value;
}





