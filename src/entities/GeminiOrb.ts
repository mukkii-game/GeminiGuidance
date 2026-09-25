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

  public update(
    playerX: number,
    playerY: number,
    playerVx: number = 0,
    playerVy: number = 0,
    onMerge?: (level: number, x: number, y: number) => void
  ): void {
    for (let i = 0; i < this.orbs.length; i++) {
      const orb = this.orbs[i];

      // Motion trail
      orb.trail.unshift({ x: orb.x, y: orb.y, alpha: 0.85 });
      const maxTrail = orb.level === 3 ? 24 : orb.level === 2 ? 18 : 14;
      if (orb.trail.length > maxTrail) {
        orb.trail.pop();
      }
      for (const t of orb.trail) {
        t.alpha *= 0.86;
      }

      if (orb.fuseTimer > 0) {
        orb.fuseTimer--;
      }

      // --- Whirling Flail & Orbital Bungee Physics (分銅旋回＆バネ弾性力学) ---
      // Vector from Player (Anchor) to Gemini (Weight)
      const dx = orb.x - playerX;
      const dy = orb.y - playerY;
      const dist = Math.hypot(dx, dy) || 1;

      // Unit radial vector (pointing from Player to Gemini)
      const rx = dx / dist;
      const ry = dy / dist;

      // Unit tangential vector (perpendicular, counter-clockwise)
      const tx = -ry;
      const ty = rx;

      // 1. Spring-Tether Elastic Tension (バネの付いた分銅の弾性張力)
      // Equilibrium distance (resting barrier radius)
      const r0 = 48;

      if (dist > r0) {
        const stretch = dist - r0;
        // Non-linear spring tension:
        // When stretched far (e.g. player dashes into enemy), creates immense forward whip snap!
        const baseTension = stretch * 0.0034;
        const extremeTension = Math.pow(stretch / 125, 2.2) * 0.24;
        const tensionForce = Math.min(0.96, baseTension + extremeTension);

        // Pull toward player (-rx, -ry)
        orb.vx -= rx * tensionForce;
        orb.vy -= ry * tensionForce;
      } else {
        // Soft outward repulsion when compressed inside equilibrium zone
        const pushForce = (r0 - dist) * 0.038;
        orb.vx += rx * pushForce;
        orb.vy += ry * pushForce;
      }

      // 2. Whirling & Tangential Momentum Coupling (円形旋回の遅延伝達＆外周遠心力)
      // Transfer player's circling velocity into Gemini's angular speed!
      const playerTangential = playerVx * tx + playerVy * ty;
      const curTangential = orb.vx * tx + orb.vy * ty;

      // Whirling acceleration: circling the ship spins the flail into a wide, lagging ellipse
      orb.vx += tx * (playerTangential * 0.24);
      orb.vy += ty * (playerTangential * 0.24);

      // 3. Resting Barrier Orbit (近くにいる時、割と近くのままバリアとして旋回)
      if (dist < 85 && Math.abs(curTangential) < 2.4) {
        const spinDir = curTangential < -0.1 ? -1 : 1;
        orb.vx += tx * (0.11 * spinDir);
        orb.vy += ty * (0.11 * spinDir);
      }

      // 4. Momentum Retention & Slight Air Resistance
      orb.vx *= 0.9935;
      orb.vy *= 0.9935;

      // 5. Terminal Velocity Ceiling (allows explosive flail swings up to 14.5 px/frame!)
      const maxSpeed = 11.5 + (orb.level - 1) * 2.0;
      const curSpeed = Math.hypot(orb.vx, orb.vy);
      if (curSpeed > maxSpeed) {
        orb.vx = (orb.vx / curSpeed) * maxSpeed;
        orb.vy = (orb.vy / curSpeed) * maxSpeed;
      }

      // Update position
      orb.x += orb.vx;
      orb.y += orb.vy;

      // Screen edge boundary reflection (bounces off arena borders like a wrecking ball)
      if (orb.x < 14) { orb.x = 14; orb.vx = Math.abs(orb.vx) * 0.90; }
      if (orb.x > 346) { orb.x = 346; orb.vx = -Math.abs(orb.vx) * 0.90; }
      if (orb.y < 24) { orb.y = 24; orb.vy = Math.abs(orb.vy) * 0.90; }
      if (orb.y > 516) { orb.y = 516; orb.vy = -Math.abs(orb.vy) * 0.90; }
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
