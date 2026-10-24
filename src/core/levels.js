import { BOSSES } from './kinds.js';
import { difficulty } from './difficulty.js';

// Level data, plain and serialisable. Each level, in order, is
//   { id: 'w<world>-<index>', world, index, seed, d,
//     waves: [{ formation, rows, cols, roles: [role per row], pattern, speed }] }
// for index 1-4, and the same without `waves` but with `boss` for index 5. `seed` is the fixed seed
// of the level's world rng, `d` its difficulty (difficulty.js).
//
// Two shorthands:
//   w(formation, cols, roles, pattern, speed)  one wave. `roles` is one letter per row, top row
//        first: g grunt, d diver, u gunner, a armored, c carrier. Every alien of a row gets that
//        row's role, so a carrier row holds `cols` carriers; carrier rows therefore live in
//        narrow waves (3 cols), which keeps the power-ups worth having. `speed` multiplies the
//        formation's pace and stacks with scaled(d).formationSpeed.
//   lv(seed, waves)  one level. `lv(seed)` alone is the world's boss level.
const ROLE = { g: 'grunt', d: 'diver', u: 'gunner', a: 'armored', c: 'carrier' };

const w = (formation, cols, roles, pattern, speed) =>
  ({ formation, rows: roles.length, cols, roles: [...roles].map((c) => ROLE[c]), pattern, speed });

const lv = (seed, waves) => ({ seed, waves });

export const WORLDS = [{ id: 1, name: 'Arcade Origin', boss: BOSSES[0] }];

// A level's world name, and its place in the world: 'Reel 3', or the boss level's 'Finale'.
export const worldName = (level) => WORLDS[level.world - 1]?.name ?? '';
export const reelName = (level) => (level.boss ? 'Finale' : `Reel ${level.index}`);

// The classic march with plain shots, then fans and rings.
const SPECS = [
  lv(10417, [
    w('grid', 8, 'ggg', 'aimed', 0.85),
    w('sway', 6, 'ggd', 'aimed', 0.9),
    w('grid', 3, 'ggc', 'aimed', 0.9),
  ]),
  lv(10852, [
    w('grid', 8, 'uggg', 'aimed', 0.9),
    w('dive', 6, 'dg', 'aimed', 0.95),
    w('sway', 7, 'ugg', 'fan', 0.95),
    w('sway', 2, 'gcg', 'aimed', 1.0),
  ]),
  lv(11329, [
    w('split', 6, 'ug', 'fan', 1.0),
    w('grid', 8, 'uggg', 'aimed', 1.0),
    w('dive', 8, 'dgu', 'fan', 1.05),
    w('escort', 3, 'aca', 'aimed', 1.05),
  ]),
  lv(11766, [
    w('grid', 8, 'uugg', 'fan', 1.05),
    w('spiral', 6, 'gdu', 'fan', 1.1),
    w('sway', 8, 'gag', 'ring', 1.1),
    w('escort', 3, 'uca', 'fan', 1.15),
    w('grid', 10, 'uugg', 'aimed', 1.2),
  ]),
  lv(12203),
];

// One level from its spec. A spec without waves is the world's boss level.
function level(index, { seed, waves }) {
  const home = WORLDS[0];
  const base = { id: `w1-${index}`, world: home.id, index, seed, d: difficulty(home.id, index) };
  return waves ? { ...base, waves } : { ...base, boss: home.boss };
}

export const LEVELS = SPECS.map((spec, i) => level(i + 1, spec));

export const levelById = (id) => LEVELS.find((l) => l.id === id);
