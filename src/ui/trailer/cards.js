// The trailer's words: three title cards per world in that world's voice, filled from the run's
// stats, and the final card (the world as a film title, stars as the critics', the score as box
// office). DOM-free. Every line is original, and every placeholder has a form for zero, so a card
// still reads like a trailer when a stat is 0 ("NO NEAR MISSES", "NO COMBO NEEDED", "AN INSTANT").
// On a boss level the stat card names the boss that fell (its name from the boss data) where the
// other levels count the invaders: "THE HIVE QUEEN.", never "NOT ONE INVADER." (M4).
//   statsOf(events, ticks) -> { kills (scored: a ram is none), near, combo, time (s), bombs, stars,
//     hits, boss (the kind of the boss that died, or null) }
//   cardsFor(world, stats) -> [[line, ...] x 3]       fillLine(template, stats) -> line
//   finalCard({ level, stats, stars, score, newBest }) -> { kicker, title, stars, label, score, value, record, billing }
import { clamp } from '../../core/math.js';
import { reelName, worldName } from '../../core/levels.js';
import { fmt, clock } from '../format.js';
import { TICK } from '../../core/kinds.js';
import { bossDef } from '../../core/bosses-data.js';
import { MAX_STARS } from '../../core/scoring.js';

// n of a thing: "NOT ONE INVADER" / "ONE INVADER" / "47 INVADERS"
const count = (none, one, many) => (n) => (n <= 0 ? none : n === 1 ? one : `${fmt(n)} ${many}`);

function time(secs) {
  const s = Math.round(secs);
  if (secs < 1 || s < 1) return 'AN INSTANT';
  if (s === 1) return 'ONE SECOND';
  if (s < 90) return `${s} SECONDS`;
  return `${Math.round(s / 60)} MINUTES`;
}

const PHRASE = {
  kills: count('NOT ONE INVADER', 'ONE INVADER', 'INVADERS'),
  near: count('NO NEAR MISSES', 'ONE NEAR MISS', 'NEAR MISSES'),
  combo: (n) => (n >= 2 ? `A ×${n} COMBO` : 'NO COMBO NEEDED'),
  time,
  bombs: count('NO BOMBS', 'ONE BOMB', 'BOMBS'),
  stars: count('NO STARS', 'ONE STAR', 'STARS'),
};

export const KEYS = Object.keys(PHRASE);

// Per world, in world order: the opening line, then two cards that speak from the stats.
export const VOICES = [
  [ // Arcade Origin: earnest, coin-op
    ['IT BEGAN', 'WITH A SINGLE COIN.'],
    ['{kills}.', '{near}.', 'ONE PILOT.'],
    ['{combo}.', 'NO CONTINUES.'],
  ],
  [ // Neon Rain: noir
    ['IN A CITY', 'OF ENDLESS RAIN…'],
    ['{kills} WENT DARK.', '{near} IN THE NEON.'],
    ['{combo}.', 'NO WITNESSES.'],
  ],
  [ // Twin Suns: desert epic
    ['ON A WORLD', 'OF SAND AND TWIN FIRE…'],
    ['{kills}', 'BURIED IN SAND.'],
    ['{time}', 'UNDER TWO SUNS.'],
  ],
  [ // Ronin Moon: terse, a brushstroke
    ['BENEATH A RED MOON,', 'ONE BLADE WAITS.'],
    ['{kills}.', 'ONE BLADE.'],
    ['{near}.', 'NOT ONE WASTED STEP.'],
  ],
  [ // Hive: dread
    ['DEEP IN THE CAVERNS,', 'SOMETHING IS WAKING.'],
    ['{kills}.', '{near}.', 'THE NEST REMEMBERS.'],
    ['{bombs}.', 'NO WAY BACK UP.'],
  ],
  [ // Code Rain: a terminal log
    ['EVERY STAR', 'IS A LINE OF CODE.'],
    ['{kills} DELETED.', '{near} LOGGED.'],
    ['{time} OF UPTIME.', 'ZERO ERRORS.'],
  ],
  [ // Iron Dawn: heavy metal
    ['THE WAR NEVER ENDED.', 'IT WAITED.'],
    ['{kills} SCRAPPED.', '{bombs} DROPPED.'],
    ['{combo}.', 'NO SURRENDER.'],
  ],
  [ // Event Horizon: time bends
    ['AT THE EDGE OF THE DARK,', 'TIME BENDS.'],
    ['{time} AT THE EDGE.', 'YEARS EVERYWHERE ELSE.'],
    ['{kills}.', '{near}.', 'ONE WAY HOME.'],
  ],
];

// "THE MOTHERSHIP", "THE SINGULARITY": a noun phrase, so it reads in every world's {kills} slot.
const bossName = (kind) => {
  const name = bossDef(kind).name.toUpperCase();
  return name.startsWith('THE ') ? name : `THE ${name}`;
};
const phrase = (k, stats) => (k === 'kills' && stats.boss ? bossName(stats.boss) : PHRASE[k](stats[k] ?? 0));

export const fillLine = (template, stats) => template.replace(/\{(\w+)\}/g, (_, k) => phrase(k, stats));

export const cardsFor = (world, stats) => VOICES[(world - 1) % VOICES.length].map((card) => card.map((l) => fillLine(l, stats)));

export function statsOf(events, ticks) {
  const s = { kills: 0, near: 0, combo: 0, time: Math.max(0, ticks) * TICK, bombs: 0, stars: 0, hits: 0, boss: null };
  for (const e of events) {
    if (e.type === 'kill') {
      if (!e.scored) continue; // a ram: the ship's loss, not a kill
      s.kills += 1;
      s.combo = Math.max(s.combo, e.mult);
    } else if (e.type === 'bossDeath') s.boss = e.kind;
    else if (e.type === 'nearMiss') s.near += 1;
    else if (e.type === 'bomb') s.bombs += 1;
    else if (e.type === 'shipHit') s.hits += 1;
    else if (e.type === 'cleared') s.stars = e.stars;
  }
  return s;
}

export function finalCard({ level, stats, stars, score, newBest }) {
  const reel = reelName(level).toUpperCase();
  return {
    kicker: `WORLD ${level.world} · ${reel}`,
    title: worldName(level).toUpperCase(),
    stars: clamp(stars | 0, 0, MAX_STARS),
    label: newBest ? 'RECORD BOX OFFICE' : 'BOX OFFICE',
    score: fmt(Math.max(0, score)),
    value: Math.max(0, score),
    record: Boolean(newBest),
    billing: `STARRING YOU · RUNNING TIME ${clock(stats.time)} · NOW SHOWING`,
  };
}
