import { GeminiOrb } from '../types';

export class GeminiOrbManager {
  public orbs: GeminiOrb[] = [];
  private orbCounter: number = 0;

  public spawn(x: number, y: number, initialVx: number = 0, initialVy: number = -1): GeminiOrb {
    const orb: GeminiOrb = {
      id: `gemini_${++this.orbCounter}`,
      x,
      y,
      vx: initialVx,
      vy: initialVy,
      level: 1,
      radius: 14,
      damage: 1,
      orbitAngle: Math.random() * Math.PI * 2,
      orbitDist: 120, // starts distant and gradually approaches
      trail: [],
      fuseTimer: 20,
    };
    this.orbs.push(orb);
    return orb;
  }

  public update(playerX: number, playerY: number, onMerge?: (level: number, x: number, y: number) => void): void {
    const baseTargetRadius = 52;
    const baseOmega = 0.038; // calm, majestic orbital revolution speed

    for (let i = 0; i < this.orbs.length; i++) {
      const orb = this.orbs[i];

      // Update motion trail
      orb.trail.unshift({ x: orb.x, y: orb.y, alpha: 0.9 });
      if (orb.trail.length > (orb.level === 3 ? 16 : orb.level === 2 ? 12 : 8)) {
        orb.trail.pop();
      }
      for (const t of orb.trail) {
        t.alpha *= 0.88;
      }

      if (orb.fuseTimer > 0) {
        orb.fuseTimer--;
      }

      // 1. Orbital Angle & Distance Physics (Like the Moon around Earth)
      const targetRadius = baseTargetRadius + (orb.level - 1) * 8;
      // Approach the equilibrium orbital distance smoothly
      orb.orbitDist += (targetRadius - orb.orbitDist) * 0.035;

      // Continuous orbital revolution
      orb.orbitAngle += baseOmega;
      if (orb.orbitAngle > Math.PI * 2) {
        orb.orbitAngle -= Math.PI * 2;
      }

      // Ideal target position on the orbit around Solvalou
      const targetX = playerX + Math.cos(orb.orbitAngle) * orb.orbitDist;
      const targetY = playerY + Math.sin(orb.orbitAngle) * orb.orbitDist * 0.85; // slightly elliptical

      // 2. Physical Spring Inertia (Allows slinging and whipping outward on turns)
      const fx = (targetX - orb.x) * 0.14;
      const fy = (targetY - orb.y) * 0.14;

      orb.vx = (orb.vx + fx) * 0.88;
      orb.vy = (orb.vy + fy) * 0.88;

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

        if (dist < o1.radius + o2.radius + 6) {
          // Merge o2 into o1
          const newLevel = Math.min(3, Math.max(o1.level, o2.level) + 1);
          o1.level = newLevel;
          o1.radius = newLevel === 1 ? 14 : newLevel === 2 ? 20 : 28;
          o1.damage = newLevel === 1 ? 1 : newLevel === 2 ? 3 : 8;
          o1.fuseTimer = 25; // Sparkling burst

          o1.x = (o1.x + o2.x) / 2;
          o1.y = (o1.y + o2.y) / 2;
          o1.vx = (o1.vx + o2.vx) * 0.6;
          o1.vy = (o1.vy + o2.vy) * 0.6;

          if (onMerge) {
            onMerge(newLevel, o1.x, o1.y);
          }

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
