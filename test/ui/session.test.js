import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSession, stepSession, recording, runOf, taint } from '../../src/ui/session.js';
import { finished } from '../../src/core/util.js';
import { levelById, DEMO_LEVEL } from '../../src/core/levels.js';
import { autopilot } from '../../src/core/autopilot.js';
import { replay, decodeRun, stateHash, TICK } from '../../src/core/replay.js';
import { startSlowMo } from '../../src/fx/fx.js';

// Uneven real frames, as a browser delivers them: 60 Hz with hitches and a long stall.
const FRAMES = [1 / 60, 1 / 60, 0.021, 1 / 60, 0.012, 0.033, 1 / 60, 0.1];

// Play a session with the autopilot until the level ends (or `limit` frames), the way main does.
function play(level, limit = 20000) {
  const s = createSession(level);
  let slowTicks = 0;
  let slowFrames = 0;
  for (let i = 0; i < limit && !finished(s.world); i++) {
    const before = s.world.tick;
    const slow = s.fx.slow < 1;
    stepSession(s, FRAMES[i % FRAMES.length], autopilot);
    if (slow) {
      slowFrames += 1;
      slowTicks += s.world.tick - before;
    }
  }
  return { s, slowTicks, slowFrames };
}

test('the recording replays to the very same world (R6), slow motion included (R19)', () => {
  const level = levelById('w1-1');
  const { s, slowFrames } = play(level);
  assert.equal(s.world.state, 'cleared', 'the autopilot clears w1-1');
  assert.ok(slowFrames > 0, 'the run went through slow motion');
  const rec = recording(s);
  assert.equal(rec.ticks, s.world.tick, 'one input per simulated tick');
  assert.equal(rec.stars, s.world.state === 'cleared' ? rec.events.at(-1).stars : 0);
  const again = replay(level, s.seed, rec.inputs);
  assert.equal(stateHash(again.world), stateHash(s.world));
  assert.deepEqual(again.events, rec.events, 'the same events, ticks and all');
});

test('the stored run decodes back to the inputs that ran', () => {
  const { s } = play(levelById('w2-1'), 900);
  const run = JSON.parse(JSON.stringify(runOf(s)));
  const back = decodeRun(run);
  assert.ok(back, 'a valid run');
  assert.deepEqual(back.inputs, s.inputs);
  assert.equal(back.level, 'w2-1');
});

test('slow motion steps fewer ticks a frame, each one a whole TICK', () => {
  const s = createSession(levelById('w1-2'));
  startSlowMo(s.fx, 10);
  for (let i = 0; i < 30; i++) stepSession(s, TICK, autopilot);
  assert.equal(s.world.tick, 9, '0.3 x 30 frames');
  assert.ok(Math.abs(s.world.t - 9 * TICK) < 1e-9, 'the core clock moved by whole ticks');
});

const rawKeys = () => ({ dx: 0.4, dy: -3, fire: 1, bomb: 0, target: null });

test('inputs are quantized before the core and the recording see them', () => {
  const s = createSession(levelById('w1-1'));
  for (let i = 0; i < 4; i++) stepSession(s, TICK, rawKeys);
  assert.deepEqual(s.inputs[0], { dx: 1, dy: -1, fire: true, bomb: false, target: null });
  const p = createSession(levelById('w1-1'));
  stepSession(p, TICK, () => ({ dx: 1, fire: true, target: { x: 100.6, y: 2000 } }));
  assert.deepEqual(p.inputs[0], { dx: 0, dy: 0, fire: true, bomb: false, target: { x: 101, y: 1080 } });
});

test('once the level ends nothing more is recorded, and the time since is counted', () => {
  const { s } = play(levelById('w1-1'));
  const n = s.inputs.length;
  for (let i = 0; i < 30; i++) stepSession(s, TICK, autopilot);
  assert.equal(s.inputs.length, n);
  assert.ok(s.over >= 30 * TICK - 1e-9);
});

test('no run to store for the demo level, an unrecorded session or a tainted one', () => {
  const demo = createSession(DEMO_LEVEL);
  stepSession(demo, TICK, autopilot);
  assert.equal(runOf(demo), null);
  const quiet = createSession(levelById('w1-1'), 3, { record: false });
  stepSession(quiet, TICK, autopilot);
  assert.equal(quiet.inputs.length, 0);
  assert.equal(runOf(quiet), null);
  const t = createSession(levelById('w1-1'));
  stepSession(t, TICK, autopilot);
  assert.ok(runOf(t));
  taint(t);
  assert.equal(runOf(t), null);
  assert.equal(recording(t).tainted, true);
});
