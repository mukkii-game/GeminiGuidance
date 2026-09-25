/**
 * Web Audio API based 80s Arcade PSG/FM Synthesizer
 * Inspired by classic 1983 Namco sound design (Xevious style)
 */
export class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  public enabled: boolean = true;
  private bgmInterval: number | null = null;
  private bgmStep: number = 0;
  private bgmRunning: boolean = false;

  private geminiOsc: OscillatorNode | null = null;
  private geminiGain: GainNode | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  public init(): void {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.65, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.setupGeminiHum();
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
      this.masterGain.gain.setValueAtTime(this.enabled ? 0.7 : 0.0, this.ctx.currentTime);
    }
    return this.enabled;
  }

  // --- Sound Effects ---

  /** Blaster ground bomb drop whistle */
  public playBlasterDrop(): void {
    if (!this.enabled || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.22);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.23);
  }

  /** Ground impact explosion */
  public playGroundExplosion(): void {
    if (!this.enabled || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 0.25);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
  }

  /** Air enemy slice / destruction by Gemini orb */
  public playAirExplosion(): void {
    if (!this.enabled || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Metallic crunch (Square wave burst + high noise)
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.15);

    oscGain.gain.setValueAtTime(0.5, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.16);

    // Noise layer
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(now);
  }

  /** Continuous dynamic hum of Gemini orb orbiting */
  private setupGeminiHum(): void {
    if (!this.ctx || !this.sfxGain) return;
    try {
      this.geminiOsc = this.ctx.createOscillator();
      this.geminiOsc.type = 'sine';
      this.geminiOsc.frequency.setValueAtTime(320, this.ctx.currentTime);

      this.geminiGain = this.ctx.createGain();
      this.geminiGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.geminiOsc.connect(this.geminiGain);
      this.geminiGain.connect(this.sfxGain);
      this.geminiOsc.start();
    } catch {
      // Ignored if suspended
    }
  }

  public updateGeminiHum(activeOrbsCount: number, averageSpeed: number): void {
    if (!this.ctx || !this.geminiGain || !this.geminiOsc) return;
    if (!this.enabled || activeOrbsCount === 0) {
      this.geminiGain.gain.setValueAtTime(0, this.ctx.currentTime);
      return;
    }
    const freq = Math.min(880, 260 + averageSpeed * 0.8 + activeOrbsCount * 40);
    const targetGain = Math.min(0.25, 0.04 * activeOrbsCount + (averageSpeed / 400) * 0.1);
    this.geminiOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.05);
    this.geminiGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
  }

  /** Gemini fusion chime: ascending sparkling fanfare */
  public playGeminiMerge(level: number): void {
    if (!this.enabled || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
    const stepDuration = 0.045;

    notes.forEach((pitch, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(pitch * (1 + (level - 1) * 0.25), now + i * stepDuration);

      gain.gain.setValueAtTime(0, now + i * stepDuration);
      gain.gain.linearRampToValueAtTime(0.35, now + i * stepDuration + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * stepDuration + stepDuration + 0.08);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + i * stepDuration);
      osc.stop(now + i * stepDuration + stepDuration + 0.09);
    });
  }

  /** Boss alert siren */
  public playBossAlert(): void {
    if (!this.enabled || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    for (let pulse = 0; pulse < 3; pulse++) {
      const startTime = now + pulse * 0.35;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, startTime);
      osc.frequency.linearRampToValueAtTime(880, startTime + 0.18);
      osc.frequency.linearRampToValueAtTime(440, startTime + 0.32);

      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.32);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(startTime);
      osc.stop(startTime + 0.33);
    }
  }

  /** Player destruction */
  public playPlayerDeath(): void {
    if (!this.enabled || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.6);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.61);
  }

  // --- Background Music: Hypnotic 80s Xevious-style Sequencer ---

  public startBgm(): void {
    if (this.bgmRunning) return;
    this.bgmRunning = true;
    this.bgmStep = 0;

    // Classic Xevious hypnotic 16th-note bassline pattern
    // Tone notes: A1, E2, G1, A1, C2, E2, D2, A1
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

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.connect(gain);
      gain.connect(this.bgmGain);

      osc.start(now);
      osc.stop(now + 0.13);

      // Hi-hat / pulse noise on offbeats
      if (this.bgmStep % 2 === 1) {
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.03);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(4000, now);

        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.12, now);
        nGain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);

        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(this.bgmGain);
        noise.start(now);
      }

      this.bgmStep++;
    }, 130); // ~115 BPM 16th notes
  }

  public stopBgm(): void {
    if (this.bgmInterval !== null) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.bgmRunning = false;
  }
}
