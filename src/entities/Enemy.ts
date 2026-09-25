import { EnemyEntity, EnemyType } from '../types';

export class EnemyManager {
  public enemies: EnemyEntity[] = [];
  private enemyCounter: number = 0;

  public spawn(
    type: EnemyType,
    x: number,
    y: number,
    pattern: string = 'STRAIGHT_DOWN',
    customHp?: number
  ): EnemyEntity {
    let width = 24;
    let height = 24;
    let hp = 1;
    let points = 100;
    let color = '#38bdf8';

    switch (type) {
      case 'GPT6_LUNA':
        width = 24; height = 24; hp = 1; points = 150; color = '#38bdf8'; break;
      case 'DEEPSEEK_FLASH':
        width = 28; height = 24; hp = 1; points = 120; color = '#0284c7'; break;
      case 'KIMI_MOON':
        width = 26; height = 26; hp = 2; points = 200; color = '#818cf8'; break;
      case 'QWEN_CUBE':
        width = 24; height = 24; hp = 2; points = 180; color = '#c084fc'; break;
      case 'MISTRAL_FLAME':
        width = 24; height = 24; hp = 1; points = 140; color = '#ea580c'; break;
      case 'CURSOR_PROBE':
        width = 24; height = 24; hp = 2; points = 220; color = '#00f2fe'; break;
      case 'GROK_RAIDER':
        width = 28; height = 28; hp = 3; points = 350; color = '#ffffff'; break;
      case 'COPILOT_GLIDER':
        width = 26; height = 26; hp = 1; points = 130; color = '#3b82f6'; break;
      case 'CLAUDE_FABLE':
        width = 30; height = 30; hp = 3; points = 300; color = '#d97706'; break;
      case 'CLAUDE_MYTHOS':
        width = 32; height = 32; hp = 4; points = 400; color = '#b45309'; break;
      case 'PERPLEXITY_SPINNER':
        width = 26; height = 26; hp = 2; points = 200; color = '#14b8a6'; break;
      case 'GPT6_TERRA':
        width = 34; height = 34; hp = 6; points = 600; color = '#f59e0b'; break;
      case 'GPT6_SOL':
        width = 44; height = 44; hp = 12; points = 1200; color = '#fbbf24'; break;
      case 'MINI_CLONE':
        width = 10; height = 10; hp = 1; points = 20; color = '#ef4444'; break;
    }

    if (customHp !== undefined) hp = customHp;

    const enemy: EnemyEntity = {
      id: `enemy_${++this.enemyCounter}`,
      type,
      x,
      y,
      vx: 0,
      vy: 2.0,
      width,
      height,
      hp,
      maxHp: hp,
      age: 0,
      pattern,
      points,
      color,
      angle: 0,
      shootCooldown: 90 + Math.floor(Math.random() * 60),
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

      // Enemy mini-clone projectile firing (low frequency, destructible by Gemini)
      if (e.type !== 'MINI_CLONE' && onSpawnBullet) {
        e.shootCooldown--;
        if (e.shootCooldown <= 0 && e.y > 40 && e.y < canvasHeight - 120) {
          e.shootCooldown = 140 + Math.floor(Math.random() * 80);
          const bdx = playerX - e.x;
          const bdy = playerY - e.y;
          const bdist = Math.hypot(bdx, bdy) || 1;
          const bspeed = 2.2;
          onSpawnBullet(e.x, e.y, (bdx / bdist) * bspeed, (bdy / bdist) * bspeed);
        }
      }

      // Despawn if far off screen
      if (e.y > canvasHeight + 60 || e.y < -120 || e.x < -80 || e.x > canvasWidth + 80) {
        this.enemies.splice(i, 1);
      }
    }
  }

  private applyPattern(e: EnemyEntity, _canvasWidth: number, playerX: number, playerY: number): void {
    const t = e.age;

    switch (e.pattern) {
      case 'S_CURVE_LEFT': {
        e.vx = Math.sin(t * 0.06) * 3.2;
        e.vy = 2.4;
        break;
      }
      case 'S_CURVE_RIGHT': {
        e.vx = -Math.sin(t * 0.06) * 3.2;
        e.vy = 2.4;
        break;
      }
      case 'SWOOP_DIVE': {
        if (t < 40) {
          e.vy = 3.5;
          e.vx = Math.sin(t * 0.1) * 2;
        } else if (t < 80) {
          // Swoop loop
          const angle = (t - 40) * 0.08;
          e.vx = Math.cos(angle) * 4;
          e.vy = Math.sin(angle) * 3.5;
        } else {
          e.vy = 2.8;
          e.vx = (playerX - e.x) * 0.02;
        }
        break;
      }
      case 'PINCER_LEFT': {
        e.vx = 2.8;
        e.vy = 1.8 + Math.sin(t * 0.08) * 1.5;
        break;
      }
      case 'PINCER_RIGHT': {
        e.vx = -2.8;
        e.vy = 1.8 + Math.sin(t * 0.08) * 1.5;
        break;
      }
      case 'ZIG_ZAG': {
        const period = 35;
        e.vx = (Math.floor(t / period) % 2 === 0 ? 3.0 : -3.0);
        e.vy = 2.0;
        break;
      }
      case 'TARGET_RAM': {
        // Grok aggressive rush
        if (t === 30) {
          const dx = playerX - e.x;
          const dy = playerY - e.y;
          const dist = Math.hypot(dx, dy) || 1;
          e.vx = (dx / dist) * 5.0;
          e.vy = (dy / dist) * 5.0;
        } else if (t < 30) {
          e.vy = 1.5;
          e.vx = 0;
        }
        break;
      }
      case 'MINI_BULLET': {
        // Continues with existing vx, vy
        break;
      }
      default: {
        e.vy = 2.2;
        break;
      }
    }
  }

  public clear(): void {
    this.enemies = [];
  }
}
