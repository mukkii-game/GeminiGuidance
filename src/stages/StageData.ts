import { EnemyType, GroundType, BossType, MovementPattern } from '../types';

export interface SpawnEvent {
  tick: number;
  type: 'ENEMY' | 'GROUND' | 'BOSS' | 'ALERT';
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
      case 1: return '一面：チャイナ・シンドローム';
      case 2: return '２面：イーロンズ・ゲート';
      case 3: return '３面：ザ・ファブル';
      case 4: return '４面：魔法使いチャッピー';
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

    // Helper to spawn ground bases (Namco Xevious octagon bunkers)
    const addGround = (tick: number, gtype: GroundType, x: number) => {
      events.push({ tick, type: 'GROUND', groundType: gtype, x });
    };

    // Helper to spawn sparse, tactical enemy formations (Max 2-3 per wave, spaced across screen)
    // Each wave has a unique formationId so destroying all members spawns a Gemini logo drop!
    const addWave = (tick: number, etype: EnemyType, pattern: MovementPattern, positions: number[]) => {
      const formationId = `wave_s${stage}_${++waveCounter}`;
      positions.forEach((x, idx) => {
        events.push({
          tick: tick + idx * 30, // 30 frames apart so they never overlap
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
      // --- STAGE 1: チャイナ・シンドローム ---
      addGround(30, 'NVIDIA_BASE', 90);
      addGround(90, 'HUGGINGFACE_BASE', 270);
      addGround(170, 'META_BASE', 180);
      addGround(260, 'SOL_CITADEL', 120);
      addGround(360, 'NVIDIA_BASE', 280);

      // Wave 1: DeepSeek Toroid swoops (retreating loop)
      addWave(40, 'DEEPSEEK_FLASH', 'TOROID_SWOOP', [70, 290]);

      // Wave 2: Mistral Torkan reactive dash (tracks player X then dashes)
      addWave(140, 'MISTRAL_FLAME', 'TORKAN_TRACK_DASH', [120, 240]);

      // Wave 3: Qwen Cube Galaga loop
      addWave(240, 'QWEN_CUBE', 'GALAGA_LOOP', [80, 280]);

      // Wave 4: Kimi Moon Zoshi reactive intercept
      addWave(340, 'KIMI_MOON', 'ZOSHI_REACTIVE_SWOOP', [60, 300]);

      addGround(440, 'META_BASE', 100);
      addGround(500, 'SOL_CITADEL', 240);
      addGround(560, 'STABILITY_BASE', 180);

      // Wave 5: Coordinated DeepSeek & Mistral pincer
      addWave(480, 'DEEPSEEK_FLASH', 'TORKAN_TRACK_DASH', [90, 270]);
      addWave(570, 'MISTRAL_FLAME', 'TOROID_SWOOP', [180]);

      // Boss Alert & Spawn: China Syndrome (サンダークラウド・フォーメーション！)
      events.push({ tick: 660, type: 'ALERT' });
      events.push({ tick: 700, type: 'BOSS', bossType: 'STAGE1_DEEPSEEK_KIMI' });

    } else if (stage === 2) {
      // --- STAGE 2: イーロンズ・ゲート ---
      // (Ticks 0-220: Stage intro with Polygon Elon Hologram Transmission)
      addGround(230, 'META_BASE', 180);
      addGround(290, 'NVIDIA_BASE', 80);
      addGround(370, 'SOL_CITADEL', 290);
      addGround(450, 'STABILITY_BASE', 140);

      // Wave 1: Cursor Probes reactive intercept
      addWave(240, 'CURSOR_PROBE', 'ZOSHI_REACTIVE_SWOOP', [70, 290]);

      // Wave 2: Copilot Glider Galaga loops
      addWave(340, 'COPILOT_GLIDER', 'GALAGA_LOOP', [110, 250]);

      // Wave 3: Grok Raiders Torkan dash
      addWave(440, 'GROK_RAIDER', 'TORKAN_TRACK_DASH', [180]);

      addGround(530, 'HUGGINGFACE_BASE', 180);
      addGround(610, 'SOL_CITADEL', 90);

      // Wave 4: Cursor & Copilot mixed reactive sweep
      addWave(540, 'CURSOR_PROBE', 'TOROID_SWOOP', [80, 280]);
      addWave(630, 'COPILOT_GLIDER', 'TORKAN_TRACK_DASH', [140, 220]);

      // Boss Alert & Spawn: Elon's Gate (Grok & SpaceX rockets!)
      events.push({ tick: 740, type: 'ALERT' });
      events.push({ tick: 780, type: 'BOSS', bossType: 'STAGE2_GROK_CURSOR' });

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
