import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const source = fs.readFileSync(new URL('../src/entities/GeminiOrb.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { GeminiOrbManager, getOrbEffectiveRadius } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
const tick = (m, x=180, y=270, held=false, vx=0, vy=0, release) => m.update(x,y,vx,vy,undefined,undefined,held,release);
const m = new GeminiOrbManager(); const orb = m.spawn(180,90,0,0);
let crossed=false, maxBeyond=0, firstPeak=0, lastPeak=0;
for(let i=0;i<600;i++) { tick(m); if(orb.y>270) crossed=true; maxBeyond=Math.max(maxBeyond,orb.y-270); if(i<120)firstPeak=Math.max(firstPeak,orb.orbitRadius); if(i>480)lastPeak=Math.max(lastPeak,orb.orbitRadius); }
assert(crossed, 'free pursuit must pass through the player');
assert(maxBeyond>90 && maxBeyond<180, 'thrust must overshoot substantially without energy gain');
assert(lastPeak<20, 'idle player must damp the orbit, not sustain a comet loop');
const capture = new GeminiOrbManager(); const c = capture.spawn(180,40,0,0);
let largestStep=0;
for(let i=0;i<180;i++){const x=c.x,y=c.y;tick(capture,180,270,true); largestStep=Math.max(largestStep,Math.hypot(c.x-x,c.y-y));}
assert(largestStep<20,'capture must reel in smoothly at double angular speed');
assert(Math.abs(c.orbitRadius-50)<1,'capture must settle to controllable radius');
assert(Math.abs(c.orbitAngularVel)>=0.219,'held orb must auto-spin at the new defensive speed');
const heldDamage=capture.getEffectiveDamage(c);assert.equal(heldDamage,0,'captured orbit is defense, never contact damage');let releases=0;
tick(capture,180,270,false,0,0,()=>releases++);
assert(releases===1);assert(Math.hypot(c.vx,c.vy)>9,'release must be an energetic throw');
assert(capture.getEffectiveDamage(c)>heldDamage,'throw must beat orbit damage');
tick(capture); assert(releases===1);
const twin = new GeminiOrbManager(); twin.spawn(180,200,0,0);twin.spawn(180,200,0,0);
for(let i=0;i<180;i++) tick(twin);assert(twin.orbs.length===2,'crossing twins must not auto-fuse');
// Repeated recapture must preserve opposite handedness, even after free paths converge.
let px=180,py=270;
for(let i=0;i<1200;i++) {
  const nx=Math.max(16,Math.min(344,px+8.4*Math.sin(i*.087)));
  const ny=Math.max(40,Math.min(516,py+8.4*Math.cos(i*.071)));
  tick(twin,nx,ny,i%180<80,nx-px,ny-py);px=nx;py=ny;
  if(i%180<80) assert(twin.orbs[0].orbitAngularVel*twin.orbs[1].orbitAngularVel<0,'twins must spin in opposite directions after every capture');
}
const edge = new GeminiOrbManager();const e=edge.spawn(350,270,12,0);tick(edge);assert(e.x>350 && e.vx>0,'free mode must not bounce at screen edge');
let greatestX=e.x;for(let i=0;i<180;i++){tick(edge,335,270);greatestX=Math.max(greatestX,e.x);}assert(greatestX<435,'free excursion stays modest');
const bounce = new GeminiOrbManager();bounce.screenEdgeBounce=true;const b=bounce.spawn(350,270,12,0);tick(bounce);assert(b.vx<0 && b.x<=346,'Q enables deliberate wall reflection');
// Near residence has a crossing grace period, then fades in 0.4s regardless of speed.
const restManager = new GeminiOrbManager(); const resting = restManager.spawn(180,270,0,0);
const fullRadius = restManager.getEffectiveRadius(resting);
for(let i=0;i<18;i++) tick(restManager);
assert.equal(resting.restRatio,0,'a brief close pass must keep its attack energy');
tick(restManager);
assert(resting.restRatio > 0 && resting.restRatio < 0.05, 'rest size must fade rather than pop');
assert(restManager.getEffectiveRadius(resting) < fullRadius && restManager.getEffectiveRadius(resting) > fullRadius * 0.95);
for(let i=0;i<10;i++) tick(restManager);
assert(!restManager.isPassiveOrb(resting), 'the settling transition keeps its advertised timing');
tick(restManager);
assert(restManager.isPassiveOrb(resting),'near residence must become passive after half a second');
for(let i=0;i<12;i++) tick(restManager);
assert.equal(resting.restRatio,1);
assert.equal(resting.isCharged,false);
assert.equal(resting.chargeRatio,0,'settled orb must have no flame energy');
assert.equal(restManager.getEffectiveRadius(resting),7);
for(const level of [1,2,3]) {
  resting.level=level;
  assert.equal(restManager.getEffectiveDamage(resting),1,'settled free orbs always deal only one damage');
  assert.equal(getOrbEffectiveRadius(resting),restManager.getEffectiveRadius(resting),'renderer and collision share one radius');
  resting.isTethered=true;
  assert.equal(restManager.getEffectiveDamage(resting),0,'captured orbs deal zero damage at every level');
  assert(restManager.getEffectiveRadius(resting)<=18,'even upgraded capture cannot become a huge hitbox');
  resting.isTethered=false;
}
// Replay a fast nearby loop: high local speed must no longer defeat inactivity.
const loopManager = new GeminiOrbManager(); const looping = loopManager.spawn(240,270,0,8);
for(let i=0;i<50;i++) {
  const angle=i*0.14;
  looping.x=180+60*Math.cos(angle); looping.y=270+60*Math.sin(angle);
  looping.vx=-8.4*Math.sin(angle); looping.vy=8.4*Math.cos(angle);
  tick(loopManager);
}
assert(Math.hypot(looping.vx,looping.vy)>7,'fixture must remain a genuinely fast nearby circle');
assert.equal(looping.restRatio,1,'speed alone must not restore a nearby looping orb');
assert(loopManager.isPassiveOrb(looping));
assert.equal(loopManager.getEffectiveDamage(looping),1);
assert.equal(looping.isCharged,false);
// A small reposition keeps it passive, but capture/release creates a fresh attack.
looping.x=290;looping.y=270;looping.vx=0;looping.vy=0;tick(loopManager);
assert(loopManager.isPassiveOrb(looping),'small excursions must not immediately re-arm rest');
tick(loopManager,180,270,true);tick(loopManager,180,270,false);
assert.equal(looping.restRatio,0,'releasing a captured orb must restore throw power');
assert(loopManager.getEffectiveDamage(looping)>1);

// Repositioning the ship wakes a dormant orb and builds a strong spear through it.
resting.level=1; tick(restManager,180,450);
assert.equal(resting.restRatio,0,'large deliberate separation immediately re-arms the orb');
let strongClosePass=false;
for(let i=0;i<90;i++) {
  tick(restManager,180,450);
  if(Math.hypot(resting.x-180,resting.y-450)<20 && Math.hypot(resting.vx,resting.vy)>4) {
    assert(!restManager.isPassiveOrb(resting),'fast player pass must never be misclassified as rest');
    assert(restManager.getEffectiveDamage(resting)>=3);
    strongClosePass=true;
  }
}
assert(strongClosePass,'waking a settled orb must produce an actual fast player crossing');
resting.level=3; resting.isCharged=true; resting.restRatio=0;
assert(getOrbEffectiveRadius(resting)<25,'maximum charged hitbox stays below 25px radius');

// Identical free twins separate gradually while their center follows a single-orb path.
const spaced = new GeminiOrbManager();
const sa=spaced.spawn(180,270,0,0), sb=spaced.spawn(180,270,0,0);
tick(spaced);
assert(Math.hypot(sa.x-180,sa.y-270)<=0.751,'separation correction is bounded to 0.75px per orb');
assert(Math.hypot(sb.x-180,sb.y-270)<=0.751);
assert(Math.hypot(sa.vx,sa.vy)<=0.081,'separation impulse cannot create explosive speed');
assert(Math.hypot(sa.x-sb.x,sa.y-sb.y)>0,'exactly coincident stationary twins must separate');
for(let i=0;i<1200;i++)tick(spaced);
assert.equal(sa.restRatio,1); assert.equal(sb.restRatio,1);
assert(Math.hypot(sa.x-sb.x,sa.y-sb.y)>=getOrbEffectiveRadius(sa)+getOrbEffectiveRadius(sb), 'resting twin bodies must not overlap');
const following=new GeminiOrbManager(), reference=new GeminiOrbManager();
const fa=following.spawn(180,90,0,0),fb=following.spawn(180,90,0,0), ref=reference.spawn(180,90,0,0);
let largestCenterError=0;
for(let i=0;i<1800;i++) {
  const x=180+100*Math.sin(i/70),y=270+130*Math.sin(i/103);
  tick(following,x,y); tick(reference,x,y);
  const distance=Math.hypot(fa.x-fb.x,fa.y-fb.y);
  if(i>120)assert(distance>14,'twins must not collapse onto the same long-running free path');
  assert(Math.hypot(fa.vx,fa.vy)<12 && Math.hypot(fb.vx,fb.vy)<12);
  largestCenterError=Math.max(largestCenterError,Math.hypot((fa.x+fb.x)/2-ref.x,(fa.y+fb.y)/2-ref.y));
}
assert(largestCenterError<1,'soft spacing must preserve the shared player-directed aim');
const pocket=new GeminiOrbManager();pocket.screenEdgeBounce=true;
const pa=pocket.spawn(14,24,0,0),pb=pocket.spawn(14,24,0,0);
for(let i=0;i<600;i++) {
  const old=pocket.orbs.map(o=>({x:o.x,y:o.y}));tick(pocket,16,40);
  pocket.orbs.forEach((o,index)=>{
    assert(o.x>=14 && o.x<=346 && o.y>=24 && o.y<=516,'Q wall spacing stays inside bounds');
    assert(Math.hypot(o.x-old[index].x,o.y-old[index].y)<13,'wall pocket spacing must not teleport');
    assert(Math.hypot(o.vx,o.vy)<12,'wall pocket must not accumulate unbounded impulse');
  });
}
assert(Math.hypot(pa.x-pb.x,pa.y-pb.y)>10,'a narrow corner must still resolve coincident twins');

// Moving the player supplies energy and changes the spear direction.
let movingPeak=0;for(let i=0;i<240;i++){const x=180+110*Math.sin(i/27),y=270+140*Math.cos(i/43);tick(m,x,y);movingPeak=Math.max(movingPeak,Math.hypot(orb.vx,orb.vy));}assert(movingPeak>6);
console.log(JSON.stringify({settledRadius:7,overshootPixels:Math.round(maxBeyond),idleRadiusAfter8Seconds:+lastPeak.toFixed(1),captureMaxStep:+largestStep.toFixed(1),releaseSpeed:+Math.hypot(c.vx,c.vy).toFixed(1),outsideExcursion:+(greatestX-360).toFixed(1),movingPeakSpeed:+movingPeak.toFixed(1)},null,2));
