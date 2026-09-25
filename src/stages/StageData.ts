import { EnemyType, GroundType, BossType, MovementPattern } from '../types';

export interface SpawnEvent {
  tick: number;
  type: 'ENEMY' | 'GROUND' | 'BOSS' | 'ALERT' | 'INVADER_GRID' | 'UFO' | 'BREAKOUT_WALL';
  enemyType?: EnemyType;
  groundType?: GroundType;
  bossType?: BossType;
  formationId?: string;
  x?: number;
  y?: number;
  pattern?: MovementPattern;
}

export class StageManager {
  public currentStage: number = 1;
  public stageTick: number = 0;
  public bossActive: boolean = false;
  public stageCleared: boolean = false;

  private events: SpawnEvent[] = [];

  constructor() {
    this.loadStage(1);
  }

  public getStageTitle(stage: number): string {
    switch (stage) {
      case 1: return 'チャイナ・シンドローム';
      case 2: return 'イーロンズ・ゲート';
      case 3: return 'ザ・ファブル';
      case 4: return '魔法使いチャッピー';
      default: return `STAGE ${stage}`;
    }
  }

  public getStageDisplayName(stage: number): string {
    switch (stage) {
      case 1: return 'STAGE 1: チャイナ・シンドローム';
      case 2: return 'STAGE 2: イーロンズ・ゲート';
      case 3: return 'STAGE 3: ザ・ファブル';
      case 4: return 'STAGE 4: 魔法使いチャッピー';
      default: return `STAGE ${stage}`;
    }
  }

  public loadStage(stage: number): void {
    this.currentStage = stage;
    this.stageTick = 0;
    this.bossActive = false;
    this.stageCleared = false;
    this.events = this.generateStageEvents(stage);
  }

  public update(): SpawnEvent[] {
    this.stageTick++;
    const ready = this.events.filter(e => e.tick === this.stageTick);
    return ready;
  }

  private generateStageEvents(stage: number): SpawnEvent[] {
    const events: SpawnEvent[] = [];
    let waveCounter = 0;

    const addGround = (tick: number, gtype: GroundType, x: number) => {
      events.push({ tick, type: 'GROUND', groundType: gtype, x });
    };

    const addWave = (tick: number, etype: EnemyType, pattern: MovementPattern, positions: number[]) => {
      const formationId = `wave_s${stage}_${++waveCounter}`;
      positions.forEach((x, idx) => {
        events.push({
          tick: tick + idx * 30,
          type: 'ENEMY',
          enemyType: etype,
          pattern,
          formationId,
          x,
          y: -30,
        });
      });
    };

    if (stage === 1) {
      // --- STAGE 1: インベーダークローン + ボス戦 ---
      // Ground decor
      addGround(20, 'NVIDIA_BASE', 80);
      addGround(120, 'HUGGINGFACE_BASE', 280);
      addGround(240, 'META_BASE', 180);
      addGround(380, 'SOL_CITADEL', 120);

      // 1. Spawn Space Invaders Grid at start! (Mistral "M" logos & Qwen)
      events.push({ tick: 25, type: 'INVADER_GRID' });

      // 2. DeepSeek Whale UFO Mystery Ships gliding across the top!
      events.push({ tick: 140, type: 'UFO' });
      events.push({ tick: 320, type: 'UFO' });
      events.push({ tick: 500, type: 'UFO' });
      events.push({ tick: 700, type: 'UFO' });
      // NOTE: Boss ONLY spawns after all 15 invaders are destroyed!
    } else if (stage === 2) {
      // --- STAGE 2: ブロック崩し (Arkanoid Wall & Boss Behind Blocks) ---
      // (Ticks 0-220: Stage intro with Polygon Elon Hologram Transmission)
      addGround(240, 'META_BASE', 180);
      addGround(340, 'SOL_CITADEL', 280);

      // Deploy Breakout Block Wall & Boss directly behind it!
      events.push({ tick: 220, type: 'BREAKOUT_WALL' });
      events.push({ tick: 230, type: 'BOSS', bossType: 'STAGE2_GROK_CURSOR' });

    } else if (stage === 3) {
      // --- STAGE 3: ザ・ファブル ---
      addGround(30, 'SOL_CITADEL', 180);
      addGround(110, 'NVIDIA_BASE', 280);
      addGround(190, 'META_BASE', 80);
      addGround(290, 'SOL_CITADEL', 140);

      // Wave 1: Claude Haiku agile Toroid swoops
      addWave(40, 'CLAUDE_HAIKU', 'TOROID_SWOOP', [70, 290]);

      // Wave 2: Perplexity Spinners Galaga loops
      addWave(140, 'PERPLEXITY_SPINNER', 'GALAGA_LOOP', [100, 260]);

      // Wave 3: Claude Sonnet reactive tracking dive
      addWave(250, 'CLAUDE_SONNET', 'TORKAN_TRACK_DASH', [180]);

      addGround(400, 'HUGGINGFACE_BASE', 220);
      addGround(480, 'SOL_CITADEL', 290);

      // Wave 4: Claude Opus heavy cruiser & Haiku escorts
      addWave(460, 'CLAUDE_OPUS', 'SPAROID_CRUISE', [180]);
      addWave(530, 'CLAUDE_HAIKU', 'ZOSHI_REACTIVE_SWOOP', [60, 300]);

      // Boss Alert & Spawn: The Fable (プロだ！)
      events.push({ tick: 650, type: 'ALERT' });
      events.push({ tick: 690, type: 'BOSS', bossType: 'STAGE3_CLAUDE_FABLE' });

    } else {
      // --- STAGE 4: 魔法使いチャッピー (OpenAI GPT-6 Fleet) ---
      addGround(30, 'NVIDIA_BASE', 180);
      addGround(90, 'META_BASE', 90);
      addGround(170, 'SOL_CITADEL', 270);
      addGround(250, 'STABILITY_BASE', 120);

      // Wave 1: GPT-6 Luna Toroid swoops
      addWave(30, 'GPT6_LUNA', 'TOROID_SWOOP', [80, 280]);

      // Wave 2: GPT-6 Luna Torkan track-dash
      addWave(130, 'GPT6_LUNA', 'TORKAN_TRACK_DASH', [110, 250]);

      // Wave 3: GPT-6 Terra heavy cruiser
      addWave(240, 'GPT6_TERRA', 'SPAROID_CRUISE', [180]);

      addGround(380, 'SOL_CITADEL', 180);
      addGround(460, 'HUGGINGFACE_BASE', 280);

      // Wave 4: GPT-6 Sol & Luna escorts
      addWave(450, 'GPT6_SOL', 'TORKAN_TRACK_DASH', [180]);
      addWave(520, 'GPT6_LUNA', 'ZOSHI_REACTIVE_SWOOP', [70, 290]);

      // Final Boss Alert & Spawn: 魔法使いチャッピー (アブラマハリクマハリタカブラ！)
      events.push({ tick: 650, type: 'ALERT' });
      events.push({ tick: 690, type: 'BOSS', bossType: 'STAGE4_GPT6_ASTRA' });
    }

    return events;
  }
}
