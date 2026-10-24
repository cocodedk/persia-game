import { stepWorld } from '../../src/core/world.js';
import { finished } from '../../src/core/util.js';
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

// The simulated seconds the autopilot may take to clear level 1 with an invulnerable ship: the test
// proves that the level can be finished, not that it is quick (R13).
export const LIMIT = 300;

// Fly `world` with the autopilot until it is cleared or failed, or `limit` s have passed.
export function fly(world, limit = LIMIT) {
  while (!finished(world) && world.t < limit) {
    stepWorld(world, TICK, autopilot(world));
    world.events.length = 0;
  }
  return world;
}
