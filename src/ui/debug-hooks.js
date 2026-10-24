// ?debug only (never in normal play): two hooks for checking the game by hand.
//   ?debug&level=w1-3   the game boots straight into that level
//   ?debug&auto         the autopilot flies every level played (r.pilot, router.js)
// installDebug(r) -> the level to boot into, or null
import { levelById } from '../core/levels.js';
import { autopilot } from '../core/autopilot.js';

export function installDebug(r) {
  const q = new URLSearchParams(location.search);
  if (!q.has('debug')) return null;
  if (q.has('auto')) r.pilot = autopilot;
  return levelById(q.get('level')) ?? null;
}
