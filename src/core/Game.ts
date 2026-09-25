import {
  GameState,
  ParticleEffect,
  ExplosionEffect,
  FloatingText,
} from '../types';
import { Player } from '../entities/Player';
import { GeminiOrbManager } from '../entities/GeminiOrb';
import { EnemyManager } from '../entities/Enemy';
import { GroundTargetManager } from '../entities/GroundTarget';
import { BossManager } from '../entities/Boss';
import { StageManager } from '../stages/StageData';
import { TerrainEngine } from '../graphics/Terrain';
import { SpriteSheet } from '../graphics/Sprites';
import { ArcadeRenderer } from '../graphics/Renderer';
import { SoundEngine } from './Audio';
import { InputManager } from './Input';

export class Game {
  public state: GameState = 'TITLE';
  public stage: number = 1;
  public stageTick: number = 0;

  private canvas: HTMLCanvasElement;
  private input: InputManager;
  private audio: SoundEngine;
  private sprites: SpriteSheet;
  private terrain: TerrainEngine;
  private renderer: ArcadeRenderer;

  private player: Player;
  private geminiManager: GeminiOrbManager;
  private enemyManager: EnemyManager;
  private groundManager: GroundTargetManager;
  private bossManager: BossManager;
  private stageManager: StageManager;

  private particles: ParticleEffect[] = [];
  private explosions: ExplosionEffect[] = [];
  private floatingTexts: FloatingText[] = [];

  private stageClearTimer: number = 0;
  private playerRespawnTimer: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.input = new InputManager(canvas);
    this.audio = new SoundEngine();
    this.sprites = new SpriteSheet();
    this.terrain = new TerrainEngine(canvas.width, canvas.height);
    this.renderer = new ArcadeRenderer(canvas, this.sprites, this.terrain);

    this.player = new Player(canvas.width / 2, canvas.height - 90);
    this.geminiManager = new GeminiOrbManager();
    this.enemyManager = new EnemyManager();
    this.groundManager = new GroundTargetManager();
    this.bossManager = new BossManager();
    this.stageManager = new StageManager();

    this.setupAudioAndCrtControls();
  }

  private setupAudioAndCrtControls(): void {
    const btnAudio = document.getElementById('btn-audio');
    if (btnAudio) {
      btnAudio.addEventListener('click', () => {
        this.audio.resume();
        const enabled = this.audio.toggle();
        btnAudio.textContent = enabled ? 'SND: ON' : 'SND: OFF';
      });
    }

    const btnCrt = document.getElementById('btn-crt');
    const container = document.getElementById('game-container');
    if (btnCrt && container) {
      btnCrt.addEventListener('click', () => {
        container.classList.toggle('crt-off');
        const isOff = container.classList.contains('crt-off');
        btnCrt.textContent = isOff ? 'CRT: OFF' : 'CRT: ON';
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
    this.audio.startBgm();

    this.stage = 1;
    this.state = 'PLAYING';
    this.player.reset(this.canvas.width / 2, this.canvas.height - 90);
    this.player.state.score = 0;
    this.player.state.lives = 3;

    this.geminiManager.clear();
    this.enemyManager.clear();
    this.groundManager.clear();
    this.bossManager.clear();
    this.particles = [];
    this.explosions = [];
    this.floatingTexts = [];

    this.terrain.setStage(1);
    this.stageManager.loadStage(1);

    // Initial starter Gemini orb so the player can immediately experience the flail!
    this.geminiManager.spawn(this.player.state.x, this.player.state.y - 60);
  }

  private advanceStage(): void {
    this.stage++;
    if (this.stage > 4) {
      this.state = 'GAME_CLEAR';
      return;
    }

    this.state = 'PLAYING';
    this.stageClearTimer = 0;
    this.enemyManager.clear();
    this.groundManager.clear();
    this.bossManager.clear();

    this.terrain.setStage(this.stage);
    this.stageManager.loadStage(this.stage);

    // Keep active orbs into the next stage as a reward for building them up!
    if (this.geminiManager.orbs.length === 0) {
      this.geminiManager.spawn(this.player.state.x, this.player.state.y - 60);
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
    if (this.state === 'TITLE') {
      if (this.input.state.active || this.input.state.bombPressed) {
        this.input.state.active = false;
        this.input.state.bombPressed = false;
        this.startNewGame();
      }
      return;
    }

    if (this.state === 'GAME_OVER' || this.state === 'GAME_CLEAR') {
      if (this.input.state.active || this.input.state.bombPressed) {
        this.input.state.active = false;
        this.input.state.bombPressed = false;
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
          // Spawn backup Gemini orb on respawn
          if (this.geminiManager.orbs.length === 0) {
            this.geminiManager.spawn(this.player.state.x, this.player.state.y - 60);
          }
        } else {
          this.state = 'GAME_OVER';
          this.audio.stopBgm();
          return;
        }
      }
    }

    // Auto-Bombing when ground target is inside sight (Ergonomic 1-finger mobile play)
    this.handleGroundBombing();

    // Check exploded bombs
    this.handleBombExplosions();

    // Update Gemini Orbs (ジェミニ誘導 & 合体)
    this.geminiManager.update(
      this.player.state.x,
      this.player.state.y,
      (level, x, y) => {
        // Fusion Callback
        this.audio.playGeminiMerge(level);
        this.addExplosion(x, y, 22 * level, false);
        this.addFloatingText(x, y - 20, level === 3 ? 'MEGA FUSION! Lv.3' : 'FUSION! Lv.2', '#ec4899');
        this.player.addScore(level === 3 ? 5000 : 2000);
      }
    );
    this.audio.updateGeminiHum(this.geminiManager.orbs.length, this.geminiManager.getAverageSpeed());

    // Update Stage Timeline & Spawning
    this.handleStageTimeline();

    // Update Enemies & Enemy Projectiles
    this.enemyManager.update(
      this.canvas.width,
      this.canvas.height,
      this.player.state.x,
      this.player.state.y,
      (bx, by, bvx, bvy) => {
        const bullet = this.enemyManager.spawn('MINI_CLONE', bx, by, 'MINI_BULLET');
        bullet.vx = bvx;
        bullet.vy = bvy;
        this.audio.playEnemyBulletFire();
      }
    );

    // Update Boss
    if (this.bossManager.currentBoss) {
      this.bossManager.update(this.canvas.width, (bx, by, bvx, bvy) => {
        const bullet = this.enemyManager.spawn('MINI_CLONE', bx, by, 'MINI_BULLET');
        bullet.vx = bvx;
        bullet.vy = bvy;
        this.audio.playEnemyBulletFire();
      });
    }

    // Update Ground Targets
    this.groundManager.update(this.terrain.getScrollY(), this.player.state.sightX, this.player.state.sightY);

    // Collision Detections
    this.handleCollisions();

    // Effects Update
    this.updateEffects();
  }

  // --- Ground Bombing Logic ---
  private handleGroundBombing(): void {
    if (!this.player.canFireBomb()) return;

    let shouldBomb = this.input.state.bombPressed;

    // Intelligent auto-lockon: if sight cursor is over any visible ground target
    if (!shouldBomb) {
      const visible = this.groundManager.getVisibleTargets(this.terrain.getScrollY(), this.canvas.height);
      for (const { entity: g, screenY } of visible) {
        if (!g.revealed && g.type === 'SOL_CITADEL') continue;
        const dist = Math.hypot(this.player.state.sightX - g.x, this.player.state.sightY - screenY);
        if (dist < 36) {
          shouldBomb = true;
          break;
        }
      }
    }

    if (shouldBomb) {
      const bomb = this.player.launchBomb();
      if (bomb) {
        this.audio.playBlasterDrop();
      }
    }
  }

  // --- Bomb Impact & Ground Target Hit ---
  private handleBombExplosions(): void {
    const explodedBombs = this.player.removeExplodedBombs();
    const scrollY = this.terrain.getScrollY();

    for (const b of explodedBombs) {
      // Ground explosion effect
      this.addExplosion(b.targetX, b.targetY, 18, true);
      this.audio.playGroundExplosion();

      const hitTarget = this.groundManager.checkBombHit(b.targetX, b.targetY, scrollY);
      if (hitTarget) {
        this.player.addScore(hitTarget.points);
        this.addFloatingText(hitTarget.x, b.targetY - 14, `+${hitTarget.points}`, '#fde047');
        this.addExplosion(hitTarget.x, b.targetY, 32, true);

        // POP OUT GEMINI ORB! (The Core Xevious Parody Reward)
        const orb = this.geminiManager.spawn(hitTarget.x, b.targetY, (Math.random() - 0.5) * 4, -4);
        if (hitTarget.type === 'SOL_CITADEL') {
          // Sol Citadel gives an automatic Lv.2 Gemini orb or dual orbs!
          orb.level = 2;
          orb.radius = 20;
          orb.damage = 3;
          this.geminiManager.spawn(hitTarget.x + 10, b.targetY, 3, -3);
          this.addFloatingText(hitTarget.x, b.targetY - 30, 'SOL BONUS! GEMINI x2', '#ec4899');
        } else {
          this.addFloatingText(hitTarget.x, b.targetY - 26, 'GEMINI GET!', '#38bdf8');
        }
      }
    }
  }

  // --- Stage Events & Spawning ---
  private handleStageTimeline(): void {
    const events = this.stageManager.update();
    const scrollY = this.terrain.getScrollY();

    for (const ev of events) {
      if (ev.type === 'ENEMY' && ev.enemyType) {
        this.enemyManager.spawn(ev.enemyType, ev.x ?? 180, ev.y ?? -20, ev.pattern);
      } else if (ev.type === 'GROUND' && ev.groundType) {
        // Place along world Y ahead of screen
        const targetWorldY = -scrollY - 40;
        this.groundManager.spawn(ev.groundType, ev.x ?? 180, targetWorldY);
      } else if (ev.type === 'ALERT') {
        this.audio.playBossAlert();
        this.addFloatingText(this.canvas.width / 2, 140, 'WARNING: BOSS APPROACHING', '#ef4444');
      } else if (ev.type === 'BOSS' && ev.bossType) {
        this.bossManager.spawn(ev.bossType, this.canvas.width);
      }
    }
  }

  // --- Collision Detections (Gemini Orbital Flail vs Airborne Foes) ---
  private handleCollisions(): void {
    // 1. Gemini Orbs vs Airborne Enemies
    for (const orb of this.geminiManager.orbs) {
      for (let i = this.enemyManager.enemies.length - 1; i >= 0; i--) {
        const e = this.enemyManager.enemies[i];
        const dist = Math.hypot(orb.x - e.x, orb.y - e.y);

        if (dist < orb.radius + e.width * 0.45) {
          // HIT!
          e.hp -= orb.damage;
          this.audio.playAirExplosion();
          this.addExplosion(e.x, e.y, 16 + orb.level * 4, false);

          // Kinetic recoil on the orb
          const nx = (orb.x - e.x) / (dist || 1);
          const ny = (orb.y - e.y) / (dist || 1);
          orb.vx += nx * 2.0;
          orb.vy += ny * 2.0;

          if (e.hp <= 0) {
            const mult = orb.level === 3 ? 4 : orb.level === 2 ? 2 : 1;
            const pointsEarned = e.points * mult;
            this.player.addScore(pointsEarned);
            this.addFloatingText(e.x, e.y - 12, `+${pointsEarned}`, mult > 1 ? '#ec4899' : '#ffffff');
            this.enemyManager.enemies.splice(i, 1);
          }
        }
      }

      // 2. Gemini Orbs vs Boss
      if (this.bossManager.currentBoss) {
        const res = this.bossManager.hit(orb.damage, orb.x, orb.y);
        if (res.bossHit) {
          this.audio.playAirExplosion();
          this.addExplosion(orb.x, orb.y, 22, false);
          this.player.addScore(res.points);

          if (res.defeated) {
            // Huge Boss Explosion Chain!
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
            }, 1600);
          }
        }
      }
    }

    // 3. Player vs Airborne Enemies / Mini-Clone Bullets
    if (this.player.state.alive && this.player.state.invulnerableTimer <= 0) {
      for (const e of this.enemyManager.enemies) {
        const dist = Math.hypot(this.player.state.x - e.x, this.player.state.y - e.y);
        if (dist < 14 + e.width * 0.35) {
          const killed = this.player.hit();
          if (killed) {
            this.audio.playPlayerDeath();
            this.addExplosion(this.player.state.x, this.player.state.y, 32, false);
            this.playerRespawnTimer = 0;
            break;
          }
        }
      }
    }
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

    // Spawn sparks / debris
    const count = isGround ? 8 : 14;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.0 + Math.random() * 3.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: isGround ? 3 : 2,
        color: isGround ? '#f59e0b' : Math.random() > 0.4 ? '#ffffff' : '#38bdf8',
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
      duration: 45,
    });
  }

  private updateEffects(): void {
    // Explosions
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      this.explosions[i].timer++;
      if (this.explosions[i].timer >= this.explosions[i].duration) {
        this.explosions.splice(i, 1);
      }
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Floating Texts
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
      this.player.bombs,
      this.geminiManager.orbs,
      this.enemyManager.enemies,
      visibleGround,
      this.bossManager.currentBoss,
      this.particles,
      this.explosions,
      this.floatingTexts,
      this.stage,
      this.stageTick
    );
  }
}
