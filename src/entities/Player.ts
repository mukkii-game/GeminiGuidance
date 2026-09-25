import { PlayerState } from '../types';

export class Player {
  public state: PlayerState = {
    x: 180,
    y: 440,
    vx: 0,
    vy: 0,
    tilt: 0,
    lives: 3,
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
    this.state.invulnerableTimer = 120; // 2 seconds invulnerability on spawn
    this.state.alive = true;
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

  public hit(): boolean {
    if (this.state.invulnerableTimer > 0 || !this.state.alive) {
      return false; // Immune
    }
    this.state.lives--;
    this.state.alive = false;
    return true;
  }
}
