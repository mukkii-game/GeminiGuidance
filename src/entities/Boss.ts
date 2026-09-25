import { BossEntity, BossType, WeakPoint } from '../types';

export class BossManager {
  public currentBoss: BossEntity | null = null;

  public spawn(type: BossType, canvasWidth: number): BossEntity {
    let name = '';
    let stageTitle = '';
    let dialogueQuote = '';
    let width = 140;
    let height = 90;
    let hp = 80;
    let targetY = 85;
    const weakPoints: WeakPoint[] = [];

    switch (type) {
      case 'STAGE1_DEEPSEEK_KIMI':
        stageTitle = 'チャイナ・シンドローム';
        dialogueQuote = '雷雲旋風拳！ サンダークラウド……フォーメーション！';
        name = 'DEEPSEEK, KIMI & QWEN : THUNDER CLOUD FORMATION';
        width = 140;
        height = 80;
        hp = 80;
        targetY = 85;
        weakPoints.push(
          { id: 'wp_ds', xOffset: -45, yOffset: 0, radius: 22, hp: 25, maxHp: 25, active: true, label: 'DEEPSEEK' },
          { id: 'wp_kimi', xOffset: 45, yOffset: 0, radius: 22, hp: 25, maxHp: 25, active: true, label: 'KIMI' },
          { id: 'wp_core', xOffset: 0, yOffset: 6, radius: 20, hp: 30, maxHp: 30, active: true, label: 'QWEN' }
        );
        break;

      case 'STAGE2_GROK_CURSOR':
        stageTitle = 'イーロンズ・ゲート';
        dialogueQuote = 'スペース・エックス！';
        name = 'GROK 4.7 : SPACEX HEAVY STARSHIP FLEET';
        width = 160;
        height = 80;
        hp = 110;
        targetY = 65; // Grok perches high up at the top
        weakPoints.push(
          { id: 'wp_cursor_l', xOffset: -52, yOffset: 0, radius: 18, hp: 30, maxHp: 30, active: true, label: '{CURSOR}' },
          { id: 'wp_cursor_r', xOffset: 52, yOffset: 0, radius: 18, hp: 30, maxHp: 30, active: true, label: '{CURSOR}' },
          { id: 'wp_grok_engine', xOffset: 0, yOffset: 0, radius: 26, hp: 50, maxHp: 50, active: true, label: 'GROK' }
        );
        break;

      case 'STAGE3_CLAUDE_FABLE':
        stageTitle = 'ザ・ファブル';
        dialogueQuote = 'ファブル—— お前らが勝手にそう呼んでるだけだ—— 俺は、ただコーディングするだけの——プロだ！';
        name = 'CLAUDE FABLE : APEX CODE PRO';
        width = 160;
        height = 100;
        hp = 150;
        targetY = 90;
        weakPoints.push(
          { id: 'wp_sonnet_l', xOffset: -50, yOffset: -15, radius: 18, hp: 25, maxHp: 25, active: true, label: 'SONNET' },
          { id: 'wp_sonnet_r', xOffset: 50, yOffset: -15, radius: 18, hp: 25, maxHp: 25, active: true, label: 'SONNET' },
          { id: 'wp_opus_ring', xOffset: 0, yOffset: 32, radius: 22, hp: 35, maxHp: 35, active: true, label: 'OPUS' },
          { id: 'wp_fable_core', xOffset: 0, yOffset: -5, radius: 28, hp: 90, maxHp: 90, active: true, label: 'FABLE' }
        );
        break;

      case 'STAGE4_GPT6_ASTRA':
        stageTitle = '魔法使いチャッピー';
        dialogueQuote = 'アブラマハリクマハリタカブラ！';
        name = 'GPT-6 ASTRA : WIZARD CHAPPY';
        width = 200;
        height = 110;
        hp = 200;
        targetY = 95;
        weakPoints.push(
          { id: 'wp_luna', xOffset: -65, yOffset: -25, radius: 20, hp: 30, maxHp: 30, active: true, label: 'LUNA' },
          { id: 'wp_terra', xOffset: 65, yOffset: -25, radius: 22, hp: 40, maxHp: 40, active: true, label: 'TERRA' },
          { id: 'wp_sol', xOffset: 0, yOffset: 35, radius: 24, hp: 50, maxHp: 50, active: true, label: 'SOL' },
          { id: 'wp_astra', xOffset: 0, yOffset: -5, radius: 30, hp: 100, maxHp: 100, active: true, label: 'ASTRA' }
        );
        break;
    }

    this.currentBoss = {
      type,
      name,
      stageTitle,
      dialogueQuote,
      quoteTimer: 240, // Show dialogue banner prominently for 4 seconds
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
    onSpawnRocketFleet?: () => void,
    onBossShout?: (quote: string) => void
  ): void {
    if (!this.currentBoss) return;
    const b = this.currentBoss;
    b.timer++;

    if (b.quoteTimer > 0) {
      b.quoteTimer--;
    }

    // Entrance flight
    if (b.y < b.targetY) {
      b.y += 0.55;
      return;
    }

    // --- STAGE 1: China Syndrome (サンダークラウド・フォーメーション！) ---
    if (b.type === 'STAGE1_DEEPSEEK_KIMI') {
      // 3-way coordinated attack formation
      // Cycle: 0-140: Hover triangle, 140-260: Synchronized 3-way tackle attack (体当たり)!
      const cycle = b.timer % 280;

      if (cycle < 140) {
        // Formation hover
        b.x = canvasWidth / 2 + Math.sin(b.timer * 0.02) * 60;
        b.y = b.targetY + Math.cos(b.timer * 0.025) * 15;

        // Individual weakpoint offsets in rotating triangle
        const angle = b.timer * 0.03;
        b.weakPoints[0].xOffset = Math.cos(angle) * 44;
        b.weakPoints[0].yOffset = Math.sin(angle) * 25;
        b.weakPoints[1].xOffset = Math.cos(angle + (Math.PI * 2) / 3) * 44;
        b.weakPoints[1].yOffset = Math.sin(angle + (Math.PI * 2) / 3) * 25;
        b.weakPoints[2].xOffset = Math.cos(angle + (Math.PI * 4) / 3) * 44;
        b.weakPoints[2].yOffset = Math.sin(angle + (Math.PI * 4) / 3) * 25;
      } else {
        // 体当たり攻撃！ (Tackle swoop toward player)
        const swoopProgress = (cycle - 140) / 140;
        const swoopAngle = swoopProgress * Math.PI;
        b.y = b.targetY + Math.sin(swoopAngle) * 140;
        b.x += (playerX - b.x) * 0.025;

        // Spread out during tackle
        b.weakPoints[0].xOffset = -55;
        b.weakPoints[1].xOffset = 55;
        b.weakPoints[2].xOffset = 0;
        b.weakPoints[2].yOffset = 20;

        if (cycle === 145 && onBossShout) {
          onBossShout('雷雲旋風拳！ サンダークラウド……フォーメーション！');
        }
      }

    // --- STAGE 2: Elon's Gate (スペース・エックス！) ---
    } else if (b.type === 'STAGE2_GROK_CURSOR') {
      // Grok sits majestically at the top
      b.x = canvasWidth / 2 + Math.sin(b.timer * 0.012) * 35;
      b.y = b.targetY + Math.cos(b.timer * 0.015) * 8;

      // Periodically shout "スペース・エックス！" and launch rocket fleet from bottom!
      if (b.timer % 240 === 60) {
        if (onBossShout) {
          onBossShout('スペース・エックス！');
        }
        b.quoteTimer = 160;
        if (onSpawnRocketFleet) {
          onSpawnRocketFleet();
        }
      }

    // --- STAGE 3: The Fable (プロだ！) ---
    } else if (b.type === 'STAGE3_CLAUDE_FABLE') {
      b.x = canvasWidth / 2 + Math.sin(b.timer * 0.016) * 70;
      b.y = b.targetY + Math.cos(b.timer * 0.02) * 20;

      // Occasional surgical sweep
      if (b.timer % 260 === 180 && onBossShout) {
        onBossShout('俺はプロだ！');
        b.quoteTimer = 140;
      }

    // --- STAGE 4: Wizard Chappy (アブラマハリクマハリタカブラ！) ---
    } else {
      b.x = canvasWidth / 2 + Math.sin(b.timer * 0.014) * 65;
      b.y = b.targetY + Math.cos(b.timer * 0.018) * 16;

      if (b.timer % 260 === 80 && onBossShout) {
        onBossShout('アブラマハリクマハリタカブラ！');
        b.quoteTimer = 160;
      }
    }

    // Very rare, deliberate slow bullet firing from active core only
    if (onSpawnBullet && b.timer % 200 === 0) {
      const bdx = playerX - b.x;
      const bdy = playerY - b.y;
      const dist = Math.hypot(bdx, bdy) || 1;
      onSpawnBullet(b.x, b.y + 20, (bdx / dist) * 0.60, (bdy / dist) * 0.60);
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

      if (dist < wp.radius + 14) {
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
