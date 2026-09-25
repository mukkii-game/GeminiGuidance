import { PlayerState, BlasterBomb } from '../types';

export class Player {
  public state: PlayerState = {
    x: 180,
    y: 440,
    vx: 0,
    vy: 0,
    tilt: 0,
    sightX: 180,
    sightY: 368,
    sightDistance: 72,
    bombCooldown: 0,
    lives: 3,
    score: 0,
    highScore: 10000,
    invulnerableTimer: 0,
    alive: true,
  };

  public bombs: BlasterBomb[] = [];
  private bombCounter: number = 0;

  constructor(startX: number = 180, startY: number = 440) {
    this.reset(startX, startY);
  }

  public reset(startX: number = 180, startY: number = 440): void {
    this.state.x = startX;
    this.state.y = startY;
    this.state.vx = 0;
    this.state.vy = 0;
    this.state.tilt = 0;
    this.state.sightX = startX;
    this.state.sightY = startY - this.state.sightDistance;
    this.state.bombCooldown = 0;
    this.state.invulnerableTimer = 120; // 2 seconds invulnerability on spawn
    this.state.alive = true;
    this.bombs = [];
  }

  public update(targetX: number, targetY: number): void {
    if (!this.state.alive) return;

    // Smooth movement towards input target
    const prevX = this.state.x;
    const prevY = this.state.y;

    const lerpFactor = 0.24;
    this.state.x += (targetX - this.state.x) * lerpFactor;
    this.state.y += (targetY - this.state.y) * lerpFactor;

    this.state.vx = this.state.x - prevX;
    this.state.vy = this.state.y - prevY;

    // Calculate bank tilt
    if (this.state.vx < -0.8) {
      this.state.tilt = -1;
    } else if (this.state.vx > 0.8) {
      this.state.tilt = 1;
    } else {
      this.state.tilt = 0;
    }

    // Update ground targeting sight
    this.state.sightX = this.state.x;
    this.state.sightY = Math.max(16, this.state.y - this.state.sightDistance);

    // Timers
    if (this.state.bombCooldown > 0) {
      this.state.bombCooldown--;
    }
    if (this.state.invulnerableTimer > 0) {
      this.state.invulnerableTimer--;
    }

    // Update active bombs
    this.updateBombs();
  }

  public canFireBomb(): boolean {
    return this.state.alive && this.state.bombCooldown <= 0;
  }

  public launchBomb(): BlasterBomb | null {
    if (!this.canFireBomb()) return null;

    this.state.bombCooldown = 18; // ~3.3 bombs per second
    const bomb: BlasterBomb = {
      id: `bomb_${++this.bombCounter}`,
      startX: this.state.x,
      startY: this.state.y,
      x: this.state.x,
      y: this.state.y,
      targetX: this.state.sightX,
      targetY: this.state.sightY,
      progress: 0,
      exploded: false,
    };
    this.bombs.push(bomb);
    return bomb;
  }

  private updateBombs(): void {
    for (let i = this.bombs.length - 1; i >= 0; i--) {
      const b = this.bombs[i];
      b.progress += 0.038; // Deliberate parabolic bomb drop
      if (b.progress >= 1.0) {
        b.progress = 1.0;
        b.exploded = true;
        b.x = b.targetX;
        b.y = b.targetY;
      } else {
        b.x = b.startX + (b.targetX - b.startX) * b.progress;
        // Parabolic arc height
        const arcY = -Math.sin(b.progress * Math.PI) * 16;
        b.y = b.startY + (b.targetY - b.startY) * b.progress + arcY;
      }
    }
  }

  public removeExplodedBombs(): BlasterBomb[] {
    const exploded = this.bombs.filter(b => b.exploded);
    this.bombs = this.bombs.filter(b => !b.exploded);
    return exploded;
  }

  public addScore(points: number): void {
    this.state.score += points;
    if (this.state.score > this.state.highScore) {
      this.state.highScore = this.state.score;
    }
  }

  public hit(): boolean {
    if (this.state.invulnerableTimer > 0 || !this.state.alive) {
      return false; // Immune
    }
    this.state.lives--;
    this.state.alive = false;
    return true;
  }
}
