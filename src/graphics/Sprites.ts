/**
 * High-definition Retro Arcade Sprite Generator
 * 100% Genuine 1983 Arcade Pixel Art for Player Craft (Solvalou) & Ground Targets
 * 100% Official Vector Logos for Generative AI Enemy Factions (Strictly No Arrangement / アレンジ禁止)
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
    // 1. Solvalou Player Ship (Authentic 1983 Arcade Pixel Art Matrix)
    this.createPlayerShip('PLAYER_CENTER', 0);
    this.createPlayerShip('PLAYER_LEFT', -1);
    this.createPlayerShip('PLAYER_RIGHT', 1);

    // 2. Ground Sight & Blaster Bomb
    this.createGroundSight();
    this.createBlasterBomb();

    // 3. Mini-Clone Sparoid (Xevious pure glowing white diamond bullet)
    this.createMiniClone();

    // 4. Ground Targets (Official AI Logos embedded in Xevious Bunker Fortresses)
    this.createGroundLogoBase('NVIDIA_BASE', './assets/logos/nvidia.svg', '#76b900');
    this.createGroundLogoBase('META_BASE', './assets/logos/meta.svg', '#0081fb');
    this.createGroundLogoBase('HUGGINGFACE_BASE', './assets/logos/huggingface.svg', '#ffd21e');
    this.createGroundLogoBase('STABILITY_BASE', './assets/logos/stability.svg', '#a855f7');
    this.createSolCitadel();

    // 5. Google Gemini Orbs (Official 4-point concave sparkle)
    this.createGeminiOrb('GEMINI_LV1', 1);
    this.createGeminiOrb('GEMINI_LV2', 2);
    this.createGeminiOrb('GEMINI_LV3', 3);

    // 6. SpaceX Starship Rocket
    this.createSpaceXRocket();

    // 7. Official GenAI Enemy Logos (Strictly Official, No Creative Arrangement)
    this.loadOfficialLogos();
  }

  // --- 1. Solvalou Player Ship: Authentic 1983 Arcade Pixel Art (ドット絵) ---
  private createPlayerShip(key: string, tilt: number): void {
    const [c, ctx] = this.createCanvas(32, 32);

    const PALETTE: Record<string, string> = {
      '.': 'transparent',
      '#': '#0f172a', // Dark crisp arcade outline
      'W': '#ffffff', // Pure white highlight
      'H': '#e2e8f0', // Silver white primary armor
      'S': '#94a3b8', // Steel gray mid-tone
      'D': '#475569', // Gunmetal dark shadow
      'C': '#06b6d4', // Cyan cockpit canopy
      'B': '#0369a1', // Deep blue canopy frame
      'R': '#ef4444', // Red wingtip accent
      'T': '#f97316', // Thruster flame
    };

    const SOLVALOU_CENTER = [
      "..........####..........",
      ".........#HHWW#.........",
      "........#HHWWSS#........",
      "........#HHWWSS#........",
      ".......#HHWWWSSD#.......",
      ".......#HCCCCBSSD#......",
      "......#HHCCCCBSSSD#.....",
      "......#HCCCCCCBSSD#.....",
      ".....#HHCCCCCCBSSSD#....",
      ".....#HHCCCCCCBSSSD#....",
      "....#HHHCCCCCCBSSSSD#...",
      "....#HHHHBBBBBBSSSSD#...",
      "...#HHHHHSSSSSSSSSSD#...",
      "..#HHHHHHSSSSSSSSSSSD#..",
      ".#RHHHHHHSSSSSSSSSSSDDR#",
      "#RRHHHHHHSSSSSSSSSSSDDRR",
      "#RRHHHHHHSSSSSSSSSSSDDRR",
      "#####HHHHSSSSSSDDDD#####",
      "....#HHSS#....#SSDD#....",
      "....#HHSS#....#SSDD#....",
      "....#HHSS#....#SSDD#....",
      ".....#TT#......#TT#.....",
      ".....#TT#......#TT#.....",
      "......##........##......"
    ];

    const SOLVALOU_LEFT = [
      "...........###..........",
      "..........#HWW#.........",
      ".........#HHWWS#........",
      ".........#HHWWS#........",
      "........#HHWWSSD#.......",
      "........#HCCCBSSD#......",
      ".......#HHCCCBSSSD#.....",
      ".......#HCCCCBSSSD#.....",
      "......#HHCCCCBSSSSD#....",
      "......#HHCCCCBSSSSD#....",
      ".....#HHHCCCCBSSSSSD#...",
      ".....#HHHBBBBBSSSSSD#...",
      "....#HHHHSSSSSSSSSSD#...",
      "...#HHHHHSSSSSSSSSSSD#..",
      "..#RHHHHHSSSSSSSSSSDDR#.",
      ".#RRHHHHHSSSSSSSSSSDDRR#",
      "#RRRHHHHHSSSSSSSSSSDDRR#",
      "#####HHHHSSSSSSDDD######",
      "....#HHSS#....#SSDD#....",
      "....#HHSS#....#SSDD#....",
      "....#HHSS#.....#SDD#....",
      ".....#TT#.......#T#.....",
      ".....#TT#.......#T#.....",
      "......##.........#......"
    ];

    const SOLVALOU_RIGHT = [
      "..........###...........",
      ".........#WWH#..........",
      "........#SWWHH#.........",
      "........#SWWHH#.........",
      ".......#DSSWWHH#........",
      "......#DSSBCCCH#........",
      ".....#DSSSBCCHH#........",
      ".....#DSSSBCCHH#........",
      "....#DSSSSBCCCCH#.......",
      "....#DSSSSBCCCCH#.......",
      "...#DSSSSSBCCCCHHH#.....",
      "...#DSSSSSBBBBBHHH#.....",
      "...#DSSSSSSSSSSHHHH#....",
      "..#DSSSSSSSSSSSHHHHH#...",
      ".#RDDSSSSSSSSSSHHHHHR#..",
      "#RRDDSSSSSSSSSSHHHHHRR#.",
      "#RRDDSSSSSSSSSSHHHHHRRR#",
      "######DDDSSSSSSHHHH#####",
      "....#DDSS#....#SSHH#....",
      "....#DDSS#....#SSHH#....",
      "....#DDS#.....#SSHH#....",
      ".....#T#.......#TT#.....",
      ".....#T#.......#TT#.....",
      "......#.........##......"
    ];

    const matrix = tilt === -1 ? SOLVALOU_LEFT : tilt === 1 ? SOLVALOU_RIGHT : SOLVALOU_CENTER;
    const offsetX = 4;
    const offsetY = 4;

    for (let r = 0; r < matrix.length; r++) {
      const row = matrix[r];
      for (let col = 0; col < row.length; col++) {
        const char = row[col];
        const color = PALETTE[char];
        if (color && color !== 'transparent') {
          ctx.fillStyle = color;
          ctx.fillRect(offsetX + col, offsetY + r, 1, 1);
        }
      }
    }

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

  // --- 3. Mini-Clone Sparoid Bullet (Xevious Authentic Pure White Glowing Diamond) ---
  private createMiniClone(): void {
    const [c, ctx] = this.createCanvas(12, 12);

    // Pure white glowing diamond
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(6, 1);
    ctx.lineTo(11, 6);
    ctx.lineTo(6, 11);
    ctx.lineTo(1, 6);
    ctx.closePath();
    ctx.fill();

    // Brilliant white sparkling core
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(4, 4, 4, 4);

    // Crisp silver border
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.stroke();

    this.cache.set('MINI_CLONE', c);
  }

  // --- 4. Ground Targets: Official GenAI Logos embedded in Xevious Octagon Bunkers ---
  private createGroundLogoBase(key: string, svgPath: string, accentColor: string): void {
    const size = 36;
    const [c, ctx] = this.createCanvas(size, size);
    this.cache.set(key, c);

    // 1. Xevious Stone Octagon Bunker Foundation
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(11, 2); ctx.lineTo(25, 2);
    ctx.lineTo(34, 11); ctx.lineTo(34, 25);
    ctx.lineTo(25, 34); ctx.lineTo(11, 34);
    ctx.lineTo(2, 25); ctx.lineTo(2, 11);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(12, 4); ctx.lineTo(24, 4);
    ctx.lineTo(32, 12); ctx.lineTo(32, 24);
    ctx.lineTo(24, 32); ctx.lineTo(12, 32);
    ctx.lineTo(4, 24); ctx.lineTo(4, 12);
    ctx.closePath();
    ctx.fill();

    // Accent rim ring
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Inner dark platform
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(8, 8, 20, 20);

    // Draw the official GenAI logo on top of the bunker
    const img = new Image();
    img.src = svgPath;
    img.onload = () => {
      ctx.drawImage(img, 9, 9, 18, 18);
    };
  }

  private createSolCitadel(): void {
    const [c, ctx] = this.createCanvas(32, 44);
    // Silver spire monolith
    ctx.fillStyle = '#475569';
    ctx.fillRect(8, 2, 16, 40);

    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(10, 4, 12, 36);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(12, 6, 4, 32);

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(14, 18, 4, 8);

    this.cache.set('SOL_CITADEL', c);
  }

  // --- 4.5. SpaceX Heavy Rocket ---
  private createSpaceXRocket(): void {
    const [c, ctx] = this.createCanvas(24, 76);
    // Rocket fairing nose cone
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(12, 2);
    ctx.lineTo(19, 16);
    ctx.lineTo(5, 16);
    ctx.closePath();
    ctx.fill();

    // Main fuselage cylinder
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(5, 16, 14, 46);

    // Black interstage band
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(5, 34, 14, 5);

    // Grid fins
    ctx.fillStyle = '#334155';
    ctx.fillRect(1, 20, 4, 6);
    ctx.fillRect(19, 20, 4, 6);

    // Base landing legs / fins
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(3, 54, 4, 10);
    ctx.fillRect(17, 54, 4, 10);

    // Rocket engine bells
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(7, 62, 10, 4);

    // Thrust flame
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(8, 66);
    ctx.lineTo(12, 75);
    ctx.lineTo(16, 66);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(9, 66);
    ctx.lineTo(12, 72);
    ctx.lineTo(15, 66);
    ctx.closePath();
    ctx.fill();

    this.cache.set('SPACEX_ROCKET', c);
  }

  // --- 5. Gemini Orbs (Official 4-Point Concave Sparkle) ---
  private createGeminiOrb(key: string, level: number): void {
    const size = level === 1 ? 32 : level === 2 ? 46 : 64;
    const [c, ctx] = this.createCanvas(size, size);
    this.cache.set(key, c);

    const pad = level === 1 ? 3 : level === 2 ? 4 : 5;
    const innerSize = size - pad * 2;

    const img = new Image();
    img.src = './assets/logos/gemini.svg';
    img.onload = () => {
      ctx.clearRect(0, 0, size, size);

      // Celestial radial halo
      const half = size / 2;
      const grad = ctx.createRadialGradient(half, half, 2, half, half, half);
      if (level === 1) {
        grad.addColorStop(0, 'rgba(0, 210, 255, 0.45)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (level === 2) {
        grad.addColorStop(0, 'rgba(168, 85, 247, 0.65)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
        grad.addColorStop(0.5, 'rgba(236, 72, 153, 0.7)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);

      ctx.drawImage(img, pad, pad, innerSize, innerSize);
    };

    // Instant mathematical fallback
    const half = size / 2;
    ctx.save();
    ctx.translate(half, half);
    ctx.beginPath();
    const R = half * 0.82;
    ctx.moveTo(0, -R);
    ctx.quadraticCurveTo(0, 0, R, 0);
    ctx.quadraticCurveTo(0, 0, 0, R);
    ctx.quadraticCurveTo(0, 0, -R, 0);
    ctx.quadraticCurveTo(0, 0, 0, -R);
    ctx.closePath();
    ctx.fillStyle = level === 1 ? '#00d2ff' : level === 2 ? '#a855f7' : '#ec4899';
    ctx.fill();
    ctx.restore();
  }

  // --- 6. Official GenAI Enemy Logos (Strictly Official, No Creative Arrangement) ---
  private loadOfficialLogos(): void {
    // OpenAI Rosette Official Paths
    const OPENAI_PATH = "M9.205 8.658v-2.26c0-.19.072-.333.238-.428l4.543-2.616c.619-.357 1.356-.523 2.117-.523 2.854 0 4.662 2.212 4.662 4.566 0 .167 0 .357-.024.547l-4.71-2.759a.797.797 0 00-.856 0l-5.97 3.473zm10.609 8.8V12.06c0-.333-.143-.57-.429-.737l-5.97-3.473 1.95-1.118a.433.433 0 01.476 0l4.543 2.617c1.309.76 2.189 2.378 2.189 3.948 0 1.808-1.07 3.473-2.76 4.163zM7.802 12.703l-1.95-1.142c-.167-.095-.239-.238-.239-.428V5.899c0-2.545 1.95-4.472 4.591-4.472 1 0 1.927.333 2.712.928L8.23 5.067c-.285.166-.428.404-.428.737v6.898zM12 15.128l-2.795-1.57v-3.33L12 8.658l2.795 1.57v3.33L12 15.128zm1.796 7.23c-1 0-1.927-.332-2.712-.927l4.686-2.712c.285-.166.428-.404.428-.737v-6.898l1.974 1.142c.167.095.238.238.238.428v5.233c0 2.545-1.974 4.472-4.614 4.472zm-5.637-5.303l-4.544-2.617c-1.308-.761-2.188-2.378-2.188-3.948A4.482 4.482 0 014.21 6.327v5.423c0 .333.143.571.428.738l5.947 3.449-1.95 1.118a.432.432 0 01-.476 0zm-.262 3.9c-2.688 0-4.662-2.021-4.662-4.519 0-.19.024-.38.047-.57l4.686 2.71c.286.167.571.167.856 0l5.97-3.448v2.26c0 .19-.07.333-.237.428l-4.543 2.616c-.619.357-1.356.523-2.117.523zm5.899 2.83a5.947 5.947 0 005.827-4.756C22.287 18.339 24 15.84 24 13.296c0-1.665-.713-3.282-1.998-4.448.119-.5.19-.999.19-1.498 0-3.401-2.759-5.947-5.946-5.947-.642 0-1.26.095-1.88.31A5.962 5.962 0 0010.205 0a5.947 5.947 0 00-5.827 4.757C1.713 5.447 0 7.945 0 10.49c0 1.666.713 3.283 1.998 4.448-.119.5-.19 1-.19 1.499 0 3.401 2.759 5.946 5.946 5.946.642 0 1.26-.095 1.88-.309a5.96 5.96 0 004.162 1.713z";

    // Claude Sunburst Official Path
    const CLAUDE_PATH = "M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z";

    // Grok Slash-X Official Path
    const GROK_PATH = "M6.469 8.776L16.512 23h-4.464L2.005 8.776H6.47zm-.004 7.9l2.233 3.164L6.467 23H2l4.465-6.324zM22 2.582V23h-3.659V7.764L22 2.582zM22 1l-9.952 14.095-2.233-3.163L17.533 1H22z";

    // DeepSeek Blue Whale Official Path
    const DEEPSEEK_PATH = "M23.748 4.482c-.254-.124-.364.113-.512.234-.051.039-.094.09-.137.136-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.156-.708-.311-.955-.65-.172-.241-.219-.51-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.093.172.187.129.323-.082.28-.18.552-.266.833-.055.179-.137.217-.329.14a5.526 5.526 0 01-1.736-1.18c-.857-.828-1.631-1.742-2.597-2.458a11.365 11.365 0 00-.689-.471c-.985-.957.13-1.743.388-1.836.27-.098.093-.432-.779-.428-.872.004-1.67.295-2.687.684a3.055 3.055 0 01-.465.137 9.597 9.597 0 00-2.883-.102c-1.885.21-3.39 1.102-4.497 2.623C.082 8.606-.231 10.684.152 12.85c.403 2.284 1.569 4.175 3.36 5.653 1.858 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.133-.284 4.994-1.86.47.234.962.327 1.78.397.63.059 1.236-.03 1.705-.128.735-.156.684-.837.419-.961-2.155-1.004-1.682-.595-2.113-.926 1.096-1.296 2.746-2.642 3.392-7.003.05-.347.007-.565 0-.845-.004-.17.035-.237.23-.256a4.173 4.173 0 001.545-.475c1.396-.763 1.96-2.015 2.093-3.517.02-.23-.004-.467-.247-.588z";

    // Perplexity Official Path
    const PERPLEXITY_PATH = "M19.785 0v7.272H22.5V17.62h-2.935V24l-7.037-6.194v6.145h-1.091v-6.152L4.392 24v-6.465H1.5V7.188h2.884V0l7.053 6.494V.19h1.09v6.49L19.786 0zm-7.257 9.044v7.319l5.946 5.234V14.44l-5.946-5.397zm-1.099-.08l-5.946 5.398v7.235l5.946-5.234V8.965zm8.136 7.58h1.844V8.349H13.46l6.105 5.54v2.655zm-8.982-8.28H2.59v8.195h1.8v-2.576l6.192-5.62zM5.475 2.476v4.71h5.115l-5.115-4.71zm13.219 0l-5.115 4.71h5.115v-4.71z";

    // Kimi Official Path
    const KIMI_PATH = "M11.065 11.199l7.257-7.2c.137-.136.06-.41-.116-.41H14.3a.164.164 0 00-.117.051l-7.82 7.756c-.122.12-.302.013-.302-.179V3.82c0-.127-.083-.23-.185-.23H3.186c-.103 0-.186.103-.186.23V19.77c0 .128.083.23.186.23h2.69c.103 0 .186-.102.186-.23v-3.25c0-.069.025-.135.069-.178l2.424-2.406a.158.158 0 01.205-.023l6.484 4.772a7.677 7.677 0 003.453 1.283c.108.012.2-.095.2-.23v-3.06c0-.117-.07-.212-.164-.227a5.028 5.028 0 01-2.027-.807l-5.613-4.064c-.117-.078-.132-.279-.028-.381z";

    // 1. OpenAI Hierarchy (Enlarged prominent logos)
    this.registerSvgSprite('GPT6_LUNA', 44, 44, './assets/logos/openai_luna.svg', OPENAI_PATH, '#10a37f');
    this.registerSvgSprite('GPT6_TERRA', 58, 58, './assets/logos/openai_terra.svg', OPENAI_PATH, '#38bdf8');
    this.registerSvgSprite('GPT6_SOL', 76, 76, './assets/logos/openai_sol.svg', OPENAI_PATH, '#fbbf24');
    this.registerSvgSprite('GPT6_ASTRA', 84, 84, './assets/logos/openai_astra.svg', OPENAI_PATH, '#ffffff');

    // 2. Anthropic Claude Hierarchy (Fable > Opus > Sonnet > Haiku)
    this.registerSvgSprite('CLAUDE_HAIKU', 42, 42, './assets/logos/claude_haiku.svg', CLAUDE_PATH, '#fca5a5');
    this.registerSvgSprite('CLAUDE_SONNET', 54, 54, './assets/logos/claude_sonnet.svg', CLAUDE_PATH, '#D97757');
    this.registerSvgSprite('CLAUDE_OPUS', 72, 72, './assets/logos/claude_opus.svg', CLAUDE_PATH, '#ea580c');
    this.registerSvgSprite('CLAUDE_FABLE', 84, 84, './assets/logos/claude_fable.svg', CLAUDE_PATH, '#fbbf24');

    // 3. Other Major AI Players (Enlarged)
    this.registerSvgSprite('DEEPSEEK_FLASH', 52, 44, './assets/logos/deepseek.svg', DEEPSEEK_PATH, '#4D6BFE');
    this.registerSvgSprite('GROK_RAIDER', 50, 50, './assets/logos/grok.svg', GROK_PATH, '#f8fafc');
    this.registerSvgSprite('CURSOR_PROBE', 46, 46, './assets/logos/cursor.svg');
    this.registerSvgSprite('MISTRAL_FLAME', 46, 46, './assets/logos/mistral.svg');
    this.registerSvgSprite('KIMI_MOON', 46, 46, './assets/logos/kimi.svg', KIMI_PATH, '#1783FF');
    this.registerSvgSprite('COPILOT_GLIDER', 48, 48, './assets/logos/copilot.svg');
    this.registerSvgSprite('PERPLEXITY_SPINNER', 48, 48, './assets/logos/perplexity.svg', PERPLEXITY_PATH, '#22B8CD');
    this.registerSvgSprite('QWEN_CUBE', 46, 46, './assets/logos/qwen.svg');
  }

  private registerSvgSprite(key: string, w: number, h: number, svgPath: string, fallbackPath?: string, fallbackColor?: string): void {
    const [c, ctx] = this.createCanvas(w, h);
    this.cache.set(key, c);

    // Immediate fallback using standard Path2D
    if (fallbackPath) {
      ctx.save();
      ctx.fillStyle = fallbackColor || '#ffffff';
      ctx.scale(w / 24, h / 24);
      ctx.fill(new Path2D(fallbackPath));
      ctx.restore();
    }

    // Load authentic vector SVG directly from downloaded asset
    const img = new Image();
    img.src = svgPath;
    img.onload = () => {
      ctx.clearRect(0, 0, w, h);
      const pad = 1;
      ctx.drawImage(img, pad, pad, w - pad * 2, h - pad * 2);
    };
  }
}
