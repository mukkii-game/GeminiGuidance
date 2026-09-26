import { GeminiCollisionMode, GeminiOrb, PhysicsPresetConfig, PhysicsPresetId, PhysicsTuningState } from '../types';

export const PHYSICS_PRESETS: Record<PhysicsPresetId, PhysicsPresetConfig> = {
  SNAP_SLING: {
    id: 'SNAP_SLING',
    name: 'SNAP SLING',
    nameJa: '標準突き (ヨーヨー)',
    descJa: '前後に小気味よく突き刺すホーミング＆火の玉チャージ',
    springK: 0.0008,
    springNonlinear: 0.018,
    damping: 0.993,
    maxSpeed: 2.4,
    apexThreshold: 0.45,
    orbitBaseSpeed: 0.035,
    orbitTransfer: 0.20,
  },
  HYPER_BOOMERANG: {
    id: 'HYPER_BOOMERANG',
    name: 'HYPER BOOMERANG',
    nameJa: '大遠投ブーメラン',
    descJa: '低空気抵抗で遠くへ伸びる大弧線突き',
    springK: 0.0005,
    springNonlinear: 0.011,
    damping: 0.997,
    maxSpeed: 2.8,
    apexThreshold: 0.40,
    orbitBaseSpeed: 0.028,
    orbitTransfer: 0.16,
  },
  GIGANTIC_SPRING: {
    id: 'GIGANTIC_SPRING',
    name: 'GIGANTIC SPRING',
    nameJa: '超加速パチンコ (高反発)',
    descJa: '離すほど猛烈に火の玉化して突進する強力バネ',
    springK: 0.0010,
    springNonlinear: 0.032,
    damping: 0.990,
    maxSpeed: 3.1,
    apexThreshold: 0.50,
    orbitBaseSpeed: 0.040,
    orbitTransfer: 0.24,
  },
  HEAVY_WRECKER: {
    id: 'HEAVY_WRECKER',
    name: 'HEAVY WRECKER',
    nameJa: '重量分銅 (高質量)',
    descJa: '重い質量感。折り返しでの滞空時間が長く敵を押し戻す',
    springK: 0.0006,
    springNonlinear: 0.014,
    damping: 0.995,
    maxSpeed: 2.1,
    apexThreshold: 0.55,
    orbitBaseSpeed: 0.024,
    orbitTransfer: 0.14,
  },
  RAPID_ORBIT: {
    id: 'RAPID_ORBIT',
    name: 'RAPID ORBIT',
    nameJa: '高速公転バリア',
    descJa: 'タップ時の光のロープ拘束と追従性が最も高い防御型',
    springK: 0.00085,
    springNonlinear: 0.016,
    damping: 0.992,
    maxSpeed: 2.25,
    apexThreshold: 0.45,
    orbitBaseSpeed: 0.048,
    orbitTransfer: 0.28,
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
        // Lock tether to exact distance at this moment (Hammerfight style)
        const r = Math.max(40, Math.min(180, dist));
        orb.tetherLength = r;
        orb.orbitRadius = r;
        orb.orbitAngle = Math.atan2(dy, dx);

        // Initial spin kick
        const tx = -dy / dist;
        const ty = dx / dist;
        orb.vx += tx * 1.2;
        orb.vy += ty * 1.2;

        // Tier classification: SHORT (< 65), MEDIUM (65 - 125), LONG (>= 125)
        if (r < 65) {
          orb.orbitTier = 'SHORT';
          orb.orbitAngularVel = 0.055;
        } else if (r < 125) {
          orb.orbitTier = 'MEDIUM';
          orb.orbitAngularVel = 0.038;
        } else {
          orb.orbitTier = 'LONG';
          orb.orbitAngularVel = 0.025;
        }
        lastTier = orb.orbitTier;
        lastRadius = Math.round(r);
        orb.isCharged = false;
        orb.isHoveringApex = false;
      } else {
        orb.mode = 'SLING';
        orb.orbitTier = undefined;
        orb.strokePhase = 'RETURN';
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
          const r = Math.max(40, Math.min(180, dist));
          orb.tetherLength = r;
          orb.orbitRadius = r;
          orb.orbitAngle = Math.atan2(dy, dx);
          const tx = -dy / dist;
          const ty = dx / dist;
          orb.vx += tx * 1.2;
          orb.vy += ty * 1.2;
          if (r < 65) {
            orb.orbitTier = 'SHORT';
            orb.orbitAngularVel = 0.055;
          } else if (r < 125) {
            orb.orbitTier = 'MEDIUM';
            orb.orbitAngularVel = 0.038;
          } else {
            orb.orbitTier = 'LONG';
            orb.orbitAngularVel = 0.025;
          }
          orb.isCharged = false;
          orb.isHoveringApex = false;
        } else {
          orb.mode = 'SLING';
          orb.orbitTier = undefined;
          orb.strokePhase = 'RETURN';
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
        return Math.max(1, Math.round(baseDamage * 0.75));
      } else if (orb.orbitTier === 'LONG') {
        return Math.round(baseDamage * 3.5);
      } else {
        return Math.round(baseDamage * 1.5);
      }
    } else {
      // ① Mode: Yo-yo / Spear Thrust
      if (orb.isCharged) {
        return Math.round(baseDamage * 3.5);
      }
      const speed = Math.hypot(orb.vx, orb.vy);
      if (speed > 0.9) {
        const multiplier = 1 + (speed - 0.9) / 1.25;
        return Math.round(baseDamage * multiplier);
      }
      return baseDamage;
    }
  }

  public getEffectiveRadius(orb: GeminiOrb): number {
    const baseR = orb.level === 1 ? 16 : orb.level === 2 ? 24 : 32;
    if (orb.mode === 'ORBIT') {
      if (orb.orbitTier === 'SHORT') {
        return baseR * 0.75;
      } else if (orb.orbitTier === 'LONG') {
        return baseR * 1.65;
      } else {
        return baseR * 1.0;
      }
    } else {
      if (orb.isCharged) {
        return baseR * 1.35;
      }
      if (orb.isHoveringApex) {
        return baseR * 1.25;
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

  public spawn(x: number, y: number, initialVx: number = 0, initialVy: number = -2.2): GeminiOrb {
    const orb: GeminiOrb = {
      id: `gemini_${++this.orbCounter}`,
      x,
      y,
      vx: initialVx || (Math.random() - 0.5) * 1.0,
      vy: initialVy || -2.2,
      level: 1,
      radius: 16,
      damage: 1,
      trail: [],
      fuseTimer: 20,
      mode: 'SLING',
      collisionMode: this.collisionMode,
      orbitRadius: this.tuning.orbitRadius,
      orbitAngle: -Math.PI / 2,
      orbitAngularVel: 0.045,
      apexDwellTimer: 0,
      isHoveringApex: false,
      strokePhase: 'OUTWARD',
      castTargetX: x,
      castTargetY: y - 80,
      tetherLength: this.tuning.orbitRadius,
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

      if (orb.mode === 'ORBIT') {
        // --- MODE ②: HAMMERFIGHT TETHERED FLAIL (物理ロープ＆分銅スイング) ---
        orb.isCharged = false;
        orb.chargeRatio = 0;
        orb.isHoveringApex = false;
        orb.apexDwellTimer = 0;

        const fDx = orb.x - playerX;
        const fDy = orb.y - playerY;
        const fDist = Math.hypot(fDx, fDy) || 1;
        const fUx = fDx / fDist; // unit vector pointing outward from ship to flail
        const fUy = fDy / fDist;
        const fTx = -fUy; // tangent unit vector
        const fTy = fUx;

        const maxL = (orb.tetherLength || orb.orbitRadius || 75) * (this.tuning.orbitRadius / 75);
        const relVx = orb.vx - playerVx;
        const relVy = orb.vy - playerVy;
        const radialVel = relVx * fUx + relVy * fUy;

        // Rope tension constraint (Hammerfight rope tension)
        if (fDist > maxL) {
          const stretch = fDist - maxL;
          const kRope = 0.22;
          const springForce = stretch * kRope;
          const damperForce = Math.max(0, radialVel) * 0.70;
          const tension = springForce + damperForce;

          orb.vx -= fUx * tension;
          orb.vy -= fUy * tension;

          // Hard position constraint clamp
          if (fDist > maxL * 1.22) {
            orb.x = playerX + fUx * (maxL * 1.22);
            orb.y = playerY + fUy * (maxL * 1.22);
            if (radialVel > 0) {
              orb.vx -= radialVel * fUx;
              orb.vy -= radialVel * fUy;
            }
          }
        }

        // Whip momentum transfer: player ship motion adds directly to tangential swing
        const playerTangential = playerVx * fTx + playerVy * fTy;
        orb.vx += fTx * (playerTangential * 0.28);
        orb.vy += fTy * (playerTangential * 0.28);

        // Hammerfight rotational persistence (subtle momentum retention)
        const curTangential = orb.vx * fTx + orb.vy * fTy;
        const spinSign = curTangential >= 0 ? 1 : -1;
        const targetBaseSpeed = orb.orbitTier === 'SHORT' ? 1.3 : orb.orbitTier === 'LONG' ? 0.85 : 1.05;
        if (Math.abs(curTangential) < targetBaseSpeed) {
          orb.vx += fTx * spinSign * 0.032;
          orb.vy += fTy * spinSign * 0.032;
        }

        // Air drag
        orb.vx *= 0.993;
        orb.vy *= 0.993;

        // Speed limit
        const maxSpd = (cfg.maxSpeed * 1.2) * this.tuning.maxSpeedMultiplier;
        const curSpd = Math.hypot(orb.vx, orb.vy);
        if (curSpd > maxSpd) {
          orb.vx = (orb.vx / curSpd) * maxSpd;
          orb.vy = (orb.vy / curSpd) * maxSpd;
        }

        orb.x += orb.vx;
        orb.y += orb.vy;

        orb.orbitAngle = Math.atan2(orb.y - playerY, orb.x - playerX);
        orb.orbitRadius = Math.hypot(orb.x - playerX, orb.y - playerY);

        // Screen bounce in orbit mode if enabled
        if (this.screenEdgeBounce) {
          let bounced = false;
          if (orb.x < 14) { orb.x = 14; orb.vx = Math.abs(orb.vx) * 0.9; bounced = true; }
          if (orb.x > 346) { orb.x = 346; orb.vx = -Math.abs(orb.vx) * 0.9; bounced = true; }
          if (orb.y < 24) { orb.y = 24; orb.vy = Math.abs(orb.vy) * 0.9; bounced = true; }
          if (orb.y > 516) { orb.y = 516; orb.vy = -Math.abs(orb.vy) * 0.9; bounced = true; }
          if (bounced && onWallHit) onWallHit(orb.x, orb.y);
        }

      } else {
        // --- MODE ①: YO-YO SPEAR THRUST & ANALOG RHYTHM SWING ---
        if (!orb.strokePhase) {
          orb.strokePhase = 'RETURN';
        }

        const dist = Math.hypot(playerX - orb.x, playerY - orb.y) || 1;
        const pSpeed = Math.hypot(playerVx, playerVy);

        // 1. Throw / Thrust Launch Detection:
        // When orb is near player and player pushes forward / darts:
        if (dist < 44 && pSpeed > 0.40) {
          const pUx = playerVx / pSpeed;
          const pUy = playerVy / pSpeed;
          const reach = Math.min(240, 95 + pSpeed * 55);
          orb.castTargetX = playerX + pUx * reach;
          orb.castTargetY = playerY + pUy * reach;
          orb.vx += pUx * (pSpeed * 1.35 + 1.2);
          orb.vy += pUy * (pSpeed * 1.35 + 1.2);
          orb.strokePhase = 'OUTWARD';
          orb.isCharged = true;
          orb.chargeRatio = 1.0;
          orb.apexDwellTimer = 0;
        }

        // Advance target anchor if player continues pushing in the throw direction
        if (orb.strokePhase === 'OUTWARD' && orb.castTargetX !== undefined && orb.castTargetY !== undefined) {
          const advDx = orb.castTargetX - playerX;
          const advDy = orb.castTargetY - playerY;
          const dotAdv = playerVx * advDx + playerVy * advDy;
          if (dotAdv > 0) {
            orb.castTargetX += playerVx * 1.1;
            orb.castTargetY += playerVy * 1.1;
          }
        }

        if (orb.strokePhase === 'OUTWARD') {
          // OUTWARD: Commits to flying towards cast apex!
          // Moving player backwards does NOT cancel this outward flight!
          const tDx = (orb.castTargetX ?? playerX) - orb.x;
          const tDy = (orb.castTargetY ?? (playerY - 90)) - orb.y;
          const tDist = Math.hypot(tDx, tDy) || 1;
          const tUx = tDx / tDist;
          const tUy = tDy / tDist;
          const forwardVel = orb.vx * tUx + orb.vy * tUy;

          // Drag and target tracking
          orb.vx *= cfg.damping;
          orb.vy *= cfg.damping;
          const toApexAccel = Math.min(0.20, tDist * 0.002);
          orb.vx += tUx * toApexAccel;
          orb.vy += tUy * toApexAccel;

          // If player pulls back while orb is flying out, string tightens -> FIREBALL CHARGE!
          const rDx = playerX - orb.x;
          const rDy = playerY - orb.y;
          const rDist = Math.hypot(rDx, rDy) || 1;
          if (rDist > 45) {
            orb.isCharged = true;
            orb.chargeRatio = Math.min(1.0, (rDist - 30) / 75);
          }

          // Apex Reach Condition:
          // Near destination OR forward speed dropped below threshold
          if (tDist < 16 || forwardVel < apexThreshold) {
            orb.strokePhase = 'APEX';
            orb.apexDwellTimer = Math.max(8, Math.round(18 * this.tuning.apexDwellMultiplier));
            orb.isHoveringApex = true;
          }

        } else if (orb.strokePhase === 'APEX') {
          // APEX: Hover in place, spin and deliver multi-hit damage
          orb.vx *= 0.82;
          orb.vy *= 0.82;
          orb.isHoveringApex = true;
          orb.apexDwellTimer--;
          if (orb.apexDwellTimer <= 0) {
            orb.strokePhase = 'RETURN';
            orb.isHoveringApex = false;
          }

        } else {
          // RETURN: Accelerates toward player's current position!
          const rDx = playerX - orb.x;
          const rDy = playerY - orb.y;
          const rDist = Math.hypot(rDx, rDy) || 1;
          const rUx = rDx / rDist;
          const rUy = rDy / rDist;

          const stretch = Math.max(0, rDist - 10);
          const linearForce = stretch * springK;
          const nonlinearForce = springNonlinear * Math.pow(stretch / 65, 2);
          const totalAccel = Math.min(0.90, linearForce + nonlinearForce);

          orb.vx += rUx * totalAccel;
          orb.vy += rUy * totalAccel;
          orb.vx *= cfg.damping;
          orb.vy *= cfg.damping;

          // Charge detection on return
          const dotTowardPlayer = orb.vx * rUx + orb.vy * rUy;
          if (rDist > 45 && dotTowardPlayer > 0.35) {
            orb.isCharged = true;
            orb.chargeRatio = Math.min(1.0, (rDist - 30) / 75);
          }

          // Crossing / approaching player
          if (rDist < 36) {
            const curSpd = Math.hypot(orb.vx, orb.vy);
            if (pSpeed > 0.35 || curSpd > 0.7) {
              // RHYTHMIC MOMENTUM TRANSFER! Player pumps the swing like a swing / yo-yo!
              orb.vx += playerVx * 1.35;
              orb.vy += playerVy * 1.35;
              const newSpd = Math.hypot(orb.vx, orb.vy);
              if (newSpd > 0.5) {
                const throwReach = Math.min(250, 95 + newSpd * 50);
                orb.castTargetX = orb.x + (orb.vx / newSpd) * throwReach;
                orb.castTargetY = orb.y + (orb.vy / newSpd) * throwReach;
                orb.strokePhase = 'OUTWARD';
                orb.isCharged = true;
                orb.apexDwellTimer = 0;
              }
            } else {
              // Gentle hover near ship
              orb.vx *= 0.88;
              orb.vy *= 0.88;
              orb.isCharged = false;
            }
          }
        }

        // Max speed clamp
        const curSpeed = Math.hypot(orb.vx, orb.vy);
        const maxSpd = (cfg.maxSpeed + (orb.level - 1) * 0.4) * this.tuning.maxSpeedMultiplier;
        if (curSpeed > maxSpd) {
          orb.vx = (orb.vx / curSpeed) * maxSpd;
          orb.vy = (orb.vy / curSpeed) * maxSpd;
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
          if (bounced) {
            if (orb.strokePhase === 'OUTWARD') {
              orb.strokePhase = 'APEX';
              orb.apexDwellTimer = 10;
            }
            if (onWallHit) onWallHit(orb.x, orb.y);
          }
        } else {
          // Offscreen gentle drag
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
