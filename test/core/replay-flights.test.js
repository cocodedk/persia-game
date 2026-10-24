import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, stepWorld, stars } from '../../src/core/world.js';
import { finished } from '../../src/core/util.js';
import { levelById } from '../../src/core/levels.js';
import { autopilot } from '../../src/core/autopilot.js';
import { makeRun, decodeRun, replay, stateHash, TICK } from '../../src/core/replay.js';

// Real runs, as the game saves them: the autopilot flies a level with its three lives (no invulnerable
// ship), the inputs go through makeRun, JSON and decodeRun, and the replay must end on the same
// state, score and events. One level per world (two for world 6), picked so that the world's twist
// actually happens in the run, and the log is checked for the proof of it, so that this test cannot
// quietly stop covering a twist when levels are retuned. The three bosses are fought to the end.
//   w1 bunkers      a saucer crosses every 20 s: a level longer than that
//   w2 darkness     lightning every 6-10 s
//   w3 gusts        the wind re-rolled every 4-7 s
//   w4 shuriken     a shot cuts a star (the boss throws them)
//   w5 acid         an armored death drips
//   w6 glitch       an alien blinks to a free slot (a wave level), and a near miss slows enemy
//                   time (the boss: the autopilot's wave runs keep too far from every bullet)
//   w7 reassemble   a wreck hangs in the formation, and breaks or stands up again
//   w8 gravity      the well swallows bullets and shots
const FLIGHTS = [
  ['w1-3', 'saucer'],
  ['w2-2', 'lightning'],
  ['w3-3', 'gust'],
  ['w4-5', 'cut', 'bossPhase', 'bossDeath'],
  ['w5-3', 'acid'],
  ['w6-3', 'teleport'],
  ['w6-5', 'bulletTime', 'bossPhase', 'bossDeath'],
  ['w7-1', 'wreck', 'wreckDown', 'reassemble'],
  ['w8-5', 'absorb', 'bossPhase', 'bossDeath'],
];

function fly(level) {
  const world = createWorld(level, level.seed);
  const inputs = [];
  const events = [];
  while (!finished(world) && world.t < 180) {
    const input = autopilot(world);
    inputs.push(input);
    stepWorld(world, TICK, input);
    events.push(...world.events.splice(0));
  }
  return { world, inputs, events };
}

for (const [id, ...evidence] of FLIGHTS) {
  test(`${id}: a cleared run goes through makeRun, JSON and decodeRun and replays to the same end (${evidence.join(', ')})`, () => {
    const level = levelById(id);
    const { world, inputs, events } = fly(level);
    assert.equal(world.state, 'cleared', `${id} ended ${world.state} at ${world.t.toFixed(1)} s`);
    for (const type of evidence) assert.ok(events.some((e) => e.type === type), `${id}: no ${type} event in the run`);
    if (level.boss) assert.ok(events.some((e) => e.type === 'cleared'), 'the boss fight was cleared');

    const saved = JSON.parse(JSON.stringify(makeRun(level, level.seed, inputs, { score: world.score, stars: stars(world) })));
    const run = decodeRun(saved);
    assert.ok(run, 'the saved run reads back');
    assert.equal(run.ticks, inputs.length);
    const again = replay(run.level, run.seed, run.inputs);
    assert.equal(again.world.state, 'cleared');
    assert.equal(stateHash(again.world), stateHash(world));
    assert.equal(again.world.score, world.score);
    assert.equal(again.world.score, run.score);
    assert.equal(stars(again.world), run.stars);
    assert.deepEqual(again.events, events);
  });
}
