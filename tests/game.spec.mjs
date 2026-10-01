import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('gemini_bgm_enabled', 'false');
    localStorage.setItem('gemini_se_enabled', 'false');
  });
  // Instantiate the real game without RAF; advance fixed ticks deterministically.
  await page.route('**/src/main.ts*', route => route.fulfill({ contentType: 'text/javascript', body: '' }));
  await page.goto('/');
  await page.evaluate(async () => {
    const { Game } = await import('/src/core/Game.ts');
    window.game = new Game(document.getElementById('game-canvas'));
    window.game.render();
  });
});

test('keyboard start, held capture/release, deliberate walls and focus pause', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.keyboard.press('1');
  expect(await page.evaluate(() => { game.update(); return game.state; })).toBe('PLAYING');
  await page.keyboard.down('z');
  expect(await page.evaluate(() => { for(let i=0;i<120;i++) game.update(); return game.geminiManager.orbs[0].isTethered; })).toBe(true);
  await page.keyboard.up('z');
  expect(await page.evaluate(() => { game.update(); const orb=game.geminiManager.orbs[0]; return !orb.isTethered && Math.hypot(orb.vx,orb.vy)>9; })).toBe(true);
  await page.keyboard.press('q');
  expect(await page.evaluate(() => { game.update(); return game.geminiManager.screenEdgeBounce; })).toBe(true);
  expect(await page.evaluate(() => {
    window.dispatchEvent(new Event('blur')); const t=game.stageTick; game.update();
    return game.paused && game.stageTick===t && !game.input.isTetherHeld();
  })).toBe(true);
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => { game.update(); return game.paused; })).toBe(false);
  expect(errors).toEqual([]);
});

test('all four real timelines reach bosses and collision-driven clears reach the ending', async ({ page }) => {
  const report = await page.evaluate(() => {
    game.startNewGame(1);
    const stages=[];
    for(let stage=1;stage<=4;stage++) {
      // This is a progression regression, not a claim of human play difficulty.
      for(let tick=0;tick<4100 && !game.bossManager.currentBoss;tick++) {
        game.player.state.invulnerableTimer=2;
        game.input.state.x=180+105*Math.sin(tick/37);
        game.input.state.y=310+120*Math.sin(tick/67);
        game.update();
      }
      const boss=game.bossManager.currentBoss;
      if(!boss) throw Error('Boss never appeared stage '+stage);
      stages.push({stage, tick:game.stageManager.stageTick, enemies:game.enemyManager.enemies.length});
      for(let t=0;t<100;t++) {game.player.state.invulnerableTimer=2;game.update();}
      for(let t=0;t<1800 && game.state==='PLAYING';t++) {
        game.player.state.invulnerableTimer=2;
        game.update();
        const orb=game.geminiManager.orbs[0];
        orb.x=boss.x;orb.y=boss.y;orb.vx=8;orb.vy=0;orb.isCharged=true;
        game.handleCollisions();
        orb.x=350;orb.y=500;game.handleCollisions();
      }
      if(game.state!=='STAGE_CLEAR') throw Error('Boss collision did not clear stage '+stage);
      for(let t=0;t<151;t++) game.update();
    }
    for(let i=0;i<150;i++)game.update();
    game.render();
    return {stages,state:game.state,score:game.player.state.score,orbs:game.geminiManager.orbs.length};
  });
  expect(report.state).toBe('GAME_CLEAR');
  expect(report.stages).toHaveLength(4);
  expect(report.orbs).toBeLessThanOrEqual(2);
  await page.locator('canvas').screenshot({ path: 'test-results/ending.png' });
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => {game.update(); return game.state;})).toBe('TITLE');
});

test('reflective enemies work in default mode and pickups cap at two', async ({ page }) => {
  const result=await page.evaluate(() => {
    game.startNewGame(); game.enemyManager.clear();
    const orb=game.geminiManager.orbs[0];orb.x=180;orb.y=235;orb.vx=0;orb.vy=-8;
    game.enemyManager.spawn('QWEN_CUBE',180,200,'DUMMY',undefined,20);
    game.handleCollisions();const reflected=orb.vy>0;
    for(let i=0;i<5;i++) {game.spawnGeminiDropItem(game.player.state.x,game.player.state.y);game.handleCollisions();}
    return {reflected,count:game.geminiManager.orbs.length};
  });
  expect(result).toEqual({reflected:true,count:2});
});

test('title, gameplay and lab render without runtime errors', async ({ page }) => {
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.evaluate(async () => {await document.fonts.ready;game.render();});
  await page.locator('canvas').screenshot({path:'test-results/title.png'});
  await page.evaluate(() => {
    game.startNewGame();
    for(let i=0;i<980;i++){game.player.state.invulnerableTimer=2;game.input.state.x=180+85*Math.sin(i/33);game.update();}
    game.render();
  });
  await page.locator('canvas').screenshot({path:'test-results/gameplay.png'});
  await page.evaluate(() => {game.enterTestStage();for(let i=0;i<60;i++)game.update();game.render();});
  await page.locator('canvas').screenshot({path:'test-results/lab.png'});
  expect(errors).toEqual([]);
});

test('touch steering, capture finger handoff and cancel do not jump or stick', async ({ page }) => {
  const result=await page.evaluate(() => {
    game.startNewGame();
    const canvas=document.querySelector('canvas'),rect=canvas.getBoundingClientRect();
    const touch=(identifier,x,y)=>new Touch({identifier,target:canvas,clientX:rect.left+x*rect.width/360,clientY:rect.top+y*rect.height/540});
    const send=(type,touches)=>canvas.dispatchEvent(new TouchEvent(type,{touches,targetTouches:touches,changedTouches:touches,bubbles:true,cancelable:true}));
    send('touchstart',[touch(1,100,300)]);
    send('touchmove',[touch(1,120,300)]);
    const moved=game.input.state.x;
    send('touchstart',[touch(1,120,300),touch(2,318,468)]);
    const captured=game.input.isTetherHeld();
    send('touchend',[touch(2,318,468)]);
    send('touchmove',[touch(2,300,450)]);
    const noJump=game.input.state.x===moved;
    send('touchcancel',[]);
    return {moved,captured,noJump,released:!game.input.isTetherHeld()};
  });
  expect(result.moved).toBeCloseTo(200);
  expect(result.captured && result.noJump && result.released).toBe(true);
});

test('boss camping causes one hit per pass and staggered waves cannot pay early', async ({ page }) => {
  const result=await page.evaluate(() => {
    game.startNewGame();
    const boss=game.bossManager.spawn('STAGE1_DEEPSEEK_KIMI',360);
    boss.y=90;boss.phase=1;
    const orb=game.geminiManager.orbs[0];orb.x=180;orb.y=90;orb.vx=8;orb.vy=0;
    game.handleCollisions();const once=boss.hp;
    for(let i=0;i<60;i++){boss.hitCooldown=0;game.handleCollisions();}
    const camp=boss.hp;
    orb.y=400;game.handleCollisions();orb.y=90;game.handleCollisions();const again=boss.hp;
    game.bossManager.clear();
    game.stageManager.stageTick=240;
    game.enemyManager.spawn('MISTRAL_FLAME',180,90,'DUMMY','s1_wave1');
    game.handleCollisions();
    return {once,camp,again,items:game.geminiItems.length};
  });
  expect(result.once).toBe(result.camp);
  expect(result.again).toBeLessThan(result.once);
  expect(result.items).toBe(0);
});

test('normal-damage guidance and aimed throwing pilots can both finish the campaign', async ({ page }) => {
  const runs=await page.evaluate(() => {
    let seed=42;Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
    const runs=[];
    for(const throwing of [true,false]) {
      game.startNewGame();let frame=0,releasedAt=-100;const checkpoints=[];let previousState=game.state,seenBossStage=0;
      while(frame<60*60*12 && !['GAME_OVER','GAME_CLEAR'].includes(game.state)) {
        const boss=game.bossManager.currentBoss;
        if(boss && game.stage!==seenBossStage) {
          seenBossStage=game.stage;
          checkpoints.push({event:'boss',stage:game.stage,seconds:Math.round(frame/60),hp:game.player.state.hp,lives:game.player.state.lives,bossHp:boss.hp});
        }
        game.input.state.x=180+(throwing?95:110)*Math.sin(frame/(throwing?47:37));
        game.input.state.y=boss ? (throwing?225+35*Math.sin(frame/63):280+100*Math.sin(frame/22)) : 285+110*Math.sin(frame/63);
        game.input.state.isPointerDown=throwing && frame-releasedAt>75;
        if(game.input.state.isPointerDown) {
          const orb=game.geminiManager.orbs[0],dx=(boss?.x??180)-orb.x,dy=(boss?.y??80)-orb.y;
          const dot=(dx*orb.vx+dy*orb.vy)/(Math.hypot(dx,dy)*Math.hypot(orb.vx,orb.vy));
          if(orb.isTethered && dot>.985) {game.input.state.isPointerDown=false;releasedAt=frame;}
        }
        if(!throwing) {
          // Choose a nearby steering direction from visible hazards, without
          // modifying actors. A wide stroke is useful only if the ship survives it.
          const p=game.player.state,goal={x:game.input.state.x,y:game.input.state.y};
          const threats=[...game.enemyManager.enemies.map(e=>({x:e.x,y:e.y,vx:e.vx,vy:e.vy,r:e.width*.45+18})),
            ...game.enemyBullets.map(e=>({x:e.x,y:e.y,vx:e.vx,vy:e.vy,r:24}))];
          let best=null;
          for(let i=-1;i<16;i++) {
            const angle=i<0?Math.atan2(goal.y-p.y,goal.x-p.x):i*Math.PI/8;
            const vx=Math.cos(angle)*7,vy=Math.sin(angle)*7;
            const x=Math.max(20,Math.min(340,p.x+vx*9)),y=Math.max(45,Math.min(505,p.y+vy*9));
            let cost=Math.hypot(x-goal.x,y-goal.y)*.2;
            for(const t of threats)for(const step of [3,6,9]) {
              const px=p.x+(x-p.x)*step/9,py=p.y+(y-p.y)*step/9;
              const distance=Math.hypot(px-t.x-t.vx*step,py-t.y-t.vy*step);
              cost+=Math.max(0,t.r+12-distance)**2*4;
            }
            if(boss&&!boss.defeated)for(const step of [3,6,9]) {
              const px=p.x+(x-p.x)*step/9,py=p.y+(y-p.y)*step/9;
              if(Math.abs(px-boss.x)<boss.width*.32+16&&Math.abs(py-boss.y)<boss.height*.30+20)cost+=100000;
            }
            if(!best||cost<best.cost)best={x,y,cost};
          }
          game.input.state.x=best.x;game.input.state.y=best.y;
        }
        // Actual inputs and unmodified lives, enemy HP, collisions, pickups, and damage.
        game.update();frame++;
        if(game.state!==previousState && ['STAGE_CLEAR','GAME_OVER'].includes(game.state)) {
          checkpoints.push({event:game.state,stage:game.stage,seconds:Math.round(frame/60),hp:game.player.state.hp,lives:game.player.state.lives,bossHp:game.bossManager.currentBoss?.hp});
        }
        previousState=game.state;
      }
      runs.push({checkpoints,throwing,state:game.state,seconds:Math.round(frame/60),lives:game.player.state.lives,stage:game.stage,hp:game.player.state.hp,bossHp:game.bossManager.currentBoss?.hp});
    }
    return runs;
  });
  console.log('Pilot diagnostics:',JSON.stringify(runs));
  expect(runs.map(run=>run.state)).toEqual(['GAME_CLEAR','GAME_CLEAR']);
  expect(runs.every(run=>run.lives>0)).toBe(true);
  expect(runs.every(run=>run.checkpoints.filter(event=>event.event==='STAGE_CLEAR').length===4)).toBe(true);
});
