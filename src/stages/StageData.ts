import { EnemyType, GroundType, BossType } from '../types';

export interface SpawnEvent {
  tick: number;
  type: 'ENEMY' | 'GROUND' | 'BOSS' | 'ALERT';
  enemyType?: EnemyType;
  groundType?: GroundType;
  bossType?: BossType;
  x?: number;
  y?: number;
  pattern?: string;
  count?: number;
  spacing?: number;
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

    // Helper to spawn ground targets
    const addGround = (tick: number, gtype: GroundType, x: number) => {
      events.push({ tick, type: 'GROUND', groundType: gtype, x });
    };

    // Helper to spawn stream of enemies
    const addStream = (startTick: number, etype: EnemyType, pattern: string, count: number, startX: number) => {
      for (let i = 0; i < count; i++) {
        events.push({
          tick: startTick + i * 16,
          type: 'ENEMY',
          enemyType: etype,
          pattern,
          x: startX,
          y: -20,
        });
      }
    };

    if (stage === 1) {
      // --- STAGE 1: China LLM & Open Source Frontier ---
      // Ground targets: Server racks & Radar domes
      addGround(20, 'BARROW', 90);
      addGround(60, 'SERVER_RACK', 260);
      addGround(140, 'AI_CHIP', 180);
      addGround(220, 'SOL_CITADEL', 120); // Hidden citadel!
      addGround(320, 'BARROW', 280);

      // Wave 1: DeepSeek V4.1-Flash S-curves & Mistral Flame
      addStream(40, 'DEEPSEEK_FLASH', 'S_CURVE_LEFT', 6, 80);
      addStream(110, 'MISTRAL_FLAME', 'ZIG_ZAG', 5, 260);
      addStream(180, 'DEEPSEEK_FLASH', 'S_CURVE_RIGHT', 6, 280);

      // Mid-Boss Phase: Kimi Moon Core Escort
      events.push({ tick: 270, type: 'ENEMY', enemyType: 'KIMI_MOON', pattern: 'SWOOP_DIVE', x: 180, y: -20 });
      events.push({ tick: 285, type: 'ENEMY', enemyType: 'QWEN_CUBE', pattern: 'PINCER_LEFT', x: 40, y: -20 });
      events.push({ tick: 285, type: 'ENEMY', enemyType: 'QWEN_CUBE', pattern: 'PINCER_RIGHT', x: 320, y: -20 });

      // Ground targets during mid-stage
      addGround(380, 'SERVER_RACK', 100);
      addGround(440, 'SOL_CITADEL', 240);
      addGround(520, 'AI_CHIP', 160);

      // Wave 2: Fast cross pincer
      addStream(480, 'DEEPSEEK_FLASH', 'PINCER_LEFT', 5, 30);
      addStream(490, 'DEEPSEEK_FLASH', 'PINCER_RIGHT', 5, 330);
      addStream(570, 'MISTRAL_FLAME', 'SWOOP_DIVE', 6, 180);

      // Boss Alert & Spawn
      events.push({ tick: 660, type: 'ALERT' });
      events.push({ tick: 700, type: 'BOSS', bossType: 'STAGE1_DEEPSEEK_KIMI' });

    } else if (stage === 2) {
      // --- STAGE 2: xAI & Dev Forge (Grok & Cursor) ---
      addGround(30, 'BARROW', 180);
      addGround(90, 'AI_CHIP', 70);
      addGround(160, 'SOL_CITADEL', 290);
      addGround(260, 'BARROW', 130);

      // Wave 1: Cursor Probe { } brackets and Copilot gliders
      addStream(40, 'CURSOR_PROBE', 'S_CURVE_RIGHT', 5, 280);
      addStream(120, 'COPILOT_GLIDER', 'SWOOP_DIVE', 6, 100);
      addStream(200, 'CURSOR_PROBE', 'PINCER_LEFT', 5, 40);

      // Mid-Boss: Grok Raider strike team
      events.push({ tick: 280, type: 'ENEMY', enemyType: 'GROK_RAIDER', pattern: 'TARGET_RAM', x: 140, y: -20 });
      events.push({ tick: 300, type: 'ENEMY', enemyType: 'GROK_RAIDER', pattern: 'TARGET_RAM', x: 220, y: -20 });

      addGround(380, 'SERVER_RACK', 180);
      addGround(450, 'SOL_CITADEL', 80);

      // Wave 2: Aggressive mixed dive
      addStream(460, 'COPILOT_GLIDER', 'S_CURVE_LEFT', 6, 90);
      addStream(520, 'CURSOR_PROBE', 'SWOOP_DIVE', 6, 260);

      // Boss Alert & Spawn
      events.push({ tick: 640, type: 'ALERT' });
      events.push({ tick: 680, type: 'BOSS', bossType: 'STAGE2_GROK_CURSOR' });

    } else if (stage === 3) {
      // --- STAGE 3: Anthropic Alignment Citadel ---
      addGround(30, 'SOL_CITADEL', 180);
      addGround(100, 'AI_CHIP', 280);
      addGround(180, 'BARROW', 80);
      addGround(280, 'SOL_CITADEL', 140);

      // Wave 1: Claude Fable & Perplexity spinners
      addStream(40, 'PERPLEXITY_SPINNER', 'SWOOP_DIVE', 5, 120);
      addStream(120, 'CLAUDE_FABLE', 'S_CURVE_LEFT', 5, 250);
      addStream(200, 'PERPLEXITY_SPINNER', 'PINCER_RIGHT', 5, 310);

      // Mid-Boss: Claude Mythos elite vanguard
      events.push({ tick: 280, type: 'ENEMY', enemyType: 'CLAUDE_MYTHOS', pattern: 'ZIG_ZAG', x: 180, y: -20 });
      events.push({ tick: 310, type: 'ENEMY', enemyType: 'CLAUDE_FABLE', pattern: 'SWOOP_DIVE', x: 100, y: -20 });
      events.push({ tick: 310, type: 'ENEMY', enemyType: 'CLAUDE_FABLE', pattern: 'SWOOP_DIVE', x: 260, y: -20 });

      addGround(390, 'SERVER_RACK', 220);
      addGround(470, 'SOL_CITADEL', 290);

      // Wave 2: High density alignment swarm
      addStream(480, 'PERPLEXITY_SPINNER', 'S_CURVE_RIGHT', 6, 290);
      addStream(540, 'CLAUDE_FABLE', 'SWOOP_DIVE', 6, 150);

      // Boss Alert & Spawn
      events.push({ tick: 650, type: 'ALERT' });
      events.push({ tick: 690, type: 'BOSS', bossType: 'STAGE3_CLAUDE_OPUS' });

    } else {
      // --- STAGE 4: OpenAI GPT-6 Megastructure (Astra > Sol > Terra > Luna) ---
      addGround(30, 'AI_CHIP', 180);
      addGround(80, 'SERVER_RACK', 90);
      addGround(160, 'SOL_CITADEL', 270);
      addGround(240, 'AI_CHIP', 120);

      // Wave 1: GPT-6 Luna high-speed crescent streams
      addStream(30, 'GPT6_LUNA', 'S_CURVE_LEFT', 8, 70);
      addStream(90, 'GPT6_LUNA', 'S_CURVE_RIGHT', 8, 290);
      addStream(160, 'GPT6_LUNA', 'SWOOP_DIVE', 8, 180);

      // Mid-Boss: GPT-6 Terra heavy dreadnoughts + Sol Cruiser
      events.push({ tick: 250, type: 'ENEMY', enemyType: 'GPT6_TERRA', pattern: 'ZIG_ZAG', x: 110, y: -30 });
      events.push({ tick: 260, type: 'ENEMY', enemyType: 'GPT6_TERRA', pattern: 'ZIG_ZAG', x: 250, y: -30 });
      events.push({ tick: 310, type: 'ENEMY', enemyType: 'GPT6_SOL', pattern: 'SWOOP_DIVE', x: 180, y: -40 });

      addGround(380, 'SOL_CITADEL', 180);
      addGround(450, 'SERVER_RACK', 280);

      // Wave 2: Luna swarms with Terra escorts
      addStream(460, 'GPT6_LUNA', 'PINCER_LEFT', 6, 40);
      addStream(470, 'GPT6_LUNA', 'PINCER_RIGHT', 6, 320);
      events.push({ tick: 530, type: 'ENEMY', enemyType: 'GPT6_TERRA', pattern: 'TARGET_RAM', x: 180, y: -30 });

      // Final Boss Alert & Spawn: GPT-6 Astra Andor Genesis
      events.push({ tick: 660, type: 'ALERT' });
      events.push({ tick: 700, type: 'BOSS', bossType: 'STAGE4_GPT6_ASTRA' });
    }

    return events;
  }
}
