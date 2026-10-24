import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LOOKS } from '../../src/ui/looks/index.js';
import { installAudio } from './audio-kit.js';

// A stand-in AudioContext that counts the oscillators made: the music's notes are oscillators, so
// a loop that keeps scheduling notes keeps making them.
let oscillators = 0;
installAudio({ currentTime: 1, onNode: (kind) => { if (kind === 'Oscillator') oscillators += 1; } });

test('muted, the music schedules no notes; unmuted, it picks up again', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const audio = await import('../../src/ui/audio.js');
  const { setMusic, updateMusic } = await import('../../src/ui/music.js');
  audio.unlockAudio();
  if (!audio.audioNodes()) throw new Error('the fake context did not start');
  const ctx = () => audio.audioNodes()?.ctx;
  setMusic(LOOKS[0]);
  updateMusic();
  const clock = ctx();
  const play = (secs) => {
    for (let i = 0; i < secs * 60; i++) {
      clock.currentTime += 1 / 60;
      updateMusic();
    }
  };
  play(2);
  assert.ok(oscillators > 10, `the loop plays (${oscillators} oscillators)`);
  if (!audio.toggleMute()) audio.toggleMute(); // muted now, whatever the stored setting was
  const before = oscillators;
  play(5);
  assert.equal(oscillators, before, 'nothing scheduled while muted');
  audio.toggleMute();
  play(2);
  assert.ok(oscillators > before + 10, 'unmuted, the notes come back');
});
