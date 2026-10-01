import { EnemyType, GroundType, BossType, MovementPattern } from '../types';

export interface SpawnEvent {
  tick: number;
  type: 'ENEMY' | 'GROUND' | 'BOSS' | 'ALERT' | 'INVADER_GRID' | 'UFO' | 'BREAKOUT_WALL' | 'CUE';
  enemyType?: EnemyType;
  groundType?: GroundType;
  bossType?: BossType;
  formationId?: string;
  x?: number;
  y?: number;
  pattern?: MovementPattern;
  message?: string;
  subtitle?: string;
  wave?: number;
}

/** Fixed 60 Hz campaign: introduce, combine, then test each skill. */
export class StageManager {
  public currentStage = 1;
  public stageTick = 0;
  public bossActive = false;
  public stageCleared = false;
  private events: SpawnEvent[] = [];

  constructor() { this.loadStage(1); }

  public getStageTitle(stage: number): string {
    return ['チャイナ・シンドローム', 'イーロンズ・ゲート', 'ザ・ファブル', '魔法使いチャッピー'][stage - 1] ?? `STAGE ${stage}`;
  }
  public getStageDisplayName(stage: number): string {
    return `STAGE ${stage}: ${this.getStageTitle(stage)}`;
  }
  public loadStage(stage: number): void {
    this.currentStage = stage;
    this.stageTick = 0;
    this.bossActive = false;
    this.stageCleared = false;
    this.events = this.generateStageEvents(stage);
  }
  public hasPendingFormation(id: string): boolean {
    return this.events.some(event => event.formationId === id && event.tick > this.stageTick);
  }
  public update(): SpawnEvent[] {
    this.stageTick++;
    return this.events.filter(event => event.tick === this.stageTick);
  }

  private generateStageEvents(stage: number): SpawnEvent[] {
    const events: SpawnEvent[] = [];
    let formation = 0;
    const cue = (second: number, message: string) => events.push({ tick: second * 60, type: 'CUE', message });
    const group = (second: number, enemyType: EnemyType, pattern: MovementPattern, positions: number[], stagger = 24, sharedFormation?: string, title?: string, subtitle?: string) => {
      const wave = Math.floor((second - 3) / 10) + 1;
      const formationId = sharedFormation ?? `s${stage}_wave${wave}_group${++formation}`;
      positions.forEach((x, index) => events.push({ tick: second * 60 + index * stagger, type: 'ENEMY', enemyType, pattern, formationId, wave, x, y: -32, message: title, subtitle }));
    };
    const ground: GroundType[] = ['NVIDIA_BASE', 'META_BASE', 'HUGGINGFACE_BASE', 'SOL_CITADEL', 'STABILITY_BASE'];
    for (let second = 3; second < 48 + stage * 4; second += 7) {
      events.push({ tick: second * 60, type: 'GROUND', groundType: ground[(second + stage) % ground.length], x: 65 + ((second * 37) % 230) });
    }

    const light: EnemyType[] = ['MISTRAL_FLAME', 'COPILOT_GLIDER', 'CLAUDE_HAIKU', 'GPT6_LUNA'];
    const heavy: EnemyType[] = ['QWEN_CUBE', 'GROK_RAIDER', 'CLAUDE_OPUS', 'GPT6_SOL'];
    const sniper: EnemyType[] = ['KIMI_MOON', 'CURSOR_PROBE', 'PERPLEXITY_SPINNER', 'GPT6_TERRA'];
    const rank = Math.max(0, Math.min(3, stage - 1));
    // Reusable set pieces. Each formation has one reward identity so a partial
    // clear cannot grant the shield bonus before the second rank arrives.
    const spear = (second: number, wave: number) => {
      const id = `s${stage}_spear_${wave}`;
      // Two slowly descending columns: pass the free orb through a whole rank.
      for (let row = 0; row < 5; row++) {
        for (const x of [112, 248]) events.push({ tick: second * 60 + row * 12, type: 'ENEMY', enemyType: light[rank], pattern: 'STRAIGHT_DOWN', formationId: id, wave, x, y: -32, message: 'SPEAR LINE', subtitle: '縦に誘導して列を貫く' });
      }
    };
    const sweep = (second: number, wave: number, curved = false) => {
      const id = `s${stage}_sweep_${wave}`;
      group(second, light[rank], curved ? 'GALAGA_LOOP' : 'STRAIGHT_DOWN', [48, 100, 152, 204, 256, 308], 0, id, 'SWEEP LINE', '横に振って列を薙ぐ');
      group(second + 1, light[rank], curved ? 'GALAGA_LOOP' : 'STRAIGHT_DOWN', [74, 126, 178, 230, 282], 0, id);
    };
    const matador = (second: number, wave: number) => {
      const id = `s${stage}_matador_${wave}`;
      group(second, light[rank], 'RUSH_DIVE', [58, 110, 180, 250, 302], 10, id, 'MATADOR', '照準を引きつけ 横へかわす');
      group(second + 2, light[rank], 'RUSH_DIVE', [86, 145, 215, 274], 10, id);
    };
    const press = (second: number, wave: number) => {
      const id = `s${stage}_press_${wave}`;
      group(second, heavy[rank], 'SHIELD_FORWARD', [100, 260], 0, id, 'PRESS & SPEAR', '捕獲で押して 整列したら解放');
      group(second + 1, light[rank], 'STRAIGHT_DOWN', [75, 125, 235, 285], 0, id);
      group(second + 2, light[rank], 'STRAIGHT_DOWN', [75, 125, 235, 285], 0, id);
    };
    const curtain = (second: number, wave: number) => {
      const id = `s${stage}_curtain_${wave}`;
      group(second, sniper[rank], 'BARRAGE_DRIFT', [180], 0, id, 'BULLET CURTAIN', '回転で弾を消す  薄い側から反撃');
      group(second + 1, sniper[rank], 'SNIPER_HOVER', [72, 288], 0, id);
      group(second + 2, light[rank], 'GALAGA_LOOP', [55, 110, 250, 305], 12, id);
    };

    cue(1, 'WAVE 1 / 縦の列を一気に貫け');
    spear(3, 1);
    if (stage === 1) {
      cue(11, 'WAVE 2 / 横薙ぎで道を開け');
      sweep(13, 2);
      // The iconic invader bank enters during the sweep; the free orb has
      // enough targets for a skilled player to continue the same arc.
      events.push({ tick: 15 * 60, type: 'INVADER_GRID', wave: 2 });
      cue(21, 'WAVE 3 / 敵の突進をかわし ジェミニを通せ');
      matador(23, 3);
      cue(31, 'WAVE 4 / 捕獲してタックルを押し返せ');
      press(33, 4);
      cue(41, 'WAVE 5 / 弾幕を回転で防ぎ 止んだら解放');
      curtain(43, 5);
    } else if (stage === 2) {
      cue(11, 'WAVE 2 / 横薙ぎから奥へ差し込め');
      sweep(13, 2, true);
      cue(21, 'WAVE 3 / 押し分けてから貫け');
      press(23, 3);
      events.push({ tick: 25 * 60, type: 'BREAKOUT_WALL' });
      cue(26, '側面から奥へ / 裏面3倍  反射で連続撃破');
      cue(31, 'WAVE 4 / 狙わせて横へ 追ってくる球で刺せ');
      matador(33, 4);
      cue(41, 'WAVE 5 / 弾幕の薄い側で反撃');
      curtain(43, 5);
    } else if (stage === 3) {
      cue(11, 'WAVE 2 / 曲がる列を横から薙げ');
      sweep(13, 2, true);
      cue(21, 'WAVE 3 / 弾幕の中を押し進め');
      curtain(23, 3);
      cue(31, 'WAVE 4 / 包囲を押し分けて射線を作れ');
      press(33, 4);
      group(34, light[rank], 'TOROID_SWOOP', [38, 322, 38, 322], 20);
      cue(41, 'WAVE 5 / 引きつけて回避 返す球で縦突き');
      matador(43, 5);
      cue(51, 'FINAL WAVE / 複合編隊を一息で崩せ');
      spear(53, 6);
      group(54, heavy[rank], 'SPAROID_CRUISE', [180], 0);
    } else {
      cue(11, 'WAVE 2 / 重巡をかわして列を貫け');
      spear(13, 2);
      group(14, heavy[rank], 'SPAROID_CRUISE', [180], 0);
      cue(21, 'WAVE 3 / 弾幕と突進 位置取りで抜けろ');
      curtain(23, 3);
      group(24, light[rank], 'RUSH_DIVE', [90, 270], 25);
      cue(31, 'WAVE 4 / 包囲を押し分けて横薙ぎ');
      press(33, 4);
      sweep(35, 4, true);
      cue(41, 'WAVE 5 / 闘牛士のように狙わせろ');
      matador(43, 5);
      group(44, light[rank], 'TOROID_SWOOP', [38, 322, 38, 322], 20);
      cue(51, 'FINAL WAVE / 縦 横 防御をつなげ');
      curtain(53, 6);
      spear(56, 6);
    }
    for (const second of [8, 18, 28, 38, 48, ...(stage >= 3 ? [58] : [])]) {
      cue(second, 'RELOAD / 残敵をかわし 次の編隊に備えろ');
    }
    const bossSecond = 50 + stage * 4;
    const bosses: BossType[] = ['STAGE1_DEEPSEEK_KIMI', 'STAGE2_GROK_CURSOR', 'STAGE3_CLAUDE_FABLE', 'STAGE4_GPT6_ASTRA'];
    events.push({ tick: (bossSecond - 2) * 60, type: 'ALERT' });
    events.push({ tick: bossSecond * 60, type: 'BOSS', bossType: bosses[stage - 1] ?? bosses[3] });
    return events.sort((a, b) => a.tick - b.tick);
  }
}
