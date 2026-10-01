import { BossEntity, BossType, EnemyType, WeakPoint } from '../types';

export class BossManager {
  public currentBoss: BossEntity | null = null;

  public spawn(type: BossType, canvasWidth: number): BossEntity {
    let name = '';
    let stageTitle = '';
    let dialogueQuote = '';
    let width = 200;
    let height = 90;
    let hp = 140;
    let targetY = 75;
    const weakPoints: WeakPoint[] = [];

    switch (type) {
      case 'STAGE1_DEEPSEEK_KIMI':
        stageTitle = 'チャイナ・シンドローム';
        dialogueQuote = '雷雲旋風拳！ サンダークラウド……フォーメーション！';
        name = 'DEEPSEEK, KIMI & QWEN : THUNDER CLOUD DREADNOUGHT';
        width = 200;
        height = 90;
        hp = 140;
        targetY = 75;
        weakPoints.push(
          { id: 'wp_ds', xOffset: -60, yOffset: 0, radius: 28, hp: 30, maxHp: 30, active: true, label: 'DEEPSEEK' },
          { id: 'wp_kimi', xOffset: 60, yOffset: 0, radius: 28, hp: 30, maxHp: 30, active: true, label: 'KIMI' },
          { id: 'wp_core', xOffset: 0, yOffset: 10, radius: 26, hp: 40, maxHp: 40, active: true, label: 'QWEN' }
        );
        break;

      case 'STAGE2_GROK_CURSOR':
        stageTitle = 'イーロンズ・ゲート';
        dialogueQuote = 'スペース・エックス！';
        name = 'GROK 4.7 : SPACEX HEAVY STARSHIP FLEET';
        width = 210;
        height = 90;
        hp = 180;
        targetY = 60; // Perched high up behind the Breakout wall
        weakPoints.push(
          { id: 'wp_cursor_l', xOffset: -65, yOffset: 0, radius: 24, hp: 35, maxHp: 35, active: true, label: '{CURSOR}' },
          { id: 'wp_cursor_r', xOffset: 65, yOffset: 0, radius: 24, hp: 35, maxHp: 35, active: true, label: '{CURSOR}' },
          { id: 'wp_grok_engine', xOffset: 0, yOffset: 0, radius: 32, hp: 50, maxHp: 50, active: true, label: 'GROK' }
        );
        break;

      case 'STAGE3_CLAUDE_FABLE':
        stageTitle = 'ザ・ファブル';
        dialogueQuote = 'ファブル—— お前らが勝手にそう呼んでるだけだ—— 俺は、ただコーディングするだけの——プロだ！';
        name = 'CLAUDE FABLE : APEX CODE PRO';
        width = 210;
        height = 100;
        hp = 230;
        targetY = 80;
        weakPoints.push(
          { id: 'wp_sonnet_l', xOffset: -65, yOffset: -10, radius: 24, hp: 30, maxHp: 30, active: true, label: 'SONNET' },
          { id: 'wp_sonnet_r', xOffset: 65, yOffset: -10, radius: 24, hp: 30, maxHp: 30, active: true, label: 'SONNET' },
          { id: 'wp_opus_ring', xOffset: 0, yOffset: 30, radius: 26, hp: 40, maxHp: 40, active: true, label: 'OPUS' },
          { id: 'wp_fable_core', xOffset: 0, yOffset: -5, radius: 32, hp: 90, maxHp: 90, active: true, label: 'FABLE' }
        );
        break;

      case 'STAGE4_GPT6_ASTRA':
        stageTitle = '魔法使いチャッピー';
        dialogueQuote = 'アブラマハリクマハリタカブラ！';
        name = 'GPT-6 ASTRA : WIZARD CHAPPY';
        width = 240;
        height = 115;
        hp = 300;
        targetY = 85;
        weakPoints.push(
          { id: 'wp_luna', xOffset: -75, yOffset: -25, radius: 24, hp: 35, maxHp: 35, active: true, label: 'LUNA' },
          { id: 'wp_terra', xOffset: 75, yOffset: -25, radius: 26, hp: 45, maxHp: 45, active: true, label: 'TERRA' },
          { id: 'wp_sol', xOffset: 0, yOffset: 35, radius: 28, hp: 55, maxHp: 55, active: true, label: 'SOL' },
          { id: 'wp_astra', xOffset: 0, yOffset: -5, radius: 35, hp: 110, maxHp: 110, active: true, label: 'ASTRA' }
        );
        break;
    }

    width = Math.round(width * 1.15);
    height = Math.round(height * 1.15);
    for (const weakPoint of weakPoints) {
      weakPoint.xOffset *= 1.15;
      weakPoint.yOffset *= 1.15;
      weakPoint.radius *= 1.1;
    }
    this.currentBoss = {
      type,
      name,
      stageTitle,
      dialogueQuote,
      quoteTimer: 180,
      x: canvasWidth / 2,
      y: -height,
      targetY,
      width,
      height,
      hp,
      maxHp: hp,
      phase: 0,
      timer: 0,
      weakPoints,
      defeated: false,
    };

    return this.currentBoss;
  }

  public clear(): void {
    this.currentBoss = null;
  }

  public update(
    canvasWidth: number,
    playerX: number,
    playerY: number,
    onSpawnBullet?: (x: number, y: number, vx: number, vy: number) => void,
    onSpawnTackleMinion?: (type: EnemyType, x: number, y: number, vx: number, vy: number) => void,
    onSpawnRocketFleet?: () => void,
    onBossShout?: (quote: string) => void
  ): void {
    if (!this.currentBoss) return;
    const b = this.currentBoss;
    b.timer++;

    if (b.quoteTimer > 0) {
      b.quoteTimer--;
    }

    if (b.hitCooldown && b.hitCooldown > 0) {
      b.hitCooldown--;
    }

    // Entrance uses phase rather than y: sway below targetY must not restart it.
    if (b.phase === 0) {
      b.y = Math.min(b.targetY, b.y + 2.8);
      if (b.y >= b.targetY) { b.phase = 1; b.timer = 0; }
      return;
    }
    const stage = b.type === 'STAGE1_DEEPSEEK_KIMI' ? 1 : b.type === 'STAGE2_GROK_CURSOR' ? 2 : b.type === 'STAGE3_CLAUDE_FABLE' ? 3 : 4;
    b.phase = b.hp <= b.maxHp * 0.5 ? 2 : 1;
    const cycle = b.timer % 360;
    const opening = cycle >= 260;
    // Stable, slightly lowered target during each recovery window.
    const sway = opening ? 12 : Math.min(35, (canvasWidth - b.width) / 2 - 8);
    b.x += (canvasWidth / 2 + Math.sin(b.timer * 0.012) * sway - b.x) * 0.055;
    b.y += (b.targetY + (opening ? 24 : Math.sin(b.timer * 0.018) * 8) - b.y) * 0.045;
    if (cycle === 260 && onBossShout) onBossShout('CORE OPEN — 突き・投擲のチャンス！');
    if (opening) return;

    const types: EnemyType[] = ['MISTRAL_FLAME', 'CURSOR_PROBE', 'CLAUDE_HAIKU', 'GPT6_LUNA'];
    const launch = (side: number) => {
      if (!onSpawnTackleMinion) return;
      // Destroying a wing permanently removes its aimed body-tackle lane.
      if (side < 0 && !b.weakPoints[0]?.active) return;
      if (side > 0 && !b.weakPoints[1]?.active) return;
      const x = b.x + side;
      const y = b.y + 32;
      const dx = playerX - x;
      const dy = playerY - y;
      const distance = Math.hypot(dx, dy) || 1;
      const speed = 2.2 + stage * 0.15 + (b.phase === 2 ? 0.2 : 0);
      onSpawnTackleMinion(types[stage - 1], x, y, dx / distance * speed, dy / distance * speed);
    };
    if (cycle === 45 || cycle === 155) launch(cycle === 45 ? -58 : 58);
    if (b.phase === 2 && cycle === 210) launch(0);
    if (stage >= 3 && cycle === 85) launch(-58);
    if (stage >= 3 && cycle === 195) launch(58);

    // Distinct readable attacks; every cycle retains a 100-frame quiet window.
    if (onSpawnBullet && cycle === 110) {
      const aim = Math.atan2(playerY - b.y, playerX - b.x);
      const spread = stage === 1 ? [-0.22, 0.22] : stage === 2 ? [-0.32, 0, 0.32] : [-0.44, -0.22, 0, 0.22, 0.44];
      for (const offset of spread) {
        const speed = 1.45 + stage * 0.12;
        onSpawnBullet(b.x, b.y + 30, Math.cos(aim + offset) * speed, Math.sin(aim + offset) * speed);
      }
    }
    if (stage === 2 && cycle === 200 && b.timer % 720 < 360) {
      if (onBossShout) onBossShout('スペース・エックス！ 下方に注意');
      if (onSpawnRocketFleet) onSpawnRocketFleet();
    }
    if (stage === 4 && cycle === 200 && onSpawnBullet) {
      // A broad fan leaves lanes between rays and never seals the arena.
      for (let ray = 0; ray < 5; ray++) {
        const angle = Math.PI * (0.2 + ray * 0.15);
        onSpawnBullet(b.x, b.y + 30, Math.cos(angle) * 1.85, Math.sin(angle) * 1.85);
      }
    }
  }

  public hit(damage: number, hitX: number, hitY: number, orbRadius: number = 16): { bossHit: boolean; defeated: boolean; points: number } {
    if (!this.currentBoss || this.currentBoss.defeated) {
      return { bossHit: false, defeated: false, points: 0 };
    }

    const b = this.currentBoss;
    let hitSomething = false;
    let points = 0;
    const radius = Math.max(0, orbRadius);
    const opening = b.phase > 0 && b.timer % 360 >= 260;

    // Check hit against individual weak points
    for (const wp of b.weakPoints) {
      if (!wp.active) continue;
      const wpX = b.x + wp.xOffset;
      const wpY = b.y + wp.yOffset;
      const dist = Math.hypot(hitX - wpX, hitY - wpY);

      if (dist < wp.radius + radius) {
        hitSomething = true;
        const weakDamage = Math.max(1, Math.round(damage * (opening ? 2 : 1.5)));
        wp.hp -= weakDamage;
        b.hp -= weakDamage;
        points += 150 * weakDamage;

        if (wp.hp <= 0) {
          wp.active = false;
          points += 1000;
        }
        break;
      }
    }

    // Center body hit
    if (!hitSomething) {
      // Closest point on the visible hull; a tiny resting orb cannot hit
      // the empty space below a wide boss, while larger thrown orbs count.
      const closestX = Math.max(b.x - b.width * 0.45, Math.min(hitX, b.x + b.width * 0.45));
      const closestY = Math.max(b.y - b.height * 0.42, Math.min(hitY, b.y + b.height * 0.42));
      if (Math.hypot(hitX - closestX, hitY - closestY) <= radius) {
        hitSomething = true;
        b.hp -= damage;
        points += 100 * damage;
      }
    }

    if (b.hp <= 0) {
      b.hp = 0;
      b.defeated = true;
      return { bossHit: true, defeated: true, points: points + 10000 };
    }

    return { bossHit: hitSomething, defeated: false, points };
  }
}
