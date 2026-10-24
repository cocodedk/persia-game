import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, stepWorld } from '../../src/core/world.js';
import { IDLE, TICK, level, wave, input, step, seconds, playing, drain, ofType, bulletAt } from './world-kit.js';
import { bossLevel, bossWorld, leave, part, shotOn } from './boss-kit.js';

// Small fairness rules (task 13a): near misses that end early still count (wipes do not, R37), and
// minions come only from parts still standing.

test('a bullet that runs out of life inside the near band is still a near miss', () => {
  const w = playing(level([wave()]));
  bulletAt(w, w.ship.x, w.ship.y - 25); // in the band (28), not touching (8 + 14)
  w.bullets[0].life = 0.1;
  seconds(w, 0.5);
  const near = ofType(drain(w), 'nearMiss');
  assert.equal(near.length, 1);
  assert.ok(near[0].dist > 22 && near[0].dist <= 28, `closest approach ${near[0].dist}`);
  assert.equal(w.bullets.length, 0);
});

test('a bullet that never came near leaves no near miss when it expires', () => {
  const w = playing(level([wave()]));
  bulletAt(w, w.ship.x, w.ship.y - 80);
  w.bullets[0].life = 0.1;
  seconds(w, 0.5);
  assert.equal(ofType(drain(w), 'nearMiss').length, 0);
});

// R37: a wipe is not a dodge. Bullets inside the band that a bomb or a boss's death removes settle
// silently (no fx ring, no bullet time on an empty screen).
test('a bomb that wipes a bullet inside the near band is no near miss', () => {
  const w = playing(level([wave()]));
  bulletAt(w, w.ship.x - 25, w.ship.y);
  step(w);
  assert.equal(ofType(drain(w), 'nearMiss').length, 0, 'still in the band');
  step(w, 1, input({ bomb: true }));
  const ev = drain(w);
  assert.equal(ofType(ev, 'bomb').length, 1);
  assert.equal(ofType(ev, 'nearMiss').length, 0);
  assert.equal(ofType(ev, 'bulletTime').length, 0, 'no bullet time on the bomb');
  assert.equal(w.slow, 0);
});

test('a boss\'s death wipes bullets inside the near band without a near miss', () => {
  const w = bossWorld('giant');
  bulletAt(w, w.ship.x - 25, w.ship.y);
  step(w);
  assert.equal(w.bullets[0].near, 25, 'it is in the band');
  leave(w, ['mouth'], 1);
  shotOn(w, part(w, 'mouth'));
  step(w);
  const ev = drain(w);
  assert.equal(ofType(ev, 'bossDeath').length, 1);
  assert.equal(w.bullets.length, 0);
  assert.equal(ofType(ev, 'nearMiss').length, 0);
});

const fight = (kind) => {
  const w = createWorld(bossLevel(kind, 0, { seed: 5 }), 5);
  w.ship.invuln = Infinity;
  return w;
};

test('a destroyed part launches no minions; a live one still does', () => {
  const w = fight('giant'); // its last phase: cats from the mouth, a rabbit from the brow
  leave(w, ['eyeL', 'eyeR', 'mouth'], 5); // the brow is gone
  const seen = new Set();
  for (let i = 0; i < 60 * 45; i++) {
    stepWorld(w, TICK, IDLE);
    w.events.length = 0;
    for (const a of w.aliens) seen.add(a.species);
  }
  assert.deepEqual([...seen], ['cat']);
});
