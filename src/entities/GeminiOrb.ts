import { GeminiCollisionMode, GeminiOrb, PhysicsPresetConfig, PhysicsPresetId, PhysicsTuningState } from '../types';

export const PHYSICS_PRESETS: Record<PhysicsPresetId, PhysicsPresetConfig> = {
  SNAP_SLING: {
    id: 'SNAP_SLING',
    name: 'SNAP SLING',
    nameJa: '標準突き (ヨーヨー)',
    descJa: '前後に小気味よく突き刺すホーミング＆火の玉チャージ',
    springK: 0.0016,
    springNonlinear: 0.035,
    damping: 0.993,
    maxSpeed: 4.8,
    apexThreshold: 0.9,
    orbitBaseSpeed: 0.055,
    orbitTransfer: 0.20,
  },
  HYPER_BOOMERANG: {
    id: 'HYPER_BOOMERANG',
    name: 'HYPER BOOMERANG',
    nameJa: '大遠投ブーメラン',
    descJa: '低空気抵抗で遠くへ伸びる大弧線突き',
    springK: 0.0010,
    springNonlinear: 0.022,
    damping: 0.997,
    maxSpeed: 5.6,
    apexThreshold: 0.8,
    orbitBaseSpeed: 0.045,
    orbitTransfer: 0.16,
  },
  GIGANTIC_SPRING: {
    id: 'GIGANTIC_SPRING',
    name: 'GIGANTIC SPRING',
    nameJa: '超加速パチンコ (高反発)',
    descJa: '離すほど猛烈に火の玉化して突進する強力バネ',
    springK: 0.0020,
    springNonlinear: 0.065,
    damping: 0.990,
    maxSpeed: 6.2,
    apexThreshold: 1.0,
    orbitBaseSpeed: 0.065,
    orbitTransfer: 0.24,
  },
  HEAVY_WRECKER: {
    id: 'HEAVY_WRECKER',
    name: 'HEAVY WRECKER',
    nameJa: '重量分銅 (高質量)',
    descJa: '重い質量感。折り返しでの滞空時間が長く敵を押し戻す',
    springK: 0.0012,
    springNonlinear: 0.028,
    damping: 0.995,
    maxSpeed: 4.2,
    apexThreshold: 1.1,
    orbitBaseSpeed: 0.038,
    orbitTransfer: 0.14,
  },
  RAPID_ORBIT: {
    id: 'RAPID_ORBIT',
    name: 'RAPID ORBIT',
    nameJa: '高速公転バリア',
    descJa: 'タップ時の光のロープ拘束と追従性が最も高い防御型',
    springK: 0.0017,
    springNonlinear: 0.032,
    damping: 0.992,
    maxSpeed: 4.5,
    apexThreshold: 0.9,
    orbitBaseSpeed: 0.080,
    orbitTransfer: 0.30,
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

  public toggleOrbit(playerX: number, playerY: number): { isOrbit: boolean; tier?: 'SHORT' | 'MEDIUM' | 'LONG'; radius?: number } {
    if (this.orbs.length === 0) return { isOrbit: false };
    const firstOrb = this.orbs[0];
    const willOrbit = firstOrb.mode !== 'ORBIT';

    let lastTier: 'SHORT' | 'MEDIUM' | 'LONG' = 'MEDIUM';
    let lastRadius = 75;

    for (let i = 0; i < this.orbs.length; i++) {
      const orb = this.orbs[i];
      if (willOrbit) {
        orb.mode = 'ORBIT';
        const dx = orb.x - playerX;
        const dy = orb.y - playerY;
        const dist = Math.hypot(dx, dy) || 1;
        // Lock tether to exact distance at this moment!
        const r = Math.max(34, Math.min(220, dist));
        orb.orbitRadius = r;
        orb.orbitAngle = Math.atan2(dy, dx);

        // Tier classification: SHORT (< 65), MEDIUM (65 - 125), LONG (>= 125)
        if (r < 65) {
          orb.orbitTier = 'SHORT';
          orb.orbitAngularVel = 0.080; // High speed barrier
        } else if (r < 125) {
          orb.orbitTier = 'MEDIUM';
          orb.orbitAngularVel = 0.052; // Balanced crowd sweeper
        } else {
          orb.orbitTier = 'LONG';
          orb.orbitAngularVel = 0.035; // Heavy flail (spin up with mouse motion)
        }
        lastTier = orb.orbitTier;
        lastRadius = Math.round(r);
        orb.isCharged = false;
      } else {
        orb.mode = 'SLING';
        orb.orbitTier = undefined;
        orb.isCharged = false;
      }
    }
    return { isOrbit: willOrbit, tier: willOrbit ? lastTier : undefined, radius: lastRadius };
  }

  public setMode(mode: 'SLING' | 'ORBIT', playerX: number, playerY: number): void {
    for (const orb of this.orbs) {
      if (orb.mode !== mode) {
        if (mode === 'ORBIT') {
          orb.mode = 'ORBIT';
          const dx = orb.x - playerX;
          const dy = orb.y - playerY;
          const dist = Math.hypot(dx, dy) || 1;
          const r = Math.max(34, Math.min(220, dist));
          orb.orbitRadius = r;
          orb.orbitAngle = Math.atan2(dy, dx);
          if (r < 65) {
            orb.orbitTier = 'SHORT';
            orb.orbitAngularVel = 0.080;
          } else if (r < 125) {
            orb.orbitTier = 'MEDIUM';
            orb.orbitAngularVel = 0.052;
          } else {
            orb.orbitTier = 'LONG';
            orb.orbitAngularVel = 0.035;
          }
          orb.isCharged = false;
        } else {
          orb.mode = 'SLING';
          orb.orbitTier = undefined;
          orb.isCharged = false;
        }
      }
    }
  }

  public getEffectiveDamage(orb: GeminiOrb): number {
    const baseDamage = orb.level === 1 ? 1 : orb.level === 2 ? 3 : 8;
    if (orb.mode === 'ORBIT') {
      // ② Tethered Flail
      if (orb.orbitTier === 'SHORT') {
        // Small barrier: lower damage (0.75x)
        return Math.max(1, Math.round(baseDamage * 0.75));
      } else if (orb.orbitTier === 'LONG') {
        // Gigantic heavy flail: massive damage (3.5x)!
        return Math.round(baseDamage * 3.5);
      } else {
        // Medium sweep: solid damage (1.5x)
        return Math.round(baseDamage * 1.5);
      }
    } else {
      // ① Mode: Yo-yo / Spear Thrust
      if (orb.isCharged) {
        // Super charged fiery thrust: 3.5x massive damage!
        return Math.round(baseDamage * 3.5);
      }
      const speed = Math.hypot(orb.vx, orb.vy);
      if (speed > 1.8) {
        const multiplier = 1 + (speed - 1.8) / 2.5;
        return Math.round(baseDamage * multiplier);
      }
      return baseDamage;
    }
  }

  public getEffectiveRadius(orb: GeminiOrb): number {
    const baseR = orb.level === 1 ? 16 : orb.level === 2 ? 24 : 32;
    if (orb.mode === 'ORBIT') {
      // ② Tethered Flail
      if (orb.orbitTier === 'SHORT') {
        return baseR * 0.75; // Small, agile protective shield
      } else if (orb.orbitTier === 'LONG') {
        return baseR * 1.65; // GIGANTIC WRECKING BALL!
      } else {
        return baseR * 1.0; // Standard sweep
      }
    } else {
      // ① Mode: Yo-yo / Spear Thrust
      if (orb.isCharged) {
        return baseR * 1.35; // Expands with blazing plasma flames!
      }
      if (orb.isHoveringApex) {
        return baseR * 1.25; // Apex dwell resonance
      }
      return baseR;
    }
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
    isCharged: boolean;
    chargeRatio: number;
    orbitTier?: 'SHORT' | 'MEDIUM' | 'LONG';
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
        isCharged: false,
        chargeRatio: 0,
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
      isCharged: !!orb.isCharged,
      chargeRatio: orb.chargeRatio || 0,
      orbitTier: orb.orbitTier,
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
        orb.isCharged = false;
        orb.chargeRatio = 0;

        const tx = -Math.sin(orb.orbitAngle);
        const ty = Math.cos(orb.orbitAngle);

        const playerTangential = playerVx * tx + playerVy * ty;
        orb.orbitAngularVel += (playerTangential / orb.orbitRadius) * cfg.orbitTransfer;

        // Base idle rotation speed depending on tier
        const baseSpeed = orb.orbitTier === 'SHORT' ? 0.080 : orb.orbitTier === 'LONG' ? 0.035 : 0.052;
        orb.orbitAngularVel = orb.orbitAngularVel * 0.985 + (baseSpeed * 0.015);
        orb.orbitAngularVel = Math.max(-0.20, Math.min(0.20, orb.orbitAngularVel));

        orb.orbitAngle += orb.orbitAngularVel;

        orb.x = playerX + Math.cos(orb.orbitAngle) * orb.orbitRadius;
        orb.y = playerY + Math.sin(orb.orbitAngle) * orb.orbitRadius;

        orb.vx = playerVx + tx * (orb.orbitRadius * orb.orbitAngularVel);
        orb.vy = playerVy + ty * (orb.orbitRadius * orb.orbitAngularVel);

        orb.isHoveringApex = false;
        orb.apexDwellTimer = 0;

      } else {
        // --- MODE ①: YO-YO SPEAR THRUST & FIREBALL CHARGE ---
        const stretch = Math.max(0, dist - 12);
        // Attractive homing force towards player increases with distance!
        const linearForce = stretch * springK;
        const nonlinearForce = springNonlinear * Math.pow(stretch / 70, 2);
        const totalAccel = Math.min(1.2, linearForce + nonlinearForce);

        orb.vx += ux * totalAccel;
        orb.vy += uy * totalAccel;

        orb.vx *= cfg.damping;
        orb.vy *= cfg.damping;

        if (dist < 28 && Math.hypot(orb.vx, orb.vy) < 0.9) {
          orb.vx *= 0.92;
          orb.vy *= 0.92;
        }

        const curSpeed = Math.hypot(orb.vx, orb.vy);
        const maxSpd = (cfg.maxSpeed + (orb.level - 1) * 0.8) * this.tuning.maxSpeedMultiplier;
        if (curSpeed > maxSpd) {
          orb.vx = (orb.vx / curSpeed) * maxSpd;
          orb.vy = (orb.vy / curSpeed) * maxSpd;
        }

        // Velocity projection onto vector towards player
        const dotTowardPlayer = orb.vx * ux + orb.vy * uy;

        // CHARGE / FIREBALL DETECTION:
        // 1. When Gemini is pulled far (dist > 60px) and accelerating fast toward player (dotTowardPlayer > 0.6)
        if (dist > 60 && dotTowardPlayer > 0.6) {
          orb.isCharged = true;
          orb.chargeRatio = Math.min(1.0, (dist - 40) / 90);
        }

        // 2. When shooting past player on outward thrust, it stays charged until slowing down near apex!
        if (orb.isCharged) {
          if (curSpeed < apexThreshold * 1.1) {
            orb.isCharged = false;
            orb.chargeRatio = 0;
          }
        }

        // Apex Dwell Detection
        if (dist > 45 && curSpeed < apexThreshold) {
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
