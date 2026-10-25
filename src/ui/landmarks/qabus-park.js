// The mound Gonbad-e Qabus stands on and the park round it (qabus.js): the green hill with its flat
// top and the flight of steps up its front to the door, the lamp posts that light the lawn and the
// trees, and a ring of pines (a flat crown on a bare trunk) and cypresses (a dark flame), some
// behind the mound so only their tops show over it. Painted as the near row. `up` counts blocks up
// from the plain. Tones: m M N O the lawn, lit to deep, t y e the trees, k the dark, g G the lamps.
import { PIXEL } from '../sprites.js';
import { int } from '../../core/rng.js';
import { BASE, key, brick, lamp, light } from './yazd-brick.js';

export const D = 2; // the depth the tower stands at, and the lamps that light it
export const MOUND = { half: 64, flat: 20, tall: 24 }; // its half-width, the flat top's half-width, its height
const STEPS = { top: 13, foot: 23 }; // the flight's width at the door and at the plain
const POSTS = [-100, -80, -62, -46, -32, -15, 15, 32, 46, 62, 80, 100]; // from the middle; each stands on the ground there
const POST = 8; // a lamp post's height
const PARK = 112; // from the middle: where the park ends
const FLOOD = 14; // from the middle, each side: the floodlights in the lawn at the tower's foot

// The mound's height `dx` blocks from the middle: flat on top, then a smooth shoulder down to the plain.
const hill = (dx) => {
  const t = (Math.abs(dx) - MOUND.flat) / (MOUND.half - MOUND.flat);
  return t >= 1 ? 0 : t <= 0 ? MOUND.tall : Math.round(MOUND.tall * Math.cos((t * Math.PI) / 2) ** 0.9);
};

// The lamps first, so the walls and the lawn they light are painted in their glow.
export function lamps(art) {
  const { mid, row, lights, L } = art;
  for (const dx of POSTS) lamp(art, D, mid + dx, row(hill(dx) + POST), 15, 0.8);
  for (const s of [-1, 1]) {
    lamp(art, D, mid + s * FLOOD, row(MOUND.tall + 1), 34, 0.3, false); // aimed up the tower
    lights.push({ x: (mid + s * FLOOD + 0.5) * PIXEL, y: row(MOUND.tall + 4) * PIXEL, r: 80, color: L.lamp, ph: 0.7 + s, a: 0.3 });
  }
}

export function mound(art) {
  const { box, row, mid, rng } = art;
  for (let dx = -MOUND.half; dx <= MOUND.half; dx++) {
    const top = hill(dx);
    for (let up = 0; up < top; up++) {
      const s = light(art.lamps[D], mid + dx, row(up));
      const speck = rng() < 0.07;
      const tone = s > 0.45 ? 'm' : s > 0.2 ? (speck ? 'm' : 'M') : up > top * 0.4 || speck ? 'M' : 'N';
      box(mid + dx, row(up), 1, 1, tone);
    }
  }
}

// The flight: a tread and a riser in turn, a rail down each side, narrowing as it climbs.
export function steps(art) {
  const { box, row, mid } = art;
  for (let up = 0; up < MOUND.tall; up++) {
    const w = STEPS.top + Math.round(((STEPS.foot - STEPS.top) * (MOUND.tall - 1 - up)) / (MOUND.tall - 1));
    const x = mid - Math.floor(w / 2);
    brick(art, D, x, row(up), w, 1, () => (up % 2 === 0 ? -0.1 : 0.34), 0);
    box(x - 1, row(up), 1, 1, key(D, BASE[D] + 0.25));
    box(x + w, row(up), 1, 1, key(D, BASE[D] + 0.4));
  }
}

// A pine `tall` blocks high on the plain, column x: a bare trunk, then a flat crown, lit down its left.
function pine({ box, row, rng }, x, tall) {
  const trunk = Math.round(tall * 0.5);
  box(x, row(trunk - 1), 1, trunk, 'k');
  const crown = tall - trunk;
  const half = Math.round(tall * 0.45);
  for (let j = 0; j < crown; j++) {
    const k = (j + 0.5) / crown; // 0 at the crown's foot, 1 at its top
    const hw = Math.max(2, Math.round(half * Math.sqrt(1 - (2 * k - 1) ** 2) * (k < 0.5 ? 1 : 0.75 + 0.5 * (1 - k))));
    box(x - hw, row(trunk + j), hw * 2 + 1, 1, 't');
    for (let i = -hw; i <= hw; i++) if (rng() < (i < 0 ? 0.2 : 0.04) * k) box(x + i, row(trunk + j), 1, 1, 'y');
    box(x - hw, row(trunk + j), 1, 1, 'e');
  }
}

// A cypress `tall` blocks high, up to `half` blocks either side of column x: a dark flame, lit down its left.
function cypress({ box, row }, x, tall, half) {
  for (let j = 0; j < tall; j++) {
    const t = j / (tall - 1); // 0 at its foot, 1 at its tip
    const hw = t > 0.97 ? 0 : Math.max(1, Math.round(half * Math.sin(Math.min(1, (1 - t) * 1.6) * (Math.PI / 2)) ** 0.7));
    box(x - hw, row(j), hw * 2 + 1, 1, 't');
    box(x - hw, row(j), 1, 1, 'y');
  }
}

// Trees on both sides. Behind the mound they stand by its shoulders, tall, with only their tops
// showing; in front they ring it on the plain, shorter near the steps so the hill stays in sight,
// and past the park, where the town begins, there is a tree now and then.
export function trees(art, behind) {
  const { mid, rng, BW } = art;
  const end = behind ? MOUND.half + 8 : BW / 2 - 4;
  for (const s of [-1, 1]) {
    for (let dx = behind ? 20 : 24; dx < end; dx += behind ? int(rng, 9, 15) : int(rng, 12, 20)) {
      if (dx > PARK && rng() > 0.3) continue;
      const ring = !behind && dx < MOUND.half + 6; // only cypresses, which stand close to the hill and leave it in sight
      const tall = behind ? int(rng, 30, 44) : ring ? int(rng, 14, 22) : int(rng, 16, 28);
      if (!ring && rng() < 0.45) pine(art, mid + s * dx, behind ? Math.round(tall * 0.6) : tall);
      else cypress(art, mid + s * dx, tall, int(rng, 2, 3));
    }
  }
}

export function posts({ box, row, mid }) {
  for (const dx of POSTS) {
    const x = mid + dx;
    const base = hill(dx);
    box(x, row(base + POST - 1), 1, POST, 'k');
    box(x - 1, row(base + POST), 3, 1, 'g');
    box(x, row(base + POST), 1, 1, 'G');
    box(x - 1, row(base + POST + 1), 3, 1, 'k');
  }
}
