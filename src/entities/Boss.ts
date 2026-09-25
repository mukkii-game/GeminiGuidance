import { BossEntity, BossType, WeakPoint } from '../types';

export class BossManager {
  public currentBoss: BossEntity | null = null;

  public spawn(type: BossType, canvasWidth: number): BossEntity {
    let name = '';
    let width = 120;
    let height = 80;
    let hp = 70;
    const weakPoints: WeakPoint[] = [];

    switch (type) {
      case 'STAGE1_DEEPSEEK_KIMI':
        name = 'DEEPSEEK V4.1 & KIMI MOONSHOT CORE';
        width = 130;
        height = 80;
        hp = 80;
        weakPoints.push(
          { id: 'wp_ds', xOffset: -38, yOffset: 0, radius: 18, hp: 25, maxHp: 25, active: true, label: 'DEEPSEEK' },
          { id: 'wp_kimi', xOffset: 38, yOffset: 0, radius: 18, hp: 25, maxHp: 25, active: true, label: 'KIMI' },
          { id: 'wp_core', xOffset: 0, yOffset: 8, radius: 16, hp: 30, maxHp: 30, active: true, label: 'QWEN CORE' }
        );
        break;

      case 'STAGE2_GROK_CURSOR':
        name = 'GROK 4.7 & CURSOR DREADNOUGHT';
        width = 150;
        height = 90;
        hp = 110;
        weakPoints.push(
          { id: 'wp_cursor_l', xOffset: -50, yOffset: -5, radius: 16, hp: 30, maxHp: 30, active: true, label: '{CURSOR}' },
          { id: 'wp_cursor_r', xOffset: 50, yOffset: -5, radius: 16, hp: 30, maxHp: 30, active: true, label: '{CURSOR}' },
          { id: 'wp_grok_engine', xOffset: 0, yOffset: 12, radius: 22, hp: 50, maxHp: 50, active: true, label: 'GROK CORE' }
        );
        break;

      case 'STAGE3_CLAUDE_FABLE':
        name = 'CLAUDE FABLE : APEX OCTAGON FORTRESS';
        width = 160;
        height = 110;
        hp = 160;
        weakPoints.push(
          { id: 'wp_sonnet_l', xOffset: -45, yOffset: -20, radius: 15, hp: 25, maxHp: 25, active: true, label: 'SONNET' },
          { id: 'wp_sonnet_r', xOffset: 45, yOffset: -20, radius: 15, hp: 25, maxHp: 25, active: true, label: 'SONNET' },
          { id: 'wp_opus_ring', xOffset: 0, yOffset: 35, radius: 18, hp: 35, maxHp: 35, active: true, label: 'OPUS' },
          { id: 'wp_fable_core', xOffset: 0, yOffset: 0, radius: 26, hp: 95, maxHp: 95, active: true, label: 'FABLE APEX' }
        );
        break;

      case 'STAGE4_GPT6_ASTRA':
        name = 'GPT-6 ASTRA : ANDOR GENESIS';
        width = 220;
        height = 130;
        hp = 220;
        weakPoints.push(
          { id: 'wp_luna', xOffset: -65, yOffset: -30, radius: 16, hp: 25, maxHp: 25, active: true, label: 'LUNA DOCK' },
          { id: 'wp_terra', xOffset: 65, yOffset: -30, radius: 18, hp: 35, maxHp: 35, active: true, label: 'TERRA BAY' },
          { id: 'wp_sol', xOffset: 0, yOffset: 40, radius: 20, hp: 45, maxHp: 45, active: true, label: 'SOL HANGAR' },
          { id: 'wp_astra', xOffset: 0, yOffset: 0, radius: 28, hp: 115, maxHp: 115, active: true, label: 'ASTRA CORE' }
        );
        break;
    }

    this.currentBoss = {
      type,
      name,
      x: canvasWidth / 2,
      y: -height,
      targetY: 90,
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

  public update(
    canvasWidth: number,
    onSpawnBullet?: (x: number, y: number, vx: number, vy: number) => void
  ): void {
    if (!this.currentBoss) return;
    const b = this.currentBoss;
    b.timer++;

    // Entrance flight
    if (b.y < b.targetY) {
      b.y += 1.2;
    } else {
      // Hover oscillation & tactical maneuvers
      b.x = canvasWidth / 2 + Math.sin(b.timer * 0.03) * 60;
      b.y = b.targetY + Math.cos(b.timer * 0.04) * 15;

      // Boss projectile fire: emits small mini-clone drones destructible by Gemini
      if (onSpawnBullet && b.timer % 70 === 0) {
        // Fire mini-clones from active weak points
        for (const wp of b.weakPoints) {
          if (wp.active) {
            const bx = b.x + wp.xOffset;
            const by = b.y + wp.yOffset;
            const spread = (Math.random() - 0.5) * 1.5;
            onSpawnBullet(bx, by, spread, 2.2);
          }
        }
      }
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

    // General boss hull hit
    if (!hitSomething) {
      const distToCenter = Math.hypot(hitX - b.x, hitY - b.y);
      if (distToCenter < b.width * 0.45) {
        hitSomething = true;
        b.hp -= Math.max(1, Math.floor(damage * 0.5));
        points += 50 * damage;
      }
    }

    if (b.hp <= 0) {
      b.hp = 0;
      b.defeated = true;
      points += 10000;
      return { bossHit: true, defeated: true, points };
    }

    return { bossHit: hitSomething, defeated: false, points };
  }

  public clear(): void {
    this.currentBoss = null;
  }
}
