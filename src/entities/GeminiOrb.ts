import { 
  GeminiCollisionMode, 
  GeminiOrb, 
  GeminiTelemetry, 
  PhysicsPatternId, 
  PhysicsPatternInfo, 
  PhysicsPresetConfig, 
  PhysicsPresetId, 
  PhysicsTuningState 
} from '../types';

export const PHYSICS_PRESETS: Record<PhysicsPresetId, PhysicsPresetConfig> = {
  SNAP_SLING: {
    id: 'SNAP_SLING',
    name: 'SNAP SLING',
    nameJa: '標準突き (ヨーヨー)',
    descJa: '前後に小気味よく突き刺すホーミング＆火の玉チャージ',
    springK: 0.0025,
    springNonlinear: 0.045,
    damping: 0.993,
    maxSpeed: 8.5,
    apexThreshold: 0.45,
    orbitBaseSpeed: 0.035,
    orbitTransfer: 0.20,
  },
  HYPER_BOOMERANG: {
    id: 'HYPER_BOOMERANG',
    name: 'HYPER BOOMERANG',
    nameJa: '大遠投ブーメラン',
    descJa: '低空気抵抗で遠くへ伸びる大弧線突き',
    springK: 0.0016,
    springNonlinear: 0.030,
    damping: 0.997,
    maxSpeed: 10.0,
    apexThreshold: 0.40,
    orbitBaseSpeed: 0.028,
    orbitTransfer: 0.16,
  },
  GIGANTIC_SPRING: {
    id: 'GIGANTIC_SPRING',
    name: 'GIGANTIC SPRING',
    nameJa: '超加速パチンコ (高反発)',
    descJa: '離すほど猛烈に火の玉化して突進する強力バネ',
    springK: 0.0035,
    springNonlinear: 0.075,
    damping: 0.990,
    maxSpeed: 11.5,
    apexThreshold: 0.50,
    orbitBaseSpeed: 0.040,
    orbitTransfer: 0.24,
  },
  HEAVY_WRECKER: {
    id: 'HEAVY_WRECKER',
    name: 'HEAVY WRECKER',
    nameJa: '重量分銅 (高質量)',
    descJa: '重い質量感。折り返しでの滞空時間が長く敵を押し戻す',
    springK: 0.0020,
    springNonlinear: 0.035,
    damping: 0.995,
    maxSpeed: 7.5,
    apexThreshold: 0.55,
    orbitBaseSpeed: 0.024,
    orbitTransfer: 0.14,
  },
  RAPID_ORBIT: {
    id: 'RAPID_ORBIT',
    name: 'RAPID ORBIT',
    nameJa: '高速公転バリア',
    descJa: 'タップ時の光のロープ拘束と追従性が最も高い防御型',
    springK: 0.0028,
    springNonlinear: 0.040,
    damping: 0.992,
    maxSpeed: 8.0,
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

export const PHYSICS_PATTERNS: Record<PhysicsPatternId, PhysicsPatternInfo> = {
  YOYO_STROKE: {
    id: 'YOYO_STROKE',
    num: 1,
    nameJa: '初代ヨーヨー (突き抜け往復)',
    shortLabel: '①ヨーヨー往復',
    summary: '遠くから突進 ➔ 自機通過後に+50%深宇宙へ突き抜け ➔ 頂点でフワッと滞空 ➔ 自機へ折り返し往復',
  },
  COMET_GRAVITY: {
    id: 'COMET_GRAVITY',
    num: 2,
    nameJa: 'ハレー彗星 (重力スイングバイ)',
    shortLabel: '②ハレー彗星',
    summary: '自機を引力中心とした天体力学。角度旋回で自機へ近づき、至近距離でスイングバイ超加速して遠日点へ離脱',
  },
  ARC_HOMING: {
    id: 'ARC_HOMING',
    num: 3,
    nameJa: '旋回制限ホーミング (円弧すり抜け)',
    shortLabel: '③旋回制限ホーミング',
    summary: '自機への引力だが「1F最大旋回角」を制限。急ターンできず綺麗な円弧ですり抜け、放置で緩やかに周回',
  },
  PURE_FLAIL: {
    id: 'PURE_FLAIL',
    num: 4,
    nameJa: '常時分銅ハンマー (ゴム紐テザー)',
    shortLabel: '④常時分銅ハンマー',
    summary: '常時ゴム紐テザーで自機と連結。自機の移動・旋回にあわせてブンブン振り回し、遠心力で敵を粉砕',
  },
  HYBRID_COMET_FLAIL: {
    id: 'HYBRID_COMET_FLAIL',
    num: 5,
    nameJa: 'エグゼリカ ＆ 誘導オーバーラン',
    shortLabel: '⑤エグゼリカ',
    summary: '長押しでエグゼリカ式分銅スピン ➔ 離して遠心力投擲 ➔ 自機へ誘導ホーミング ➔ 自機を豪快にオーバーラン突き抜け！',
  },
};

export const PATTERN_ORDER: PhysicsPatternId[] = [
  'YOYO_STROKE',
  'COMET_GRAVITY',
  'ARC_HOMING',
  'PURE_FLAIL',
  'HYBRID_COMET_FLAIL',
];

export class GeminiOrbManager {
  public orbs: GeminiOrb[] = [];
  public currentPresetId: PhysicsPresetId = 'SNAP_SLING';
  public currentPatternId: PhysicsPatternId = 'HYBRID_COMET_FLAIL'; // デフォルトは統合ハイブリッド
  public collisionMode: GeminiCollisionMode = 'PENETRATE';
  public screenEdgeBounce: boolean = false; // 画面端当たり判定: false = 通過, true = 跳ね返る
  public tuning: PhysicsTuningState = {
    tensionMultiplier: 1.0,  // 加速度倍率: 0.6, 0.8, 1.0 (標準), 1.5, 2.0, 3.0
    maxTurnRate: 0.035,      // 1フレーム最大曲がり角度: 0.020, 0.027, 0.035 (標準約2.0°), 0.045, 0.060, 0.080
    damping: 0.993,          // 減衰率: 0.985 (強減衰), 0.990 (中), 0.993 (標準), 0.996 (弱), 0.998 (極弱)
    maxSpeedMultiplier: 1.0, // 最高速度倍率: 0.6, 0.8, 1.0 (標準), 1.5, 2.0, 3.0
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
    const steps = [0.6, 0.8, 1.0, 1.5, 2.0, 3.0];
    const curIdx = steps.findIndex(s => Math.abs(s - this.tuning.tensionMultiplier) < 0.06);
    const nextIdx = (curIdx + 1) % steps.length;
    this.tuning.tensionMultiplier = steps[nextIdx];
    return this.tuning.tensionMultiplier;
  }

  public cycleTurnRate(): number {
    const steps = [0.020, 0.027, 0.035, 0.045, 0.060, 0.080];
    const curIdx = steps.findIndex(s => Math.abs(s - this.tuning.maxTurnRate) < 0.004);
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
    const steps = [0.6, 0.8, 1.0, 1.5, 2.0, 3.0];
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
      maxTurnRate: 0.035,
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

  public setPattern(id: PhysicsPatternId): PhysicsPatternInfo {
    if (PHYSICS_PATTERNS[id]) {
      this.currentPatternId = id;
    }
    return PHYSICS_PATTERNS[this.currentPatternId];
  }

  public cyclePattern(): PhysicsPatternInfo {
    const idx = PATTERN_ORDER.indexOf(this.currentPatternId);
    const nextIdx = (idx + 1) % PATTERN_ORDER.length;
    this.currentPatternId = PATTERN_ORDER[nextIdx];
    return PHYSICS_PATTERNS[this.currentPatternId];
  }

  public getPatternInfo(): PhysicsPatternInfo {
    return PHYSICS_PATTERNS[this.currentPatternId];
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
      // ① ハレー彗星 / ヨーヨー (COMET / SLING)
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

  public getTelemetry(playerX: number, playerY: number): GeminiTelemetry {
    const info = this.getPatternInfo();
    if (this.orbs.length === 0) {
      return {
        dist: 0,
        speed: 0,
        tangentSpeed: 0,
        accel: 0,
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
        patternId: this.currentPatternId,
        patternInfo: info,
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
      accel: Math.round((orb.currentAccel || 0) * 100) / 100,
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
      patternId: this.currentPatternId,
      patternInfo: info,
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

      const prevVx = orb.vx;
      const prevVy = orb.vy;

      // 各物理パターンの専任処理
      switch (this.currentPatternId) {
        case 'YOYO_STROKE':
          this.updateYoYo(orb, playerX, playerY, playerVx, playerVy, cfg);
          break;
        case 'COMET_GRAVITY':
          this.updateComet(orb, playerX, playerY, playerVx, playerVy, cfg);
          break;
        case 'ARC_HOMING':
          this.updateArcHoming(orb, playerX, playerY, playerVx, playerVy, cfg);
          break;
        case 'PURE_FLAIL':
          this.updateFlail(orb, playerX, playerY, playerVx, playerVy, cfg);
          break;
        case 'HYBRID_COMET_FLAIL':
        default:
          this.updateHybrid(orb, playerX, playerY, playerVx, playerVy, cfg, isTetherHeld, onRelease);
          break;
      }

      // 加速度の実測計測 (Δv / Δt)
      const dvx = orb.vx - prevVx;
      const dvy = orb.vy - prevVy;
      orb.currentAccel = Math.hypot(dvx, dvy);

      // 画面端処理
      this.applyScreenBoundaries(orb, onWallHit);
    }

    // Check for Gemini Fusion
    this.checkFusion(onMerge);
  }

  /**
   * ① 初代ヨーヨー (突き抜け往復)
   * 遠くから突進 ➔ 自機通過後に+50%突き抜け ➔ 頂点でフワッと滞空 ➔ 自機へ折り返し往復
   */
  private updateYoYo(
    orb: GeminiOrb,
    playerX: number,
    playerY: number,
    playerVx: number,
    playerVy: number,
    cfg: PhysicsPresetConfig
  ): void {
    orb.mode = 'SLING';
    orb.isTethered = false;
    const playerDist = Math.hypot(orb.x - playerX, orb.y - playerY);
    const curSpd = Math.hypot(orb.vx, orb.vy);
    const pSpeed = Math.hypot(playerVx, playerVy);

    if (!orb.strokePhase || orb.strokePhase === 'OUTWARD' || orb.strokePhase === 'RETURN') {
      orb.strokePhase = 'INWARD';
      orb.launchStartX = orb.x;
      orb.launchStartY = orb.y;
      orb.castTargetX = playerX;
      orb.castTargetY = playerY;
      orb.strokeDist = Math.max(40, playerDist);
      orb.apexDwellTimer = 0;
      orb.isHoveringApex = false;
    }

    const D0 = Math.max(40, orb.strokeDist || playerDist);
    const targetOvershoot = Math.max(50, D0 * (this.tuning.overshootRatio || 0.6));

    if (orb.strokePhase === 'APEX') {
      orb.isHoveringApex = true;
      orb.vx *= 0.88;
      orb.vy *= 0.88;
      orb.apexDwellTimer = (orb.apexDwellTimer || 0) - 1;

      if (orb.apexDwellTimer <= 0) {
        orb.strokePhase = 'INWARD';
        orb.isHoveringApex = false;
        orb.launchStartX = orb.x;
        orb.launchStartY = orb.y;
        orb.castTargetX = playerX;
        orb.castTargetY = playerY;
        orb.strokeDist = Math.max(40, playerDist);

        const dx = playerX - orb.x;
        const dy = playerY - orb.y;
        const d = Math.hypot(dx, dy) || 1;
        orb.strokeDirX = dx / d;
        orb.strokeDirY = dy / d;
      }
    } else if (orb.strokePhase === 'REST') {
      orb.isHoveringApex = false;
      orb.vx *= 0.90;
      orb.vy *= 0.90;

      if (playerDist > 35 || pSpeed > 0.40) {
        orb.strokePhase = 'INWARD';
        orb.launchStartX = orb.x;
        orb.launchStartY = orb.y;
        orb.castTargetX = playerX;
        orb.castTargetY = playerY;
        orb.strokeDist = Math.max(40, playerDist);
        const dx = playerX - orb.x;
        const dy = playerY - orb.y;
        const d = Math.hypot(dx, dy) || 1;
        orb.strokeDirX = dx / d;
        orb.strokeDirY = dy / d;
      }
    } else if (orb.strokePhase === 'OVERSHOOT') {
      orb.isHoveringApex = false;
      const anchorX = orb.castTargetX ?? playerX;
      const anchorY = orb.castTargetY ?? playerY;
      const dirX = orb.strokeDirX ?? (curSpd > 0.01 ? orb.vx / curSpd : 0);
      const dirY = orb.strokeDirY ?? (curSpd > 0.01 ? orb.vy / curSpd : -1);

      const s = (orb.x - anchorX) * dirX + (orb.y - anchorY) * dirY;
      const forwardV = orb.vx * dirX + orb.vy * dirY;

      const peakV = Math.max(2.2, orb.peakSpeed || curSpd);
      const brakeAccel = (peakV * peakV) / (2 * Math.max(25, targetOvershoot));
      orb.vx -= dirX * brakeAccel * 0.90;
      orb.vy -= dirY * brakeAccel * 0.90;

      const perpVx = orb.vx - forwardV * dirX;
      const perpVy = orb.vy - forwardV * dirY;
      orb.vx = forwardV * dirX + perpVx * 0.86;
      orb.vy = forwardV * dirY + perpVy * 0.86;

      if (playerDist > D0 * 1.20) {
        const tautF = Math.min(0.8, (playerDist - D0) * 0.02 * this.tuning.tensionMultiplier);
        orb.vx += ((playerX - orb.x) / playerDist) * tautF;
        orb.vy += ((playerY - orb.y) / playerDist) * tautF;
      }

      if (s >= targetOvershoot || forwardV <= 0.15) {
        orb.strokePhase = 'APEX';
        orb.apexDwellTimer = Math.round(9 * this.tuning.apexDwellMultiplier);
        orb.isHoveringApex = true;
      }
    } else {
      // INWARD
      orb.isHoveringApex = false;
      const anchorX = orb.castTargetX ?? playerX;
      const anchorY = orb.castTargetY ?? playerY;
      const dx = anchorX - orb.x;
      const dy = anchorY - orb.y;
      const distToAnchor = Math.hypot(dx, dy) || 1;
      const dirX = dx / distToAnchor;
      const dirY = dy / distToAnchor;
      orb.strokeDirX = dirX;
      orb.strokeDirY = dirY;

      const linearF = distToAnchor * cfg.springK * this.tuning.tensionMultiplier * 1.8;
      const slingshotBonus = D0 > 45 ? Math.pow((D0 - 45) / 55, 1.4) * 0.08 * this.tuning.tensionMultiplier : 0;
      const accel = Math.min(1.5, linearF + slingshotBonus);

      orb.vx += dirX * accel;
      orb.vy += dirY * accel;

      if (curSpd > 0.15) {
        const alongV = orb.vx * dirX + orb.vy * dirY;
        const perpVx = orb.vx - alongV * dirX;
        const perpVy = orb.vy - alongV * dirY;
        orb.vx = alongV * dirX + perpVx * 0.88;
        orb.vy = alongV * dirY + perpVy * 0.88;
      }

      if (pSpeed > 0.4 && curSpd > 0.1) {
        const forwardP = playerVx * dirX + playerVy * dirY;
        if (forwardP > 0) {
          const boost = Math.min(1.2, forwardP * 0.25);
          orb.vx += dirX * boost;
          orb.vy += dirY * boost;
        }
      }

      const forwardAlongDir = (orb.x - anchorX) * dirX + (orb.y - anchorY) * dirY;
      if (forwardAlongDir >= -2.0 || distToAnchor <= 14) {
        orb.strokePhase = 'OVERSHOOT';
        orb.peakSpeed = Math.hypot(orb.vx, orb.vy);
        if (D0 < 22 && pSpeed < 0.2) {
          orb.strokePhase = 'REST';
          orb.vx *= 0.3;
          orb.vy *= 0.3;
        }
      }
    }

    orb.vx *= 0.9982;
    orb.vy *= 0.9982;

    const updatedSpeed = Math.hypot(orb.vx, orb.vy);
    const maxSpd = (cfg.maxSpeed * 1.30 + (orb.level - 1) * 0.3) * this.tuning.maxSpeedMultiplier;
    if (updatedSpeed > maxSpd) {
      orb.vx = (orb.vx / updatedSpeed) * maxSpd;
      orb.vy = (orb.vy / updatedSpeed) * maxSpd;
    }

    if (playerDist > 55 && updatedSpeed > 3.0) {
      orb.isCharged = true;
      orb.chargeRatio = Math.min(1.0, (playerDist - 40) / 80);
    } else {
      orb.isCharged = false;
      orb.chargeRatio = 0;
    }

    orb.x += orb.vx;
    orb.y += orb.vy;
    orb.orbitAngle = Math.atan2(orb.y - playerY, orb.x - playerX);
    orb.orbitRadius = playerDist;
  }

  /**
   * ② ハレー彗星 (重力スイングバイ)
   * 自機を引力中心とした天体力学。角度旋回で自機へ近づき、至近距離でスイングバイ超加速して遠日点へ離脱
   */
  private updateComet(
    orb: GeminiOrb,
    playerX: number,
    playerY: number,
    _playerVx: number,
    _playerVy: number,
    cfg: PhysicsPresetConfig
  ): void {
    orb.mode = 'COMET';
    orb.isTethered = false;
    orb.isHoveringApex = false;

    const dx = playerX - orb.x;
    const dy = playerY - orb.y;
    const dist = Math.hypot(dx, dy) || 1;
    const dirX = dx / dist;
    const dirY = dy / dist;

    // ケプラー引力 + バネ成分 (至近距離で発散しないソフトニング)
    const softening = 55;
    const effectiveDist = Math.max(softening, dist);
    const gravity = (450 / (effectiveDist + 35)) * 0.22 * this.tuning.tensionMultiplier;
    const springF = dist * 0.0022 * this.tuning.tensionMultiplier;
    const totalPull = Math.min(1.4, gravity + springF);

    orb.vx += dirX * totalPull;
    orb.vy += dirY * totalPull;

    // 近日点スイングバイ効果: 自機至近距離(dist < 70)を通過する際、接線速度を維持・加速
    if (dist < 70) {
      const tangentX = -dirY;
      const tangentY = dirX;
      const dotTangent = orb.vx * tangentX + orb.vy * tangentY;
      if (Math.abs(dotTangent) > 0.2) {
        const sign = dotTangent >= 0 ? 1 : -1;
        const swingBoost = Math.min(0.80, (70 - dist) * 0.02);
        orb.vx += tangentX * sign * swingBoost;
        orb.vy += tangentY * sign * swingBoost;
      }
    }

    // 天体運動の極めて低い空気抵抗
    orb.vx *= Math.max(0.993, this.tuning.damping);
    orb.vy *= Math.max(0.993, this.tuning.damping);

    const spd = Math.hypot(orb.vx, orb.vy);
    const maxSpd = (cfg.maxSpeed * 1.25) * this.tuning.maxSpeedMultiplier;
    if (spd > maxSpd) {
      orb.vx = (orb.vx / spd) * maxSpd;
      orb.vy = (orb.vy / spd) * maxSpd;
    }

    // 火の玉チャージ: 近日点通過時・適度な速度時
    if (spd > 3.8 || (dist < 75 && spd > 2.5)) {
      orb.isCharged = true;
      orb.chargeRatio = Math.min(1.0, spd / 5.5);
    } else {
      orb.isCharged = false;
      orb.chargeRatio = 0;
    }

    orb.x += orb.vx;
    orb.y += orb.vy;
    orb.orbitAngle = Math.atan2(orb.y - playerY, orb.x - playerX);
    orb.orbitRadius = dist;
  }

  /**
   * ③ 旋回制限ホーミング (円弧すり抜け)
   * 自機への引力だが「1F最大旋回角」を制限。急ターンできず綺麗な円弧ですり抜け、放置で緩やかに周回
   */
  private updateArcHoming(
    orb: GeminiOrb,
    playerX: number,
    playerY: number,
    _playerVx: number,
    _playerVy: number,
    cfg: PhysicsPresetConfig
  ): void {
    orb.mode = 'COMET';
    orb.isTethered = false;
    orb.isHoveringApex = false;

    const dx = playerX - orb.x;
    const dy = playerY - orb.y;
    const dist = Math.hypot(dx, dy) || 1;
    const targetAngle = Math.atan2(dy, dx);

    let currentAngle = Math.atan2(orb.vy, orb.vx);
    let currentSpeed = Math.hypot(orb.vx, orb.vy);

    if (currentSpeed < 0.2) {
      currentAngle = targetAngle;
      currentSpeed = 1.0;
    }

    let angleDiff = targetAngle - currentAngle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    const maxTurn = this.tuning.maxTurnRate || 0.035;
    const clampedTurn = Math.max(-maxTurn, Math.min(maxTurn, angleDiff));
    const newAngle = currentAngle + clampedTurn;

    const accel = 0.32 * this.tuning.tensionMultiplier;
    currentSpeed += accel;
    currentSpeed *= this.tuning.damping;

    const maxSpd = (cfg.maxSpeed * 1.25) * this.tuning.maxSpeedMultiplier;
    if (currentSpeed > maxSpd) {
      currentSpeed = maxSpd;
    }

    orb.vx = Math.cos(newAngle) * currentSpeed;
    orb.vy = Math.sin(newAngle) * currentSpeed;

    orb.x += orb.vx;
    orb.y += orb.vy;

    orb.isCharged = currentSpeed > 3.5;
    orb.chargeRatio = Math.min(1.0, currentSpeed / 5.5);
    orb.orbitAngle = Math.atan2(orb.y - playerY, orb.x - playerX);
    orb.orbitRadius = dist;
  }

  /**
   * ④ 常時分銅ハンマー (ゴム紐テザー)
   * 常時ゴム紐テザーで自機と連結。自機の移動・旋回にあわせてブンブン振り回し、遠心力で敵を粉砕
   */
  private updateFlail(
    orb: GeminiOrb,
    playerX: number,
    playerY: number,
    playerVx: number,
    playerVy: number,
    cfg: PhysicsPresetConfig
  ): void {
    this.updateExelicaFlail(orb, playerX, playerY, playerVx, playerVy, cfg);
  }

  /**
   * エグゼリカ式分銅物理 (Triggerheart Exelica Orbital Physics)
   * 1. 自機を中心とした極座標 (R, θ, ω) による滑らかで確実な公転軌道
   * 2. 自機の横移動・旋回入力をダイレクトに角加速度 ω へ変換（エグゼリカの操作感）
   * 3. 停滞せず常に生き生きと回転し、入力に合わせて超高速スピン（室伏剛撃）へ加速
   * 4. 離した瞬間、接線方向の物理慣性ベクトルで狙った方向へ正確に射出
   */
  private updateExelicaFlail(
    orb: GeminiOrb,
    playerX: number,
    playerY: number,
    playerVx: number,
    playerVy: number,
    _cfg: PhysicsPresetConfig
  ): void {
    orb.mode = 'ORBIT';
    orb.isTethered = true;
    orb.isHoveringApex = false;
    orb.apexDwellTimer = 0;

    const chainLen = (this.tuning.orbitRadius || 75);

    // 初回キャッチ時の角度と半径初期化
    if (orb.orbitAngle === undefined || isNaN(orb.orbitAngle)) {
      orb.orbitAngle = Math.atan2(orb.y - playerY, orb.x - playerX);
    }
    if (!orb.orbitRadius || orb.orbitRadius < 20) {
      orb.orbitRadius = Math.max(35, Math.hypot(orb.x - playerX, orb.y - playerY));
    }
    if (orb.orbitAngularVel === undefined || isNaN(orb.orbitAngularVel)) {
      const sinA0 = Math.sin(orb.orbitAngle);
      const cosA0 = Math.cos(orb.orbitAngle);
      const tangentSpeed0 = -orb.vx * sinA0 + orb.vy * cosA0;
      orb.orbitAngularVel = Math.max(-0.10, Math.min(0.10, tangentSpeed0 / orb.orbitRadius));
    }

    // 1. 自機の移動による角加速度（エグゼリカのトルク注入）
    // 接線方向単位ベクトル (-sin θ, cos θ)
    const sinA = Math.sin(orb.orbitAngle);
    const cosA = Math.cos(orb.orbitAngle);
    const tangentialShipMotion = -playerVx * sinA + playerVy * cosA;

    if (Math.abs(tangentialShipMotion) > 0.03) {
      // 自機の横移動・旋回で角加速度を加算（プレイヤーの操作でブンブン回す）
      const torque = (tangentialShipMotion / chainLen) * 1.25 * this.tuning.tensionMultiplier;
      orb.orbitAngularVel += torque;
    }

    // 2. 自機直進時の追従・引きずり（Trailing）
    // 回転が穏やかな時（|ω| < 0.06）、自機が一定速度以上で直進していれば自機後方に自然と引きずられる
    const pSpeed = Math.hypot(playerVx, playerVy);
    if (Math.abs(orb.orbitAngularVel) < 0.06 && pSpeed > 0.35) {
      const trailAngle = Math.atan2(-playerVy, -playerVx);
      let diff = trailAngle - orb.orbitAngle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      orb.orbitAngle += diff * 0.055 * Math.min(1.0, pSpeed / 2.5);
    }

    // 3. 自然な角速度減衰（止まっている時は回転が自然に静止する：強制回転を廃止）
    orb.orbitAngularVel *= 0.992;

    // 角速度クランプ（エグゼリカ式高速スピン: 最大約3.3回転/秒〜神速）
    const maxOmega = 0.35 * this.tuning.maxSpeedMultiplier;
    if (Math.abs(orb.orbitAngularVel) > maxOmega) {
      orb.orbitAngularVel = Math.sign(orb.orbitAngularVel) * maxOmega;
    }

    // 4. 半径のゴム伸縮（自然長へスムーズに追従）
    const targetR = chainLen;
    orb.orbitRadius += (targetR - orb.orbitRadius) * 0.12;

    // 5. 角度更新
    orb.orbitAngle += orb.orbitAngularVel;
    while (orb.orbitAngle > Math.PI) orb.orbitAngle -= Math.PI * 2;
    while (orb.orbitAngle < -Math.PI) orb.orbitAngle += Math.PI * 2;

    // 6. 実際の位置と速度ベクトルを計算（接線速度を反映）
    const currentCos = Math.cos(orb.orbitAngle);
    const currentSin = Math.sin(orb.orbitAngle);
    orb.x = playerX + orb.orbitRadius * currentCos;
    orb.y = playerY + orb.orbitRadius * currentSin;

    // 接線速度（離した時にそのまま強烈な射出ベクトルとなる）
    const linearTangentialSpeed = orb.orbitAngularVel * orb.orbitRadius;
    orb.vx = -currentSin * linearTangentialSpeed + playerVx * 0.50;
    orb.vy = currentCos * linearTangentialSpeed + playerVy * 0.50;

    // 7. スピンレベル判定（激しい回転で剛撃ジャイアントスイング）
    const absOmega = Math.abs(orb.orbitAngularVel);
    if (absOmega > 0.18) {
      orb.spinLevel = 2; // 🔥 GIGA SPIN (室伏剛撃)
      orb.isCharged = true;
      orb.chargeRatio = 1.0;
    } else if (absOmega > 0.08) {
      orb.spinLevel = 1; // ⚡ ACTIVE SPIN
      orb.isCharged = false;
      orb.chargeRatio = 0.5;
    } else {
      orb.spinLevel = 0; // IDLE / TRAILING
      orb.isCharged = false;
      orb.chargeRatio = 0;
    }
  }

  /**
   * 発射後の誘導ホーミング ＆ オーバーラン突き抜け物理
   * 1. OUTWARD: 投擲の勢いで敵陣へ直線射出（深宇宙へ豪快に突進）
   * 2. INWARD: 自機への円弧誘導ホーミング（美しいカーブで猛烈に接近）
   * 3. OVERSHOOT: 自機を通過した瞬間、そのまま前方深宇宙へ滑らかにオーバーラン突き抜け！
   * 4. APEX: 最遠到達点で滞空停止せず即座に自機へのホーミングへ折り返し
   */
  private updateHomingOverrun(
    orb: GeminiOrb,
    playerX: number,
    playerY: number,
    _playerVx: number,
    _playerVy: number,
    cfg: PhysicsPresetConfig
  ): void {
    orb.mode = 'COMET';
    orb.isTethered = false;

    const dx = playerX - orb.x;
    const dy = playerY - orb.y;
    const distToPlayer = Math.hypot(dx, dy) || 1;
    const curSpd = Math.hypot(orb.vx, orb.vy);

    if (!orb.strokePhase) {
      orb.strokePhase = 'INWARD';
    }

    if (orb.strokePhase === 'OUTWARD') {
      // --- 投擲射出フェーズ ---
      orb.strokeElapsed = (orb.strokeElapsed || 0) + 1;
      const flyDist = Math.hypot(orb.x - (orb.launchStartX || orb.x), orb.y - (orb.launchStartY || orb.y));

      // 慣性保存（低い空気抵抗）
      orb.vx *= 0.995;
      orb.vy *= 0.995;

      // 画面奥深くまで豪快に飛翔（320pxまたは50フレーム）
      if (flyDist > 320 || orb.strokeElapsed > 50 || curSpd < 2.0) {
        orb.strokePhase = 'INWARD';
        orb.strokeDist = Math.max(50, distToPlayer);
      }

    } else if (orb.strokePhase === 'APEX') {
      // 滞空停止させず即座に自機ホーミングへ移行（敵衝突時のフリーズ・停止感を完全解消）
      orb.strokePhase = 'INWARD';
      orb.isHoveringApex = false;
      orb.strokeDist = Math.max(50, distToPlayer);

    } else if (orb.strokePhase === 'OVERSHOOT') {
      // --- OVERSHOOTオーバーラン突き抜けフェーズ ---
      orb.isHoveringApex = false;
      const dirX = orb.strokeDirX ?? (curSpd > 0.01 ? orb.vx / curSpd : 0);
      const dirY = orb.strokeDirY ?? (curSpd > 0.01 ? orb.vy / curSpd : -1);

      // 自機通過位置からの進行距離 s
      const anchorX = orb.castTargetX ?? playerX;
      const anchorY = orb.castTargetY ?? playerY;
      const s = (orb.x - anchorX) * dirX + (orb.y - anchorY) * dirY;
      const forwardV = orb.vx * dirX + orb.vy * dirY;

      // 目標オーバーラン距離 (深宇宙へ伸びる突き抜け)
      const targetOvershoot = Math.max(75, (orb.peakSpeed || 5.0) * 18);

      // 前進速度の自然なブレーキ
      const peakV = Math.max(3.0, orb.peakSpeed || curSpd);
      const brakeAccel = (peakV * peakV) / (2 * targetOvershoot);
      orb.vx -= dirX * brakeAccel * 0.85;
      orb.vy -= dirY * brakeAccel * 0.85;

      // 直線整流
      const perpVx = orb.vx - forwardV * dirX;
      const perpVy = orb.vy - forwardV * dirY;
      orb.vx = forwardV * dirX + perpVx * 0.88;
      orb.vy = forwardV * dirY + perpVy * 0.88;

      // 目標距離到達または前進速度停止でスムーズに自機ホーミングへ移行（停止なし）
      if (s >= targetOvershoot || forwardV <= 0.30) {
        orb.strokePhase = 'INWARD';
        orb.isHoveringApex = false;
        orb.strokeDist = Math.max(50, distToPlayer);
      }

    } else {
      // --- INWARD誘導ホーミング接近フェーズ ---
      orb.isHoveringApex = false;

      // 旋回制限ホーミングで自機へ向かう
      const targetAngle = Math.atan2(dy, dx);
      let currentAngle = Math.atan2(orb.vy, orb.vx);
      let speed = Math.hypot(orb.vx, orb.vy);

      if (speed < 0.2) {
        currentAngle = targetAngle;
        speed = 1.0;
      }

      let angleDiff = targetAngle - currentAngle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      // 1Fあたりの最大旋回角度制限 (美しい円弧を描く)
      const maxTurn = (this.tuning.maxTurnRate || 0.035) * 1.15;
      const clampedTurn = Math.max(-maxTurn, Math.min(maxTurn, angleDiff));
      const newAngle = currentAngle + clampedTurn;

      // 自機への推進加速 (機敏なアーケード加速)
      const accel = (0.35 + Math.min(0.35, distToPlayer * 0.0018)) * this.tuning.tensionMultiplier;
      speed += accel;
      speed *= this.tuning.damping;

      const maxSpd = (cfg.maxSpeed * 1.25) * this.tuning.maxSpeedMultiplier;
      if (speed > maxSpd) speed = maxSpd;

      orb.vx = Math.cos(newAngle) * speed;
      orb.vy = Math.sin(newAngle) * speed;

      // 自機通過（オーバーラン開始）判定
      const dirToPlayerX = dx / distToPlayer;
      const dirToPlayerY = dy / distToPlayer;
      const forwardToPlayer = orb.vx * dirToPlayerX + orb.vy * dirToPlayerY;

      if (distToPlayer <= 32 || (distToPlayer < 65 && forwardToPlayer < 0)) {
        orb.strokePhase = 'OVERSHOOT';
        orb.peakSpeed = Math.hypot(orb.vx, orb.vy);
        const pSpd = Math.max(0.01, orb.peakSpeed);
        orb.strokeDirX = orb.vx / pSpd;
        orb.strokeDirY = orb.vy / pSpd;
        orb.castTargetX = playerX;
        orb.castTargetY = playerY;
      }
    }

    // 最高速度クランプ (最高速倍率に対応)
    const finalSpd = Math.hypot(orb.vx, orb.vy);
    const maxAllowed = (cfg.maxSpeed * 1.30) * this.tuning.maxSpeedMultiplier;
    if (finalSpd > maxAllowed) {
      orb.vx = (orb.vx / finalSpd) * maxAllowed;
      orb.vy = (orb.vy / finalSpd) * maxAllowed;
    }

    // 火の玉チャージ判定
    if (distToPlayer > 45 && finalSpd > 3.5) {
      orb.isCharged = true;
      orb.chargeRatio = Math.min(1.0, (distToPlayer - 35) / 60);
    } else {
      orb.isCharged = false;
      orb.chargeRatio = 0;
    }

    orb.x += orb.vx;
    orb.y += orb.vy;
    orb.orbitAngle = Math.atan2(orb.y - playerY, orb.x - playerX);
    orb.orbitRadius = distToPlayer;
  }

  /**
   * ⑤ エグゼリカ分銅 ＆ 誘導オーバーラン (統合ハイブリッド)
   * クリック長押し中: エグゼリカ式分銅スピン
   * クリック離し時: 遠心力投擲リリース ➔ 自機へ円弧誘導ホーミング ➔ 自機通過後は前方へ豪快にオーバーラン突き抜け！
   */
  private updateHybrid(
    orb: GeminiOrb,
    playerX: number,
    playerY: number,
    playerVx: number,
    playerVy: number,
    cfg: PhysicsPresetConfig,
    isTetherHeld: boolean,
    onRelease?: (x: number, y: number, vx: number, vy: number) => void
  ): void {
    const wasTethered = !!orb.isTethered;
    if (isTetherHeld && !wasTethered) {
      // キャッチ！
      orb.isTethered = true;
      orb.mode = 'ORBIT';
      const curDist = Math.hypot(orb.x - playerX, orb.y - playerY) || 1;
      orb.tetherLength = Math.max(35, Math.min(140, curDist));
      orb.orbitAngle = Math.atan2(orb.y - playerY, orb.x - playerX);
      orb.orbitRadius = curDist;
      // 入射ベクトルを接線角速度に変換
      const sinA = Math.sin(orb.orbitAngle);
      const cosA = Math.cos(orb.orbitAngle);
      const tangentSpeed = -orb.vx * sinA + orb.vy * cosA;
      orb.orbitAngularVel = Math.max(-0.25, Math.min(0.25, tangentSpeed / orb.orbitRadius));
    } else if (!isTetherHeld && wasTethered) {
      // 投擲リリース！
      orb.isTethered = false;
      orb.mode = 'COMET';
      const spd = Math.hypot(orb.vx, orb.vy);
      if (spd > 0.3) {
        orb.vx *= 1.35; // 遠心力カタパルト射出初速
        orb.vy *= 1.35;
      }
      orb.strokePhase = 'OUTWARD';
      orb.launchStartX = orb.x;
      orb.launchStartY = orb.y;
      orb.peakSpeed = Math.hypot(orb.vx, orb.vy);
      orb.strokeElapsed = 0;
      if (onRelease) {
        onRelease(orb.x, orb.y, orb.vx, orb.vy);
      }
    }

    if (orb.isTethered) {
      this.updateExelicaFlail(orb, playerX, playerY, playerVx, playerVy, cfg);
    } else {
      this.updateHomingOverrun(orb, playerX, playerY, playerVx, playerVy, cfg);
    }
  }

  /**
   * 画面端境界・反射処理
   */
  private applyScreenBoundaries(orb: GeminiOrb, onWallHit?: (x: number, y: number) => void): void {
    if (this.screenEdgeBounce) {
      let bounced = false;
      if (orb.x < 14) { orb.x = 14; orb.vx = Math.abs(orb.vx) * 0.90; bounced = true; }
      if (orb.x > 346) { orb.x = 346; orb.vx = -Math.abs(orb.vx) * 0.90; bounced = true; }
      if (orb.y < 24) { orb.y = 24; orb.vy = Math.abs(orb.vy) * 0.90; bounced = true; }
      if (orb.y > 516) { orb.y = 516; orb.vy = -Math.abs(orb.vy) * 0.90; bounced = true; }
      if (bounced && onWallHit) onWallHit(orb.x, orb.y);
    } else {
      if (orb.x < -120) { orb.x = -120; orb.vx *= 0.5; }
      if (orb.x > 480) { orb.x = 480; orb.vx *= 0.5; }
      if (orb.y < -120) { orb.y = -120; orb.vy *= 0.5; }
      if (orb.y > 640) { orb.y = 640; orb.vy *= 0.5; }
    }
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
