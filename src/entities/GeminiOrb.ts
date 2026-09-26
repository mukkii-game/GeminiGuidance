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
        // --- MODE ②: 鎖鎌式フリーボディチェーン物理 ---
        // 硬い棒ではない！ジェミニは自由に飛ぶ重り。
        // 鎖の長さを超えて離れた時だけ、張力がかかって引き戻される。
        // 鎖がたるんでいる時（距離 < 鎖の長さ）は一切力がかからない。
        orb.isHoveringApex = false;
        orb.apexDwellTimer = 0;

        // 現在の相対位置
        const fDx = orb.x - playerX;
        const fDy = orb.y - playerY;
        const fDist = Math.hypot(fDx, fDy) || 1;
        const fUx = fDx / fDist; // 自機→ジェミニの単位ベクトル
        const fUy = fDy / fDist;

        // 鎖の最大長（テザー長）
        const chainLen = (orb.tetherLength || 75) * (this.tuning.orbitRadius / 75);

        // 1. 鎖の張力: 距離 > 鎖の長さ の時だけ張力発生（鎖がピンと張った！）
        if (fDist > chainLen) {
          const overstretch = fDist - chainLen;
          // 張力: 伸びすぎた分に比例 + 離れる速度を殺す減衰
          const relVx = orb.vx - playerVx;
          const relVy = orb.vy - playerVy;
          const radialVel = relVx * fUx + relVy * fUy; // 離れる速度（正=離れていく）

          // バネ張力（鎖がしなやかに引っ張る）
          const tensionK = 0.12 * this.tuning.tensionMultiplier;
          const tension = overstretch * tensionK;

          // 離れる方向の速度を減衰（鎖がピンと張って止まる感覚）
          const radialDamp = Math.max(0, radialVel) * 0.35;

          orb.vx -= fUx * (tension + radialDamp);
          orb.vy -= fUy * (tension + radialDamp);

          // ハードリミット: 鎖の1.5倍以上には絶対に離れない
          const hardLimit = chainLen * 1.5;
          if (fDist > hardLimit) {
            orb.x = playerX + fUx * hardLimit;
            orb.y = playerY + fUy * hardLimit;
            // 離れる方向の速度成分だけ消す（接線方向は保持！鎖鎌の回転を殺さない）
            if (radialVel > 0) {
              orb.vx -= radialVel * fUx;
              orb.vy -= radialVel * fUy;
            }
          }
        }
        // ※鎖がたるんでいる時（fDist <= chainLen）は何もしない！自由に飛ぶ！

        // 2. 自機の移動による間接的な運動量伝達
        // 鎖が張っている時のみ、自機の動きが接線方向トルクとして伝わる
        if (fDist > chainLen * 0.7) {
          const fTx = -fUy; // 接線単位ベクトル
          const fTy = fUx;
          const playerTangential = playerVx * fTx + playerVy * fTy;
          // 接線方向の運動量を伝達（エグゼリカ90度入力則）
          const transfer = playerTangential * 0.38 * this.tuning.tensionMultiplier;
          orb.vx += fTx * transfer;
          orb.vy += fTy * transfer;

          // スナップ引き戻し（自機がジェミニから離れる方向に急に動いた時→鞭打ち加速）
          const playerRadial = playerVx * fUx + playerVy * fUy;
          if (playerRadial < -0.5) {
            const whip = Math.abs(playerRadial) * 0.4;
            orb.vx += fTx * whip * (playerTangential >= 0 ? 1 : -1);
            orb.vy += fTy * whip * (playerTangential >= 0 ? 1 : -1);
          }
        }

        // 3. 重力（わずかな下向きの力で自然な垂れ下がり感）
        orb.vy += 0.012;

        // 4. 空気抵抗（鎖鎌らしい慣性感を残しつつ、いつかは減速）
        orb.vx *= 0.997;
        orb.vy *= 0.997;

        // 5. 位置更新
        orb.x += orb.vx;
        orb.y += orb.vy;

        // 6. テレメトリ用に極座標情報を更新
        orb.orbitAngle = Math.atan2(orb.y - playerY, orb.x - playerX);
        orb.orbitRadius = fDist;

        // 7. スピン状態分類
        const flailSpeed = Math.hypot(orb.vx - playerVx, orb.vy - playerVy);
        if (flailSpeed >= 4.5) {
          orb.spinLevel = 2;
          orb.isCharged = true;
          orb.chargeRatio = Math.min(1.0, (flailSpeed - 4.5) / 3.0);
        } else if (flailSpeed >= 2.2) {
          orb.spinLevel = 1;
          orb.isCharged = false;
          orb.chargeRatio = 0.5;
        } else {
          orb.spinLevel = 0;
          orb.isCharged = false;
          orb.chargeRatio = 0;
        }

        // 速度制限
        const maxSpd = (cfg.maxSpeed * 2.5) * this.tuning.maxSpeedMultiplier;
        if (flailSpeed > maxSpd) {
          const scale = maxSpd / flailSpeed;
          orb.vx = playerVx + (orb.vx - playerVx) * scale;
          orb.vy = playerVy + (orb.vy - playerVy) * scale;
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
        // --- MODE ①: 振り子・バネ・ヨーヨー物理 (自然な調和振動＆自機通過オーバーシュート) ---
        // ユーザー指示:
        // 「ふりこだとおもってくれ １０m先にいて静止しているジェミニがプレイヤーに向かってくる
        //  さあどこでとまる？ 今プレイヤーのところで静止する 全然振り子でもヨーヨーでもないよね
        //  プレイヤーを挟んで１０m逆側まで止まらずに行くよね？ほんとうは この処理にしてほしい
        //  で、このプレイヤー方向へのベクトルの移動している時にプレイヤーが動いても、
        //  ひもでひっぱられているわけではない体なので、そのままゴールを目指すよね これが基本
        //  ただ、ホーミング感を出すために、多少プレイヤーの動きに合わせて補正してもいい」

        const dx = playerX - orb.x;
        const dy = playerY - orb.y;
        const dist = Math.hypot(dx, dy) || 1;
        const ux = dx / dist; // 自機へ向かう単位ベクトル
        const uy = dy / dist;

        // 1. バネ・引力によるプレイヤー方向への加速度:
        // 振り子の原理: F = -k * x （フックの法則）
        // 10m離れたところから来たら、自機を通過して反対側10mまで行く！
        // エネルギー保存: 減衰がなければ振幅は保存される
        const springForce = dist * cfg.springK * this.tuning.tensionMultiplier;
        // 非線形力は廃止 — 遠距離ほど急激に引き戻す力は振り子に反する
        const totalPull = Math.min(0.55, springForce);

        // プレイヤーへ向けて加速（既存の慣性ベクトルを保ちつつ、滑らかに軌道を曲げるホーミング）
        orb.vx += ux * totalPull;
        orb.vy += uy * totalPull;

        // 2. 自機の移動によるポンピング・共鳴（プレイヤーが自機を振ったときの勢い伝達）:
        const pSpeed = Math.hypot(playerVx, playerVy);
        if (pSpeed > 0.45 && dist < 55) {
          orb.vx += playerVx * 0.28;
          orb.vy += playerVy * 0.28;
        }

        // 3. 空気抵抗（極めて小さい減衰）:
        // 振り子のエネルギー保存を尊重！ 0.9995^60 ≈ 0.97 → 1秒で3%しか減衰しない
        // プレイヤーが静止していれば10往復くらいかけてゆっくり収束する
        orb.vx *= 0.9995;
        orb.vy *= 0.9995;

        // 4. 最高速度クランプ（大幅引き上げ — 振り子の自機通過時最高速を妨げない）:
        const curSpeed = Math.hypot(orb.vx, orb.vy);
        const maxSpd = (cfg.maxSpeed * 2.5 + (orb.level - 1) * 0.6) * this.tuning.maxSpeedMultiplier;
        if (curSpeed > maxSpd) {
          orb.vx = (orb.vx / curSpeed) * maxSpd;
          orb.vy = (orb.vy / curSpeed) * maxSpd;
        }

        // 5. 頂点（折り返し地点・Apex）検出:
        // 自機から離れた場所（dist > 50）で速度が落ちた瞬間を頂点と判定
        if (dist > 50 && curSpeed < (cfg.apexThreshold * 1.4)) {
          orb.isHoveringApex = true;
          orb.apexDwellTimer++;
        } else {
          orb.isHoveringApex = false;
          orb.apexDwellTimer = 0;
        }

        // 6. 火の玉チャージ判定（自機から離れて勢いよく突進している時）:
        if (dist > 55 && curSpeed > 1.1) {
          orb.isCharged = true;
          orb.chargeRatio = Math.min(1.0, (dist - 40) / 80);
        } else {
          orb.isCharged = false;
          orb.chargeRatio = 0;
        }

        // 7. 位置更新
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
