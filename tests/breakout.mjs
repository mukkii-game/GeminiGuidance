import ts from 'typescript';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const load = async path => import('data:text/javascript;base64,' + Buffer.from(ts.transpile(fs.readFileSync(path,'utf8'), {module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022})).toString('base64'));
const {BreakoutManager}=await load('src/entities/BreakoutManager.ts');
const manager=new BreakoutManager();manager.setupStage2Wall(360);
const orb={id:'test',x:96,y:178,vx:0,vy:-10,radius:14,damage:3};
const front=manager.checkGeminiCollision(orb,14,3);
assert(front.hit && !front.broken);assert.equal(front.block.hp,10);
manager.clear();manager.setupStage2Wall(360);
Object.assign(orb,{x:96,y:121,vy:10});
const rear=manager.checkGeminiCollision(orb,14,3);
assert(rear.rear);assert.equal(rear.block.hp,3);
assert(!manager.checkGeminiCollision(orb,14,3).hit,'overlapping contact cannot damage every frame');
// Real-sized sphere repeatedly traverses the narrow back pocket, no screen-wall option.
manager.clear();manager.setupStage2Wall(360);
Object.assign(orb,{x:90,y:99,vx:5,vy:-10});
let hits=0,backHits=0;
for(let i=0;i<90;i++){
 orb.x+=orb.vx;orb.y+=orb.vy;
 const r=manager.checkGeminiCollision(orb,14,3);
 if(!r.hit)continue;
 hits++;if(r.rear)backHits++;
 const dot=orb.vx*r.normalX+orb.vy*r.normalY;
 orb.vx-=2*dot*r.normalX;orb.vy-=2*dot*r.normalY;
 orb.x=r.hitX+r.normalX*15.5;orb.y=r.hitY+r.normalY*15.5;
}
assert(hits>=5 && backHits>=3,`pocket contacts ${hits}, rear ${backHits}`);
console.log('Breakout: thick front armor, triple rear damage, contact gating and repeated pocket reflections OK', {hits,backHits});
