import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const source = fs.readFileSync(new URL('../src/core/Audio.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { SoundEngine } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
const tracks = [];
class FakeAudio {
  constructor(url) { this.src = url; this.paused = true; this.currentTime = 0; this.plays = 0; tracks.push(this); }
  play() { this.paused = false; this.plays++; return Promise.resolve(); }
  pause() { this.paused = true; }
}
globalThis.Audio = FakeAudio;
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
let now = 0;
Object.defineProperty(globalThis, 'performance', { value: { now: () => now }, configurable: true });
const sound = new SoundEngine();
// No browser audio context is needed to test track selection and mute lifecycle.
sound.resume = () => {};
sound.playStageBgm(1);
const stage = tracks.at(-1); stage.currentTime = 17;
sound.playStageBgm(1);
assert.equal(tracks.length, 1, 'repeated requests preserve the current track');
assert.equal(stage.currentTime, 17, 'same track must not restart');
sound.playBossBgm(1);
assert.equal(tracks.length, 2, 'stage music must switch to boss music');
assert(stage.paused); assert.equal(stage.currentTime, 0);
assert.match(tracks.at(-1).src, /neorock81/);
sound.playBossBgm(2);
assert.equal(tracks.length, 3, 'BOSS to BOSS compares URLs, not just type');
assert.match(tracks.at(-1).src, /neorock83/);
sound.toggleBgm();
assert(tracks.at(-1).paused);
sound.playStageBgm(2);
const mutedStage = tracks.at(-1);
assert.equal(mutedStage.plays, 0, 'new selection remains silent while muted');
sound.playStageBgm(2);
assert.equal(tracks.at(-1), mutedStage, 'muted same-track request should reuse audio');
sound.toggleBgm();
assert.equal(tracks.at(-1), mutedStage);
assert.equal(mutedStage.plays, 1, 'unmute plays the latest selection');
sound.toggle(); assert(mutedStage.paused);
sound.playBossBgm(1);
const mutedBoss = tracks.at(-1); assert(mutedBoss.paused);
sound.toggle(); assert.equal(mutedBoss.plays, 1);
sound.stopBgm(); assert(mutedBoss.paused);
sound.toggleBgm(); sound.toggleBgm();
assert.equal(mutedBoss.plays, 1, 'toggling after stop must not resurrect a cleared boss');
assert.equal(sound.currentBgmAudio, null);
sound.playStageBgm(1); assert.match(tracks.at(-1).src, /8bit18/);

// Exercise actual playBuffer routing with a minimal Web Audio graph.
const voices = [];
sound.ctx = {
  createBufferSource() {
    const voice = { playbackRate: { value: 1 }, connect: () => {}, start() { voices.push(this); } };
    return voice;
  },
  createGain: () => ({ gain: { value: 0 }, connect: () => {} }),
};
sound.sfxGain = {};
sound.buffers.set('armor_hit', 'armor'); sound.buffers.set('bomb_crisp', 'impact');
sound.playBossHit();
assert.equal(voices.length, 1, 'first hit at time zero must be audible');
assert.equal(voices[0].playbackRate.value, 1.35);
sound.playBossHit(); assert.equal(voices.length, 1, 'twin normal hits share debounce');
now = 10; sound.playBossHit(true);
assert.equal(voices.length, 3, 'heavy hit cuts through a recent normal hit');
assert.equal(voices[1].playbackRate.value, 0.78);
assert.equal(voices[2].buffer, 'impact');
sound.playBossHit(true); sound.playBossHit();
assert.equal(voices.length, 3, 'simultaneous heavy hits cannot stack');
now = 120; sound.playBossHit(true); assert.equal(voices.length, 5);
sound.seEnabled = false; now = 240; sound.playBossHit(true);
assert.equal(voices.length, 5, 'SE mute applies to both heavy-hit layers');
sound.seEnabled = true; sound.playBossHit(true); assert.equal(voices.length, 7);
console.log('Audio regression: track transitions, mute/unmute, stop, normal/strong hit routing and debounce passed.');

let suspended=0;
sound.ctx.state='running';sound.ctx.suspend=()=>{suspended++;sound.ctx.state='suspended';return Promise.resolve();};
const playing=tracks.at(-1);playing.currentTime=19;
sound.setPaused(true);assert(playing.paused);assert.equal(suspended,1);
now=500;sound.playBossHit(true);assert.equal(voices.length,7,'paused SE is silent');
sound.toggleBgm();sound.toggleBgm();assert(playing.paused,'audio buttons cannot bypass pause');
sound.playBossBgm(2);assert(tracks.at(-1).paused,'new tracks remain paused');
sound.setPaused(false);assert(!tracks.at(-1).paused,'resume starts requested track');
console.log('Pause suspends SFX, freezes BGM, rejects playback while paused and resumes selection OK');
