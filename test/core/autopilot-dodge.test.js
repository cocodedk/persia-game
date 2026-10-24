import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stepWorld } from '../../src/core/world.js';
import { emitPattern } from '../../src/core/patterns.js';
import { autopilot } from '../../src/core/autopilot.js';
import { TICK } from '../../src/core/replay.js';
import { level, wave, playing, step, bulletAt } from './world-kit.js';

// An alien that holds still at x 960 and cannot be shot down (a cleared level would freeze the
// scene): the autopilot stands under it, at a spot N it keeps while nothing threatens it. The
// scenes aim at N.
function hover() {
  const world = playing(level([wave({ rows: 1, cols: 1, formation: 'spiral', speed: 0.001 })]));
  world.aliens[0].hp = 99;
  return world;
}
const N = Math.round(autopilot(hover()).target.x);

const run = (world, ticks) => {
  for (let i = 0; i < ticks; i++) stepWorld(world, TICK, autopilot(world));
  return world.hits;
};

test('it steps out of the way of a falling bullet, a wall of three, and a laser', () => {
  const scenes = {
    bullet: (w) => bulletAt(w, N, 700, 0, 400),
    wall: (w) => [N - 60, N, N + 60].forEach((x) => bulletAt(w, x, 700, 0, 400)),
    laser: (w) => w.bullets.push(...emitPattern('laser', { x: N, y: 100 }, { x: N, y: 1000 }, { speed: 300 }, w.rng)),
  };
  for (const [name, make] of Object.entries(scenes)) {
    const control = hover();
    control.ship.x = N;
    make(control);
    step(control, 120);
    assert.ok(control.hits >= 1, `${name}: standing at N is a hit`);
    const world = hover();
    make(world);
    assert.equal(run(world, 120), 0, `${name}: the autopilot is not hit`);
  }
});

test('it gets out of the way of a diver that is coming down on it', () => {
  const swooper = () => {
    const w = playing(level([wave({ rows: 1, cols: 1, formation: 'dive', roles: ['diver'] })]));
    const a = w.aliens[0];
    a.hp = 99; // it must be dodged, not shot down
    Object.assign(a, { mode: 'dive', t: 0, dive: { fx: a.x, fy: a.y, ax: w.ship.x, ay: w.ship.y } });
    return w;
  };
  const control = swooper();
  step(control, 180);
  assert.ok(control.hits >= 1, 'standing still is a ram');
  assert.equal(run(swooper(), 180), 0);
});

test('it does not dodge what cannot hurt it: a blinking ship, a shielded ship', () => {
  const falling = (set) => {
    const w = hover();
    bulletAt(w, N, 800, 0, 400);
    set(w.ship);
    return autopilot(w).target.x;
  };
  assert.ok(Math.abs(falling(() => {}) - N) > 20, 'a bare ship steps aside');
  assert.equal(falling((s) => { s.invuln = 1.5; }), N, 'blinking');
  assert.equal(falling((s) => { s.power = { kind: 'shield', left: 8 }; }), N, 'shielded');
  assert.ok(Math.abs(falling((s) => { s.power = { kind: 'shield', left: 0.2 }; }) - N) > 20, 'a shield about to run out is no cover');
});
