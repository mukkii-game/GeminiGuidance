/**
 * Authentic Retro Arcade Sound Engine (Xevious & Namco 1983 Era)
 * Combines curated retro sound effects from 効果音ラボ with
 * Web Audio API FM/PSG sound chip synthesis (Namco 15xx WSG emulation).
 */
export class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  public enabled: boolean = true;

  // Audio Buffers for curated retro assets
  private buffers: Map<string, AudioBuffer> = new Map();
  private loaded: boolean = false;

  private bgmInterval: number | null = null;
  private bgmStep: number = 0;
  private bgmRunning: boolean = false;

  private geminiOsc: OscillatorNode | null = null;
  private geminiGain: GainNode | null = null;

  constructor() {
    // Initialized on first user interaction
  }

  public init(): void {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.9, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.28, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);

      this.setupGeminiHum();
      this.loadSoundAssets();
    } catch (e) {
      console.warn('AudioContext init failed', e);
    }
  }

  public resume(): void {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggle(): boolean {
    this.enabled = !this.enabled;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.enabled ? 0.85 : 0.0, this.ctx.currentTime);
    }
    return this.enabled;
  }

  private async loadSoundAssets(): Promise<void> {
    if (this.loaded || !this.ctx) return;
    this.loaded = true;

    // Curated high-energy arcade sounds from 効果音ラボ
    const soundFiles: Record<string, string> = {
      bomb_crisp: './sounds/bomb1.mp3',             // チュドーン！ (Classic anime/arcade explosion)
      bomb_big: './sounds/big_explosion1.mp3',      // ドカーン！ (Boss & player destruction)
      beam_laser: './sounds/beamgun1.mp3',          // ビーム砲
      bullet_fire: './sounds/beamgun2.mp3',         // 敵Sparoid発射音
      hit_impact: './sounds/shot_struck1.mp3',      // 着弾・装甲ヒット音
      sound_wave: './sounds/sound_wave1.mp3',       // 怪音波・共鳴
      gemini_merge: './sounds/power_up1.mp3',       // パワーアップ
      gemini_whoosh: './sounds/speed_up1.mp3',      // スイング風切り音
      boss_alert: './sounds/boss_alert.mp3',        // 宇宙基地サイレン
      stage_clear: './sounds/levelup1.mp3',         // レベルアップ
      start_fanfare: './sounds/start_fanfare.mp3',  // 出撃ファンファーレ
      decision: './sounds/decision1.mp3',           // スタート音
      cursor: './sounds/cursor1.mp3',               // カーソル
    };

    for (const [key, path] of Object.entries(soundFiles)) {
      try {
        const resp = await fetch(path);
        if (resp.ok) {
          const arrayBuffer = await resp.arrayBuffer();
          const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
          this.buffers.set(key, audioBuffer);
        }
      } catch (err) {
        console.warn(`Failed to load sound ${key} from ${path}`, err);
      }
    }
  }

  private playBuffer(name: string, volume: number = 1.0, rate: number = 1.0): boolean {
    if (!this.enabled || !this.ctx || !this.sfxGain) return false;
    const buf = this.buffers.get(name);
    if (!buf) return false;

    const source = this.ctx.createBufferSource();
    source.buffer = buf;
    source.playbackRate.value = rate;

    const gain = this.ctx.createGain();
    gain.gain.value = volume;

    source.connect(gain);
    gain.connect(this.sfxGain);
    source.start();
    return true;
  }

  // --- Sound Effects ---

  /**
   * Signature 1983 Namco Blaster Bomb Drop Whistle
   * Emulates the Namco 15xx WSG falling chirp: 1400Hz -> 220Hz with 40Hz FM vibrato.
   */
  public playBlasterDrop(): void {
    if (!this.enabled || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    // FM vibrato
    lfo.frequency.setValueAtTime(42, now);
    lfoGain.gain.setValueAtTime(75, now);
    lfo.connect(osc.frequency);

    // Downward chirp sweep
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1450, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.30);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.30);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    lfo.start(now);
    osc.start(now);
    lfo.stop(now + 0.31);
    osc.stop(now + 0.31);
  }

  /** Ground target destruction impact (効果音ラボ 爆発1 チュドーン + Sub-bass thump) */
  public playGroundExplosion(): void {
    this.playBuffer('bomb_crisp', 1.0, 1.0);

    // Sub-bass thump
    if (this.ctx && this.sfxGain && this.enabled) {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.25);
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.26);
    }
  }

  /** Air enemy slice / destruction by Gemini orb (Punchy arcade shatter) */
  public playAirExplosion(): void {
    this.playBuffer('bomb_crisp', 0.85, 1.3);
    this.playBuffer('hit_impact', 0.95, 1.15);

    // Metal bite
    if (this.ctx && this.sfxGain && this.enabled) {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.14);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  }

  /** Enemy Sparoid white bullet firing */
  public playEnemyBulletFire(): void {
    this.playBuffer('bullet_fire', 0.4, 1.45);
  }

  /** Gemini swing whoosh */
  public playGeminiWhoosh(): void {
    this.playBuffer('gemini_whoosh', 0.45, 1.2);
  }

  /** Gemini fusion fanfare (効果音ラボ パワーアップ + Arpeggio) */
  public playGeminiMerge(level: number): void {
    const rate = 1.0 + (level - 1) * 0.15;
    this.playBuffer('gemini_merge', 0.95, rate);

    // Ascending arcade chime
    if (!this.enabled || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((pitch, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(pitch * (1 + (level - 1) * 0.18), now + i * 0.045);
      gain.gain.setValueAtTime(0.25, now + i * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.045 + 0.12);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + i * 0.045);
      osc.stop(now + i * 0.045 + 0.13);
    });
  }

  /** Boss alert siren */
  public playBossAlert(): void {
    if (this.playBuffer('boss_alert', 0.85)) return;

    if (!this.enabled || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.linearRampToValueAtTime(880, now + 0.4);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.41);
  }

  /** Game Start Fanfare */
  public playStartFanfare(): void {
    this.playBuffer('decision', 0.85);
    setTimeout(() => {
      this.playBuffer('start_fanfare', 0.85);
    }, 250);
  }

  /** Stage Clear Jingle */
  public playStageClear(): void {
    this.playBuffer('stage_clear', 0.9);
  }

  /** Player destruction */
  public playPlayerDeath(): void {
    this.playBuffer('bomb_big', 1.0, 0.85);
  }

  // --- Dynamic Gemini Celestial Hum ---
  private setupGeminiHum(): void {
    if (!this.ctx || !this.sfxGain) return;
    try {
      this.geminiOsc = this.ctx.createOscillator();
      this.geminiOsc.type = 'sine';
      this.geminiOsc.frequency.setValueAtTime(260, this.ctx.currentTime);

      this.geminiGain = this.ctx.createGain();
      this.geminiGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.geminiOsc.connect(this.geminiGain);
      this.geminiGain.connect(this.sfxGain);
      this.geminiOsc.start();
    } catch {
      // Ignored
    }
  }

  public updateGeminiHum(activeOrbsCount: number, averageSpeed: number): void {
    if (!this.ctx || !this.geminiGain || !this.geminiOsc) return;
    if (!this.enabled || activeOrbsCount === 0) {
      this.geminiGain.gain.setValueAtTime(0, this.ctx.currentTime);
      return;
    }
    const freq = Math.min(680, 240 + averageSpeed * 0.7 + activeOrbsCount * 35);
    const targetGain = Math.min(0.2, 0.035 * activeOrbsCount + (averageSpeed / 350) * 0.07);
    this.geminiOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.08);
    this.geminiGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.08);
  }

  // --- Background Music: Hypnotic Calm 80s Xevious-style Sequencer ---
  public startBgm(): void {
    if (this.bgmRunning) return;
    this.bgmRunning = true;
    this.bgmStep = 0;

    // Classic Xevious hypnotic bassline: calm, stately tempo
    const bassline = [110, 110, 164.8, 110, 130.8, 110, 146.8, 98];

    this.bgmInterval = window.setInterval(() => {
      if (!this.enabled || !this.ctx || !this.bgmGain) return;
      const now = this.ctx.currentTime;

      // Bass note (authentic triangle wave)
      const freq = bassline[this.bgmStep % bassline.length];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.26, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.17);

      osc.connect(gain);
      gain.connect(this.bgmGain);

      osc.start(now);
      osc.stop(now + 0.18);

      this.bgmStep++;
    }, 185); // Stately 81 BPM for authentic 1983 retro arcade feel
  }

  public stopBgm(): void {
    if (this.bgmInterval !== null) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.bgmRunning = false;
  }
}
