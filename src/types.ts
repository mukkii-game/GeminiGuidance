export type GameState = 'TITLE' | 'PLAYING' | 'STAGE_CLEAR' | 'GAME_OVER' | 'GAME_CLEAR' | 'TEST_STAGE';

export type PhysicsPresetId = 'BALANCED' | 'HEAVY_FLAIL' | 'SNAP_YOYO' | 'LUNAR_ORBIT' | 'WHIP_SLASH';

export interface PhysicsPresetConfig {
  id: PhysicsPresetId;
  name: string;
  nameJa: string;
  descJa: string;
  r0: number;
  baseTension: number;
  extremeDiv: number;
  extremePow: number;
  extremeMult: number;
  maxTension: number;
  pushForce: number;
  whirlTransfer: number;
  barrierSpeed: number;
  barrierAccel: number;
  damping: number;
  maxSpeedBase: number;
  maxSpeedPerLevel: number;
}

export interface InputState {
  x: number;
  y: number;
  active: boolean;
  isTouch: boolean;
  crtTogglePressed?: boolean;
  audioTogglePressed?: boolean;
  presetSelectPressed?: PhysicsPresetId;
  testStageTogglePressed?: boolean;
  levelUpPressed?: boolean;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tilt: number; // -1 (left), 0 (center), 1 (right)
  lives: number;
  hp: number;
  maxHp: number;
  score: number;
  highScore: number;
  invulnerableTimer: number;
  alive: boolean;
}

export interface GeminiDropItem {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  timer: number;
  size: number;
}

export interface EnemyBullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  age: number;
}

export interface GeminiOrb {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  level: number; // 1, 2, 3 (MAX)
  radius: number;
  damage: number;
  trail: Array<{ x: number; y: number; alpha: number }>;
  fuseTimer: number; // sparkling burst when leveled up
}

export type EnemyType = 
  // Stage 1 (China LLM & Open Frontier)
  | 'DEEPSEEK_FLASH' 
  | 'KIMI_MOON' 
  | 'QWEN_CUBE' 
  | 'MISTRAL_FLAME'
  // Stage 2 (xAI & Dev Forge)
  | 'CURSOR_PROBE' 
  | 'GROK_RAIDER' 
  | 'COPILOT_GLIDER'
  | 'SPACEX_ROCKET'
  // Stage 3 (Anthropic Alignment: Fable > Opus > Sonnet > Haiku)
  | 'CLAUDE_HAIKU' 
  | 'CLAUDE_SONNET' 
  | 'CLAUDE_OPUS' 
  | 'PERPLEXITY_SPINNER'
  // Stage 4 (OpenAI GPT-6 Fleet)
  | 'GPT6_LUNA' 
  | 'GPT6_TERRA' 
  | 'GPT6_SOL';

export type MovementPattern = 
  | 'STRAIGHT_DOWN'
  | 'TOROID_SWOOP'
  | 'TORKAN_TRACK_DASH'
  | 'ZOSHI_REACTIVE_SWOOP'
  | 'GALAGA_LOOP'
  | 'SPAROID_CRUISE'
  | 'ROCKET_ASCENT'
  | 'INVADER'
  | 'UFO_FLYBY'
  | 'TACKLE_DASH'
  | 'DUMMY';

export interface EnemyEntity {
  id: string;
  type: EnemyType;
  formationId?: string; // used to detect when an entire formation is destroyed!
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  age: number;
  pattern: MovementPattern | string;
  points: number;
  color: string;
  angle: number;
  shootCooldown: number;
  hitCooldown?: number;
}

export type GroundType = 
  | 'NVIDIA_BASE'
  | 'META_BASE'
  | 'HUGGINGFACE_BASE'
  | 'STABILITY_BASE'
  | 'SOL_CITADEL';

export interface GroundEntity {
  id: string;
  type: GroundType;
  x: number;
  worldY: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  revealed: boolean;
  destroyed: boolean;
  points: number;
}

export interface WeakPoint {
  id: string;
  xOffset: number;
  yOffset: number;
  radius: number;
  hp: number;
  maxHp: number;
  active: boolean;
  label: string;
}

export type BossType = 
  | 'STAGE1_DEEPSEEK_KIMI'   // DeepSeek V4.1 & Kimi Moonshot Core
  | 'STAGE2_GROK_CURSOR'     // Grok 4.7 & Cursor Dual Dreadnought
  | 'STAGE3_CLAUDE_FABLE'    // Claude Fable Apex Octagon Fortress
  | 'STAGE4_GPT6_ASTRA';     // GPT-6 Astra "Andor Genesis"

export interface BossEntity {
  type: BossType;
  name: string;
  stageTitle: string;
  dialogueQuote: string;
  quoteTimer: number;
  x: number;
  y: number;
  targetY: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  phase: number;
  timer: number;
  weakPoints: WeakPoint[];
  defeated: boolean;
  hitCooldown?: number;
}

export interface ParticleEffect {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  shape?: 'square' | 'circle' | 'spark';
}

export interface ExplosionEffect {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  timer: number;
  duration: number;
  isGround: boolean;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  timer: number;
  duration: number;
}

export interface BreakoutBlock {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  color: string;
  points: number;
  active: boolean;
}
