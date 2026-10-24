// The alien sprite cache. The painters (animals.js) are run once per species, scale and frame into
// offscreen canvases: a body, its lights (drawn additively), a white hit-flash silhouette and the
// body's damage (cracks.js). Per frame the game only blits these.
//   ART                                 the painter module: rate (frames/s; the formation steps in
//                                       time), halo (alpha), and a painter per species
//   SPECIES_LIST                        every species (kinds.js SPECIES)
//   speciesSprites(look, species, scale = 1)
//                                       { body: [f0, f1], lights: [f0, f1], flash: [f0, f1], size,
//                                       scale } (draw a canvas at size x size world px; scale > 1
//                                       bakes it bigger, at that resolution)
//   warmAliens(look)                    bake the whole set, damage included (call when a level's
//                                       view is built): nothing is baked on a hit, mid-fight
// A painter is (b, l, frame, colour): it draws centred on (0, 0) in world px into the body context
// b and the lights context l (see kit.js), colour = look.palette.alien[species].
import { makeCanvas, white } from '../sprites.js';
import { SPECIES } from '../../core/kinds.js';
import { CRACKABLE, cracked } from './cracks.js';
import animals from './animals.js';

const SIZE = 96; // px, a sprite canvas's edge at scale 1; the alien's centre is its centre
export const SPECIES_LIST = Object.keys(SPECIES);
export const ART = animals;

// scale -> { [species]: set }: nested, not one string key, so the per-frame lookup builds nothing.
const shelves = new Map();

function canvasAt(size, scale) {
  const c = makeCanvas(size, size);
  const g = c.getContext('2d');
  g.translate(size / 2, size / 2);
  g.scale(scale, scale);
  return [c, g];
}

// seed picks the crack pattern; cracks holds the damage canvases cracks.js bakes.
function bakeSet(paint, color, seed, scale) {
  const size = SIZE * scale;
  const body = [];
  const lights = [];
  for (const f of [0, 1]) {
    const [bc, bg] = canvasAt(size, scale);
    const [lc, lg] = canvasAt(size, scale);
    paint(bg, lg, f, color);
    body.push(bc);
    lights.push(lc);
  }
  return { body, lights, flash: body.map(white), size, scale, seed, cracks: {} };
}

export function speciesSprites(look, species, scale = 1) {
  let shelf = shelves.get(scale);
  if (!shelf) shelves.set(scale, (shelf = {}));
  return (shelf[species] ??= bakeSet(ART[species], look.palette.alien[species], SPECIES_LIST.indexOf(species) + 1, scale));
}

export function warmAliens(look) {
  for (const species of SPECIES_LIST) {
    const set = speciesSprites(look, species);
    if (!CRACKABLE.includes(SPECIES[species])) continue;
    for (const f of [0, 1]) for (const stage of [1, 2]) cracked(set, f, stage);
  }
}
