import {
  PlayerState,
  GeminiOrb,
  GeminiDropItem,
  EnemyBullet,
  EnemyEntity,
  GroundEntity,
  BossEntity,
  BreakoutBlock,
  ParticleEffect,
  ExplosionEffect,
  FloatingText,
  GameState,
  PhysicsPresetConfig,
  GeminiCollisionMode,
  TestEnemySetup,
  AudioSettings,
  GeminiTelemetry,
  PhysicsPatternId,
} from '../types';
import { getOrbEffectiveRadius } from '../entities/GeminiOrb';
import { SpriteSheet } from './Sprites';
import { TerrainEngine } from './Terrain';

export interface EncounterBanner {
  kind: 'wave' | 'rest' | 'boss';
  title: string;
  subtitle?: string;
  wave?: number;
  /** Remaining ticks; rendering does not advance gameplay clocks. */
  timer: number;
  duration: number;
}

export class ArcadeRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private sprites: SpriteSheet;
  private terrain: TerrainEngine;

  private titleLogoImg: HTMLImageElement;
  private titleLogoLoaded: boolean = false;

  private elonPolygonImg: HTMLImageElement;
  private elonPolygonLoaded: boolean = false;

  private shakeTimer: number = 0;
  private shakeMagnitude: number = 0;
  private cachedFont: string = '';

  private setFont(font: string): void {
    if (this.cachedFont !== font) {
      this.ctx.font = font;
      this.cachedFont = font;
    }
  }

  private get readableFont10(): string {
    return 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Hiragino Sans", "Meiryo", "Noto Sans JP", sans-serif';
  }
  private get readableFont9(): string {
    return 'bold 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Hiragino Sans", "Meiryo", "Noto Sans JP", sans-serif';
  }
  private get readableFont11(): string {
    return 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Hiragino Sans", "Meiryo", "Noto Sans JP", sans-serif';
  }

  constructor(canvas: HTMLCanvasElement, sprites: SpriteSheet, terrain: TerrainEngine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
    this.sprites = sprites;
    this.terrain = terrain;

    this.titleLogoImg = new Image();
    this.titleLogoImg.src = './assets/title_logo.jpg';
    this.titleLogoImg.onload = () => {
      this.titleLogoLoaded = true;
    };

    this.elonPolygonImg = new Image();
    this.elonPolygonImg.src = './assets/elon_polygon.jpg';
    this.elonPolygonImg.onload = () => {
      this.elonPolygonLoaded = true;
    };
  }

  public triggerShake(duration: number = 8, magnitude: number = 4): void {
    this.shakeTimer = duration;
    this.shakeMagnitude = magnitude;
  }

  public render(
    state: GameState,
    player: PlayerState,
    geminiOrbs: GeminiOrb[],
    geminiItems: GeminiDropItem[],
    enemyBullets: EnemyBullet[],
    enemies: EnemyEntity[],
    groundTargets: Array<{ entity: GroundEntity; screenY: number }>,
    boss: BossEntity | null,
    blocks: BreakoutBlock[],
    particles: ParticleEffect[],
    explosions: ExplosionEffect[],
    floatingTexts: FloatingText[],
    stage: number,
    stageTick: number,
    elonIntroTimer: number = 0,
    presetConfig?: PhysicsPresetConfig,
    telemetry?: GeminiTelemetry,
    testBossDamage: number = 0,
    testEnemySetup: TestEnemySetup = 'SWARM_PENETRATE',
    testBossCollisionMode: 'PENETRATE' | 'REFLECT' = 'PENETRATE',
    pointerPos?: { x: number; y: number },
    audioSettings?: AudioSettings,
    encounter?: EncounterBanner
  ): void {
    this.cachedFont = '';
    const ctx = this.ctx;

    ctx.save();
    if (this.shakeTimer > 0) {
      this.shakeTimer--;
      const sx = (Math.random() - 0.5) * this.shakeMagnitude;
      const sy = (Math.random() - 0.5) * this.shakeMagnitude;
      ctx.translate(sx, sy);
    }

    // 1. Draw Scrolling Terrain
    this.terrain.render(ctx, stage);
    ctx.fillStyle = 'rgba(3, 10, 20, .20)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 2. Draw Ground Bases (Nvidia, Meta, HuggingFace, Stability AI octagons)
    this.renderGroundTargets(groundTargets);

    // 2.5 Draw Breakout Blocks (Stage 2 & Test Stage)
    if (blocks && blocks.length > 0) {
      this.renderBreakoutBlocks(blocks);
    }

    // 3. Draw Boss (if active)
    if (boss && !boss.defeated) {
      this.renderBoss(boss);
    }

    // 4. Draw Floating Gemini Drop Items (編隊全滅で出現するジェミニ)
    this.renderGeminiItems(geminiItems);

    // 5. Draw Enemies (Airborne GenAI Logos & SpaceX Rockets)
    this.renderEnemies(enemies);

    // 6. Draw White Enemy Bullets (たまふっかつ・白)
    this.renderEnemyBullets(enemyBullets);

    // 7. Draw Gemini Orbs & Slingshot Trails (ジェミニ誘導)
    this.renderGeminiOrbs(geminiOrbs, player.x, player.y);

    // 8. Draw Player Ship
    if (state === 'PLAYING' || state === 'STAGE_CLEAR' || state === 'TEST_STAGE') {
      this.renderPlayer(player, telemetry?.mode, telemetry?.collisionMode, pointerPos);
    }

    // 9. Draw Explosions & Particle Effects
    this.renderExplosions(explosions);
    this.renderParticles(particles);
    this.renderFloatingTexts(floatingTexts);

    // 10. Boss Dialogue Banner
    if (boss && !boss.defeated && boss.phase > 0 && boss.quoteTimer > 0) {
      this.renderBossDialogue(boss);
    }

    // 11. Stage 2 Polygon Elon Musk Transmission Intro
    if (elonIntroTimer > 0) {
      this.renderElonIntro(elonIntroTimer);
    }

    // 12. Stage Start Banner (First 150 ticks of Stage)
    if (state === 'PLAYING' && stageTick < 150 && elonIntroTimer <= 0) {
      this.renderStageTitle(stage, stageTick);
    }

    // 13. Arcade HUD
    if (state === 'TEST_STAGE') {
      this.renderTestStageHUD(player, geminiOrbs, boss, presetConfig, telemetry, testBossDamage, testEnemySetup, testBossCollisionMode, audioSettings);
    } else if (state === 'PLAYING' || state === 'STAGE_CLEAR') {
      this.renderHUD(player, stage, geminiOrbs, boss, presetConfig, telemetry, audioSettings);
    }

    if (state === 'PLAYING') {
      if (boss && !boss.defeated && boss.phase === 0) {
        const name = boss.name.split(':');
        this.renderEncounterBanner({ kind: 'boss', title: name[0].trim(),
          subtitle: name.slice(1).join(':').trim() || boss.stageTitle,
          timer: Math.max(1, 150 - boss.timer), duration: 150 });
      } else if (encounter && encounter.timer > 0) {
        this.renderEncounterBanner(encounter);
      }
    }

    // 14. State Overlays (Title, Stage Clear, Game Over, Game Clear)
    this.renderStateOverlays(state, stage, stageTick, player.score, pointerPos, audioSettings);

    ctx.restore();
    this.cachedFont = '';
  }

  // --- Ground Bases ---
  private renderGroundTargets(groundTargets: Array<{ entity: GroundEntity; screenY: number }>): void {
    const ctx = this.ctx;
    for (const { entity: g, screenY } of groundTargets) {
      const sprite = this.sprites.get(g.type);
      if (sprite) {
        ctx.save();
        ctx.translate(g.x, screenY);

        // Ground shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(3, 4, g.width * 0.45, g.height * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
        ctx.restore();
    this.cachedFont = '';
      }
    }
  }

  // --- AI data vaults and dedicated ricochet rails ---
  private renderBreakoutBlocks(blocks: BreakoutBlock[]): void {
    const ctx = this.ctx;
    const brands = [
      { sprite: 'GROK_RAIDER', label: 'xAI', color: '#e2e8f0' },
      { sprite: 'CURSOR_PROBE', label: 'CURSOR', color: '#a5b4fc' },
      { sprite: 'CLAUDE_SONNET', label: 'CLAUDE', color: '#fb923c' },
      { sprite: 'GPT6_LUNA', label: 'OPENAI', color: '#5eead4' },
    ];
    let vaultIndex = 0;
    ctx.save();
    for (const b of blocks) {
      if (!b.reflector) vaultIndex++;
      if (!b.active) continue;
      const x = b.x - b.width / 2, y = b.y - b.height / 2;
      const w = b.width, h = b.height;
      if (b.reflector) {
        ctx.fillStyle = '#122b3c'; ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#67e8f9'; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = '#d9faff';
        if (w > h) {
          ctx.fillRect(x + 2, y + h - 3, w - 4, 2);
          for (let n = 6; n < w - 6; n += 16) {
            ctx.fillStyle = '#25607b'; ctx.fillRect(x + n, y + 3, 7, h - 7);
          }
        } else {
          ctx.fillRect(b.x < this.canvas.width / 2 ? x + w - 3 : x + 1, y + 2, 2, h - 4);
          for (let n = 6; n < h - 6; n += 16) {
            ctx.fillStyle = '#25607b'; ctx.fillRect(x + 3, y + n, w - 6, 7);
          }
        }
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(x + 2, y + 2, 3, 3); ctx.fillRect(x + w - 5, y + h - 5, 3, 3);
        continue;
      }
      const brand = brands[(vaultIndex - 1) % brands.length];
      ctx.fillStyle = '#152235'; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = brand.color; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h);
      // Gold upper edge exposes the rear attack bonus; the lower edge is armor.
      ctx.fillStyle = '#fde68a'; ctx.fillRect(x + 2, y, w - 4, 2);
      ctx.fillStyle = '#415069'; ctx.fillRect(x + 1, y + h - 5, w - 2, 4);
      const logo = this.sprites.get(brand.sprite);
      const size = Math.min(18, h - 10);
      if (logo) ctx.drawImage(logo, b.x - size / 2, y + 3, size, size);
      this.setFont('bold 6px monospace'); ctx.textAlign = 'center'; ctx.fillStyle = brand.color;
      ctx.fillText(brand.label, b.x, y + h - 7);
      ctx.fillStyle = '#111827'; ctx.fillRect(x + 3, y + h - 3, w - 6, 1);
      ctx.fillStyle = brand.color; ctx.fillRect(x + 3, y + h - 3, (w - 6) * Math.max(0, b.hp / b.maxHp), 1);
    }
    ctx.restore(); this.cachedFont = '';
  }

  // --- Floating Gemini Drop Items (編隊を倒すと出現) ---
  private renderGeminiItems(items: GeminiDropItem[]): void {
    const ctx = this.ctx;
    const sprite = this.sprites.get('GEMINI_LV1');

    for (const it of items) {
      ctx.save();
      ctx.translate(it.x, it.y);

      // Pulsing golden / cyan beacon aura
      const pulse = Math.sin(it.timer * 0.12) * 4;
      const r = it.size + pulse;

      // Glow halo
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.beginPath();
      ctx.arc(0, 0, r + 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();

      // Gemini star sprite (upright)
      if (sprite) {
        ctx.drawImage(sprite, -14, -14, 28, 28);
      }

      // Small item hint label
      this.setFont('7px "Press Start 2P", monospace');
      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'center';
      ctx.fillText('ITEM', 0, 22);

      ctx.restore();
    this.cachedFont = '';
    }
  }

  // --- White Enemy Bullets (Xevious Sparoid Style) ---
  private renderEnemyBullets(bullets: EnemyBullet[]): void {
    const ctx = this.ctx;
    for (const b of bullets) {
      ctx.save();
      ctx.translate(b.x, b.y);

      // Crisp pure white diamond STG bullet
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, -b.radius * 1.3);
      ctx.lineTo(b.radius, 0);
      ctx.lineTo(0, b.radius * 1.3);
      ctx.lineTo(-b.radius, 0);
      ctx.closePath();
      ctx.fill();

      // Soft outer white glow
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.restore();
    this.cachedFont = '';
    }
  }

  // --- Player Ship ---
  private renderPlayer(player: PlayerState, mode?: 'SLING' | 'ORBIT' | 'COMET', colMode?: GeminiCollisionMode, pointerPos?: { x: number; y: number }): void {
    if (!player.alive) return;
    const ctx = this.ctx;

    // Flight Waypoint Target Marker (When player is flying towards mouse/touch waypoint)
    if (pointerPos) {
      const pdist = Math.hypot(pointerPos.x - player.x, pointerPos.y - player.y);
      if (pdist > 16) {
        ctx.save();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.40)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(pointerPos.x, pointerPos.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Small target reticle
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(pointerPos.x, pointerPos.y, 5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(pointerPos.x - 7, pointerPos.y); ctx.lineTo(pointerPos.x - 2, pointerPos.y);
        ctx.moveTo(pointerPos.x + 2, pointerPos.y); ctx.lineTo(pointerPos.x + 7, pointerPos.y);
        ctx.moveTo(pointerPos.x, pointerPos.y - 7); ctx.lineTo(pointerPos.x, pointerPos.y - 2);
        ctx.moveTo(pointerPos.x, pointerPos.y + 2); ctx.lineTo(pointerPos.x, pointerPos.y + 7);
        ctx.stroke();
        ctx.restore();
    this.cachedFont = '';
      }
    }

    // Invulnerability Shield Barrier & Visual Feedback
    const isInvulnerable = player.invulnerableTimer > 0;
    if (isInvulnerable) {
      // Shimmering elliptical cyber energy barrier
      ctx.save();
      const shieldPulse = Math.sin(player.invulnerableTimer * 0.3) * 2;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.6;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
      ctx.beginPath();
      ctx.ellipse(player.x, player.y, 20 + shieldPulse, 18 + shieldPulse, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Outer hexagonal barrier lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      for (let a = 0; a < 6; a++) {
        const rad = (a * Math.PI) / 3;
        const hx = player.x + Math.cos(rad) * (23 + shieldPulse);
        const hy = player.y + Math.sin(rad) * (20 + shieldPulse);
        if (a === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    this.cachedFont = '';

      // Rapid i-frame transparency flicker
      if (Math.floor(player.invulnerableTimer / 3) % 2 === 0) {
        ctx.globalAlpha = 0.55;
      }
    }

    // Low Hull Warning Sparks & Smoke
    if (player.hp <= 30 && Math.random() < 0.35) {
      ctx.save();
      ctx.fillStyle = Math.random() > 0.5 ? '#ef4444' : '#f59e0b';
      ctx.fillRect(
        player.x + (Math.random() - 0.5) * 16,
        player.y + (Math.random() - 0.5) * 12,
        2,
        2
      );
      ctx.restore();
    this.cachedFont = '';
    }

    // Thruster Exhaust Plume
    const flameH = 4 + Math.random() * 5;
    ctx.fillStyle = Math.random() > 0.5 ? '#00e5ff' : '#ff7700';
    ctx.fillRect(player.x - 5, player.y + 11, 3, flameH);
    ctx.fillRect(player.x + 2, player.y + 11, 3, flameH);

    // Player Ship Sprite
    const key = player.tilt === -1 ? 'PLAYER_LEFT' : player.tilt === 1 ? 'PLAYER_RIGHT' : 'PLAYER_CENTER';
    const sprite = this.sprites.get(key);
    if (sprite) {
      ctx.drawImage(sprite, player.x - sprite.width / 2, player.y - sprite.height / 2);
    }

    ctx.globalAlpha = 1.0;

    // Mini Shield Bar floating underneath ship
    if (player.hp < player.maxHp || isInvulnerable) {
      const barW = 24;
      const barH = 3;
      const barX = player.x - barW / 2;
      const barY = player.y + 19;
      const hpRatio = Math.max(0, player.hp / player.maxHp);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

      const color = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#f59e0b' : '#ef4444';
      ctx.fillStyle = color;
      ctx.fillRect(barX, barY, barW * hpRatio, barH);
    }

    // Weapon Mode Indicator floating above ship
    if (mode) {
      ctx.save();
      this.setFont('7px "DotGothic16", monospace');
      ctx.textAlign = 'center';
      if (mode === 'ORBIT') {
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('CAPTURE', player.x, player.y - 18);
      } else {
        ctx.fillStyle = '#fde047';
        const colLabel = colMode === 'REFLECT' ? '[反射]' : '[貫通]';
        ctx.fillText(`GUIDANCE ${colLabel}`, player.x, player.y - 18);
      }
      ctx.restore();
    this.cachedFont = '';
    }
  }

  // --- Autonomous Gemini Orbs (ジェミニ誘導 - Safe to touch!) ---
  private renderGeminiOrbs(orbs: GeminiOrb[], playerX: number, playerY: number): void {
    const ctx = this.ctx;

    const shieldActive = orbs.some(orb => (orb.isTethered || orb.mode === 'ORBIT')
      && Math.hypot(orb.x - playerX, orb.y - playerY) <= 70);
    if (shieldActive) {
      ctx.save();
      const glow = ctx.createRadialGradient(playerX, playerY, 28, playerX, playerY, 58);
      glow.addColorStop(0, 'rgba(34,211,238,0)'); glow.addColorStop(1, 'rgba(34,211,238,.13)');
      ctx.fillStyle = glow; ctx.strokeStyle = 'rgba(103,232,249,.6)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(playerX, playerY, 58, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(207,250,254,.75)'; ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const angle = i * Math.PI / 2;
        ctx.beginPath(); ctx.arc(playerX, playerY, 58, angle - .12, angle + .12); ctx.stroke();
      }
      ctx.restore(); this.cachedFont = '';
    }

    for (const orb of orbs) {
      // A clipped orb remains readable without bouncing it back for the player.
      if (orb.x < 6 || orb.x > this.canvas.width - 6 || orb.y < 44 || orb.y > this.canvas.height - 28) {
        const edgeX = Math.max(9, Math.min(this.canvas.width - 9, orb.x));
        const edgeY = Math.max(49, Math.min(this.canvas.height - 33, orb.y));
        const bearing = Math.atan2(orb.y - edgeY, orb.x - edgeX);
        ctx.save(); ctx.translate(edgeX, edgeY); ctx.rotate(bearing);
        ctx.fillStyle = '#67e8f9'; ctx.beginPath();
        ctx.moveTo(6, 0); ctx.lineTo(-4, -4); ctx.lineTo(-4, 4); ctx.closePath(); ctx.fill();
        ctx.restore(); this.cachedFont = '';
      }
      const speed = Math.hypot(orb.vx, orb.vy);
      const isCharged = !!orb.isCharged;
      const effectiveR = getOrbEffectiveRadius(orb);
      const flameOpacity = 1 - (orb.restRatio || 0);

      // 0. Energy Tether (クリック長押しヒモ保持 vs フリー投擲ホーミング)
      ctx.save();
      const isTethered = !!orb.isTethered || orb.mode === 'ORBIT';
      if (isTethered) {
        // --- クリック長押し中: のびのある細いゴム紐分銅 (Hammerfight Flail & Stretchy Rubber Cord) ---
        const isGigaSpin = orb.spinLevel === 2;
        const isHighSpin = orb.spinLevel === 1;

        const cordDist = Math.hypot(orb.x - playerX, orb.y - playerY) || 1;
        const baseL0 = (orb.tetherLength || orb.orbitRadius || 68);

        const cordColor = isGigaSpin ? '#ff3b00' : isHighSpin ? '#fbbf24' : '#38bdf8';
        const cordGlow = isGigaSpin ? 'rgba(255, 69, 0, 0.45)' : isHighSpin ? 'rgba(251, 191, 36, 0.38)' : 'rgba(56, 189, 248, 0.32)';

        // 1. ゴムの自然長ガイドライン（元の長さを表す薄い点線サークル）
        ctx.strokeStyle = isGigaSpin ? 'rgba(255, 69, 0, 0.22)' : isHighSpin ? 'rgba(251, 191, 36, 0.18)' : 'rgba(56, 189, 248, 0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.arc(playerX, playerY, baseL0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // 2. 高速スピン時の竜巻・渦の軌跡弧
        if (isGigaSpin || isHighSpin) {
          ctx.strokeStyle = isGigaSpin ? 'rgba(255, 69, 0, 0.45)' : 'rgba(253, 224, 71, 0.3)';
          ctx.lineWidth = isGigaSpin ? 4.5 : 2.5;
          ctx.beginPath();
          const trailSweep = isGigaSpin ? 1.25 : 0.75;
          const startAngle = orb.orbitAngle - (orb.vx * -Math.sin(orb.orbitAngle) + orb.vy * Math.cos(orb.orbitAngle) >= 0 ? trailSweep : -trailSweep);
          ctx.arc(playerX, playerY, cordDist, startAngle, orb.orbitAngle, false);
          ctx.stroke();
        }

        // 3. のびのある細いゴム紐（たるんでいる時は下にしなやかに垂れ下がる）
        const isSlack = cordDist < baseL0;
        const sag = isSlack ? Math.min(22, (baseL0 - cordDist) * 0.5) : 0;
        const ctrlX = (playerX + orb.x) / 2;
        const ctrlY = (playerY + orb.y) / 2 + sag;

        // 外側のやわらかなグロー
        ctx.strokeStyle = cordGlow;
        ctx.lineWidth = 3.6;
        ctx.beginPath();
        ctx.moveTo(playerX, playerY);
        if (sag > 1) {
          ctx.quadraticCurveTo(ctrlX, ctrlY, orb.x, orb.y);
        } else {
          ctx.lineTo(orb.x, orb.y);
        }
        ctx.stroke();

        // 細いゴム本体（線幅 1.4px）
        ctx.strokeStyle = cordColor;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(playerX, playerY);
        if (sag > 1) {
          ctx.quadraticCurveTo(ctrlX, ctrlY, orb.x, orb.y);
        } else {
          ctx.lineTo(orb.x, orb.y);
        }
        ctx.stroke();

        // 芯の白ハイライト（線幅 0.7px）
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(playerX, playerY);
        if (sag > 1) {
          ctx.quadraticCurveTo(ctrlX, ctrlY, orb.x, orb.y);
        } else {
          ctx.lineTo(orb.x, orb.y);
        }
        ctx.stroke();

        // 自機側の結び目リング
        ctx.fillStyle = cordColor;
        ctx.beginPath();
        ctx.arc(playerX, playerY, 3, 0, Math.PI * 2);
        ctx.fill();

        // 自機のアンカーリング
        ctx.strokeStyle = cordColor;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(playerX, playerY, 12, 0, Math.PI * 2);
        ctx.stroke();

        // 4. エグゼリカ式 投擲予測ベクトル（今離すと飛ぶ方向のガイド矢印）
        if (speed > 0.8) {
          const arrowLen = orb.radius + 28;
          const dirX = orb.vx / speed;
          const dirY = orb.vy / speed;
          ctx.strokeStyle = isGigaSpin ? '#ff3b00' : isHighSpin ? '#fde047' : 'rgba(56, 189, 248, 0.7)';
          ctx.lineWidth = 1.4;
          ctx.setLineDash([2, 3]);
          ctx.beginPath();
          ctx.moveTo(orb.x + dirX * (orb.radius + 3), orb.y + dirY * (orb.radius + 3));
          ctx.lineTo(orb.x + dirX * arrowLen, orb.y + dirY * arrowLen);
          ctx.stroke();
          ctx.setLineDash([]);

          // 矢印ヘッド
          const headLen = 4;
          const angle = Math.atan2(dirY, dirX);
          ctx.beginPath();
          ctx.moveTo(orb.x + dirX * arrowLen, orb.y + dirY * arrowLen);
          ctx.lineTo(
            orb.x + dirX * arrowLen - headLen * Math.cos(angle - Math.PI / 6),
            orb.y + dirY * arrowLen - headLen * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(orb.x + dirX * arrowLen, orb.y + dirY * arrowLen);
          ctx.lineTo(
            orb.x + dirX * arrowLen - headLen * Math.cos(angle + Math.PI / 6),
            orb.y + dirY * arrowLen - headLen * Math.sin(angle + Math.PI / 6)
          );
          ctx.stroke();
        }

      } else {
        // --- クリックを離している時: 完全フリーなホーミング飛翔！ヒモは非表示 ---
      }
      ctx.restore();
    this.cachedFont = '';

      // =========================================================================
      // 1. HITODAMA (人魂) & DIRECTIONAL FLYING EMBERS (火の粉)
      // =========================================================================
      ctx.save();
      ctx.globalAlpha = flameOpacity;
      const headingAngle = Math.atan2(orb.vy, orb.vx);
      const isMoving = speed > 0.55;

      if (!isTethered && isMoving) {
        // --- MODE ① 人魂（ひとだま）＆ 進行方向ビジュアル ---
        const tailLen = effectiveR * (1.2 + Math.min(speed * 0.75, 3.0));
        const headR = effectiveR * 0.95;

        ctx.save();
        ctx.translate(orb.x, orb.y);
        ctx.rotate(headingAngle);

        // A. 人魂の炎の尾（流線型ティアドロップ）
        // 進行方向が +X、後方が -X
        const hGrad = ctx.createLinearGradient(headR, 0, -tailLen, 0);
        if (isCharged) {
          // 🔥 猛突撃！燃え盛る火の玉（人魂）
          hGrad.addColorStop(0, '#ffffff');
          hGrad.addColorStop(0.25, '#fde047');
          hGrad.addColorStop(0.65, '#ff3b00');
          hGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        } else {
          // 霊妙な青白い人魂の炎
          const cMid = orb.level === 3 ? '#ec4899' : orb.level === 2 ? '#a855f7' : '#38bdf8';
          const cTail = orb.level === 3 ? '#f43f5e' : orb.level === 2 ? '#6366f1' : '#0284c7';
          hGrad.addColorStop(0, '#ffffff');
          hGrad.addColorStop(0.3, cMid);
          hGrad.addColorStop(0.7, cTail);
          hGrad.addColorStop(1, 'rgba(2, 132, 199, 0)');
        }

        ctx.fillStyle = hGrad;
        ctx.beginPath();
        // 先端（進行方向の前方）の丸い頭部
        ctx.arc(headR * 0.2, 0, headR, -Math.PI / 2, Math.PI / 2, false);
        // 後方（-X）へ細く伸びる下側エッジ
        ctx.quadraticCurveTo(-headR * 0.6, headR * 0.85, -tailLen, 0);
        // 後方から先端へ戻る上側エッジ
        ctx.quadraticCurveTo(-headR * 0.6, -headR * 0.85, headR * 0.2, -headR);
        ctx.closePath();
        ctx.fill();

        // B. 進行方向の先端に風を切るクレセント光冠（Leading Shock Wave）
        ctx.strokeStyle = isCharged ? '#ffffff' : '#e0f2fe';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(headR * 0.2, 0, headR + 2, -Math.PI * 0.38, Math.PI * 0.38, false);
        ctx.stroke();

        ctx.restore();
    this.cachedFont = '';

        // C. 後方に舞い散る火の粉（Trailing Sparks / Embers）
        // ユーザー指示: 「人のたまがうしろに火の粉とか向かっている方向が目に見えるような」
        const ux = orb.vx / speed; // 進行方向単位ベクトル
        const uy = orb.vy / speed;
        const perpX = -uy;
        const perpY = ux;

        const emberCount = isCharged ? 12 : 8;
        const timeNow = Date.now() * 0.008;

        for (let eb = 1; eb <= emberCount; eb++) {
          const ratio = eb / emberCount;
          // ジェミニ後方の距離
          const distBehind = effectiveR * 0.8 + ratio * (tailLen * 1.35);
          // 左右への揺らぎ（波打ち）
          const wobble = Math.sin(timeNow + eb * 1.37) * (headR * 0.65 * (0.3 + ratio * 0.7));
          const emberX = orb.x - ux * distBehind + perpX * wobble;
          const emberY = orb.y - uy * distBehind + perpY * wobble;

          const emberSize = Math.max(1.0, (1 - ratio * 0.6) * (isCharged ? 3.0 : 2.2));
          const emberAlpha = Math.max(0.15, (1 - ratio) * 0.95);

          ctx.fillStyle = isCharged
            ? (eb % 3 === 0 ? `rgba(255, 255, 255, ${emberAlpha})` : eb % 2 === 0 ? `rgba(253, 224, 71, ${emberAlpha})` : `rgba(255, 59, 0, ${emberAlpha})`)
            : (eb % 2 === 0 ? `rgba(255, 255, 255, ${emberAlpha})` : `rgba(56, 189, 248, ${emberAlpha})`);

          // きらめく小さな菱形パーティクル
          ctx.beginPath();
          ctx.moveTo(emberX, emberY - emberSize);
          ctx.lineTo(emberX + emberSize, emberY);
          ctx.lineTo(emberX, emberY + emberSize);
          ctx.lineTo(emberX - emberSize, emberY);
          ctx.closePath();
          ctx.fill();
        }

        // D. 猛突撃ステータスバッジ
        if (isCharged) {
          this.setFont('7px "DotGothic16", monospace');
          ctx.fillStyle = '#ffea00';
          ctx.textAlign = 'center';
          ctx.fillText('🔥猛突撃!!', orb.x, orb.y - effectiveR - 8);
        }

      } else if (isCharged) {
        // 🔥 静止中またはMode ②のチャージオーラ
        const fireGrad = ctx.createRadialGradient(orb.x, orb.y, 2, orb.x, orb.y, effectiveR + 10);
        fireGrad.addColorStop(0, '#ffffff');
        fireGrad.addColorStop(0.3, '#fde047');
        fireGrad.addColorStop(0.7, '#ff3b00');
        fireGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');

        ctx.fillStyle = fireGrad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, effectiveR + 10, 0, Math.PI * 2);
        ctx.fill();

        this.setFont('7px "DotGothic16", monospace');
        ctx.fillStyle = '#ffea00';
        ctx.textAlign = 'center';
        ctx.fillText(orb.mode === 'COMET' ? '☄️ハレー彗星!!' : orb.mode === 'ORBIT' ? '🔥室伏GIGAスピン!!' : '🔥猛突撃!!', orb.x, orb.y - effectiveR - 8);

      } else {
        // 通常オーラ
        const auraColor = orb.mode === 'COMET'
          ? 'rgba(192, 132, 252, 0.40)'
          : orb.mode === 'ORBIT'
          ? (orb.orbitTier === 'LONG' ? 'rgba(239, 68, 68, 0.40)' : orb.orbitTier === 'SHORT' ? 'rgba(56, 189, 248, 0.35)' : 'rgba(253, 224, 71, 0.35)')
          : (orb.level === 3 ? 'rgba(236, 72, 153, 0.32)' : orb.level === 2 ? 'rgba(168, 85, 247, 0.28)' : 'rgba(56, 189, 248, 0.25)');

        const strokeColor = orb.level === 3 ? '#f472b6' : orb.level === 2 ? '#c084fc' : '#38bdf8';

        ctx.fillStyle = auraColor;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, effectiveR + 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, effectiveR + 2, 0, Math.PI * 2);
        ctx.stroke();

        if (orb.mode === 'ORBIT' && orb.spinLevel === 1) {
          this.setFont('7px "DotGothic16", monospace');
          ctx.fillStyle = '#38bdf8';
          ctx.textAlign = 'center';
          ctx.fillText('⚡室伏遠心加速!', orb.x, orb.y - effectiveR - 8);
        }
      }
      ctx.restore();
    this.cachedFont = '';

      // 2. Motion Trail
      for (let i = 0; i < orb.trail.length && flameOpacity > 0; i++) {
        const pt = orb.trail[i];
        ctx.fillStyle = isCharged
          ? `rgba(255, 110, 0, ${pt.alpha * 0.55 * flameOpacity})`
          : orb.level === 3 ? `rgba(255, 120, 255, ${pt.alpha * 0.4 * flameOpacity})` : `rgba(56, 189, 248, ${pt.alpha * 0.35 * flameOpacity})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, (effectiveR * 0.45) * (1 - i / orb.trail.length), 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Gemini Star Sprite (Strictly Upright, No Rotation)
      const key = orb.level === 3 ? 'GEMINI_LV3' : orb.level === 2 ? 'GEMINI_LV2' : 'GEMINI_LV1';
      const sprite = this.sprites.get(key);
      if (sprite) {
        ctx.save();
        ctx.translate(orb.x, orb.y);
        ctx.drawImage(sprite, -effectiveR, -effectiveR, effectiveR * 2, effectiveR * 2);
        ctx.restore();
    this.cachedFont = '';
      }

      // 4. Fusion / Level Up Burst Flare Animation
      if (orb.fuseTimer > 0) {
        ctx.save();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, (25 - orb.fuseTimer) * 2.2 + orb.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        this.cachedFont = '';
      }

      // 5. Offscreen Edge Locator (画面外はみ出し時の位置インジケーター)
      const w = this.canvas.width;
      const h = this.canvas.height;
      if (orb.x < 0 || orb.x > w || orb.y < 0 || orb.y > h) {
        ctx.save();
        const clampX = Math.max(16, Math.min(w - 16, orb.x));
        const clampY = Math.max(26, Math.min(h - 26, orb.y));
        const angleToOrb = Math.atan2(orb.y - clampY, orb.x - clampX);

        ctx.fillStyle = orb.level === 3 ? '#ec4899' : orb.level === 2 ? '#a855f7' : '#38bdf8';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(clampX, clampY, 5, 0, Math.PI * 2);
        ctx.fill();

        // Arrow pointer pointing toward orb
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(clampX, clampY);
        ctx.lineTo(clampX + Math.cos(angleToOrb) * 10, clampY + Math.sin(angleToOrb) * 10);
        ctx.stroke();

        ctx.restore();
        this.cachedFont = '';
      }
    }
  }

  // --- Airborne GenAI Logos & Rockets (Strictly Upright) ---
  private renderEnemies(enemies: EnemyEntity[]): void {
    const ctx = this.ctx;
    for (const e of enemies) {
      const aiming = (e.pattern === 'RUSH_DIVE' && e.age >= 40 && e.age < 84)
        || (e.pattern === 'TACKLE_DASH' && e.age < 36);
      if (aiming && e.targetX !== undefined && e.targetY !== undefined) {
        const targetX = e.pattern === 'TACKLE_DASH' ? e.x + e.targetX * 75 : e.targetX;
        const targetY = e.pattern === 'TACKLE_DASH' ? e.y + e.targetY * 75 : e.targetY;
        ctx.save(); ctx.strokeStyle = 'rgba(251,113,133,0.65)';
        ctx.lineWidth = 1; ctx.setLineDash([4, 5]);
        ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(targetX, targetY); ctx.stroke();
        ctx.setLineDash([]); ctx.beginPath(); ctx.arc(targetX, targetY, 9, 0, Math.PI * 2); ctx.stroke();
        ctx.restore(); this.cachedFont = '';
      }
      if (e.pattern === 'ROCKET_ASCENT' || e.type === 'SPACEX_ROCKET') {
        // SpaceX Starship Rocket (Ascending from bottom)
        ctx.save();
        ctx.translate(e.x, e.y);

        // Rocket body
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(-10, -34, 20, 68);

        // Nosecone
        ctx.beginPath();
        ctx.moveTo(-10, -34);
        ctx.lineTo(0, -44);
        ctx.lineTo(10, -34);
        ctx.closePath();
        ctx.fill();

        // Dark heat shield on one side
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, -34, 10, 68);

        // SpaceX fins
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.moveTo(-10, 20); ctx.lineTo(-18, 34); ctx.lineTo(-10, 34); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(10, 20); ctx.lineTo(18, 34); ctx.lineTo(10, 34); ctx.fill();

        // Flame thrust plume from bottom
        const plumeH = 14 + Math.random() * 12;
        ctx.fillStyle = '#f97316';
        ctx.fillRect(-7, 34, 14, plumeH);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(-3, 34, 6, plumeH * 0.7);

        // "SPACEX" text on fuselage
        ctx.save();
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = '#0f172a';
        this.setFont('6px "Press Start 2P", monospace');
        ctx.textAlign = 'center';
        ctx.fillText('SPACEX', 0, 4);
        ctx.restore();
    this.cachedFont = '';

        if (e.hitCooldown && e.hitCooldown > 0) {
          const flashAlpha = (e.hitCooldown % 4 < 2) ? 0.75 : 0.25;
          ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
          ctx.fillRect(-e.width / 2, -e.height / 2, e.width, e.height);
        }

        ctx.restore();
    this.cachedFont = '';
        continue;
      }

      const spriteKey = e.type as string;
      const sprite = this.sprites.get(spriteKey);
      if (sprite) {
        ctx.save();
        ctx.translate(e.x, e.y);

        // Keep strictly upright (no rotation)
        ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);

        // Damage flash if hit (無敵時間中の点滅・被弾フラッシュ)
        if (e.hitCooldown && e.hitCooldown > 0) {
          const flashAlpha = (e.hitCooldown % 4 < 2) ? 0.75 : 0.25;
          ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
          ctx.fillRect(-e.width / 2, -e.height / 2, e.width, e.height);
        }

        ctx.restore();
    this.cachedFont = '';
      }

      // HP表示（耐久値が2以上の敵、またはDUMMY敵）
      if (e.maxHp > 1) {
        ctx.save();
        if (e.pattern === 'DUMMY' && e.maxHp > 10) {
          // 大型ダミー（HP 35や500など）はバー表示
          this.setFont('8px "DotGothic16", monospace');
          ctx.textAlign = 'center';
          const isPen = e.collisionType === 'PENETRATE';
          const massStr = (e.mass || 2) >= 100 ? '重壁' : (e.mass || 2) >= 3 ? '中' : '軽';
          const label = isPen ? `【貫通】HP:${Math.max(0, e.hp)}` : `【反射:${massStr}】HP:${Math.max(0, e.hp)}`;
          ctx.fillStyle = isPen ? '#22c55e' : '#f97316';
          ctx.fillText(label, e.x, e.y - e.height / 2 - 8);

          const barW = 44;
          const barH = 4;
          const barX = e.x - barW / 2;
          const barY = e.y - e.height / 2 - 6;
          ctx.fillStyle = 'rgba(0,0,0,0.75)';
          ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
          const ratio = Math.max(0, Math.min(1, e.hp / (e.maxHp || 500)));
          ctx.fillStyle = isPen ? '#22c55e' : '#f97316';
          ctx.fillRect(barX, barY, barW * ratio, barH);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 0.8;
          ctx.strokeRect(barX - 1, barY - 1, barW + 2, barH + 2);
        } else {
          // ザコ手応えチェック用: 2撃死・3撃死・4撃死のピップ表示（Hit Pip Markers）
          const pipCount = e.maxHp;
          const pipW = 8;
          const pipH = 4;
          const pipGap = 3;
          const totalW = pipCount * pipW + (pipCount - 1) * pipGap;
          const startX = e.x - totalW / 2;
          const startY = e.y - e.height / 2 - 8;

          for (let p = 0; p < pipCount; p++) {
            const px = startX + p * (pipW + pipGap);
            const isFilled = p < e.hp;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(px - 1, startY - 1, pipW + 2, pipH + 2);

            ctx.fillStyle = isFilled
              ? (pipCount === 2 ? '#38bdf8' : '#fbbf24')
              : 'rgba(239, 68, 68, 0.4)';
            ctx.fillRect(px, startY, pipW, pipH);

            ctx.strokeStyle = isFilled ? '#ffffff' : 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 0.6;
            ctx.strokeRect(px - 1, startY - 1, pipW + 2, pipH + 2);
          }
        }
        ctx.restore();
    this.cachedFont = '';
      }
    }
  }

  // --- Stage Bosses ---
  private renderBoss(boss: BossEntity): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(boss.x, boss.y);
    // Full-size armored hull makes the gameplay silhouette match the collision body.
    const hw = boss.width * .5, hh = boss.height * .5;
    ctx.fillStyle = boss.hitCooldown ? '#64748b' : '#172033';
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-hw + 12,-hh); ctx.lineTo(hw - 12,-hh);
    ctx.lineTo(hw,-hh+12); ctx.lineTo(hw,hh-12); ctx.lineTo(hw-12,hh);
    ctx.lineTo(-hw+12,hh); ctx.lineTo(-hw,hh-12); ctx.lineTo(-hw,-hh+12);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(148,163,184,.3)'; ctx.lineWidth = 1;
    for (let col=1;col<5;col++) { const x=-hw+col*hw*2/5; ctx.beginPath();ctx.moveTo(x,-hh+4);ctx.lineTo(x,hh-4);ctx.stroke(); }
    for (let row=1;row<3;row++) { const y=-hh+row*hh*2/3; ctx.beginPath();ctx.moveTo(-hw+4,y);ctx.lineTo(hw-4,y);ctx.stroke(); }
    for (const side of [-1,1]) {
      ctx.fillStyle='#334155';ctx.fillRect(side<0?-hw+8:hw-38,-hh+10,30,hh*2-20);
      ctx.fillStyle='#22d3ee';ctx.fillRect(side<0?-hw+12:hw-34,-hh+14,22,3);
      ctx.fillStyle='#fb923c';ctx.fillRect(side<0?-hw+15:hw-31,hh-9,16,5);
    }

    ctx.save();
    const baseWidth = boss.type === 'STAGE1_DEEPSEEK_KIMI' ? 200 : boss.type === 'STAGE4_GPT6_ASTRA' ? 240 : 210;
    const baseHeight = boss.type === 'STAGE3_CLAUDE_FABLE' ? 100 : boss.type === 'STAGE4_GPT6_ASTRA' ? 115 : 90;
    ctx.scale(boss.width / baseWidth, boss.height / baseHeight);
    if (boss.type === 'STAGE1_DEEPSEEK_KIMI') {
      // Stage 1: DeepSeek Whale + Kimi Moon + Qwen Core
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-55, -12, 110, 24);
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.strokeRect(-55, -12, 110, 24);

      const dsSprite = this.sprites.get('DEEPSEEK_FLASH');
      if (dsSprite) ctx.drawImage(dsSprite, -52, -14, 32, 28);

      const kimiSprite = this.sprites.get('KIMI_MOON');
      if (kimiSprite) ctx.drawImage(kimiSprite, 22, -14, 28, 28);

      const qwenSprite = this.sprites.get('QWEN_CUBE');
      if (qwenSprite) ctx.drawImage(qwenSprite, -14, -14, 28, 28);

    } else if (boss.type === 'STAGE2_GROK_CURSOR') {
      // Stage 2: Grok Monolith & Cursor Dual Shield
      ctx.fillStyle = '#000000';
      ctx.fillRect(-28, -25, 56, 50);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-22, -22); ctx.lineTo(22, 22);
      ctx.moveTo(22, -22); ctx.lineTo(-22, 22);
      ctx.stroke();

      const curSprite = this.sprites.get('CURSOR_PROBE');
      if (curSprite) {
        ctx.drawImage(curSprite, -64, -18, 30, 30);
        ctx.drawImage(curSprite, 34, -18, 30, 30);
      }

      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-12, 25, 24, 8 + Math.random() * 8);

    } else if (boss.type === 'STAGE3_CLAUDE_FABLE') {
      // Stage 3: Claude Fable Apex Octagon Fortress
      ctx.save();
      ctx.rotate(boss.timer * 0.02);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 4;
      ctx.strokeRect(-55, -55, 110, 110);
      ctx.restore();
    this.cachedFont = '';

      const sonnetSprite = this.sprites.get('CLAUDE_SONNET');
      if (sonnetSprite) {
        ctx.drawImage(sonnetSprite, -58, -32, 28, 28);
        ctx.drawImage(sonnetSprite, 30, -32, 28, 28);
      }

      const opusSprite = this.sprites.get('CLAUDE_OPUS');
      if (opusSprite) ctx.drawImage(opusSprite, -19, 16, 38, 38);

      const fableSprite = this.sprites.get('CLAUDE_FABLE');
      if (fableSprite) ctx.drawImage(fableSprite, -24, -24, 48, 48);

    } else {
      // Stage 4: GPT-6 Astra Andor Genesis
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(-85, 0); ctx.lineTo(-45, -55);
      ctx.lineTo(45, -55); ctx.lineTo(85, 0);
      ctx.lineTo(45, 55); ctx.lineTo(-45, 55);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.stroke();

      const lunaSprite = this.sprites.get('GPT6_LUNA');
      const terraSprite = this.sprites.get('GPT6_TERRA');
      const solSprite = this.sprites.get('GPT6_SOL');

      if (lunaSprite) ctx.drawImage(lunaSprite, -75, -42, 24, 24);
      if (terraSprite) ctx.drawImage(terraSprite, 52, -42, 28, 28);
      if (solSprite) ctx.drawImage(solSprite, -18, 24, 36, 36);

      const corePulse = 24 + Math.sin(boss.timer * 0.1) * 3;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, corePulse + 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, corePulse + 4, 0, Math.PI * 2);
      ctx.stroke();

      const astraSprite = this.sprites.get('GPT6_ASTRA');
      if (astraSprite) ctx.drawImage(astraSprite, -24, -24, 48, 48);
    }

    ctx.restore(); this.cachedFont = '';
    // Weak Point Reticles & HP
    for (const wp of boss.weakPoints) {
      if (!wp.active) continue;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(wp.xOffset, wp.yOffset, wp.radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
    this.cachedFont = '';
  }

  // --- Boss Cinematic Dialogue Banner ---
  private renderBossDialogue(boss: BossEntity): void {
    const ctx = this.ctx;
    const w = this.canvas.width;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 48, w, 52);

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 48, w, 52);

    this.setFont('8px "Press Start 2P", monospace');
    ctx.fillStyle = '#ef4444';
    ctx.textAlign = 'left';
    ctx.fillText('>> BOSS TRANSMISSION <<', 16, 62);

    this.setFont('11px "DotGothic16", monospace');
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`「${boss.dialogueQuote}」`, 16, 84);
    ctx.restore();
    this.cachedFont = '';
  }

  // --- Stage 2 Polygon Elon Musk Transmission (Star Fox Super FX Style) ---
  private renderElonIntro(timer: number): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.save();

    // Dark cyber transmission overlay
    ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
    ctx.fillRect(0, 0, w, h);

    // Green holographic wireframe grid lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.lineWidth = 1;
    for (let y = 0; y < h; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Centered 3D Polygon Elon Face image
    const faceSize = 180;
    const faceX = (w - faceSize) / 2;
    const faceY = 80;

    // Outer cybernetic holographic frame
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(faceX - 2, faceY - 2, faceSize + 4, faceSize + 4);

    if (this.elonPolygonLoaded && this.elonPolygonImg.complete) {
      // Slight scanline jitter
      const jitter = (timer % 8 === 0) ? (Math.random() - 0.5) * 2 : 0;
      ctx.drawImage(this.elonPolygonImg, faceX + jitter, faceY, faceSize, faceSize);
    } else {
      // Fallback wireframe polygon head if image is still loading
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(faceX, faceY, faceSize, faceSize);
      this.setFont('10px "Press Start 2P", monospace');
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('[ ELON POLYGON ]', w / 2, faceY + 90);
    }

    // Visor laser sweep animation
    const visorY = faceY + 76 + Math.sin(timer * 0.15) * 4;
    ctx.fillStyle = 'rgba(255, 0, 0, 0.35)';
    ctx.fillRect(faceX, visorY, faceSize, 6);

    // Transmission header banner
    this.setFont('9px "Press Start 2P", monospace');
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText('== INCOMING TRANSMISSION ==', w / 2, 46);

    this.setFont('8px "Press Start 2P", monospace');
    ctx.fillStyle = '#ef4444';
    ctx.fillText('EMPEROR ELON MUSK (xAI)', w / 2, 62);

    // Dialogue text box at bottom
    const boxY = 280;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(16, boxY, w - 32, 68);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(16, boxY, w - 32, 68);

    this.setFont('14px "DotGothic16", monospace');
    ctx.fillStyle = '#fde047';
    ctx.textAlign = 'center';
    ctx.fillText('「わしは　うちゅうのていおう　イーロン」', w / 2, boxY + 34);

    this.setFont('9px "Press Start 2P", monospace');
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('I AM THE EMPEROR OF THE UNIVERSE', w / 2, boxY + 54);

    ctx.restore();
    this.cachedFont = '';
  }

  private renderEncounterBanner(banner: EncounterBanner): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const elapsed = Math.max(0, banner.duration - banner.timer);
    const isBoss = banner.kind === 'boss';
    const isRest = banner.kind === 'rest';
    const fade = Math.min(1, (elapsed + 1) / 10, banner.timer / 16);
    const y = isBoss ? 193 : 116;
    const height = isBoss ? 112 : 59;
    const accent = isBoss ? '#fb7185' : isRest ? '#5eead4' : '#fbbf24';
    ctx.save(); ctx.globalAlpha = fade;
    if (isBoss) {
      ctx.fillStyle = 'rgba(3, 8, 18, .93)'; ctx.fillRect(0, y, w, height);
      ctx.fillStyle = accent; ctx.fillRect(0, y, w, 2); ctx.fillRect(0, y + height - 2, w, 2);
      // Moving hazard stripes provide impact without full-screen flashing.
      ctx.save(); ctx.beginPath(); ctx.rect(0, y - 9, w, 8); ctx.rect(0, y + height + 1, w, 8); ctx.clip();
      for (let x = -24 + elapsed % 24; x < w + 24; x += 24) {
        ctx.beginPath(); ctx.moveTo(x, y - 9); ctx.lineTo(x + 12, y - 9);
        ctx.lineTo(x + 4, y - 1); ctx.lineTo(x - 8, y - 1); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x, y + height + 1); ctx.lineTo(x + 12, y + height + 1);
        ctx.lineTo(x + 4, y + height + 9); ctx.lineTo(x - 8, y + height + 9); ctx.fill();
      }
      ctx.restore(); this.cachedFont = '';
      ctx.textAlign = 'center'; this.setFont('bold 32px monospace');
      ctx.fillStyle = accent; ctx.fillText('WARNING', w / 2, y + 35);
      this.setFont('bold 16px monospace'); ctx.fillStyle = '#ffffff';
      ctx.fillText(banner.title, w / 2, y + 62, w - 24);
      this.setFont(this.readableFont11); ctx.fillStyle = '#fda4af';
      ctx.fillText(banner.subtitle || '大型敵接近 / BOSS APPROACHING', w / 2, y + 83, w - 26);
      this.setFont(this.readableFont9); ctx.fillStyle = '#94a3b8';
      ctx.fillText('誘導・投擲で装甲を砕け', w / 2, y + 100);
    } else {
      // Transparent telop: only a narrow text shadow, no panel or divider lines.
      ctx.shadowColor = '#08101c'; ctx.shadowBlur = 3; ctx.shadowOffsetY = 1;
      ctx.textAlign = 'center'; this.setFont('bold 10px monospace'); ctx.fillStyle = accent;
      ctx.fillText(isRest ? 'RELOAD' : banner.wave ? `WAVE ${String(banner.wave).padStart(2, '0')}` : 'INCOMING', w / 2, y + 14);
      this.setFont(this.readableFont11); ctx.fillStyle = '#ffffff';
      ctx.fillText(banner.title, w / 2, y + 31, w - 24);
      if (banner.subtitle) {
        this.setFont(this.readableFont9); ctx.fillStyle = '#dbeafe';
        ctx.fillText(banner.subtitle, w / 2, y + 46, w - 24);
      }
    }
    ctx.restore(); this.cachedFont = '';
  }

  // --- Stage Start Title Banner ---
  private renderStageTitle(stage: number, stageTick: number): void {
    const ctx = this.ctx;
    const w = this.canvas.width;

    const titles: Record<number, string> = {
      1: 'STAGE 1: チャイナ・シンドローム',
      2: 'STAGE 2: イーロンズ・ゲート',
      3: 'STAGE 3: ザ・ファブル',
      4: 'STAGE 4: 魔法使いチャッピー',
    };

    const title = titles[stage] || `STAGE ${stage}`;
    const alpha = Math.min(1.0, stageTick / 20) * Math.max(0, (150 - stageTick) / 30);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 160, w, 64);

    this.setFont('13px "DotGothic16", monospace');
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText(title, w / 2, 185);
    this.setFont(this.readableFont11);
    ctx.fillStyle = '#e2e8f0';
    const lessons = ['', '誘って、かわす。ジェミニの突進で貫け。', '反射装甲の奥へ投げ込め。Qで壁トリック。', '捕獲で白弾を消し、離して要塞を砕け。', '誘導・捕獲・投擲。すべてをつなぐ最終戦。'];
    ctx.fillText(lessons[stage] || '', w / 2, 207);
    ctx.restore();
    this.cachedFont = '';
  }

  // --- Explosions, Particles, Floating Texts ---
  private renderExplosions(explosions: ExplosionEffect[]): void {
    const ctx = this.ctx;
    for (const exp of explosions) {
      const progress = exp.timer / exp.duration;
      const r = exp.radius + (exp.maxRadius - exp.radius) * progress;
      const alpha = 1.0 - progress;

      ctx.save();
      ctx.translate(exp.x, exp.y);

      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(255, 80, 0, ${alpha})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    this.cachedFont = '';
    }
  }

  private renderParticles(particles: ParticleEffect[]): void {
    const ctx = this.ctx;
    for (const p of particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1.0;
  }

  private renderFloatingTexts(texts: FloatingText[]): void {
    const ctx = this.ctx;
    this.setFont('8px "DotGothic16", monospace');
    ctx.textAlign = 'center';
    for (const t of texts) {
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
  }

  // --- Retro Arcade HUD ---
  private renderHUD(
    player: PlayerState,
    stage: number,
    geminiOrbs: GeminiOrb[],
    boss: BossEntity | null,
    _presetConfig?: PhysicsPresetConfig,
    telemetry?: GeminiTelemetry,
    audioSettings?: AudioSettings
  ): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const caught = !!telemetry?.isTethered;
    ctx.fillStyle = 'rgba(3, 10, 20, 0.88)';
    ctx.fillRect(0, 0, w, 43);
    ctx.fillRect(0, h - 27, w, 27);
    this.setFont('8px "Press Start 2P", monospace');
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fda4af';
    ctx.fillText('1UP', 8, 15);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(player.score.toString().padStart(7, '0'), 39, 15);
    this.setFont(this.readableFont9);
    for (const button of [
      { x: 148, w: 36, label: audioSettings?.bgm === false ? 'BGM −' : 'BGM +', on: audioSettings?.bgm !== false },
      { x: 186, w: 36, label: audioSettings?.se === false ? 'SE −' : 'SE +', on: audioSettings?.se !== false },
      { x: w - 44, w: 40, label: 'LAB [T]', on: true },
    ]) {
      ctx.fillStyle = '#102234'; ctx.fillRect(button.x, 4, button.w, 15);
      ctx.strokeStyle = button.on ? '#326883' : '#334155'; ctx.lineWidth = 1;
      ctx.strokeRect(button.x, 4, button.w, 15);
      ctx.textAlign = 'center'; ctx.fillStyle = button.on ? '#bae6fd' : '#64748b';
      ctx.fillText(button.label, button.x + button.w / 2, 15);
    }
    ctx.fillStyle = '#fef08a'; ctx.textAlign = 'center';
    ctx.fillText(`STAGE ${stage} / 4`, 269, 15);
    ctx.textAlign = 'left'; ctx.fillStyle = '#94a3b8';
    ctx.fillText('HULL', 8, 34);
    ctx.fillStyle = '#1e293b'; ctx.fillRect(38, 27, 58, 6);
    ctx.fillStyle = player.hp > 30 ? '#5eead4' : '#fb7185';
    ctx.fillRect(38, 27, 58 * Math.max(0, player.hp / player.maxHp), 6);
    ctx.fillStyle = '#e2e8f0'; ctx.fillText(`×${player.lives}`, 101, 34);
    ctx.fillStyle = caught ? '#67e8f9' : '#fde68a';
    ctx.fillText(caught ? 'SHIELD / 防御' : 'GUIDANCE / 誘導', 134, 34);
    ctx.textAlign = 'right'; ctx.fillStyle = telemetry?.screenEdgeBounce ? '#fbbf24' : '#94a3b8';
    ctx.fillText(telemetry?.screenEdgeBounce ? '[Q] 壁反射 ON' : '[Q] 壁反射 OFF', w - 8, 34);
    if (telemetry?.screenEdgeBounce) {
      ctx.strokeStyle = 'rgba(251,191,36,0.55)'; ctx.lineWidth = 2;
      ctx.strokeRect(10, 20, w - 20, h - 46);
    }
    ctx.textAlign = 'left'; this.setFont(this.readableFont10);
    ctx.fillStyle = caught ? '#67e8f9' : '#fde68a';
    ctx.fillText(caught ? '捕獲中は防御専用 → 離して攻撃' : '距離を取る → 誘う → 横へかわす', 8, h - 10);
    ctx.textAlign = 'right'; ctx.fillStyle = '#c4b5fd';
    ctx.fillText(`GEMINI ×${geminiOrbs.length}`, w - 8, h - 10);
    ctx.beginPath(); ctx.arc(318, 466, 24, 0, Math.PI * 2);
    ctx.fillStyle = caught ? 'rgba(8,145,178,0.45)' : 'rgba(7,20,34,0.7)'; ctx.fill();
    ctx.strokeStyle = caught ? '#fde68a' : '#67e8f9'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.textAlign = 'center'; ctx.fillStyle = '#e0f2fe';
    this.setFont(this.readableFont10); ctx.fillText(caught ? '捕獲中' : '捕獲', 318, 463);
    this.setFont(this.readableFont9); ctx.fillText(caught ? '離す' : '長押し', 318, 476);
    if (boss && !boss.defeated && boss.y > 0) {
      ctx.fillStyle = 'rgba(3,10,20,0.88)'; ctx.fillRect(48, 44, w - 96, 22);
      ctx.fillStyle = '#cbd5e1'; this.setFont(this.readableFont9);
      const cycle = boss.timer % 360;
      const opening = boss.phase > 0 && cycle >= 260;
      const barrage = boss.phase > 0 && cycle >= 10 && cycle <= 195;
      const diving = boss.phase > 0 && cycle >= 170 && cycle < 260;
      const bossStatus = opening ? 'CORE OPEN / 投擲のチャンス'
        : barrage ? 'BARRAGE / 捕獲で防御！'
        : diving ? (cycle < 200 ? 'DIVE LOCK / 横へ回避！' : 'DIVE / 突進注意！')
        : boss.name.split(':')[0].trim();
      if (opening || barrage) ctx.fillStyle = '#5eead4';
      if (diving) ctx.fillStyle = '#fda4af';
      ctx.fillText(bossStatus, w / 2, 53, w - 110);
      ctx.fillStyle = '#1e293b'; ctx.fillRect(58, 57, w - 116, 4);
      ctx.fillStyle = boss.hp / boss.maxHp > 0.5 ? '#fb7185' : '#fbbf24';
      ctx.fillRect(58, 57, (w - 116) * Math.max(0, boss.hp / boss.maxHp), 4);
    }
  }

  // --- Test Stage / Physics Lab HUD & Control Panel ---
  private renderTestStageHUD(
    player: PlayerState,
    geminiOrbs: GeminiOrb[],
    boss: BossEntity | null,
    _presetConfig?: PhysicsPresetConfig,
    telemetry?: GeminiTelemetry,
    testBossDamage: number = 0,
    testEnemySetup: TestEnemySetup = 'SWARM_PENETRATE',
    testBossCollisionMode: 'PENETRATE' | 'REFLECT' = 'PENETRATE',
    audioSettings?: AudioSettings
  ): void {
    const ctx = this.ctx;
    const w = this.canvas.width;

    ctx.save();

    // 0. Neon Screen Boundary Laser Walls (when screenEdgeBounce is true)
    if (telemetry?.screenEdgeBounce) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 20, w - 20, this.canvas.height - 46);

      // Corner brackets (gold arcade style)
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 3;
      // Top-left
      ctx.beginPath(); ctx.moveTo(10, 36); ctx.lineTo(10, 20); ctx.lineTo(26, 20); ctx.stroke();
      // Top-right
      ctx.beginPath(); ctx.moveTo(w - 26, 20); ctx.lineTo(w - 10, 20); ctx.lineTo(w - 10, 36); ctx.stroke();
      // Bottom-left
      ctx.beginPath(); ctx.moveTo(10, this.canvas.height - 42); ctx.lineTo(10, this.canvas.height - 26); ctx.lineTo(26, this.canvas.height - 26); ctx.stroke();
      // Bottom-right
      ctx.beginPath(); ctx.moveTo(w - 26, this.canvas.height - 26); ctx.lineTo(w - 10, this.canvas.height - 26); ctx.lineTo(w - 10, this.canvas.height - 42); ctx.stroke();
    }

    // 1. Top Lab Header Bar (Height: 89px)
    ctx.fillStyle = 'rgba(2, 6, 23, 0.96)';
    ctx.fillRect(0, 0, w, 89);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, 0, w, 89);

    // Row 1: Title, Shield, Wall Bounce Toggle, Lv, BGM, SE, Return (y: 2 to 18)
    this.setFont('8px "Press Start 2P", monospace');
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'left';
    ctx.fillText('⚡LAB', 4, 14);

    ctx.fillStyle = player.hp > 30 ? '#22c55e' : '#ef4444';
    this.setFont('7px "Press Start 2P", monospace');
    ctx.fillText(`SHLD:${player.hp}%`, 38, 14);

    // [壁: 反射ON] / [画面端: 通過] (x: 88 to 174, w: 86)
    const isWallBounce = !!telemetry?.screenEdgeBounce;
    ctx.fillStyle = isWallBounce ? 'rgba(56, 189, 248, 0.45)' : 'rgba(30, 41, 59, 0.85)';
    ctx.fillRect(88, 2, 86, 15);
    ctx.strokeStyle = isWallBounce ? '#38bdf8' : '#64748b';
    ctx.lineWidth = isWallBounce ? 1.5 : 1;
    ctx.strokeRect(88, 2, 86, 15);
    ctx.fillStyle = isWallBounce ? '#38bdf8' : '#94a3b8';
    this.setFont('7px "DotGothic16", monospace');
    ctx.textAlign = 'center';
    ctx.fillText(isWallBounce ? '🧱壁:反射[Q]' : '🚪端:通過[Q]', 88 + 43, 13);

    // Lv Button (x: 176 to 222, w: 46)
    const lv = geminiOrbs[0]?.level || 1;
    ctx.fillStyle = 'rgba(236, 72, 153, 0.25)';
    ctx.fillRect(176, 2, 46, 15);
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 1;
    ctx.strokeRect(176, 2, 46, 15);
    ctx.fillStyle = '#ec4899';
    this.setFont('6px "Press Start 2P", monospace');
    ctx.textAlign = 'center';
    ctx.fillText(`Lv.${lv}[L]`, 176 + 23, 12);

    // BGM Button (x: 224 to 264, w: 40)
    const isBgmOn = audioSettings?.bgm !== false;
    ctx.fillStyle = isBgmOn ? 'rgba(56, 189, 248, 0.30)' : 'rgba(239, 68, 68, 0.25)';
    ctx.fillRect(224, 2, 40, 15);
    ctx.strokeStyle = isBgmOn ? '#38bdf8' : '#ef4444';
    ctx.lineWidth = 1;
    ctx.strokeRect(224, 2, 40, 15);
    ctx.fillStyle = isBgmOn ? '#38bdf8' : '#f87171';
    this.setFont('7px "DotGothic16", monospace');
    ctx.textAlign = 'center';
    ctx.fillText(isBgmOn ? '🎵ON[B]' : '🎵OFF[B]', 224 + 20, 13);

    // SE Button (x: 266 to 306, w: 40)
    const isSeOn = audioSettings?.se !== false;
    ctx.fillStyle = isSeOn ? 'rgba(253, 224, 71, 0.30)' : 'rgba(239, 68, 68, 0.25)';
    ctx.fillRect(266, 2, 40, 15);
    ctx.strokeStyle = isSeOn ? '#fde047' : '#ef4444';
    ctx.lineWidth = 1;
    ctx.strokeRect(266, 2, 40, 15);
    ctx.fillStyle = isSeOn ? '#fde047' : '#f87171';
    this.setFont('7px "DotGothic16", monospace');
    ctx.textAlign = 'center';
    ctx.fillText(isSeOn ? '🔊ON[N]' : '🔊OFF[N]', 266 + 20, 13);

    // Exit Button (x: 308 to 356, w: 48)
    ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
    ctx.fillRect(308, 2, 48, 15);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    ctx.strokeRect(308, 2, 48, 15);
    ctx.fillStyle = '#f87171';
    ctx.fillText('✕戻る(T)', 308 + 24, 12);

    // Row 2: Attack Mode, Gemini Attribute, Orb Count (y: 19 to 35)
    const isTethered = !!telemetry?.isTethered;
    const btnAtkW = 112;
    ctx.fillStyle = isTethered ? 'rgba(56, 189, 248, 0.50)' : 'rgba(234, 179, 8, 0.45)';
    ctx.fillRect(8, 19, btnAtkW, 16);
    ctx.strokeStyle = isTethered ? '#38bdf8' : '#fde047';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(8, 19, btnAtkW, 16);
    ctx.fillStyle = isTethered ? '#38bdf8' : '#fde047';
    this.setFont(this.readableFont10);
    ctx.textAlign = 'center';
    const modeLabel = isTethered ? '⚡分銅ヒモ保持[長押]' : '☄️ハレー彗星[デフォ]';
    ctx.fillText(modeLabel, 8 + btnAtkW / 2, 30);

    const curCol = telemetry?.collisionMode || 'PENETRATE';
    const isPen = curCol === 'PENETRATE';
    const btnColW = 112;
    ctx.fillStyle = isPen ? 'rgba(34, 197, 94, 0.45)' : 'rgba(249, 115, 22, 0.45)';
    ctx.fillRect(124, 19, btnColW, 16);
    ctx.strokeStyle = isPen ? '#22c55e' : '#f97316';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(124, 19, btnColW, 16);
    ctx.fillStyle = isPen ? '#22c55e' : '#f97316';
    this.setFont(this.readableFont10);
    ctx.textAlign = 'center';
    ctx.fillText(isPen ? '⚔️ジェミニ:貫通[X]' : '🛡️ジェミニ:反射[X]', 124 + btnColW / 2, 30);

    const orbCnt = telemetry?.orbCount || geminiOrbs.length || 1;
    const btnOrbW = 112;
    ctx.fillStyle = 'rgba(236, 72, 153, 0.35)';
    ctx.fillRect(240, 19, btnOrbW, 16);
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(240, 19, btnOrbW, 16);
    ctx.fillStyle = '#f472b6';
    this.setFont(this.readableFont10);
    ctx.textAlign = 'center';
    ctx.fillText(`ジェミニ:${orbCnt}機[O]`, 240 + btnOrbW / 2, 30);

    // Row 3: 5 Physics Pattern Tabs (y: 37 to 51)
    const patternTabs: Array<{ id: PhysicsPatternId; label: string; num: string }> = [
      { id: 'YOYO_STROKE', label: 'ヨーヨー', num: '1' },
      { id: 'COMET_GRAVITY', label: '彗星軌道', num: '2' },
      { id: 'ARC_HOMING', label: '旋回制限', num: '3' },
      { id: 'PURE_FLAIL', label: '常時分銅', num: '4' },
      { id: 'HYBRID_COMET_FLAIL', label: 'エグゼリカ', num: '5' },
    ];
    const tabW = 64;
    const tabH = 14;
    const tabY = 37;
    for (let i = 0; i < patternTabs.length; i++) {
      const t = patternTabs[i];
      const tabX = 10 + i * (tabW + 5);
      const isActive = telemetry?.patternId === t.id;
      ctx.fillStyle = isActive ? 'rgba(234, 179, 8, 0.55)' : 'rgba(30, 41, 59, 0.85)';
      ctx.fillRect(tabX, tabY, tabW, tabH);
      ctx.strokeStyle = isActive ? '#fde047' : '#475569';
      ctx.lineWidth = isActive ? 2 : 1;
      ctx.strokeRect(tabX, tabY, tabW, tabH);
      ctx.fillStyle = isActive ? '#ffffff' : '#94a3b8';
      this.setFont(this.readableFont9);
      ctx.textAlign = 'center';
      ctx.fillText(`[${t.num}]${t.label}`, tabX + tabW / 2, tabY + 10);
    }

    // Row 4: 7 Enemy Scenario Switcher (y: 53 to 69)
    const enemyTabs: Array<{ id: TestEnemySetup; label: string; x: number; w: number; color: string }> = [
      { id: 'NONE', label: '①空', x: 5, w: 32, color: '#94a3b8' },
      { id: 'SWARM_PENETRATE', label: '②ザコ群', x: 40, w: 46, color: '#22c55e' },
      { id: 'SHIELD_SNIPER', label: '③盾+狙撃', x: 89, w: 52, color: '#fde047' },
      { id: 'BARRAGE_RUSH', label: '④弾幕+突進', x: 144, w: 58, color: '#38bdf8' },
      { id: 'WAVE_TACKLE', label: '⑤5連特攻', x: 205, w: 48, color: '#f97316' },
      { id: 'ORBIT_CORE', label: '⑥回転要塞', x: 256, w: 48, color: '#ec4899' },
      { id: 'BOSS_PENETRATE', label: '⑦大ボス', x: 307, w: 48, color: '#ef4444' },
    ];
    for (const et of enemyTabs) {
      const isAct = testEnemySetup === et.id;
      ctx.fillStyle = isAct ? `${et.color}55` : 'rgba(30, 41, 59, 0.85)';
      ctx.fillRect(et.x, 53, et.w, 16);
      ctx.strokeStyle = isAct ? et.color : '#475569';
      ctx.lineWidth = isAct ? 1.8 : 1;
      ctx.strokeRect(et.x, 53, et.w, 16);
      ctx.fillStyle = isAct ? '#ffffff' : '#94a3b8';
      this.setFont(this.readableFont9);
      ctx.textAlign = 'center';
      ctx.fillText(et.label, et.x + et.w / 2, 64);
    }

    // Row 5: Real-time Physics Parameter Tuning (y: 71 to 86)
    const tng = telemetry?.tuning || { tensionMultiplier: 1.0, maxTurnRate: 0.035, damping: 0.993, maxSpeedMultiplier: 1.0, orbitRadius: 75, overshootRatio: 0.5, apexDwellMultiplier: 1.0 };
    const turnDeg = ((tng.maxTurnRate || 0.035) * 180 / Math.PI).toFixed(1);
    const tuningBtns = [
      { label: `[J]加速度:x${tng.tensionMultiplier.toFixed(1)}`, x: 4, w: 72 },
      { label: `[U]球最高速:x${tng.maxSpeedMultiplier.toFixed(1)}`, x: 78, w: 72 },
      { label: `[K]旋角:${turnDeg}°`, x: 152, w: 66 },
      { label: `[Y]減衰:${(tng.damping || 0.993).toFixed(3)}`, x: 220, w: 70 },
      { label: '[R]初期', x: 292, w: 64 },
    ];
    for (const tb of tuningBtns) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fillRect(tb.x, 71, tb.w, 15);
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 1;
      ctx.strokeRect(tb.x, 71, tb.w, 15);
      ctx.fillStyle = '#fde047';
      this.setFont(this.readableFont9);
      ctx.textAlign = 'center';
      ctx.fillText(tb.label, tb.x + tb.w / 2, 82);
    }

    // 3.5. Player Movement Mode & Speed Bar (y: btmY - 22 to btmY - 4)
    const ctrlBarY = this.canvas.height - 44;
    const isDirect = player.controlMode !== 'LIMITED';
    const speedMult = player.speedMultiplier || 3.0;

    // Left Button: [🖱️自機移動: マウス直結[M]] / [🚀自機移動: 速度制限[M]] (x: 8 to 178, w: 170)
    ctx.fillStyle = isDirect ? 'rgba(56, 189, 248, 0.45)' : 'rgba(234, 179, 8, 0.45)';
    ctx.fillRect(8, ctrlBarY, 170, 18);
    ctx.strokeStyle = isDirect ? '#38bdf8' : '#fde047';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(8, ctrlBarY, 170, 18);
    ctx.fillStyle = isDirect ? '#38bdf8' : '#fde047';
    this.setFont(this.readableFont10);
    ctx.textAlign = 'center';
    ctx.fillText(isDirect ? '🖱️自機移動: マウス直結[M]' : `🚀自機移動: 速度制限[M]`, 8 + 85, ctrlBarY + 12);

    // Right Button: [🚀自機移動速度: x3.0 (切替)[V]] (x: 182 to 352, w: 170)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
    ctx.fillRect(182, ctrlBarY, 170, 18);
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(182, ctrlBarY, 170, 18);
    ctx.fillStyle = '#fde047';
    this.setFont(this.readableFont10);
    ctx.textAlign = 'center';
    ctx.fillText(`🚀自機移動速度: x${speedMult.toFixed(1)} [V]`, 182 + 85, ctrlBarY + 12);

    // 4. Real-time Telemetry Bar at Screen Bottom (y: height - 24 to height)
    const btmY = this.canvas.height - 24;
    ctx.fillStyle = 'rgba(2, 6, 23, 0.94)';
    ctx.fillRect(0, btmY, w, 24);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(0, btmY, w, 24);

    this.setFont(this.readableFont10);
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'left';
    ctx.fillText(`⚡速度: ${(telemetry?.speed || 0).toFixed(1)}  ⚡加速度: ${(telemetry?.accel || 0).toFixed(2)}`, 8, btmY + 16);

    ctx.fillStyle = '#fde047';
    ctx.fillText(`[距離:${telemetry?.dist || 0}px]`, 182, btmY + 16);

    ctx.fillStyle = '#22c55e';
    ctx.textAlign = 'right';
    ctx.fillText(`DMG:${testBossDamage}`, w - 8, btmY + 16);

    // Boss HP Bar in Test Stage if boss active (y = 96)
    if (boss && boss.y > 0) {
      const bossBarW = 160;
      const bossBarH = 6;
      const bossBarX = (w - bossBarW) / 2;
      const bossBarY = 96;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(bossBarX - 2, bossBarY - 2, bossBarW + 4, bossBarH + 4);

      const bossHpPercent = Math.max(0, boss.hp / boss.maxHp);
      const isBossPen = testBossCollisionMode === 'PENETRATE';
      ctx.fillStyle = isBossPen ? '#22c55e' : '#f97316';
      ctx.fillRect(bossBarX, bossBarY, bossBarW * bossHpPercent, bossBarH);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(bossBarX, bossBarY, bossBarW, bossBarH);

      ctx.fillStyle = '#ffffff';
      this.setFont('7px "DotGothic16", monospace');
      ctx.textAlign = 'center';
      ctx.fillText(`${boss.name} [${isBossPen ? '貫通' : '反射'}]`, w / 2, bossBarY - 4);
    }

    ctx.restore();
    this.cachedFont = '';
  }

  // --- State Overlays ---
  private renderStateOverlays(
    state: GameState,
    stage: number,
    stageTick: number,
    score: number,
    pointerPos?: { x: number; y: number },
    audioSettings?: AudioSettings
  ): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    if (state === 'TITLE') {
      ctx.fillStyle = 'rgba(4, 7, 12, 0.95)';
      ctx.fillRect(0, 0, w, h);

      // 1. Marquee Banner Image from Nano Banana
      if (this.titleLogoLoaded && this.titleLogoImg.complete) {
        const logoW = 280;
        const logoH = 80;
        const logoX = (w - logoW) / 2;
        const logoY = 6;

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(logoX - 1, logoY - 1, logoW + 2, logoH + 2);
        ctx.drawImage(this.titleLogoImg, logoX, logoY, logoW, logoH);
      }

      // 2. Subtitle / Version
      ctx.textAlign = 'center';
      this.setFont('12px "DotGothic16", monospace');
      ctx.fillStyle = '#67e8f9';
      ctx.fillText('【 ジェミニ誘導 - GEMINI GUIDANCE - 】', w / 2, 98);
      this.setFont('8px "Press Start 2P", monospace');
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('- LURE / CAPTURE / RELEASE -', w / 2, 110);

      // 3. Stage Select Section Header
      this.setFont('8px "Press Start 2P", monospace');
      ctx.fillStyle = '#fde047';
      ctx.fillText('== SELECT STAGE / MISSION ==', w / 2, 126);

      // 4. Five Clickable Stage Select Buttons
      const stageButtons = [
        {
          num: '1',
          name: '１面：チャイナ・シンドローム',
          sub: '誘導の基本：距離を取り、突き抜けさせる',
          y: 134,
          h: 26,
          color: '#38bdf8',
          isLab: false,
        },
        {
          num: '2',
          name: '２面：イーロンズ・ゲート',
          sub: '反射ゲート：隙間へ投げ、奥を攻める',
          y: 164,
          h: 26,
          color: '#f97316',
          isLab: false,
        },
        {
          num: '3',
          name: '３面：ザ・ファブル',
          sub: '交差戦：捕獲で守り、離して反撃',
          y: 194,
          h: 26,
          color: '#fbbf24',
          isLab: false,
        },
        {
          num: '4',
          name: '４面：魔法使いチャッピー',
          sub: '最終決戦：誘導・回転・投擲の総力戦',
          y: 224,
          h: 26,
          color: '#ef4444',
          isLab: false,
        },
        {
          num: 'T',
          name: '🧪 物理テストステージ (PHYSICS LAB)',
          sub: '貫通・反射・ヨーヨー・公転実験室',
          y: 254,
          h: 30,
          color: '#22c55e',
          isLab: true,
        },
      ];

      const btnX = 16;
      const btnW = w - 32; // 328px

      for (const btn of stageButtons) {
        const isHover = !!(pointerPos &&
          pointerPos.x >= btnX && pointerPos.x <= btnX + btnW &&
          pointerPos.y >= btn.y && pointerPos.y <= btn.y + btn.h);

        // Button background
        ctx.fillStyle = isHover
          ? 'rgba(56, 189, 248, 0.40)'
          : (btn.isLab ? 'rgba(34, 197, 94, 0.20)' : 'rgba(15, 23, 42, 0.88)');
        ctx.fillRect(btnX, btn.y, btnW, btn.h);

        // Border
        ctx.strokeStyle = isHover ? '#fde047' : btn.color;
        ctx.lineWidth = isHover ? 2 : (btn.isLab ? 1.5 : 1);
        ctx.strokeRect(btnX, btn.y, btnW, btn.h);

        // Key badge [1], [2], [T]
        ctx.fillStyle = isHover ? '#fde047' : btn.color;
        this.setFont('8px "Press Start 2P", monospace');
        ctx.textAlign = 'left';
        ctx.fillText(`[${btn.num}]`, btnX + 8, btn.y + (btn.isLab ? 17 : 16));

        // Main Title
        ctx.fillStyle = isHover ? '#ffffff' : '#f8fafc';
        this.setFont('10px "DotGothic16", monospace');
        const prefix = isHover ? '▶ ' : '';
        ctx.fillText(`${prefix}${btn.name}`, btnX + 40, btn.y + 11);

        // Subtext / description
        ctx.fillStyle = isHover ? '#fde047' : '#94a3b8';
        this.setFont('7px "DotGothic16", monospace');
        ctx.textAlign = 'right';
        ctx.fillText(btn.sub, btnX + btnW - 8, btn.y + 23);
      }

      // 5. Instruction prompt
      ctx.textAlign = 'center';
      if (Math.floor(stageTick / 22) % 2 === 0) {
        this.setFont('8px "Press Start 2P", monospace');
        ctx.fillStyle = '#fde047';
        ctx.fillText('CLICK BUTTON OR PRESS [1-4] / [T]', w / 2, 298);
      } else {
        this.setFont('8px "Press Start 2P", monospace');
        ctx.fillStyle = '#a16207';
        ctx.fillText('CLICK BUTTON OR PRESS [1-4] / [T]', w / 2, 298);
      }

      // 6. Mechanics & Controls Guide
      this.setFont('8px "DotGothic16", monospace');
      ctx.fillStyle = '#22c55e';
      ctx.fillText('① 誘導：距離を取り、自機へ突っ込む球を横へかわす', w / 2, 316);
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('② 捕獲：長押しで白弾を消す防御専用。敵への攻撃力なし', w / 2, 332);
      ctx.fillStyle = '#fef08a';
      ctx.fillText('③ 投擲：離した瞬間の進行方向へ。速い一撃ほど強い', w / 2, 348);
      ctx.fillStyle = '#ec4899';
      ctx.fillText('球は自機に当たっても安全。止まると少しずつ戻ってくる', w / 2, 364);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('[Q] 壁反射は任意でON / [T] 物理調整は実験室へ', w / 2, 380);

      // Separator Line
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, 392);
      ctx.lineTo(w - 20, 392);
      ctx.stroke();

      // Audio Toggles on Title Screen (y: 396 to 416)
      const isBgmOn = audioSettings?.bgm !== false;
      const isSeOn = audioSettings?.se !== false;

      // BGM Button (x: 24 to 172, y: 396 to 416)
      ctx.fillStyle = isBgmOn ? 'rgba(56, 189, 248, 0.35)' : 'rgba(239, 68, 68, 0.25)';
      ctx.fillRect(24, 396, 148, 20);
      ctx.strokeStyle = isBgmOn ? '#38bdf8' : '#ef4444';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(24, 396, 148, 20);
      ctx.fillStyle = isBgmOn ? '#38bdf8' : '#f87171';
      this.setFont('8px "DotGothic16", monospace');
      ctx.textAlign = 'center';
      ctx.fillText(isBgmOn ? '🎵 BGM: ON [Bキー]' : '🎵 BGM: OFF [Bキー]', 98, 410);

      // SE Button (x: 188 to 336, y: 396 to 416)
      ctx.fillStyle = isSeOn ? 'rgba(253, 224, 71, 0.35)' : 'rgba(239, 68, 68, 0.25)';
      ctx.fillRect(188, 396, 148, 20);
      ctx.strokeStyle = isSeOn ? '#fde047' : '#ef4444';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(188, 396, 148, 20);
      ctx.fillStyle = isSeOn ? '#fde047' : '#f87171';
      this.setFont('8px "DotGothic16", monospace');
      ctx.textAlign = 'center';
      ctx.fillText(isSeOn ? '🔊 効果音: ON [Nキー]' : '🔊 効果音: OFF [Nキー]', 262, 410);

      // Master Mute text
      this.setFont('7px "DotGothic16", monospace');
      ctx.fillStyle = '#64748b';
      ctx.fillText('まずは [1] から全４面のアーケードラン', w / 2, 426);

      // 7. Asset Attribution
      this.setFont('8px "DotGothic16", monospace');
      ctx.fillStyle = '#67e8f9';
      ctx.fillText('【 音源・素材クレジット 】', w / 2, 440);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('■ BGM: 魔王魂 (maou.audio) | 効果音: 効果音ラボ', w / 2, 452);
      ctx.fillStyle = '#64748b';
      ctx.fillText('※本作は非営利的パロディ作品であり各社商標は各権利者に帰属します', w / 2, 466);

      // Controls guide
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('📱 1本指ドラッグで移動・誘導スイング', w / 2, 484);
      ctx.fillText('💻 PC: マウスまたはWASD / 矢印キー移動', w / 2, 498);

      // Copyright
      this.setFont('8px "Press Start 2P", monospace');
      ctx.fillStyle = '#ef4444';
      ctx.fillText('(C) 2026 MUKKII ARCADE SYSTEM', w / 2, 522);

    } else if (state === 'STAGE_CLEAR') {
      this.setFont('14px "Press Start 2P", monospace');
      ctx.textAlign = 'center';
      ctx.fillStyle = '#22c55e';
      ctx.fillText(`STAGE ${stage} CLEARED!`, w / 2, h * 0.45);
      ctx.fillStyle = '#fef08a';
      this.setFont('8px "Press Start 2P", monospace');
      ctx.fillText('GET READY FOR NEXT BATTLE...', w / 2, h * 0.55);

    } else if (state === 'GAME_OVER') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, w, h);

      this.setFont('16px "Press Start 2P", monospace');
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ef4444';
      ctx.fillText('GAME OVER', w / 2, h * 0.45);

      this.setFont('8px "Press Start 2P", monospace');
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`FINAL SCORE: ${score}`, w / 2, h * 0.55);

      if (Math.floor(stageTick / 25) % 2 === 0) {
        ctx.fillStyle = '#fef08a';
        ctx.fillText('TOUCH / CLICK TO RETRY', w / 2, h * 0.68);
      }

    } else if (state === 'GAME_CLEAR') {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.96)';
      ctx.fillRect(0, 0, w, h);
      // Quiet starfield and twin comet orbits close the arcade journey.
      for (let i = 0; i < 55; i++) {
        ctx.fillStyle = i % 3 ? '#334155' : '#7dd3fc';
        ctx.fillRect((i * 97) % w, (i * 137 + stageTick * 0.12) % h, 1, 1);
      }
      const centerY = 162;
      ctx.strokeStyle = '#164e63'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(w / 2, centerY, 96, 39, -0.35, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 2; i++) {
        const angle = stageTick * 0.018 + i * Math.PI;
        for (let j = 16; j >= 0; j--) {
          const a = angle - j * 0.06;
          ctx.globalAlpha = 1 - j / 18;
          ctx.fillStyle = i ? '#c4b5fd' : '#67e8f9';
          ctx.beginPath(); ctx.arc(w / 2 + Math.cos(a) * 94, centerY + Math.sin(a) * 37, j ? 2 : 6, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      const ship = this.sprites.get('PLAYER_CENTER');
      if (ship) ctx.drawImage(ship, w / 2 - ship.width / 2, centerY - ship.height / 2);
      ctx.textAlign = 'center'; this.setFont('13px "Press Start 2P", monospace');
      ctx.fillStyle = '#fef08a'; ctx.fillText('ALL CLEAR', w / 2, 80);
      this.setFont(this.readableFont11); ctx.fillStyle = '#e2e8f0';
      ctx.fillText('最後の要塞は砕け、空に静けさが戻った。', w / 2, 249);
      ctx.fillText('ふたつの光は、もう追跡者ではない。', w / 2, 273);
      ctx.fillStyle = '#67e8f9'; ctx.fillText('あなたの軌道が、帰り道になる。', w / 2, 307);
      this.setFont('9px "Press Start 2P", monospace');
      ctx.fillStyle = '#ffffff'; ctx.fillText(`SCORE ${score.toString().padStart(8, '0')}`, w / 2, 354);
      this.setFont(this.readableFont10); ctx.fillStyle = '#94a3b8';
      ctx.fillText('GEMINI GUIDANCE / MUKKII ARCADE SYSTEM', w / 2, 401);
      ctx.fillText('BGM: 魔王魂  /  効果音: 効果音ラボ', w / 2, 420);
      ctx.fillStyle = '#fef08a';
      ctx.fillText('THANK YOU FOR PLAYING', w / 2, 463);
      ctx.fillStyle = Math.floor(stageTick / 30) % 2 ? '#94a3b8' : '#ffffff';
      ctx.fillText('クリック / ENTER でタイトルへ', w / 2, 496);
    }
  }
}
