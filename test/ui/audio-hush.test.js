import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installAudio } from './audio-kit.js';

// A stand-in AudioContext, enough for audio.js to build its graph and play patches. Every param
// records its automation, so the test can see which voices were faded and how fast.
const gains = [];
installAudio({ currentTime: 10, onNode: (kind, n) => kind === 'Gain' && gains.push(n) });

const faded = (g, by) => g.gain.calls.some(([k, v, t]) => (k === 'lin' || k === 'target') && v === 0 && t <= by);

test('hush fades every voice of its group within 150 ms, and only those', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { unlockAudio, play, hush, audioStats } = await import('../../src/ui/audio.js');
  unlockAudio();
  const before = gains.length;
  play('braam', { group: 'film' });
  const afterBraam = gains.length;
  play('impact', { group: 'film' });
  const afterImpact = gains.length;
  play('select');
  assert.deepEqual(audioStats().grouped, { film: 2 });
  hush('film');
  const outs = { braam: gains[before], impact: gains[afterBraam], select: gains[afterImpact] }; // each voice's first gain is its out
  assert.ok(faded(outs.braam, 10.15), 'the braam fades out at once');
  assert.ok(faded(outs.impact, 10.15), 'the impact fades out at once');
  assert.ok(!faded(outs.select, 99), 'a menu sound outside the group plays on');
  assert.deepEqual(audioStats().grouped, { film: 0 });
  hush('film'); // nothing left: no-op
  hush('nobody');
  t.mock.timers.tick(10000); // the voices' clean-up runs without trouble
  assert.equal(audioStats().failed, 0, audioStats().error);
});
