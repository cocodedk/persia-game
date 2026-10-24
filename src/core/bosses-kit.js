import { SPECIES } from './kinds.js';

// The shorthands the boss definitions are written in. A definition is plain data:
//   { kind, name, species, y, size: { w, h }, parts, phases, maxHp, bottom }
//   species the animal it is a giant of (SPECIES), named when it arrives
//   part  = { id, dx, dy, w, h, hp, weak, armor }  (dx, dy: centre offset from the boss's centre)
//     weak  takes full damage; armor takes 25 % (every part is one or the other)
//   phase = { until, move, attacks, rate?, minions? }
//     until   the hp fraction at which this phase ends (the last is 0)
//     move    a boss move (boss-move.js MOVES); rate scales the pace (default 1)
//     attacks [{ pattern, every, from, p }]: every `every` s (shorter on harder levels) the part
//             `from` warns, then fires `pattern` with p = { count?, spread?, speed? } (speed is a
//             multiplier on the level's bullet speed)
//     minions [{ species, role, count, every, from }]: aliens launched from a part, flying at the
//             ship, each fighting as its species' role
//   y is the boss's resting centre; bottom the lowest edge of any part below that centre.

const part = (weak, armor) => (id, dx, dy, w, h, hp) => ({ id, dx, dy, w, h, hp, weak, armor });

export const weak = part(true, false);
export const armor = part(false, true);

export const atk = (pattern, every, from, p = {}) => ({ pattern, every, from, p });
export const minion = (species, count, every, from) => ({ species, role: SPECIES[species], count, every, from });
export const phase = (until, move, attacks, extra = {}) => ({ until, move, attacks, ...extra });

export function boss(kind, name, species, y, size, parts, phases) {
  const maxHp = parts.reduce((n, p) => n + p.hp, 0);
  const bottom = Math.max(...parts.map((p) => p.dy + p.h / 2));
  return { kind, name, species, y, size, parts, phases, maxHp, bottom };
}
