// The lobby's posters, drawn by the game itself: each world's boss level is run a few seconds with
// the autopilot and one frame of it is rendered (sky, parallax, boss, ship, effects; no HUD), then
// cropped to a 2:3 poster round the boss. Kept for the session (no image files).
// A bake comes in five slices (the run-up, the world's alien sprites, its boss, the view, the frame),
// one per idle period while the title or the lobby is up, so no single frame carries a whole poster
// and nothing is baked while a level plays.
//   warmPosters(allowed)   start baking in idle slices; allowed() says whether now is a menu
//   bakeStep() -> bool     one slice of the next poster (false once all eight are done)
//   posterFor(world) -> canvas | null      TAGLINES[world - 1]: each world's line      reelName(level)
import { LEVELS } from '../../core/levels.js';
import { createWorld, stepWorld } from '../../core/world.js';
import { autopilot } from '../../core/autopilot.js';
import { TICK } from '../../core/kinds.js';
import { fxRng } from '../session.js';
import { createFx, stepFx } from '../../fx/fx.js';
import { applyEvents } from '../../fx/react.js';
import { lookFor } from '../looks/index.js';
import { warmAliens } from '../aliens/bake.js';
import { bossArt } from '../bosses/bake.js';
import { createView, drawFrame } from '../view.js';
import { makeCanvas, W } from '../sprites.js';
import { clamp } from '../../core/math.js';

export const TAGLINES = [
  'Where it all began.',
  'The city never sleeps. Neither do they.',
  'Two suns. One way out.',
  'Steel beneath the blossoms.',
  'They hatch in the dark.',
  'The signal has teeth.',
  'The machines woke first.',
  'Even light bends here.',
];

const FRAME_W = 768;
const FRAME_H = 432;
const AT = [3.6, 3.4, 3.6, 3.4, 3.4, 3.4, 3.4, 3.8]; // s into each boss fight: in place, mid-attack
const LIT = 0.4; // s of effects before the frame (muzzle flashes, sparks); the run-up before has none
const CROP_W = 600; // the crop, in world px: a 2:3 window over the top of the field, centred on the boss
const CROP_H = 900;
const posters = new Map();

export const posterFor = (world) => posters.get(world) ?? null;

function* bake(world) {
  const level = LEVELS.find((l) => l.world === world && l.boss);
  const look = lookFor(level);
  const secs = AT[world - 1];
  const w = createWorld(level, level.seed);
  const fx = createFx();
  const rng = fxRng(level.seed);
  const n = Math.round(secs / TICK);
  const lit = n - Math.round(LIT / TICK);
  for (let i = 0; i < n; i++) {
    stepWorld(w, TICK, autopilot(w));
    const events = w.events.splice(0);
    if (i < lit) continue;
    applyEvents(fx, events, rng, w);
    stepFx(fx, TICK);
  }
  yield;
  warmAliens(look);
  yield;
  bossArt(look, level.boss); // drawn whole: none of the fight's damage art (warmBoss)
  yield;
  const frame = makeCanvas(FRAME_W, FRAME_H);
  const view = createView(frame, level, false); // sky and parallax; the sprites above are already baked
  view.showHud = false;
  yield;
  drawFrame(view, w, fx, secs);
  const { s: k, ox, oy } = view.fit;
  const x0 = clamp((w.boss?.x ?? W / 2) - CROP_W / 2, 0, W - CROP_W);
  const out = makeCanvas(CROP_W * k, CROP_H * k);
  out.getContext('2d').drawImage(frame, ox + x0 * k, oy, CROP_W * k, CROP_H * k, 0, 0, out.width, out.height);
  out.className = 'poster-canvas';
  posters.set(world, out);
}

let current = null;
function bakeStep() {
  if (!current) {
    const world = [1, 2, 3, 4, 5, 6, 7, 8].find((wd) => !posters.has(wd));
    if (!world) return false;
    current = bake(world);
  }
  if (current.next().done) current = null;
  return true;
}

// requestIdleCallback posted from inside an idle callback runs in the next idle period: at most one
// slice per frame. The timeout (at least two slices a second) keeps the posters coming on a machine that
// is rarely idle.
const idle = (fn) => (globalThis.requestIdleCallback ? requestIdleCallback(fn, { timeout: 500 }) : setTimeout(fn, 50));

let warming = false;
export function warmPosters(allowed) {
  if (warming) return;
  warming = true;
  const slot = () => {
    if (!allowed()) setTimeout(() => idle(slot), 500); // a level is up: look again later
    else if (bakeStep()) idle(slot);
  };
  idle(slot);
}
