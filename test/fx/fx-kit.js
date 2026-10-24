import { makeRng } from '../../src/core/rng.js';
import { TICK } from '../../src/core/kinds.js';
import { createFx, stepFx } from '../../src/fx/fx.js';
import { applyEvents } from '../../src/fx/react.js';

// Shared by the fx tests: a fresh fx, one event applied, and time moved forward.
export { TICK };
export const run = (fx, secs) => { for (let i = 0; i < Math.round(secs * 60); i++) stepFx(fx, TICK); };

// A fresh fx with `ev` (one event, or a tick's list of them) applied through a seeded rng. world is
// optional, as it is in the game.
export function react(ev, world, seed = 1) {
  const fx = createFx();
  applyEvents(fx, [].concat(ev), makeRng(seed), world);
  return fx;
}

export const kindsOf = (fx) => new Set(fx.particles.map((p) => p.kind));
export const ofKind = (fx, kind) => fx.particles.filter((p) => p.kind === kind);
