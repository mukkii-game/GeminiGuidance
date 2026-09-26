import {
  GameState,
  ParticleEffect,
  ExplosionEffect,
  FloatingText,
  GeminiDropItem,
  EnemyBullet,
  PhysicsPresetId,
  EnemyType,
  MovementPattern,
  TestEnemySetup,
} from '../types';
import { Player } from '../entities/Player';
import { GeminiOrbManager, PRESET_ORDER } from '../entities/GeminiOrb';
import { EnemyManager } from '../entities/Enemy';
import { GroundTargetManager } from '../entities/GroundTarget';
import { BossManager } from '../entities/Boss';
import { BreakoutManager } from '../entities/BreakoutManager';
import { StageManager } from '../stages/StageData';
import { TerrainEngine } from '../graphics/Terrain';
import { SpriteSheet } from '../graphics/Sprites';
import { ArcadeRenderer } from '../graphics/Renderer';
import { SoundEngine } from './Audio';
import { InputManager } from './Input';
import { VoiceManager } from './Voice';

export class Game {
  public state: GameState = 'TITLE';
  public stage: number = 1;
  public stageTick: number = 0;

  private canvas: HTMLCanvasElement;
  private input: InputManager;
  private audio: SoundEngine;
  private voice: VoiceManager;
  private sprites: SpriteSheet;
  private terrain: TerrainEngine;
  private renderer: ArcadeRenderer;

  private player: Player;
  private geminiManager: GeminiOrbManager;
  private enemyManager: EnemyManager;
  private groundManager: GroundTargetManager;
  private bossManager: BossManager;
  private breakoutManager: BreakoutManager;
  private stageManager: StageManager;

  private stage1InvadersSpawned: boolean = false;
  private stage1BossTriggered: boolean = false;

  private geminiItems: GeminiDropItem[] = [];
  private enemyBullets: EnemyBullet[] = [];
  private particles: ParticleEffect[] = [];
  private explosions: ExplosionEffect[] = [];
  private floatingTexts: FloatingText[] = [];

  private itemCounter: number = 0;
  private bulletCounter: number = 0;
  private elonIntroTimer: number = 0;
  private stageClearTimer: number = 0;
  private playerRespawnTimer: number = 0;
  private testDummyRespawnQueue: Array<{
    type: EnemyType;
    x: number;
    y: number;
    pattern: MovementPattern;
    timer: number;
    collisionType: 'PENETRATE' | 'REFLECT';
    mass: number;
  }> = [];
  public testEnemySetup: TestEnemySetup = 'SWARM_PENETRATE';
  public testBossCollisionMode: 'PENETRATE' | 'REFLECT' = 'PENETRATE';
  private testSwarmRespawnCooldown: number = 0;
  private testBossTotalDamage: number = 0;
  private savedNormalState: {
    stage: number;
    score: number;
    lives: number;
    shield: number;
  } | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.input = new InputManager(canvas);
    this.audio = new SoundEngine();
    this.voice = new VoiceManager();
    this.sprites = new SpriteSheet();
    this.terrain = new TerrainEngine(canvas.width, canvas.height);
    this.renderer = new ArcadeRenderer(canvas, this.sprites, this.terrain);

    this.player = new Player(canvas.width / 2, canvas.height - 90);
    this.geminiManager = new GeminiOrbManager();
    this.enemyManager = new EnemyManager();
    this.groundManager = new GroundTargetManager();
    this.bossManager = new BossManager();
    this.breakoutManager = new BreakoutManager();
    this.stageManager = new StageManager();

    this.setupAudioAndCrtControls();
  }

  public toggleBgm(): boolean {
    this.audio.resume();
    const on = this.audio.toggleBgm();
    this.updateAudioButtonsUi();
    this.addFloatingText(this.player.state.x, this.player.state.y - 30, on ? '🎵 BGM: ON' : '🎵 BGM: OFF', on ? '#38bdf8' : '#ef4444');
    return on;
  }

  public toggleSe(): boolean {
    this.audio.resume();
    const on = this.audio.toggleSe();
    this.updateAudioButtonsUi();
    this.addFloatingText(this.player.state.x, this.player.state.y - 30, on ? '🔊 効果音: ON' : '🔊 効果音: OFF', on ? '#fde047' : '#ef4444');
    return on;
  }

  public toggleAllAudio(): boolean {
    this.audio.resume();
    const on = this.audio.toggle();
    this.updateAudioButtonsUi();
    this.addFloatingText(
      this.player.state.x,
      this.player.state.y - 30,
      on ? '🔊 サウンド全解除 (ON)' : '🔇 サウンド全消音 (OFF)',
      on ? '#22c55e' : '#ef4444'
    );
    return on;
  }

  public toggleOrbitWithFeedback(): boolean {
    const res = this.geminiManager.toggleOrbit(this.player.state.x, this.player.state.y);
    this.audio.playGeminiBounce();
    if (res.isOrbit) {
      const tier = res.tier || 'MEDIUM';
      const r = Math.round(res.radius || 90);
      let tierLabel = '';
      let tierColor = '#38bdf8';
      if (tier === 'SHORT') {
        tierLabel = `⚡分銅【近距離バリア】(R=${r}px)`;
        tierColor = '#38bdf8';
      } else if (tier === 'MEDIUM') {
        tierLabel = `⚡分銅【中距離スイング】(R=${r}px)`;
        tierColor = '#facc15';
      } else {
        tierLabel = `⚡分銅【巨大ハンマー】(R=${r}px)`;
        tierColor = '#ef4444';
      }
      this.addFloatingText(this.player.state.x, this.player.state.y - 30, tierLabel, tierColor);
    } else {
      this.addFloatingText(
        this.player.state.x,
        this.player.state.y - 30,
        '🚀攻撃①: ヨーヨー突撃 (慣性往復)',
        '#fde047'
      );
    }
    return res.isOrbit;
  }

  private updateAudioButtonsUi(): void {
    const btnBgm = document.getElementById('btn-bgm');
    const btnSe = document.getElementById('btn-se');
    const btnAll = document.getElementById('btn-all-audio') || document.getElementById('btn-audio');

    const bgmOn = this.audio.isBgmEnabled();
    const seOn = this.audio.isSeEnabled();

    if (btnBgm) {
      btnBgm.textContent = bgmOn ? '🎵 BGM: ON' : '🎵 BGM: OFF';
      btnBgm.style.borderColor = bgmOn ? '#38bdf8' : '#ef4444';
      btnBgm.style.color = bgmOn ? '#9cb3cc' : '#ef4444';
    }
    if (btnSe) {
      btnSe.textContent = seOn ? '🔊 SE: ON' : '🔊 SE: OFF';
      btnSe.style.borderColor = seOn ? '#fde047' : '#ef4444';
      btnSe.style.color = seOn ? '#9cb3cc' : '#ef4444';
    }
    if (btnAll) {
      const anyOn = bgmOn || seOn;
      btnAll.textContent = anyOn ? '🔇 全消音' : '🔈 全解除';
      btnAll.style.borderColor = anyOn ? '#2b4058' : '#22c55e';
      btnAll.style.color = anyOn ? '#9cb3cc' : '#22c55e';
    }
  }

  private setupAudioAndCrtControls(): void {
    const btnBgm = document.getElementById('btn-bgm');
    if (btnBgm) {
      btnBgm.addEventListener('click', () => {
        this.toggleBgm();
      });
    }

    const btnSe = document.getElementById('btn-se');
    if (btnSe) {
      btnSe.addEventListener('click', () => {
        this.toggleSe();
      });
    }

    const btnAll = document.getElementById('btn-all-audio') || document.getElementById('btn-audio');
    if (btnAll) {
      btnAll.addEventListener('click', () => {
        this.toggleAllAudio();
      });
    }

    this.updateAudioButtonsUi();
  }

  public start(): void {
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min(50, currentTime - lastTime);
      lastTime = currentTime;

      this.update(dt / 16.666);
      this.render();

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  private startNewGame(stageNum: number = 1): void {
    this.audio.resume();
    this.audio.playStartFanfare();

    this.stage = Math.max(1, Math.min(4, stageNum));
    this.stageTick = 0;
    this.state = 'PLAYING';
    this.player.reset(this.canvas.width / 2, this.canvas.height - 90);
    this.player.state.score = 0;
    this.player.state.lives = 3;

    this.geminiManager.clear();
    this.enemyManager.clear();
    this.groundManager.clear();
    this.bossManager.clear();
    this.breakoutManager.clear();
    this.geminiItems = [];
    this.enemyBullets = [];
    this.particles = [];
    this.explosions = [];
    this.floatingTexts = [];
    this.stage1InvadersSpawned = false;
    this.stage1BossTriggered = false;

    this.terrain.setStage(this.stage);
    this.stageManager.loadStage(this.stage);
    this.audio.playStageBgm(this.stage);

    // Initial starter Gemini orb
    this.geminiManager.spawn(this.player.state.x, this.player.state.y - 70);

    // Stage voice & intro
    if (this.stage === 2) {
      this.elonIntroTimer = 220;
      setTimeout(() => {
        this.voice.playElonIntro();
      }, 400);
    } else {
      this.elonIntroTimer = 0;
      this.voice.playStageTitle(this.stage);
    }
  }

  private advanceStage(): void {
    this.stage++;
    if (this.stage > 4) {
      this.state = 'GAME_CLEAR';
      this.audio.stopBgm();
      return;
    }

    this.state = 'PLAYING';
    this.stageTick = 0;
    this.stageClearTimer = 0;
    this.enemyManager.clear();
    this.groundManager.clear();
    this.bossManager.clear();
    this.breakoutManager.clear();
    this.geminiItems = [];
    this.enemyBullets = [];
    this.stage1InvadersSpawned = false;
    this.stage1BossTriggered = false;

    this.terrain.setStage(this.stage);
    this.stageManager.loadStage(this.stage);
    this.audio.playStageBgm(this.stage);
    this.player.repair(100); // Fully restore player shield/hull on stage transition!

    // Keep active orbs as power progression
    if (this.geminiManager.orbs.length === 0) {
      this.geminiManager.spawn(this.player.state.x, this.player.state.y - 70);
    }

    // Stage 2 special: Emperor Elon polygon intro
    if (this.stage === 2) {
      this.elonIntroTimer = 220;
      setTimeout(() => {
        this.voice.playElonIntro();
      }, 400);
    } else {
      this.elonIntroTimer = 0;
      this.voice.playStageTitle(this.stage);
    }
  }

  private updateTitleScreen(dtFactor: number): void {
    // Slowly scroll background terrain for vibrant arcade ambiance
    this.terrain.update(dtFactor * 0.5);

    // 1. Hotkeys on Title Screen
    if (this.input.consumeTestStageToggle()) {
      this.enterTestStage();
      return;
    }

    const presetChoice = this.input.consumePresetSelect();
    if (presetChoice) {
      if (presetChoice === 'SNAP_SLING') {
        this.startNewGame(1);
        return;
      } else if (presetChoice === 'HYPER_BOOMERANG') {
        this.startNewGame(2);
        return;
      } else if (presetChoice === 'GIGANTIC_SPRING') {
        this.startNewGame(3);
        return;
      } else if (presetChoice === 'HEAVY_WRECKER') {
        this.startNewGame(4);
        return;
      } else if (presetChoice === 'RAPID_ORBIT') {
        this.enterTestStage();
        return;
      }
    }

    if (this.input.consumeEnter() || this.input.consumeOrbitToggle()) {
      this.startNewGame(1);
      return;
    }

    // 2. Click / Tap Stage Select
    const click = this.input.consumeClick();
    if (click) {
      const x = click.x;
      const y = click.y;
      const btnX = 16;
      const btnW = this.canvas.width - 32;

      if (x >= btnX && x <= btnX + btnW) {
        if (y >= 134 && y <= 160) {
          this.startNewGame(1);
          return;
        } else if (y >= 164 && y <= 190) {
          this.startNewGame(2);
          return;
        } else if (y >= 194 && y <= 220) {
          this.startNewGame(3);
          return;
        } else if (y >= 224 && y <= 250) {
          this.startNewGame(4);
          return;
        } else if (y >= 254 && y <= 284) {
          this.enterTestStage();
          return;
        }
      }

      // 3. Audio Toggles on Title Screen (y: 394 to 420)
      if (y >= 394 && y <= 420) {
        if (x >= 24 && x <= 172) {
          this.toggleBgm();
          return;
        }
        if (x >= 188 && x <= 336) {
          this.toggleSe();
          return;
        }
      }
      if (y > 420 && y <= 436) {
        this.toggleAllAudio();
        return;
      }

      // If clicked in start prompt area (y: 288 to 310)
      if (y >= 288 && y <= 310) {
        this.startNewGame(1);
        return;
      }
    }
  }

  public update(dtFactor: number = 1.0): void {
    this.stageTick++;

    // Consume UI hotkeys
    if (this.input.consumeCrtToggle()) {
      const container = document.getElementById('game-container');
      const btnCrt = document.getElementById('btn-crt');
      if (container && btnCrt) {
        container.classList.toggle('crt-off');
        const isOff = container.classList.contains('crt-off');
        btnCrt.textContent = isOff ? 'CRT: OFF' : 'CRT: ON';
      }
    }
    if (this.input.consumeBgmToggle()) {
      this.toggleBgm();
    }
    if (this.input.consumeSeToggle()) {
      this.toggleSe();
    }
    if (this.input.consumeAudioToggle()) {
      this.toggleAllAudio();
    }

    // Handle Title Screen
    if (this.state === 'TITLE') {
      this.updateTitleScreen(dtFactor);
      return;
    }

    // Handle Game Over & Game Clear Screen (Click or Enter returns to Title)
    if (this.state === 'GAME_OVER' || this.state === 'GAME_CLEAR') {
      const click = this.input.consumeClick();
      const enter = this.input.consumeEnter();
      if (click || enter) {
        this.state = 'TITLE';
        this.audio.stopBgm();
      }
      return;
    }

    // Handle Lab / Test Stage toggle hotkey (KeyT)
    if (this.input.consumeTestStageToggle()) {
      if (this.state === 'TEST_STAGE') {
        this.exitTestStage();
      } else {
        this.enterTestStage();
      }
      return;
    }

    // Handle Orbit / Sling Mode toggle hotkey (Space / KeyZ / KeyO / Right-Click)
    if (this.input.consumeOrbitToggle()) {
      this.toggleOrbitWithFeedback();
    }

    // Handle Collision Mode toggle hotkey (KeyX)
    if (this.input.consumeCollisionToggle()) {
      const colMode = this.geminiManager.toggleCollisionMode();
      this.audio.playGeminiBounce();
      this.addFloatingText(
        this.player.state.x,
        this.player.state.y - 30,
        colMode === 'PENETRATE' ? '⚔️ 属性: 貫通 (すり抜け多段削り)' : '🛡️ 属性: 反射 (跳ね返りピンボール)',
        colMode === 'PENETRATE' ? '#22c55e' : '#f97316'
      );
    }

    // Handle Preset Selection (KeyP, Digit1-5)
    const presetChoice = this.input.consumePresetSelect();
    if (presetChoice) {
      if (presetChoice === 'CYCLE') {
        const p = this.geminiManager.cyclePreset();
        this.addFloatingText(this.player.state.x, this.player.state.y - 30, `MODE: ${p.nameJa}`, '#fde047');
        this.audio.playGeminiBounce();
      } else {
        const p = this.geminiManager.setPreset(presetChoice as PhysicsPresetId);
        this.addFloatingText(this.player.state.x, this.player.state.y - 30, `MODE: ${p.nameJa}`, '#fde047');
        this.audio.playGeminiBounce();
      }
    }

    // Handle Level Up hotkey (KeyL)
    if (this.input.consumeLevelUp()) {
      for (const orb of this.geminiManager.orbs) {
        this.geminiManager.levelUpOrb(orb);
      }
      this.audio.playGeminiLevelUp();
      this.addFloatingText(this.player.state.x, this.player.state.y - 30, 'GEMINI LEVEL UP!', '#ec4899');
    }

    // Handle Click/Touch on HUD Buttons or Field Toggle
    const click = this.input.consumeClick();
    if (click) {
      const handled = this.handlePointerClick(click.x, click.y);
      if (!handled && this.state !== 'STAGE_CLEAR') {
        this.toggleOrbitWithFeedback();
      }
    }

    // Test Stage Update Dispatch
    if (this.state === 'TEST_STAGE') {
      this.updateTestStage(dtFactor);
      return;
    }

    if (this.state === 'STAGE_CLEAR') {
      this.stageClearTimer++;
      this.terrain.update(dtFactor * 1.5);
      this.player.update(this.canvas.width / 2, this.player.state.y - 1.5);
      this.geminiManager.update(this.player.state.x, this.player.state.y);
      this.updateEffects();
      if (this.stageClearTimer > 150) {
        this.advanceStage();
      }
      return;
    }

    // --- PLAYING STATE ---
    this.terrain.update(dtFactor);

    // Stage 2 Elon intro countdown
    if (this.elonIntroTimer > 0) {
      this.elonIntroTimer--;
    }

    // Keyboard support
    this.input.updateKeyboardMovement();

    // Touch leash clamp: keeps target within 85px of ship so direction reversals are instantaneous
    if (this.input.state.isTouch) {
      const maxLeash = 85;
      const ldx = this.input.state.x - this.player.state.x;
      const ldy = this.input.state.y - this.player.state.y;
      const ldist = Math.hypot(ldx, ldy);
      if (ldist > maxLeash) {
        this.input.state.x = this.player.state.x + (ldx / ldist) * maxLeash;
        this.input.state.y = this.player.state.y + (ldy / ldist) * maxLeash;
      }
    }

    // Player Update
    this.player.update(this.input.state.x, this.input.state.y);

    // Respawn handling if player was hit
    if (!this.player.state.alive) {
      this.playerRespawnTimer++;
      if (this.playerRespawnTimer > 75) {
        this.playerRespawnTimer = 0;
        if (this.player.state.lives > 0) {
          this.player.reset(this.canvas.width / 2, this.canvas.height - 90);
          if (this.geminiManager.orbs.length === 0) {
            this.geminiManager.spawn(this.player.state.x, this.player.state.y - 70);
          }
        } else {
          this.state = 'GAME_OVER';
          this.audio.stopBgm();
          return;
        }
      }
    }

    // Update Gemini Orbs (ジェミニ誘導 & 合体 - 分銅旋回)
    this.geminiManager.update(
      this.player.state.x,
      this.player.state.y,
      this.player.state.vx,
      this.player.state.vy,
      (level, x, y) => {
        // Fusion Callback
        this.audio.playGeminiMerge(level);
        this.addExplosion(x, y, 24 * level, false);
        this.addFloatingText(x, y - 20, level === 3 ? 'MEGA FUSION! Lv.3' : 'FUSION! Lv.2', '#ec4899');
        this.player.addScore(level === 3 ? 5000 : 2000);
      }
    );

    // Update Stage Timeline & Spawning
    this.handleStageTimeline();

    // Update Enemies & Enemy Projectiles
    this.enemyManager.update(
      this.canvas.width,
      this.canvas.height,
      this.player.state.x,
      this.player.state.y,
      (bx, by, bvx, bvy) => this.spawnBullet(bx, by, bvx, bvy)
    );

    // Update Boss
    if (this.bossManager.currentBoss) {
      this.bossManager.update(
        this.canvas.width,
        this.player.state.x,
        this.player.state.y,
        (bx, by, bvx, bvy) => this.spawnBullet(bx, by, bvx, bvy),
        (type, mx, my, mvx, mvy) => {
          // Boss launches minion targeting player for high-speed body tackle!
          this.enemyManager.spawnTackleMinion(type, mx, my, mvx, mvy);
          this.addFloatingText(mx, my - 12, 'TACKLE!', '#ef4444');
        },
        () => {
          // Grok launches SpaceX Starship fleet from bottom!
          this.enemyManager.spawn('SPACEX_ROCKET', 70, this.canvas.height + 60, 'ROCKET_ASCENT');
          this.enemyManager.spawn('SPACEX_ROCKET', 180, this.canvas.height + 90, 'ROCKET_ASCENT');
          this.enemyManager.spawn('SPACEX_ROCKET', 290, this.canvas.height + 60, 'ROCKET_ASCENT');
          this.addFloatingText(this.canvas.width / 2, 240, 'SPACEX STARSHIPS LAUNCHED!', '#ef4444');
        },
        (quote) => {
          this.voice.speak(quote);
        }
      );
    }

    // Update Floating Gemini Drop Items
    this.updateGeminiItems();

    // Update Enemy Bullets
    this.updateEnemyBullets();

    // Update Ground Targets scroll
    this.groundManager.update(this.terrain.getScrollY(), 0, 0);

    // Collision Detections (Gemini Orbital Kinetic Defense)
    this.handleCollisions();

    // Effects Update
    this.updateEffects();
  }

  private spawnBullet(x: number, y: number, vx: number, vy: number): void {
    this.enemyBullets.push({
      id: `bullet_${++this.bulletCounter}`,
      x,
      y,
      vx,
      vy,
      radius: 4.5,
      age: 0,
    });
    this.audio.playEnemyBulletFire();
  }

  private spawnGeminiDropItem(x: number, y: number): void {
    this.geminiItems.push({
      id: `item_${++this.itemCounter}`,
      x,
      y,
      vx: (Math.random() - 0.5) * 0.4,
      vy: 0.48, // Slowly drifts down
      timer: 0,
      size: 16,
    });
  }

  private updateGeminiItems(): void {
    for (let i = this.geminiItems.length - 1; i >= 0; i--) {
      const it = this.geminiItems[i];
      it.timer++;
      it.y += it.vy;
      it.x += it.vx + Math.sin(it.timer * 0.05) * 0.45;

      // Keep within bounds
      if (it.x < 20) it.x = 20;
      if (it.x > this.canvas.width - 20) it.x = this.canvas.width - 20;

      // Despawn if fallen below screen
      if (it.y > this.canvas.height + 30) {
        this.geminiItems.splice(i, 1);
      }
    }
  }

  private updateEnemyBullets(): void {
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const b = this.enemyBullets[i];
      b.age++;
      b.x += b.vx;
      b.y += b.vy;

      // Despawn offscreen
      if (b.x < -20 || b.x > this.canvas.width + 20 || b.y < -20 || b.y > this.canvas.height + 20) {
        this.enemyBullets.splice(i, 1);
      }
    }
  }

  // --- Stage Events & Spawning ---
  private handleStageTimeline(): void {
    const events = this.stageManager.update();
    const scrollY = this.terrain.getScrollY();

    for (const ev of events) {
      if (ev.type === 'ENEMY' && ev.enemyType) {
        this.enemyManager.spawn(ev.enemyType, ev.x ?? 180, ev.y ?? -20, ev.pattern, ev.formationId);
      } else if (ev.type === 'GROUND' && ev.groundType) {
        const targetWorldY = -scrollY - 40;
        this.groundManager.spawn(ev.groundType, ev.x ?? 180, targetWorldY);
      } else if (ev.type === 'INVADER_GRID') {
        this.enemyManager.spawnInvaderGrid(this.canvas.width);
        this.stage1InvadersSpawned = true;
        this.addFloatingText(this.canvas.width / 2, 160, 'SPACE INVADERS DETECTED!', '#38bdf8');
      } else if (ev.type === 'UFO') {
        this.enemyManager.spawnDeepSeekUfo(this.canvas.width, Math.random() > 0.5);
        this.addFloatingText(this.canvas.width / 2, 45, 'DEEPSEEK UFO DETECTED!', '#4D6BFE');
      } else if (ev.type === 'BREAKOUT_WALL') {
        this.breakoutManager.setupStage2Wall(this.canvas.width);
        this.addFloatingText(this.canvas.width / 2, 110, 'BLOCK BREAKER! PUNCH THROUGH!', '#fde047');
      } else if (ev.type === 'ALERT') {
        this.audio.playBossAlert();
        this.audio.playBossBgm(this.stage);
        this.addFloatingText(this.canvas.width / 2, 140, 'WARNING: BOSS APPROACHING', '#ef4444');
      } else if (ev.type === 'BOSS' && ev.bossType) {
        this.bossManager.spawn(ev.bossType, this.canvas.width);
        this.voice.playBossVoice(this.stage);
      }
    }

    // Auto-trigger Stage 1 Boss as soon as all Space Invaders are eliminated!
    if (this.stage === 1 && this.stage1InvadersSpawned && !this.stage1BossTriggered) {
      const activeInvaders = this.enemyManager.enemies.filter(e => e.pattern === 'INVADER');
      if (activeInvaders.length === 0) {
        this.stage1BossTriggered = true;
        this.audio.playBossAlert();
        this.audio.playBossBgm(1); // High octane rock battle theme!
        this.bossManager.spawn('STAGE1_DEEPSEEK_KIMI', this.canvas.width);
        this.voice.playBossVoice(1);
        this.addFloatingText(this.canvas.width / 2, 140, 'INVADERS WIPED! BOSS ATTACK', '#ef4444');
      }
    }
  }

  // --- Collision Detections ---
  private handleCollisions(): void {
    // 0. Breakout Blocks Collision (Stage 2 & Test Stage)
    if ((this.stage === 2 || this.state === 'TEST_STAGE') && this.breakoutManager.blocks.length > 0) {
      for (const orb of this.geminiManager.orbs) {
        const res = this.breakoutManager.checkGeminiCollision(orb);
        if (res.hit && res.block) {
          // Elastic reflection off Breakout Block!
          if (orb.mode === 'SLING') {
            const dot = orb.vx * res.normalX + orb.vy * res.normalY;
            if (dot < 0) {
              orb.vx -= 1.95 * dot * res.normalX;
              orb.vy -= 1.95 * dot * res.normalY;
              orb.x = res.hitX + res.normalX * (orb.radius + 1.5);
              orb.y = res.hitY + res.normalY * (orb.radius + 1.5);
            }
          }

          if (res.broken) {
            this.audio.playBlockBreak();
            this.addExplosion(res.hitX, res.hitY, 14, false);
            this.player.addScore(res.points);
            this.addFloatingText(res.hitX, res.hitY - 10, `+${res.points}`, '#fde047');
            if (Math.random() < 0.15) {
              this.spawnGeminiDropItem(res.hitX, res.hitY);
            }
          } else {
            this.audio.playBlockHit();
            this.addExplosion(res.hitX, res.hitY, 8, false);
          }
        }
      }
    }

    // 1. Gemini Orbs vs Enemy Bullets (たまはジェミニでけせる！ジェミニは止まらない！)
    for (const orb of this.geminiManager.orbs) {
      const orbRadius = this.geminiManager.getEffectiveRadius(orb);
      for (let bi = this.enemyBullets.length - 1; bi >= 0; bi--) {
        const b = this.enemyBullets[bi];
        const dist = Math.hypot(orb.x - b.x, orb.y - b.y);

        if (dist < orbRadius + b.radius) {
          // Bullet erased instantly!
          this.enemyBullets.splice(bi, 1);
          this.audio.playBulletErased();
          this.addExplosion(b.x, b.y, 8, false);
          this.player.addScore(50);
        }
      }
    }

    // 2. Gemini Orbs vs Airborne Enemies (貫通 vs 反射・作用反作用ノックバック)
    for (const orb of this.geminiManager.orbs) {
      const orbRadius = this.geminiManager.getEffectiveRadius(orb);
      const effectiveDmg = this.geminiManager.getEffectiveDamage(orb);

      for (let i = this.enemyManager.enemies.length - 1; i >= 0; i--) {
        const e = this.enemyManager.enemies[i];
        const dist = Math.hypot(orb.x - e.x, orb.y - e.y);

        if (dist < orbRadius + e.width * 0.45) {
          if (e.hitCooldown && e.hitCooldown > 0) {
            continue;
          }

          // Determine reflection vs penetration:
          // In ORBIT mode: NEVER penetrates enemies (always reflects/rebounds upon hitting enemies)!
          // In SLING mode: penetrates if collisionMode is PENETRATE (or enemy is PENETRATE)!
          let isReflect = false;
          if (orb.mode === 'ORBIT') {
            isReflect = true;
          } else if (this.geminiManager.collisionMode === 'REFLECT') {
            isReflect = true;
          } else if (this.geminiManager.collisionMode === 'PENETRATE') {
            isReflect = false;
          } else {
            isReflect = e.collisionType === 'REFLECT';
          }

          // Damage application
          e.hp -= effectiveDmg;
          e.hitCooldown = isReflect ? 7 : 4; // Faster 4-frame tick for penetrating!

          if (isReflect) {
            const nx = (orb.x - e.x) / (dist || 1);
            const ny = (orb.y - e.y) / (dist || 1);

            // Elastic reflection for both SLING and ORBIT (Hammerfight)
            const dot = orb.vx * nx + orb.vy * ny;
            if (dot < 0) {
              orb.vx -= 1.85 * dot * nx;
              orb.vy -= 1.85 * dot * ny;
              orb.x = e.x + nx * (orbRadius + e.width * 0.46);
              orb.y = e.y + ny * (orbRadius + e.width * 0.46);
            }
            if (orb.mode === 'ORBIT') {
              orb.orbitAngularVel = -orb.orbitAngularVel * 0.85;
            }

            // Knockback on enemy (if mass < 100)
            if ((e.mass || 2) < 100) {
              const kFactor = Math.min(1.4, 1.4 / (e.mass || 2));
              const speed = Math.hypot(orb.vx, orb.vy);
              e.knockbackVx = -nx * (Math.max(1.4, speed * 0.65) * kFactor);
              e.knockbackVy = -ny * (Math.max(1.4, speed * 0.65) * kFactor);
            }

            if (e.hp > 0) {
              this.audio.playGeminiBounce();
              this.addExplosion(e.x, e.y, orb.isCharged ? 20 : 14, false);
              this.player.addScore(50 * effectiveDmg);
              if (orb.mode === 'ORBIT') {
                if (orb.spinLevel === 2) {
                  this.renderer.triggerShake(12, 6);
                  this.addFloatingText(e.x, e.y - 14, `🔥室伏剛撃!! -${effectiveDmg}`, '#ff3b00');
                } else if (orb.spinLevel === 1) {
                  this.renderer.triggerShake(6, 3);
                  this.addFloatingText(e.x, e.y - 14, `⚡遠心剛撃! -${effectiveDmg}`, '#fde047');
                } else {
                  this.addFloatingText(e.x, e.y - 14, `🛡️分銅打撃 -${effectiveDmg}`, '#38bdf8');
                }
              } else if (orb.isCharged) {
                this.addFloatingText(e.x, e.y - 14, `🔥大突撃BOUNCE! -${effectiveDmg}`, '#ff3b00');
              } else {
                this.addFloatingText(e.x, e.y - 14, `BOUNCE! -${effectiveDmg}`, '#f97316');
              }
            }
          } else {
            // PENETRATE: Gemini DOES NOT BOUNCE! Passes straight through enemy!
            if (e.hp > 0) {
              this.audio.playAirExplosion();
              this.addExplosion(e.x, e.y, orb.isCharged ? 22 : 14, false);
              this.player.addScore(50 * effectiveDmg);
              if (orb.isCharged) {
                this.addFloatingText(e.x, e.y - 14, `🔥大突撃HIT! -${effectiveDmg}`, '#ff3b00');
              } else if (orb.isHoveringApex) {
                this.addFloatingText(e.x, e.y - 14, `★APEX SHRED!! -${effectiveDmg}`, '#fde047');
              } else {
                this.addFloatingText(e.x, e.y - 14, `貫通HIT! -${effectiveDmg}`, '#38bdf8');
              }
            }
          }

          // Charged Mode 1 thrust knockback on any enemy (if mass < 100)
          if (orb.isCharged && (e.mass || 2) < 100) {
            const pDx = e.x - this.player.state.x;
            const pDy = e.y - this.player.state.y;
            const pDist = Math.hypot(pDx, pDy) || 1;
            const kPower = Math.min(2.4, 2.4 / (e.mass || 1.0));
            e.knockbackVx = ((pDx / pDist) * 3.8 + orb.vx * 0.25) * kPower;
            e.knockbackVy = Math.min(-3.6, ((pDy / pDist) * 3.8 + orb.vy * 0.25) * kPower);
          }

          if (e.hp <= 0) {
            // ENEMY DESTROYED
            this.audio.playAirExplosion();
            this.addExplosion(e.x, e.y, 18 + orb.level * 4, false);

            const mult = orb.level === 3 ? 4 : orb.level === 2 ? 2 : 1;
            const pointsEarned = e.points * mult;
            this.player.addScore(pointsEarned);
            this.addFloatingText(e.x, e.y - 12, `+${pointsEarned}`, mult > 1 ? '#ec4899' : '#ffffff');

            const formationId = e.formationId;
            const deadX = e.x;
            const deadY = e.y;
            const deadType = e.type;
            const deadPattern = e.pattern;
            const deadCollision = e.collisionType || 'PENETRATE';
            const deadMass = e.mass || 1.0;
            this.enemyManager.enemies.splice(i, 1);

            // In TEST_STAGE, queue respawn of the destroyed dummy with 500 HP!
            if (this.state === 'TEST_STAGE') {
              this.testDummyRespawnQueue.push({
                type: deadType,
                x: deadX,
                y: deadY,
                pattern: (deadPattern as MovementPattern) || 'DUMMY',
                timer: 75,
                collisionType: deadCollision,
                mass: deadMass,
              });
            }

            // Check if formation is completely wiped out
            if (formationId) {
              const remainingInFormation = this.enemyManager.enemies.some(en => en.formationId === formationId);
              if (!remainingInFormation) {
                this.spawnGeminiDropItem(deadX, deadY);
                this.player.repair(20);
                this.addFloatingText(deadX, deadY - 24, 'FORMATION WIPE! +20 SHIELD', '#22c55e');
                this.player.addScore(1500);
              }
            }
          }
        }
      }

      // 3. Gemini Orbs vs Boss (貫通 vs 反射)
      if (this.bossManager.currentBoss) {
        const b = this.bossManager.currentBoss;
        if (!b.hitCooldown || b.hitCooldown <= 0) {
          const bdx = orb.x - b.x;
          const bdy = orb.y - b.y;
          const bdist = Math.hypot(bdx, bdy) || 1;
          const bossHitRadius = Math.max(b.width, b.height) * 0.48 + orbRadius;

          if (bdist < bossHitRadius) {
            const isBossReflect = (orb.mode === 'ORBIT') || ((this.state === 'TEST_STAGE')
              ? (this.testBossCollisionMode === 'REFLECT' || this.geminiManager.collisionMode === 'REFLECT')
              : (this.geminiManager.collisionMode === 'REFLECT'));

            const res = this.bossManager.hit(effectiveDmg, orb.x, orb.y);
            if (res.bossHit) {
              b.hitCooldown = isBossReflect ? 8 : 4;
              this.player.addScore(res.points);

              if (isBossReflect) {
                this.audio.playGeminiBounce();
                this.addExplosion(orb.x, orb.y, 22, false);
                if (orb.mode === 'ORBIT') {
                  if (orb.spinLevel === 2) {
                    this.renderer.triggerShake(14, 7);
                    this.addFloatingText(orb.x, orb.y - 16, `🔥室伏剛撃!! -${effectiveDmg}`, '#ff3b00');
                  } else if (orb.spinLevel === 1) {
                    this.renderer.triggerShake(7, 3.5);
                    this.addFloatingText(orb.x, orb.y - 16, `⚡遠心剛撃! -${effectiveDmg}`, '#fde047');
                  } else {
                    this.addFloatingText(orb.x, orb.y - 16, `🛡️分銅打撃 -${effectiveDmg}`, '#38bdf8');
                  }
                } else {
                  this.addFloatingText(orb.x, orb.y - 16, `BOUNCE! -${effectiveDmg}`, '#f97316');
                }

                // Elastic reflection off boss body for both SLING and ORBIT (Hammerfight)
                const bnx = bdx / bdist;
                const bny = bdy / bdist;
                const dot = orb.vx * bnx + orb.vy * bny;
                if (dot < 0) {
                  orb.vx -= 1.85 * dot * bnx;
                  orb.vy -= 1.85 * dot * bny;
                  orb.x = b.x + bnx * (b.width * 0.45 + orbRadius + 2);
                  orb.y = b.y + bny * (b.height * 0.45 + orbRadius + 2);
                }
                if (orb.mode === 'ORBIT') {
                  orb.orbitAngularVel = -orb.orbitAngularVel * 0.85;
                }
              } else {
                // Boss Penetration: NO bounce! Glides or hovers inside!
                this.addExplosion(orb.x, orb.y, orb.isCharged ? 24 : 16, false);
                if (orb.isCharged) {
                  this.addFloatingText(b.x, b.y - 20, `🔥火の玉大突撃!! -${effectiveDmg}`, '#ff3b00');
                } else if (orb.isHoveringApex) {
                  this.addFloatingText(b.x, b.y - 20, `★APEX SHRED!! -${effectiveDmg * 2}`, '#fde047');
                } else {
                  this.addFloatingText(b.x, b.y - 20, `貫通HIT! -${effectiveDmg}`, '#38bdf8');
                }
              }

              if (this.state === 'TEST_STAGE') {
                this.testBossTotalDamage += effectiveDmg;
                if (b.hp < 10000) {
                  b.hp = 99999;
                  b.defeated = false;
                }
                continue;
              }

            if (res.defeated) {
              // Boss Defeat Chain
              for (let k = 0; k < 12; k++) {
                setTimeout(() => {
                  const rx = this.bossManager.currentBoss ? this.bossManager.currentBoss.x + (Math.random() - 0.5) * 120 : 180;
                  const ry = this.bossManager.currentBoss ? this.bossManager.currentBoss.y + (Math.random() - 0.5) * 80 : 120;
                  this.addExplosion(rx, ry, 36, false);
                  this.audio.playAirExplosion();
                }, k * 120);
              }
              this.player.addScore(15000);
              this.addFloatingText(this.canvas.width / 2, 160, 'BOSS DESTROYED!', '#22c55e');

              setTimeout(() => {
                this.state = 'STAGE_CLEAR';
                this.stageClearTimer = 0;
                this.audio.playStageClear();
              }, 1600);
            }
          }
        }
      }
    }
  }

    // 4. Player Ship vs Gemini Drop Items (自機で取ればもう一個のジェミニ追加＆シールド修復！)
    if (this.player.state.alive) {
      for (let i = this.geminiItems.length - 1; i >= 0; i--) {
        const it = this.geminiItems[i];
        const dist = Math.hypot(this.player.state.x - it.x, this.player.state.y - it.y);

        if (dist < 22 + it.size) {
          // Player collected item: SPAWN NEW GEMINI ORB & REPAIR SHIELD!
          this.geminiManager.spawn(it.x, it.y);
          this.player.repair(15);
          this.audio.playItemCollect();
          this.addFloatingText(it.x, it.y - 18, '+1 GEMINI! +15 SHIELD', '#38bdf8');
          this.player.addScore(2000);
          this.geminiItems.splice(i, 1);
        }
      }
    }

    // 5. Existing Gemini Orbs vs Gemini Drop Items (持ってるジェミニに当てれば強化＆シールド修復！)
    for (let i = this.geminiItems.length - 1; i >= 0; i--) {
      const it = this.geminiItems[i];
      let struck = false;

      for (const orb of this.geminiManager.orbs) {
        const dist = Math.hypot(orb.x - it.x, orb.y - it.y);
        if (dist < orb.radius + it.size) {
          // Gemini orb struck item: LEVEL UP THAT ORB & REPAIR!
          this.geminiManager.levelUpOrb(orb);
          this.player.repair(15);
          this.audio.playGeminiLevelUp();
          this.addExplosion(orb.x, orb.y, 28, false);
          this.addFloatingText(orb.x, orb.y - 22, `POWER UP! Lv.${orb.level} (+15 SHIELD)`, '#ec4899');
          this.player.addScore(3000);
          struck = true;
          break;
        }
      }

      if (struck) {
        this.geminiItems.splice(i, 1);
      }
    }

    // 6. Player Ship vs White Enemy Bullets (ダメージ制: 即死＆巻き戻し撤廃！)
    if (this.player.state.alive && this.player.state.invulnerableTimer <= 0) {
      for (let bi = this.enemyBullets.length - 1; bi >= 0; bi--) {
        const b = this.enemyBullets[bi];
        const dist = Math.hypot(this.player.state.x - b.x, this.player.state.y - b.y);

        if (dist < 10 + b.radius) {
          this.enemyBullets.splice(bi, 1);
          const res = this.player.takeDamage(20);
          if (res.damaged) {
            this.renderer.triggerShake(7, 3.5);
            if (res.destroyed) {
              this.audio.playPlayerDeath();
              this.addExplosion(this.player.state.x, this.player.state.y, 40, false);
              this.playerRespawnTimer = 0;
            } else if (res.restored) {
              this.audio.playPlayerEmergency();
              this.renderer.triggerShake(14, 7);
              this.addExplosion(this.player.state.x, this.player.state.y, 44, false);
              this.addFloatingText(this.player.state.x, this.player.state.y - 30, 'EMERGENCY REPAIR! RESTORED', '#38bdf8');
              this.enemyBullets = this.enemyBullets.filter(
                eb => Math.hypot(eb.x - this.player.state.x, eb.y - this.player.state.y) > 120
              );
            } else {
              this.audio.playPlayerDamage();
              this.addExplosion(this.player.state.x, this.player.state.y, 14, false);
              this.addFloatingText(this.player.state.x, this.player.state.y - 18, '-20 SHIELD', '#ef4444');
            }
            break;
          }
        }
      }
    }

    // 7. Player Ship vs Airborne Enemies (ダメージ制: 衝突してもHP減少のみでそのまま戦線維持！)
    if (this.player.state.alive && this.player.state.invulnerableTimer <= 0) {
      for (const e of this.enemyManager.enemies) {
        const dist = Math.hypot(this.player.state.x - e.x, this.player.state.y - e.y);
        if (dist < 12 + e.width * 0.35) {
          const dmg = (e.pattern === 'TACKLE_DASH' || e.pattern === 'ROCKET_ASCENT') ? 35 : 25;
          const res = this.player.takeDamage(dmg);
          if (res.damaged) {
            this.renderer.triggerShake(9, 4.5);
            if (res.destroyed) {
              this.audio.playPlayerDeath();
              this.addExplosion(this.player.state.x, this.player.state.y, 40, false);
              this.playerRespawnTimer = 0;
            } else if (res.restored) {
              this.audio.playPlayerEmergency();
              this.renderer.triggerShake(14, 7);
              this.addExplosion(this.player.state.x, this.player.state.y, 44, false);
              this.addFloatingText(this.player.state.x, this.player.state.y - 30, 'EMERGENCY REPAIR! RESTORED', '#38bdf8');
              this.enemyBullets = this.enemyBullets.filter(
                eb => Math.hypot(eb.x - this.player.state.x, eb.y - this.player.state.y) > 120
              );
            } else {
              this.audio.playPlayerDamage();
              this.addExplosion(this.player.state.x, this.player.state.y, 16, false);
              this.addFloatingText(this.player.state.x, this.player.state.y - 18, `-${dmg} SHIELD`, '#ef4444');
            }
            break;
          }
        }
      }
    }

    // NOTE: Player vs Gemini Orb is completely SAFE.
  }

  // --- Effects Management ---
  private addExplosion(x: number, y: number, maxRadius: number, isGround: boolean): void {
    this.explosions.push({
      x,
      y,
      radius: 4,
      maxRadius,
      timer: 0,
      duration: isGround ? 18 : 14,
      isGround,
    });

    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.0 + Math.random() * 3.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2,
        color: Math.random() > 0.4 ? '#ffffff' : '#38bdf8',
        alpha: 1.0,
        decay: 0.05 + Math.random() * 0.04,
      });
    }
  }

  private addFloatingText(x: number, y: number, text: string, color: string): void {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      timer: 0,
      duration: 48,
    });
  }

  private updateEffects(): void {
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      this.explosions[i].timer++;
      if (this.explosions[i].timer >= this.explosions[i].duration) {
        this.explosions.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y -= 0.6;
      t.timer++;
      if (t.timer >= t.duration) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  // --- Render ---
  public render(): void {
    const visibleGround = this.groundManager.getVisibleTargets(
      this.terrain.getScrollY(),
      this.canvas.height
    );

    const presetConfig = this.geminiManager.getPresetConfig();
    const telemetry = this.geminiManager.getTelemetry(this.player.state.x, this.player.state.y);

    this.renderer.render(
      this.state,
      this.player.state,
      this.geminiManager.orbs,
      this.geminiItems,
      this.enemyBullets,
      this.enemyManager.enemies,
      visibleGround,
      this.bossManager.currentBoss,
      this.breakoutManager.blocks,
      this.particles,
      this.explosions,
      this.floatingTexts,
      this.stage,
      this.stageTick,
      this.elonIntroTimer,
      presetConfig,
      telemetry,
      this.testBossTotalDamage,
      this.testEnemySetup,
      this.testBossCollisionMode,
      { x: this.input.state.x, y: this.input.state.y },
      { bgm: this.audio.isBgmEnabled(), se: this.audio.isSeEnabled() }
    );
  }

  // --- Test Stage / Physics Sandbox System ---
  private enterTestStage(): void {
    if (this.state === 'TEST_STAGE') return;

    this.savedNormalState = {
      stage: this.stage,
      score: this.player.state.score,
      lives: this.player.state.lives,
      shield: this.player.state.hp,
    };

    this.state = 'TEST_STAGE';
    this.audio.resume();
    this.audio.stopBgm();

    this.enemyManager.clear();
    this.groundManager.clear();
    this.bossManager.clear();
    this.breakoutManager.clear();
    this.geminiItems = [];
    this.enemyBullets = [];
    this.particles = [];
    this.explosions = [];
    this.floatingTexts = [];
    this.testDummyRespawnQueue = [];
    this.testBossTotalDamage = 0;

    this.player.reset(this.canvas.width / 2, this.canvas.height - 100);
    this.player.repair(100);

    if (this.geminiManager.orbs.length === 0) {
      this.geminiManager.spawn(this.player.state.x, this.player.state.y - 70);
    }

    // Set terrain for test lab
    this.terrain.setStage(1);

    // Initial default test enemy setup: SWARM_PENETRATE
    this.applyTestEnemySetup('SWARM_PENETRATE');

    this.addFloatingText(this.canvas.width / 2, 140, 'PHYSICS LAB / TEST STAGE', '#fde047');
  }

  private exitTestStage(): void {
    if (this.state !== 'TEST_STAGE') return;

    if (this.savedNormalState) {
      this.stage = this.savedNormalState.stage;
      this.player.state.score = this.savedNormalState.score;
      this.player.state.lives = this.savedNormalState.lives;
      this.player.repair(100);
    } else {
      this.stage = 1;
    }

    this.state = 'PLAYING';
    this.enemyManager.clear();
    this.groundManager.clear();
    this.bossManager.clear();
    this.breakoutManager.clear();
    this.geminiItems = [];
    this.enemyBullets = [];
    this.testDummyRespawnQueue = [];

    this.terrain.setStage(this.stage);
    this.stageManager.loadStage(this.stage);
    this.audio.playStageBgm(this.stage);
    this.addFloatingText(this.canvas.width / 2, 140, 'RESUMING MISSION', '#22c55e');
  }

  public applyTestEnemySetup(setup: TestEnemySetup): void {
    this.testEnemySetup = setup;
    this.enemyManager.clear();
    this.bossManager.clear();
    this.breakoutManager.clear();
    this.enemyBullets = [];
    this.testDummyRespawnQueue = [];
    this.testSwarmRespawnCooldown = 0;
    this.testBossTotalDamage = 0;

    const w = this.canvas.width;

    switch (setup) {
      case 'NONE':
        this.addFloatingText(w / 2, 140, '敵設定: ① 敵なし (自由飛行・検証)', '#38bdf8');
        break;

      case 'SWARM_PENETRATE': {
        const types: EnemyType[] = ['DEEPSEEK_FLASH', 'MISTRAL_FLAME', 'CLAUDE_HAIKU', 'GPT6_LUNA'];
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            const ex = 55 + c * 70;
            const ey = 115 + r * 44;
            const type = types[(r + c) % types.length];
            const e = this.enemyManager.spawn(type, ex, ey, 'DUMMY', undefined, 1);
            e.collisionType = 'PENETRATE';
            e.mass = 1.0;
          }
        }
        this.addFloatingText(w / 2, 140, '敵設定: ② 貫通一発死ザコ群 (一網打尽)', '#22c55e');
        break;
      }

      case 'SHIELD_SNIPER': {
        // Front-line reflective shields (mass 999) + Rear Snipers
        const s1 = this.enemyManager.spawn('CLAUDE_OPUS', w * 0.30, 140, 'SHIELD_FORWARD', undefined, 14);
        s1.collisionType = 'REFLECT';
        s1.mass = 999;
        const s2 = this.enemyManager.spawn('CLAUDE_OPUS', w * 0.70, 140, 'SHIELD_FORWARD', undefined, 14);
        s2.collisionType = 'REFLECT';
        s2.mass = 999;

        const sn1 = this.enemyManager.spawn('CURSOR_PROBE', w * 0.28, 52, 'SNIPER_HOVER', undefined, 4);
        sn1.collisionType = 'PENETRATE';
        sn1.shootCooldown = 50;
        const sn2 = this.enemyManager.spawn('DEEPSEEK_FLASH', w * 0.72, 52, 'SNIPER_HOVER', undefined, 4);
        sn2.collisionType = 'PENETRATE';
        sn2.shootCooldown = 110;

        this.addFloatingText(w / 2, 140, '敵設定: ③ 盾+狙撃 (遠距離分銅で盾を迂回横殴り！)', '#fde047');
        break;
      }

      case 'BARRAGE_RUSH': {
        // Central barrage sprinkler + 2 flank rushers
        const sp = this.enemyManager.spawn('MISTRAL_FLAME', w / 2, 100, 'BARRAGE_DRIFT', undefined, 10);
        sp.collisionType = 'PENETRATE';
        sp.shootCooldown = 30;

        const r1 = this.enemyManager.spawn('COPILOT_GLIDER', 60, -20, 'RUSH_DIVE', undefined, 3);
        r1.collisionType = 'PENETRATE';
        const r2 = this.enemyManager.spawn('COPILOT_GLIDER', w - 60, -20, 'RUSH_DIVE', undefined, 3);
        r2.collisionType = 'PENETRATE';

        this.addFloatingText(w / 2, 140, '敵設定: ④ 弾幕+突進 (短距離バリアで弾消し＆火の玉迎撃！)', '#38bdf8');
        break;
      }

      case 'WAVE_TACKLE': {
        // 5-wave rhythmic dive bombers
        for (let i = 0; i < 5; i++) {
          const rx = 50 + i * 65;
          const ry = -20 - i * 60;
          const r = this.enemyManager.spawn('SPACEX_ROCKET', rx, ry, 'RUSH_DIVE', undefined, 4);
          r.collisionType = 'PENETRATE';
          r.mass = 1.5;
        }
        this.addFloatingText(w / 2, 140, '敵設定: ⑤ 5連特攻 (火の玉チャージ突きで連続迎撃！)', '#f97316');
        break;
      }

      case 'ORBIT_CORE': {
        // Central core + 4 orbiting shield satellites
        const core = this.enemyManager.spawn('GPT6_TERRA', w / 2, 135, 'DUMMY', undefined, 35);
        core.collisionType = 'PENETRATE';
        core.mass = 4.0;

        for (let i = 0; i < 4; i++) {
          const bit = this.enemyManager.spawn('CURSOR_PROBE', w / 2, 135, 'ORBIT_BIT', undefined, 3);
          bit.collisionType = 'REFLECT';
          bit.mass = 2.0;
          bit.angle = (i * Math.PI) / 2;
          bit.orbitCenterX = w / 2;
          bit.orbitCenterY = 135;
        }
        this.addFloatingText(w / 2, 140, '敵設定: ⑥ 回転要塞 (公転逆スピンでビット粉砕＆コア貫通！)', '#ec4899');
        break;
      }

      case 'BOSS_PENETRATE': {
        this.bossManager.spawn('STAGE2_GROK_CURSOR', w);
        if (this.bossManager.currentBoss) {
          this.bossManager.currentBoss.name = '貫通大ボス GROK [HP 100,000]';
          this.bossManager.currentBoss.hp = 100000;
          this.bossManager.currentBoss.maxHp = 100000;
        }
        this.testBossCollisionMode = 'PENETRATE';
        this.addFloatingText(w / 2, 140, '敵設定: ⑦ 貫通大ボス (滞空多段削り実験)', '#22c55e');
        break;
      }
    }
  }

  private updateTestStage(dtFactor: number = 1.0): void {
    this.terrain.update(dtFactor);
    this.input.updateKeyboardMovement();

    // Touch leash clamp
    if (this.input.state.isTouch) {
      const maxLeash = 85;
      const ldx = this.input.state.x - this.player.state.x;
      const ldy = this.input.state.y - this.player.state.y;
      const ldist = Math.hypot(ldx, ldy);
      if (ldist > maxLeash) {
        this.input.state.x = this.player.state.x + (ldx / ldist) * maxLeash;
        this.input.state.y = this.player.state.y + (ldy / ldist) * maxLeash;
      }
    }

    this.player.update(this.input.state.x, this.input.state.y);

    // Continuous full repair in test stage
    this.player.repair(100);

    // Hotkey consumption
    if (this.input.consumeWallToggle()) {
      const bounce = this.geminiManager.toggleScreenEdgeBounce();
      this.audio.playGeminiBounce();
      this.addFloatingText(
        this.player.state.x,
        this.player.state.y - 30,
        bounce ? '画面端: 跳ね返り [ON]' : '画面端: 当たり判定なし [OFF]',
        bounce ? '#38bdf8' : '#94a3b8'
      );
    }
    if (this.input.consumeEnemySetupCycle()) {
      const setups: TestEnemySetup[] = ['NONE', 'SWARM_PENETRATE', 'SHIELD_SNIPER', 'BARRAGE_RUSH', 'WAVE_TACKLE', 'ORBIT_CORE', 'BOSS_PENETRATE'];
      const curIdx = setups.indexOf(this.testEnemySetup);
      const next = setups[(curIdx + 1) % setups.length];
      this.applyTestEnemySetup(next);
      this.audio.playGeminiBounce();
    }
    if (this.input.consumeTuningTension()) {
      const val = this.geminiManager.cycleTension();
      this.audio.playGeminiBounce();
      this.addFloatingText(this.player.state.x, this.player.state.y - 30, `バネ張力: x${val}`, '#fde047');
    }
    if (this.input.consumeTuningApex()) {
      const val = this.geminiManager.cycleApexDwell();
      this.audio.playGeminiBounce();
      this.addFloatingText(this.player.state.x, this.player.state.y - 30, `滞空時間: x${val}`, '#fde047');
    }
    if (this.input.consumeTuningSpeed()) {
      const val = this.geminiManager.cycleMaxSpeed();
      this.audio.playGeminiBounce();
      this.addFloatingText(this.player.state.x, this.player.state.y - 30, `最高速度: x${val}`, '#fde047');
    }
    if (this.input.consumeTuningReset()) {
      this.geminiManager.resetTuning();
      this.audio.playGeminiBounce();
      this.addFloatingText(this.player.state.x, this.player.state.y - 30, 'パラメータ初期値にリセット', '#38bdf8');
    }
    if (this.input.consumeOrbCount()) {
      const cnt = this.geminiManager.cycleOrbCount(this.player.state.x, this.player.state.y);
      this.audio.playGeminiBounce();
      this.addFloatingText(this.player.state.x, this.player.state.y - 30, `ジェミニ数: ${cnt}機`, '#ec4899');
    }

    // Update Gemini Orbs (passing onWallHit callback)
    this.geminiManager.update(
      this.player.state.x,
      this.player.state.y,
      this.player.state.vx,
      this.player.state.vy,
      (level, x, y) => {
        this.audio.playGeminiMerge(level);
        this.addExplosion(x, y, 24 * level, false);
        this.addFloatingText(x, y - 20, level === 3 ? 'MEGA FUSION! Lv.3' : 'FUSION! Lv.2', '#ec4899');
      },
      (wx, wy) => {
        this.audio.playBlockHit();
        this.addExplosion(wx, wy, 12, false);
      }
    );

    // Auto-respawn for all active test scenarios when cleared
    if (this.testEnemySetup !== 'NONE' && this.testEnemySetup !== 'BOSS_PENETRATE') {
      const remainingEnemies = this.enemyManager.enemies;
      if (remainingEnemies.length === 0) {
        this.testSwarmRespawnCooldown++;
        if (this.testSwarmRespawnCooldown > 50) {
          this.testSwarmRespawnCooldown = 0;
          this.applyTestEnemySetup(this.testEnemySetup);
        }
      }
    }

    // Update enemies
    this.enemyManager.update(
      this.canvas.width,
      this.canvas.height,
      this.player.state.x,
      this.player.state.y,
      (bx, by, bvx, bvy) => this.spawnBullet(bx, by, bvx, bvy)
    );

    // Update Boss (if active in BOSS_PENETRATE)
    if (this.bossManager.currentBoss) {
      this.bossManager.update(
        this.canvas.width,
        this.player.state.x,
        this.player.state.y,
        () => {},
        () => {},
        () => {}
      );
      if (this.bossManager.currentBoss.hp < 10000) {
        this.bossManager.currentBoss.hp = 100000;
        this.bossManager.currentBoss.defeated = false;
      }
    }

    // Update items & bullets
    this.updateGeminiItems();
    this.updateEnemyBullets();

    // Check collisions
    this.handleCollisions();

    // Update visual effects
    this.updateEffects();
  }

  private handlePointerClick(x: number, y: number): boolean {
    const w = this.canvas.width;

    if (this.state === 'TEST_STAGE') {
      // 0. Row 1: [壁: 反射 / 通過] button (x: 88 to 174, y: 2 to 18)
      if (x >= 88 && x <= 174 && y >= 2 && y <= 18) {
        const bounce = this.geminiManager.toggleScreenEdgeBounce();
        this.audio.playGeminiBounce();
        this.addFloatingText(
          this.player.state.x,
          this.player.state.y - 30,
          bounce ? '画面端: 跳ね返り [ON]' : '画面端: 当たり判定なし [OFF]',
          bounce ? '#38bdf8' : '#94a3b8'
        );
        return true;
      }

      // 1. Row 1: [Lv.UP(L)] button (x: 176 to 222, y: 2 to 18)
      if (x >= 176 && x <= 222 && y >= 2 && y <= 18) {
        for (const orb of this.geminiManager.orbs) {
          this.geminiManager.levelUpOrb(orb);
        }
        this.audio.playGeminiLevelUp();
        this.addFloatingText(this.player.state.x, this.player.state.y - 30, 'GEMINI LEVEL UP!', '#ec4899');
        return true;
      }

      // 2. Row 1: [🎵BGM] button (x: 224 to 264, y: 2 to 18)
      if (x >= 224 && x <= 264 && y >= 2 && y <= 18) {
        this.toggleBgm();
        return true;
      }

      // 3. Row 1: [🔊SE] button (x: 266 to 306, y: 2 to 18)
      if (x >= 266 && x <= 306 && y >= 2 && y <= 18) {
        this.toggleSe();
        return true;
      }

      // 4. Row 1: [✕戻る(T)] button (x: 308 to 356, y: 2 to 18)
      if (x >= 308 && x <= 356 && y >= 2 && y <= 18) {
        this.exitTestStage();
        return true;
      }

      // 3. Row 2 Buttons (y: 19 to 36)
      if (y >= 19 && y <= 36) {
        // [攻撃①: ヨーヨー突撃] / [攻撃②: 光ロープ分銅] (x: 6 to 122)
        if (x >= 6 && x <= 122) {
          this.toggleOrbitWithFeedback();
          return true;
        }

        // [ジェミニ: 貫通 / 反射] (x: 124 to 238)
        if (x >= 124 && x <= 238) {
          const col = this.geminiManager.toggleCollisionMode();
          this.audio.playGeminiBounce();
          this.addFloatingText(
            this.player.state.x,
            this.player.state.y - 30,
            col === 'PENETRATE' ? '⚔️ 属性: 貫通 (すり抜け多段削り)' : '🛡️ 属性: 反射 (跳ね返りピンボール)',
            col === 'PENETRATE' ? '#22c55e' : '#f97316'
          );
          return true;
        }

        // [ジェミニ数: 1機/2機/3機] (x: 240 to 356)
        if (x >= 240 && x <= 356) {
          const cnt = this.geminiManager.cycleOrbCount(this.player.state.x, this.player.state.y);
          this.audio.playGeminiBounce();
          this.addFloatingText(this.player.state.x, this.player.state.y - 30, `ジェミニ数: ${cnt}機`, '#ec4899');
          return true;
        }
      }

      // 4. Row 3: Preset Tabs (y: 37 to 52)
      if (y >= 37 && y <= 52) {
        const tabW = 64;
        for (let i = 0; i < PRESET_ORDER.length; i++) {
          const tabX = 10 + i * (tabW + 5);
          if (x >= tabX && x <= tabX + tabW) {
            const p = this.geminiManager.setPreset(PRESET_ORDER[i]);
            this.addFloatingText(this.player.state.x, this.player.state.y - 30, `MODE: ${p.nameJa}`, '#fde047');
            this.audio.playGeminiBounce();
            return true;
          }
        }
      }

      // 5. Row 4: 7 Enemy Scenario Setups (y: 53 to 70)
      if (y >= 53 && y <= 70) {
        const enemyTabs: Array<{ id: TestEnemySetup; x: number; w: number }> = [
          { id: 'NONE', x: 5, w: 32 },
          { id: 'SWARM_PENETRATE', x: 40, w: 46 },
          { id: 'SHIELD_SNIPER', x: 89, w: 52 },
          { id: 'BARRAGE_RUSH', x: 144, w: 58 },
          { id: 'WAVE_TACKLE', x: 205, w: 48 },
          { id: 'ORBIT_CORE', x: 256, w: 48 },
          { id: 'BOSS_PENETRATE', x: 307, w: 48 },
        ];
        for (const tab of enemyTabs) {
          if (x >= tab.x && x <= tab.x + tab.w) {
            this.applyTestEnemySetup(tab.id);
            this.audio.playGeminiBounce();
            return true;
          }
        }
      }

      // 6. Row 5: Parameter Quick Tuning (y: 71 to 88)
      if (y >= 71 && y <= 88) {
        // [バネ: x..] (x: 6 to 77)
        if (x >= 6 && x <= 77) {
          const val = this.geminiManager.cycleTension();
          this.audio.playGeminiBounce();
          this.addFloatingText(this.player.state.x, this.player.state.y - 30, `バネ張力: x${val}`, '#fde047');
          return true;
        }
        // [滞空: x..] (x: 78 to 148)
        if (x >= 78 && x <= 148) {
          const val = this.geminiManager.cycleApexDwell();
          this.audio.playGeminiBounce();
          this.addFloatingText(this.player.state.x, this.player.state.y - 30, `滞空時間: x${val}`, '#fde047');
          return true;
        }
        // [速度: x..] (x: 149 to 215)
        if (x >= 149 && x <= 215) {
          const val = this.geminiManager.cycleMaxSpeed();
          this.audio.playGeminiBounce();
          this.addFloatingText(this.player.state.x, this.player.state.y - 30, `最高速度: x${val}`, '#fde047');
          return true;
        }
        // [半径: ..] (x: 216 to 282)
        if (x >= 216 && x <= 282) {
          const val = this.geminiManager.cycleOrbitRadius();
          this.audio.playGeminiBounce();
          this.addFloatingText(this.player.state.x, this.player.state.y - 30, `公転半径: ${val}px`, '#fde047');
          return true;
        }
        // [↺リセット] (x: 283 to 354)
        if (x >= 283 && x <= 354) {
          this.geminiManager.resetTuning();
          this.audio.playGeminiBounce();
          this.addFloatingText(this.player.state.x, this.player.state.y - 30, 'パラメータ初期化!', '#38bdf8');
          return true;
        }
      }

      return false;
    } else {
      // Normal HUD buttons
      // Row 1: [🎵BGM] button (x: 148 to 184, y: 3 to 20)
      if (x >= 148 && x <= 184 && y >= 3 && y <= 20) {
        this.toggleBgm();
        return true;
      }

      // Row 1: [🔊SE] button (x: 186 to 222, y: 3 to 20)
      if (x >= 186 && x <= 222 && y >= 3 && y <= 20) {
        this.toggleSe();
        return true;
      }

      // Row 1: [LAB(T)] button (x: w - 46 to w - 4, y: 3 to 20)
      if (x >= w - 46 && x <= w - 4 && y >= 3 && y <= 20) {
        this.enterTestStage();
        return true;
      }

      // Row 1: [1-5: PRESET] button (x: w - 134 to w - 48, y: 3 to 20)
      if (x >= w - 134 && x <= w - 48 && y >= 3 && y <= 20) {
        const p = this.geminiManager.cyclePreset();
        this.addFloatingText(this.player.state.x, this.player.state.y - 30, `MODE: ${p.nameJa}`, '#fde047');
        this.audio.playGeminiBounce();
        return true;
      }

      // Row 2: [攻撃: ヨーヨー突撃 / 光ロープ分銅] button (x: w - 176 to w - 92, y: 22 to 40)
      if (x >= w - 178 && x <= w - 90 && y >= 22 && y <= 40) {
        this.toggleOrbitWithFeedback();
        return true;
      }

      // Row 2: [属性: 貫通 / 反射] button (x: w - 88 to w - 6, y: 22 to 40)
      if (x >= w - 90 && x <= w - 4 && y >= 22 && y <= 40) {
        const col = this.geminiManager.toggleCollisionMode();
        this.audio.playGeminiBounce();
        this.addFloatingText(
          this.player.state.x,
          this.player.state.y - 30,
          col === 'PENETRATE' ? '⚔️ 属性: 貫通 (すり抜け多段削り)' : '🛡️ 属性: 反射 (跳ね返りピンボール)',
          col === 'PENETRATE' ? '#22c55e' : '#f97316'
        );
        return true;
      }

      return false;
    }
  }
}
