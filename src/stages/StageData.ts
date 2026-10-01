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
    const group = (second: number, enemyType: EnemyType, pattern: MovementPattern, positions: number[], stagger = 24, sharedFormation?: string) => {
      const wave = Math.floor((second - 3) / 10) + 1;
      const formationId = sharedFormation ?? `s${stage}_wave${wave}_group${++formation}`;
      positions.forEach((x, index) => events.push({ tick: second * 60 + index * stagger, type: 'ENEMY', enemyType, pattern, formationId, wave, x, y: -32 }));
    };
    const ground: GroundType[] = ['NVIDIA_BASE', 'META_BASE', 'HUGGINGFACE_BASE', 'SOL_CITADEL', 'STABILITY_BASE'];
    for (let second = 3; second < 48 + stage * 4; second += 7) {
      events.push({ tick: second * 60, type: 'GROUND', groundType: ground[(second + stage) % ground.length], x: 65 + ((second * 37) % 230) });
    }

    const light: EnemyType[] = ['MISTRAL_FLAME', 'COPILOT_GLIDER', 'CLAUDE_HAIKU', 'GPT6_LUNA'];
    const heavy: EnemyType[] = ['QWEN_CUBE', 'GROK_RAIDER', 'CLAUDE_OPUS', 'GPT6_SOL'];
    const sniper: EnemyType[] = ['KIMI_MOON', 'CURSOR_PROBE', 'PERPLEXITY_SPINNER', 'GPT6_TERRA'];
    const rank = Math.max(0, Math.min(3, stage - 1));
    const rows = (second: number, pattern: MovementPattern) => {
      const formationId = `s${stage}_wave${Math.floor((second - 3) / 10) + 1}`;
      group(second, light[rank], pattern, [60, 120, 180, 240, 300], 0, formationId);
      group(second + 1, light[rank], pattern, [60, 120, 180, 240, 300], 0, formationId);
    };
    cue(1, 'WAVE 1 / 柔らかい編隊を大きな誘導でまとめて貫け');
    rows(3, 'STRAIGHT_DOWN');
    if (stage === 1) {
      cue(11, 'WAVE 2 / INVADER WALL — 列の奥まで貫け');
      events.push({tick:13*60,type:'INVADER_GRID',wave:2});
    } else {
      cue(11, 'WAVE 2 / 重装甲は直進  射撃の間に奥へ通せ');
      group(13, heavy[rank], 'SPAROID_CRUISE', [95, 265], 0);
      group(13, light[rank], 'GALAGA_LOOP', [55, 180, 305], 24);
    }
    cue(21, 'WAVE 3 / 停止した砲台は狙い撃ち  弾は捕獲で防げ');
    group(23, sniper[rank], 'SNIPER_HOVER', [75, 285], 0);
    rows(24, 'GALAGA_LOOP');
    group(23, sniper[rank], 'BARRAGE_DRIFT', [180]);
    cue(25, '弾幕波 / 長押しで防御 → 止んだら投擲');
    if (stage === 2) {
      events.push({ tick: 25 * 60, type: 'BREAKOUT_WALL' });
      cue(26, '左右から奥へ / 裏面3倍・天井で連続反射');
    }
    cue(31, 'WAVE 4 / 左右から下へ回り込む  中央で迎え撃て');
    group(33, light[rank], 'TOROID_SWOOP', [38, 322, 38, 322, 38, 322], 25);
    group(34, light[rank], 'RUSH_DIVE', [115, 245], 45);
    cue(41, 'WAVE 5 / 照準を引きつけ 横へかわして突き返せ');
    rows(43, 'RUSH_DIVE');
    if (stage >= 3) {
      cue(51, 'FINAL WAVE / 重巡の射線を抜けて背面を狙え');
      group(53, heavy[rank], 'SPAROID_CRUISE', [95, 265], 0);
      group(53, light[rank], 'ZOSHI_REACTIVE_SWOOP', [40, 320, 40, 320], 25);
    }
    for (const second of [8, 18, 28, 38, 48, ...(stage >= 3 ? [58] : [])]) {
      cue(second, 'RELOAD / 残敵をかわし 次の編隊に備えろ');
    }
    const bossSecond = 50 + stage * 4;
    const bosses: BossType[] = ['STAGE1_DEEPSEEK_KIMI', 'STAGE2_GROK_CURSOR', 'STAGE3_CLAUDE_FABLE', 'STAGE4_GPT6_ASTRA'];
    events.push({ tick: (bossSecond - 2) * 60, type: 'ALERT' });
    events.push({ tick: bossSecond * 60, type: 'BOSS', bossType: bosses[stage - 1] ?? bosses[3] });
    if (stage === 1) for (const event of events) if (event.tick >= 18 * 60) event.tick += 10 * 60;
    return events.sort((a, b) => a.tick - b.tick);
  }
}
