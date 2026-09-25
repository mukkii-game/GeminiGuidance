import {
  GameState,
  ParticleEffect,
  ExplosionEffect,
  FloatingText,
  GeminiDropItem,
  EnemyBullet,
} from '../types';
import { Player } from '../entities/Player';
import { GeminiOrbManager } from '../entities/GeminiOrb';
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

  private setupAudioAndCrtControls(): void {
    const btnAudio = document.getElementById('btn-audio');
    if (btnAudio) {
      btnAudio.addEventListener('click', () => {
        this.audio.resume();
        const enabled = this.audio.toggle();
        btnAudio.textContent = enabled ? 'BGM/SE: ON' : 'BGM/SE: OFF';
      });
    }
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

  private startNewGame(): void {
    this.audio.resume();
    this.audio.playStartFanfare();
    this.audio.startBgm();

    this.stage = 1;
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
    this.elonIntroTimer = 0;
    this.stage1InvadersSpawned = false;
    this.stage1BossTriggered = false;

    this.terrain.setStage(1);
    this.stageManager.loadStage(1);

    // Initial starter Gemini orb
    this.geminiManager.spawn(this.player.state.x, this.player.state.y - 70);

    // Speak stage 1 title (No 一面 prefix)
    this.voice.playStageTitle(1);
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
    if (this.input.consumeAudioToggle()) {
      const btnAudio = document.getElementById('btn-audio');
      this.audio.resume();
      const enabled = this.audio.toggle();
      if (btnAudio) btnAudio.textContent = enabled ? 'SND: ON' : 'SND: OFF';
    }

    // State Dispatch
    if (this.state === 'TITLE' || this.state === 'GAME_OVER' || this.state === 'GAME_CLEAR') {
      if (this.input.state.active) {
        this.input.state.active = false;
        this.startNewGame();
      }
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

    // Update Gemini Orbs (ジェミニ誘導 & 合体)
    this.geminiManager.update(
      this.player.state.x,
      this.player.state.y,
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
    // 0. Breakout Blocks Collision (Stage 2)
    if (this.stage === 2 && this.breakoutManager.blocks.length > 0) {
      for (const orb of this.geminiManager.orbs) {
        const res = this.breakoutManager.checkGeminiCollision(orb);
        if (res.hit && res.block) {
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
      for (let bi = this.enemyBullets.length - 1; bi >= 0; bi--) {
        const b = this.enemyBullets[bi];
        const dist = Math.hypot(orb.x - b.x, orb.y - b.y);

        if (dist < orb.radius + b.radius) {
          // Bullet erased instantly!
          this.enemyBullets.splice(bi, 1);
          this.audio.playBulletErased();
          this.addExplosion(b.x, b.y, 8, false);
          this.player.addScore(50);
          // Gemini movement continues completely unhindered!
        }
      }
    }

    // 2. Gemini Orbs vs Airborne Enemies (貫通 vs 跳ね返り)
    for (const orb of this.geminiManager.orbs) {
      for (let i = this.enemyManager.enemies.length - 1; i >= 0; i--) {
        const e = this.enemyManager.enemies[i];
        const dist = Math.hypot(orb.x - e.x, orb.y - e.y);

        if (dist < orb.radius + e.width * 0.45) {
          e.hp -= orb.damage;

          if (e.hp > 0) {
            // ENEMY SURVIVED: Gemini DOES NOT PIERCE! (跳ね返り recoil)
            const nx = (orb.x - e.x) / (dist || 1);
            const ny = (orb.y - e.y) / (dist || 1);
            orb.vx = nx * 3.4;
            orb.vy = ny * 3.4;

            this.audio.playGeminiBounce();
            this.addExplosion(e.x, e.y, 14, false);

          } else {
            // ENEMY DESTROYED: Gemini PIERCES RIGHT THROUGH! (貫通する - no recoil)
            this.audio.playAirExplosion();
            this.addExplosion(e.x, e.y, 18 + orb.level * 4, false);

            const mult = orb.level === 3 ? 4 : orb.level === 2 ? 2 : 1;
            const pointsEarned = e.points * mult;
            this.player.addScore(pointsEarned);
            this.addFloatingText(e.x, e.y - 12, `+${pointsEarned}`, mult > 1 ? '#ec4899' : '#ffffff');

            const formationId = e.formationId;
            const deadX = e.x;
            const deadY = e.y;
            this.enemyManager.enemies.splice(i, 1);

            // Check if formation is completely wiped out
            if (formationId) {
              const remainingInFormation = this.enemyManager.enemies.some(en => en.formationId === formationId);
              if (!remainingInFormation) {
                // FORMATION WIPED! Drop floating Gemini logo item!
                this.spawnGeminiDropItem(deadX, deadY);
                this.addFloatingText(deadX, deadY - 24, 'FORMATION WIPE! GEMINI DROP', '#38bdf8');
                this.player.addScore(1500);
              }
            }
          }
        }
      }

      // 3. Gemini Orbs vs Boss
      if (this.bossManager.currentBoss) {
        const res = this.bossManager.hit(orb.damage, orb.x, orb.y);
        if (res.bossHit) {
          // Boss survives hits, so Gemini bounces off
          const b = this.bossManager.currentBoss;
          const dist = Math.hypot(orb.x - b.x, orb.y - b.y) || 1;
          orb.vx = ((orb.x - b.x) / dist) * 3.6;
          orb.vy = ((orb.y - b.y) / dist) * 3.6;

          this.audio.playGeminiBounce();
          this.addExplosion(orb.x, orb.y, 22, false);
          this.player.addScore(res.points);

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

    // 4. Player Ship vs Gemini Drop Items (自機で取ればもう一個のジェミニ追加！)
    if (this.player.state.alive) {
      for (let i = this.geminiItems.length - 1; i >= 0; i--) {
        const it = this.geminiItems[i];
        const dist = Math.hypot(this.player.state.x - it.x, this.player.state.y - it.y);

        if (dist < 22 + it.size) {
          // Player collected item: SPAWN NEW GEMINI ORB!
          this.geminiManager.spawn(it.x, it.y);
          this.audio.playItemCollect();
          this.addFloatingText(it.x, it.y - 18, '+1 GEMINI GET!', '#38bdf8');
          this.player.addScore(2000);
          this.geminiItems.splice(i, 1);
        }
      }
    }

    // 5. Existing Gemini Orbs vs Gemini Drop Items (持ってるジェミニに当てれば強化！)
    for (let i = this.geminiItems.length - 1; i >= 0; i--) {
      const it = this.geminiItems[i];
      let struck = false;

      for (const orb of this.geminiManager.orbs) {
        const dist = Math.hypot(orb.x - it.x, orb.y - it.y);
        if (dist < orb.radius + it.size) {
          // Gemini orb struck item: LEVEL UP THAT ORB!
          this.geminiManager.levelUpOrb(orb);
          this.audio.playGeminiLevelUp();
          this.addExplosion(orb.x, orb.y, 28, false);
          this.addFloatingText(orb.x, orb.y - 22, `GEMINI POWER UP! Lv.${orb.level}`, '#ec4899');
          this.player.addScore(3000);
          struck = true;
          break;
        }
      }

      if (struck) {
        this.geminiItems.splice(i, 1);
      }
    }

    // 6. Player Ship vs White Enemy Bullets
    if (this.player.state.alive && this.player.state.invulnerableTimer <= 0) {
      for (let bi = this.enemyBullets.length - 1; bi >= 0; bi--) {
        const b = this.enemyBullets[bi];
        const dist = Math.hypot(this.player.state.x - b.x, this.player.state.y - b.y);

        if (dist < 10 + b.radius) {
          this.enemyBullets.splice(bi, 1);
          const killed = this.player.hit();
          if (killed) {
            this.audio.playPlayerDeath();
            this.addExplosion(this.player.state.x, this.player.state.y, 36, false);
            this.playerRespawnTimer = 0;
            break;
          }
        }
      }
    }

    // 7. Player Ship vs Airborne Enemies
    if (this.player.state.alive && this.player.state.invulnerableTimer <= 0) {
      for (const e of this.enemyManager.enemies) {
        const dist = Math.hypot(this.player.state.x - e.x, this.player.state.y - e.y);
        if (dist < 12 + e.width * 0.35) {
          const killed = this.player.hit();
          if (killed) {
            this.audio.playPlayerDeath();
            this.addExplosion(this.player.state.x, this.player.state.y, 36, false);
            this.playerRespawnTimer = 0;
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
      this.elonIntroTimer
    );
  }
}
