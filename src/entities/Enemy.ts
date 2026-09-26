import { EnemyEntity, EnemyType, MovementPattern } from '../types';

export class EnemyManager {
  public enemies: EnemyEntity[] = [];
  private enemyCounter: number = 0;

  // Space Invaders Group Dynamics
  public invaderMarchDir: number = 1; // 1 = right, -1 = left
  public invaderStepTimer: number = 0;
  public invaderTotal: number = 15;
  public invaderShootCooldown: number = 90;

  public spawn(
    type: EnemyType,
    x: number,
    y: number,
    pattern: MovementPattern = 'TOROID_SWOOP',
    formationId?: string,
    customHp?: number
  ): EnemyEntity {
    let width = 46;
    let height = 46;
    let hp = 1;
    let points = 100;
    let color = '#38bdf8';
    let collisionType: 'PENETRATE' | 'REFLECT' = 'PENETRATE';
    let mass: number = 2.0;

    switch (type) {
      case 'GPT6_LUNA':
        width = 44; height = 44; hp = 1; points = 150; color = '#10a37f'; collisionType = 'PENETRATE'; mass = 1.0; break;
      case 'DEEPSEEK_FLASH':
        width = 52; height = 44; hp = 1; points = pattern === 'UFO_FLYBY' ? 1000 : 120; color = '#4D6BFE'; collisionType = 'PENETRATE'; mass = 1.0; break;
      case 'KIMI_MOON':
        width = 46; height = 46; hp = 2; points = 200; color = '#1783FF'; collisionType = 'PENETRATE'; mass = 2.0; break;
      case 'QWEN_CUBE':
        width = 46; height = 46; hp = 2; points = 180; color = '#6F69F7'; collisionType = 'REFLECT'; mass = 3.0; break;
      case 'MISTRAL_FLAME':
        width = 46; height = 46; hp = 1; points = 140; color = '#FF8205'; collisionType = 'PENETRATE'; mass = 1.0; break;
      case 'CURSOR_PROBE':
        width = 46; height = 46; hp = 1; points = 160; color = '#ffffff'; collisionType = 'REFLECT'; mass = 1.0; break;
      case 'GROK_RAIDER':
        width = 50; height = 50; hp = 3; points = 300; color = '#ffffff'; collisionType = 'REFLECT'; mass = 3.0; break;
      case 'COPILOT_GLIDER':
        width = 48; height = 48; hp = 2; points = 180; color = '#38bdf8'; collisionType = 'PENETRATE'; mass = 2.0; break;
      case 'CLAUDE_HAIKU':
        width = 42; height = 42; hp = 1; points = 150; color = '#f87171'; collisionType = 'PENETRATE'; mass = 1.0; break;
      case 'CLAUDE_SONNET':
        width = 54; height = 54; hp = 3; points = 350; color = '#D97757'; collisionType = 'PENETRATE'; mass = 3.0; break;
      case 'CLAUDE_OPUS':
        width = 72; height = 72; hp = 6; points = 800; color = '#ea580c'; collisionType = 'REFLECT'; mass = 999; break;
      case 'PERPLEXITY_SPINNER':
        width = 48; height = 48; hp = 2; points = 200; color = '#22B8CD'; collisionType = 'PENETRATE'; mass = 2.0; break;
      case 'GPT6_TERRA':
        width = 58; height = 58; hp = 4; points = 500; color = '#38bdf8'; collisionType = 'PENETRATE'; mass = 3.0; break;
      case 'GPT6_SOL':
        width = 76; height = 76; hp = 8; points = 1200; color = '#fbbf24'; collisionType = 'PENETRATE'; mass = 5.0; break;
      case 'SPACEX_ROCKET':
        width = 24; height = 76; hp = 12; points = 1000; color = '#ffffff'; collisionType = 'REFLECT'; mass = 999; break;
    }

    if (customHp !== undefined) {
      hp = customHp;
    }

    const enemy: EnemyEntity = {
      id: `enemy_${++this.enemyCounter}`,
      type,
      formationId,
      x,
      y,
      vx: pattern === 'UFO_FLYBY' ? 0.70 : 0,
      vy: pattern === 'ROCKET_ASCENT' ? -0.42 : pattern === 'INVADER' || pattern === 'UFO_FLYBY' ? 0 : 0.32,
      width,
      height,
      hp,
      maxHp: hp,
      age: 0,
      pattern,
      points,
      color,
      angle: 0, // LOGOS NEVER ROTATE! Always stay upright.
      shootCooldown: 320 + Math.floor(Math.random() * 200),
      collisionType,
      mass,
      knockbackVx: 0,
      knockbackVy: 0,
      orbitCenterX: x,
      orbitCenterY: y,
      targetX: x,
      targetY: y,
    };

    this.enemies.push(enemy);
    return enemy;
  }

  /**
   * Spawn authentic Space Invaders Grid (5 columns x 3 rows)
   * Featuring Mistral "M" pixel logo invaders and Qwen crystal invaders!
   */
  public spawnInvaderGrid(canvasWidth: number): void {
    const cols = 5;
    const rows = 3;
    const stepX = 52;
    const stepY = 46;
    const startX = (canvasWidth - (cols - 1) * stepX) / 2;
    const startY = 70;

    this.invaderMarchDir = 1;
    this.invaderStepTimer = 0;
    this.invaderTotal = cols * rows;

    for (let r = 0; r < rows; r++) {
      const type: EnemyType = r === 0 ? 'QWEN_CUBE' : 'MISTRAL_FLAME';
      for (let c = 0; c < cols; c++) {
        const x = startX + c * stepX;
        const y = startY + r * stepY;
        this.spawn(type, x, y, 'INVADER', 'invaders_wave', r === 0 ? 2 : 1);
      }
    }
  }

  /**
   * Spawn DeepSeek Whale Mystery UFO flying across the top!
   */
  public spawnDeepSeekUfo(canvasWidth: number, fromLeft: boolean = true): EnemyEntity {
    const startX = fromLeft ? -35 : canvasWidth + 35;
    const ufo = this.spawn('DEEPSEEK_FLASH', startX, 44, 'UFO_FLYBY', 'ufo_wave', 1);
    ufo.vx = fromLeft ? 1.35 : -1.35;
    ufo.vy = 0;
    return ufo;
  }

  /**
   * Spawn boss escort minion performing a direct high-speed body tackle (体当たり)
   */
  public spawnTackleMinion(type: EnemyType, x: number, y: number, vx: number, vy: number): EnemyEntity {
    const minion = this.spawn(type, x, y, 'TACKLE_DASH', 'minion_tackle', 1);
    minion.vx = vx;
    minion.vy = vy;
    return minion;
  }

  public clear(): void {
    this.enemies = [];
  }

  public update(
    canvasWidth: number,
    canvasHeight: number,
    playerX: number,
    playerY: number,
    onSpawnBullet?: (x: number, y: number, vx: number, vy: number) => void
  ): void {
    // 1. Space Invaders Collective Group Stepping
    this.updateInvaderFlock(canvasWidth, onSpawnBullet);

    // 2. Individual Enemy Updates
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.age++;
      if (e.hitCooldown && e.hitCooldown > 0) {
        e.hitCooldown--;
      }

      // Update movement pattern (non-invaders)
      if (e.pattern !== 'INVADER') {
        this.applyPattern(e, canvasWidth, playerX, playerY);
        e.x += e.vx;
        e.y += e.vy;
      }

      // Apply and decay knockback impulses from Gemini impact
      if (e.knockbackVx !== undefined && (Math.abs(e.knockbackVx) > 0.05 || Math.abs(e.knockbackVy || 0) > 0.05)) {
        e.x += e.knockbackVx;
        e.y += (e.knockbackVy || 0);
        e.knockbackVx *= 0.86;
        e.knockbackVy = (e.knockbackVy || 0) * 0.86;
      }

      // Keep logos strictly upright (no rotation)
      e.angle = 0;

      // Anti-overlap physical separation repulsion (except for locked Invader grid)
      if (e.pattern !== 'INVADER') {
        for (let j = i - 1; j >= 0; j--) {
          const other = this.enemies[j];
          if (other.pattern === 'ROCKET_ASCENT' || e.pattern === 'ROCKET_ASCENT' || other.pattern === 'INVADER') continue;
          const minDist = (e.width + other.width) * 0.52;
          const dx = e.x - other.x;
          const dy = e.y - other.y;
          const dist = Math.hypot(dx, dy);
          if (dist < minDist && dist > 0.001) {
            const overlap = (minDist - dist) * 0.5;
            const nx = dx / dist;
            const ny = dy / dist;
            e.x += nx * overlap;
            e.y += ny * overlap * 0.5;
            other.x -= nx * overlap;
            other.y -= ny * overlap * 0.5;
          }
        }
      }

      // Specialized bullet firing
      if (onSpawnBullet) {
        if (e.pattern === 'BARRAGE_DRIFT') {
          e.shootCooldown--;
          if (e.shootCooldown <= 0 && e.y > 40 && e.y < canvasHeight - 120) {
            e.shootCooldown = 150 + Math.floor(Math.random() * 50);
            const baseAngle = Math.atan2(playerY - e.y, playerX - e.x);
            // 3-way fan spread
            for (const offset of [-0.35, 0, 0.35]) {
              const ang = baseAngle + offset;
              const spd = 0.36;
              onSpawnBullet(e.x, e.y + 12, Math.cos(ang) * spd, Math.sin(ang) * spd);
            }
          }
        } else if (e.pattern === 'SNIPER_HOVER') {
          e.shootCooldown--;
          if (e.shootCooldown <= 0 && e.y > 30) {
            e.shootCooldown = 140 + Math.floor(Math.random() * 60);
            const bdx = playerX - e.x;
            const bdy = playerY - e.y;
            const bdist = Math.hypot(bdx, bdy) || 1;
            const spd = 0.52; // sniper aimed shot
            onSpawnBullet(e.x, e.y + 16, (bdx / bdist) * spd, (bdy / bdist) * spd);
          }
        } else {
          const canShoot = e.type === 'GPT6_SOL' || e.type === 'GPT6_TERRA' || e.type === 'CLAUDE_OPUS' || e.type === 'GROK_RAIDER';
          if (canShoot) {
            e.shootCooldown--;
            if (e.shootCooldown <= 0 && e.y > 60 && e.y < canvasHeight - 160) {
              e.shootCooldown = 400 + Math.floor(Math.random() * 240);
              const bdx = playerX - e.x;
              const bdy = playerY - e.y;
              const bdist = Math.hypot(bdx, bdy) || 1;
              const bspeed = 0.35;
              onSpawnBullet(e.x, e.y, (bdx / bdist) * bspeed, (bdy / bdist) * bspeed);
            }
          }
        }
      }

      // Despawn bounds
      if (e.pattern === 'ROCKET_ASCENT') {
        if (e.y < -120) {
          this.enemies.splice(i, 1);
        }
      } else if (e.pattern === 'UFO_FLYBY') {
        if (e.x < -60 || e.x > canvasWidth + 60) {
          this.enemies.splice(i, 1);
        }
      } else if (e.pattern !== 'INVADER' && e.pattern !== 'DUMMY') {
        if (e.y > canvasHeight + 100 || e.y < -160 || e.x < -120 || e.x > canvasWidth + 120) {
          this.enemies.splice(i, 1);
        }
      }
    }
  }

  /**
   * Space Invaders authentic marching step and speed-up calculation
   */
  private updateInvaderFlock(
    canvasWidth: number,
    onSpawnBullet?: (x: number, y: number, vx: number, vy: number) => void
  ): void {
    const invaders = this.enemies.filter(e => e.pattern === 'INVADER');
    if (invaders.length === 0) return;

    // Classic Invaders acceleration: fewer enemies -> faster tempo!
    const stepInterval = Math.max(8, Math.floor((invaders.length / this.invaderTotal) * 36));
    this.invaderStepTimer++;

    if (this.invaderStepTimer >= stepInterval) {
      this.invaderStepTimer = 0;

      // Find boundaries
      let minX = 999;
      let maxX = -999;
      for (const inv of invaders) {
        if (inv.x < minX) minX = inv.x;
        if (inv.x > maxX) maxX = inv.x;
      }

      let shouldDrop = false;
      if (this.invaderMarchDir === 1 && maxX >= canvasWidth - 28) {
        shouldDrop = true;
        this.invaderMarchDir = -1;
      } else if (this.invaderMarchDir === -1 && minX <= 28) {
        shouldDrop = true;
        this.invaderMarchDir = 1;
      }

      if (shouldDrop) {
        // Drop down a row!
        for (const inv of invaders) {
          inv.y += 12;
        }
      } else {
        // Step horizontally!
        for (const inv of invaders) {
          inv.x += this.invaderMarchDir * 4;
        }
      }
    }

    // Occasional bullet drop from random bottom invader
    this.invaderShootCooldown--;
    if (this.invaderShootCooldown <= 0 && onSpawnBullet) {
      this.invaderShootCooldown = 110 + Math.floor(Math.random() * 80);
      const randomInv = invaders[Math.floor(Math.random() * invaders.length)];
      if (randomInv) {
        onSpawnBullet(randomInv.x, randomInv.y + 16, 0, 0.95); // straight down white bullet
      }
    }
  }

  /**
   * Flight Patterns
   */
  private applyPattern(e: EnemyEntity, canvasWidth: number, playerX: number, _playerY: number): void {
    const t = e.age;

    switch (e.pattern) {
      case 'DUMMY': {
        // Stationary target dummy with gentle hover bobbing
        e.vx = 0;
        e.vy = Math.sin(t * 0.05) * 0.15;
        break;
      }

      case 'UFO_FLYBY': {
        // Horizontal cruise across top
        break;
      }

      case 'TACKLE_DASH': {
        // Linear high-speed body tackle
        break;
      }

      case 'BARRAGE_DRIFT': {
        // Enters to targetY (default ~100) and hovers with sinusoidal drift
        const targetY = e.targetY ?? 100;
        if (e.y < targetY) {
          e.vy = 0.35;
          e.vx = 0;
        } else {
          e.vy = Math.sin(t * 0.04) * 0.12;
          e.vx = Math.sin(t * 0.025) * 0.38;
        }
        break;
      }

      case 'SNIPER_HOVER': {
        // Stays high at y ~ 52, slides horizontally
        const targetY = e.targetY ?? 52;
        if (e.y < targetY) {
          e.vy = 0.28;
          e.vx = 0;
        } else {
          e.vy = 0;
          e.vx = Math.sin(t * 0.03) * 0.45;
        }
        break;
      }

      case 'SHIELD_FORWARD': {
        // Heavy advancing bulwark
        const targetY = e.targetY ?? 150;
        if (e.y < targetY) {
          e.vy = 0.22;
        } else {
          e.vy = Math.sin(t * 0.03) * 0.08;
        }
        e.vx = Math.sin(t * 0.02) * 0.18;
        break;
      }

      case 'RUSH_DIVE': {
        // Phase 1 (t < 40): Hover at spawn, lock onto player vector
        // Phase 2 (t >= 40): Accelerate in straight line towards target
        if (t < 40) {
          e.vx = 0;
          e.vy = 0.08;
          e.targetX = playerX;
          e.targetY = _playerY;
        } else if (t === 40) {
          const dx = (e.targetX ?? playerX) - e.x;
          const dy = (e.targetY ?? _playerY) - e.y;
          const dist = Math.hypot(dx, dy) || 1;
          const rushSpeed = 1.15;
          e.vx = (dx / dist) * rushSpeed;
          e.vy = (dy / dist) * rushSpeed;
        }
        // If dives offscreen, loops back from top
        if (e.y > 540 + 40) {
          e.y = -30;
          e.x = Math.random() * (canvasWidth - 80) + 40;
          e.age = 0;
          e.vx = 0;
          e.vy = 0;
        }
        break;
      }

      case 'ORBIT_BIT': {
        // Orbits around (orbitCenterX, orbitCenterY) with radius 48px
        const cx = e.orbitCenterX ?? (canvasWidth / 2);
        const cy = e.orbitCenterY ?? 130;
        const ang = (e.angle || 0) + 0.035;
        e.angle = ang;
        const r = 48;
        e.x = cx + Math.cos(ang) * r;
        e.y = cy + Math.sin(ang) * r;
        e.vx = 0;
        e.vy = 0;
        break;
      }

      case 'TOROID_SWOOP': {
        if (t < 70) {
          e.vy = 0.38;
          e.vx = 0;
        } else if (t < 130) {
          const progress = (t - 70) / 60;
          const angle = progress * Math.PI;
          const dir = e.x < canvasWidth / 2 ? -1 : 1;
          e.vx = Math.sin(angle) * dir * 0.65;
          e.vy = Math.cos(angle) * 0.38;
        } else {
          e.vy = -0.45;
          e.vx = e.x < canvasWidth / 2 ? -0.22 : 0.22;
        }
        break;
      }

      case 'TORKAN_TRACK_DASH': {
        if (t < 65) {
          e.vy = 0.25;
          e.vx = (playerX - e.x) * 0.012;
        } else if (t < 120) {
          e.vy = 0.70;
          e.vx = 0;
        } else {
          e.vy = 0.45;
        }
        break;
      }

      case 'ZOSHI_REACTIVE_SWOOP': {
        if (t < 50) {
          const dir = e.x < canvasWidth / 2 ? 1 : -1;
          e.vx = dir * 0.70;
          e.vy = 0.30;
        } else {
          e.vx *= 0.98;
          e.vy = 0.42;
        }
        break;
      }

      case 'GALAGA_LOOP': {
        if (t < 50) {
          e.vy = 0.35;
          e.vx = (canvasWidth / 2 - e.x) * 0.008;
        } else if (t < 140) {
          const loopAngle = (t - 50) * 0.045;
          e.vx = Math.cos(loopAngle) * 0.65;
          e.vy = Math.sin(loopAngle) * 0.42 + 0.18;
        } else {
          e.vx = 0;
          e.vy = 0.35;
        }
        break;
      }

      case 'SPAROID_CRUISE': {
        e.vy = 0.55;
        e.vx = Math.sin(t * 0.03) * 0.6;
        break;
      }

      case 'ROCKET_ASCENT': {
        e.vy = -0.75;
        e.vx = 0;
        break;
      }

      default: {
        e.vy = 0.60;
        break;
      }
    }
  }
}
