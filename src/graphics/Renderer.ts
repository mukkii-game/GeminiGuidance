import {
  PlayerState,
  BlasterBomb,
  GeminiOrb,
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

  constructor(canvas: HTMLCanvasElement, sprites: SpriteSheet, terrain: TerrainEngine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
    this.sprites = sprites;
    this.terrain = terrain;
  }

  public render(
    state: GameState,
    player: PlayerState,
    bombs: BlasterBomb[],
    geminiOrbs: GeminiOrb[],
    enemies: EnemyEntity[],
    groundTargets: Array<{ entity: GroundEntity; screenY: number }>,
    boss: BossEntity | null,
    particles: ParticleEffect[],
    explosions: ExplosionEffect[],
    floatingTexts: FloatingText[],
    stage: number,
    stageTick: number
  ): void {
    const ctx = this.ctx;

    // 1. Draw Scrolling Terrain
    this.terrain.render(ctx, stage);

    // 2. Draw Ground Targets
    this.renderGroundTargets(groundTargets);

    // 3. Draw Blaster Bombs (Shadows & Airborne projectiles)
    this.renderBlasterBombs(bombs);

    // 4. Draw Boss (if active)
    if (boss && !boss.defeated) {
      this.renderBoss(boss);
    }

    // 5. Draw Enemies (Airborne GenAI Logos)
    this.renderEnemies(enemies);

    // 6. Draw Gemini Orbs & Tether Chains (ジェミニ誘導)
    this.renderGeminiOrbs(geminiOrbs, player.x, player.y);

    // 7. Draw Player Ship & Sight Reticle
    if (state === 'PLAYING' || state === 'STAGE_CLEAR') {
      this.renderPlayer(player);
    }

    // 8. Draw Explosions & Particle Effects
    this.renderExplosions(explosions);
    this.renderParticles(particles);
    this.renderFloatingTexts(floatingTexts);

    // 9. Draw Arcade HUD
    this.renderHUD(player, stage, geminiOrbs, boss);

    // 10. State Overlays (Title, Stage Clear, Game Over, Game Clear)
    this.renderStateOverlays(state, stage, stageTick, player.score);
  }

  // --- Ground Targets ---
  private renderGroundTargets(groundTargets: Array<{ entity: GroundEntity; screenY: number }>): void {
    const ctx = this.ctx;
    for (const { entity: g, screenY } of groundTargets) {
      if (!g.revealed && g.type === 'SOL_CITADEL') continue;

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

  // --- Blaster Bombs ---
  private renderBlasterBombs(bombs: BlasterBomb[]): void {
    const ctx = this.ctx;
    const sprite = this.sprites.get('BLASTER_BOMB');

    for (const b of bombs) {
      // Ground Shadow moving directly along the ground
      const groundX = b.startX + (b.targetX - b.startX) * b.progress;
      const groundY = b.startY + (b.targetY - b.startY) * b.progress;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.ellipse(groundX, groundY, 4 * b.progress + 2, 2.5 * b.progress + 1, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bomb airborne projectile
      if (sprite) {
        const scale = 0.8 + Math.sin(b.progress * Math.PI) * 0.4;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.scale(scale, scale);
        ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
        ctx.restore();
      }
    }
  }

  // --- Player Ship & Sight Reticle ---
  private renderPlayer(player: PlayerState): void {
    if (!player.alive) return;
    const ctx = this.ctx;

    // Invulnerability Blink
    if (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 4) % 2 === 0) {
      // Skip render for flicker effect
    } else {
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

    // Forward Ground Sight Reticle
    const sightSprite = this.sprites.get('SIGHT');
    if (sightSprite) {
      ctx.drawImage(sightSprite, player.sightX - sightSprite.width / 2, player.sightY - sightSprite.height / 2);
    }
  }

  // --- Gemini Orbs & Tether Chains (ジェミニ誘導) ---
  private renderGeminiOrbs(orbs: GeminiOrb[], playerX: number, playerY: number): void {
    const ctx = this.ctx;

    for (const orb of orbs) {
      // 1. Radiant Energy Tether (Connecting Solvalou to the Gemini Orb)
      ctx.save();
      const dist = Math.hypot(playerX - orb.x, playerY - orb.y);
      const segments = Math.max(3, Math.floor(dist / 14));

      ctx.strokeStyle = orb.level === 3 ? 'rgba(200, 240, 255, 0.7)' : orb.level === 2 ? 'rgba(160, 100, 255, 0.5)' : 'rgba(80, 160, 255, 0.4)';
      ctx.lineWidth = orb.level === 3 ? 2.5 : orb.level === 2 ? 1.8 : 1.2;

      ctx.beginPath();
      ctx.moveTo(playerX, playerY);
      for (let s = 1; s < segments; s++) {
        const t = s / segments;
        const px = playerX + (orb.x - playerX) * t;
        const py = playerY + (orb.y - playerY) * t;
        // Subtle electric jitter
        const jitter = (Math.random() - 0.5) * (orb.level === 3 ? 4 : 2);
        ctx.lineTo(px + jitter, py + jitter);
      }
      ctx.lineTo(orb.x, orb.y);
      ctx.stroke();
      ctx.restore();

      // 2. Motion Trail
      for (let i = 0; i < orb.trail.length; i++) {
        const pt = orb.trail[i];
        ctx.fillStyle = orb.level === 3 ? `rgba(255, 100, 255, ${pt.alpha * 0.4})` : `rgba(66, 133, 244, ${pt.alpha * 0.35})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, (orb.radius * 0.5) * (1 - i / orb.trail.length), 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Gemini Star Sprite
      const key = orb.level === 3 ? 'GEMINI_LV3' : orb.level === 2 ? 'GEMINI_LV2' : 'GEMINI_LV1';
      const sprite = this.sprites.get(key);
      if (sprite) {
        ctx.save();
        ctx.translate(orb.x, orb.y);

        // Self-rotation based on velocity direction
        const rot = Math.atan2(orb.vy, orb.vx) + Math.PI / 4;
        ctx.rotate(rot);

        ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
        ctx.restore();
      }

      // 4. Fusion Burst Flare Animation
      if (orb.fuseTimer > 0) {
        ctx.save();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, (25 - orb.fuseTimer) * 1.8 + orb.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  // --- Airborne GenAI Logos ---
  private renderEnemies(enemies: EnemyEntity[]): void {
    const ctx = this.ctx;
    for (const e of enemies) {
      let spriteKey = e.type as string;
      if (e.type === 'CLAUDE_FABLE' || e.type === 'CLAUDE_MYTHOS') {
        spriteKey = 'CLAUDE_OCTAGON';
      }

      const sprite = this.sprites.get(spriteKey) || this.sprites.get('MINI_CLONE');
      if (sprite) {
        ctx.save();
        ctx.translate(e.x, e.y);

        // Subtle rotation matching velocity
        if (Math.abs(e.vx) > 0.3) {
          ctx.rotate(e.vx * 0.08);
        }

        ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);

        // Damage flash if hit
        if (e.hp < e.maxHp && e.maxHp > 1) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.fillRect(-e.width / 2, -e.height / 2, e.width, e.height);
        }

        ctx.restore();
      }
    }
  }

  // --- Stage Boss ---
  private renderBoss(boss: BossEntity): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(boss.x, boss.y);

    if (boss.type === 'STAGE1_DEEPSEEK_KIMI') {
      // Stage 1: DeepSeek Whale + Kimi Moon Dual Core
      // Connecting cyber frame
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-55, -12, 110, 24);
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.strokeRect(-55, -12, 110, 24);

      // DeepSeek side
      const dsSprite = this.sprites.get('DEEPSEEK_FLASH');
      if (dsSprite) {
        ctx.drawImage(dsSprite, -52, -14, 32, 28);
      }

      // Kimi Moon side
      const kimiSprite = this.sprites.get('KIMI_MOON');
      if (kimiSprite) {
        ctx.drawImage(kimiSprite, 22, -14, 28, 28);
      }

      // Central Qwen Core
      const qwenSprite = this.sprites.get('QWEN_CUBE');
      if (qwenSprite) {
        ctx.drawImage(qwenSprite, -14, -14, 28, 28);
      }

    } else if (boss.type === 'STAGE2_GROK_CURSOR') {
      // Stage 2: Grok Monolith & Cursor Dual Shield
      // Grok Central Hull
      ctx.fillStyle = '#000000';
      ctx.fillRect(-28, -25, 56, 50);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-22, -22); ctx.lineTo(22, 22);
      ctx.moveTo(22, -22); ctx.lineTo(-22, 22);
      ctx.stroke();

      // Dual Cursor Shield Wings { }
      const curSprite = this.sprites.get('CURSOR_PROBE');
      if (curSprite) {
        ctx.drawImage(curSprite, -64, -18, 30, 30);
        ctx.drawImage(curSprite, 34, -18, 30, 30);
      }

      // Thrust flame
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-12, 25, 24, 8 + Math.random() * 8);

    } else if (boss.type === 'STAGE3_CLAUDE_OPUS') {
      // Stage 3: Claude Opus 5.5 Octagon Fortress
      // Outer Rotating Alignment Ring
      ctx.save();
      ctx.rotate(boss.timer * 0.02);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 4;
      ctx.strokeRect(-55, -55, 110, 110);
      ctx.restore();

      // Massive Central Opus Octagon
      const clSprite = this.sprites.get('CLAUDE_OCTAGON');
      if (clSprite) {
        ctx.drawImage(clSprite, -45, -45, 90, 90);
      }

    } else {
      // Stage 4: GPT-6 Astra Andor Genesis
      // Colossal Hexagonal Mothership Body
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

      // 4 Dock Bays (Luna, Terra, Sol)
      const lunaSprite = this.sprites.get('GPT6_LUNA');
      const terraSprite = this.sprites.get('GPT6_TERRA');
      const solSprite = this.sprites.get('GPT6_SOL');

      if (lunaSprite) ctx.drawImage(lunaSprite, -75, -42, 24, 24);
      if (terraSprite) ctx.drawImage(terraSprite, 52, -42, 28, 28);
      if (solSprite) ctx.drawImage(solSprite, -18, 24, 36, 36);

      // Pulsating ASTRA Central Core
      const corePulse = 22 + Math.sin(boss.timer * 0.1) * 3;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, corePulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, corePulse + 4, 0, Math.PI * 2);
      ctx.stroke();
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

  // --- Explosions, Particles, Floating Texts ---
  private renderExplosions(explosions: ExplosionEffect[]): void {
    const ctx = this.ctx;
    for (const exp of explosions) {
      const progress = exp.timer / exp.duration;
      const r = exp.radius + (exp.maxRadius - exp.radius) * progress;
      const alpha = 1.0 - progress;

      ctx.save();
      ctx.translate(exp.x, exp.y);

      if (exp.isGround) {
        // Ground Blast: Expanding crater ring + smoke
        ctx.strokeStyle = `rgba(255, 180, 50, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.2, r * 0.8, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Air Explosion: White fireball flash + blast rings
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(255, 80, 0, ${alpha})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
      }
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
      ctx.fillText(`GEMINI:Lv.${maxLv}`, w - 12, btmY - 4);
    } else {
      ctx.fillStyle = '#64748b';
      ctx.fillText('GEMINI:0', w - 12, btmY - 4);
    }

    // Boss HP Bar (When boss is active)
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
      // Arcade Title Screen (Attract Mode)
      ctx.fillStyle = 'rgba(4, 7, 12, 0.75)';
      ctx.fillRect(0, 0, w, h);

      // Title
      ctx.font = '16px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('GEMINI', w / 2, h * 0.28);
      ctx.fillStyle = '#c084fc';
      ctx.fillText('GUIDANCE', w / 2, h * 0.35);

      // Japanese Subtitle
      ctx.font = '12px "DotGothic16", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('ジェミニ誘導 - 1983 RETRO STG', w / 2, h * 0.42);

      // Start Prompt (Blinking)
      if (Math.floor(stageTick / 25) % 2 === 0) {
        ctx.font = '9px "Press Start 2P", monospace';
        ctx.fillStyle = '#fef08a';
        ctx.fillText('TOUCH / CLICK TO START', w / 2, h * 0.58);
      }

      // Attract info & credits
      ctx.font = '7px "Press Start 2P", monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('NO AIR BULLETS! BOMB GROUND', w / 2, h * 0.68);
      ctx.fillText('TO RELEASE GEMINI ORBS', w / 2, h * 0.73);
      ctx.fillText('SLING & MERGE ORBS TO WIN!', w / 2, h * 0.78);

      ctx.fillStyle = '#ef4444';
      ctx.fillText('(C) 2026 MUKKII ARCADE SYSTEM', w / 2, h * 0.90);

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
