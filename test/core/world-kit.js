import { createWorld, stepWorld } from '../../src/core/world.js';
import { TICK, SPECIES } from '../../src/core/kinds.js';
import { IDLE } from '../../src/core/input-codec.js';
import { makePickup } from '../../src/core/powerups.js';

export { TICK, IDLE };

// Shared by the world tests: tiny levels, a quiet world, and injected shots and bullets, so each
// test exercises one rule without waiting for the real thing to line up.
export const input = (o) => ({ ...IDLE, ...o });
export const FIRE = input({ fire: true });

// A wave of animals, one `species` per row, top row first (one row of dogs by default). `roles` is a
// shorthand for a test about a role: each row is the first animal that fights as that role.
const animalOf = (role) => Object.keys(SPECIES).find((s) => SPECIES[s] === role);
export function wave({ roles = ['grunt'], ...o } = {}) {
  return { formation: 'grid', cols: 3, species: roles.map(animalOf), pattern: 'aimed', speed: 1, ...o };
}
export const level = (waves, d = 0, extra = {}) => ({ id: 't-1', seed: 1, d, first: 1, waves, ...extra });

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

// Wipe the field (no kills scored), and step the tick that notices it.
export function clear(world) {
  for (const a of world.aliens) a.hp = 0;
  step(world);
}
export const ofType = (events, type) => events.filter((e) => e.type === type);

// A ship shot placed at (x, y) flying straight up (and returned), a ship shot placed on an alien, and
// an enemy bullet placed anywhere.
export function shotFrom(world, x, y, life = 1) {
  const shot = { pattern: 'shot', x, y, vx: 0, vy: -1400, r: 5, life, dmg: 1 };
  world.shots.push(shot);
  return shot;
}
export const shotAt = (world, a) => shotFrom(world, a.x, a.y + 8);
export const bulletAt = (world, x, y, vx = 0, vy = 0, r = 8) =>
  world.bullets.push({ pattern: 'aimed', x, y, vx, vy, r, life: 6 });
export const bulletOnShip = (world) => bulletAt(world, world.ship.x, world.ship.y);

// A pickup placed anywhere, as a carrier drops it.
export const pickupAt = (world, kind, x, y) => world.pickups.push(makePickup(kind, x, y));
export const pickupOnShip = (world, kind) => pickupAt(world, kind, world.ship.x, world.ship.y);
