// The parade, once the giant has fallen: the seven animals walk right to left along a line below
// the middle, in the pack's order, one every PARADE_STEP, and each is named as it crosses the middle
// (voice.speak says it and shows its word above the line). Then the results.
//   PARADE_LEAD  s before the first animal crosses the middle    PARADE_STEP  s between animals
//   PARADE_SPEED world px/s, right to left                       PARADE_TAIL  s after the last cue
//   paradeX(t, i) -> the x of animal i at t s, on a 1920-wide line
//   paradeCues(t0, t1, n) -> the indices of the animals that cross the middle in (t0, t1]
//   paradeScreen({ pack, look, voice, onDone }) -> a stage screen. onDone fires PARADE_TAIL after
//   the last cue; a fresh key after SKIP clears the voice and fires it at once.
import { h, shell } from './dom.js';
import { WIDTH, MID_X } from '../../core/kinds.js';
import { glow, lighter, normal } from '../sprites.js';
import { ART, speciesSprites } from '../aliens/bake.js';

export const PARADE_LEAD = 0.8;
export const PARADE_STEP = 1.4;
export const PARADE_SPEED = 480;
export const PARADE_TAIL = 1.6;

const LINE_H = 320; // px, the line's canvas height; its width is the world's
const SCALE = 2; // the animals at twice their size in play
const SKIP = 1; // s before a key may end the parade
const STRIDE = 3; // frames a second: the walk's step
const HOP = 6; // px the animals lift on the step
const HALO_R = 44 * SCALE; // px, an animal's halo in play, doubled

const crossAt = (i) => PARADE_LEAD + i * PARADE_STEP;
export const paradeX = (t, i) => MID_X - PARADE_SPEED * (t - crossAt(i));

export function paradeCues(t0, t1, n) {
  const cues = [];
  for (let i = 0; i < n; i++) if (t0 < crossAt(i) && crossAt(i) <= t1) cues.push(i);
  return cues;
}

// Each animal as it is drawn in play (aliens/index.js), twice the size: its halo, body and lights.
function drawLine(ctx, look, ids, t) {
  ctx.clearRect(0, 0, WIDTH, LINE_H);
  const f = Math.floor(t * STRIDE) & 1;
  const y = LINE_H / 2 - f * HOP;
  ids.forEach((id, i) => {
    const x = paradeX(t, i);
    const { body, lights, size: s } = speciesSprites(look, id, SCALE);
    lighter(ctx);
    ctx.globalAlpha = ART.halo;
    ctx.drawImage(glow(look.palette.alien[id]), x - HALO_R, y - HALO_R, HALO_R * 2, HALO_R * 2);
    normal(ctx);
    ctx.drawImage(body[f], x - s / 2, y - s / 2, s, s);
    lighter(ctx);
    ctx.drawImage(lights[f], x - s / 2, y - s / 2, s, s);
    normal(ctx);
  });
}

export function paradeScreen({ pack, look, voice, onDone }) {
  const el = shell('parade');
  const canvas = h('canvas', 'parade-line');
  canvas.width = WIDTH;
  canvas.height = LINE_H;
  el.append(canvas);
  const ctx = canvas.getContext('2d');
  const ids = pack.species.map((s) => s.id);
  const end = crossAt(ids.length - 1) + PARADE_TAIL;
  let t = 0;
  let done = false;
  const finish = () => {
    done = true;
    onDone();
  };
  return {
    el,
    onKey(code, e) {
      if (!done && t >= SKIP && !e?.repeat) { // a key still held from the fight lets nothing go
        voice.clear();
        finish();
      }
      return true; // the parade keeps every key from the game
    },
    update(dt) {
      if (done) return;
      const t0 = t;
      t += dt;
      for (const i of paradeCues(t0, t, ids.length)) voice.speak({ kind: 'species', id: ids[i] });
      drawLine(ctx, look, ids, t);
      if (t >= end) finish();
    },
  };
}
