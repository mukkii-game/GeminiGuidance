import { EnemyEntity, EnemyType, MovementPattern } from '../types';

export class EnemyManager {
  public enemies: EnemyEntity[] = [];
  private enemyCounter: number = 0;

  public spawn(
    type: EnemyType,
    x: number,
    y: number,
    pattern: MovementPattern = 'STRAIGHT_DOWN',
    customHp?: number
  ): EnemyEntity {
    let width = 44;
    let height = 44;
    let hp = 1;
    let points = 100;
    let color = '#38bdf8';

    // Prominent, large logo sizes for authentic readability
    switch (type) {
      case 'GPT6_LUNA':
        width = 44; height = 44; hp = 1; points = 150; color = '#10a37f'; break;
      case 'DEEPSEEK_FLASH':
        width = 52; height = 44; hp = 1; points = 120; color = '#4D6BFE'; break;
      case 'KIMI_MOON':
        width = 46; height = 46; hp = 2; points = 200; color = '#1783FF'; break;
      case 'QWEN_CUBE':
        width = 46; height = 46; hp = 2; points = 180; color = '#c084fc'; break;
      case 'MISTRAL_FLAME':
        width = 46; height = 46; hp = 1; points = 140; color = '#ea580c'; break;
      case 'CURSOR_PROBE':
        width = 46; height = 46; hp = 2; points = 220; color = '#d6d5d2'; break;
      case 'GROK_RAIDER':
        width = 50; height = 50; hp = 3; points = 350; color = '#ffffff'; break;
      case 'COPILOT_GLIDER':
        width = 48; height = 48; hp = 1; points = 130; color = '#3b82f6'; break;
      case 'CLAUDE_HAIKU':
        width = 42; height = 42; hp = 1; points = 150; color = '#fca5a5'; break;
      case 'CLAUDE_SONNET':
        width = 54; height = 54; hp = 3; points = 350; color = '#D97757'; break;
      case 'CLAUDE_OPUS':
        width = 72; height = 72; hp = 8; points = 800; color = '#ea580c'; break;
      case 'PERPLEXITY_SPINNER':
        width = 48; height = 48; hp = 2; points = 200; color = '#22B8CD'; break;
      case 'GPT6_TERRA':
        width = 58; height = 58; hp = 6; points = 600; color = '#38bdf8'; break;
      case 'GPT6_SOL':
        width = 76; height = 76; hp = 12; points = 1200; color = '#fbbf24'; break;
      case 'MINI_CLONE':
        width = 12; height = 12; hp = 1; points = 20; color = '#ffffff'; break;
    }

    if (customHp !== undefined) hp = customHp;

    const enemy: EnemyEntity = {
      id: `enemy_${++this.enemyCounter}`,
      type,
      x,
      y,
      vx: 0,
      vy: 0.55, // Calmer, stately descent
      width,
      height,
      hp,
      maxHp: hp,
      age: 0,
      pattern,
      points,
      color,
      angle: 0,
      shootCooldown: 240 + Math.floor(Math.random() * 180),
    };

    this.enemies.push(enemy);
    return enemy;
  }

  public update(
    canvasWidth: number,
    canvasHeight: number,
    playerX: number,
    playerY: number,
    onSpawnBullet?: (x: number, y: number, vx: number, vy: number) => void
  ): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.age++;

      // Update movement pattern
      this.applyPattern(e, canvasWidth, playerX, playerY);

      e.x += e.vx;
      e.y += e.vy;

      // Deliberate, very rare bullet firing from heavy units only
      const canShoot = e.type === 'GPT6_SOL' || e.type === 'GPT6_TERRA' || e.type === 'CLAUDE_OPUS' || e.type === 'CLAUDE_SONNET' || e.type === 'GROK_RAIDER';
      if (canShoot && onSpawnBullet) {
        e.shootCooldown--;
        if (e.shootCooldown <= 0 && e.y > 60 && e.y < canvasHeight - 160) {
          e.shootCooldown = 380 + Math.floor(Math.random() * 240); // Very rare
          const bdx = playerX - e.x;
          const bdy = playerY - e.y;
          const bdist = Math.hypot(bdx, bdy) || 1;
          const bspeed = 0.65; // Much slower, highly readable white Sparoid bullet
          onSpawnBullet(e.x, e.y, (bdx / bdist) * bspeed, (bdy / bdist) * bspeed);
        }
      }

      // Despawn if far off screen
      if (e.y > canvasHeight + 80 || e.y < -140 || e.x < -100 || e.x > canvasWidth + 100) {
        this.enemies.splice(i, 1);
      }
    }
  }

  private applyPattern(e: EnemyEntity, _canvasWidth: number, playerX: number, playerY: number): void {
    const t = e.age;

    switch (e.pattern) {
      case 'S_CURVE_LEFT': {
        e.vx = Math.sin(t * 0.025) * 0.95;
        e.vy = 0.55;
        break;
      }
      case 'S_CURVE_RIGHT': {
        e.vx = -Math.sin(t * 0.025) * 0.95;
        e.vy = 0.55;
        break;
      }
      case 'SWOOP_DIVE': {
        if (t < 60) {
          e.vy = 0.65;
          e.vx = Math.sin(t * 0.035) * 0.7;
        } else if (t < 130) {
          const angle = (t - 60) * 0.035;
          e.vx = Math.cos(angle) * 1.1;
          e.vy = Math.sin(angle) * 0.75;
        } else {
          e.vy = 0.55;
          e.vx = (playerX - e.x) * 0.006;
        }
        break;
      }
      case 'PINCER_LEFT': {
        e.vx = 0.85;
        e.vy = 0.48 + Math.sin(t * 0.03) * 0.3;
        break;
      }
      case 'PINCER_RIGHT': {
        e.vx = -0.85;
        e.vy = 0.48 + Math.sin(t * 0.03) * 0.3;
        break;
      }
      case 'ZIG_ZAG': {
        const period = 70;
        e.vx = (Math.floor(t / period) % 2 === 0 ? 0.9 : -0.9);
        e.vy = 0.55;
        break;
      }
      case 'TARGET_RAM': {
        if (t === 50) {
          const dx = playerX - e.x;
          const dy = playerY - e.y;
          const dist = Math.hypot(dx, dy) || 1;
          e.vx = (dx / dist) * 1.6;
          e.vy = (dy / dist) * 1.6;
        } else if (t < 50) {
          e.vy = 0.45;
          e.vx = 0;
        }
        break;
      }
      case 'MINI_BULLET': {
        break;
      }
      default: {
        e.vy = 0.55;
        break;
      }
    }
  }

  public clear(): void {
    this.enemies = [];
  }
}
