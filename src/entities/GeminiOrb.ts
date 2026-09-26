import { GeminiCollisionMode, GeminiOrb, PhysicsPresetConfig, PhysicsPresetId, PhysicsTuningState } from '../types';

export const PHYSICS_PRESETS: Record<PhysicsPresetId, PhysicsPresetConfig> = {
  SNAP_SLING: {
    id: 'SNAP_SLING',
    name: 'SNAP SLING',
    nameJa: '標準スリング (ヨーヨー)',
    descJa: '直感的な引っ張り飛ばしと頂点滞在の標準設定',
    springK: 0.0028,
    springNonlinear: 0.065,
    damping: 0.993,
    maxSpeed: 8.5,
    apexThreshold: 1.6,
    orbitBaseSpeed: 0.065,
    orbitTransfer: 0.20,
  },
  HYPER_BOOMERANG: {
    id: 'HYPER_BOOMERANG',
    name: 'HYPER BOOMERANG',
    nameJa: '大遠投ブーメラン',
    descJa: '高慣性・低空気抵抗。画面端まで飛んで大きく湾曲',
    springK: 0.0018,
    springNonlinear: 0.040,
    damping: 0.997,
    maxSpeed: 10.0,
    apexThreshold: 1.4,
    orbitBaseSpeed: 0.055,
    orbitTransfer: 0.16,
  },
  GIGANTIC_SPRING: {
    id: 'GIGANTIC_SPRING',
    name: 'GIGANTIC SPRING',
    nameJa: '超ゴムバネ (高反発)',
    descJa: '離すほど急激に加速が跳ね上がる猛烈なゴムパチンコ',
    springK: 0.0035,
    springNonlinear: 0.120,
    damping: 0.990,
    maxSpeed: 11.5,
    apexThreshold: 1.8,
    orbitBaseSpeed: 0.075,
    orbitTransfer: 0.24,
  },
  HEAVY_WRECKER: {
    id: 'HEAVY_WRECKER',
    name: 'HEAVY WRECKER',
    nameJa: '重量分銅 (高質量)',
    descJa: '重い質量感。折り返しでの滞在時間が長く集中粉砕',
    springK: 0.0022,
    springNonlinear: 0.050,
    damping: 0.995,
    maxSpeed: 7.8,
    apexThreshold: 2.0,
    orbitBaseSpeed: 0.045,
    orbitTransfer: 0.14,
  },
  RAPID_ORBIT: {
    id: 'RAPID_ORBIT',
    name: 'RAPID ORBIT',
    nameJa: '高速公転バリア',
    descJa: 'クリック時の公転スピードと追従性が最も高い防御型',
    springK: 0.0030,
    springNonlinear: 0.060,
    damping: 0.992,
    maxSpeed: 8.2,
    apexThreshold: 1.5,
    orbitBaseSpeed: 0.095,
    orbitTransfer: 0.32,
  },
};

export const PRESET_ORDER: PhysicsPresetId[] = [
  'SNAP_SLING',
  'HYPER_BOOMERANG',
  'GIGANTIC_SPRING',
  'HEAVY_WRECKER',
  'RAPID_ORBIT',
];

export class GeminiOrbManager {
  public orbs: GeminiOrb[] = [];
  public currentPresetId: PhysicsPresetId = 'SNAP_SLING';
  public collisionMode: GeminiCollisionMode = 'PENETRATE';
  public screenEdgeBounce: boolean = false; // 画面端当たり判定: false = 通過, true = 跳ね返る
  public tuning: PhysicsTuningState = {
    tensionMultiplier: 1.0,
    apexDwellMultiplier: 1.0,
    maxSpeedMultiplier: 1.0,
    orbitRadius: 75,
  };
  private orbCounter: number = 0;

  public toggleScreenEdgeBounce(): boolean {
    this.screenEdgeBounce = !this.screenEdgeBounce;
    return this.screenEdgeBounce;
  }

  public setScreenEdgeBounce(enabled: boolean): void {
    this.screenEdgeBounce = enabled;
  }

  public cycleTension(): number {
    const steps = [1.0, 1.8, 3.0, 0.5];
    const curIdx = steps.findIndex(s => Math.abs(s - this.tuning.tensionMultiplier) < 0.05);
    const nextIdx = (curIdx + 1) % steps.length;
    this.tuning.tensionMultiplier = steps[nextIdx];
    return this.tuning.tensionMultiplier;
  }

  public cycleApexDwell(): number {
    const steps = [1.0, 2.5, 0.0, 0.5];
    const curIdx = steps.findIndex(s => Math.abs(s - this.tuning.apexDwellMultiplier) < 0.05);
    const nextIdx = (curIdx + 1) % steps.length;
    this.tuning.apexDwellMultiplier = steps[nextIdx];
    return this.tuning.apexDwellMultiplier;
  }

  public cycleMaxSpeed(): number {
    const steps = [1.0, 1.4, 2.0, 0.7];
    const curIdx = steps.findIndex(s => Math.abs(s - this.tuning.maxSpeedMultiplier) < 0.05);
    const nextIdx = (curIdx + 1) % steps.length;
    this.tuning.maxSpeedMultiplier = steps[nextIdx];
    return this.tuning.maxSpeedMultiplier;
  }

  public cycleOrbitRadius(): number {
    const steps = [75, 110, 55];
    const curIdx = steps.indexOf(this.tuning.orbitRadius);
    const nextIdx = (curIdx + 1) % steps.length;
    this.tuning.orbitRadius = steps[nextIdx];
    for (const orb of this.orbs) {
      orb.orbitRadius = this.tuning.orbitRadius;
    }
    return this.tuning.orbitRadius;
  }

  public resetTuning(): void {
    this.tuning = {
      tensionMultiplier: 1.0,
      apexDwellMultiplier: 1.0,
      maxSpeedMultiplier: 1.0,
      orbitRadius: 75,
    };
    for (const orb of this.orbs) {
      orb.orbitRadius = 75;
    }
  }

  public setOrbCount(count: number, playerX: number, playerY: number): number {
    const targetCount = Math.max(1, Math.min(3, count));
    while (this.orbs.length < targetCount) {
      const offset = this.orbs.length * 35;
      this.spawn(playerX + (Math.random() - 0.5) * 40, playerY - 60 - offset);
    }
    while (this.orbs.length > targetCount) {
      this.orbs.pop();
    }
    return this.orbs.length;
  }

  public cycleOrbCount(playerX: number, playerY: number): number {
    const next = (this.orbs.length % 3) + 1;
    return this.setOrbCount(next, playerX, playerY);
  }

  public toggleCollisionMode(): GeminiCollisionMode {
    this.collisionMode = this.collisionMode === 'PENETRATE' ? 'REFLECT' : 'PENETRATE';
    for (const orb of this.orbs) {
      orb.collisionMode = this.collisionMode;
    }
    return this.collisionMode;
  }

  public setCollisionMode(mode: GeminiCollisionMode): void {
    this.collisionMode = mode;
    for (const orb of this.orbs) {
      orb.collisionMode = mode;
    }
  }

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

  public toggleOrbit(playerX: number, playerY: number): boolean {
    if (this.orbs.length === 0) return false;
    const firstOrb = this.orbs[0];
    const willOrbit = firstOrb.mode !== 'ORBIT';

    for (const orb of this.orbs) {
      if (willOrbit) {
        orb.mode = 'ORBIT';
        const dx = orb.x - playerX;
        const dy = orb.y - playerY;
        const dist = Math.hypot(dx, dy) || 1;
        orb.orbitRadius = Math.max(38, Math.min(240, dist));
        orb.orbitAngle = Math.atan2(dy, dx);
        orb.orbitAngularVel = 0.065;
      } else {
        orb.mode = 'SLING';
      }
    }
    return willOrbit;
  }

  public setMode(mode: 'SLING' | 'ORBIT', playerX: number, playerY: number): void {
    for (const orb of this.orbs) {
      if (orb.mode !== mode) {
        if (mode === 'ORBIT') {
          orb.mode = 'ORBIT';
          const dx = orb.x - playerX;
          const dy = orb.y - playerY;
          const dist = Math.hypot(dx, dy) || 1;
          orb.orbitRadius = Math.max(38, Math.min(240, dist));
          orb.orbitAngle = Math.atan2(dy, dx);
          orb.orbitAngularVel = 0.065;
        } else {
          orb.mode = 'SLING';
        }
      }
    }
  }

  public getEffectiveDamage(orb: GeminiOrb): number {
    const baseDamage = orb.level === 1 ? 1 : orb.level === 2 ? 3 : 8;
    const speed = Math.hypot(orb.vx, orb.vy);
    if (speed > 3.0) {
      // Kinetic speed scaling (勢いが強いと威力が大)
      const multiplier = 1 + (speed - 3.0) / 4.0;
      return Math.round(baseDamage * multiplier);
    }
    return baseDamage;
  }

  public getEffectiveRadius(orb: GeminiOrb): number {
    const baseR = orb.level === 1 ? 16 : orb.level === 2 ? 24 : 32;
    const speed = Math.hypot(orb.vx, orb.vy);
    if (speed > 4.5) {
      // Speed expansion (サイズも大きくなる)
      return baseR * 1.3;
    }
    if (orb.isHoveringApex) {
      // Apex dwell resonance expansion
      return baseR * 1.25;
    }
    return baseR;
  }

  public getTelemetry(playerX: number, playerY: number): {
    dist: number;
    speed: number;
    tangentSpeed: number;
    mode: 'SLING' | 'ORBIT';
    collisionMode: GeminiCollisionMode;
    isApex: boolean;
    orbitRadius: number;
    effectiveDamage: number;
    screenEdgeBounce: boolean;
    orbCount: number;
    tuning: PhysicsTuningState;
  } {
    if (this.orbs.length === 0) {
      return {
        dist: 0,
        speed: 0,
        tangentSpeed: 0,
        mode: 'SLING',
        collisionMode: this.collisionMode,
        isApex: false,
        orbitRadius: this.tuning.orbitRadius,
        effectiveDamage: 1,
        screenEdgeBounce: this.screenEdgeBounce,
        orbCount: 0,
        tuning: this.tuning,
      };
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
    return {
      dist: Math.round(dist),
      speed: Math.round(speed * 10) / 10,
      tangentSpeed: Math.round(tangentSpeed * 10) / 10,
      mode: orb.mode,
      collisionMode: orb.collisionMode || this.collisionMode,
      isApex: orb.isHoveringApex,
      orbitRadius: Math.round(orb.orbitRadius),
      effectiveDamage: this.getEffectiveDamage(orb),
      screenEdgeBounce: this.screenEdgeBounce,
      orbCount: this.orbs.length,
      tuning: this.tuning,
    };
  }

  public spawn(x: number, y: number, initialVx: number = 0, initialVy: number = -4.0): GeminiOrb {
    const orb: GeminiOrb = {
      id: `gemini_${++this.orbCounter}`,
      x,
      y,
      vx: initialVx || (Math.random() - 0.5) * 2.0,
      vy: initialVy || -4.5,
      level: 1,
      radius: 16,
      damage: 1,
      trail: [],
      fuseTimer: 20,
      mode: 'SLING',
      collisionMode: this.collisionMode,
      orbitRadius: this.tuning.orbitRadius,
      orbitAngle: -Math.PI / 2,
      orbitAngularVel: 0.065,
      apexDwellTimer: 0,
      isHoveringApex: false,
    };
    this.orbs.push(orb);
    return orb;
  }

  public update(
    playerX: number,
    playerY: number,
    playerVx: number = 0,
    playerVy: number = 0,
    onMerge?: (level: number, x: number, y: number) => void,
    onWallHit?: (x: number, y: number) => void
  ): void {
    const cfg = PHYSICS_PRESETS[this.currentPresetId];
    const springK = cfg.springK * this.tuning.tensionMultiplier;
    const springNonlinear = cfg.springNonlinear * this.tuning.tensionMultiplier;
    const apexThreshold = cfg.apexThreshold * this.tuning.apexDwellMultiplier;

    for (let i = 0; i < this.orbs.length; i++) {
      const orb = this.orbs[i];

      // Motion trail
      orb.trail.unshift({ x: orb.x, y: orb.y, alpha: 0.88 });
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

      // Vector from Gemini to Player
      const dx = playerX - orb.x;
      const dy = playerY - orb.y;
      const dist = Math.hypot(dx, dy) || 1;
      const ux = dx / dist; // unit vector pointing toward player
      const uy = dy / dist;

      if (orb.mode === 'ORBIT') {
        // --- MODE ②: TETHERED ORBIT / WHIRLING FLAIL (公転紐ロック旋回) ---
        const tx = -Math.sin(orb.orbitAngle);
        const ty = Math.cos(orb.orbitAngle);

        const playerTangential = playerVx * tx + playerVy * ty;
        orb.orbitAngularVel += (playerTangential / orb.orbitRadius) * cfg.orbitTransfer;

        orb.orbitAngularVel = orb.orbitAngularVel * 0.985 + (cfg.orbitBaseSpeed * 0.015);
        orb.orbitAngularVel = Math.max(-0.25, Math.min(0.25, orb.orbitAngularVel));

        orb.orbitAngle += orb.orbitAngularVel;

        orb.x = playerX + Math.cos(orb.orbitAngle) * orb.orbitRadius;
        orb.y = playerY + Math.sin(orb.orbitAngle) * orb.orbitRadius;

        orb.vx = playerVx + tx * (orb.orbitRadius * orb.orbitAngularVel);
        orb.vy = playerVy + ty * (orb.orbitRadius * orb.orbitAngularVel);

        orb.isHoveringApex = false;
        orb.apexDwellTimer = 0;

      } else {
        // --- MODE ①: YO-YO & BOOMERANG SLING PHYSICS ---
        const stretch = Math.max(0, dist - 16);
        const linearForce = stretch * springK;
        const nonlinearForce = springNonlinear * Math.pow(stretch / 100, 2);
        const totalAccel = Math.min(1.8, linearForce + nonlinearForce);

        orb.vx += ux * totalAccel;
        orb.vy += uy * totalAccel;

        orb.vx *= cfg.damping;
        orb.vy *= cfg.damping;

        if (dist < 32 && Math.hypot(orb.vx, orb.vy) < 1.2) {
          orb.vx *= 0.92;
          orb.vy *= 0.92;
        }

        const curSpeed = Math.hypot(orb.vx, orb.vy);
        const maxSpd = (cfg.maxSpeed + (orb.level - 1) * 1.5) * this.tuning.maxSpeedMultiplier;
        if (curSpeed > maxSpd) {
          orb.vx = (orb.vx / curSpeed) * maxSpd;
          orb.vy = (orb.vy / curSpeed) * maxSpd;
        }

        // Apex Dwell Detection
        if (dist > 50 && curSpeed < apexThreshold) {
          orb.isHoveringApex = true;
          orb.apexDwellTimer++;
        } else {
          orb.isHoveringApex = false;
          orb.apexDwellTimer = 0;
        }

        orb.x += orb.vx;
        orb.y += orb.vy;

        // Screen boundary collision behavior
        if (this.screenEdgeBounce) {
          let bounced = false;
          if (orb.x < 14) { orb.x = 14; orb.vx = Math.abs(orb.vx) * 0.95; bounced = true; }
          if (orb.x > 346) { orb.x = 346; orb.vx = -Math.abs(orb.vx) * 0.95; bounced = true; }
          if (orb.y < 24) { orb.y = 24; orb.vy = Math.abs(orb.vy) * 0.95; bounced = true; }
          if (orb.y > 516) { orb.y = 516; orb.vy = -Math.abs(orb.vy) * 0.95; bounced = true; }
          if (bounced && onWallHit) {
            onWallHit(orb.x, orb.y);
          }
        } else {
          // 画面端に当たり判定がない: pass-through beyond screen, gentle containment far offscreen
          if (orb.x < -120) { orb.x = -120; orb.vx *= 0.5; }
          if (orb.x > 480) { orb.x = 480; orb.vx *= 0.5; }
          if (orb.y < -120) { orb.y = -120; orb.vy *= 0.5; }
          if (orb.y > 640) { orb.y = 640; orb.vy *= 0.5; }
        }
      }
    }

    // Check for Gemini Fusion
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
