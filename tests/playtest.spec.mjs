import { test, expect } from '@playwright/test';
test.beforeEach(async ({page})=>{
 await page.addInitScript(()=>{localStorage.setItem('gemini_bgm_enabled','false');localStorage.setItem('gemini_se_enabled','false');});
 await page.route('**/src/main.ts*',r=>r.fulfill({contentType:'text/javascript',body:''}));
 await page.goto('/');
 await page.evaluate(async()=>{const {Game}=await import('/src/core/Game.ts');window.game=new Game(document.querySelector('canvas'));game.startNewGame();});
});
test('rested sphere reflects, boss hits sound, and the rear pocket chains in real physics',async({page})=>{
 const result=await page.evaluate(()=>{
  game.enemyManager.clear();
  const orb=game.geminiManager.orbs[0];
  Object.assign(orb,{x:180,y:230,vx:0,vy:-1,restRatio:1});
  const enemy=game.enemyManager.spawn('MISTRAL_FLAME',180,200,'DUMMY',undefined,20);
  game.handleCollisions();const passiveBounce=orb.vy>0,passiveDamage=enemy.maxHp-enemy.hp;
  game.enemyManager.clear();let sounds=0;game.audio.playBossHit=()=>sounds++;
  const boss=game.bossManager.spawn('STAGE1_DEEPSEEK_KIMI',360);boss.phase=1;boss.y=90;
  Object.assign(orb,{x:180,y:90,vx:9,vy:0,restRatio:0});game.handleCollisions();
  game.bossManager.clear();game.stage=2;game.breakoutManager.setupStage2Wall(360);
  Object.assign(orb,{x:90,y:99,vx:5,vy:-10,restRatio:0});
  let hits=0;game.audio.playBlockHit=()=>hits++;game.audio.playBlockBreak=()=>hits++;
  for(let t=0;t<100;t++){
   game.geminiManager.update(180,420,0,0);game.handleCollisions();
  }
  const remaining=game.breakoutManager.blocks.filter(b=>!b.reflector).reduce((sum,b)=>sum+Math.max(0,b.hp),0);
  return {passiveBounce,passiveDamage,sounds,hits,remaining};
 });
 console.log('Playtest mechanics:',result);
 expect(result.passiveBounce).toBe(true);expect(result.passiveDamage).toBe(1);expect(result.sounds).toBe(1);
 expect(result.hits).toBeGreaterThanOrEqual(5);expect(result.remaining).toBeLessThan(80);
});
test('large boss, thick blocks and resting orb render on mobile',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>{
  game.stage=2;game.breakoutManager.setupStage2Wall(360);
  game.enemyManager.spawn('GROK_RAIDER',100,300,'DUMMY');
  game.enemyManager.spawn('COPILOT_GLIDER',260,330,'DUMMY');
  const orb=game.geminiManager.orbs[0];Object.assign(orb,{x:180,y:420,vx:0,vy:0,restRatio:1});game.render();
 });
 await page.locator('canvas').screenshot({path:'test-results/playtest-pocket-mobile.png'});
 await page.evaluate(()=>{game.breakoutManager.clear();const b=game.bossManager.spawn('STAGE4_GPT6_ASTRA',360);b.y=110;b.phase=1;b.timer=280;game.render();});
 await page.locator('canvas').screenshot({path:'test-results/playtest-boss-mobile.png'});
 await page.evaluate(()=>{
  const boss=game.bossManager.currentBoss;boss.phase=1;boss.timer=0;boss.y=boss.targetY;
  game.enemyBullets=[];
  for(let i=0;i<150;i++){
    game.bossManager.update(360,180,440,(x,y,vx,vy,r)=>game.spawnBullet(x,y,vx,vy,r));
    game.updateEnemyBullets();
  }
  game.render();
 });
 await page.locator('canvas').screenshot({path:'test-results/boss-safe-lane-mobile.png'});
 await page.evaluate(()=>{game.bossManager.currentBoss.phase=0;game.bossManager.currentBoss.timer=40;game.render();});
 await page.locator('canvas').screenshot({path:'test-results/boss-intro-mobile.png'});
 await page.evaluate(()=>{
  game.bossManager.clear();game.enemyManager.clear();game.enemyManager.spawnInvaderGrid(360);
  for(let i=0;i<130;i++)game.enemyManager.update(360,540,180,450);
  game.encounter={kind:'wave',title:'MISTRAL / KIMI / QWEN',wave:2,subtitle:'INVADER WALL',timer:130,duration:180};game.render();
 });
 await page.locator('canvas').screenshot({path:'test-results/invader-mobile.png'});
 await page.evaluate(()=>{
  game.enemyManager.clear();game.encounter=undefined;game.player.state.x=180;game.player.state.y=430;
  const orb=game.geminiManager.orbs[0];Object.assign(orb,{x:230,y:430,isTethered:true,mode:'ORBIT',restRatio:0});
  for(let row=0;row<5;row++)for(let col=0;col<11;col++)game.spawnBullet(30+col*30,260+row*23,0,1.35);
  game.render();
 });
 await page.locator('canvas').screenshot({path:'test-results/guard-curtain-mobile.png'});
});
test('capture is zero damage, repels enemies and bosses, and protects against curtains',async({page})=>{
 const r=await page.evaluate(()=>{
  game.enemyManager.clear();game.player.state.x=180;game.player.state.y=400;
  const orb=game.geminiManager.orbs[0];Object.assign(orb,{x:180,y:350,vx:6,vy:0,mode:'ORBIT',isTethered:true});
  const e=game.enemyManager.spawn('MISTRAL_FLAME',180,330,'DUMMY');const enemyHp=e.hp;
  for(let n=0;n<40;n++) {e.hitCooldown=0;game.handleCollisions();}
  const enemy={hp:e.hp,initial:enemyHp,push:e.knockbackVy};
  game.enemyManager.clear();const boss=game.bossManager.spawn('STAGE1_DEEPSEEK_KIMI',360);boss.phase=1;boss.x=180;boss.y=310;
  const bossHp=boss.hp;game.handleCollisions();const beforeY=boss.y;
  game.bossManager.update(360,180,400);const bossPush=beforeY-boss.y;
  game.bossManager.clear();
  // A bullet on Gemini disappears; another at the opposite side survives until the body sweeps there.
  orb.x=230;orb.y=400;orb.orbitAngle=0;orb.orbitAngularVel=.22;
  game.spawnBullet(230,400,0,0);game.spawnBullet(130,400,0,0);
  game.handleCollisions();const afterContact=game.enemyBullets.length;
  for(let tick=0;tick<18;tick++){
    game.geminiManager.update(180,400,0,0,undefined,undefined,true);
    game.handleCollisions();
  }
  return {enemy,bossHp,bossAfter:boss.hp,bossPush,afterContact,bullets:game.enemyBullets.length};
 });
 expect(r.enemy.hp).toBe(r.enemy.initial);expect(r.enemy.push).toBeLessThan(0);
 expect(r.bossAfter).toBe(r.bossHp);expect(r.bossPush).toBeGreaterThan(10);expect(r.afterContact).toBe(1);expect(r.bullets).toBe(0);
});
test('a free thrust rattles across boss armor points, while camping cannot drill',async({page})=>{
 const r=await page.evaluate(()=>{
  game.enemyManager.clear();const boss=game.bossManager.spawn('STAGE4_GPT6_ASTRA',360);boss.phase=1;boss.x=180;boss.y=150;
  const orb=game.geminiManager.orbs[0];Object.assign(orb,{x:30,y:150,vx:10,vy:0,restRatio:0});
  let sounds=0;game.audio.playBossHit=()=>sounds++;
  for(let x=45;x<=315;x+=9){orb.x=x;game.stageTick++;game.handleCollisions();}
  const hp=boss.hp,hits=sounds;
  for(let i=0;i<60;i++){game.stageTick++;game.handleCollisions();}
  return {hits,hp,after:boss.hp};
 });
 expect(r.hits).toBeGreaterThanOrEqual(4);expect(r.hits).toBeLessThanOrEqual(5);expect(r.after).toBe(r.hp);
});
