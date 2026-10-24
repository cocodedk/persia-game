import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, stepWorld } from '../../src/core/world.js';
import { finished } from '../../src/core/util.js';
import { LEVELS } from '../../src/core/levels.js';
import { autopilot } from '../../src/core/autopilot.js';
import { TICK } from '../../src/core/kinds.js';
import { IDLE, step } from './world-kit.js';

// Shared by the autopilot tests.

// The events that mean a shot did something to its target.
export const landed = (events) =>
  events.filter((e) => (e.type === 'hit' && e.dmg > 0) || e.type === 'partDown' || e.type === 'wreckDown' || (e.type === 'kill' && e.scored));

// Put the ship on the autopilot's aim point and pull the trigger once; returns every event of the
// next 100 ticks (so `landed(...)` for what it hit, and `bunker` or `absorb` for what stopped it).
export function oneShot(world) {
  const w = structuredClone(world);
  const { target } = autopilot(w);
  Object.assign(w.ship, { x: target.x, y: target.y, vx: 0, vy: 0, cooldown: 0 });
  w.events.length = 0;
  w.shots.length = 0;
  step(w, 1, { ...IDLE, fire: true });
  step(w, 100);
  return w.events;
}

// The simulated seconds the autopilot may take to clear any level with an invulnerable ship: the
// test proves that a level can be finished, not that it is quick (R13).
export const LIMIT = 180;

// Fly `world` with the autopilot until it is cleared or failed, or `limit` s have passed.
export function fly(world, limit = LIMIT) {
  while (!finished(world) && world.t < limit) {
    stepWorld(world, TICK, autopilot(world));
    world.events.length = 0;
  }
  return world;
}

// One test per level of world `n`: this is what autopilot-w1.test.js registers.
export function clearsWorld(n) {
  for (const level of LEVELS.filter((l) => l.world === n)) {
    test(`the autopilot clears ${level.id} within ${LIMIT} s with an invulnerable ship`, () => {
      const world = createWorld(level, level.seed);
      world.ship.invuln = Infinity;
      fly(world);
      assert.equal(world.state, 'cleared', `${level.id}: ${world.state} at ${world.t.toFixed(1)} s, wave ${world.wave}, `
        + `${world.aliens.length} aliens, boss hp ${world.boss?.hp}`);
    });
  }
}
