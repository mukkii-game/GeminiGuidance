/**
 * Voice Manager (Muted / Disabled as per user request)
 * "ボイスはダメだからぜんぶいったんけして"
 */
export class VoiceManager {
  public stop(): void {}
  public playNeuralClip(_key: string): boolean { return false; }
  public playStageTitle(_stage: number): void {}
  public playElonIntro(): void {}
  public playBossVoice(_stage: number): void {}
  public speak(_text: string): void {}
}
