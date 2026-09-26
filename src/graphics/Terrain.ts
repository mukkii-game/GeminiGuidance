/**
 * Authentic 1983 Namco Xevious-style Vertical Scrolling Terrain Engine
 * Features:
 * - Stage 1: Dense Pine Forests, Winding Blue River with Sandbanks, Stone Bridges, and Earth Paths.
 * - Stage 2: Expansive Rolling Sand Dunes, Desert Oasis, and Space Launchpads.
 * - Stage 3: Woodland River Valley, Forest Groves, and Military Roadways.
 * - Stage 4: Desert Airfield Fortresses, Paved Runways, and Pine Perimeter Groves.
 * Strictly NO flying Nazca lines or cyber grids.
 */
export class TerrainEngine {
  private width: number;
  private height: number;
  private scrollY: number = 0;
  private scrollSpeed: number = 0.25;
  private patternCanvas: HTMLCanvasElement;
  private patternCtx: CanvasRenderingContext2D;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;

    this.patternCanvas = document.createElement('canvas');
    this.patternCanvas.width = width;
    this.patternCanvas.height = height * 2; // Seamless wrap buffer
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

  public render(ctx: CanvasRenderingContext2D, _stage: number): void {
    const yOffset = Math.floor(this.scrollY);

    // Draw wrapped seamless terrain
    ctx.drawImage(
      this.patternCanvas,
      0, this.height - yOffset, this.width, this.height,
      0, 0, this.width, this.height
    );
  }

  private generateTerrainMap(stage: number): void {
    const ctx = this.patternCtx;
    const w = this.width;
    const h = this.height * 2;

    ctx.clearRect(0, 0, w, h);

    if (stage === 1) {
      // --- STAGE 1: Xevious Classic Forest & River (チャイナ・シンドローム) ---
      // 1. Base Earth & Grassland
      ctx.fillStyle = '#6b5839'; // Warm earth brown base
      ctx.fillRect(0, 0, w, h);

      // Grassland patches
      for (let y = 0; y < h; y += 16) {
        for (let x = 0; x < w; x += 16) {
          const noise = Math.sin(x * 0.04) * Math.cos(y * 0.04);
          if (noise > -0.25) {
            ctx.fillStyle = noise > 0.3 ? '#2e6b2e' : '#265926';
            ctx.fillRect(x, y, 16, 16);
          }
        }
      }

      // 2. Earth Dirt Road winding vertically
      ctx.strokeStyle = '#8c734b';
      ctx.lineWidth = 20;
      ctx.beginPath();
      for (let y = 0; y <= h; y += 20) {
        const roadX = w * 0.22 + Math.sin(y * 0.012) * 24;
        if (y === 0) ctx.moveTo(roadX, y);
        else ctx.lineTo(roadX, y);
      }
      ctx.stroke();

      // 3. Winding Xevious Blue River
      const getRiverX = (y: number) => w * 0.58 + Math.sin(y * 0.007) * 55 + Math.cos(y * 0.02) * 18;

      // Sandy shores / banks along river
      ctx.strokeStyle = '#d4be92';
      ctx.lineWidth = 48;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let y = 0; y <= h; y += 20) {
        const rx = getRiverX(y);
        if (y === 0) ctx.moveTo(rx, y);
        else ctx.lineTo(rx, y);
      }
      ctx.stroke();

      // Deep River Core
      ctx.strokeStyle = '#1d4ed8';
      ctx.lineWidth = 36;
      ctx.beginPath();
      for (let y = 0; y <= h; y += 20) {
        const rx = getRiverX(y);
        if (y === 0) ctx.moveTo(rx, y);
        else ctx.lineTo(rx, y);
      }
      ctx.stroke();

      // Azure river highlights
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 14;
      ctx.beginPath();
      for (let y = 0; y <= h; y += 20) {
        const rx = getRiverX(y) - 6;
        if (y === 0) ctx.moveTo(rx, y);
        else ctx.lineTo(rx, y);
      }
      ctx.stroke();

      // 4. Stone Bridges crossing the river
      for (let by = 180; by < h; by += 340) {
        const rx = getRiverX(by);
        ctx.fillStyle = '#334155';
        ctx.fillRect(rx - 32, by - 12, 64, 24);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(rx - 30, by - 10, 60, 20);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(rx - 28, by - 8, 56, 3);
        ctx.fillRect(rx - 28, by + 5, 56, 3);
      }

      // 5. Pine Tree Clusters (Classic Xevious rounded tree canopies)
      for (let i = 0; i < 110; i++) {
        const tx = (i * 73) % (w - 36) + 12;
        const ty = (i * 97) % (h - 36) + 12;
        const rx = getRiverX(ty);
        if (Math.abs(tx - rx) > 42) {
          this.drawXeviousTree(ctx, tx, ty);
        }
      }

    } else if (stage === 2) {
      // --- STAGE 2: Vast Desert & Elon's Launchpad (イーロンズ・ゲート) ---
      // 1. Ochre Desert Base
      ctx.fillStyle = '#b45309';
      ctx.fillRect(0, 0, w, h);

      // Sand Dune ridges
      for (let y = 0; y < h; y += 45) {
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(w * 0.35, y + 28, w * 0.65, y - 24, w, y + 14);
        ctx.lineTo(w, y + 26);
        ctx.bezierCurveTo(w * 0.65, y - 10, w * 0.35, y + 42, 0, y + 26);
        ctx.closePath();
        ctx.fill();
      }

      // Wind ripple highlights
      ctx.fillStyle = '#fbbf24';
      for (let i = 0; i < 160; i++) {
        const rx = (i * 43) % w;
        const ry = (i * 83) % h;
        ctx.fillRect(rx, ry, 12, 2);
      }

      // 2. Concrete Rocket Runway & Launch Strip
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(w * 0.36, 0, w * 0.28, h);
      ctx.fillStyle = '#334155';
      ctx.fillRect(w * 0.38, 0, w * 0.24, h);

      // Runway markings
      ctx.fillStyle = '#f8fafc';
      for (let y = 20; y < h; y += 60) {
        ctx.fillRect(w * 0.49, y, 6, 26);
      }

      // Launch pads with flame blast trenches
      for (let py = 150; py < h; py += 320) {
        ctx.fillStyle = '#475569';
        ctx.fillRect(w * 0.28, py, 40, 40);
        ctx.fillRect(w * 0.62, py, 40, 40);

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(w * 0.28, py, 40, 40);
        ctx.strokeRect(w * 0.62, py, 40, 40);
      }

    } else if (stage === 3) {
      // --- STAGE 3: Woodland River Valley (ザ・ファブル) ---
      ctx.fillStyle = '#4a5d3e'; // Dense woodland earth
      ctx.fillRect(0, 0, w, h);

      // Split double rivers
      const river1 = (y: number) => w * 0.30 + Math.sin(y * 0.009) * 35;
      const river2 = (y: number) => w * 0.72 + Math.cos(y * 0.009) * 35;

      for (const getR of [river1, river2]) {
        ctx.strokeStyle = '#c5b48e';
        ctx.lineWidth = 36;
        ctx.beginPath();
        for (let y = 0; y <= h; y += 20) {
          const rx = getR(y);
          if (y === 0) ctx.moveTo(rx, y);
          else ctx.lineTo(rx, y);
        }
        ctx.stroke();

        ctx.strokeStyle = '#1e40af';
        ctx.lineWidth = 26;
        ctx.beginPath();
        for (let y = 0; y <= h; y += 20) {
          const rx = getR(y);
          if (y === 0) ctx.moveTo(rx, y);
          else ctx.lineTo(rx, y);
        }
        ctx.stroke();
      }

      // Forest clumps
      for (let i = 0; i < 90; i++) {
        const tx = (i * 61) % (w - 30) + 10;
        const ty = (i * 89) % (h - 30) + 10;
        if (Math.abs(tx - river1(ty)) > 30 && Math.abs(tx - river2(ty)) > 30) {
          this.drawXeviousTree(ctx, tx, ty);
        }
      }

    } else {
      // --- STAGE 4: Desert Airfield Fortress (魔法使いチャッピー) ---
      // Sandy Desert Plains
      ctx.fillStyle = '#a16207';
      ctx.fillRect(0, 0, w, h);

      // Desert sand dunes
      for (let y = 0; y < h; y += 50) {
        ctx.fillStyle = '#ca8a04';
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(w * 0.4, y + 20, w * 0.6, y - 20, w, y + 10);
        ctx.lineTo(w, y + 18);
        ctx.bezierCurveTo(w * 0.6, y - 10, w * 0.4, y + 30, 0, y + 18);
        ctx.closePath();
        ctx.fill();
      }

      // Airbase runways (Xevious Andor Genesis airfield)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(w * 0.18, 0, 48, h);
      ctx.fillRect(w * 0.68, 0, 48, h);

      ctx.fillStyle = '#334155';
      ctx.fillRect(w * 0.20, 0, 44, h);
      ctx.fillRect(w * 0.70, 0, 44, h);

      // Runway dashed lines
      ctx.fillStyle = '#fef08a';
      for (let y = 10; y < h; y += 40) {
        ctx.fillRect(w * 0.25, y, 4, 18);
        ctx.fillRect(w * 0.75, y, 4, 18);
      }

      // Oasis tree groves along the perimeter
      for (let i = 0; i < 50; i++) {
        const tx = (i * 53) % (w - 24) + 8;
        const ty = (i * 79) % (h - 24) + 8;
        if (tx < w * 0.16 || (tx > w * 0.35 && tx < w * 0.65) || tx > w * 0.84) {
          this.drawXeviousTree(ctx, tx, ty);
        }
      }
    }
  }

  // Authentic 1983 Namco Xevious Tree Canopy with Bevel and Drop-Shadow
  private drawXeviousTree(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // 1. Southeast Drop-shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.arc(x + 10, y + 10, 9, 0, Math.PI * 2);
    ctx.fill();

    // 2. Base Dark Green foliage
    ctx.fillStyle = '#14532d';
    ctx.beginPath();
    ctx.arc(x + 7, y + 7, 8, 0, Math.PI * 2);
    ctx.fill();

    // 3. Mid Forest Green
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(x + 6, y + 6, 7, 0, Math.PI * 2);
    ctx.fill();

    // 4. Northwest Light Green Sunlit Highlight
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(x + 4, y + 4, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // 5. Specular Glint
    ctx.fillStyle = '#86efac';
    ctx.fillRect(x + 3, y + 3, 2, 2);
  }
}
