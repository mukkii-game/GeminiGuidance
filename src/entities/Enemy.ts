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

    switch (type) {
      case 'GPT6_LUNA':
        width = 44; height = 44; hp = 1; points = 150; color = '#10a37f'; break;
      case 'DEEPSEEK_FLASH':
        width = 52; height = 44; hp = 1; points = pattern === 'UFO_FLYBY' ? 1000 : 120; color = '#4D6BFE'; break;
      case 'KIMI_MOON':
        width = 46; height = 46; hp = 2; points = 200; color = '#1783FF'; break;
      case 'QWEN_CUBE':
        width = 46; height = 46; hp = 2; points = 180; color = '#6F69F7'; break;
      case 'MISTRAL_FLAME':
        width = 46; height = 46; hp = 1; points = 140; color = '#FF8205'; break;
      case 'CURSOR_PROBE':
        width = 46; height = 46; hp = 1; points = 160; color = '#ffffff'; break;
      case 'GROK_RAIDER':
        width = 50; height = 50; hp = 3; points = 300; color = '#ffffff'; break;
      case 'COPILOT_GLIDER':
        width = 48; height = 48; hp = 2; points = 180; color = '#38bdf8'; break;
      case 'CLAUDE_HAIKU':
        width = 42; height = 42; hp = 1; points = 150; color = '#f87171'; break;
      case 'CLAUDE_SONNET':
        width = 54; height = 54; hp = 3; points = 350; color = '#D97757'; break;
      case 'CLAUDE_OPUS':
        width = 72; height = 72; hp = 6; points = 800; color = '#ea580c'; break;
      case 'PERPLEXITY_SPINNER':
        width = 48; height = 48; hp = 2; points = 200; color = '#22B8CD'; break;
      case 'GPT6_TERRA':
        width = 58; height = 58; hp = 4; points = 500; color = '#38bdf8'; break;
      case 'GPT6_SOL':
        width = 76; height = 76; hp = 8; points = 1200; color = '#fbbf24'; break;
      case 'SPACEX_ROCKET':
        width = 24; height = 76; hp = 12; points = 1000; color = '#ffffff'; break;
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
      vx: pattern === 'UFO_FLYBY' ? 1.3 : 0,
      vy: pattern === 'ROCKET_ASCENT' ? -0.75 : pattern === 'INVADER' || pattern === 'UFO_FLYBY' ? 0 : 0.60,
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

      // Update movement pattern (non-invaders)
      if (e.pattern !== 'INVADER') {
        this.applyPattern(e, canvasWidth, playerX, playerY);
        e.x += e.vx;
        e.y += e.vy;
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

      // Very rare, deliberate bullet firing from heavy non-invader units
      const canShoot = e.type === 'GPT6_SOL' || e.type === 'GPT6_TERRA' || e.type === 'CLAUDE_OPUS' || e.type === 'GROK_RAIDER';
      if (canShoot && onSpawnBullet) {
        e.shootCooldown--;
        if (e.shootCooldown <= 0 && e.y > 60 && e.y < canvasHeight - 160) {
          e.shootCooldown = 400 + Math.floor(Math.random() * 240);
          const bdx = playerX - e.x;
          const bdy = playerY - e.y;
          const bdist = Math.hypot(bdx, bdy) || 1;
          const bspeed = 0.65;
          onSpawnBullet(e.x, e.y, (bdx / bdist) * bspeed, (bdy / bdist) * bspeed);
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
      } else if (e.pattern !== 'INVADER') {
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
    const stepInterval = Math.max(5, Math.floor((invaders.length / this.invaderTotal) * 22));
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
          inv.y += 14;
        }
      } else {
        // Step horizontally!
        for (const inv of invaders) {
          inv.x += this.invaderMarchDir * 7;
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
      case 'UFO_FLYBY': {
        // Horizontal cruise across top
        break;
      }

      case 'TACKLE_DASH': {
        // Linear high-speed body tackle
        break;
      }

      case 'TOROID_SWOOP': {
        if (t < 70) {
          e.vy = 0.70;
          e.vx = 0;
        } else if (t < 130) {
          const progress = (t - 70) / 60;
          const angle = progress * Math.PI;
          const dir = e.x < canvasWidth / 2 ? -1 : 1;
          e.vx = Math.sin(angle) * dir * 1.2;
          e.vy = Math.cos(angle) * 0.7;
        } else {
          e.vy = -0.85;
          e.vx = e.x < canvasWidth / 2 ? -0.4 : 0.4;
        }
        break;
      }

      case 'TORKAN_TRACK_DASH': {
        if (t < 65) {
          e.vy = 0.45;
          e.vx = (playerX - e.x) * 0.022;
        } else if (t < 120) {
          e.vy = 1.35;
          e.vx = 0;
        } else {
          e.vy = 0.85;
        }
        break;
      }

      case 'ZOSHI_REACTIVE_SWOOP': {
        if (t < 50) {
          const dir = e.x < canvasWidth / 2 ? 1 : -1;
          e.vx = dir * 1.3;
          e.vy = 0.55;
        } else {
          e.vx *= 0.98;
          e.vy = 0.80;
        }
        break;
      }

      case 'GALAGA_LOOP': {
        if (t < 50) {
          e.vy = 0.65;
          e.vx = (canvasWidth / 2 - e.x) * 0.015;
        } else if (t < 140) {
          const loopAngle = (t - 50) * 0.07;
          e.vx = Math.cos(loopAngle) * 1.2;
          e.vy = Math.sin(loopAngle) * 0.8 + 0.3;
        } else {
          e.vx = 0;
          e.vy = 0.65;
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
