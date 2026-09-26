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
    overshootRatio: 0.5, // 10m離れていたら自機通過後+5m突き抜ける
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

  public cycleOvershoot(): number {
    const steps = [0.5, 0.75, 1.0, 0.3];
    const curIdx = steps.findIndex(s => Math.abs(s - this.tuning.overshootRatio) < 0.05);
    const nextIdx = (curIdx + 1) % steps.length;
    this.tuning.overshootRatio = steps[nextIdx];
    return this.tuning.overshootRatio;
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
      overshootRatio: 0.5,
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
    onWallHit?: (x: number, y: number) => void
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

      if (orb.mode === 'ORBIT') {
        // --- MODE ②: 純粋弾性テザー（ヒモ／ゴム紐）分銅物理 ---
        // 棒ではない！ジェミニは独立した慣性を持つ重り。
        // 自機が近づく（たるむ: dist <= chainLen）ときは力ゼロ！自機移動の影響を一切受けない。
        // 引っ張られる（張る: dist > chainLen）ときのみ、ゴム紐の張力で自機に向かって引っ張られる。
        // プレイヤーが自機を回すと、向心張力によって自然と遠心円運動になる！
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
          // 【ヒモが張った時】:
          // ゴムとして伸びる量
          const stretch = fDist - chainLen;

          // 自機とジェミニの相対速度（離れる速度成分）
          const relVx = orb.vx - playerVx;
          const relVy = orb.vy - playerVy;
          const radialSpeed = relVx * fUx + relVy * fUy;

          // 物理的張力（Euler振動・カクカクしたチャタリングを起こさない滑らかな張力定数）
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

        // 6. テレメトリ情報更新
        orb.orbitAngle = Math.atan2(orb.y - playerY, orb.x - playerX);
        orb.orbitRadius = fDist;

        // 7. スピン状態分類（自機周りの回転速度）
        const relVx = orb.vx - playerVx;
        const relVy = orb.vy - playerVy;
        const tangSpeed = Math.abs(relVx * (-fUy) + relVy * fUx);
        if (tangSpeed >= 2.8) {
          orb.spinLevel = 2;
          orb.isCharged = true;
          orb.chargeRatio = Math.min(1.0, (tangSpeed - 2.8) / 1.5);
        } else if (tangSpeed >= 1.5) {
          orb.spinLevel = 1;
          orb.isCharged = false;
          orb.chargeRatio = 0.5;
        } else {
          orb.spinLevel = 0;
          orb.isCharged = false;
          orb.chargeRatio = 0;
        }

        // 画面端反射（設定時）
        if (this.screenEdgeBounce) {
          let bounced = false;
          if (orb.x < 14) { orb.x = 14; orb.vx = Math.abs(orb.vx) * 0.85; bounced = true; }
          if (orb.x > 346) { orb.x = 346; orb.vx = -Math.abs(orb.vx) * 0.85; bounced = true; }
          if (orb.y < 24) { orb.y = 24; orb.vy = Math.abs(orb.vy) * 0.85; bounced = true; }
          if (orb.y > 516) { orb.y = 516; orb.vy = -Math.abs(orb.vy) * 0.85; bounced = true; }
          if (bounced && onWallHit) onWallHit(orb.x, orb.y);
        }

      } else if (orb.mode === 'COMET') {
        // --- MODE ③: ハレー彗星スイングバイ・ホーミング (Halley's Comet Gravitational Swing-by) ---
        // ユーザー指示:
        // 「本来は、自機に向かってくるホーミングなのに自機から離れて
        //  ほーみんぐぽいしょりでやってくれない？はれーすいせいみたいな　３つめのそうさついかでいい」
        //
        // 【物理モデル】:
        // 自機を太陽（引力中心）とした天体スイングバイ力学。
        // 常に自機に向かって重力加速度（ホーミング）が働き、自機に近づく（近日点）ほど猛スピードに加速！
        // 自機を掠めて通過する瞬間に最速（スイングバイ）となり、慣性ですっ飛んで遠く（遠日点）へ離脱！
        // 遠くへ離れると自機の引力で滑らかに減速し、フワッと頂点で折り返して再び自機へ突進！
        // 自機を動かすことで彗星の軌道を自在に操り、敵群を貫き通す！

        orb.isHoveringApex = false;
        orb.apexDwellTimer = 0;

        const cDx = playerX - orb.x;
        const cDy = playerY - orb.y;
        const cDist = Math.hypot(cDx, cDy) || 1;
        const cUx = cDx / cDist;
        const cUy = cDy / cDist;

        // 1. 角度的ホーミング旋回（Proportional Navigation Steering）
        // ユーザー指示: 「ハレー彗星もうちょっとホーミング力強くして 自機に近づきやすい、角度的に」
        // 速度ベクトルの向きを自機方向へ強力に旋回操舵。
        // これにより横方向の惰性で大回りすることなく、鋭く自機に向かって突進・回頭する！
        let curSpd = Math.hypot(orb.vx, orb.vy);
        if (curSpd > 0.05) {
          const curAngle = Math.atan2(orb.vy, orb.vx);
          const targetAngle = Math.atan2(cDy, cDx);
          let angleDiff = targetAngle - curAngle;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

          // 旋回角速度: 距離が離れているときは確実に自機を捉え、通過時もキュッと鋭くUターン
          const turnRate = (0.08 + 0.04 * Math.min(1.0, cDist / 120)) * this.tuning.tensionMultiplier;
          const turnStep = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), turnRate);
          const steeredAngle = curAngle + turnStep;

          orb.vx = Math.cos(steeredAngle) * curSpd;
          orb.vy = Math.sin(steeredAngle) * curSpd;
        }

        // 2. 重力・ホーミング加速度（万有引力 + ホーミング突進力）
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

        // 7. 火の玉・彗星の光冠チャージ判定（高速スイングバイ時に燃え盛る！）
        if (curSpd > 1.8) {
          orb.isCharged = true;
          orb.chargeRatio = Math.min(1.0, (curSpd - 1.8) / 1.4);
        } else {
          orb.isCharged = false;
          orb.chargeRatio = 0;
        }

        // 画面端反射（設定時）
        if (this.screenEdgeBounce) {
          let bounced = false;
          if (orb.x < 14) { orb.x = 14; orb.vx = Math.abs(orb.vx) * 0.92; bounced = true; }
          if (orb.x > 346) { orb.x = 346; orb.vx = -Math.abs(orb.vx) * 0.92; bounced = true; }
          if (orb.y < 24) { orb.y = 24; orb.vy = Math.abs(orb.vy) * 0.92; bounced = true; }
          if (orb.y > 516) { orb.y = 516; orb.vy = -Math.abs(orb.vy) * 0.92; bounced = true; }
          if (bounced && onWallHit) onWallHit(orb.x, orb.y);
        } else {
          // 画面外ドラッグ
          if (orb.x < -120) { orb.x = -120; orb.vx *= 0.5; }
          if (orb.x > 480) { orb.x = 480; orb.vx *= 0.5; }
          if (orb.y < -120) { orb.y = -120; orb.vy *= 0.5; }
          if (orb.y > 640) { orb.y = 640; orb.vy *= 0.5; }
        }

      } else {
        // --- MODE ①: ヨーヨー突き攻撃 (紐のたるみ物理 ＆ 慣性突き抜け保証) ---
        // ユーザー指示:
        // 「ヨーヨーなので、たとえば１０ｍのきょりで、さあいくぞとジェミニが進むと、
        //  今の自機の位置より少しオーバーランする、これはできている。
        //  ただ自機がヨーヨーと交差するようにしても、リアルタイムのヨーヨーの位置を見てそこに向かうベクトルを入れて減衰し、
        //  動かなかったときに比べて距離が短くなる。
        //  でも、ヨーヨーだと、ひもがゆるんでいるから、元の距離と同じかそれ以上の距離が改めて離れない限り、
        //  自機の移動による減衰は起きないよね」
        //
        // 【物理モデル】:
        // 1. 外側で「さあ行くぞ」と突進を開始した瞬間に、その時の自機位置・距離 D0（10m）と、
        //    自機通過後+5mの「目標到達地点（空間固定ゴール）」を確定。
        // 2. 突進中〜自機通過〜目標到達点までの間、紐はずっとたるんでいる（Slack状態）！
        //    自機が交差しようが横に動こうが、自機のリアルタイム位置による引力ブレーキは一切かからない！
        //    動かなかった時と全く同じ勢いで突き抜ける！
        // 3. 自機から「元の距離 D0 以上」離れるか、目標到達点に達した瞬間に初めて紐がピンと張り、
        //    そこで自然に減速して次のストロークへ折り返す！

        const playerDist = Math.hypot(orb.x - playerX, orb.y - playerY);
        const curSpd = Math.hypot(orb.vx, orb.vy);

        // 1. フェーズ初期化
        if (!orb.strokePhase || orb.strokePhase === 'OUTWARD' || orb.strokePhase === 'RETURN') {
          orb.strokePhase = 'INWARD';
          orb.castTargetX = playerX;
          orb.castTargetY = playerY;
          orb.strokeDist = playerDist;
          orb.apexDwellTimer = 0;
          orb.isHoveringApex = false;
        }

        // 基準ストローク距離 D0
        const D0 = Math.max(10, orb.strokeDist ?? playerDist);
        const ratio = Math.max(0.25, this.tuning.overshootRatio || 0.5);

        // アンカー（通過目標点）
        const anchorX = orb.castTargetX ?? playerX;
        const anchorY = orb.castTargetY ?? playerY;

        // アンカーへの変位ベクトル
        const dx = anchorX - orb.x;
        const dy = anchorY - orb.y;
        const distToAnchor = Math.hypot(dx, dy) || 1;
        const ux = dx / distToAnchor;
        const uy = dy / distToAnchor;

        // ストローク進行方向ベクトル
        if (orb.strokeDirX === undefined || orb.strokeDirY === undefined) {
          orb.strokeDirX = ux;
          orb.strokeDirY = uy;
        }
        const sDirX = orb.strokeDirX;
        const sDirY = orb.strokeDirY;

        // アンカーを基準とした進行方向の変位 s
        // （s < 0: アンカー手前で接近中、s >= 0: アンカー通過後でオーバーラン中）
        const s = (orb.x - anchorX) * sDirX + (orb.y - anchorY) * sDirY;
        const forwardV = orb.vx * sDirX + orb.vy * sDirY;

        if (orb.strokePhase === 'APEX') {
          // --- APEX滞空フェーズ ---
          // 放物線の頂点のようにフワッと微小な慣性で漂う
          orb.isHoveringApex = true;
          orb.vx *= 0.88;
          orb.vy *= 0.88;
          orb.apexDwellTimer = (orb.apexDwellTimer || 0) - 1;

          if (orb.apexDwellTimer <= 0) {
            // 滞空完了: 次のストロークを現在の自機位置に向けて開始
            orb.isHoveringApex = false;
            orb.castTargetX = playerX;
            orb.castTargetY = playerY;
            orb.strokeDist = playerDist;

            if (playerDist < 18 && pSpeed < 0.2) {
              orb.strokePhase = 'REST';
            } else {
              orb.strokePhase = 'INWARD';
              const ndx = playerX - orb.x;
              const ndy = playerY - orb.y;
              const nd = Math.hypot(ndx, ndy) || 1;
              orb.strokeDirX = ndx / nd;
              orb.strokeDirY = ndy / nd;
            }
          }

        } else if (orb.strokePhase === 'REST') {
          // --- REST静止フェーズ ---
          // 自機近くで落ち着いた状態。無理な公転をせず、自然にバネ減衰。
          orb.isHoveringApex = false;
          orb.vx *= 0.92;
          orb.vy *= 0.92;

          // 自機から距離が離れたら（引っ張られたら）、自然に新ストロークへ
          if (playerDist > 25 || pSpeed > 0.4) {
            orb.strokePhase = 'INWARD';
            orb.castTargetX = playerX;
            orb.castTargetY = playerY;
            orb.strokeDist = playerDist;
            const ndx = playerX - orb.x;
            const ndy = playerY - orb.y;
            const nd = Math.hypot(ndx, ndy) || 1;
            orb.strokeDirX = ndx / nd;
            orb.strokeDirY = ndy / nd;
          }

        } else {
          // --- 純粋物理バネ力学 (Hooke's Law + 非対称バネ) ---
          orb.isHoveringApex = false;

          // 基本バネ定数（微小移動では微小な力しか出ない）
          const baseK = cfg.springK * 1.35 * this.tuning.tensionMultiplier;

          if (s < 0) {
            // 【アンカー手前: 接近フェーズ】
            // 離れた距離に応じた連続的な引力（自然なビルドアップ加速）
            const progressive = 1.0 + Math.min(1.4, (distToAnchor / 75) * 0.65);
            const springForce = distToAnchor * baseK * progressive;

            // アンカーに向かって自然に加速 (F = m * a)
            orb.vx += ux * springForce;
            orb.vy += uy * springForce;

            // アンカーを通過した瞬間、OVERSHOOTへ
            if (s >= -2.0 || distToAnchor <= 8) {
              orb.strokePhase = 'OVERSHOOT';
            }

          } else {
            // 【アンカー通過後: 50%オーバーシュート・ブレーキフェーズ】
            // 物理的な非対称バネ: k_out = k_in / (ratio^2)
            // これにより、自然な調和振動子のまま 50% の距離で前進速度がゼロになる！
            const kOut = baseK / (ratio * ratio);
            const brakeForce = s * kOut;

            // アンカー方向（手前）へ引っ張る復元力
            orb.vx -= sDirX * brakeForce;
            orb.vy -= sDirY * brakeForce;

            // 頂点到達判定（前進速度がゼロ以下になった、またはオーバーシュート目標到達）
            const maxOvershootDist = D0 * ratio;
            if (forwardV <= 0.10 || s >= maxOvershootDist) {
              orb.strokePhase = 'APEX';
              orb.apexDwellTimer = Math.round(7 * this.tuning.apexDwellMultiplier);
              orb.isHoveringApex = true;
            }
          }

          // 紐のたるみ物理（Slack Rope）:
          // 自機が元の距離 D0 以上に改めて離れた場合のみ、紐が張って自機への引力が加算
          if (playerDist > D0 * 1.25) {
            const tautF = (playerDist - D0) * baseK * 0.5;
            const tdx = (playerX - orb.x) / playerDist;
            const tdy = (playerY - orb.y) / playerDist;
            orb.vx += tdx * tautF;
            orb.vy += tdy * tautF;
          }

          // 直線整流: 横方向のブレ（公転成分）を滑らかに減衰し、綺麗な直線往復にする
          if (curSpd > 0.15) {
            const alongV = orb.vx * sDirX + orb.vy * sDirY;
            const perpVx = orb.vx - alongV * sDirX;
            const perpVy = orb.vy - alongV * sDirY;
            orb.vx = alongV * sDirX + perpVx * 0.88;
            orb.vy = alongV * sDirY + perpVy * 0.88;
          }
        }

        // 自然な空気抵抗
        orb.vx *= 0.997;
        orb.vy *= 0.997;

        // 最高速度クランプ（自然な重量感・制御しやすい速度: 3.2px/frame基準）
        const updatedSpeed = Math.hypot(orb.vx, orb.vy);
        const maxSpd = (cfg.maxSpeed * 1.35 + (orb.level - 1) * 0.35) * this.tuning.maxSpeedMultiplier;
        if (updatedSpeed > maxSpd) {
          orb.vx = (orb.vx / updatedSpeed) * maxSpd;
          orb.vy = (orb.vy / updatedSpeed) * maxSpd;
        }

        // 火の玉チャージ判定（十分に離れて猛スピードで突進している時のみ点火）
        if (playerDist > 55 && updatedSpeed > 1.6) {
          orb.isCharged = true;
          orb.chargeRatio = Math.min(1.0, (playerDist - 45) / 75);
        } else {
          orb.isCharged = false;
          orb.chargeRatio = 0;
        }

        // 位置更新
        orb.x += orb.vx;
        orb.y += orb.vy;

        // 画面端反射（設定時）
        if (this.screenEdgeBounce) {
          let bounced = false;
          if (orb.x < 14) { orb.x = 14; orb.vx = Math.abs(orb.vx) * 0.95; bounced = true; }
          if (orb.x > 346) { orb.x = 346; orb.vx = -Math.abs(orb.vx) * 0.95; bounced = true; }
          if (orb.y < 24) { orb.y = 24; orb.vy = Math.abs(orb.vy) * 0.95; bounced = true; }
          if (orb.y > 516) { orb.y = 516; orb.vy = -Math.abs(orb.vy) * 0.95; bounced = true; }
          if (bounced && onWallHit) onWallHit(orb.x, orb.y);
        } else {
          // 画面外の緩やかなドラッグ
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
