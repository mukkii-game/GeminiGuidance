import { GroundEntity, GroundType } from '../types';

export class GroundTargetManager {
  public targets: GroundEntity[] = [];
  private targetCounter: number = 0;

  public spawn(
    type: GroundType,
    x: number,
    worldY: number,
    customHp?: number
  ): GroundEntity {
    let width = 32;
    let height = 32;
    let hp = 1;
    let points = 500;
    const revealed = type !== 'SOL_CITADEL'; // Sol citadels start hidden

    switch (type) {
      case 'BARROW':
        width = 32; height = 32; hp = 1; points = 600; break;
      case 'SOL_CITADEL':
        width = 32; height = 32; hp = 2; points = 2000; break;
      case 'SERVER_RACK':
        width = 28; height = 28; hp = 1; points = 400; break;
      case 'AI_CHIP':
        width = 28; height = 28; hp = 1; points = 800; break;
    }

    if (customHp !== undefined) hp = customHp;

    const target: GroundEntity = {
      id: `ground_${++this.targetCounter}`,
      type,
      x,
      worldY,
      width,
      height,
      hp,
      maxHp: hp,
      points,
      revealed,
      destroyed: false,
    };

    this.targets.push(target);
    return target;
  }

  public update(scrollY: number, sightX: number, sightY: number): void {
    for (const g of this.targets) {
      if (g.destroyed) continue;

      const screenY = g.worldY + scrollY;

      // Sol Citadel hidden reveal check: if sight is near it, reveal!
      if (!g.revealed && g.type === 'SOL_CITADEL') {
        const dist = Math.hypot(sightX - g.x, sightY - screenY);
        if (dist < 42) {
          g.revealed = true;
        }
      }
    }
  }

  public getVisibleTargets(scrollY: number, screenHeight: number): Array<{ entity: GroundEntity; screenY: number }> {
    const list: Array<{ entity: GroundEntity; screenY: number }> = [];
    for (const g of this.targets) {
      if (g.destroyed) continue;
      const screenY = g.worldY + scrollY;
      if (screenY > -50 && screenY < screenHeight + 50) {
        list.push({ entity: g, screenY });
      }
    }
    return list;
  }

  public checkBombHit(bombX: number, bombY: number, scrollY: number): GroundEntity | null {
    for (const g of this.targets) {
      if (g.destroyed || !g.revealed) continue;
      const screenY = g.worldY + scrollY;
      const dist = Math.hypot(bombX - g.x, bombY - screenY);
      if (dist < g.width * 0.65) {
        g.hp--;
        if (g.hp <= 0) {
          g.destroyed = true;
          return g;
        }
      }
    }
    return null;
  }

  public clear(): void {
    this.targets = [];
  }
}
