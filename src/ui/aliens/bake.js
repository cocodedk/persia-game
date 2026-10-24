// The alien sprite cache. The painters (w1.js) are run once per role and frame into offscreen
// canvases: a body, its lights (drawn additively), a white hit-flash silhouette and the body's
// damage (cracks.js). Per frame the game only blits these.
//   ART                               the painter module with defaults filled in: rate (frames/s),
//                                     sync (whole formation in step), bob (px), halo (alpha), crack
//   roleSprites(look, role)           { body: [f0, f1], lights: [f0, f1], flash: [f0, f1], size }
//                                     (draw a canvas at size x size world px)
//   warmAliens(look)                  bake the whole set, damage included (call when a level's view
//                                     is built): nothing is baked on a hit, mid-fight
// A painter is (b, l, frame, colour): it draws centred on (0, 0) in world px into the body context
// b and the lights context l (see kit.js), colour = look.palette.alien[role]. painter.size
// overrides the canvas edge (SIZE).
import { makeCanvas, white } from '../sprites.js';
import { CRACKABLE, cracked } from './cracks.js';
import w1 from './w1.js';

const SIZE = 96; // px, a sprite canvas's edge; the alien's centre is its centre
export const ROLE_LIST = ['grunt', 'diver', 'gunner', 'armored', 'carrier'];
export const ART = { rate: 2, sync: false, bob: 0, halo: 0.25, crack: null, ...w1 };

const sets = {}; // role -> set

function canvasAt(size) {
  const c = makeCanvas(size, size);
  const g = c.getContext('2d');
  g.translate(size / 2, size / 2);
  return [c, g];
}

// seed picks the crack pattern; crackColor is the hot line inside a crack (or null). cracks holds
// the damage canvases cracks.js bakes.
function bakeSet(paint, color, seed, crackColor) {
  const size = paint.size ?? SIZE;
  const body = [];
  const lights = [];
  for (const f of [0, 1]) {
    const [bc, bg] = canvasAt(size);
    const [lc, lg] = canvasAt(size);
    paint(bg, lg, f, color);
    body.push(bc);
    lights.push(lc);
  }
  return { body, lights, flash: body.map(white), size, seed, color, crackColor, cracks: {} };
}

export function roleSprites(look, role) {
  return (sets[role] ??= bakeSet(ART[role], look.palette.alien[role], ROLE_LIST.indexOf(role) + 1, ART.crack));
}

export function warmAliens(look) {
  for (const role of ROLE_LIST) roleSprites(look, role);
  for (const role of CRACKABLE) {
    const set = roleSprites(look, role);
    for (const f of [0, 1]) for (const stage of [1, 2]) cracked(set, f, stage);
  }
}
