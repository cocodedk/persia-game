// Level data, plain and serialisable:
//   { id, name, seed, d, boss,
//     waves: [{ formation, cols, species: [id per row, top row first], pattern, speed }] }
// The waves fly in order, then the boss. `seed` is the fixed seed of the level's world rng, `d` its
// difficulty (difficulty.js), `name` what the screens call it.
//
//   w(formation, cols, rows, pattern, speed)  one wave. `rows` is one species letter per row, top
//        row first: d dog, c cat, b bird, f fish, h horse, o cow, r rabbit. Every alien of a row is
//        that row's animal and fights as its role (SPECIES, in makeSlots), so a rabbit row holds
//        `cols` carriers; rabbit rows therefore live in narrow waves (3 cols), which keeps the
//        power-ups worth having.
//        `speed` multiplies the formation's pace and stacks with scaled(d).formationSpeed.
import { bossDef } from './bosses-data.js';

const LETTER = { d: 'dog', c: 'cat', b: 'bird', f: 'fish', h: 'horse', o: 'cow', r: 'rabbit' };

const w = (formation, cols, rows, pattern, speed) =>
  ({ formation, cols, species: [...rows].map((c) => LETTER[c]), pattern, speed });

export const LEVEL = {
  id: 'level-1', name: 'Level 1', seed: 10417, d: 0.1, boss: 'giant',
  waves: [
    w('grid', 10, 'ddd', 'aimed', 0.9), // 1: a pack of dogs marches in
    w('escort', 3, 'oro', 'aimed', 0.95), // 2: cows guard the rabbits: the first power-ups
    w('dive', 8, 'bcc', 'fan', 1.0), // 3: birds and cats swoop
    w('sway', 8, 'hhf', 'fan', 1.05), // 4: horses and fish, all gunners
    w('spiral', 10, 'ccdd', 'ring', 1.15), // 5: forty cats and dogs
  ],
};

// The animals a level brings, in the order they first appear: its waves' species, then its boss's.
export function levelSpecies(level) {
  const ids = (level.waves ?? []).flatMap((x) => x.species);
  if (level.boss) ids.push(bossDef(level.boss).species);
  return [...new Set(ids)];
}
