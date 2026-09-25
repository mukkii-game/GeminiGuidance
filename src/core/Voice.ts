/**
 * Web Speech API Voice Synthesizer
 * Uses native browser SpeechSynthesis for authentic Japanese voice lines
 */
export class VoiceManager {
  private synth: SpeechSynthesis | null = null;
  private japaneseVoice: SpeechSynthesisVoice | null = null;
  private voiceLoaded: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices(): void {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    if (voices.length > 0) {
      this.japaneseVoice = voices.find(v => v.lang.startsWith('ja') || v.lang.includes('JP')) || voices[0] || null;
      this.voiceLoaded = true;
    }
  }

  public speak(text: string, rate: number = 1.05, pitch: number = 1.0): void {
    if (!this.synth) return;
    try {
      this.synth.cancel(); // Stop any pending utterances
      if (!this.voiceLoaded) {
        this.loadVoices();
      }

      const utter = new SpeechSynthesisUtterance(text);
      if (this.japaneseVoice) {
        utter.voice = this.japaneseVoice;
      }
      utter.lang = 'ja-JP';
      utter.rate = rate;
      utter.pitch = pitch;
      utter.volume = 1.0;

      this.synth.speak(utter);
    } catch (e) {
      console.warn('Voice synthesis failed', e);
    }
  }
}
