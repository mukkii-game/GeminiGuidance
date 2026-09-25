export type GameState = 'TITLE' | 'PLAYING' | 'STAGE_CLEAR' | 'GAME_OVER' | 'GAME_CLEAR';

export interface InputState {
  x: number;
  y: number;
  active: boolean;
  isTouch: boolean;
  bombPressed: boolean;
  crtTogglePressed: boolean;
  audioTogglePressed: boolean;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tilt: number; // -1 (left), 0 (center), 1 (right)
  sightX: number;
  sightY: number;
  sightDistance: number;
  bombCooldown: number;
  lives: number;
  score: number;
  highScore: number;
  invulnerableTimer: number;
  alive: boolean;
}

export interface BlasterBomb {
  id: string;
  startX: number;
  startY: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  progress: number; // 0 to 1
  exploded: boolean;
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
  fuseTimer: number; // for sparkling fusion effect
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
  // Stage 3 (Anthropic Alignment: Fable > Opus > Sonnet > Haiku)
  | 'CLAUDE_HAIKU' 
  | 'CLAUDE_SONNET' 
  | 'CLAUDE_OPUS' 
  | 'PERPLEXITY_SPINNER'
  // Stage 4 (OpenAI GPT-6 Fleet)
  | 'GPT6_LUNA' 
  | 'GPT6_TERRA' 
  | 'GPT6_SOL'
  // Shared
  | 'MINI_CLONE';

export interface EnemyEntity {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  age: number;
  pattern: string;
  points: number;
  color: string;
  angle: number;
  shootCooldown: number;
}

export type GroundType = 'BARROW' | 'SOL_CITADEL' | 'SERVER_RACK' | 'AI_CHIP';

export interface GroundEntity {
  id: string;
  type: GroundType;
  worldY: number; // absolute Y position along the stage
  x: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  points: number;
  revealed: boolean; // For hidden Sol citadels
  destroyed: boolean;
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
