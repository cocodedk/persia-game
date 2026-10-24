import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, stepWorld } from '../../src/core/world.js';
import { levelById } from '../../src/core/levels.js';
import { IDLE, TICK, level, wave, input, step, seconds, playing, drain, ofType, bulletAt } from './world-kit.js';
import { bossLevel, bossWorld, leave, part, shotOn } from './boss-kit.js';

// Small fairness rules (task 13a): near misses that end early still count (wipes do not, R37),
// minions come only from parts still standing, and gunner minions shoot, but not point blank.

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
  const w = bossWorld('mothership');
  bulletAt(w, w.ship.x - 25, w.ship.y);
  step(w);
  assert.equal(w.bullets[0].near, 25, 'it is in the band');
  leave(w, ['eye'], 1);
  shotOn(w, part(w, 'eye'));
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
  const w = fight('mothership'); // its last phase: grunts from the eye, a carrier from the dome
  leave(w, ['gunL', 'gunR', 'eye'], 5); // the dome is gone
  const seen = new Set();
  for (let i = 0; i < 60 * 45; i++) {
    stepWorld(w, TICK, IDLE);
    w.events.length = 0;
    for (const a of w.aliens) seen.add(a.role);
  }
  assert.deepEqual([...seen], ['grunt']);
});

// A gunner minion held `dy` px above the ship (negative: below it) for 20 s: how often it fires.
function minionShots(dy) {
  const w = createWorld(levelById('w1-5'));
  w.ship.invuln = Infinity;
  while (w.state !== 'play' || w.boss.enter > 0) stepWorld(w, TICK, IDLE);
  const m = { id: 999, role: 'gunner', x: 0, y: 0, hp: 2, maxHp: 2, slot: null, mode: 'dive', t: 0, dive: null, minion: true, vx: 0 };
  w.aliens.push(m);
  let n = 0;
  for (let i = 0; i < 60 * 20; i++) {
    Object.assign(m, { x: w.ship.x + 40, y: w.ship.y - dy, hp: 2 });
    stepWorld(w, TICK, IDLE);
    n += w.events.filter((e) => e.type === 'fire' && e.id === 999).length;
    w.events.length = 0;
  }
  return n;
}

test('a gunner minion holds its fire inside 180 px of the ship, and once it is below the ship', () => {
  assert.ok(minionShots(400) > 0, 'it fires from afar');
  assert.equal(minionShots(150), 0, 'not point blank');
  assert.equal(minionShots(-60), 0, 'not from below');
});
