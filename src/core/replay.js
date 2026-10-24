import { createWorld, stepWorld } from './world.js';
import { levelById } from './levels.js';
import { TICK } from './kinds.js';
import { decodeInputs, encodeInputs, MAX_TICKS } from './input-codec.js';
import { isRecord, isCount, validScore } from './util.js';
import { MAX_STARS } from './scoring.js';

export { stateHash } from './state-hash.js';
export { quantizeInput, encodeInputs, decodeInputs, MAX_TICKS } from './input-codec.js';
export { TICK };

// A run is its level, its seed and the input of every tick: the core is deterministic, so
// re-simulating those gives back every state and event of the run.
//   run    { v: 5, level: 'w3-2', seed, ticks, inputs: <encoded>, score, stars }   (makeRun)
// The inputs and their text form are in input-codec.js. RUN_V goes up whenever a rule change makes
// the same inputs play out differently: an older run would replay diverged, so it is not read at all
// (2: task 13a's rules: bullets spent on a blinking ship, near misses, the shuriken cut, boss minions,
// the reborn armored; 3: task 13b's tuning: level waves, boss hp and attacks, gunner minions that
// hold their fire at point blank; 4: formations kept clear of the HUD, R41, and a gentler
// mothership, R42; 5: pickups worth 500 and swept up at the clear, R51).
const RUN_V = 5;

// The storable form of a finished run. `level` is a level or its id; `result` is { score, stars }.
export const makeRun = (level, seed, inputs, result) => ({
  v: RUN_V, level: level.id ?? level, seed, ticks: inputs.length, inputs: encodeInputs(inputs),
  score: result.score, stars: result.stars,
});

// A saved run read back: the same fields with `inputs` decoded to a list, or null when it is not a
// valid run of version RUN_V (wrong version, unknown level, bad numbers, an encoding that is garbage
// or whose length is not `ticks`, which is what a truncation looks like).
export function decodeRun(obj) {
  if (!isRecord(obj) || obj.v !== RUN_V) return null;
  const { level, seed, ticks, score, stars } = obj;
  if (typeof level !== 'string' || !levelById(level)) return null;
  if (!isCount(seed, 2 ** 32 - 1) || !isCount(ticks, MAX_TICKS) || !isCount(stars, MAX_STARS)) return null;
  if (!validScore(score)) return null;
  const inputs = decodeInputs(obj.inputs, ticks);
  return inputs && inputs.length === ticks ? { v: RUN_V, level, seed, ticks, inputs, score, stars } : null;
}

// Re-simulate a run: a fresh world for `level` (a level or its id) and `seed`, stepped through
// `inputs`, its events drained into one list as the game loop does. `snapshotsAt` lists ticks at
// which to keep a structuredClone of the world as it stands after that many ticks, i.e. before
// inputs[tick] is applied, so stepping a snapshot on from inputs[tick] carries the run on; a tick
// the run never reaches has none. (A cleared or failed world no longer moves.)
export function replay(level, seed, inputs, { snapshotsAt = [] } = {}) {
  const lv = typeof level === 'string' ? levelById(level) : level;
  if (!lv) throw new Error(`unknown level: ${level}`);
  const world = createWorld(lv, seed);
  const want = new Set(snapshotsAt);
  const snapshots = new Map();
  const events = [];
  const snap = () => {
    if (want.has(world.tick) && !snapshots.has(world.tick)) snapshots.set(world.tick, structuredClone(world));
  };
  snap();
  for (const input of inputs) {
    stepWorld(world, TICK, input);
    events.push(...world.events.splice(0));
    snap();
  }
  return { world, events, snapshots };
}
