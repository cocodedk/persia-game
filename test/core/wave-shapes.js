import { LEVELS } from '../../src/core/levels.js';

// Shared by the formation tests: a wave of any size, and the sizes that matter. Row 1 is rabbits (a
// carrier row), the odd rows after it cows (armoured), the rest dogs.
export const wave = (rows, cols, formation = 'grid') => ({
  formation, cols, pattern: 'aimed', speed: 1,
  species: Array.from({ length: rows }, (_, r) => (r === 1 ? 'rabbit' : r % 2 ? 'cow' : 'dog')),
});

// Every shape a level uses, plus 1- and 2-column and oversized extremes.
export const SHAPES = new Map();
for (const w of LEVELS.flatMap((l) => l.waves)) SHAPES.set(`${w.species.length}x${w.cols}`, wave(w.species.length, w.cols));
for (const [r, c] of [[3, 1], [1, 3], [2, 2], [4, 14], [6, 5]]) SHAPES.set(`${r}x${c}`, wave(r, c));

export const CTXS = [
  { aliveFrac: 1, dir: 1, speed: 0.8 },
  { aliveFrac: 0.05, dir: -1, speed: 1.9 },
];
export const ONE = { aliveFrac: 1, dir: 1, speed: 1 };
