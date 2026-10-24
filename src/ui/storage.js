// Saved progress, adapted from Barrage: best score and best stars per level, the best run per level
// (trailer/runs.js stores and reads it), the mute switch and whether the demo was seen. Every localStorage
// touch is wrapped: private windows, kiosks and blocked storage play on without saving. Whatever is
// written also lands in memory, so a session without storage still remembers its own results.
//   keys  persia.best        { [levelId]: { score, stars } }
//         persia.run.<id>    a run as makeRun builds it (JSON)
//         persia.muted       '1' | '0'      persia.demoSeen  '1'
// createStorage(getBackend) takes a function returning the backend (the getter itself may throw);
// `store` is the game's instance over globalThis.localStorage.
import { isRecord, isCount, validScore } from '../core/util.js';
import { MAX_STARS } from '../core/scoring.js';

export const PREFIX = 'persia.';
const NONE = Object.freeze({ score: 0, stars: 0 });

const validStars = (v) => isCount(v, MAX_STARS);

// The saved best map with every malformed entry dropped.
function cleanBest(raw) {
  const out = {};
  if (!isRecord(raw)) return out;
  for (const [id, e] of Object.entries(raw)) {
    if (isRecord(e) && validScore(e.score) && validStars(e.stars)) out[id] = { score: e.score, stars: e.stars };
  }
  return out;
}

export function createStorage(getBackend = () => globalThis.localStorage) {
  const memory = new Map(); // key (without the prefix) -> string written this session

  function read(key) {
    if (memory.has(key)) return memory.get(key);
    try {
      return getBackend()?.getItem(PREFIX + key) ?? null;
    } catch {
      return null; // unreadable: as if nothing were saved
    }
  }

  // true when the backend took it
  function write(key, value) {
    memory.set(key, value);
    try {
      const back = getBackend();
      if (!back) return false;
      back.setItem(PREFIX + key, value);
      return true;
    } catch {
      return false; // full or blocked: the in-memory copy holds for this session
    }
  }

  function readJSON(key) {
    const raw = read(key);
    if (raw == null) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null; // corrupted
    }
  }

  const allBest = () => cleanBest(readJSON('best'));
  const best = (id) => ({ ...(allBest()[id] ?? NONE) });

  // A finished level: keep the higher score and the higher stars, each on its own.
  function recordResult(id, { score, stars }) {
    const all = allBest();
    const prev = all[id] ?? NONE;
    const s = validScore(score) ? score : 0;
    const st = validStars(stars) ? stars : 0;
    const kept = { score: Math.max(prev.score, s), stars: Math.max(prev.stars, st) };
    all[id] = kept;
    write('best', JSON.stringify(all));
    return { best: kept, newBest: s > prev.score };
  }

  return {
    allBest,
    best,
    recordResult,
    bestRun: (id) => {
      const run = readJSON(`run.${id}`);
      return isRecord(run) ? run : null;
    },
    setBestRun: (id, run) => write(`run.${id}`, JSON.stringify(run)),
    muted: () => read('muted') === '1',
    setMuted: (on) => write('muted', on ? '1' : '0'),
    demoSeen: () => read('demoSeen') === '1',
    setDemoSeen: () => write('demoSeen', '1'),
  };
}

export const store = createStorage();
