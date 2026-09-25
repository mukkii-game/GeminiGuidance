import { GeminiOrb } from '../types';

export class GeminiOrbManager {
  public orbs: GeminiOrb[] = [];
  private orbCounter: number = 0;

  public spawn(x: number, y: number, initialVx: number = 0, initialVy: number = -2): GeminiOrb {
    const orb: GeminiOrb = {
      id: `gemini_${++this.orbCounter}`,
      x,
      y,
      vx: initialVx,
      vy: initialVy,
      level: 1,
      radius: 14,
      damage: 1,
      trail: [],
      fuseTimer: 20, // initial birth flare
    };
    this.orbs.push(orb);
    return orb;
  }

  public update(playerX: number, playerY: number, onMerge?: (level: number, x: number, y: number) => void): void {
    const homingBase = 0.55;
    const maxSpeedBase = 12.0;
    const minOrbitDist = 32;

    for (let i = 0; i < this.orbs.length; i++) {
      const orb = this.orbs[i];

      // Update trail
      orb.trail.unshift({ x: orb.x, y: orb.y, alpha: 0.9 });
      if (orb.trail.length > (orb.level === 3 ? 16 : orb.level === 2 ? 12 : 8)) {
        orb.trail.pop();
      }
      for (const t of orb.trail) {
        t.alpha *= 0.86;
      }

      if (orb.fuseTimer > 0) {
        orb.fuseTimer--;
      }

      // Physics: Homing toward player with orbital inertia (ジェミニ誘導)
      const dx = playerX - orb.x;
      const dy = playerY - orb.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 0.001) {
        const nx = dx / dist;
        const ny = dy / dist;

        // Level scaling
        const speedLimit = maxSpeedBase + (orb.level - 1) * 2.5;
        const homing = homingBase + (orb.level - 1) * 0.12;

        if (dist < minOrbitDist) {
          // Repulsive buffer & tangential swirl when too close to player
          // Pushes orb to rotate smoothly around Solvalou rather than sticking inside
          const perpX = -ny;
          const perpY = nx;
          orb.vx += perpX * 0.9 - nx * 0.5;
          orb.vy += perpY * 0.9 - ny * 0.5;
        } else {
          // Centripetal acceleration towards player
          orb.vx += nx * homing;
          orb.vy += ny * homing;
        }

        // Slight natural damping for controllable orbit
        orb.vx *= 0.985;
        orb.vy *= 0.985;

        // Clamp to max speed
        const currentSpeed = Math.hypot(orb.vx, orb.vy);
        if (currentSpeed > speedLimit) {
          orb.vx = (orb.vx / currentSpeed) * speedLimit;
          orb.vy = (orb.vy / currentSpeed) * speedLimit;
        }
      }

      orb.x += orb.vx;
      orb.y += orb.vy;
    }

    // Check for Gemini Fusion (合体)
    this.checkFusion(onMerge);
  }

  private checkFusion(onMerge?: (level: number, x: number, y: number) => void): void {
    for (let i = 0; i < this.orbs.length; i++) {
      for (let j = i + 1; j < this.orbs.length; j++) {
        const o1 = this.orbs[i];
        const o2 = this.orbs[j];
        const dist = Math.hypot(o1.x - o2.x, o1.y - o2.y);

        if (dist < o1.radius + o2.radius) {
          // Merge o2 into o1
          const newLevel = Math.min(3, Math.max(o1.level, o2.level) + 1);
          o1.level = newLevel;
          o1.radius = newLevel === 1 ? 14 : newLevel === 2 ? 20 : 28;
          o1.damage = newLevel === 1 ? 1 : newLevel === 2 ? 3 : 8;
          o1.fuseTimer = 25; // Sparkling burst

          // Midpoint position and combined velocity
          o1.x = (o1.x + o2.x) / 2;
          o1.y = (o1.y + o2.y) / 2;
          o1.vx = (o1.vx + o2.vx) * 0.65;
          o1.vy = (o1.vy + o2.vy) * 0.65;

          if (onMerge) {
            onMerge(newLevel, o1.x, o1.y);
          }

          // Remove o2
          this.orbs.splice(j, 1);
          j--;
        }
      }
    }
  }

  public getAverageSpeed(): number {
    if (this.orbs.length === 0) return 0;
    let sum = 0;
    for (const o of this.orbs) {
      sum += Math.hypot(o.vx, o.vy);
    }
    return sum / this.orbs.length;
  }

  public clear(): void {
    this.orbs = [];
  }
}
