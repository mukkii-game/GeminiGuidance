import {
  PlayerState,
  GeminiOrb,
  GeminiDropItem,
  EnemyBullet,
  EnemyEntity,
  GroundEntity,
  BossEntity,
  ParticleEffect,
  ExplosionEffect,
  FloatingText,
  GameState,
} from '../types';
import { SpriteSheet } from './Sprites';
import { TerrainEngine } from './Terrain';

export class ArcadeRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private sprites: SpriteSheet;
  private terrain: TerrainEngine;

  private titleLogoImg: HTMLImageElement;
  private titleLogoLoaded: boolean = false;

  private elonPolygonImg: HTMLImageElement;
  private elonPolygonLoaded: boolean = false;

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

  public render(
    state: GameState,
    player: PlayerState,
    geminiOrbs: GeminiOrb[],
    geminiItems: GeminiDropItem[],
    enemyBullets: EnemyBullet[],
    enemies: EnemyEntity[],
    groundTargets: Array<{ entity: GroundEntity; screenY: number }>,
    boss: BossEntity | null,
    particles: ParticleEffect[],
    explosions: ExplosionEffect[],
    floatingTexts: FloatingText[],
    stage: number,
    stageTick: number,
    elonIntroTimer: number = 0
  ): void {
    const ctx = this.ctx;

    // 1. Draw Scrolling Terrain
    this.terrain.render(ctx, stage);

    // 2. Draw Ground Bases (Nvidia, Meta, HuggingFace, Stability AI octagons)
    this.renderGroundTargets(groundTargets);

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
    if (state === 'PLAYING' || state === 'STAGE_CLEAR') {
      this.renderPlayer(player);
    }

    // 9. Draw Explosions & Particle Effects
    this.renderExplosions(explosions);
    this.renderParticles(particles);
    this.renderFloatingTexts(floatingTexts);

    // 10. Boss Dialogue Banner
    if (boss && !boss.defeated && boss.quoteTimer > 0) {
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
    this.renderHUD(player, stage, geminiOrbs, boss);

    // 14. State Overlays (Title, Stage Clear, Game Over, Game Clear)
    this.renderStateOverlays(state, stage, stageTick, player.score);
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
      }
    }
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
      ctx.font = '7px "Press Start 2P", monospace';
      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'center';
      ctx.fillText('ITEM', 0, 22);

      ctx.restore();
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
    }
  }

  // --- Player Ship ---
  private renderPlayer(player: PlayerState): void {
    if (!player.alive) return;
    const ctx = this.ctx;

    // Invulnerability Blink
    if (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 4) % 2 === 0) {
      return;
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
  }

  // --- Autonomous Gemini Orbs (ジェミニ誘導 - Safe to touch!) ---
  private renderGeminiOrbs(orbs: GeminiOrb[], _playerX: number, _playerY: number): void {
    const ctx = this.ctx;

    for (const orb of orbs) {
      // 1. Shimmering Energy Aura (Safe to Player, deadly to enemies!)
      ctx.save();
      const auraColor = orb.level === 3 ? 'rgba(236, 72, 153, 0.28)' : orb.level === 2 ? 'rgba(168, 85, 247, 0.24)' : 'rgba(56, 189, 248, 0.22)';
      const strokeColor = orb.level === 3 ? '#f472b6' : orb.level === 2 ? '#c084fc' : '#38bdf8';
      
      ctx.fillStyle = auraColor;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.radius + 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.radius + 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 2. Motion Trail
      for (let i = 0; i < orb.trail.length; i++) {
        const pt = orb.trail[i];
        ctx.fillStyle = orb.level === 3 ? `rgba(255, 120, 255, ${pt.alpha * 0.4})` : `rgba(56, 189, 248, ${pt.alpha * 0.35})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, (orb.radius * 0.5) * (1 - i / orb.trail.length), 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Gemini Star Sprite (Strictly Upright, No Rotation)
      const key = orb.level === 3 ? 'GEMINI_LV3' : orb.level === 2 ? 'GEMINI_LV2' : 'GEMINI_LV1';
      const sprite = this.sprites.get(key);
      if (sprite) {
        ctx.save();
        ctx.translate(orb.x, orb.y);
        ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
        ctx.restore();
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
      }
    }
  }

  // --- Airborne GenAI Logos & Rockets (Strictly Upright) ---
  private renderEnemies(enemies: EnemyEntity[]): void {
    const ctx = this.ctx;
    for (const e of enemies) {
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
        ctx.font = '6px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SPACEX', 0, 4);
        ctx.restore();

        ctx.restore();
        continue;
      }

      const spriteKey = e.type as string;
      const sprite = this.sprites.get(spriteKey);
      if (sprite) {
        ctx.save();
        ctx.translate(e.x, e.y);

        // Keep strictly upright (no rotation)
        ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);

        // Damage flash if hit
        if (e.hp < e.maxHp && e.maxHp > 1) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.fillRect(-e.width / 2, -e.height / 2, e.width, e.height);
        }

        ctx.restore();
      }
    }
  }

  // --- Stage Bosses ---
  private renderBoss(boss: BossEntity): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(boss.x, boss.y);

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

    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = '#ef4444';
    ctx.textAlign = 'left';
    ctx.fillText('>> BOSS TRANSMISSION <<', 16, 62);

    ctx.font = '11px "DotGothic16", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`「${boss.dialogueQuote}」`, 16, 84);
    ctx.restore();
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
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('[ ELON POLYGON ]', w / 2, faceY + 90);
    }

    // Visor laser sweep animation
    const visorY = faceY + 76 + Math.sin(timer * 0.15) * 4;
    ctx.fillStyle = 'rgba(255, 0, 0, 0.35)';
    ctx.fillRect(faceX, visorY, faceSize, 6);

    // Transmission header banner
    ctx.font = '9px "Press Start 2P", monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText('== INCOMING TRANSMISSION ==', w / 2, 46);

    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = '#ef4444';
    ctx.fillText('EMPEROR ELON MUSK (xAI)', w / 2, 62);

    // Dialogue text box at bottom
    const boxY = 280;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(16, boxY, w - 32, 68);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(16, boxY, w - 32, 68);

    ctx.font = '14px "DotGothic16", monospace';
    ctx.fillStyle = '#fde047';
    ctx.textAlign = 'center';
    ctx.fillText('「わしは　うちゅうのていおう　イーロン」', w / 2, boxY + 34);

    ctx.font = '9px "Press Start 2P", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('I AM THE EMPEROR OF THE UNIVERSE', w / 2, boxY + 54);

    ctx.restore();
  }

  // --- Stage Start Title Banner ---
  private renderStageTitle(stage: number, stageTick: number): void {
    const ctx = this.ctx;
    const w = this.canvas.width;

    const titles: Record<number, string> = {
      1: '一面：チャイナ・シンドローム',
      2: '２面：イーロンズ・ゲート',
      3: '３面：ザ・ファブル',
      4: '４面：魔法使いチャッピー',
    };

    const title = titles[stage] || `STAGE ${stage}`;
    const alpha = Math.min(1.0, stageTick / 20) * Math.max(0, (150 - stageTick) / 30);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 160, w, 44);

    ctx.font = '13px "DotGothic16", monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText(title, w / 2, 188);
    ctx.restore();
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
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    for (const t of texts) {
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
  }

  // --- Retro Arcade HUD ---
  private renderHUD(player: PlayerState, stage: number, geminiOrbs: GeminiOrb[], boss: BossEntity | null): void {
    const ctx = this.ctx;
    const w = this.canvas.width;

    ctx.font = '9px "Press Start 2P", monospace';
    ctx.textAlign = 'left';

    // Top Header: 1UP Score & HIGH Score
    ctx.fillStyle = '#ef4444';
    ctx.fillText('1UP', 16, 18);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(player.score.toString().padStart(6, '0'), 52, 18);

    ctx.fillStyle = '#ef4444';
    ctx.fillText('HIGH', w - 120, 18);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(player.highScore.toString().padStart(6, '0'), w - 74, 18);

    // Bottom Bar: Lives, Stage Indicator, Gemini Power Level
    const btmY = this.canvas.height - 10;

    // Mini Lives Ships
    const shipSprite = this.sprites.get('PLAYER_CENTER');
    if (shipSprite) {
      for (let i = 0; i < player.lives - 1; i++) {
        ctx.drawImage(shipSprite, 16 + i * 16, btmY - 14, 12, 12);
      }
    }

    // Stage Display
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText(`STAGE ${stage}`, w / 2, btmY - 4);

    // Gemini Orb count & MAX Level indicator
    ctx.textAlign = 'right';
    if (geminiOrbs.length > 0) {
      const maxLv = Math.max(...geminiOrbs.map(o => o.level));
      ctx.fillStyle = maxLv === 3 ? '#ec4899' : maxLv === 2 ? '#a855f7' : '#38bdf8';
      ctx.fillText(`GEMINI:Lv.${maxLv} [x${geminiOrbs.length}]`, w - 12, btmY - 4);
    } else {
      ctx.fillStyle = '#64748b';
      ctx.fillText('GEMINI:0', w - 12, btmY - 4);
    }

    // Boss HP Bar
    if (boss && !boss.defeated && boss.y > 0) {
      const barW = 160;
      const barH = 6;
      const barX = (w - barW) / 2;
      const barY = 32;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);

      const hpPercent = Math.max(0, boss.hp / boss.maxHp);
      ctx.fillStyle = hpPercent > 0.3 ? '#ef4444' : '#fbbf24';
      ctx.fillRect(barX, barY, barW * hpPercent, barH);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barW, barH);

      ctx.fillStyle = '#ffffff';
      ctx.font = '7px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(boss.name, w / 2, barY - 4);
    }
  }

  // --- State Overlays ---
  private renderStateOverlays(state: GameState, stage: number, stageTick: number, score: number): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    if (state === 'TITLE') {
      ctx.fillStyle = 'rgba(4, 7, 12, 0.90)';
      ctx.fillRect(0, 0, w, h);

      // 1. Marquee Banner Image from Nano Banana
      if (this.titleLogoLoaded && this.titleLogoImg.complete) {
        const logoW = 320;
        const logoH = 178;
        const logoX = (w - logoW) / 2;
        const logoY = 12;

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(logoX - 1, logoY - 1, logoW + 2, logoH + 2);
        ctx.drawImage(this.titleLogoImg, logoX, logoY, logoW, logoH);
      }

      // 2. Subtitle / Version
      ctx.textAlign = 'center';
      ctx.font = '14px "DotGothic16", monospace';
      ctx.fillStyle = '#67e8f9';
      ctx.fillText('【 ジェミニ誘導 】', w / 2, 204);
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('- 1983 NAMCO STYLE STG -', w / 2, 220);

      // 3. Start Prompt (Blinking)
      if (Math.floor(stageTick / 22) % 2 === 0) {
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillStyle = '#fde047';
        ctx.fillText('TOUCH / CLICK TO START', w / 2, 248);
      } else {
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillStyle = '#854d0e';
        ctx.fillText('INSERT COIN / START', w / 2, 248);
      }

      // 4. Instructions / Rules (Reflecting Latest Mechanics)
      ctx.font = '10px "DotGothic16", monospace';
      ctx.fillStyle = '#22c55e';
      ctx.fillText('★ ジェミニは自機に当たっても安全！', w / 2, 272);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText('編隊を倒すとGeminiロゴが出現！ゆっくり落下', w / 2, 290);
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('自機で取れば【追加】/ ジェミニで叩けば【強化】！', w / 2, 308);
      ctx.fillStyle = '#fef08a';
      ctx.fillText('倒せない敵は跳ね返り、倒した時はそのまま貫通！', w / 2, 326);
      ctx.fillStyle = '#ec4899';
      ctx.fillText('敵の白弾はジェミニで消滅！ジェミニは止まらない！', w / 2, 344);

      // Separator Line
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, 360);
      ctx.lineTo(w - 20, 360);
      ctx.stroke();

      // 5. Asset Attribution (Required by User)
      ctx.font = '10px "DotGothic16", monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('【 アセット・素材提供クレジット 】', w / 2, 378);

      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('■ BGM音源: 魔王魂 (maou.audio)', w / 2, 396);
      ctx.fillText('■ 効果音: 効果音ラボ (soundeffect-lab.info)', w / 2, 414);
      ctx.fillText('■ メインロゴ: NANO BANANA', w / 2, 432);
      ctx.fillText('■ 敵対勢力: GenAI Official Logos (2026)', w / 2, 450);

      // Legal disclaimer
      ctx.font = '8px "DotGothic16", monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('※本作は非営利的パロディ作品であり、各社商標は各権利者に帰属します。', w / 2, 474);

      // Controls guide
      ctx.fillStyle = '#64748b';
      ctx.fillText('📱 1本指ドラッグで移動・誘導スイング', w / 2, 498);
      ctx.fillText('💻 PC: マウスまたはWASD / 矢印キー移動', w / 2, 514);

      // Copyright
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = '#ef4444';
      ctx.fillText('(C) 2026 MUKKII ARCADE SYSTEM', w / 2, 532);

    } else if (state === 'STAGE_CLEAR') {
      ctx.font = '14px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#22c55e';
      ctx.fillText(`STAGE ${stage} CLEARED!`, w / 2, h * 0.45);
      ctx.fillStyle = '#fef08a';
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillText('GET READY FOR NEXT BATTLE...', w / 2, h * 0.55);

    } else if (state === 'GAME_OVER') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, w, h);

      ctx.font = '16px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ef4444';
      ctx.fillText('GAME OVER', w / 2, h * 0.45);

      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`FINAL SCORE: ${score}`, w / 2, h * 0.55);

      if (Math.floor(stageTick / 25) % 2 === 0) {
        ctx.fillStyle = '#fef08a';
        ctx.fillText('TOUCH / CLICK TO RETRY', w / 2, h * 0.68);
      }

    } else if (state === 'GAME_CLEAR') {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
      ctx.fillRect(0, 0, w, h);

      ctx.font = '15px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ec4899';
      ctx.fillText('ALL STAGES CLEARED!', w / 2, h * 0.35);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillText('GPT-6 ASTRA DESTROYED!', w / 2, h * 0.45);
      ctx.fillText('GEMINI ORBIT SUPREME!', w / 2, h * 0.52);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(`VICTORY SCORE: ${score}`, w / 2, h * 0.62);

      if (Math.floor(stageTick / 25) % 2 === 0) {
        ctx.fillStyle = '#fef08a';
        ctx.fillText('THANK YOU FOR PLAYING!', w / 2, h * 0.75);
      }
    }
  }
}
