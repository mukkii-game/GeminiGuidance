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
          orb.strokePhase = 'INWARD';
          orb.launchStartX = orb.x;
          orb.launchStartY = orb.y;
          orb.castTargetX = playerX;
          orb.castTargetY = playerY;
          orb.strokeDist = Math.max(30, Math.hypot(orb.x - playerX, orb.y - playerY));
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
        const pSpeed = Math.hypot(playerVx, playerVy);

        // 1. フェーズ初期化
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

        // 基準ストローク距離 D0 と 目標オーバーシュート距離（50% = +5m）
        const D0 = Math.max(35, orb.strokeDist || playerDist);
        const targetOvershoot = D0 * (this.tuning.overshootRatio || 0.5);

        if (orb.strokePhase === 'APEX') {
          // --- APEX滞空フェーズ ---
          // フワッとした最上部滞空（急反転・角度急変を排除し、放物線の頂点のように滑らかに静止）
          orb.isHoveringApex = true;
          orb.vx *= 0.88;
          orb.vy *= 0.88;
          orb.apexDwellTimer = (orb.apexDwellTimer || 0) - 1;

          if (orb.apexDwellTimer <= 0) {
            // 滞空完了: 次のストローク開始！
            // 最新の自機位置を通過目標にセットし、INWARDフェーズへ
            orb.strokePhase = 'INWARD';
            orb.isHoveringApex = false;
            orb.launchStartX = orb.x;
            orb.launchStartY = orb.y;
            orb.castTargetX = playerX;
            orb.castTargetY = playerY;
            orb.strokeDist = Math.max(30, playerDist);

            const dx = playerX - orb.x;
            const dy = playerY - orb.y;
            const d = Math.hypot(dx, dy) || 1;
            orb.strokeDirX = dx / d;
            orb.strokeDirY = dy / d;
          }

        } else if (orb.strokePhase === 'REST') {
          // --- REST静止フェーズ ---
          // 自機近くで落ち着いた状態。無理な公転をせず、自機の周りで静止。
          orb.isHoveringApex = false;
          orb.vx *= 0.90;
          orb.vy *= 0.90;

          // プレイヤーが一気に距離を取ったら（引っ張ったら）、強力発進！
          if (playerDist > 35 || pSpeed > 0.45) {
            orb.strokePhase = 'INWARD';
            orb.launchStartX = orb.x;
            orb.launchStartY = orb.y;
            orb.castTargetX = playerX;
            orb.castTargetY = playerY;
            orb.strokeDist = Math.max(35, playerDist);
            const dx = playerX - orb.x;
            const dy = playerY - orb.y;
            const d = Math.hypot(dx, dy) || 1;
            orb.strokeDirX = dx / d;
            orb.strokeDirY = dy / d;
          }

        } else if (orb.strokePhase === 'OVERSHOOT') {
          // --- OVERSHOOT突き抜けフェーズ ---
          // 自機通過後、さらに +50%（5m）慣性で突き抜ける！
          // 紐はたるんでいるため、自機が動いたり交差しても減衰・停止は起きない！
          orb.isHoveringApex = false;

          const anchorX = orb.castTargetX ?? playerX;
          const anchorY = orb.castTargetY ?? playerY;
          const dirX = orb.strokeDirX ?? (curSpd > 0.01 ? orb.vx / curSpd : 0);
          const dirY = orb.strokeDirY ?? (curSpd > 0.01 ? orb.vy / curSpd : -1);

          // 通過点からの進行方向の距離 s
          const s = (orb.x - anchorX) * dirX + (orb.y - anchorY) * dirY;

          // 進行方向の前進速度
          const forwardV = orb.vx * dirX + orb.vy * dirY;

          // 目標オーバーシュート距離 targetOvershoot に向けて滑らかにブレーキ減速
          const peakV = Math.max(2.0, orb.peakSpeed || curSpd);
          const brakeAccel = (peakV * peakV) / (2 * Math.max(20, targetOvershoot));
          orb.vx -= dirX * brakeAccel * 0.92;
          orb.vy -= dirY * brakeAccel * 0.92;

          // 直線整流（横方向のブレを減衰）
          const perpVx = orb.vx - forwardV * dirX;
          const perpVy = orb.vy - forwardV * dirY;
          orb.vx = forwardV * dirX + perpVx * 0.85;
          orb.vy = forwardV * dirY + perpVy * 0.85;

          // 自機が元の距離 D0 以上改めて離れた場合のみ、紐がピンと張って引力がかかる
          if (playerDist > D0 * 1.15) {
            const tautF = Math.min(0.8, (playerDist - D0) * 0.02 * this.tuning.tensionMultiplier);
            orb.vx += ((playerX - orb.x) / playerDist) * tautF;
            orb.vy += ((playerY - orb.y) / playerDist) * tautF;
          }

          // 頂点到達判定（50%オーバーシュート地点に達したか、前進速度がゼロになった時）
          if (s >= targetOvershoot || forwardV <= 0.20) {
            orb.strokePhase = 'APEX';
            orb.apexDwellTimer = Math.round(9 * this.tuning.apexDwellMultiplier);
            orb.isHoveringApex = true;
          }

        } else {
          // --- INWARD接近フェーズ ---
          // 離れた距離 D0 に応じた強烈なパチンコ初期加速！
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

          // 距離に応じた推進力
          const linearF = distToAnchor * cfg.springK * this.tuning.tensionMultiplier * 1.35;
          const slingshotBonus = D0 > 45 ? Math.pow((D0 - 45) / 55, 1.6) * 0.055 * this.tuning.tensionMultiplier : 0;
          const accel = Math.min(1.5, linearF + slingshotBonus);

          orb.vx += dirX * accel;
          orb.vy += dirY * accel;

          // 直線整流
          if (curSpd > 0.15) {
            const alongV = orb.vx * dirX + orb.vy * dirY;
            const perpVx = orb.vx - alongV * dirX;
            const perpVy = orb.vy - alongV * dirY;
            orb.vx = alongV * dirX + perpVx * 0.88;
            orb.vy = alongV * dirY + perpVy * 0.88;
          }

          // 自機が同方向に引いた時の共鳴ポンピング加速
          if (pSpeed > 0.4 && curSpd > 0.1) {
            const forwardP = playerVx * dirX + playerVy * dirY;
            if (forwardP > 0) {
              const boost = Math.min(2.0, forwardP * 0.25);
              orb.vx += dirX * boost;
              orb.vy += dirY * boost;
            }
          }

          // 通過点到達判定（アンカーを通過したか、12px以内に接近した時）
          const forwardAlongDir = (orb.x - anchorX) * dirX + (orb.y - anchorY) * dirY;
          if (forwardAlongDir >= -2.0 || distToAnchor <= 12) {
            orb.strokePhase = 'OVERSHOOT';
            orb.peakSpeed = Math.hypot(orb.vx, orb.vy);

            // 自機が静止していて距離がごく小さい場合は自然にRESTへ移行
            if (D0 < 22 && pSpeed < 0.2) {
              orb.strokePhase = 'REST';
              orb.vx *= 0.3;
              orb.vy *= 0.3;
            }
          }
        }

        // 最高速度クランプ
        const updatedSpeed = Math.hypot(orb.vx, orb.vy);
        const maxSpd = (cfg.maxSpeed * 2.8 + (orb.level - 1) * 0.6) * this.tuning.maxSpeedMultiplier;
        if (updatedSpeed > maxSpd) {
          orb.vx = (orb.vx / updatedSpeed) * maxSpd;
          orb.vy = (orb.vy / updatedSpeed) * maxSpd;
        }

        // 火の玉チャージ判定
        if (playerDist > 55 && updatedSpeed > 1.2) {
          orb.isCharged = true;
          orb.chargeRatio = Math.min(1.0, (playerDist - 40) / 80);
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
