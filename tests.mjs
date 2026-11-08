import assert from 'node:assert/strict';
import * as Core from './core.mjs';

export const plans=[
 [['walk',153],['pop',280]],
 [['walk',112],['pop',278]],
 [['walk',151],['pop',151],['walk',278]],
 [['walk',120],['pop',172],['walk',183],['pop',280]],
 [['walk',280]],
 [['walk',151],['pop',151],['walk',215],['pop',280]],
 [['walk',100],['pop',169],['walk',182],['pop',280]],
 [['walk',46],['pop',109],['walk',151],['pop',280]],
 [['walk',280]],
 [['walk',46],['pop',112],['walk',151],['pop',280]],
 [['walk',88],['pop',139],['walk',165],['pop',280]],
 [['walk',88],['pop',143],['walk',153],['pop',280]],
];
let checks=0,campaigns=0;
const check=(condition,message)=>{assert.ok(condition,message);checks++;};
function step(run,frames,direction=0,host){
 for(let i=0;i<frames;i++)Core.tick(run,1/120,direction,host);
}
function walk(run,target,host){
 for(let i=0;i<600;i++){
  if(Math.abs(run.x-target)<2||run.phase==='won')return true;
  Core.tick(run,1/120,Math.sign(target-run.x),host);
  if(run.phase==='dead')return false;
 }
 return false;
}
function launch(run,target,host){
 step(run,22,0,host);
 check(Core.plant(run,host),'place is accepted');
 check(!Core.pop(run,host),'instant pop is guarded while arming');
 step(run,22,0,host);
 check(Core.pop(run,host),'armed bomb pops');
 for(let i=0;i<360;i++){
  const direction=Math.abs(target-run.x)>2?Math.sign(target-run.x):0;
  Core.tick(run,1/120,direction,host);
  if(run.phase==='won')return true;
  if(run.phase==='dead')return false;
  if(i>20&&run.ground&&Math.abs(target-run.x)<3)return true;
 }
 return false;
}
for(let attempt=0;attempt<2;attempt++){
 const saved=Core.profile();
 for(let index=0;index<12;index++){
  let run=Core.newRoom(index),ends=0,starts=0;
  const host={start(){starts++;},end(){ends++;},prepare(){}};
  for(const [action,target] of plans[index]){
   check(action==='walk'?walk(run,target,host):launch(run,target,host),'normal route '+index+' reaches its next surface');
   if(attempt===1){
    const raw=Core.snapshot(run);
    if(run.phase==='won')Core.earn(run,saved);
    run=Core.restore(raw,{...saved,stars:Array(12).fill(3)});
    assert.deepEqual(Core.snapshot(run),raw);
    checks++;
   }
  }
  check(run.phase==='won'&&ends===1&&starts>0,'chamber '+index+' actually completes once');
  check(Core.earn(run,saved)>=2,'no-death completion medals');
  const old=Core.snapshot(run);
  Core.tick(run,5,1,host);Core.plant(run,host);Core.pop(run,host);
  assert.deepEqual(Core.snapshot(run),old);checks++;
  check(Core.restore(old,saved).phase==='won','earned receipt restores');
  campaigns++;
 }
}
let run=Core.newRoom();
Core.plant(run);step(run,23);Core.plant(run);step(run,23);
check(run.bombs.length===2&&!Core.plant(run),'two seed capacity');
check(Core.pop(run)&&run.bombs.length===0,'nearby bombs chain together');
check(run.events.filter(e=>e.type==='pop').length===2,'both chain blasts have feedback');
step(run,18,1);
const checkpoint=Core.snapshot(run),restored=Core.restore(checkpoint,Core.profile());
assert.deepEqual(Core.snapshot(restored),checkpoint);checks++;
step(run,40,-1);step(restored,40,-1);
assert.deepEqual(Core.snapshot(restored),Core.snapshot(run));checks++;
run=Core.newRoom(1);
step(run,141,1);
check(run.phase==='dead'||run.deaths>0,'walking into spikes triggers retry');
step(run,100);
check(run.phase==='ready'&&run.deaths===1&&run.x===Core.rooms[1].start[0],'death recovers at chamber entry');
run=Core.newRoom(4);
check(walk(run,280)&&run.gate,'real pushed box latches the gate');
run=Core.newRoom(2);walk(run,151);launch(run,151);
check(run.broken.length>=2,'explosion destroys actual collision blocks');
run=Core.newRoom(2);
walk(run,110);Core.plant(run);step(run,24);walk(run,136);
check(Core.pop(run)&&run.vx>250&&Math.abs(run.vy)<100,'sideways bomb offset produces a horizontal launch');
check(!Core.plant({...Core.newRoom(),phase:'won'}),'finished room rejects placement');const bad={...Core.snapshot(Core.newRoom()),x:NaN};
check(Core.restore(bad,Core.profile()).phase==='ready','corrupt checkpoint falls back');
check(Core.restore({...bad,index:5},Core.profile()).index===0,'locked rooms are not restored from stray checkpoints');
const merged=Core.mergeProfile({stars:[3],best:[1],sound:false},{stars:[1,2],rewards:{comment:true}});
check(merged.stars[0]===3&&merged.stars[1]===2&&merged.best[0]===1&&!merged.sound&&merged.rewards.comment,'profile merge preserves progress and local settings');
console.log(JSON.stringify({checks,campaigns,scope:'Actual authored-room routes, collision, retries, chain reactions and checkpoint round trips'}));


