import { createWorld, stepWorld } from '../../src/core/world.js';
import { finished } from '../../src/core/util.js';
import { LEVELS } from '../../src/core/levels.js';
import { level, playing, input, step, shotFrom, TICK } from './world-kit.js';

// Shared by the boss tests: a boss level (no waves, so the boss is there from the start), a quiet
// world past the boss's entrance, a shot dropped just under a part, and the simple bot that every
// boss has to lose to.
export const bossLevel = (kind, d = 0, extra = {}) => level(undefined, d, { boss: kind, ...extra });
// A quiet world with the boss in place and its entrance over.
export function bossWorld(kind, opts) {
  const world = playing(bossLevel(kind), opts);
  while (world.boss.enter > 0) step(world);
  world.events.length = 0;
  return world;
}
export const part = (world, id) => world.boss.parts.find((p) => p.id === id);
// The boss as its level fights it, at the level's difficulty, without the waves before it.
export function realLevel(kind) {
  const lv = LEVELS.find((l) => l.boss === kind) ?? LEVELS.at(-1); // until a level brings the camel's giant
  return bossLevel(kind, lv.d, { seed: lv.seed });
}

// A ship shot 8 px under the part's lower edge, flying straight up.
export const shotOn = (world, p) => shotFrom(world, p.x, p.y + p.h / 2 + 8);

// Kill every part but the named ones, which are left with `hp`.
export function leave(world, ids, hp = 1) {
  for (const p of world.boss.parts) p.hp = ids.includes(p.id) ? hp : 0;
}

// Can a shot climbing from the player zone reach the part? Some column across it, inside the zone,
// has no live part lower than it (a shot is spent on the first part it meets), and its lower edge
// is above the muzzle of a ship at the top of the zone (y 620 - 22).
export function reachable(world, p) {
  if (p.y + p.h / 2 > 598) return false;
  for (let i = 0; i <= 10; i++) {
    const x = p.x + (i / 5 - 1) * (p.w / 2);
    const blocked = world.boss.parts.some((q) =>
      q !== p && q.hp > 0 && Math.abs(x - q.x) <= q.w / 2 + 5 && q.y + q.h / 2 > p.y + p.h / 2);
    if (x >= 40 && x <= 1880 && !blocked) return true;
  }
  return false;
}

const TRAVEL = 30; // ticks a shot takes to climb from the ship to the boss

// Stand under the nearest weak part, aimed where it will be, and hold fire with an invulnerable
// ship. `onTick(world)` sees the world after every step. Returns the world and every event, until
// cleared or `limit` s.
export function botFight(kind, limit = 120, onTick = () => {}) {
  const world = createWorld(realLevel(kind));
  world.ship.invuln = Infinity;
  const prev = {};
  const log = [];
  while (!finished(world) && world.t < limit) {
    const weak = world.boss.parts.filter((p) => p.hp > 0 && p.weak);
    let aim = world.ship.x;
    if (weak.length) {
      const near = weak.reduce((a, b) => (Math.abs(b.x - aim) < Math.abs(a.x - aim) ? b : a));
      aim = near.x + (near.x - (prev[near.id] ?? near.x)) * TRAVEL;
    }
    for (const p of world.boss.parts) prev[p.id] = p.x;
    stepWorld(world, TICK, input({ fire: true, target: { x: aim, y: 1000 } }));
    log.push(...world.events.splice(0));
    onTick(world);
  }
  return { world, log };
}
