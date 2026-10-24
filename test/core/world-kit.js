import { createWorld, stepWorld } from '../../src/core/world.js';
import { TICK, SPECIES } from '../../src/core/kinds.js';
import { IDLE } from '../../src/core/input-codec.js';
import { makePickup } from '../../src/core/powerups.js';

export { TICK, IDLE };

// Shared by the world tests: tiny levels, a quiet world, and injected shots and bullets, so each
// test exercises one rule without waiting for the real thing to line up.
export const input = (o) => ({ ...IDLE, ...o });
export const FIRE = input({ fire: true });

// A wave given `species` (one per row) takes its rows and roles from them, as levels.js's w() does.
export function wave(o = {}) {
  const animals = o.species ? { rows: o.species.length, roles: o.species.map((s) => SPECIES[s]) } : {};
  return { formation: 'grid', rows: 1, cols: 3, roles: ['grunt'], pattern: 'aimed', speed: 1, ...animals, ...o };
}
export const level = (waves, d = 0, extra = {}) => ({ id: 't-1', seed: 1, d, waves, ...extra });

export function step(world, ticks = 1, inp = IDLE) {
  for (let i = 0; i < ticks; i++) stepWorld(world, TICK, inp);
}
export const seconds = (world, s, inp = IDLE) => step(world, Math.round(s * 60), inp);

// A world past its intro with every alien holding; `quiet` stops all enemy fire.
export function playing(lv, { seed = 1, quiet = true } = {}) {
  const world = createWorld(lv, seed);
  if (quiet) world.scale.fireMult = 0;
  while (world.state === 'intro') step(world);
  step(world, 3);
  world.events.length = 0;
  return world;
}

export const drain = (world) => world.events.splice(0);
export const ofType = (events, type) => events.filter((e) => e.type === type);

// A ship shot placed on an alien, and an enemy bullet placed anywhere.
export const shotAt = (world, a) =>
  world.shots.push({ pattern: 'shot', x: a.x, y: a.y + 8, vx: 0, vy: -1400, r: 5, life: 1, dmg: 1 });
export const bulletAt = (world, x, y, vx = 0, vy = 0, r = 8) =>
  world.bullets.push({ pattern: 'aimed', x, y, vx, vy, r, life: 6 });
export const bulletOnShip = (world) => bulletAt(world, world.ship.x, world.ship.y);

// A pickup placed anywhere, as a carrier drops it.
export const pickupAt = (world, kind, x, y) => world.pickups.push(makePickup(kind, x, y));
export const pickupOnShip = (world, kind) => pickupAt(world, kind, world.ship.x, world.ship.y);
