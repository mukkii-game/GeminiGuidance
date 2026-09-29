import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const source = fs.readFileSync(new URL('../src/entities/GeminiOrb.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { GeminiOrbManager } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
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
assert(largestStep<13,'capture must reel in smoothly');
assert(Math.abs(c.orbitRadius-75)<1,'capture must settle to controllable radius');
assert(Math.abs(c.orbitAngularVel)>0.06,'held orb must auto-spin without input');
const heldDamage=capture.getEffectiveDamage(c);let releases=0;
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
// Moving the player supplies energy and changes the spear direction.
let movingPeak=0;for(let i=0;i<240;i++){const x=180+110*Math.sin(i/27),y=270+140*Math.cos(i/43);tick(m,x,y);movingPeak=Math.max(movingPeak,Math.hypot(orb.vx,orb.vy));}assert(movingPeak>6);
console.log(JSON.stringify({checks:12,overshootPixels:Math.round(maxBeyond),idleRadiusAfter8Seconds:+lastPeak.toFixed(1),captureMaxStep:+largestStep.toFixed(1),releaseSpeed:+Math.hypot(c.vx,c.vy).toFixed(1),outsideExcursion:+(greatestX-360).toFixed(1),movingPeakSpeed:+movingPeak.toFixed(1)},null,2));
