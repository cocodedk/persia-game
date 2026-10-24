// The number formats shared by the screens and the HUD (DOM-free).
//   fmt(n)                          12,345 (rounded)
//   localDigits(n, digits)          n written in `digits`, ten of them, 0 to 9 (the pack's)
//   waveText(level, wave, digits)   the HUD's wave count in the world's numbers, 'WAVE 6 / 10', in
//                                   `digits` when the level shows its wave count in Persian
import { waveNumber } from '../core/levels.js';

export const fmt = (n) => Math.round(n).toLocaleString('en-US');

export const localDigits = (n, digits) => [...String(n)].map((d) => digits[d]).join('');

export function waveText(level, wave, digits) {
  const show = (n) => (level.persian.includes('wave') ? localDigits(n, digits) : String(n));
  return `WAVE ${show(waveNumber(level, Math.max(1, wave)))} / ${show(waveNumber(level, level.waves.length))}`;
}
