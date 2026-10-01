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
});
