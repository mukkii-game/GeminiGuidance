/**
 * High-definition Retro Arcade Sprite Generator
 * Generates authentic, officially recognizable GenAI logos and 1983 arcade sprites.
 */
export class SpriteSheet {
  private cache: Map<string, HTMLCanvasElement> = new Map();

  constructor() {
    this.generateAllSprites();
  }

  public get(key: string): HTMLCanvasElement | undefined {
    return this.cache.get(key);
  }

  private createCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    return [canvas, ctx];
  }

  private generateAllSprites(): void {
    // 1. Solvalou Player Ship (Center, Tilt Left, Tilt Right)
    this.createPlayerShip('PLAYER_CENTER', 0);
    this.createPlayerShip('PLAYER_LEFT', -1);
    this.createPlayerShip('PLAYER_RIGHT', 1);

    // 2. Ground Sight & Blaster Bomb
    this.createGroundSight();
    this.createBlasterBomb();

    // 3. Gemini Orbs (Official 4-point concave sparkle)
    this.createGeminiOrb('GEMINI_LV1', 1);
    this.createGeminiOrb('GEMINI_LV2', 2);
    this.createGeminiOrb('GEMINI_LV3', 3);

    // 4. Official GenAI Logos
    this.createGPT6Luna();
    this.createGPT6Terra();
    this.createGPT6Sol();
    this.createDeepSeekFlash();
    this.createKimiMoon();
    this.createQwenCube();
    this.createMistralFlame();
    this.createGrokRaider();
    this.createCursorProbe();
    this.createCopilotGlider();
    this.createPerplexitySpinner();

    // Anthropic Claude Lineup (Fable > Opus > Sonnet > Haiku)
    this.createClaudeHaiku();
    this.createClaudeSonnet();
    this.createClaudeOpus();
    this.createClaudeFable();

    this.createMiniClone();

    // 5. Ground Targets
    this.createBarrowRadar();
    this.createSolCitadel();
    this.createServerRack();
    this.createAIChip();
  }

  // --- 1. Solvalou Player Ship ---
  private createPlayerShip(key: string, tilt: number): void {
    const [c, ctx] = this.createCanvas(32, 32);
    ctx.save();
    ctx.translate(16, 16);
    if (tilt !== 0) {
      ctx.transform(1, 0, tilt * 0.18, 1, 0, 0);
    }

    // Shadow / Bottom Hull
    ctx.fillStyle = '#1c2836';
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(13, 10);
    ctx.lineTo(8, 13);
    ctx.lineTo(0, 9);
    ctx.lineTo(-8, 13);
    ctx.lineTo(-13, 10);
    ctx.closePath();
    ctx.fill();

    // Main Silver Wedge Hull
    ctx.fillStyle = '#8fa3b8';
    ctx.beginPath();
    ctx.moveTo(0, -13);
    ctx.lineTo(11, 8);
    ctx.lineTo(6, 11);
    ctx.lineTo(0, 8);
    ctx.lineTo(-6, 11);
    ctx.lineTo(-11, 8);
    ctx.closePath();
    ctx.fill();

    // Upper Highlight (Left bevel lighting)
    ctx.fillStyle = '#e2ecf5';
    ctx.beginPath();
    ctx.moveTo(0, -13);
    ctx.lineTo(0, 8);
    ctx.lineTo(-6, 11);
    ctx.lineTo(-11, 8);
    ctx.closePath();
    ctx.fill();

    // Pure White Spine
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-1, -12, 2, 18);

    // Blue Cockpit Canopy
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(3, 1);
    ctx.lineTo(0, 4);
    ctx.lineTo(-3, 1);
    ctx.closePath();
    ctx.fill();

    // Canopy Glint
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-1, -4, 2, 3);

    // Dual Thrusters
    ctx.fillStyle = '#ff7700';
    ctx.fillRect(-5, 9, 3, 3);
    ctx.fillRect(2, 9, 3, 3);

    ctx.restore();
    this.cache.set(key, c);
  }

  // --- 2. Ground Sight & Bomb ---
  private createGroundSight(): void {
    const [c, ctx] = this.createCanvas(32, 32);
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 1.5;

    const len = 5;
    ctx.beginPath();
    ctx.moveTo(7, 7 + len); ctx.lineTo(7, 7); ctx.lineTo(7 + len, 7);
    ctx.moveTo(25 - len, 7); ctx.lineTo(25, 7); ctx.lineTo(25, 7 + len);
    ctx.moveTo(7, 25 - len); ctx.lineTo(7, 25); ctx.lineTo(7 + len, 25);
    ctx.moveTo(25 - len, 25); ctx.lineTo(25, 25); ctx.lineTo(25, 25 - len);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 255, 200, 0.6)';
    ctx.beginPath();
    ctx.arc(16, 16, 5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(15, 15, 2, 2);

    this.cache.set('SIGHT', c);
  }

  private createBlasterBomb(): void {
    const [c, ctx] = this.createCanvas(12, 12);
    ctx.fillStyle = '#ffe600';
    ctx.beginPath();
    ctx.arc(6, 6, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(5, 5, 2, 2);

    ctx.fillStyle = '#ff3300';
    ctx.fillRect(5, 9, 2, 2);

    this.cache.set('BLASTER_BOMB', c);
  }

  // --- 3. Gemini Logos: The Official 4-Point Concave Sparkle ---
  private createGeminiOrb(key: string, level: number): void {
    const size = level === 1 ? 32 : level === 2 ? 46 : 64;
    const [c, ctx] = this.createCanvas(size, size);
    const half = size / 2;

    // Glowing Outer Halo
    const grad = ctx.createRadialGradient(half, half, 2, half, half, half);
    if (level === 1) {
      grad.addColorStop(0, 'rgba(100, 180, 255, 0.95)');
      grad.addColorStop(0.5, 'rgba(160, 90, 255, 0.55)');
      grad.addColorStop(1, 'rgba(10, 20, 90, 0)');
    } else if (level === 2) {
      grad.addColorStop(0, 'rgba(150, 230, 255, 0.98)');
      grad.addColorStop(0.4, 'rgba(210, 120, 255, 0.75)');
      grad.addColorStop(1, 'rgba(30, 0, 110, 0)');
    } else {
      // Lv 3 Mega Celestial Spark
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.3, 'rgba(80, 220, 255, 0.95)');
      grad.addColorStop(0.7, 'rgba(240, 80, 255, 0.85)');
      grad.addColorStop(1, 'rgba(60, 0, 130, 0)');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Exact Mathematical Google Gemini 4-Point Concave Shape
    ctx.save();
    ctx.translate(half, half);
    ctx.beginPath();
    const R = half * 0.88;
    ctx.moveTo(0, -R);
    ctx.quadraticCurveTo(0, 0, R, 0);
    ctx.quadraticCurveTo(0, 0, 0, R);
    ctx.quadraticCurveTo(0, 0, -R, 0);
    ctx.quadraticCurveTo(0, 0, 0, -R);
    ctx.closePath();

    // Official Google Gemini 4-Stop Gradient (Cyan, Blue, Purple, Magenta)
    const geminiGrad = ctx.createLinearGradient(-R, -R, R, R);
    geminiGrad.addColorStop(0, '#00d2ff');   // Cyan
    geminiGrad.addColorStop(0.35, '#1a73e8'); // Deep Google Blue
    geminiGrad.addColorStop(0.7, '#9333ea');  // Vivid Purple
    geminiGrad.addColorStop(1, '#e11d48');   // Magenta Pink
    ctx.fillStyle = geminiGrad;
    ctx.fill();

    // Radiant Beveled Core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, half * 0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    this.cache.set(key, c);
  }

  // --- 4. Official GenAI Enemy Logos ---

  // Helper: Draws the exact official OpenAI 6-Fold Spiral Rosette
  private drawOpenAIRosette(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, color: string): void {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2, radius * 0.22);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI) / 3);
      ctx.beginPath();
      // Curved petal arc starting tangentially and looping in
      ctx.arc(radius * 0.45, -radius * 0.15, radius * 0.5, -Math.PI * 0.4, Math.PI * 0.55);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  // GPT-6 Luna: Sleek crescent craft featuring the OpenAI Rosette
  private createGPT6Luna(): void {
    const [c, ctx] = this.createCanvas(28, 28);
    // Dark outer crescent hull
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(14, 14, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(14, 14, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(11, 12, 9, 0, Math.PI * 2);
    ctx.fill();

    // Official OpenAI Rosette inside
    this.drawOpenAIRosette(ctx, 16, 14, 7, '#ffffff');

    this.cache.set('GPT6_LUNA', c);
  }

  // GPT-6 Terra: Heavy slate armored fortress with golden OpenAI emblem
  private createGPT6Terra(): void {
    const [c, ctx] = this.createCanvas(36, 36);
    // Octagonal heavy armor
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(11, 2); ctx.lineTo(25, 2);
    ctx.lineTo(34, 11); ctx.lineTo(34, 25);
    ctx.lineTo(25, 34); ctx.lineTo(11, 34);
    ctx.lineTo(2, 25); ctx.lineTo(2, 11);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Official OpenAI emblem in the center
    this.drawOpenAIRosette(ctx, 18, 18, 10, '#f59e0b');

    this.cache.set('GPT6_TERRA', c);
  }

  // GPT-6 Sol: Massive flagship with radiant corona and prominent OpenAI Rosette
  private createGPT6Sol(): void {
    const [c, ctx] = this.createCanvas(48, 48);
    // Solar Corona
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(24, 24, 22, 0, Math.PI * 2);
    ctx.fill();

    // Armored inner ring
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(24, 24, 17, 0, Math.PI * 2);
    ctx.fill();

    // Official OpenAI Rosette at the core
    this.drawOpenAIRosette(ctx, 24, 24, 12, '#38bdf8');

    // Blinding white center
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(24, 24, 3, 0, Math.PI * 2);
    ctx.fill();

    this.cache.set('GPT6_SOL', c);
  }

  // DeepSeek: The Official DeepSeek Blue Whale Mascot!
  private createDeepSeekFlash(): void {
    const [c, ctx] = this.createCanvas(30, 30);
    // DeepSeek Navy Blue Whale Body
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.moveTo(6, 14);
    ctx.bezierCurveTo(6, 6, 22, 6, 26, 14);
    ctx.bezierCurveTo(28, 18, 22, 22, 12, 22);
    ctx.bezierCurveTo(8, 22, 6, 18, 6, 14);
    ctx.fill();

    // Whale Tail Fluke
    ctx.beginPath();
    ctx.moveTo(7, 14);
    ctx.lineTo(1, 8);
    ctx.lineTo(3, 14);
    ctx.lineTo(1, 20);
    ctx.closePath();
    ctx.fill();

    // White Belly
    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.ellipse(16, 18, 8, 4, 0, 0, Math.PI);
    ctx.fill();

    // Whale Pectoral Fin
    ctx.fillStyle = '#0369a1';
    ctx.beginPath();
    ctx.ellipse(14, 16, 4, 2, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // Friendly White Eye
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(21, 11, 2.5, 2.5);

    this.cache.set('DEEPSEEK_FLASH', c);
  }

  // Kimi: Official Moonshot AI Glowing Lunar Sphere & "K" Motif
  private createKimiMoon(): void {
    const [c, ctx] = this.createCanvas(28, 28);
    // Indigo Moon
    ctx.fillStyle = '#4f46e5';
    ctx.beginPath();
    ctx.arc(14, 14, 12, 0, Math.PI * 2);
    ctx.fill();

    // Glowing violet aura
    ctx.strokeStyle = '#c7d2fe';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Moonshot 'K' geometric emblem
    ctx.fillStyle = '#ffffff';
    // Vertical stem of K
    ctx.fillRect(9, 7, 3, 14);
    // Diagonal arms of K
    ctx.beginPath();
    ctx.moveTo(12, 14); ctx.lineTo(19, 7); ctx.lineTo(19, 10); ctx.lineTo(14, 14);
    ctx.moveTo(12, 14); ctx.lineTo(19, 21); ctx.lineTo(19, 18); ctx.lineTo(14, 14);
    ctx.fill();

    this.cache.set('KIMI_MOON', c);
  }

  // Qwen: Official Alibaba Qwen Faceted Crystal Prism
  private createQwenCube(): void {
    const [c, ctx] = this.createCanvas(26, 26);
    // Top prism facet
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.moveTo(13, 2); ctx.lineTo(23, 7); ctx.lineTo(13, 12); ctx.lineTo(3, 7);
    ctx.closePath();
    ctx.fill();

    // Left facet
    ctx.fillStyle = '#7e22ce';
    ctx.beginPath();
    ctx.moveTo(3, 7); ctx.lineTo(13, 12); ctx.lineTo(13, 23); ctx.lineTo(3, 18);
    ctx.closePath();
    ctx.fill();

    // Right facet
    ctx.fillStyle = '#c084fc';
    ctx.beginPath();
    ctx.moveTo(23, 7); ctx.lineTo(13, 12); ctx.lineTo(13, 23); ctx.lineTo(23, 18);
    ctx.closePath();
    ctx.fill();

    this.cache.set('QWEN_CUBE', c);
  }

  // Mistral: The Official Mistral AI Stepped Pixel M Logo!
  private createMistralFlame(): void {
    const [c, ctx] = this.createCanvas(26, 26);
    // Official Mistral 'M' pixel stair blocks in vibrant sunset orange
    ctx.fillStyle = '#ea580c';
    // Tier 1 (top corners)
    ctx.fillRect(5, 5, 4, 3);
    ctx.fillRect(17, 5, 4, 3);

    // Tier 2
    ctx.fillRect(5, 8, 7, 3);
    ctx.fillRect(14, 8, 7, 3);

    // Tier 3 (center peak)
    ctx.fillRect(5, 11, 16, 3);

    // Tier 4 (lower middle split)
    ctx.fillRect(5, 14, 5, 3);
    ctx.fillRect(16, 14, 5, 3);

    // Tier 5 (base pillars)
    ctx.fillRect(5, 17, 4, 4);
    ctx.fillRect(17, 17, 4, 4);

    // Warm yellow inner highlight
    ctx.fillStyle = '#fde047';
    ctx.fillRect(11, 11, 4, 3);

    this.cache.set('MISTRAL_FLAME', c);
  }

  // Grok: The Official xAI Grok Minimalist Thick Slash-X Logo
  private createGrokRaider(): void {
    const [c, ctx] = this.createCanvas(30, 30);
    // Dark square background
    ctx.fillStyle = '#000000';
    ctx.fillRect(2, 2, 26, 26);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(2, 2, 26, 26);

    // Official xAI thick diagonal slash
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(6, 6); ctx.lineTo(24, 24);
    ctx.stroke();

    // Geometric opposing curved line
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(22, 6); ctx.lineTo(16, 14); ctx.lineTo(8, 24);
    ctx.stroke();

    // Red engine light
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(13, 24, 4, 3);

    this.cache.set('GROK_RAIDER', c);
  }

  // Cursor: The Official Cursor IDE 3D Isometric Cube with Glowing Cyan Arrow
  private createCursorProbe(): void {
    const [c, ctx] = this.createCanvas(26, 26);
    // Dark Charcoal 3D Cube
    // Top Face
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(13, 3); ctx.lineTo(22, 8); ctx.lineTo(13, 13); ctx.lineTo(4, 8);
    ctx.closePath();
    ctx.fill();

    // Left Face
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(4, 8); ctx.lineTo(13, 13); ctx.lineTo(13, 23); ctx.lineTo(4, 18);
    ctx.closePath();
    ctx.fill();

    // Right Face
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(22, 8); ctx.lineTo(13, 13); ctx.lineTo(13, 23); ctx.lineTo(22, 18);
    ctx.closePath();
    ctx.fill();

    // The Official Glowing Cyan Chevron Cursor Arrow pointing up-right
    ctx.fillStyle = '#00f2fe';
    ctx.beginPath();
    ctx.moveTo(11, 10); ctx.lineTo(18, 7); ctx.lineTo(17, 14); ctx.lineTo(14, 12);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(13, 9, 3, 3);

    this.cache.set('CURSOR_PROBE', c);
  }

  // GitHub Copilot: The Official Copilot Robot Face with Visor
  private createCopilotGlider(): void {
    const [c, ctx] = this.createCanvas(28, 28);
    // Copilot Purple / Blue gradient head
    ctx.fillStyle = '#4338ca';
    ctx.beginPath();
    ctx.arc(14, 14, 11, 0, Math.PI * 2);
    ctx.fill();

    // Dual antenna ears
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(2, 11, 3, 6);
    ctx.fillRect(23, 11, 3, 6);

    // Curved black visor
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(7, 10, 14, 8, 4);
    ctx.fill();

    // Glowing cyan eye strip
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(9, 13, 10, 2);

    this.cache.set('COPILOT_GLIDER', c);
  }

  // Perplexity: The Official Interconnected Woven Loop Logo
  private createPerplexitySpinner(): void {
    const [c, ctx] = this.createCanvas(26, 26);
    ctx.strokeStyle = '#0d9488';
    ctx.lineWidth = 2.5;

    // Six interlocking loops
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.translate(13, 13);
      ctx.rotate((i * Math.PI) / 3);
      ctx.strokeRect(-9, -3, 18, 6);
      ctx.restore();
    }

    ctx.fillStyle = '#2dd4bf';
    ctx.beginPath();
    ctx.arc(13, 13, 3, 0, Math.PI * 2);
    ctx.fill();

    this.cache.set('PERPLEXITY_SPINNER', c);
  }

  // --- Anthropic Claude Official Terracotta Sunburst Lineup ---

  // Helper: Draws the official Anthropic 14-spoke Terracotta Sunburst
  private drawAnthropicSunburst(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spokes: number,
    innerR: number,
    outerR: number,
    color: string,
    centerColor: string
  ): void {
    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = color;
    for (let i = 0; i < spokes; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI * 2) / spokes);
      // Radiating rounded rectangular ray
      ctx.fillRect(-1.5, innerR, 3, outerR - innerR);
      ctx.restore();
    }

    // Central Core
    ctx.fillStyle = centerColor;
    ctx.beginPath();
    ctx.arc(0, 0, innerR + 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Claude Haiku: Nimble 8-spoke light terracotta sunburst
  private createClaudeHaiku(): void {
    const [c, ctx] = this.createCanvas(24, 24);
    this.drawAnthropicSunburst(ctx, 12, 12, 8, 3, 10, '#ea580c', '#fed7aa');
    this.cache.set('CLAUDE_HAIKU', c);
  }

  // Claude Sonnet: Balanced 12-spoke terracotta battle cruiser
  private createClaudeSonnet(): void {
    const [c, ctx] = this.createCanvas(28, 28);
    this.drawAnthropicSunburst(ctx, 14, 14, 12, 4, 12, '#ea580c', '#fef08a');
    this.cache.set('CLAUDE_SONNET', c);
  }

  // Claude Opus: Heavy 14-spoke terracotta dreadnought with outer shield
  private createClaudeOpus(): void {
    const [c, ctx] = this.createCanvas(38, 38);
    // Outer shield ring
    ctx.strokeStyle = '#c2410c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(19, 19, 17, 0, Math.PI * 2);
    ctx.stroke();

    this.drawAnthropicSunburst(ctx, 19, 19, 14, 5, 15, '#c2410c', '#ffedd5');
    this.cache.set('CLAUDE_OPUS', c);
  }

  // Claude Fable: Apex 16-Spoke Golden Terracotta Solar Crown (Flagship Top Tier!)
  private createClaudeFable(): void {
    const [c, ctx] = this.createCanvas(48, 48);
    // Radiant Golden Halo
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(24, 24, 23, 0, Math.PI * 2);
    ctx.fill();

    // Terracotta Sunburst Body
    this.drawAnthropicSunburst(ctx, 24, 24, 16, 6, 20, '#b45309', '#ffffff');

    // Brilliant White Diamond Core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(24, 18); ctx.lineTo(30, 24); ctx.lineTo(24, 30); ctx.lineTo(18, 24);
    ctx.closePath();
    ctx.fill();

    this.cache.set('CLAUDE_FABLE', c);
  }

  // Mini-clone projectile
  private createMiniClone(): void {
    const [c, ctx] = this.createCanvas(10, 10);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(3, 1, 4, 8);
    ctx.fillRect(1, 3, 8, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(4, 4, 2, 2);
    this.cache.set('MINI_CLONE', c);
  }

  // --- 5. Ground Targets ---
  private createBarrowRadar(): void {
    const [c, ctx] = this.createCanvas(32, 32);
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(16, 18, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(16, 16, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(16, 16); ctx.lineTo(23, 11);
    ctx.stroke();

    this.cache.set('BARROW', c);
  }

  private createSolCitadel(): void {
    const [c, ctx] = this.createCanvas(32, 32);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(4, 4, 24, 24);

    ctx.fillStyle = '#b45309';
    ctx.fillRect(7, 7, 18, 18);

    ctx.fillStyle = '#d97706';
    ctx.fillRect(10, 10, 12, 12);

    ctx.fillStyle = '#fef08a';
    ctx.fillRect(13, 13, 6, 6);

    this.cache.set('SOL_CITADEL', c);
  }

  private createServerRack(): void {
    const [c, ctx] = this.createCanvas(28, 28);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(3, 2, 22, 24);

    ctx.fillStyle = '#0f172a';
    for (let y = 5; y < 24; y += 4) {
      ctx.fillRect(5, y, 18, 3);
    }

    ctx.fillStyle = '#22c55e';
    ctx.fillRect(6, 6, 2, 1);
    ctx.fillRect(6, 10, 2, 1);
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(6, 14, 2, 1);
    ctx.fillRect(6, 18, 2, 1);

    this.cache.set('SERVER_RACK', c);
  }

  private createAIChip(): void {
    const [c, ctx] = this.createCanvas(28, 28);
    ctx.fillStyle = '#14532d';
    ctx.fillRect(3, 3, 22, 22);

    ctx.fillStyle = '#eab308';
    for (let p = 5; p <= 21; p += 3) {
      ctx.fillRect(p, 1, 2, 2);
      ctx.fillRect(p, 25, 2, 2);
      ctx.fillRect(1, p, 2, 2);
      ctx.fillRect(25, p, 2, 2);
    }

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(8, 8, 12, 12);

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(11, 11, 6, 6);

    this.cache.set('AI_CHIP', c);
  }
}
