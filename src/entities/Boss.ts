import { BossEntity, BossType, EnemyType, WeakPoint } from '../types';

export class BossManager {
  public currentBoss: BossEntity | null = null;

  public spawn(type: BossType, canvasWidth: number): BossEntity {
    let name = '';
    let stageTitle = '';
    let dialogueQuote = '';
    let width = 200;
    let height = 90;
    let hp = 100;
    let targetY = 75;
    const weakPoints: WeakPoint[] = [];

    switch (type) {
      case 'STAGE1_DEEPSEEK_KIMI':
        stageTitle = 'チャイナ・シンドローム';
        dialogueQuote = '雷雲旋風拳！ サンダークラウド……フォーメーション！';
        name = 'DEEPSEEK, KIMI & QWEN : THUNDER CLOUD DREADNOUGHT';
        width = 200;
        height = 90;
        hp = 100;
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
        hp = 120;
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
        hp = 160;
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
        hp = 220;
        targetY = 85;
        weakPoints.push(
          { id: 'wp_luna', xOffset: -75, yOffset: -25, radius: 24, hp: 35, maxHp: 35, active: true, label: 'LUNA' },
          { id: 'wp_terra', xOffset: 75, yOffset: -25, radius: 26, hp: 45, maxHp: 45, active: true, label: 'TERRA' },
          { id: 'wp_sol', xOffset: 0, yOffset: 35, radius: 28, hp: 55, maxHp: 55, active: true, label: 'SOL' },
          { id: 'wp_astra', xOffset: 0, yOffset: -5, radius: 35, hp: 110, maxHp: 110, active: true, label: 'ASTRA' }
        );
        break;
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

    // Entrance flight
    if (b.y < b.targetY) {
      b.y += 0.32;
      return;
    }

    // --- 1. デカくてゆっくりうごく (Huge, majestic, slow sway at top) ---
    b.x = canvasWidth / 2 + Math.sin(b.timer * 0.008) * 65;
    b.y = b.targetY + Math.cos(b.timer * 0.010) * 10;

    // --- 2. ザコが体当たりしてくる (Minion Targeted Body Slam) ---
    // Every 140 ticks (~2.3s), boss launches a tackle minion aimed directly at Solvalou!
    if (onSpawnTackleMinion && b.timer % 140 === 70) {
      let minionType: EnemyType = 'MISTRAL_FLAME';
      const launchSide = (b.timer % 280 === 70) ? -55 : 55;

      if (b.type === 'STAGE1_DEEPSEEK_KIMI') {
        minionType = Math.random() > 0.5 ? 'MISTRAL_FLAME' : 'KIMI_MOON';
        if (b.timer % 280 === 70 && onBossShout) {
          onBossShout('雷雲旋風拳！ サンダークラウド……フォーメーション！');
        }
      } else if (b.type === 'STAGE2_GROK_CURSOR') {
        minionType = 'CURSOR_PROBE';
      } else if (b.type === 'STAGE3_CLAUDE_FABLE') {
        minionType = 'CLAUDE_HAIKU';
      } else {
        minionType = 'GPT6_LUNA';
      }

      const launchX = b.x + launchSide;
      const launchY = b.y + 25;

      const dx = playerX - launchX;
      const dy = playerY - launchY;
      const dist = Math.hypot(dx, dy) || 1;
      const tackleSpeed = 1.20; // Readable, dodgeable high-speed tackle!

      onSpawnTackleMinion(
        minionType,
        launchX,
        launchY,
        (dx / dist) * tackleSpeed,
        (dy / dist) * tackleSpeed
      );
    }

    // Stage 2 Grok launches SpaceX Starship fleet from bottom
    if (b.type === 'STAGE2_GROK_CURSOR' && b.timer % 280 === 180) {
      if (onBossShout) onBossShout('スペース・エックス！');
      if (onSpawnRocketFleet) onSpawnRocketFleet();
    }

    // Very rare, slow white bullet from center
    if (onSpawnBullet && b.timer % 240 === 0) {
      const bdx = playerX - b.x;
      const bdy = playerY - b.y;
      const dist = Math.hypot(bdx, bdy) || 1;
      onSpawnBullet(b.x, b.y + 25, (bdx / dist) * 0.30, (bdy / dist) * 0.30);
    }
  }

  public hit(damage: number, hitX: number, hitY: number): { bossHit: boolean; defeated: boolean; points: number } {
    if (!this.currentBoss || this.currentBoss.defeated) {
      return { bossHit: false, defeated: false, points: 0 };
    }

    const b = this.currentBoss;
    let hitSomething = false;
    let points = 0;

    // Check hit against individual weak points
    for (const wp of b.weakPoints) {
      if (!wp.active) continue;
      const wpX = b.x + wp.xOffset;
      const wpY = b.y + wp.yOffset;
      const dist = Math.hypot(hitX - wpX, hitY - wpY);

      if (dist < wp.radius + 16) {
        hitSomething = true;
        wp.hp -= damage;
        b.hp -= damage;
        points += 150 * damage;

        if (wp.hp <= 0) {
          wp.active = false;
          points += 1000;
        }
        break;
      }
    }

    // Center body hit
    if (!hitSomething) {
      const distCenter = Math.hypot(hitX - b.x, hitY - b.y);
      if (distCenter < b.width * 0.45) {
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
