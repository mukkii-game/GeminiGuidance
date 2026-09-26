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

  public cycleMaxSpeed(): number {
    const steps = [1.0, 1.4, 2.0, 0.7];
    const curIdx = steps.findIndex(s => Math.abs(s - this.tuning.maxSpeedMultiplier) < 0.05);
    const nextIdx = (curIdx + 1) % steps.length;
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
        orb.castTargetX = playerX;
        orb.castTargetY = playerY;
        // エグゼリカ式アンカー投げ: その瞬間の接線速度ベクトルを保持してすっ飛ぶ！
        const releaseSpeed = Math.hypot(orb.vx, orb.vy);
        if (releaseSpeed > 1.3) {
          orb.isCharged = true;
          orb.chargeRatio = Math.min(1.0, releaseSpeed / 3.0);
        } else {
          orb.isCharged = false;
        }
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
          orb.returnGoalX = playerX;
          orb.returnGoalY = playerY;
          orb.castTargetX = playerX;
          orb.castTargetY = playerY;
          orb.isCharged = false;
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
      strokePhase: 'OUTWARD',
      castTargetX: x,
      castTargetY: y - 80,
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
          const radialSpeed = relVx * fUx + relVy * fUy; // 正なら離れていく（紐がさらに伸びる）

          // 張力（自機へ引き戻す復元力）:
          // 伸びに比例する弾性バネ力（少し伸びるゴム紐のしなやかさ）
          const tensionK = 0.075 * this.tuning.tensionMultiplier;
          const tensionForce = stretch * tensionK;

          // 離れる速度に対するダンピング（ゴムの内部摩擦・ディレイ感）
          const dampForce = Math.max(0, radialSpeed) * 0.20;

          // 自機へ向かう向き（-fUx, -fUy）に張力を加える
          const totalTension = tensionForce + dampForce;
          orb.vx -= fUx * totalTension;
          orb.vy -= fUy * totalTension;
        }
        // ※ fDist <= chainLen のときは紐がたるんでいるので、紐からの力は完全にゼロ！
        // 自機が近づいてもジェミニの慣性運動は邪魔されない！

        // 2. 微小重力（自然な垂れ下がり感）
        orb.vy += 0.015;

        // 3. 自然な空気抵抗
        orb.vx *= 0.998;
        orb.vy *= 0.998;

        // 4. 最高速度クランプ（絶対速度を安全域にクランプするのみ。自機速度ベースの強制歪曲はしない）
        const absSpeed = Math.hypot(orb.vx, orb.vy);
        const maxSpd = (cfg.maxSpeed * 3.0) * this.tuning.maxSpeedMultiplier;
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
        if (tangSpeed >= 4.2) {
          orb.spinLevel = 2;
          orb.isCharged = true;
          orb.chargeRatio = Math.min(1.0, (tangSpeed - 4.2) / 3.0);
        } else if (tangSpeed >= 2.0) {
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

        // ストローク発進・折り返し判定
        const isTurnaround = curSpd < (cfg.apexThreshold * 1.5) && playerDist > 30;

        if (isTurnaround || !orb.castTargetX || !orb.returnGoalX) {
          // 「さあ行くぞ」のストローク初期化！
          const originDist = Math.max(40, playerDist);
          orb.tetherLength = originDist; // 元の距離 D0（例: 140px = 10m）
          const overshootRatio = this.tuning.overshootRatio || 0.5; // 突き抜け率（初期値50%=5m）
          const overshootDist = originDist * overshootRatio;

          // 発進時の自機方向への単位ベクトル
          const pDirX = (playerX - orb.x) / originDist;
          const pDirY = (playerY - orb.y) / originDist;

          // 通過基準点（発進時の自機位置）
          orb.castTargetX = playerX;
          orb.castTargetY = playerY;
          // 目標突き抜け点（自機を挟んで反対側へ +5m 突き抜けた地点）
          orb.returnGoalX = playerX + pDirX * overshootDist;
          orb.returnGoalY = playerY + pDirY * overshootDist;
          orb.isHoveringApex = false;
          orb.apexDwellTimer = 0;
        }

        // 通過点（発進時の自機位置）へのベクトル
        const passDx = (orb.castTargetX || playerX) - orb.x;
        const passDy = (orb.castTargetY || playerY) - orb.y;
        const distToPass = Math.hypot(passDx, passDy) || 1;
        const passUx = passDx / distToPass;
        const passUy = passDy / distToPass;

        // 通過点を通過したか？（進行方向と通過点ベクトルの内積が負 = 自機通過後）
        const dotPass = orb.vx * passUx + orb.vy * passUy;
        const passedCenter = dotPass < 0 && distToPass > 12;

        // 1. 引力計算（紐がたるんでいる間の慣性推進 vs ゴール到達・紐張り時のブレーキ）
        let pullAx = 0;
        let pullAy = 0;

        const D0 = orb.tetherLength || 100;
        // 自機から「元の距離と同じかそれ以上」離れた場合のみ紐が張る
        const isTautByPlayer = playerDist > D0 * 1.05;

        if (!passedCenter) {
          // 【通過前: 加速フェーズ】
          // 通過点に向かって、距離に応じた力強いパチンコ加速！
          const linearF = distToPass * cfg.springK * this.tuning.tensionMultiplier;
          const slingshotF = distToPass > 50 ? Math.pow((distToPass - 50) / 70, 1.7) * 0.04 * this.tuning.tensionMultiplier : 0;
          const pullF = Math.min(1.2, linearF + slingshotF);
          pullAx = passUx * pullF;
          pullAy = passUy * pullF;
        } else {
          // 【通過後: 突き抜けオーバーランフェーズ】
          // 紐はたるんでいる！自機の動きによる減衰は起きない！
          // 通過点から離れるほど復元力（ブレーキ）が滑らかにかかり、目標地点（+5m）で止まる
          const ratio = Math.max(0.2, this.tuning.overshootRatio || 0.5);
          const brakeK = (cfg.springK * this.tuning.tensionMultiplier) / (ratio * ratio);
          const brakeF = Math.min(1.4, distToPass * brakeK);
          pullAx = passUx * brakeF; // 通過点へ引き戻す（進行方向逆向き）
          pullAy = passUy * brakeF;
        }

        // 自機が極端に離れた場合（「元の距離と同じかそれ以上の距離が改めて離れた時」）のみ紐が張る
        if (isTautByPlayer) {
          const tautDx = playerX - orb.x;
          const tautDy = playerY - orb.y;
          const tautDist = Math.hypot(tautDx, tautDy) || 1;
          const tautF = Math.min(0.8, (playerDist - D0) * 0.018 * this.tuning.tensionMultiplier);
          pullAx += (tautDx / tautDist) * tautF;
          pullAy += (tautDy / tautDist) * tautF;
        }

        // 2. 加速度の適用
        orb.vx += pullAx;
        orb.vy += pullAy;

        // 3. 直線ヨーヨー整流（横滑り・公転成分の減衰）:
        if (curSpd > 0.15) {
          const targetDirX = passedCenter ? -passUx : passUx;
          const targetDirY = passedCenter ? -passUy : passUy;
          const alongV = orb.vx * targetDirX + orb.vy * targetDirY;
          const perpVx = orb.vx - alongV * targetDirX;
          const perpVy = orb.vy - alongV * targetDirY;
          // 横方向のブレを減衰してまっすぐ突き抜ける
          orb.vx = alongV * targetDirX + perpVx * 0.88;
          orb.vy = alongV * targetDirY + perpVy * 0.88;
        }

        // 4. 自機の移動によるポンピング・共鳴:
        const pSpeed = Math.hypot(playerVx, playerVy);
        if (pSpeed > 0.45 && curSpd > 0.1 && playerDist < 70) {
          const gDirX = orb.vx / curSpd;
          const gDirY = orb.vy / curSpd;
          const forwardP = playerVx * gDirX + playerVy * gDirY;
          if (forwardP > 0) {
            const boost = Math.min(2.2, forwardP * 0.28);
            orb.vx += gDirX * boost;
            orb.vy += gDirY * boost;
          }
        }

        // 5. 空気抵抗（プレイヤーが静止しているときは自然にバネ減衰して中央で静止）:
        const restingDamping = pSpeed < 0.2 && playerDist < 45 ? 0.985 : 0.9995;
        orb.vx *= restingDamping;
        orb.vy *= restingDamping;

        // 6. 最高速度クランプ:
        const updatedSpeed = Math.hypot(orb.vx, orb.vy);
        const maxSpd = (cfg.maxSpeed * 2.8 + (orb.level - 1) * 0.6) * this.tuning.maxSpeedMultiplier;
        if (updatedSpeed > maxSpd) {
          orb.vx = (orb.vx / updatedSpeed) * maxSpd;
          orb.vy = (orb.vy / updatedSpeed) * maxSpd;
        }

        // 7. 火の玉チャージ判定:
        if (playerDist > 55 && updatedSpeed > 1.1) {
          orb.isCharged = true;
          orb.chargeRatio = Math.min(1.0, (playerDist - 40) / 80);
        } else {
          orb.isCharged = false;
          orb.chargeRatio = 0;
        }

        // 8. 位置更新
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
