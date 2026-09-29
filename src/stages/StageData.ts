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
    let wave = 0;
    const cue = (second: number, message: string) => events.push({ tick: second * 60, type: 'CUE', message });
    const group = (second: number, enemyType: EnemyType, pattern: MovementPattern, positions: number[], stagger = 24) => {
      const formationId = `s${stage}_wave${++wave}`;
      positions.forEach((x, index) => events.push({ tick: second * 60 + index * stagger, type: 'ENEMY', enemyType, pattern, formationId, x, y: -32 }));
    };
    const ground: GroundType[] = ['NVIDIA_BASE', 'META_BASE', 'HUGGINGFACE_BASE', 'SOL_CITADEL', 'STABILITY_BASE'];
    for (let second = 3; second < 48 + stage * 4; second += 7) {
      events.push({ tick: second * 60, type: 'GROUND', groundType: ground[(second + stage) % ground.length], x: 65 + ((second * 37) % 230) });
    }

    if (stage === 1) {
      cue(1, '離して誘導 → 自機を抜ける突きで狙え');
      group(4, 'MISTRAL_FLAME', 'STRAIGHT_DOWN', [180, 180, 180], 38);
      group(9, 'DEEPSEEK_FLASH', 'STRAIGHT_DOWN', [85, 275], 0);
      cue(13, '赤い照準を引きつけて  横へかわす');
      group(14, 'KIMI_MOON', 'RUSH_DIVE', [100, 260], 65);
      group(20, 'MISTRAL_FLAME', 'GALAGA_LOOP', [85, 145, 215, 275]);
      cue(25, '長押しで捕獲・回転 / 離して投げる');
      group(26, 'DEEPSEEK_FLASH', 'STRAIGHT_DOWN', [90, 180, 270], 0);
      group(31, 'KIMI_MOON', 'RUSH_DIVE', [70, 290], 75);
      group(36, 'MISTRAL_FLAME', 'STRAIGHT_DOWN', [120, 120, 240, 240], 32);
      events.push({ tick: 40 * 60, type: 'UFO' });
      group(42, 'QWEN_CUBE', 'SPAROID_CRUISE', [180]);
      group(45, 'DEEPSEEK_FLASH', 'RUSH_DIVE', [70, 290], 60);
      cue(49, 'ボスの攻撃後がチャンス  突き・投擲を当てよう');
    } else if (stage === 2) {
      cue(1, '反射する装甲を使い  奥へジェミニを通せ');
      group(4, 'COPILOT_GLIDER', 'STRAIGHT_DOWN', [80, 180, 280], 0);
      group(9, 'CURSOR_PROBE', 'RUSH_DIVE', [90, 270], 60);
      group(14, 'GROK_RAIDER', 'SPAROID_CRUISE', [100, 260], 0);
      group(19, 'COPILOT_GLIDER', 'GALAGA_LOOP', [80, 140, 220, 280]);
      cue(24, '壁反射は Q で任意ON / 中央の隙間も使える');
      events.push({ tick: 25 * 60, type: 'BREAKOUT_WALL' });
      group(28, 'CURSOR_PROBE', 'RUSH_DIVE', [70, 290], 70);
      group(34, 'COPILOT_GLIDER', 'STRAIGHT_DOWN', [180, 180, 180], 32);
      group(39, 'GROK_RAIDER', 'SPAROID_CRUISE', [95, 265], 0);
      group(44, 'CURSOR_PROBE', 'RUSH_DIVE', [80, 180, 280], 50);
      group(49, 'COPILOT_GLIDER', 'GALAGA_LOOP', [110, 250]);
      cue(53, 'ゲートの内側へ投擲  反射は補助として使おう');
    } else if (stage === 3) {
      cue(1, '交差する敵列  引きつける位置を選べ');
      group(4, 'CLAUDE_HAIKU', 'GALAGA_LOOP', [75, 135, 225, 285]);
      group(10, 'CLAUDE_SONNET', 'RUSH_DIVE', [90, 270], 75);
      group(16, 'PERPLEXITY_SPINNER', 'SNIPER_HOVER', [90, 270], 0);
      group(22, 'CLAUDE_HAIKU', 'STRAIGHT_DOWN', [160, 200, 160, 200], 32);
      cue(27, '回転は守り / 強い一撃は離して作る');
      group(28, 'CLAUDE_OPUS', 'SPAROID_CRUISE', [180]);
      group(29, 'CLAUDE_HAIKU', 'RUSH_DIVE', [65, 295], 75);
      group(36, 'PERPLEXITY_SPINNER', 'GALAGA_LOOP', [75, 145, 215, 285]);
      group(42, 'CLAUDE_SONNET', 'RUSH_DIVE', [90, 180, 270], 60);
      group(48, 'CLAUDE_OPUS', 'SPAROID_CRUISE', [105, 255], 0);
      group(52, 'CLAUDE_HAIKU', 'RUSH_DIVE', [70, 290], 60);
      cue(57, '追撃をかわし  休止したコアを狙え');
    } else {
      cue(1, '最終防衛線  誘導・捕獲・投擲をつなげ');
      group(4, 'GPT6_LUNA', 'STRAIGHT_DOWN', [90, 180, 270], 0);
      group(9, 'GPT6_LUNA', 'RUSH_DIVE', [70, 180, 290], 60);
      group(16, 'GPT6_TERRA', 'BARRAGE_DRIFT', [90, 270], 0);
      group(23, 'GPT6_LUNA', 'GALAGA_LOOP', [75, 135, 225, 285]);
      group(29, 'GPT6_SOL', 'SPAROID_CRUISE', [180]);
      group(30, 'GPT6_LUNA', 'RUSH_DIVE', [70, 290], 65);
      cue(36, '狙いを固定させてから移動  空いた道へ投げろ');
      group(37, 'GPT6_TERRA', 'RUSH_DIVE', [85, 275], 80);
      group(43, 'GPT6_LUNA', 'STRAIGHT_DOWN', [120, 120, 240, 240], 28);
      group(48, 'GPT6_SOL', 'SPAROID_CRUISE', [105, 255], 0);
      group(53, 'GPT6_LUNA', 'RUSH_DIVE', [70, 180, 290], 60);
      cue(60, '最後の決闘  攻撃の合間に大きく突け');
    }
    const bossSecond = 50 + stage * 4;
    const bosses: BossType[] = ['STAGE1_DEEPSEEK_KIMI', 'STAGE2_GROK_CURSOR', 'STAGE3_CLAUDE_FABLE', 'STAGE4_GPT6_ASTRA'];
    events.push({ tick: (bossSecond - 2) * 60, type: 'ALERT' });
    events.push({ tick: bossSecond * 60, type: 'BOSS', bossType: bosses[stage - 1] ?? bosses[3] });
    return events.sort((a, b) => a.tick - b.tick);
  }
}
