// The number formats shared by the screens and the HUD (DOM-free).
//   fmt(n)                          12,345 (rounded)
//   localDigits(n, digits)          n written in `digits`, ten of them, 0 to 9 (the pack's)
//   waveText(level, wave)           the HUD's wave count in the world's numbers, 'WAVE 6 / 10', in
//                                   the pack's digits when the level shows its wave count in Persian
//   scoreText(level, score)         the HUD's score, '146,800', in the pack's digits and grouping
//                                   when the level shows its score in Persian
import { waveNumber } from '../core/levels.js';
import { PACK } from '../data/pack.js';

export const fmt = (n) => Math.round(n).toLocaleString('en-US');

export const localDigits = (n, digits) => [...String(n)].map((d) => digits[d]).join('');

// s with its digits and thousands marks in the pack's, when the level shows `part` of the HUD in Persian.
const PERSIAN = { ...PACK.digits, ',': PACK.group };
const local = (level, part, s) => (level.persian.includes(part) ? localDigits(s, PERSIAN) : s);

export function waveText(level, wave) {
  const show = (n) => local(level, 'wave', String(n));
  return `WAVE ${show(waveNumber(level, Math.max(1, wave)))} / ${show(waveNumber(level, level.waves.length))}`;
}

export const scoreText = (level, score) => local(level, 'score', fmt(score));
