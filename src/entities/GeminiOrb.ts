import { GeminiOrb, PhysicsPresetConfig, PhysicsPresetId } from '../types';

export const PHYSICS_PRESETS: Record<PhysicsPresetId, PhysicsPresetConfig> = {
  BALANCED: {
    id: 'BALANCED',
    name: 'BALANCED',
    nameJa: 'バランス型 (現行)',
    descJa: '程よい重みと弾性を兼ね備えた万能設定',
    r0: 48,
    baseTension: 0.0016,
    extremeDiv: 140,
    extremePow: 2.0,
    extremeMult: 0.12,
    maxTension: 0.48,
    pushForce: 0.018,
    whirlTransfer: 0.12,
    barrierSpeed: 1.6,
    barrierAccel: 0.055,
    damping: 0.992,
    maxSpeedBase: 6.2,
    maxSpeedPerLevel: 1.0,
  },
  HEAVY_FLAIL: {
    id: 'HEAVY_FLAIL',
    name: 'HEAVY FLAIL',
    nameJa: '重量鉄球 (フエイル)',
    descJa: 'ズッシリ重く、遠心力で巨大な大車輪スイング',
    r0: 42,
    baseTension: 0.0012,
    extremeDiv: 155,
    extremePow: 2.1,
    extremeMult: 0.10,
    maxTension: 0.42,
    pushForce: 0.014,
    whirlTransfer: 0.08,
    barrierSpeed: 1.3,
    barrierAccel: 0.038,
    damping: 0.995,
    maxSpeedBase: 6.8,
    maxSpeedPerLevel: 1.1,
  },
  SNAP_YOYO: {
    id: 'SNAP_YOYO',
    name: 'SNAP YO-YO',
    nameJa: '高弾性ヨーヨー',
    descJa: '強烈なバネ戻り。直線突進スリングショット特化',
    r0: 52,
    baseTension: 0.0028,
    extremeDiv: 120,
    extremePow: 2.1,
    extremeMult: 0.20,
    maxTension: 0.65,
    pushForce: 0.024,
    whirlTransfer: 0.16,
    barrierSpeed: 1.9,
    barrierAccel: 0.075,
    damping: 0.988,
    maxSpeedBase: 7.6,
    maxSpeedPerLevel: 1.2,
  },
  LUNAR_ORBIT: {
    id: 'LUNAR_ORBIT',
    name: 'LUNAR ORBIT',
    nameJa: '安定公転バリア',
    descJa: '自機を常時旋回して守る月面衛星シールド',
    r0: 54,
    baseTension: 0.0020,
    extremeDiv: 130,
    extremePow: 2.0,
    extremeMult: 0.14,
    maxTension: 0.50,
    pushForce: 0.022,
    whirlTransfer: 0.15,
    barrierSpeed: 2.2,
    barrierAccel: 0.085,
    damping: 0.991,
    maxSpeedBase: 5.8,
    maxSpeedPerLevel: 0.8,
  },
  WHIP_SLASH: {
    id: 'WHIP_SLASH',
    name: 'WHIP SLASH',
    nameJa: '超しなり鞭 (ウィップ)',
    descJa: '追従遅延が大きく、画面端から大きく薙ぎ払う',
    r0: 58,
    baseTension: 0.0011,
    extremeDiv: 160,
    extremePow: 1.9,
    extremeMult: 0.09,
    maxTension: 0.38,
    pushForce: 0.012,
    whirlTransfer: 0.22,
    barrierSpeed: 1.4,
    barrierAccel: 0.045,
    damping: 0.994,
    maxSpeedBase: 6.9,
    maxSpeedPerLevel: 1.1,
  },
};

export const PRESET_ORDER: PhysicsPresetId[] = [
  'BALANCED',
  'HEAVY_FLAIL',
  'SNAP_YOYO',
  'LUNAR_ORBIT',
  'WHIP_SLASH',
];

export class GeminiOrbManager {
  public orbs: GeminiOrb[] = [];
  public currentPresetId: PhysicsPresetId = 'BALANCED';
  private orbCounter: number = 0;

  public setPreset(id: PhysicsPresetId): PhysicsPresetConfig {
    if (PHYSICS_PRESETS[id]) {
      this.currentPresetId = id;
    }
    return PHYSICS_PRESETS[this.currentPresetId];
  }

  public cyclePreset(): PhysicsPresetConfig {
    const idx = PRESET_ORDER.indexOf(this.currentPresetId);
    const nextIdx = (idx + 1) % PRESET_ORDER.length;
    this.currentPresetId = PRESET_ORDER[nextIdx];
    return PHYSICS_PRESETS[this.currentPresetId];
  }

  public getPresetConfig(): PhysicsPresetConfig {
    return PHYSICS_PRESETS[this.currentPresetId];
  }

  public getTelemetry(playerX: number, playerY: number): { dist: number; speed: number; tangentSpeed: number } {
    if (this.orbs.length === 0) {
      return { dist: 0, speed: 0, tangentSpeed: 0 };
    }
    const orb = this.orbs[0];
    const dx = orb.x - playerX;
    const dy = orb.y - playerY;
    const dist = Math.hypot(dx, dy) || 1;
    const rx = dx / dist;
    const ry = dy / dist;
    const tx = -ry;
    const ty = rx;
    const speed = Math.hypot(orb.vx, orb.vy);
    const tangentSpeed = orb.vx * tx + orb.vy * ty;
    return { dist: Math.round(dist), speed: Math.round(speed * 10) / 10, tangentSpeed: Math.round(tangentSpeed * 10) / 10 };
  }

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
    const cfg = PHYSICS_PRESETS[this.currentPresetId];
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
      const r0 = cfg.r0;

      if (dist > r0) {
        const stretch = dist - r0;
        const baseTension = stretch * cfg.baseTension;
        const extremeTension = Math.pow(stretch / cfg.extremeDiv, cfg.extremePow) * cfg.extremeMult;
        const tensionForce = Math.min(cfg.maxTension, baseTension + extremeTension);

        // Pull toward player (-rx, -ry)
        orb.vx -= rx * tensionForce;
        orb.vy -= ry * tensionForce;
      } else {
        // Soft outward repulsion when compressed inside equilibrium zone
        const pushForce = (r0 - dist) * cfg.pushForce;
        orb.vx += rx * pushForce;
        orb.vy += ry * pushForce;
      }

      // 2. Whirling & Tangential Momentum Coupling (自機の旋回運動からの角加速度)
      const playerTangential = playerVx * tx + playerVy * ty;
      const curTangential = orb.vx * tx + orb.vy * ty;

      orb.vx += tx * (playerTangential * cfg.whirlTransfer);
      orb.vy += ty * (playerTangential * cfg.whirlTransfer);

      // 3. Resting Barrier Orbit (近くにいる時の安定公転)
      if (dist < 85 && Math.abs(curTangential) < cfg.barrierSpeed) {
        const spinDir = curTangential < -0.05 ? -1 : 1;
        orb.vx += tx * (cfg.barrierAccel * spinDir);
        orb.vy += ty * (cfg.barrierAccel * spinDir);
      }

      // 4. Momentum Retention & Slight Air Resistance
      orb.vx *= cfg.damping;
      orb.vy *= cfg.damping;

      // 5. Terminal Velocity Ceiling
      const maxSpeed = cfg.maxSpeedBase + (orb.level - 1) * cfg.maxSpeedPerLevel;
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
