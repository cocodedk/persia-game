import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, stepWorld, stars } from '../../src/core/world.js';
import { createRng, rand } from '../../src/core/rng.js';
import { levelById } from '../../src/core/levels.js';
import {
  TICK, IDLE, level, wave, step, seconds, playing, drain, ofType, shotAt, bulletOnShip,
} from './world-kit.js';

const two = () => level([wave({ cols: 3 }), wave({ formation: 'sway', cols: 2, roles: ['grunt'] })]);
const killAll = (w) => {
  for (const a of [...w.aliens]) shotAt(w, a);
  step(w);
};

test('createWorld follows the core contract', () => {
  const w = createWorld(two(), 7);
  assert.equal(typeof w.rng.s, 'number');
  assert.equal(w.state, 'intro');
  assert.deepEqual([w.t, w.tick, w.score, w.hits, w.wave], [0, 0, 0, 0, 1]);
  assert.deepEqual(w.combo, { mult: 1, timer: 0 });
  for (const k of ['shots', 'bullets', 'pickups', 'events']) assert.deepEqual(w[k], [], k);
  assert.equal(w.boss, null);
  const lv = levelById('w1-2');
  assert.deepEqual(createWorld(lv), createWorld(lv, lv.seed), 'the seed defaults to the level\'s own');
  assert.doesNotThrow(() => structuredClone(w));
});

test('intro lasts 1.5 s, then play', () => {
  const w = createWorld(two(), 1);
  seconds(w, 1.4);
  assert.equal(w.state, 'intro');
  seconds(w, 0.2);
  assert.equal(w.state, 'play');
});

test('the last alien of a wave dies: waveClear that tick, the next wave 1.2 s later', () => {
  const w = playing(two());
  killAll(w);
  assert.equal(w.aliens.length, 0);
  const clears = ofType(drain(w), 'waveClear');
  assert.equal(clears.length, 1);
  assert.deepEqual([clears[0].wave, clears[0].last, clears[0].tick], [1, false, w.tick]);
  seconds(w, 1.1);
  assert.equal(w.aliens.length, 0, 'still in the gap');
  assert.equal(w.wave, 1);
  seconds(w, 0.2);
  assert.equal(w.wave, 2);
  assert.equal(w.aliens.length, 2);
  assert.ok(w.aliens.every((a) => a.mode === 'enter' && a.t < 0.2));
  assert.equal(ofType(drain(w), 'waveClear').length, 0, 'once per wave');
});

test('the next wave alternates its march direction, and its aliens can be shot while entering', () => {
  const w = playing(two());
  const dir = w.march.dir;
  killAll(w);
  seconds(w, 1.5);
  assert.equal(w.march.dir, -dir);
  const a = w.aliens[0];
  assert.equal(a.mode, 'enter');
  shotAt(w, a);
  step(w);
  assert.equal(w.aliens.length, 1);
});

test('clearing the last wave clears the level: +2000, +3000 more with no hits', () => {
  const w = playing(level([wave({ cols: 2 })]));
  killAll(w);
  assert.equal(w.state, 'cleared');
  const ev = drain(w);
  const [clear] = ofType(ev, 'cleared');
  assert.deepEqual([clear.bonus, clear.stars], [5000, 3]);
  assert.equal(w.score, 100 + 200 + 5000, 'two kills at x1 and x2, then the bonus');
  assert.equal(clear.score, w.score);
  assert.equal(ofType(ev, 'waveClear')[0].last, true);
  assert.equal(stars(w), 3);
  const { tick } = w;
  step(w, 10);
  assert.equal(w.tick, tick, 'a cleared world is frozen');
});

test('a hit level clears for 2000 and fewer stars', () => {
  const w = playing(level([wave({ cols: 2 })]));
  bulletOnShip(w);
  seconds(w, 0.1);
  killAll(w);
  assert.equal(w.state, 'cleared');
  const [clear] = ofType(drain(w), 'cleared');
  assert.deepEqual([clear.bonus, clear.stars], [2000, 2]);
});

test('the last alien dying on the tick the ship loses its last life is a clear, not a failure', () => {
  const w = playing(level([wave({ cols: 1 })]));
  w.ship.lives = 1;
  w.hits = 2;
  shotAt(w, w.aliens[0]);
  bulletOnShip(w);
  step(w);
  assert.equal(w.state, 'cleared');
  assert.equal(w.ship.lives, 0);
  const ev = drain(w);
  assert.equal(ofType(ev, 'failed').length, 0);
  assert.equal(ofType(ev, 'shipHit').length, 1);
  assert.equal(ofType(ev, 'cleared').length, 1);
  assert.equal(stars(w), 1);
  const control = playing(level([wave({ cols: 1 })]));
  control.ship.lives = 1;
  bulletOnShip(control);
  step(control);
  assert.equal(control.state, 'failed', 'without the kill it is a failure');
});

test('a boss level has no aliens yet and stays in play (the boss arrives in a later task)', () => {
  const w = createWorld(levelById('w1-5'), 1);
  seconds(w, 6);
  assert.equal(w.state, 'play');
  assert.equal(w.aliens.length, 0);
  assert.equal(w.wave, 0);
});

test('every event carries the tick it happened on', () => {
  const w = createWorld(levelById('w1-3'), 5);
  w.ship.invuln = 1e9;
  const seen = new Set();
  for (let i = 0; i < 900; i++) {
    step(w, 1, { ...IDLE, dx: i % 120 < 60 ? 1 : -1, fire: true });
    for (const e of w.events.splice(0)) {
      assert.equal(e.tick, w.tick, e.type);
      seen.add(e.type);
    }
  }
  assert.ok(seen.has('fire') && seen.size >= 2, `saw ${[...seen]}`);
});

// A busy, ship-proof run on a level with lasers and divers, driven by random keys and mouse.
const LASERS = level([
  wave({ formation: 'dive', rows: 3, cols: 10, roles: ['diver', 'gunner', 'diver'], pattern: 'fan', speed: 1.1 }),
  wave({ formation: 'sway', rows: 3, cols: 6, roles: ['grunt', 'armored', 'grunt'], pattern: 'laser', speed: 1.05 }),
], 12 / 39, { seed: 31057 });

function run(seed, n) {
  const w = createWorld(LASERS, seed);
  w.ship.invuln = 1e9;
  const rng = createRng(99);
  const r = (k) => Math.floor(rand(rng) * k);
  for (let i = 0; i < n; i++) {
    const target = r(4) === 0 ? { x: r(1800), y: 700 + r(300) } : null;
    stepWorld(w, TICK, { dx: r(3) - 1, dy: r(3) - 1, fire: r(2) === 1, bomb: r(50) === 0, target });
  }
  return w;
}

test('stepWorld is deterministic for a seed and an input list', () => {
  const a = JSON.stringify(run(3, 1200));
  assert.equal(a, JSON.stringify(run(3, 1200)));
  assert.notEqual(a, JSON.stringify(run(4, 1200)), 'the seed matters');
});

test('a world cloned mid-run carries on identically', () => {
  const a = run(5, 400);
  const b = structuredClone(a);
  for (const w of [a, b]) {
    for (let i = 0; i < 400; i++) stepWorld(w, TICK, { ...IDLE, dx: i % 90 < 45 ? 1 : -1, fire: true });
  }
  assert.deepEqual(a, b);
  assert.ok(a.tick === 800 && a.state === 'play');
});
