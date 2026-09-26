import { PlayerState } from '../types';

export class Player {
  public state: PlayerState = {
    x: 180,
    y: 440,
    vx: 0,
    vy: 0,
    tilt: 0,
    lives: 3,
    hp: 100,
    maxHp: 100,
    score: 0,
    highScore: 10000,
    invulnerableTimer: 0,
    alive: true,
  };

  constructor(startX: number = 180, startY: number = 440) {
    this.reset(startX, startY);
  }

  public reset(startX: number = 180, startY: number = 440): void {
    this.state.x = startX;
    this.state.y = startY;
    this.state.vx = 0;
    this.state.vy = 0;
    this.state.tilt = 0;
    this.state.hp = this.state.maxHp;
    this.state.invulnerableTimer = 120; // 2 seconds invulnerability on spawn
    this.state.alive = true;
  }

  public update(targetX: number, targetY: number): void {
    if (!this.state.alive) return;

    const prevX = this.state.x;
    const prevY = this.state.y;

    // Movement towards input target with physical flight speed limit (prevents unnatural warping)
    const dx = targetX - this.state.x;
    const dy = targetY - this.state.y;
    const dist = Math.hypot(dx, dy);

    // Max flight speed: 2.8 px/frame (~168 px/sec) - deliberate, tactical, analog precision
    const maxSpeed = 2.8;
    if (dist > 0.001) {
      const step = Math.min(dist * 0.16, maxSpeed);
      this.state.x += (dx / dist) * step;
      this.state.y += (dy / dist) * step;
    }

    // Keep ship strictly within canvas boundaries
    this.state.x = Math.max(16, Math.min(360 - 16, this.state.x));
    this.state.y = Math.max(40, Math.min(540 - 24, this.state.y));

    this.state.vx = this.state.x - prevX;
    this.state.vy = this.state.y - prevY;

    // Calculate bank tilt
    if (this.state.vx < -0.4) {
      this.state.tilt = -1;
    } else if (this.state.vx > 0.4) {
      this.state.tilt = 1;
    } else {
      this.state.tilt = 0;
    }

    if (this.state.invulnerableTimer > 0) {
      this.state.invulnerableTimer--;
    }
  }

  public addScore(points: number): void {
    this.state.score += points;
    if (this.state.score > this.state.highScore) {
      this.state.highScore = this.state.score;
    }
  }

  /**
   * Damage System (ダメージ制)
   * Instead of immediate death and annoying respawn reset,
   * taking a hit consumes HP/Shield. Player stays in the fight with i-frames!
   */
  public takeDamage(amount: number): { damaged: boolean; destroyed: boolean; restored: boolean } {
    if (this.state.invulnerableTimer > 0 || !this.state.alive) {
      return { damaged: false, destroyed: false, restored: false };
    }

    this.state.hp = Math.max(0, this.state.hp - amount);
    this.state.invulnerableTimer = 65; // ~1.1 seconds invulnerability

    if (this.state.hp <= 0) {
      if (this.state.lives > 1) {
        // Emergency Hull Restoration on the spot! (No resetting position!)
        this.state.lives--;
        this.state.hp = this.state.maxHp;
        this.state.invulnerableTimer = 120; // 2.0 seconds emergency shield
        return { damaged: true, destroyed: false, restored: true };
      } else {
        // True destruction when lives exhausted
        this.state.lives = 0;
        this.state.alive = false;
        return { damaged: true, destroyed: true, restored: false };
      }
    }

    return { damaged: true, destroyed: false, restored: false };
  }

  public repair(amount: number): void {
    if (!this.state.alive) return;
    this.state.hp = Math.min(this.state.maxHp, this.state.hp + amount);
  }

  public hit(): boolean {
    const res = this.takeDamage(100);
    return res.destroyed;
  }
}
