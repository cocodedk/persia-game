import { LEVEL } from '../../src/core/levels.js';

// Shared by the formation tests: a wave of any size, and the sizes that matter.
export const wave = (rows, cols, formation = 'grid') => ({
  formation, rows, cols, pattern: 'aimed', speed: 1,
  roles: Array.from({ length: rows }, (_, r) => (r === 1 ? 'carrier' : r % 2 ? 'armored' : 'grunt')),
});

// Every shape level 1 uses, plus 1- and 2-column and oversized extremes.
export const SHAPES = new Map();
for (const w of LEVEL.waves) SHAPES.set(`${w.rows}x${w.cols}`, wave(w.rows, w.cols));
for (const [r, c] of [[3, 1], [1, 3], [2, 2], [4, 14], [6, 5]]) SHAPES.set(`${r}x${c}`, wave(r, c));

export const CTXS = [
  { aliveFrac: 1, dir: 1, speed: 0.8 },
  { aliveFrac: 0.05, dir: -1, speed: 1.9 },
];
export const ONE = { aliveFrac: 1, dir: 1, speed: 1 };
