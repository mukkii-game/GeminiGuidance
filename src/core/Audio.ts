/**
 * Pure Audio Engine using genuine SFX from 効果音ラボ (soundeffect-lab.info)
 * and genuine 8-bit BGM tracks from 魔王魂 (maou.audio).
 * Strictly NO synthesized oscillators or generic AI sounds.
 * 
 * Features:
 * - DynamicsCompressorNode to prevent audio clipping & distortion
 * - Controlled moderate master and SFX gains (no loud blasting)
 * - Anti-stack debouncing (prevents simultaneous duplicate triggers)
 */
export class SoundEngine {
  private ctx: AudioContext | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private buffers: Map<string, AudioBuffer> = new Map();
  private loaded: boolean = false;
  private enabled: boolean = true;

  // Debounce tracking to prevent volume stacking
  private lastPlayedTime: Map<string, number> = new Map();

  // Background Music tracks (魔王魂)
  private currentBgmAudio: HTMLAudioElement | null = null;
  private currentBgmType: 'STAGE_A' | 'STAGE_B' | 'BOSS' | null = null;

  constructor() {
    // Lazy AudioContext initialization on first user interaction
  }

  public init(): void {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Dynamics Compressor to tame peak spikes
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(8, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.15, this.ctx.currentTime);
      this.compressor.connect(this.ctx.destination);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime); // Moderate, comfortable master volume
      this.masterGain.connect(this.compressor);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

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
      this.masterGain.gain.setValueAtTime(this.enabled ? 0.35 : 0.0, this.ctx.currentTime);
    }
    if (this.currentBgmAudio) {
      if (this.enabled) {
        this.currentBgmAudio.play().catch(() => {});
      } else {
        this.currentBgmAudio.pause();
      }
    }
    return this.enabled;
  }

  public startBgm(): void {
    this.playStageBgm(1);
  }

  public playStageBgm(stage: number): void {
    const bgmType: 'STAGE_A' | 'STAGE_B' = (stage % 2 === 1) ? 'STAGE_A' : 'STAGE_B';
    const trackUrl = bgmType === 'STAGE_A' ? './sounds/maou_bgm_8bit18.mp3' : './sounds/maou_bgm_8bit28.mp3';
    this.switchBgm(bgmType, trackUrl, 0.16); // Gentle background volume
  }

  public playBossBgm(stage: number = 1): void {
    // Epic high-octane rock/metal tracks from 魔王魂 (ネオロック81 狙撃手の葛藤 / ネオロック83 厳戒態勢)
    const trackUrl = stage === 2 ? './sounds/maou_neorock83.mp3' : './sounds/maou_neorock81.mp3';
    this.switchBgm('BOSS', trackUrl, 0.24);
  }

  /** Breakout block bounce/impact */
  public playBlockHit(): void {
    this.playBuffer('cursor', 0.8, 1.5, 30);
  }

  /** Breakout block shattered */
  public playBlockBreak(): void {
    this.playBuffer('armor_hit', 0.85, 1.3, 30);
  }

  private switchBgm(type: 'STAGE_A' | 'STAGE_B' | 'BOSS', url: string, volume: number): void {
    if (this.currentBgmType === type && this.currentBgmAudio && !this.currentBgmAudio.paused) {
      return;
    }

    if (this.currentBgmAudio) {
      this.currentBgmAudio.pause();
      this.currentBgmAudio.currentTime = 0;
    }

    this.currentBgmType = type;
    try {
      this.currentBgmAudio = new Audio(url);
      this.currentBgmAudio.loop = true;
      this.currentBgmAudio.volume = volume;
      if (this.enabled) {
        this.currentBgmAudio.play().catch(() => {});
      }
    } catch (err) {
      console.warn('Failed to switch BGM audio', err);
    }
  }

  public stopBgm(): void {
    if (this.currentBgmAudio) {
      this.currentBgmAudio.pause();
      this.currentBgmAudio.currentTime = 0;
      this.currentBgmType = null;
    }
  }

  private async loadSoundAssets(): Promise<void> {
    if (this.loaded || !this.ctx) return;
    this.loaded = true;

    // Genuine sound effects from 効果音ラボ (soundeffect-lab.info)
    const soundFiles: Record<string, string> = {
      bomb_drop: './sounds/bomb_drop.mp3',          // hyun1.mp3
      bomb_crisp: './sounds/bomb1.mp3',             // bomb1.mp3 (チュドーン)
      bomb_big: './sounds/big_explosion1.mp3',      // big_explosion1.mp3 (大爆発)
      armor_hit: './sounds/armor_hit.mp3',          // machine-hit1.mp3 (装甲ヒット/跳弾)
      bullet_fire: './sounds/beamgun2.mp3',         // beamgun2.mp3 (敵弾発射)
      laser_beam: './sounds/beamgun1.mp3',          // beamgun1.mp3
      whoosh: './sounds/whoosh.mp3',                // highspeed-movement1.mp3 (風切りスイング)
      power_up: './sounds/power_up1.mp3',           // power_up1.mp3 (ジェミニ取得・追加)
      level_up: './sounds/levelup1.mp3',            // levelup1.mp3 (ジェミニレベルアップ)
      decision: './sounds/decision1.mp3',           // decision1.mp3 (開始)
      cursor: './sounds/cursor1.mp3',               // cursor1.mp3 (弾消滅)
      boss_alert: './sounds/boss_alert.mp3',        // boss_alert.mp3 (警報)
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

  private playBuffer(name: string, volume: number = 1.0, rate: number = 1.0, debounceMs: number = 40): boolean {
    if (!this.enabled || !this.ctx || !this.sfxGain) return false;
    const now = performance.now();
    const last = this.lastPlayedTime.get(name) || 0;
    if (now - last < debounceMs) {
      return false; // Skip redundant stacked trigger
    }
    this.lastPlayedTime.set(name, now);

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

  /** Air enemy destruction impact */
  public playAirExplosion(): void {
    this.playBuffer('bomb_crisp', 0.8, 1.2, 50);
  }

  /** Gemini strikes armored enemy and bounces off */
  public playGeminiBounce(): void {
    this.playBuffer('armor_hit', 0.85, 1.15, 60);
  }

  /** Bullet erased by Gemini orb */
  public playBulletErased(): void {
    this.playBuffer('cursor', 0.65, 1.6, 40);
  }

  /** Enemy Sparoid white bullet firing */
  public playEnemyBulletFire(): void {
    this.playBuffer('bullet_fire', 0.45, 1.3, 80);
  }

  /** Gemini item collected by player (adds +1 Gemini) */
  public playItemCollect(): void {
    this.playBuffer('power_up', 0.9, 1.0, 50);
  }

  /** Gemini item struck by Gemini orb (levels up Gemini) */
  public playGeminiLevelUp(): void {
    this.playBuffer('level_up', 0.95, 1.1, 50);
  }

  /** Gemini fusion fanfare */
  public playGeminiMerge(level: number): void {
    const rate = 1.0 + (level - 1) * 0.12;
    this.playBuffer('power_up', 0.9, rate, 50);
  }

  /** Boss alert siren */
  public playBossAlert(): void {
    this.playBuffer('boss_alert', 0.85, 1.0, 500);
  }

  /** Game Start Fanfare */
  public playStartFanfare(): void {
    this.playBuffer('decision', 0.85, 1.0, 100);
  }

  /** Stage Clear Jingle */
  public playStageClear(): void {
    this.playBuffer('level_up', 0.85, 1.0, 100);
  }

  /** Player receives damage (shield / hull hit) */
  public playPlayerDamage(): void {
    this.playBuffer('armor_hit', 0.95, 0.9, 60);
  }

  /** Player emergency hull restoration */
  public playPlayerEmergency(): void {
    this.playBuffer('bomb_big', 0.8, 1.4, 200);
  }

  /** Player destruction */
  public playPlayerDeath(): void {
    this.playBuffer('bomb_big', 0.95, 0.95, 200);
  }
}
