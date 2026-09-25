import { GeminiOrb } from '../types';

/**
 * Autonomous Gemini Guidance Physics Engine (ジェミニ誘導)
 * 
 * Core Mechanic:
 * - Autonomous Steering: Moves with true momentum and inertia, homing towards the player.
 * - Weak Turning Radius: Angular steering is strictly limited (~0.038 rad/frame).
 *   When the player maneuvers, Gemini cannot turn sharply enough, resulting in thrilling
 *   slingshot flybys and natural orbital whip arcs.
 * - Distance Acceleration: When player dashes far away, Gemini accelerates smoothly to catch up.
 * - LETHAL TO PLAYER: If Gemini hits Solvalou, the player is destroyed! The player must
 *   continuously guide and avoid colliding with the Gemini orb while using it to smash foes.
 */
export class GeminiOrbManager {
  public orbs: GeminiOrb[] = [];
  private orbCounter: number = 0;

  public spawn(x: number, y: number, initialVx: number = 0, initialVy: number = -2.2): GeminiOrb {
    const orb: GeminiOrb = {
      id: `gemini_${++this.orbCounter}`,
      x,
      y,
      vx: initialVx || (Math.random() - 0.5) * 1.6,
      vy: initialVy || -2.4,
      level: 1,
      radius: 15,
      damage: 1,
      orbitAngle: 0,
      orbitDist: 0,
      trail: [],
      fuseTimer: 20,
      spawnTimer: 45, // 45 frames pop-up grace period
      hazardActive: false,
    };
    this.orbs.push(orb);
    return orb;
  }

  public update(playerX: number, playerY: number, onMerge?: (level: number, x: number, y: number) => void): void {
    for (let i = 0; i < this.orbs.length; i++) {
      const orb = this.orbs[i];

      // Motion trail
      orb.trail.unshift({ x: orb.x, y: orb.y, alpha: 0.85 });
      const maxTrail = orb.level === 3 ? 18 : orb.level === 2 ? 14 : 10;
      if (orb.trail.length > maxTrail) {
        orb.trail.pop();
      }
      for (const t of orb.trail) {
        t.alpha *= 0.88;
      }

      if (orb.fuseTimer > 0) {
        orb.fuseTimer--;
      }

      // Initial Spawn Grace Period (popping up from ground target)
      if (orb.spawnTimer > 0) {
        orb.spawnTimer--;
        orb.x += orb.vx;
        orb.y += orb.vy;
        orb.vy += 0.045; // gentle gravity arc
        if (orb.spawnTimer === 0) {
          orb.hazardActive = true; // Now dangerous to player!
        }
      } else {
        // --- Autonomous Weak Homing Guidance ---
        const dx = playerX - orb.x;
        const dy = playerY - orb.y;
        const dist = Math.hypot(dx, dy) || 1;
        const targetAngle = Math.atan2(dy, dx);

        let speed = Math.hypot(orb.vx, orb.vy);
        if (speed < 0.2) speed = 0.2;
        let angle = Math.atan2(orb.vy, orb.vx);

        // Weak turn rate limit (crucial for slingshots and near-misses)
        let diff = targetAngle - angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;

        const maxTurn = 0.038; // ~2.1 degrees/frame
        const turn = Math.max(-maxTurn, Math.min(maxTurn, diff));
        angle += turn;

        // Cruise speed + distance-based catch-up acceleration
        const baseSpeed = 2.4 + (orb.level - 1) * 0.3;
        const targetSpeed = Math.min(4.8, baseSpeed + Math.max(0, dist - 80) * 0.012);
        speed += (targetSpeed - speed) * 0.04;

        orb.vx = Math.cos(angle) * speed;
        orb.vy = Math.sin(angle) * speed;

        orb.x += orb.vx;
        orb.y += orb.vy;
      }

      // Screen edge boundary reflection (keeps Gemini in the combat area)
      if (orb.x < 14) { orb.x = 14; orb.vx = Math.abs(orb.vx) * 0.8; }
      if (orb.x > 346) { orb.x = 346; orb.vx = -Math.abs(orb.vx) * 0.8; }
      if (orb.y < 24) { orb.y = 24; orb.vy = Math.abs(orb.vy) * 0.8; }
      if (orb.y > 516) { orb.y = 516; orb.vy = -Math.abs(orb.vy) * 0.8; }
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
          o1.radius = newLevel === 1 ? 15 : newLevel === 2 ? 22 : 30;
          o1.damage = newLevel === 1 ? 1 : newLevel === 2 ? 3 : 8;
          o1.fuseTimer = 25; // Sparkling burst
          o1.hazardActive = true;

          o1.x = (o1.x + o2.x) / 2;
          o1.y = (o1.y + o2.y) / 2;
          o1.vx = (o1.vx + o2.vx) * 0.55;
          o1.vy = (o1.vy + o2.vy) * 0.55;

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
