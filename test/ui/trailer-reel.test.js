import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fastForward, drain, startClip, stepClip, clipDone, HOLD } from '../../src/ui/trailer/reel.js';
import { cutClips, BLOOPER_TICKS } from '../../src/ui/trailer/cut.js';
import { levelById } from '../../src/core/levels.js';
import { createWorld, stepWorld } from '../../src/core/world.js';
import { autopilot } from '../../src/core/autopilot.js';
import { quantizeInput, replay, stateHash, TICK } from '../../src/core/replay.js';

// A real run: the autopilot flies the level to its end, every input recorded as main does.
function flown(id) {
  const level = levelById(id);
  const world = createWorld(level, level.seed);
  const inputs = [];
  while (world.state === 'play' || world.state === 'intro') {
    const input = quantizeInput(autopilot(world));
    stepWorld(world, TICK, input);
    world.events.length = 0;
    inputs.push(input);
  }
  return { level, inputs, world };
}

const starts = (events, ticks) => cutClips(events, ticks).map((c) => c.start);

for (const id of ['w1-1', 'w4-5']) {
  test(`${id}: one sliced pass gives the run's events and exact snapshots at every clip start`, () => {
    const { level, inputs } = flown(id);
    const gen = fastForward(level, level.seed, inputs, starts, { budget: 0 });
    let slices = 0;
    let last = 0;
    let step = gen.next();
    while (!step.done) {
      assert.ok(step.value >= last && step.value <= 1, `progress ${step.value}`);
      last = step.value;
      slices += 1;
      step = gen.next();
    }
    const pass = step.value;
    assert.ok(slices > 10, `the pass was sliced (${slices} slices)`);
    const truth = replay(level, level.seed, inputs, { snapshotsAt: starts(pass.events, inputs.length) });
    assert.deepEqual(pass.events, truth.events);
    assert.equal(pass.ticks, inputs.length);
    assert.ok(pass.snaps.size >= 1);
    for (const [tick, w] of pass.snaps) {
      assert.equal(w.tick, tick);
      assert.equal(stateHash(w), stateHash(truth.snapshots.get(tick)), `snapshot at ${tick}`);
    }
  });
}

test('a clip steps its snapshot on through the inputs exactly, effects on their own rng, slow motion on the peak', () => {
  const { level, inputs } = flown('w1-1');
  const pass = drain(fastForward(level, level.seed, inputs, starts));
  const clips = cutClips(pass.events, inputs.length);
  const mid = clips.find((c) => c.end < inputs.length);
  const truth = replay(level, level.seed, inputs, { snapshotsAt: [mid.end] }).snapshots.get(mid.end);
  const c = startClip(pass.snaps.get(mid.start), inputs, mid, { seed: level.seed });
  let secs = 0;
  let slowed = false;
  const heard = [];
  while (!clipDone(c) && secs < 30) {
    stepClip(c, 1 / 60, (events) => heard.push(...events));
    slowed ||= c.fx.slow < 1;
    secs += 1 / 60;
  }
  assert.equal(c.world.tick, mid.end);
  assert.equal(stateHash(c.world), stateHash(truth), 'the game state never differs from the run');
  assert.ok(slowed, 'the peak played in slow motion');
  assert.ok(secs > (mid.end - mid.start) / 60, 'slow motion made it longer than the play');
  assert.ok(heard.length > 0, 'its events were handed on (sound)');
});

// A boss level: its last clip is the kill, which always runs to the end of the run (a wave level's
// last clip may be any late combo).
test('the clip that ends the run holds on the aftermath; the blooper plays at 0.3x', () => {
  const { level, inputs } = flown('w1-5');
  const pass = drain(fastForward(level, level.seed, inputs, starts));
  const end = cutClips(pass.events, inputs.length).at(-1);
  assert.equal(end.end, inputs.length);
  const c = startClip(pass.snaps.get(end.start), inputs, end, { seed: 1 });
  let secs = 0;
  while (c.world.tick < end.end) {
    stepClip(c, 1 / 60);
    secs += 1 / 60;
  }
  assert.equal(c.world.state, 'cleared');
  assert.equal(clipDone(c), false, 'the last blast still plays');
  for (let t = 0; t < HOLD + 0.1; t += 1 / 60) stepClip(c, 1 / 60);
  assert.equal(clipDone(c), true);
  const span = { start: 600, end: 600 + BLOOPER_TICKS, peak: 600 + BLOOPER_TICKS };
  const b = startClip(drain(fastForward(level, level.seed, inputs, () => [600])).snaps.get(600), inputs, span, { seed: 1, speed: 0.3, peakSlow: 0 });
  let real = 0;
  while (b.world.tick < span.end) {
    stepClip(b, 1 / 60);
    real += 1 / 60;
  }
  assert.ok(Math.abs(real - 4) < 0.1, `${real.toFixed(2)} s for the blooper's 1.2 s of play (R32: about 4 s, then the clapper)`);
});
