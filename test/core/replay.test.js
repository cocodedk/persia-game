import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, stepWorld } from '../../src/core/world.js';
import { levelById } from '../../src/core/levels.js';
import {
  encodeInputs, decodeInputs, makeRun, decodeRun, replay, stateHash, TICK, MAX_TICKS,
} from '../../src/core/replay.js';
import { randomInputs, liveRun } from './replay-kit.js';

// ---- run objects ------------------------------------------------------------------------------

const sample = () => {
  const inputs = randomInputs(11, 900);
  return { inputs, run: makeRun('w3-2', 33, inputs, { score: 12345, stars: 2 }) };
};

test('makeRun builds the storable run and decodeRun gives the playable one back', () => {
  const { inputs, run } = sample();
  assert.deepEqual(Object.keys(run).sort(), ['inputs', 'level', 'score', 'seed', 'stars', 'ticks', 'v']);
  assert.equal(run.v, 5);
  assert.equal(run.level, 'w3-2');
  assert.equal(run.ticks, 900);
  assert.equal(typeof run.inputs, 'string');
  const back = decodeRun(JSON.parse(JSON.stringify(run)));
  assert.deepEqual(back, { ...run, inputs });
  assert.equal(makeRun(levelById('w3-2'), 33, inputs, { score: 1, stars: 0 }).level, 'w3-2', 'a level object gives its id');
});

test('decodeRun rejects the wrong version, bad shapes and bad encodings', () => {
  const { run } = sample();
  const bad = [
    null, undefined, 'garbage', 42, [], true, {},
    { ...run, v: 0 }, { ...run, v: 1 }, { ...run, v: 2 }, { ...run, v: 3 }, { ...run, v: 4 }, { ...run, v: 6 }, { ...run, v: '5' }, { ...run, v: undefined },
    { ...run, level: 'w9-9' }, { ...run, level: 3 }, { ...run, level: undefined },
    { ...run, seed: -1 }, { ...run, seed: 1.5 }, { ...run, seed: 2 ** 32 }, { ...run, seed: '7' },
    { ...run, ticks: 899 }, { ...run, ticks: -1 }, { ...run, ticks: MAX_TICKS + 1 }, { ...run, ticks: 'x' },
    { ...run, score: NaN }, { ...run, score: -5 }, { ...run, score: '9' },
    { ...run, stars: 4 }, { ...run, stars: -1 }, { ...run, stars: 1.5 }, { ...run, stars: undefined },
    { ...run, inputs: 'garbage!' }, { ...run, inputs: 42 }, { ...run, inputs: undefined }, { ...run, inputs: '' },
  ];
  for (const obj of bad) assert.equal(decodeRun(obj), null, JSON.stringify(obj)?.slice(0, 80));
});

// R38: the rule changes of task 13a (bullets spent on a blinking ship, near misses, the shuriken cut,
// minions, reborn armored) re-simulate a version 1 run differently, and task 13b's tuning (level
// waves, boss hp and attacks, gunner minions holding fire at point blank) a version 2 run, and
// the formations kept clear of the HUD (R41) a version 3 run, and pickups worth points and swept up
// at the clear (R51) a version 4 run, so none is replayed at all.
test('a version 1, 2, 3 or 4 run, saved under older rules, decodes to null', () => {
  const { run } = sample();
  for (const v of [1, 2, 3, 4]) assert.equal(decodeRun(JSON.parse(JSON.stringify({ ...run, v }))), null, `v ${v}`);
  assert.notEqual(decodeRun(JSON.parse(JSON.stringify(run))), null, 'the same run as version 5 is fine');
});

test('decodeRun rejects every truncation of a valid run', () => {
  const { run } = sample();
  for (let n = 0; n < run.inputs.length; n++) {
    assert.equal(decodeRun({ ...run, inputs: run.inputs.slice(0, n) }), null, `cut at ${n}`);
  }
  assert.notEqual(decodeRun(run), null);
});

// ---- replay -----------------------------------------------------------------------------------

// One level of every world: the wave levels carry formations and bunkers, the boss levels carry
// attacks and minions, and each world its own twist (gusts, teleports, gravity, ...).
const PER_WORLD = ['w1-4', 'w2-5', 'w3-4', 'w4-5', 'w5-3', 'w6-5', 'w7-4', 'w8-5'];

for (const id of PER_WORLD) {
  test(`${id}: random keys and pointer, run then replay, give the same state, score and events`, () => {
    const inputs = randomInputs(id.charCodeAt(1) * 31 + id.charCodeAt(3), 1500);
    const live = liveRun(id, inputs);
    assert.ok(live.world.tick >= 300, `the run lasted ${live.world.tick} ticks`);
    const level = levelById(id);
    const again = replay(level, level.seed, decodeInputs(encodeInputs(inputs)));
    assert.equal(stateHash(again.world), stateHash(live.world));
    assert.equal(again.world.score, live.world.score);
    assert.equal(again.world.tick, live.world.tick);
    assert.deepEqual(again.events, live.events);
    assert.deepEqual(again.world.events, [], 'the replay drains events like the game does');
  });
}

test('replay takes a level id or a level object, and a bad id throws', () => {
  const inputs = randomInputs(2, 120);
  const level = levelById('w1-2');
  assert.equal(stateHash(replay('w1-2', level.seed, inputs).world), stateHash(replay(level, level.seed, inputs).world));
  assert.throws(() => replay('w0-0', 1, inputs), /level/i);
});

test('replay snapshots are independent clones from which the run carries on identically', () => {
  const level = levelById('w3-2');
  const inputs = randomInputs(8, 700);
  const full = replay(level, level.seed, inputs, { snapshotsAt: [0, 200, 450, 700, 9999] });
  assert.deepEqual([...full.snapshots.keys()].sort((a, b) => a - b), [0, 200, 450, 700]);
  assert.equal(full.snapshots.get(0).tick, 0);
  assert.equal(full.snapshots.get(200).tick, 200);
  assert.deepEqual(full.snapshots.get(200).events, []);
  assert.equal(stateHash(full.snapshots.get(700)), stateHash(full.world));
  assert.notEqual(full.snapshots.get(700), full.world);
  for (const from of [0, 200, 450]) {
    const w = structuredClone(full.snapshots.get(from));
    for (let i = from; i < inputs.length; i++) stepWorld(w, TICK, inputs[i]);
    assert.equal(stateHash(w), stateHash(full.world), `from ${from}`);
  }
  assert.equal(stateHash(full.snapshots.get(0)), stateHash(createWorld(level, level.seed)));
});

test('a world mid-boss-fight survives structuredClone and keeps stepping identically', () => {
  for (const id of ['w1-5', 'w4-5', 'w8-5']) {
    const inputs = randomInputs(4, 1200);
    const level = levelById(id);
    const a = createWorld(level, level.seed);
    a.ship.invuln = Infinity;
    for (let i = 0; i < 600; i++) stepWorld(a, TICK, inputs[i]);
    assert.ok(a.boss && a.boss.enter === 0 && a.boss.dying === null, `${id}: the fight is on`);
    const b = structuredClone(a);
    assert.deepEqual(b, a);
    for (let i = 600; i < 1200; i++) {
      stepWorld(a, TICK, inputs[i]);
      stepWorld(b, TICK, inputs[i]);
    }
    assert.deepEqual(b, a, id);
    assert.equal(stateHash(b), stateHash(a));
  }
});

// ---- stateHash --------------------------------------------------------------------------------

test('stateHash is a string that ignores float dust and sees every part of the state', () => {
  const live = liveRun('w1-1', randomInputs(6, 400)).world;
  const h = stateHash(live);
  assert.equal(typeof h, 'string');
  assert.equal(stateHash(structuredClone(live)), h);
  const changed = (edit) => {
    const w = structuredClone(live);
    edit(w);
    return stateHash(w) !== h;
  };
  assert.ok(changed((w) => { w.score += 1; }), 'score');
  assert.ok(changed((w) => { w.tick += 1; }), 'tick');
  assert.ok(changed((w) => { w.ship.x += 1; }), 'ship x');
  assert.ok(changed((w) => { w.ship.y -= 1; }), 'ship y');
  assert.ok(changed((w) => { w.ship.lives -= 1; }), 'lives');
  assert.ok(changed((w) => { w.aliens.pop(); }), 'alien count');
  assert.ok(changed((w) => { w.aliens[0].x += 1; }), 'alien position');
  assert.ok(changed((w) => { w.bullets.push({ x: 1, y: 2 }); }), 'bullets');
  assert.ok(changed((w) => { w.rng.s += 1; }), 'rng state');
  assert.ok(changed((w) => { w.bunkers[0].mask[500] ^= 1; }), 'one byte of a bunker mask');
  assert.ok(!changed((w) => { w.ship.x += 1e-6; w.aliens[0].y += 1e-6; }), 'positions are rounded');
});

test('stateHash sees the wave\'s march clock and the boss\'s position and clock', () => {
  const sees = (world, edit, what) => {
    const w = structuredClone(world);
    edit(w);
    assert.notEqual(stateHash(w), stateHash(world), what);
  };
  sees(liveRun('w1-1', randomInputs(6, 400)).world, (w) => { w.march.clock += 0.5; }, 'march clock');
  const fight = liveRun('w1-5', randomInputs(7, 300)).world;
  assert.ok(fight.boss, 'a boss level');
  sees(fight, (w) => { w.boss.x += 1; }, 'boss x');
  sees(fight, (w) => { w.boss.y += 1; }, 'boss y');
  sees(fight, (w) => { w.boss.clock += 0.5; }, 'boss clock');
});
