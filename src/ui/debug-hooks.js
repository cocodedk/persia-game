// ?debug only (never in normal play): two hooks for checking the game by hand.
//   ?debug&boss   the game boots straight into level 1 with the giant already up
//   ?debug&auto   the autopilot flies every level played (r.pilot, router.js)
// installDebug(r) -> the level to boot into, or null
import { LEVEL } from '../core/levels.js';
import { autopilot } from '../core/autopilot.js';

export function installDebug(r) {
  const q = new URLSearchParams(location.search);
  if (!q.has('debug')) return null;
  if (q.has('auto')) r.pilot = autopilot;
  return q.has('boss') ? { ...LEVEL, waves: null } : null; // a level without waves starts with its boss
}
