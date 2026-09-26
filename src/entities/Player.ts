import { PlayerControlMode, PlayerState } from '../types';

export const PLAYER_SPEED_PRESETS = [1.0, 2.0, 3.0, 5.0, 8.0, 10.0];

export class Player {
  public controlMode: PlayerControlMode = 'DIRECT'; // Default: DIRECT (instant mouse sync / proportional)
  public speedMultiplier: number = 3.0;             // Default: 3.0x speed!
  public readonly baseMaxSpeed: number = 8.4;       // 2.8 * 3.0 = 8.4 px/frame (~504 px/sec)

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
    this.state.controlMode = this.controlMode;
    this.state.speedMultiplier = this.speedMultiplier;
  }

  public toggleControlMode(): PlayerControlMode {
    this.controlMode = this.controlMode === 'DIRECT' ? 'LIMITED' : 'DIRECT';
    return this.controlMode;
  }

  public setControlMode(mode: PlayerControlMode): void {
    this.controlMode = mode;
  }

  public cycleSpeedMultiplier(): number {
    const idx = PLAYER_SPEED_PRESETS.indexOf(this.speedMultiplier);
    const nextIdx = (idx + 1) % PLAYER_SPEED_PRESETS.length;
    this.speedMultiplier = PLAYER_SPEED_PRESETS[nextIdx];
    return this.speedMultiplier;
  }

  public setSpeedMultiplier(mult: number): void {
    this.speedMultiplier = Math.max(0.5, Math.min(20, mult));
  }

  public update(targetX: number, targetY: number): void {
    if (!this.state.alive) return;

    const prevX = this.state.x;
    const prevY = this.state.y;

    if (this.controlMode === 'DIRECT') {
      // ユーザー指示: マウスの動きに比例した移動（瞬間移動・完全同期）
      this.state.x = Math.max(16, Math.min(360 - 16, targetX));
      this.state.y = Math.max(40, Math.min(540 - 24, targetY));
    } else {
      // ユーザー指示: 速度制限ありの飛行追従（速度3倍 & 調整可能）
      const dx = targetX - this.state.x;
      const dy = targetY - this.state.y;
      const dist = Math.hypot(dx, dy);

      const maxSpeed = this.baseMaxSpeed * (this.speedMultiplier / 3.0);
      if (dist > 0.001) {
        const step = Math.min(dist * 0.40 * (this.speedMultiplier / 3.0), maxSpeed);
        this.state.x += (dx / dist) * step;
        this.state.y += (dy / dist) * step;
      }
      this.state.x = Math.max(16, Math.min(360 - 16, this.state.x));
      this.state.y = Math.max(40, Math.min(540 - 24, this.state.y));
    }

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

    this.state.controlMode = this.controlMode;
    this.state.speedMultiplier = this.speedMultiplier;
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
