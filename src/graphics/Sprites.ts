/**
 * High-definition Retro 8-bit/16-bit Pixel Art Sprite Generator
 * Renders authentic arcade sprites onto cached offscreen canvases.
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

    // 3. Gemini Orbs (Lv1, Lv2, Lv3)
    this.createGeminiOrb('GEMINI_LV1', 1);
    this.createGeminiOrb('GEMINI_LV2', 2);
    this.createGeminiOrb('GEMINI_LV3', 3);

    // 4. Enemy GenAI Logos (2026 Lineup)
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
    // Outer Corner Brackets
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 1.5;

    // 4 Corner Angles
    const len = 5;
    // Top-Left
    ctx.beginPath();
    ctx.moveTo(7, 7 + len); ctx.lineTo(7, 7); ctx.lineTo(7 + len, 7);
    // Top-Right
    ctx.moveTo(25 - len, 7); ctx.lineTo(25, 7); ctx.lineTo(25, 7 + len);
    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(7, 25 - len); ctx.lineTo(7, 25); ctx.lineTo(7 + len, 25);
    // Bottom-Right
    ctx.moveTo(25 - len, 25); ctx.lineTo(25, 25); ctx.lineTo(25, 25 - len);
    ctx.stroke();

    // Inner Circle & Center Pip
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
    // Yellow-White Torpedo Bomb
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

  // --- 3. Gemini Logos (Hero Weapon) ---
  private createGeminiOrb(key: string, level: number): void {
    const size = level === 1 ? 28 : level === 2 ? 40 : 56;
    const [c, ctx] = this.createCanvas(size, size);
    const half = size / 2;

    // Glowing Outer Halo
    const grad = ctx.createRadialGradient(half, half, 2, half, half, half);
    if (level === 1) {
      grad.addColorStop(0, 'rgba(100, 180, 255, 0.9)');
      grad.addColorStop(0.5, 'rgba(140, 80, 255, 0.5)');
      grad.addColorStop(1, 'rgba(0, 20, 80, 0)');
    } else if (level === 2) {
      grad.addColorStop(0, 'rgba(140, 220, 255, 0.95)');
      grad.addColorStop(0.4, 'rgba(190, 100, 255, 0.7)');
      grad.addColorStop(1, 'rgba(30, 0, 100, 0)');
    } else {
      // Lv 3 Mega Spark
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.3, 'rgba(90, 220, 255, 0.9)');
      grad.addColorStop(0.7, 'rgba(230, 80, 255, 0.8)');
      grad.addColorStop(1, 'rgba(50, 0, 120, 0)');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // 4-Pointed Star (Classic Gemini Emblem)
    ctx.save();
    ctx.translate(half, half);
    ctx.beginPath();
    const rLong = half * 0.82;
    const rShort = half * 0.22;
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      ctx.lineTo(Math.cos(angle) * rLong, Math.sin(angle) * rLong);
      const midAngle = angle + Math.PI / 4;
      ctx.lineTo(Math.cos(midAngle) * rShort, Math.sin(midAngle) * rShort);
    }
    ctx.closePath();

    // Prism gradient fill
    const starGrad = ctx.createLinearGradient(-half, -half, half, half);
    starGrad.addColorStop(0, '#4285f4');
    starGrad.addColorStop(0.5, '#9b72cb');
    starGrad.addColorStop(1, '#d96570');
    ctx.fillStyle = starGrad;
    ctx.fill();

    // Radiant White Core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, half * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    this.cache.set(key, c);
  }

  // --- 4. Enemy GenAI Logos (2026 Lineup) ---

  // GPT-6 Luna: White/cyan high-speed crescent interceptor
  private createGPT6Luna(): void {
    const [c, ctx] = this.createCanvas(24, 24);
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(12, 12, 10, 0, Math.PI * 2);
    ctx.fill();

    // Crescent cut
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(12, 12, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(9, 10, 7.5, 0, Math.PI * 2);
    ctx.fill();

    // Central spark
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(14, 11, 3, 3);
    this.cache.set('GPT6_LUNA', c);
  }

  // GPT-6 Terra: Heavy slate/gold armored assault ship
  private createGPT6Terra(): void {
    const [c, ctx] = this.createCanvas(34, 34);
    // Octagonal heavy armor
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(10, 2); ctx.lineTo(24, 2);
    ctx.lineTo(32, 10); ctx.lineTo(32, 24);
    ctx.lineTo(24, 32); ctx.lineTo(10, 32);
    ctx.lineTo(2, 24); ctx.lineTo(2, 10);
    ctx.closePath();
    ctx.fill();

    // Gold reinforcement bars
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(6, 6, 22, 4);
    ctx.fillRect(6, 24, 22, 4);
    ctx.fillRect(15, 2, 4, 30);

    // Power core
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(17, 17, 5, 0, Math.PI * 2);
    ctx.fill();

    this.cache.set('GPT6_TERRA', c);
  }

  // GPT-6 Sol: High-power flagship cruiser with solar wings
  private createGPT6Sol(): void {
    const [c, ctx] = this.createCanvas(48, 48);
    // Outer solar corona
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(24, 24, 21, 0, Math.PI * 2);
    ctx.fill();

    // Armored inner ring
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(24, 24, 15, 0, Math.PI * 2);
    ctx.fill();

    // OpenAI Swirl Vortex
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.arc(24 + Math.cos(angle) * 7, 24 + Math.sin(angle) * 7, 6, angle, angle + Math.PI);
      ctx.stroke();
    }

    // White blinding fusion center
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(24, 24, 4, 0, Math.PI * 2);
    ctx.fill();

    this.cache.set('GPT6_SOL', c);
  }

  // DeepSeek V4.1-Flash: Blue whale hydrodynamic flanker
  private createDeepSeekFlash(): void {
    const [c, ctx] = this.createCanvas(28, 28);
    // Blue whale body
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.ellipse(14, 14, 12, 8, -Math.PI / 10, 0, Math.PI * 2);
    ctx.fill();

    // White belly
    ctx.fillStyle = '#bae6fd';
    ctx.beginPath();
    ctx.ellipse(14, 17, 9, 4, 0, 0, Math.PI);
    ctx.fill();

    // Tail & fin
    ctx.fillStyle = '#0369a1';
    ctx.beginPath();
    ctx.moveTo(2, 14); ctx.lineTo(-2, 8); ctx.lineTo(0, 14); ctx.lineTo(-2, 20);
    ctx.closePath();
    ctx.fill();

    // Eye
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(20, 11, 2, 2);

    this.cache.set('DEEPSEEK_FLASH', c);
  }

  // Kimi Moon: Moonshot AI glowing lunar sphere
  private createKimiMoon(): void {
    const [c, ctx] = this.createCanvas(26, 26);
    // Lunar disk
    ctx.fillStyle = '#6366f1';
    ctx.beginPath();
    ctx.arc(13, 13, 11, 0, Math.PI * 2);
    ctx.fill();

    // Crater highlights
    ctx.fillStyle = '#a5b4fc';
    ctx.beginPath();
    ctx.arc(10, 9, 3, 0, Math.PI * 2);
    ctx.arc(17, 15, 4, 0, Math.PI * 2);
    ctx.arc(8, 17, 2, 0, Math.PI * 2);
    ctx.fill();

    // White crescent rim
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(13, 13, 10, -Math.PI / 3, Math.PI / 2);
    ctx.stroke();

    this.cache.set('KIMI_MOON', c);
  }

  // Qwen Cube: Isometric 3D rotating prism
  private createQwenCube(): void {
    const [c, ctx] = this.createCanvas(24, 24);
    // Top face
    ctx.fillStyle = '#9333ea';
    ctx.beginPath();
    ctx.moveTo(12, 3); ctx.lineTo(21, 8); ctx.lineTo(12, 13); ctx.lineTo(3, 8);
    ctx.closePath();
    ctx.fill();

    // Left face
    ctx.fillStyle = '#7e22ce';
    ctx.beginPath();
    ctx.moveTo(3, 8); ctx.lineTo(12, 13); ctx.lineTo(12, 21); ctx.lineTo(3, 16);
    ctx.closePath();
    ctx.fill();

    // Right face
    ctx.fillStyle = '#c084fc';
    ctx.beginPath();
    ctx.moveTo(21, 8); ctx.lineTo(12, 13); ctx.lineTo(12, 21); ctx.lineTo(21, 16);
    ctx.closePath();
    ctx.fill();

    this.cache.set('QWEN_CUBE', c);
  }

  // Mistral Flame: Pixelated stepped fire wings
  private createMistralFlame(): void {
    const [c, ctx] = this.createCanvas(24, 24);
    ctx.fillStyle = '#ea580c';
    // Stepped fire icon
    ctx.fillRect(10, 2, 4, 4);
    ctx.fillRect(8, 6, 8, 4);
    ctx.fillRect(6, 10, 12, 4);
    ctx.fillRect(4, 14, 16, 4);
    ctx.fillRect(2, 18, 6, 4);
    ctx.fillRect(16, 18, 6, 4);

    ctx.fillStyle = '#fde047';
    ctx.fillRect(10, 6, 4, 8);
    this.cache.set('MISTRAL_FLAME', c);
  }

  // Grok Raider: xAI minimalist sharp black/white angular slash-X
  private createGrokRaider(): void {
    const [c, ctx] = this.createCanvas(28, 28);
    ctx.fillStyle = '#000000';
    ctx.fillRect(2, 2, 24, 24);

    // Sharp white slash and chevron
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(4, 4); ctx.lineTo(24, 24);
    ctx.stroke();

    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(22, 6); ctx.lineTo(6, 22);
    ctx.stroke();

    // Red engine thruster
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(12, 23, 4, 3);
    this.cache.set('GROK_RAIDER', c);
  }

  // Cursor Probe: The iconic glowing cyan/white code bracket { } chevron
  private createCursorProbe(): void {
    const [c, ctx] = this.createCanvas(24, 24);
    // Dark diamond hull
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(12, 2); ctx.lineTo(22, 12); ctx.lineTo(12, 22); ctx.lineTo(2, 12);
    ctx.closePath();
    ctx.fill();

    // Cyan glowing bracket shapes
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 2;
    // Left {
    ctx.beginPath();
    ctx.moveTo(9, 7); ctx.lineTo(7, 9); ctx.lineTo(6, 12); ctx.lineTo(7, 15); ctx.lineTo(9, 17);
    ctx.stroke();
    // Right }
    ctx.beginPath();
    ctx.moveTo(15, 7); ctx.lineTo(17, 9); ctx.lineTo(18, 12); ctx.lineTo(17, 15); ctx.lineTo(15, 17);
    ctx.stroke();

    // Center cursor arrow
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(11, 9); ctx.lineTo(15, 13); ctx.lineTo(11, 14);
    ctx.closePath();
    ctx.fill();

    this.cache.set('CURSOR_PROBE', c);
  }

  // Copilot Glider: Fluent gradient dual-curved wing glider
  private createCopilotGlider(): void {
    const [c, ctx] = this.createCanvas(26, 26);
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(9, 13, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#7c3aed';
    ctx.beginPath();
    ctx.arc(17, 13, 8, 0, Math.PI * 2);
    ctx.fill();

    // Center visor
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(8, 11, 10, 4);

    this.cache.set('COPILOT_GLIDER', c);
  }

  // Claude Haiku: Nimble winged scout
  private createClaudeHaiku(): void {
    const [c, ctx] = this.createCanvas(22, 22);
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.moveTo(11, 2); ctx.lineTo(20, 18); ctx.lineTo(11, 14); ctx.lineTo(2, 18);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ea580c';
    ctx.fillRect(9, 7, 4, 5);
    this.cache.set('CLAUDE_HAIKU', c);
  }

  // Claude Sonnet: Hexagonal balanced battle cruiser
  private createClaudeSonnet(): void {
    const [c, ctx] = this.createCanvas(28, 28);
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = 14 + Math.cos(angle) * 11;
      const y = 14 + Math.sin(angle) * 11;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffedd5';
    ctx.beginPath();
    ctx.arc(14, 14, 5, 0, Math.PI * 2);
    ctx.fill();
    this.cache.set('CLAUDE_SONNET', c);
  }

  // Claude Opus: Heavy 8-pointed octagonal dreadnought
  private createClaudeOpus(): void {
    const [c, ctx] = this.createCanvas(38, 38);
    ctx.fillStyle = '#c2410c';
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const x = 19 + Math.cos(angle) * 16;
      const y = 19 + Math.sin(angle) * 16;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#fdba74';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(19, 19, 10, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(17, 17, 4, 4);
    this.cache.set('CLAUDE_OPUS', c);
  }

  // Claude Fable: Apex Radiant Sunburst Insignia (Flagship Top Tier)
  private createClaudeFable(): void {
    const [c, ctx] = this.createCanvas(48, 48);
    // Outer golden aura
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6;
      const r = i % 2 === 0 ? 22 : 15;
      const x = 24 + Math.cos(angle) * r;
      const y = 24 + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    // Terracotta inner sunburst
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.arc(24, 24, 13, 0, Math.PI * 2);
    ctx.fill();

    // Pure white diamond apex core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(24, 17); ctx.lineTo(31, 24); ctx.lineTo(24, 31); ctx.lineTo(17, 24);
    ctx.closePath();
    ctx.fill();

    this.cache.set('CLAUDE_FABLE', c);
  }

  // Mini-clone projectile / bullet
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

  // Barrow Radar Dome
  private createBarrowRadar(): void {
    const [c, ctx] = this.createCanvas(32, 32);
    // Base ring
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(16, 18, 12, 0, Math.PI * 2);
    ctx.fill();

    // Metallic dome
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(16, 16, 9, 0, Math.PI * 2);
    ctx.fill();

    // Rotating antenna line
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(16, 16); ctx.lineTo(23, 11);
    ctx.stroke();

    this.cache.set('BARROW', c);
  }

  // Sol Citadel (Emerging golden pyramid)
  private createSolCitadel(): void {
    const [c, ctx] = this.createCanvas(32, 32);
    // Octagonal base
    ctx.fillStyle = '#78350f';
    ctx.fillRect(4, 4, 24, 24);

    // Tier 1
    ctx.fillStyle = '#b45309';
    ctx.fillRect(7, 7, 18, 18);

    // Tier 2
    ctx.fillStyle = '#d97706';
    ctx.fillRect(10, 10, 12, 12);

    // Tip
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(13, 13, 6, 6);

    this.cache.set('SOL_CITADEL', c);
  }

  // Datacenter Server Rack
  private createServerRack(): void {
    const [c, ctx] = this.createCanvas(28, 28);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(3, 2, 22, 24);

    // Rack slots & blinking LEDs
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

  // AI Chip Silicon Wafer
  private createAIChip(): void {
    const [c, ctx] = this.createCanvas(28, 28);
    // Green PCB
    ctx.fillStyle = '#14532d';
    ctx.fillRect(3, 3, 22, 22);

    // Golden connector pins
    ctx.fillStyle = '#eab308';
    for (let p = 5; p <= 21; p += 3) {
      ctx.fillRect(p, 1, 2, 2);
      ctx.fillRect(p, 25, 2, 2);
      ctx.fillRect(1, p, 2, 2);
      ctx.fillRect(25, p, 2, 2);
    }

    // Black central die
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(8, 8, 12, 12);

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(11, 11, 6, 6);

    this.cache.set('AI_CHIP', c);
  }
}
