/**
 * High-quality Hybrid Sound Engine
 * Uses authentic sound effects from 効果音ラボ (Sound Effect Lab)
 * combined with Web Audio API for 80s arcade FM/PSG background music and hum.
 */
export class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  public enabled: boolean = true;

  // Audio Buffers for 効果音ラボ MP3 assets
  private buffers: Map<string, AudioBuffer> = new Map();
  private loaded: boolean = false;

  private bgmInterval: number | null = null;
  private bgmStep: number = 0;
  private bgmRunning: boolean = false;

  private geminiOsc: OscillatorNode | null = null;
  private geminiGain: GainNode | null = null;

  constructor() {
    // Loaded on first user interaction
  }

  public init(): void {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
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
      this.masterGain.gain.setValueAtTime(this.enabled ? 0.8 : 0.0, this.ctx.currentTime);
    }
    return this.enabled;
  }

  private async loadSoundAssets(): Promise<void> {
    if (this.loaded || !this.ctx) return;
    this.loaded = true;

    const soundFiles: Record<string, string> = {
      laser: './sounds/laser.mp3',
      bomb_ground: './sounds/bomb_ground.mp3',
      bomb_air: './sounds/bomb_air.mp3',
      shot_hit: './sounds/shot_hit.mp3',
      gemini_merge: './sounds/gemini_merge.mp3',
      boss_alert: './sounds/boss_alert.mp3',
      stage_clear: './sounds/stage_clear.mp3',
      start_fanfare: './sounds/start_fanfare.mp3',
      shakin: './sounds/shakin.mp3',
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

  // --- Sound Effects using 効果音ラボ Assets ---

  /** Blaster ground bomb drop whistle */
  public playBlasterDrop(): void {
    if (this.playBuffer('laser', 0.65, 1.1)) return;

    // Fallback synth
    if (!this.enabled || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.28);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.29);
  }

  /** Ground target destruction impact (効果音ラボ 爆発2) */
  public playGroundExplosion(): void {
    if (this.playBuffer('bomb_ground', 0.9, 0.95)) return;

    // Fallback synth
    if (!this.enabled || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.36);
  }

  /** Air enemy slice / destruction by Gemini orb (効果音ラボ 爆発1) */
  public playAirExplosion(): void {
    if (this.playBuffer('bomb_air', 0.75, 1.2)) return;

    // Fallback synth
    if (!this.enabled || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(360, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.18);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.19);
  }

  /** Gemini fusion fanfare (効果音ラボ パワーアップ) */
  public playGeminiMerge(level: number): void {
    const rate = 1.0 + (level - 1) * 0.15;
    if (this.playBuffer('gemini_merge', 0.9, rate)) return;

    // Fallback synth
    if (!this.enabled || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((pitch, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(pitch * (1 + (level - 1) * 0.2), now + i * 0.05);
      gain.gain.setValueAtTime(0.3, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.1);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.11);
    });
  }

  /** Boss alert siren (効果音ラボ 宇宙基地サイレン) */
  public playBossAlert(): void {
    if (this.playBuffer('boss_alert', 0.8)) return;

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

  /** Game Start Fanfare (効果音ラボ ラッパのファンファーレ) */
  public playStartFanfare(): void {
    this.playBuffer('start_fanfare', 0.8);
  }

  /** Stage Clear Jingle (効果音ラボ レベルアップ) */
  public playStageClear(): void {
    this.playBuffer('stage_clear', 0.85);
  }

  /** Player destruction */
  public playPlayerDeath(): void {
    this.playBuffer('bomb_ground', 1.0, 0.7);
  }

  // --- Dynamic Gemini Hum ---
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
    const freq = Math.min(660, 220 + averageSpeed * 0.6 + activeOrbsCount * 30);
    const targetGain = Math.min(0.18, 0.03 * activeOrbsCount + (averageSpeed / 400) * 0.06);
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

      // Bass note
      const freq = bassline[this.bgmStep % bassline.length];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

      osc.connect(gain);
      gain.connect(this.bgmGain);

      osc.start(now);
      osc.stop(now + 0.18);

      this.bgmStep++;
    }, 180); // Calmer ~83 BPM for deliberate retro feel
  }

  public stopBgm(): void {
    if (this.bgmInterval !== null) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.bgmRunning = false;
  }
}
