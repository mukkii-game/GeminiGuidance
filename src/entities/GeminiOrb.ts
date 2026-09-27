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
    tensionMultiplier: 1.0,  // 加速度倍率: 0.6, 0.8, 1.0 (標準), 1.3, 1.6, 2.0
    maxTurnRate: 0.040,      // 1フレーム最大曲がり角度: 0.02, 0.03, 0.04 (標準約2.3°), 0.055, 0.075, 0.10
    damping: 0.993,          // 減衰率: 0.985 (強減衰), 0.990 (中), 0.993 (標準), 0.996 (弱), 0.998 (極弱)
    maxSpeedMultiplier: 1.0, // 最高速度倍率: 0.6, 0.8, 1.0 (標準), 1.3, 1.6, 2.0
    apexDwellMultiplier: 1.0,
    orbitRadius: 75,
    overshootRatio: 0.5,
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
    const steps = [0.6, 0.8, 1.0, 1.3, 1.6, 2.0];
    const curIdx = steps.findIndex(s => Math.abs(s - this.tuning.tensionMultiplier) < 0.06);
    const nextIdx = (curIdx + 1) % steps.length;
    this.tuning.tensionMultiplier = steps[nextIdx];
    return this.tuning.tensionMultiplier;
  }

  public cycleTurnRate(): number {
    const steps = [0.02, 0.03, 0.04, 0.055, 0.075, 0.10];
    const curIdx = steps.findIndex(s => Math.abs(s - this.tuning.maxTurnRate) < 0.005);
    const nextIdx = (curIdx + 1) % steps.length;
    this.tuning.maxTurnRate = steps[nextIdx];
    return this.tuning.maxTurnRate;
  }

  public cycleDamping(): number {
    const steps = [0.985, 0.990, 0.993, 0.996, 0.998];
    const curIdx = steps.findIndex(s => Math.abs(s - this.tuning.damping) < 0.001);
    const nextIdx = (curIdx + 1) % steps.length;
    this.tuning.damping = steps[nextIdx];
    return this.tuning.damping;
  }

  public cycleMaxSpeed(direction: number = 1): number {
    const steps = [0.6, 0.8, 1.0, 1.3, 1.6, 2.0];
    const curIdx = steps.findIndex(s => Math.abs(s - this.tuning.maxSpeedMultiplier) < 0.06);
    let nextIdx: number;
    if (curIdx === -1) {
      nextIdx = 2; // 1.0
    } else {
      nextIdx = (curIdx + direction + steps.length) % steps.length;
    }
    this.tuning.maxSpeedMultiplier = steps[nextIdx];
    return this.tuning.maxSpeedMultiplier;
  }

  public cycleApexDwell(): number {
    return this.cycleTurnRate();
  }

  public cycleOvershoot(): number {
    return this.cycleDamping();
  }

  public resetTuning(): void {
    this.tuning = {
      tensionMultiplier: 1.0,
      maxTurnRate: 0.040,
      damping: 0.993,
      maxSpeedMultiplier: 1.0,
      apexDwellMultiplier: 1.0,
      orbitRadius: 75,
      overshootRatio: 0.5,
    };
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

  public toggleOrbit(playerX: number, playerY: number): { mode: 'SLING' | 'ORBIT' | 'COMET'; isOrbit: boolean; tier?: 'SHORT' | 'MEDIUM' | 'LONG'; radius?: number } {
    if (this.orbs.length === 0) return { mode: 'SLING', isOrbit: false };
    const curMode = this.orbs[0].mode;
    const nextMode: 'SLING' | 'ORBIT' | 'COMET' =
      curMode === 'SLING' ? 'ORBIT' : curMode === 'ORBIT' ? 'COMET' : 'SLING';
    this.setMode(nextMode, playerX, playerY);
    const first = this.orbs[0];
    return {
      mode: nextMode,
      isOrbit: nextMode === 'ORBIT',
      tier: first.orbitTier,
      radius: Math.round(first.orbitRadius),
    };
  }

  public setMode(mode: 'SLING' | 'ORBIT' | 'COMET', playerX: number, playerY: number): void {
    for (const orb of this.orbs) {
      if (orb.mode !== mode) {
        orb.mode = mode;
        if (mode === 'ORBIT') {
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
        } else if (mode === 'COMET') {
          // ③ ハレー彗星スイングバイ・ホーミング初期化
          orb.orbitTier = undefined;
          orb.isHoveringApex = false;
          orb.apexDwellTimer = 0;
          const dx = orb.x - playerX;
          const dy = orb.y - playerY;
          const dist = Math.hypot(dx, dy) || 1;
          // 接線方向の初速を与えて美しい楕円軌道に突入
          const tx = -dy / dist;
          const ty = dx / dist;
          orb.vx = tx * 1.8;
          orb.vy = ty * 1.8;
          orb.isCharged = true;
          orb.chargeRatio = 0.6;
        } else {
          // ① ヨーヨー突撃初期化
          orb.orbitTier = undefined;
          orb.strokePhase = 'INWARD';
          orb.castTargetX = playerX;
          orb.castTargetY = playerY;
          orb.strokeDist = Math.max(25, Math.hypot(orb.x - playerX, orb.y - playerY));
          orb.isCharged = false;
          orb.isHoveringApex = false;
        }
      }
    }
  }

  public getEffectiveDamage(orb: GeminiOrb): number {
    const baseDamage = orb.level === 1 ? 1 : orb.level === 2 ? 3 : 8;
    if (orb.mode === 'ORBIT') {
      // ② Tethered Flail (Hammerfight / Murofushi kinetic scaling: E = 1/2 m v^2)
      const speed = Math.hypot(orb.vx, orb.vy);
      const kineticFactor = Math.pow(speed / 1.10, 2);
      let multiplier = 1.0 + kineticFactor * 1.4;
      if (orb.spinLevel === 2) {
        multiplier += 2.2; // Massive bonus for Murofushi Giga Spin!
      }
      let tierBase = baseDamage * 1.5;
      if (orb.orbitTier === 'SHORT') tierBase = baseDamage * 0.9;
      else if (orb.orbitTier === 'LONG') tierBase = baseDamage * 2.4;
      return Math.max(1, Math.round(tierBase * multiplier));
    } else if (orb.mode === 'COMET') {
      // ③ Halley's Comet (速度二乗比例の重力運動エネルギー破壊)
      const speed = Math.hypot(orb.vx, orb.vy);
      const kineticFactor = Math.pow(speed / 1.35, 1.8);
      let multiplier = 1.2 + kineticFactor * 1.5;
      if (orb.isCharged) {
        multiplier += 2.2; // 彗星光冠チャージボーナス！
      }
      return Math.max(1, Math.round(baseDamage * multiplier));
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
      const speed = Math.hypot(orb.vx, orb.vy);
      const expandBonus = Math.min(1.4, 1.0 + (speed / 3.0) * 0.4);
      if (orb.spinLevel === 2) {
        return baseR * 1.35 * expandBonus;
      }
      if (orb.orbitTier === 'SHORT') {
        return baseR * 0.75 * expandBonus;
      } else if (orb.orbitTier === 'LONG') {
        return baseR * 1.65 * expandBonus;
      } else {
        return baseR * 1.0 * expandBonus;
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
    mode: 'SLING' | 'ORBIT' | 'COMET';
    isTethered: boolean;
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
    spinLevel?: number;
  } {
    if (this.orbs.length === 0) {
      return {
        dist: 0,
        speed: 0,
        tangentSpeed: 0,
        mode: 'SLING',
        isTethered: false,
        collisionMode: this.collisionMode,
        isApex: false,
        orbitRadius: this.tuning.orbitRadius,
        effectiveDamage: 1,
        screenEdgeBounce: this.screenEdgeBounce,
        orbCount: 0,
        tuning: this.tuning,
        isCharged: false,
        chargeRatio: 0,
        spinLevel: 0,
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
      isTethered: !!orb.isTethered,
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
      spinLevel: orb.spinLevel || 0,
    };
  }

  public spawn(x: number, y: number, initialVx: number = 0, initialVy: number = -2.2): GeminiOrb {
    const orb: GeminiOrb = {
      id: `gemini_${++this.orbCounter}`,
      x,
      y,
      vx: initialVx || 0,
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
      strokePhase: 'INWARD',
      castTargetX: x,
      castTargetY: y - 80,
      launchStartX: x,
      launchStartY: y,
      strokeDist: 80,
      returnGoalX: undefined,
      returnGoalY: undefined,
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
    onWallHit?: (x: number, y: number) => void,
    isTetherHeld: boolean = false,
    onRelease?: (x: number, y: number, vx: number, vy: number) => void
  ): void {
    const cfg = PHYSICS_PRESETS[this.currentPresetId];

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

      const pSpeed = Math.hypot(playerVx, playerVy);

      // --- 状態遷移 (ホールド ⇄ リリース) ---
      const wasTethered = !!orb.isTethered;
      if (isTetherHeld && !wasTethered) {
        // === ② クリックし続けている時：ヒモでジェミニを捉える ===
        orb.isTethered = true;
        orb.mode = 'ORBIT';
        const curDist = Math.hypot(orb.x - playerX, orb.y - playerY) || 1;
        orb.tetherLength = Math.max(45, Math.min(160, curDist));
      } else if (!isTetherHeld && wasTethered) {
        // === ③ クリックを離すとその加速度を持ってジェミニをリリースする ===
        orb.isTethered = false;
        orb.mode = 'SLING';
        // 投擲感: 遠心力による投げ飛ばし初速ボーナス (1.20倍)
        const spd = Math.hypot(orb.vx, orb.vy);
        if (spd > 0.4) {
          orb.vx *= 1.20;
          orb.vy *= 1.20;
        }
        if (onRelease) {
          onRelease(orb.x, orb.y, orb.vx, orb.vy);
        }
      }

      if (orb.isTethered) {
        // =========================================================================
        // ② クリックし続けている時は、ヒモでジェミニを捉える (分銅振り回し物理)
        // ユーザー指示:
        // 「ひもなので、基本はその長さを維持 ほんの少しジェミニや高い速度により引っ張られて長くもなる
        //  分銅を振り回しているような動きになるようにする
        //  ゲームなのでまずはリアルにやるが、気持ち悪いようだと思い通り回せるような補填を入れる
        //  適当に自機を回しても、自機を回しているという判定をしたときに、適当やってもうまく回転速度が上がるようにするとか」
        // =========================================================================
        orb.isHoveringApex = false;
        orb.apexDwellTimer = 0;

        const fDx = orb.x - playerX;
        const fDy = orb.y - playerY;
        const fDist = Math.hypot(fDx, fDy) || 1;
        const fUx = fDx / fDist; // 動径単位ベクトル（外向き）
        const fUy = fDy / fDist;
        const tX = -fUy; // 接線単位ベクトル（反時計回り）
        const tY = fUx;

        const L0 = orb.tetherLength || 75;

        // 1. ヒモの長さ維持＆わずかな弾性（張力）
        if (fDist > L0) {
          const stretch = fDist - L0;
          const relVx = orb.vx - playerVx;
          const relVy = orb.vy - playerVy;
          const vRadial = relVx * fUx + relVy * fUy;

          const tensionK = 0.045 * this.tuning.tensionMultiplier;
          const tensionForce = stretch * tensionK;
          const radialDamp = vRadial * 0.20; // 伸びきった時の外向き逃げを抑える

          const totalPull = Math.max(-0.2, Math.min(1.6, tensionForce + radialDamp));
          orb.vx -= fUx * totalPull;
          orb.vy -= fUy * totalPull;
        }

        // 2. 自機の移動による分銅スピンアシスト（補填）
        const curRelVx = orb.vx - playerVx;
        const curRelVy = orb.vy - playerVy;
        const vTangential = curRelVx * tX + curRelVy * tY; // 現在の接線速度
        const pTangential = playerVx * tX + playerVy * tY; // 自機の接線入力

        if (Math.abs(pTangential) > 0.2) {
          // 自機を回そうとする入力がある場合、接線方向へ力強く加速！
          const spinInputSign = Math.sign(pTangential);
          const assistForce = spinInputSign * Math.min(2.2, Math.abs(pTangential) * 0.45);
          orb.vx += tX * assistForce;
          orb.vy += tY * assistForce;
        } else if (pSpeed > 0.4 && Math.abs(vTangential) < 1.2) {
          // 自機が動いているのに分銅が止まりそうな時、自然に回頭をアシスト
          const crossProduct = playerVx * fDy - playerVy * fDx;
          const autoDir = crossProduct >= 0 ? 1 : -1;
          orb.vx += tX * (autoDir * 0.18);
          orb.vy += tY * (autoDir * 0.18);
        }

        // 自機の移動慣性伝達
        if (pSpeed > 0.2) {
          orb.vx += playerVx * 0.16;
          orb.vy += playerVy * 0.16;
        }

        // 自然な空気抵抗
        orb.vx *= 0.997;
        orb.vy *= 0.997;

        // 最高速度クランプ
        const curSpd = Math.hypot(orb.vx, orb.vy);
        const maxSpd = (cfg.maxSpeed * 1.5) * this.tuning.maxSpeedMultiplier;
        if (curSpd > maxSpd) {
          orb.vx = (orb.vx / curSpd) * maxSpd;
          orb.vy = (orb.vy / curSpd) * maxSpd;
        }

        orb.x += orb.vx;
        orb.y += orb.vy;

        orb.orbitAngle = Math.atan2(orb.y - playerY, orb.x - playerX);
        orb.orbitRadius = fDist;

        // スピン判定 & チャージ
        const currentSpin = Math.abs(vTangential);
        if (currentSpin >= 2.4) {
          orb.isCharged = true;
          orb.chargeRatio = Math.min(1.0, (currentSpin - 2.4) / 1.5);
          orb.spinLevel = 2;
        } else if (currentSpin >= 1.4) {
          orb.isCharged = false;
          orb.chargeRatio = 0.5;
          orb.spinLevel = 1;
        } else {
          orb.isCharged = false;
          orb.chargeRatio = 0;
          orb.spinLevel = 0;
        }


      } else {
        // =========================================================================
        // ① 自分に加速度つけて向かってくるジェミニ (フリーホーミング ＆ 旋回角制限)
        // ユーザー指示:
        // 「ホーミング。
        //  実質バネのような動きになるが、飛びながら一度に曲がる角度に制限があるため、
        //  直線よりは少し曲線を描いて、自機にはぎり当たらない程度の横をすり抜ける感じになる
        //  むろんジェミニ自身のベクトルが自機へのベクトルと同じないし真逆のときは、直線移動になりバネ動きのようになる
        //  このるーるで、あとは曲がり角度の調整や、加速度の調整、減衰率、を調整して行きたいと
        //  このルールだと、ある程度の時間で、自機に近いところでゆっくり周回になるはず
        //  一度向かい始めると、たとえ自分を通り過ぎてもすぐに止まらずある程度進む」
        // =========================================================================
        orb.isHoveringApex = false;
        orb.apexDwellTimer = 0;

        // 自機への相対ベクトル
        const toDx = playerX - orb.x;
        const toDy = playerY - orb.y;
        const toDist = Math.hypot(toDx, toDy) || 1;
        const toUx = toDx / toDist;
        const toUy = toDy / toDist;

        let curSpd = Math.hypot(orb.vx, orb.vy);

        // 1. 旋回角制限（飛びながら一度に曲がる角度に制限）
        if (curSpd > 0.05) {
          const curAngle = Math.atan2(orb.vy, orb.vx);
          const targetAngle = Math.atan2(toDy, toDx);
          let angleDiff = targetAngle - curAngle;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

          // 自機と同じベクトル(diff ≈ 0)または真逆(diff ≈ ±π)のときは直線のバネ運動になる
          // 横から向かうときは曲がり角の制限により、直線ではなく曲線を描き、自機の横をすり抜ける！
          // 通り過ぎた瞬間も急旋回できないため、そのまま向こう側へ勢いよく突き抜ける（オーバーラン）
          const maxTurn = this.tuning.maxTurnRate; // 標準 0.040 rad (約2.3°/フレーム)
          const turnAmount = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), maxTurn);
          const newAngle = curAngle + turnAmount;

          orb.vx = Math.cos(newAngle) * curSpd;
          orb.vy = Math.sin(newAngle) * curSpd;
        }

        // 2. 自機へ加速度をつけて向かってくる（バネ・引力加速度）
        // 距離に応じた引き戻し加速度
        const baseAccel = 0.065 * this.tuning.tensionMultiplier;
        const springPull = (toDist * 0.00045) * this.tuning.tensionMultiplier;
        const totalAccel = baseAccel + springPull;

        orb.vx += toUx * totalAccel;
        orb.vy += toUy * totalAccel;

        // 3. 減衰率（Damping）
        // このルールにより、ある程度の時間で自機に近いところでゆっくり周回に落ち着く
        orb.vx *= this.tuning.damping;
        orb.vy *= this.tuning.damping;

        // 4. 自機移動による慣性連動
        if (pSpeed > 0.25) {
          orb.vx += playerVx * 0.035;
          orb.vy += playerVy * 0.035;
        }

        // 5. 最高速度クランプ
        curSpd = Math.hypot(orb.vx, orb.vy);
        const maxSpd = (cfg.maxSpeed * 1.5) * this.tuning.maxSpeedMultiplier;
        if (curSpd > maxSpd) {
          orb.vx = (orb.vx / curSpd) * maxSpd;
          orb.vy = (orb.vy / curSpd) * maxSpd;
        }

        // 6. 座標更新
        orb.x += orb.vx;
        orb.y += orb.vy;

        // 7. テレメトリ
        orb.orbitAngle = Math.atan2(orb.y - playerY, orb.x - playerX);
        orb.orbitRadius = toDist;

        // 火の玉チャージ判定（高速突き抜け時）
        if (curSpd > 2.0) {
          orb.isCharged = true;
          orb.chargeRatio = Math.min(1.0, (curSpd - 2.0) / 1.4);
        } else {
          orb.isCharged = false;
          orb.chargeRatio = 0;
        }
      }

      // 画面端反射（設定時）
      if (this.screenEdgeBounce) {
        let bounced = false;
        if (orb.x < 14) { orb.x = 14; orb.vx = Math.abs(orb.vx) * 0.90; bounced = true; }
        if (orb.x > 346) { orb.x = 346; orb.vx = -Math.abs(orb.vx) * 0.90; bounced = true; }
        if (orb.y < 24) { orb.y = 24; orb.vy = Math.abs(orb.vy) * 0.90; bounced = true; }
        if (orb.y > 516) { orb.y = 516; orb.vy = -Math.abs(orb.vy) * 0.90; bounced = true; }
        if (bounced && onWallHit) onWallHit(orb.x, orb.y);
      } else {
        // 画面外の緩やかなドラッグ
        if (orb.x < -120) { orb.x = -120; orb.vx *= 0.5; }
        if (orb.x > 480) { orb.x = 480; orb.vx *= 0.5; }
        if (orb.y < -120) { orb.y = -120; orb.vy *= 0.5; }
        if (orb.y > 640) { orb.y = 640; orb.vy *= 0.5; }
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
