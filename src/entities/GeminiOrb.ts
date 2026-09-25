import { GeminiOrb } from '../types';

/**
 * Autonomous Gemini Guidance Physics Engine (ジェミニ誘導)
 * 
 * Elastic Rubber Band Physics (ゴム紐弾性テンションモデル):
 * - Distance-Proportional Tension: The farther Gemini drifts from Solvalou,
 *   the stronger the elastic acceleration pulling it back!
 * - High Inertia Slingshots: Because tension acts as true physical force on mass,
 *   Gemini whips past the player at tremendous speed, overshooting into thrilling
 *   wide-arc orbits.
 * - Tangential Angular Momentum: Retains orbital curvature so it doesn't snap
 *   in a straight line, but creates devastating whip sweeps across the screen.
 * - Safe to player, deadly to foes.
 */
export class GeminiOrbManager {
  public orbs: GeminiOrb[] = [];
  private orbCounter: number = 0;

  public spawn(x: number, y: number, initialVx: number = 0, initialVy: number = -2.8): GeminiOrb {
    const orb: GeminiOrb = {
      id: `gemini_${++this.orbCounter}`,
      x,
      y,
      vx: initialVx || (Math.random() - 0.5) * 3.0,
      vy: initialVy || -3.2,
      level: 1,
      radius: 16,
      damage: 1,
      trail: [],
      fuseTimer: 20,
    };
    this.orbs.push(orb);
    return orb;
  }

  public update(playerX: number, playerY: number, onMerge?: (level: number, x: number, y: number) => void): void {
    for (let i = 0; i < this.orbs.length; i++) {
      const orb = this.orbs[i];

      // Motion trail
      orb.trail.unshift({ x: orb.x, y: orb.y, alpha: 0.85 });
      const maxTrail = orb.level === 3 ? 22 : orb.level === 2 ? 16 : 12;
      if (orb.trail.length > maxTrail) {
        orb.trail.pop();
      }
      for (const t of orb.trail) {
        t.alpha *= 0.86;
      }

      if (orb.fuseTimer > 0) {
        orb.fuseTimer--;
      }

      // --- Elastic Rubber Band Physics (ゴム紐弾性モデル) ---
      const dx = playerX - orb.x;
      const dy = playerY - orb.y;
      const dist = Math.hypot(dx, dy) || 1;
      const nx = dx / dist;
      const ny = dy / dist;

      // Rest distance (relaxed zone)
      const restDist = 45;

      if (dist > restDist) {
        const stretch = dist - restDist;
        // Non-linear rubber band tension:
        // Grows exponentially as distance increases, creating immense slingshot return acceleration!
        const baseTension = stretch * 0.0026;
        const extremeTension = Math.pow(stretch / 135, 2.2) * 0.18;
        const totalTension = Math.min(0.78, baseTension + extremeTension);

        orb.vx += nx * totalTension;
        orb.vy += ny * totalTension;
      }

      // Gentle orbital curvature guidance (ensures rubber band creates wide whip arcs)
      const perpX = -ny;
      const perpY = nx;
      const dotPerp = orb.vx * perpX + orb.vy * perpY;
      if (Math.abs(dotPerp) < 1.0) {
        // Give slight lateral nudge to initiate slingshot whip rather than 1D bounce
        const nudgeDir = orb.x < playerX ? -1 : 1;
        orb.vx += perpX * nudgeDir * 0.06;
        orb.vy += perpY * nudgeDir * 0.06;
      }

      // Air resistance / slight momentum damping
      orb.vx *= 0.991;
      orb.vy *= 0.991;

      // Speed limits (allows ferocious slingshot speeds up to 9.5!)
      const maxSpeed = 8.5 + (orb.level - 1) * 1.5;
      const curSpeed = Math.hypot(orb.vx, orb.vy);
      if (curSpeed > maxSpeed) {
        orb.vx = (orb.vx / curSpeed) * maxSpeed;
        orb.vy = (orb.vy / curSpeed) * maxSpeed;
      } else if (curSpeed < 1.0) {
        // Keep minimum alive momentum
        orb.vx += (Math.random() - 0.5) * 0.4;
        orb.vy += (Math.random() - 0.5) * 0.4;
      }

      orb.x += orb.vx;
      orb.y += orb.vy;

      // Screen edge boundary reflection (keeps Gemini bouncing in the arena)
      if (orb.x < 14) { orb.x = 14; orb.vx = Math.abs(orb.vx) * 0.88; }
      if (orb.x > 346) { orb.x = 346; orb.vx = -Math.abs(orb.vx) * 0.88; }
      if (orb.y < 24) { orb.y = 24; orb.vy = Math.abs(orb.vy) * 0.88; }
      if (orb.y > 516) { orb.y = 516; orb.vy = -Math.abs(orb.vy) * 0.88; }
    }

    // Check for Gemini Fusion (合体)
    this.checkFusion(onMerge);
  }

  public levelUpOrb(orb: GeminiOrb): void {
    if (orb.level < 3) {
      orb.level++;
      orb.radius = orb.level === 1 ? 16 : orb.level === 2 ? 24 : 32;
      orb.damage = orb.level === 1 ? 1 : orb.level === 2 ? 3 : 8;
      orb.fuseTimer = 25; // Sparkling burst
    } else {
      orb.fuseTimer = 20;
    }
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
          o1.radius = newLevel === 1 ? 16 : newLevel === 2 ? 24 : 32;
          o1.damage = newLevel === 1 ? 1 : newLevel === 2 ? 3 : 8;
          o1.fuseTimer = 25; // Sparkling burst

          o1.x = (o1.x + o2.x) / 2;
          o1.y = (o1.y + o2.y) / 2;
          o1.vx = (o1.vx + o2.vx) * 0.65;
          o1.vy = (o1.vy + o2.vy) * 0.65;

          if (onMerge) {
            onMerge(newLevel, o1.x, o1.y);
          }

          this.orbs.splice(j, 1);
          return;
        }
      }
    }
  }

  public clear(): void {
    this.orbs = [];
  }
}
