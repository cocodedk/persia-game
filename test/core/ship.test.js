import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from '../../src/core/world.js';
import { SHIP_R, SHIP_SPEED, ZONE } from '../../src/core/ship.js';
import { TICK, input, level, wave, step, seconds, playing, drain, ofType } from './world-kit.js';

const lv = () => level([wave({ cols: 6 })]);

test('a fresh ship: 3 lives, 1 bomb, mid-zone, hit radius 14', () => {
  const { ship } = createWorld(lv(), 1);
  assert.equal(ship.lives, 3);
  assert.equal(ship.bombs, 1);
  assert.equal(ship.alive, true);
  assert.equal(ship.power, null);
  assert.equal(SHIP_R, 14);
  assert.ok(ship.x >= ZONE.x0 && ship.x <= ZONE.x1 && ship.y >= ZONE.y0 && ship.y <= ZONE.y1);
});

test('the ship clamps to the player zone on every side', () => {
  const w = playing(lv());
  seconds(w, 4, input({ dx: 1, dy: 1 }));
  assert.deepEqual([w.ship.x, w.ship.y, w.ship.vx, w.ship.vy], [1880, 1040, 0, 0]);
  seconds(w, 4, input({ dx: -1, dy: -1 }));
  assert.deepEqual([w.ship.x, w.ship.y, w.ship.vx, w.ship.vy], [40, 620, 0, 0]);
});

test('easing: max speed in under 0.25 s but not on the first tick, and it stops just as fast', () => {
  const w = playing(lv());
  w.ship.x = 200;
  step(w, 1, input({ dx: 1 }));
  assert.ok(w.ship.vx > 0 && w.ship.vx < SHIP_SPEED, 'eases, does not snap');
  let ticks = 1;
  while (w.ship.vx < SHIP_SPEED) {
    step(w, 1, input({ dx: 1 }));
    ticks++;
  }
  assert.ok(ticks * TICK < 0.25, `reached ${SHIP_SPEED} px/s after ${ticks} ticks`);
  let stop = 0;
  while (w.ship.vx > 0) {
    step(w);
    stop++;
  }
  assert.ok(stop * TICK < 0.25, `stopped after ${stop} ticks`);
});

test('diagonal flight is no faster than straight flight', () => {
  const w = playing(lv());
  w.ship.x = 400;
  w.ship.y = 800;
  seconds(w, 0.5, input({ dx: 1, dy: -1 }));
  assert.ok(Math.hypot(w.ship.vx, w.ship.vy) <= SHIP_SPEED + 1e-9);
});

test('a pointer target pulls the ship there without overshoot, and clamps to the zone', () => {
  const w = playing(lv());
  let top = 0;
  for (let i = 0; i < 180; i++) {
    step(w, 1, input({ target: { x: 300, y: 700 } }));
    top = Math.max(top, Math.hypot(w.ship.vx, w.ship.vy));
    assert.ok(w.ship.x >= 300 - 1e-6, `tick ${i}: overshot to x ${w.ship.x}`);
    assert.ok(w.ship.y >= 700 - 1e-6, `tick ${i}: overshot to y ${w.ship.y}`);
  }
  assert.ok(Math.abs(w.ship.x - 300) < 1 && Math.abs(w.ship.y - 700) < 1, 'settles on the target');
  assert.ok(top <= SHIP_SPEED + 1e-9 && top > 600, `fast on the way, got ${top}`);
  seconds(w, 3, input({ target: { x: 9000, y: -50 } }));
  assert.deepEqual([w.ship.x, w.ship.y], [1880, 620]);
});

test('cooldown: holding fire shoots every 0.18 s, never faster', () => {
  const w = playing(lv());
  const ticks = [];
  for (let i = 0; i < 60; i++) {
    step(w, 1, input({ fire: true }));
    for (const e of ofType(drain(w), 'fire')) ticks.push(e.tick);
  }
  assert.equal(ticks.length, 6);
  for (let i = 1; i < ticks.length; i++) assert.ok((ticks[i] - ticks[i - 1]) * TICK >= 0.18 - 1e-9);
});

test('a base shot flies 1400 px/s straight up for 1 damage', () => {
  const w = playing(lv());
  step(w, 1, input({ fire: true }));
  const [s] = w.shots;
  assert.equal(s.vy, -1400);
  assert.equal(s.vx, 0);
  assert.equal(s.dmg, 1);
  assert.ok(Math.abs(s.x - w.ship.x) < 1e-9 && s.y < w.ship.y);
  const y = s.y;
  step(w);
  assert.ok(Math.abs(w.shots[0].y - (y - 1400 * TICK)) < 1e-9);
});

test('shots that leave the screen are dropped', () => {
  const w = playing(lv());
  step(w, 1, input({ fire: true }));
  seconds(w, 1.5);
  assert.equal(w.shots.length, 0);
});

test('the intro lets the ship move but not shoot', () => {
  const w = createWorld(lv(), 1);
  const x = w.ship.x;
  step(w, 10, input({ dx: 1, fire: true }));
  assert.equal(w.state, 'intro');
  assert.ok(w.ship.x > x);
  assert.equal(w.shots.length, 0);
  assert.equal(w.ship.cooldown, 0);
});
