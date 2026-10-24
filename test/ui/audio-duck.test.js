import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installAudio } from './audio-kit.js';

installAudio({ currentTime: 1 });
const audio = await import('../../src/ui/audio.js');

test('menu and speech ducks multiply: duck(0.35), duckSpeech(0.45), duckSpeech(1) leaves music at 0.35 of MUSIC', () => {
  audio.unlockAudio();
  if (!audio.audioNodes()) audio.toggleMute(); // unmuted, whatever the stored setting was
  const { music, voice } = audio.audioNodes();
  assert.ok(voice, 'the voice has a bus of its own');
  const MUSIC = music.gain.value;
  audio.duck(0.35); // the pause menu
  audio.duckSpeech(0.45); // a line starts
  audio.duckSpeech(1); // it ends
  const targets = music.gain.calls.filter(([kind]) => kind === 'target');
  assert.deepEqual(targets.map(([, v]) => +(v / MUSIC).toFixed(6)), [0.35, 0.1575, 0.35]);
  assert.deepEqual(targets.map(([, , , k]) => k), [0.06, 0.06, 0.25], 'down fast, back up slowly');
});
