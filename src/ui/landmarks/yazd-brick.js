// The mud brick Yazd is built of (yazd.js and its parts): a tone ramp for each depth of the city,
// the lamps that light the walls round them, and a wall of brick laid in courses. A brick tone is a
// number, depth * SHADES + level: depth 0 is the far row, faded toward the haze, 1 the middle, 2
// the near; level 0 is lit warm by a lamp, SHADES - 1 deep shade. A caller asks for a darkness
// 0..1 and `key` picks the level. The other tones are letters: '-' ink, G lamp, g glow, h dim glow,
// k vent slot, K its back wall, w pool line, W its glint, n the pool's depth, t cypress, e its lit
// edge, T tile, U lit tile, u dark tile.
import { PIXEL, mix } from '../sprites.js';
import { clamp } from '../../core/math.js';

const SHADES = 16;
const MIST = [0.5, 0.25, 0]; // how far each depth fades toward the haze
export const BASE = [0.6, 0.54, 0.48]; // how dark a plain wall is, by depth

export const key = (d, dark) => d * SHADES + Math.round(clamp(dark, 0, 1) * (SHADES - 1));

export const hazeOf = (L) => mix(L.lit, L.color, 0.5); // the colour the far rows fade toward

export function tones(L) {
  const haze = hazeOf(L);
  const tone = {
    '-': L.ink, G: L.lamp, g: L.glow, h: mix(L.glow, L.ink, 0.55),
    k: mix(L.ink, L.brick, 0.05), K: mix(L.ink, L.brick, 0.2),
    w: L.pool, W: mix(L.pool, '#ffffff', 0.55), n: mix(L.pool, L.ink, 0.72),
    t: L.tree, e: mix(L.tree, L.lamp, 0.25),
    T: L.tile, U: mix(L.tile, L.lamp, 0.45), u: mix(L.tile, L.ink, 0.55),
  };
  for (let d = 0; d < 3; d++) {
    for (let i = 0; i < SHADES; i++) {
      const lv = i / (SHADES - 1);
      const c = mix(mix(L.brick, L.lamp, 0.55 * (1 - lv) ** 2), L.ink, 0.04 + 0.7 * lv);
      tone[d * SHADES + i] = mix(c, haze, MIST[d]);
    }
  }
  return tone;
}

// How strongly the `lamps` (of one depth) light block (x, y): 0 none to 1; they fall off squarely
// and reach further along a wall than up it.
export function light(lamps, x, y) {
  let s = 0;
  for (const m of lamps) {
    const dx = (x - m.x) * 0.7;
    const dy = y - m.y;
    if (Math.abs(dx) >= m.r || Math.abs(dy) >= m.r) continue; // outside its square, so out of reach
    const t = 1 - Math.hypot(dx, dy) / m.r;
    if (t > 0) s += m.k * t * t;
  }
  return Math.min(1, s);
}

// A lamp of depth d at block (x, y): it lights the walls within r blocks (k its strength) and, if
// `halo`, pulses a glow over the picture.
export function lamp({ lamps, lights, L }, d, x, y, r, k, halo = true) {
  lamps[d].push({ x, y, r, k });
  if (halo) lights.push({ x: (x + 0.5) * PIXEL, y: (y + 0.5) * PIXEL, r: r * PIXEL * 1.4, color: L.lamp, ph: x / 37, a: 0.15 + 0.4 * k });
}

// A wall `bw` x `bh` blocks from (x, top), depth d: block (i, j) of it has darkness dark(i, j) less
// the lamplight on it, and a speckle. fine: 0 plain, 1 with the bed joints between the courses (a
// course is two rows), 2 with the head joints in the brick as well, staggered by course.
export function brick(art, d, x, top, bw, bh, dark, fine = 0) {
  const { box, rng } = art;
  const lamps = art.lamps[d];
  for (let j = 0; j < bh; j++) {
    const y = top + j;
    let from = 0;
    let run = null;
    for (let i = 0; i <= bw; i++) {
      let k = null;
      if (i < bw) {
        let v = dark(i, j) - 0.55 * light(lamps, x + i, y);
        if (fine && y % 2) v += 0.14;
        else if (fine > 1 && (x + i + 2 * ((y >> 1) % 2)) % 4 === 0) v += 0.14;
        if (rng() < 0.12) v += (rng() - 0.5) * 0.2;
        k = key(d, v);
      }
      if (k !== run) {
        if (run !== null) box(x + from, y, i - from, 1, run);
        from = i;
        run = k;
      }
    }
  }
}
