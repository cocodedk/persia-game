import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSession, stepSession } from '../../src/ui/session.js';
import { finished } from '../../src/core/util.js';
import { levelById } from '../../src/core/levels.js';
import { autopilot } from '../../src/core/autopilot.js';
import { TICK } from '../../src/core/kinds.js';
import { startSlowMo } from '../../src/fx/fx.js';

// Uneven real frames, as a browser delivers them: 60 Hz with hitches and a long stall.
const FRAMES = [1 / 60, 1 / 60, 0.021, 1 / 60, 0.012, 0.033, 1 / 60, 0.1];

// Play a session with the autopilot until the level ends (or `limit` frames), the way main does.
function play(level, limit = 20000) {
  const s = createSession(level);
  for (let i = 0; i < limit && !finished(s.world); i++) stepSession(s, FRAMES[i % FRAMES.length], autopilot);
  return s;
}

test('slow motion steps fewer ticks a frame, each one a whole TICK', () => {
  const s = createSession(levelById('w1-2'));
  startSlowMo(s.fx, 10);
  for (let i = 0; i < 30; i++) stepSession(s, TICK, autopilot);
  assert.equal(s.world.tick, 9, '0.3 x 30 frames');
  assert.ok(Math.abs(s.world.t - 9 * TICK) < 1e-9, 'the core clock moved by whole ticks');
});

// Two sessions stepped four ticks, one on `raw` and one on the input it should quantize to: the
// worlds match, and onEvents is handed the quantized input.
function sameWorld(raw, quantized) {
  const a = createSession(levelById('w1-1'), 3);
  const b = createSession(levelById('w1-1'), 3);
  const seen = [];
  for (let i = 0; i < 4; i++) {
    stepSession(a, TICK, () => raw, (events, input) => seen.push(input));
    stepSession(b, TICK, () => quantized);
  }
  assert.deepEqual(a.world, b.world);
  assert.deepEqual(seen[0], quantized);
}

test('inputs are quantized before the core sees them', () => {
  sameWorld({ dx: 0.4, dy: -3, fire: 1, bomb: 0, target: null }, { dx: 1, dy: -1, fire: true, bomb: false, target: null });
  sameWorld({ dx: 1, fire: true, target: { x: 100.6, y: 2000 } }, { dx: 0, dy: 0, fire: true, bomb: false, target: { x: 101, y: 1080 } });
});

test('once the level ends the core steps no more, and the time since is counted', () => {
  const s = play(levelById('w1-1'));
  assert.equal(s.world.state, 'cleared', 'the autopilot clears w1-1');
  const n = s.world.tick;
  for (let i = 0; i < 30; i++) stepSession(s, TICK, autopilot);
  assert.equal(s.world.tick, n);
  assert.ok(s.over >= 30 * TICK - 1e-9);
});
