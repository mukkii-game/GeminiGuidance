/**
 * Xevious-style Retro Vertical Scrolling Terrain Engine
 * Features pine forests, winding rivers, sand dunes, and Nazca Ground Drawings (with AI parody glyphs)
 */
export class TerrainEngine {
  private width: number;
  private height: number;
  private scrollY: number = 0;
  private scrollSpeed: number = 1.0;
  private patternCanvas: HTMLCanvasElement;
  private patternCtx: CanvasRenderingContext2D;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;

    this.patternCanvas = document.createElement('canvas');
    this.patternCanvas.width = width;
    this.patternCanvas.height = height * 2; // seamless vertical wrapping loop
    this.patternCtx = this.patternCanvas.getContext('2d')!;
    this.patternCtx.imageSmoothingEnabled = false;

    this.generateTerrainMap(1);
  }

  public setStage(stage: number): void {
    this.scrollY = 0;
    this.generateTerrainMap(stage);
  }

  public update(dtFactor: number = 1.0): void {
    this.scrollY = (this.scrollY + this.scrollSpeed * dtFactor) % this.height;
  }

  public getScrollY(): number {
    return this.scrollY;
  }

  public render(ctx: CanvasRenderingContext2D, stage: number): void {
    const yOffset = Math.floor(this.scrollY);

    // Draw wrapped seamless terrain
    ctx.drawImage(
      this.patternCanvas,
      0, this.height - yOffset, this.width, this.height,
      0, 0, this.width, this.height
    );

    // Draw stage-specific Nazca ground glyphs & landmarks
    this.renderLandmarks(ctx, stage, yOffset);
  }

  private generateTerrainMap(stage: number): void {
    const ctx = this.patternCtx;
    const w = this.width;
    const h = this.height * 2;

    if (stage === 1) {
      // Stage 1: Dense Forest & River
      // Base Grassland
      ctx.fillStyle = '#1e3a1e';
      ctx.fillRect(0, 0, w, h);

      // Grass texture noise
      for (let y = 0; y < h; y += 8) {
        for (let x = 0; x < w; x += 8) {
          if ((x ^ y) % 13 === 0) {
            ctx.fillStyle = '#264826';
            ctx.fillRect(x, y, 8, 8);
          }
        }
      }

      // Winding River
      ctx.fillStyle = '#0f4c81';
      ctx.beginPath();
      for (let y = 0; y <= h; y += 20) {
        const riverX = w * 0.45 + Math.sin(y * 0.008) * 50 + Math.cos(y * 0.02) * 20;
        if (y === 0) ctx.moveTo(riverX, y);
        else ctx.lineTo(riverX, y);
      }
      ctx.lineWidth = 42;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#0284c7';
      ctx.stroke();

      // River Banks & Highlights
      ctx.lineWidth = 36;
      ctx.strokeStyle = '#38bdf8';
      ctx.stroke();

      // Bridges
      for (let bY = 200; bY < h; bY += 380) {
        const riverX = w * 0.45 + Math.sin(bY * 0.008) * 50 + Math.cos(bY * 0.02) * 20;
        ctx.fillStyle = '#64748b';
        ctx.fillRect(riverX - 28, bY - 8, 56, 16);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(riverX - 26, bY - 6, 52, 4);
      }

      // Pine Forest Clusters (Dense tree canopies with 80s 3D bevels)
      for (let t = 0; t < 120; t++) {
        const tx = (t * 71) % (w - 40) + 10;
        const ty = (t * 97) % (h - 40) + 10;
        // Don't draw trees inside the river
        const riverX = w * 0.45 + Math.sin(ty * 0.008) * 50 + Math.cos(ty * 0.02) * 20;
        if (Math.abs(tx - riverX) > 35) {
          this.drawTreeCanopy(ctx, tx, ty);
        }
      }

    } else if (stage === 2) {
      // Stage 2: Sand Dunes & Martian Red Wasteland
      ctx.fillStyle = '#92400e';
      ctx.fillRect(0, 0, w, h);

      // Sand Dune ridges
      for (let y = 0; y < h; y += 40) {
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(w * 0.3, y + 25, w * 0.7, y - 25, w, y + 10);
        ctx.lineTo(w, y + 25);
        ctx.bezierCurveTo(w * 0.7, y - 5, w * 0.3, y + 45, 0, y + 25);
        ctx.closePath();
        ctx.fill();
      }

      // Warm ripples
      ctx.fillStyle = '#d97706';
      for (let i = 0; i < 200; i++) {
        const rx = (i * 47) % w;
        const ry = (i * 89) % h;
        ctx.fillRect(rx, ry, 6, 2);
      }

    } else if (stage === 3) {
      // Stage 3: Anthropic Terracotta Tech Citadel
      ctx.fillStyle = '#451a03';
      ctx.fillRect(0, 0, w, h);

      // Circuit grid lines & optical channels
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      for (let x = 20; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0); ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 30; y < h; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y); ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Golden geometric nodes
      ctx.fillStyle = '#fbbf24';
      for (let x = 20; x < w; x += 40) {
        for (let y = 30; y < h; y += 60) {
          ctx.fillRect(x - 3, y - 3, 6, 6);
        }
      }

    } else {
      // Stage 4: GPT-6 Megastructure Mothership Hull
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, w, h);

      // Giant armor plating seams
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3;
      for (let y = 0; y < h; y += 90) {
        ctx.beginPath();
        ctx.moveTo(0, y); ctx.lineTo(w, y);
        ctx.stroke();
      }
      for (let x = 0; x < w; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0); ctx.lineTo(x, h);
        ctx.stroke();
      }

      // Glowing cyan data token pipelines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(w * 0.25, 0); ctx.lineTo(w * 0.25, h);
      ctx.moveTo(w * 0.75, 0); ctx.lineTo(w * 0.75, h);
      ctx.stroke();
    }
  }

  private drawTreeCanopy(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // 80s Namco-style rounded tree canopy with bevel
    ctx.fillStyle = '#064e3b'; // Shadow
    ctx.fillRect(x - 1, y - 1, 16, 16);

    ctx.fillStyle = '#047857'; // Base green
    ctx.fillRect(x, y, 14, 14);

    ctx.fillStyle = '#10b981'; // Top-left highlight
    ctx.fillRect(x, y, 8, 8);

    ctx.fillStyle = '#34d399'; // Glint dot
    ctx.fillRect(x + 2, y + 2, 3, 3);
  }

  // Draw Nazca Ground Drawings and Parody Glyphs
  private renderLandmarks(ctx: CanvasRenderingContext2D, stage: number, yOffset: number): void {
    ctx.save();

    if (stage === 1) {
      // Stage 1: Ancient Nazca Hummingbird (Classic Xevious Style)
      const glyphY = ((this.height * 1.5 - yOffset) % (this.height * 2) + this.height * 2) % (this.height * 2) - this.height * 0.5;
      if (glyphY > -100 && glyphY < this.height + 100) {
        this.drawNazcaBird(ctx, this.width * 0.78, glyphY);
      }
    } else if (stage === 2) {
      // Stage 2: Nazca Monkey + xAI 'X' + Cursor '{ }' AI Parody Glyphs in Desert
      const glyph1Y = ((this.height * 0.8 - yOffset) % (this.height * 2) + this.height * 2) % (this.height * 2) - this.height * 0.5;
      const glyph2Y = ((this.height * 1.6 - yOffset) % (this.height * 2) + this.height * 2) % (this.height * 2) - this.height * 0.5;

      if (glyph1Y > -100 && glyph1Y < this.height + 100) {
        this.drawNazcaGrokAndCursor(ctx, this.width * 0.3, glyph1Y);
      }
      if (glyph2Y > -100 && glyph2Y < this.height + 100) {
        this.drawNazcaNeuralNet(ctx, this.width * 0.65, glyph2Y);
      }
    }

    ctx.restore();
  }

  // Classic Nazca Bird
  private drawNazcaBird(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    // Beak
    ctx.moveTo(0, -30); ctx.lineTo(0, -10);
    // Wings
    ctx.lineTo(-25, 0); ctx.lineTo(0, 10); ctx.lineTo(25, 0); ctx.lineTo(0, -10);
    // Tail
    ctx.moveTo(0, 10); ctx.lineTo(0, 30);
    ctx.lineTo(-12, 36); ctx.moveTo(0, 30); ctx.lineTo(12, 36);
    ctx.stroke();
    ctx.restore();
  }

  // xAI 'X' and Cursor '{ }' etched into the desert
  private drawNazcaGrokAndCursor(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 3;

    // Huge Grok 'X'
    ctx.beginPath();
    ctx.moveTo(-20, -25); ctx.lineTo(20, 25);
    ctx.moveTo(18, -25); ctx.lineTo(-18, 25);
    ctx.stroke();

    // Cursor brackets '{ }' flanking it
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Left {
    ctx.moveTo(-28, -20); ctx.lineTo(-34, -10); ctx.lineTo(-38, 0); ctx.lineTo(-34, 10); ctx.lineTo(-28, 20);
    // Right }
    ctx.moveTo(28, -20); ctx.lineTo(34, -10); ctx.lineTo(38, 0); ctx.lineTo(34, 10); ctx.lineTo(28, 20);
    ctx.stroke();

    ctx.restore();
  }

  // Massive Neural Network Schematic etched in the sand
  private drawNazcaNeuralNet(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 1.5;

    const layers = [
      [-15, 0, 15],
      [-25, -10, 10, 25],
      [-15, 0, 15]
    ];
    const xs = [-25, 0, 25];

    // Synapse Lines
    for (let l = 0; l < 2; l++) {
      for (const y1 of layers[l]) {
        for (const y2 of layers[l + 1]) {
          ctx.beginPath();
          ctx.moveTo(xs[l], y1);
          ctx.lineTo(xs[l + 1], y2);
          ctx.stroke();
        }
      }
    }

    // Nodes
    ctx.fillStyle = '#fef08a';
    for (let l = 0; l < 3; l++) {
      for (const ny of layers[l]) {
        ctx.beginPath();
        ctx.arc(xs[l], ny, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}
