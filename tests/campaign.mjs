import ts from 'typescript';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const load = async path => import('data:text/javascript;base64,' + Buffer.from(ts.transpile(fs.readFileSync(path,'utf8'), {module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022})).toString('base64'));
const {StageManager}=await load('src/stages/StageData.ts');
const {EnemyManager}=await load('src/entities/Enemy.ts');
const {BossManager}=await load('src/entities/Boss.ts');
const {BreakoutManager}=await load('src/entities/BreakoutManager.ts');
for(let stage=1;stage<=4;stage++){
 const manager=new StageManager();manager.loadStage(stage);let enemies=0,bosses=0,cues=0,first;
 for(let tick=1;tick<=4000;tick++)for(const event of manager.update()){
  if(event.type==='ENEMY'){enemies++;if(!first){first=event;if(stage===1)assert(manager.hasPendingFormation(event.formationId));}}
  if(event.type==='BOSS'){bosses++;assert.equal(tick,(50+stage*4)*60);}
  if(event.type==='CUE')cues++;
 }
 assert.equal(bosses,1);assert(enemies>=43);assert(cues>=3);assert(!manager.hasPendingFormation(first.formationId));
 console.log(`Stage ${stage}: ${enemies} enemies, ${cues} cues, timed boss OK`);
}
const enemies=new EnemyManager();let rush=enemies.spawn('KIMI_MOON',100,-32,'RUSH_DIVE');
for(let t=1;t<=83;t++)enemies.update(360,540,t<60?180:300,450);
assert.equal(rush.targetX,180);assert.equal(rush.vx,0);assert(rush.y>50);
enemies.update(360,540,300,450);assert(Math.abs(Math.hypot(rush.vx,rush.vy)-2.7)<1e-9);
const lock= rush.vx;for(let i=0;i<20;i++)enemies.update(360,540,0,100);assert.equal(rush.vx,lock);
const tackle=enemies.spawnTackleMinion('GPT6_LUNA',180,90,1,2);for(let i=0;i<35;i++)enemies.update(360,540,180,450);assert.equal(tackle.y,90);enemies.update(360,540,180,450);assert.equal(tackle.y,92);
const light = enemies.spawn('MISTRAL_FLAME', 180, -32, 'STRAIGHT_DOWN');
assert.equal(light.width,55);assert.equal(light.hp,2);
const heavy = enemies.spawn('GPT6_SOL',320,-32,'SPAROID_CRUISE');assert.equal(heavy.hp,10);
const prevY=light.y;enemies.update(360,540,180,450);assert(Math.abs(light.y-prevY-1.05)<1e-9);
for(const type of ['STAGE1_DEEPSEEK_KIMI','STAGE2_GROK_CURSOR','STAGE3_CLAUDE_FABLE','STAGE4_GPT6_ASTRA']){
 const manager=new BossManager(),boss=manager.spawn(type,360);let actions=0;
 for(let i=0;i<100;i++)manager.update(360,180,450);assert(boss.phase>0);
 boss.timer=259;for(let i=0;i<99;i++)manager.update(360,180,450,()=>actions++,()=>actions++,()=>actions++);assert.equal(actions,0);
 for(let i=0;i<720;i++)manager.update(360,180,450,()=>actions++,()=>actions++,()=>actions++);assert(actions>0);assert(boss.y>boss.targetY-12);
 // Wing destruction disables that side, not just decorative weak-point art.
 boss.timer=0;boss.phase=1;
 const wing=boss.weakPoints[0];
 manager.hit(40,boss.x+wing.xOffset,boss.y+wing.yOffset,3);
 assert(!wing.active);
 let launches=0;boss.timer=44;manager.update(360,180,450,undefined,()=>launches++);assert.equal(launches,0);
 boss.timer=154;manager.update(360,180,450,undefined,()=>launches++);assert.equal(launches,1);
 // Hull uses the caller's radius and actual height, not a width-sized circle.
 const x=boss.x+boss.width*.44,y=boss.y+boss.height*.42+10;
 assert(!manager.hit(1,x,y,3).bossHit);assert(manager.hit(1,x,y,12).bossHit);
 const hit=manager.hit(1000,boss.x,boss.y);assert(hit.defeated);
}
const blocks=new BreakoutManager();blocks.setupStage2Wall(360);assert.equal(blocks.getActiveCount(),8);assert.equal(blocks.blocks.filter(block => block.reflector).length,3);
console.log('Rush lock, visible windup, tackle windup, all boss entrances/recovery/defeat, breakout bank and rails OK');


// Precision plus timing beats damage sponging: open weak point is 2x damage.
const timingBoss=new BossManager();const tb=timingBoss.spawn('STAGE1_DEEPSEEK_KIMI',360);tb.phase=1;tb.y=75;tb.timer=110;
let before=tb.hp;timingBoss.hit(4,tb.x+tb.weakPoints[0].xOffset,tb.y,3);assert.equal(before-tb.hp,6);
tb.timer=280;before=tb.hp;timingBoss.hit(4,tb.x+tb.weakPoints[0].xOffset,tb.y,3);assert.equal(before-tb.hp,8);
console.log('Larger slower hulls, stronger bosses, radius accuracy, wing suppression, timed weak-point damage OK');

