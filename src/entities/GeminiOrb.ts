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
    const baseDamage = orb.level === 1 ? 1 : orb.level === 2 ? 2 : 4;
    if (orb.mode === 'ORBIT') {
      // ② 分銅 (Tethered Flail)
      const speed = Math.hypot(orb.vx, orb.vy);
      if (orb.spinLevel === 2) {
        return baseDamage + 2; // Giga spin (室伏ジャイアントスイング): Lv1なら3ダメージ
      } else if (orb.spinLevel === 1 || speed > 1.8) {
        return baseDamage + 1; // High spin: Lv1なら2ダメージ
      }
      return baseDamage; // 通常旋回: Lv1なら1ダメージ
    } else {
      // ① ハレー彗星 (COMET)
      if (orb.isCharged) {
        return baseDamage + 1; // 高速スイングバイ火の玉チャージ: Lv1なら2ダメージ
      }
      return baseDamage; // 通常突進: Lv1なら1ダメージ (HP2やHP3の敵がしっかり耐えて手応えが出る)
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
      mode: 'COMET',
      isTethered: false,
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
        // === ② クリックし続けている時：ヒモでジェミニを捉える (分銅) ===
        orb.isTethered = true;
        orb.mode = 'ORBIT';
        const curDist = Math.hypot(orb.x - playerX, orb.y - playerY) || 1;
        orb.tetherLength = Math.max(35, Math.min(180, curDist));
      } else if (!isTetherHeld && wasTethered) {
        // === ③ クリックを離すとその加速度を持ってジェミニをリリースする (ハレー彗星) ===
        orb.isTethered = false;
        orb.mode = 'COMET';
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
        // ② クリックし続けている時：ヒモでジェミニを捉える (純粋弾性テザー分銅物理)
        // =========================================================================
        orb.isHoveringApex = false;
        orb.apexDwellTimer = 0;

        // 自機からジェミニへの相対位置
        const fDx = orb.x - playerX;
        const fDy = orb.y - playerY;
        const fDist = Math.hypot(fDx, fDy) || 1;
        const fUx = fDx / fDist; // 自機→ジェミニの単位ベクトル（動径方向外向き）
        const fUy = fDy / fDist;

        // 紐の自然長 L0
        const chainLen = (orb.tetherLength || 75) * (this.tuning.orbitRadius / 75);

        // 1. 紐の状態判定（たるんでいるか、張っているか）
        if (fDist > chainLen) {
          // 【ヒモが張った時】
          // ゴムとして伸びる量
          const stretch = fDist - chainLen;

          // 自機とジェミニの相対速度（離れる速度成分）
          const relVx = orb.vx - playerVx;
          const relVy = orb.vy - playerVy;
          const radialSpeed = relVx * fUx + relVy * fUy;

          // 物理的張力：Euler振動のカクカクしたチャタリングを起こさない滑らかな張力定数
          const tensionK = 0.035 * this.tuning.tensionMultiplier;
          const tensionForce = stretch * tensionK;

          // 連続動径ダンピング（内外の振動跳ね返りを吸収し、滑らかな円運動にする）
          const dampForce = radialSpeed * 0.16;

          // 1フレームあたりの過度な急加減速をクリップして滑らかさを担保
          const totalTension = Math.max(-0.15, Math.min(1.2, tensionForce + dampForce));
          orb.vx -= fUx * totalTension;
          orb.vy -= fUy * totalTension;
        }

        // 2. 微小重力（自然な垂れ下がり感）
        orb.vy += 0.012;

        // 3. 自然な空気抵抗
        orb.vx *= 0.997;
        orb.vy *= 0.997;

        // 4. 最高速度クランプ（自然な重量感・視認できる速度感: 3.2px/frame基準）
        const absSpeed = Math.hypot(orb.vx, orb.vy);
        const maxSpd = (cfg.maxSpeed * 1.35) * this.tuning.maxSpeedMultiplier;
        if (absSpeed > maxSpd) {
          orb.vx = (orb.vx / absSpeed) * maxSpd;
          orb.vy = (orb.vy / absSpeed) * maxSpd;
        }

        // 5. 位置更新
        orb.x += orb.vx;
        orb.y += orb.vy;

        // 6. 接線速度とスピンレベル計算
        const relX = orb.x - playerX;
        const relY = orb.y - playerY;
        const rDist = Math.hypot(relX, relY) || 1;
        const tx = -relY / rDist;
        const ty = relX / rDist;
        const tangentV = (orb.vx - playerVx) * tx + (orb.vy - playerVy) * ty;

        // スピンレベル判定（激しい回転で室伏ジャイアントスイング）
        if (Math.abs(tangentV) > 1.85) {
          orb.spinLevel = 2; // GIGA SPIN
          orb.isCharged = true;
          orb.chargeRatio = 1.0;
        } else if (Math.abs(tangentV) > 0.90) {
          orb.spinLevel = 1; // ACTIVE SPIN
          orb.isCharged = false;
          orb.chargeRatio = 0.5;
        } else {
          orb.spinLevel = 0; // IDLE
          orb.isCharged = false;
          orb.chargeRatio = 0;
        }

        orb.orbitAngle = Math.atan2(orb.y - playerY, orb.x - playerX);
        orb.orbitRadius = rDist;

      } else {
        // =========================================================================
        // ① クリックを離している時：ハレー彗星スイングバイ・ホーミング (デフォルト)
        // ユーザー指示:
        // 「ハレー彗星がデフォ、押している間分銅、の挙動にして ボタン操作はいまのまま そこから調整しよう」
        // =========================================================================
        orb.isHoveringApex = false;
        orb.apexDwellTimer = 0;

        const cDx = playerX - orb.x;
        const cDy = playerY - orb.y;
        const cDist = Math.hypot(cDx, cDy) || 1;
        const cUx = cDx / cDist;
        const cUy = cDy / cDist;

        // 1. 角度的ホーミング旋回 (Proportional Navigation Steering)
        let curSpd = Math.hypot(orb.vx, orb.vy);
        if (curSpd > 0.05) {
          const curAngle = Math.atan2(orb.vy, orb.vx);
          const targetAngle = Math.atan2(cDy, cDx);
          let angleDiff = targetAngle - curAngle;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

          // 旋回角速度: 距離が離れている時は確実に自機を捉え、通過時もキュッと鋭くUターン
          const turnRate = (0.08 + 0.04 * Math.min(1.0, cDist / 120)) * this.tuning.tensionMultiplier;
          const turnStep = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), turnRate);
          const steeredAngle = curAngle + turnStep;

          orb.vx = Math.cos(steeredAngle) * curSpd;
          orb.vy = Math.sin(steeredAngle) * curSpd;
        }

        // 2. 重力・ホーミング加速度（万有引力 + ホーミング突撃力）
        // 引力加速度を底上げし、遠くでも自機へ力強く引き戻し、至近距離（近日点）でスイングバイ加速
        const gravBase = 0.075 * this.tuning.tensionMultiplier;
        const gravSwing = (5.2 * this.tuning.tensionMultiplier) / (cDist + 35);
        const gravAccel = gravBase + gravSwing;

        orb.vx += cUx * gravAccel;
        orb.vy += cUy * gravAccel;

        // 3. 自機の移動ベクトルによる慣性連動（プレイヤーが動くと彗星の焦点がずれて美しい放物線を描く）
        if (pSpeed > 0.3) {
          orb.vx += playerVx * 0.045;
          orb.vy += playerVy * 0.045;
        }

        // 4. 宇宙空間の微小空気抵抗（軌道エネルギーの長期安定）
        orb.vx *= 0.9982;
        orb.vy *= 0.9982;

        // 5. 最高速度クランプ（近日点でのスイングバイ最高速: 3.6px/frame基準）
        curSpd = Math.hypot(orb.vx, orb.vy);
        const maxSpd = (cfg.maxSpeed * 1.5) * this.tuning.maxSpeedMultiplier;
        if (curSpd > maxSpd) {
          orb.vx = (orb.vx / curSpd) * maxSpd;
          orb.vy = (orb.vy / curSpd) * maxSpd;
        }

        // 6. 位置更新
        orb.x += orb.vx;
        orb.y += orb.vy;

        // 7. テレメトリ情報
        orb.orbitAngle = Math.atan2(orb.y - playerY, orb.x - playerX);
        orb.orbitRadius = cDist;

        // 8. 火の玉・彗星の光球チャージ判定（高速スイングバイ時に燃え盛る）
        if (curSpd > 1.8) {
          orb.isCharged = true;
          orb.chargeRatio = Math.min(1.0, (curSpd - 1.8) / 1.4);
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
