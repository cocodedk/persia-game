import { createWorld, stepWorld } from '../../src/core/world.js';
import { levelById } from '../../src/core/levels.js';
import { makeRng } from '../../src/core/rng.js';
import { TICK } from '../../src/core/replay.js';

// Shared by the replay, clone and perf tests: seeded random input lists of the exact shape the
// game feeds the core (quantized: dx, dy in -1..1, integer pointer target or null), and a live run.
export function randomInputs(seed, n, { mouse = true } = {}) {
  const rng = makeRng(seed);
  const list = [];
  let cur = { dx: 0, dy: 0, fire: true, bomb: false, target: null };
  for (let i = 0; i < n; i++) {
    if (rng() < 0.12) {
      const usePointer = mouse && rng() < 0.4;
      cur = {
        dx: usePointer ? 0 : Math.floor(rng() * 3) - 1,
        dy: usePointer ? 0 : Math.floor(rng() * 3) - 1,
        fire: rng() < 0.85,
        bomb: rng() < 0.04,
        target: usePointer ? { x: Math.floor(rng() * 1920), y: 600 + Math.floor(rng() * 480) } : null,
      };
    }
    list.push({ ...cur, target: cur.target && { ...cur.target } });
  }
  return list;
}

// Step a fresh world through `inputs` the way the game loop does, draining events every tick.
export function liveRun(id, inputs) {
  const level = levelById(id);
  const world = createWorld(level, level.seed);
  const events = [];
  for (const input of inputs) {
    stepWorld(world, TICK, input);
    events.push(...world.events.splice(0));
  }
  return { world, events, level };
}
