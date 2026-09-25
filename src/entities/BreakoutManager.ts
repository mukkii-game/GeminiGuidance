import { BreakoutBlock, GeminiOrb } from '../types';

export class BreakoutManager {
  public blocks: BreakoutBlock[] = [];
  private blockCounter: number = 0;

  public setupStage2Wall(canvasWidth: number): void {
    this.blocks = [];
    const cols = 8;
    const rows = 4;
    const blockWidth = 38;
    const blockHeight = 13;
    const gapX = 4;
    const gapY = 4;

    const totalWidth = cols * blockWidth + (cols - 1) * gapX;
    const startX = (canvasWidth - totalWidth) / 2 + blockWidth / 2;
    const startY = 125;

    const rowColors = [
      { color: '#ef4444', points: 100, hp: 1 }, // Top Row: Red
      { color: '#f97316', points: 80, hp: 1 },  // Row 2: Orange
      { color: '#22c55e', points: 60, hp: 1 },  // Row 3: Green
      { color: '#06b6d4', points: 50, hp: 1 },  // Bottom Row: Cyan
    ];

    for (let r = 0; r < rows; r++) {
      const cfg = rowColors[r];
      const y = startY + r * (blockHeight + gapY);

      for (let c = 0; c < cols; c++) {
        const x = startX + c * (blockWidth + gapX);
        this.blocks.push({
          id: `block_${++this.blockCounter}`,
          x,
          y,
          width: blockWidth,
          height: blockHeight,
          hp: cfg.hp,
          maxHp: cfg.hp,
          color: cfg.color,
          points: cfg.points,
          active: true,
        });
      }
    }
  }

  public clear(): void {
    this.blocks = [];
  }

  public getActiveCount(): number {
    return this.blocks.filter(b => b.active).length;
  }

  /**
   * Check collision between a Gemini orb and active blocks.
   * If collision occurs, Gemini bounces off with true arcade Breakout reflection!
   */
  public checkGeminiCollision(orb: GeminiOrb): {
    hit: boolean;
    block: BreakoutBlock | null;
    broken: boolean;
    points: number;
    hitX: number;
    hitY: number;
  } {
    for (const b of this.blocks) {
      if (!b.active) continue;

      const halfW = b.width / 2;
      const halfH = b.height / 2;

      // Find closest point on block to orb center
      const closestX = Math.max(b.x - halfW, Math.min(orb.x, b.x + halfW));
      const closestY = Math.max(b.y - halfH, Math.min(orb.y, b.y + halfH));

      const dx = orb.x - closestX;
      const dy = orb.y - closestY;
      const distSq = dx * dx + dy * dy;

      if (distSq < orb.radius * orb.radius) {
        b.hp -= orb.damage;
        const broken = b.hp <= 0;
        if (broken) {
          b.active = false;
        }

        return {
          hit: true,
          block: b,
          broken,
          points: b.points,
          hitX: closestX,
          hitY: closestY,
        };
      }
    }

    return { hit: false, block: null, broken: false, points: 0, hitX: 0, hitY: 0 };
  }
}
