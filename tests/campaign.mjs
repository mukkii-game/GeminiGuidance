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
 assert.equal(bosses,1);assert(enemies>=22);assert(cues>=3);assert(!manager.hasPendingFormation(first.formationId));
 console.log(`Stage ${stage}: ${enemies} enemies, ${cues} cues, timed boss OK`);
}
const enemies=new EnemyManager();let rush=enemies.spawn('KIMI_MOON',100,-32,'RUSH_DIVE');
for(let t=1;t<=83;t++)enemies.update(360,540,t<60?180:300,450);
assert.equal(rush.targetX,180);assert.equal(rush.vx,0);assert(rush.y>60);
enemies.update(360,540,300,450);assert(Math.abs(Math.hypot(rush.vx,rush.vy)-3.4)<1e-9);
const lock= rush.vx;for(let i=0;i<20;i++)enemies.update(360,540,0,100);assert.equal(rush.vx,lock);
const tackle=enemies.spawnTackleMinion('GPT6_LUNA',180,90,1,2);for(let i=0;i<35;i++)enemies.update(360,540,180,450);assert.equal(tackle.y,90);enemies.update(360,540,180,450);assert.equal(tackle.y,92);
for(const type of ['STAGE1_DEEPSEEK_KIMI','STAGE2_GROK_CURSOR','STAGE3_CLAUDE_FABLE','STAGE4_GPT6_ASTRA']){
 const manager=new BossManager(),boss=manager.spawn(type,360);let actions=0;
 for(let i=0;i<100;i++)manager.update(360,180,450);assert(boss.phase>0);
 boss.timer=259;for(let i=0;i<99;i++)manager.update(360,180,450,()=>actions++,()=>actions++,()=>actions++);assert.equal(actions,0);
 for(let i=0;i<720;i++)manager.update(360,180,450,()=>actions++,()=>actions++,()=>actions++);assert(actions>0);assert(boss.y>boss.targetY-12);
 const hit=manager.hit(1000,boss.x,boss.y);assert(hit.defeated);
}
const blocks=new BreakoutManager();blocks.setupStage2Wall(360);assert.equal(blocks.getActiveCount(),18);assert(blocks.blocks.every(b=>Math.abs(b.x-180)>40));
console.log('Rush lock, visible windup, tackle windup, all boss entrances/recovery/defeat, optional block lane OK');

