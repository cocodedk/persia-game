// Painting kit for the boss painters (bosses/<kind>.js), on top of the alien kit (aliens/kit.js):
// the same body/lights split, plus procedural pixel art at boss scale and what the giants share.
// Bake-time only, but for throb (a painter's live()). A painter draws centred on (0, 0) in world px:
// the hull in boss coordinates, a part in its own (its rect is w x h around the origin and its art
// must cover it, since the rect is the hit box).
import { pixels, path, line, bloom } from '../aliens/kit.js';
import { glow, rgba } from '../sprites.js';

export { TAU, path, bloom, phosphor, line, pixels } from '../aliens/kit.js';

export const PX = 10; // a giant's pixel: twice an animal's
export const RED = '#ff2a3a';
export const AMBER = '#ffb03a';
export const PINK = '#ff5a8a';
export const FANG = '#fff8e8';
export const PUPIL = '#0a0612';
export const LID = '#1a0a20';

// Pixel art from a function: at(i, j) -> null | colour | [colour, lit], over cols x rows cells of
// px, centred (the alien kit's bevelled phosphor cells).
function pixelArt(b, l, cols, rows, px, at) {
  const keys = new Map();
  const map = {};
  const lines = [];
  for (let j = 0; j < rows; j++) {
    let row = '';
    for (let i = 0; i < cols; i++) {
      const v = at(i, j);
      if (!v) {
        row += '.';
        continue;
      }
      const id = Array.isArray(v) ? v.join('|') : v;
      if (!keys.has(id)) {
        const ch = String.fromCharCode(65 + keys.size + (keys.size > 25 ? 6 : 0));
        keys.set(id, ch);
        map[ch] = v;
      }
      row += keys.get(id);
    }
    lines.push(row);
  }
  pixels(b, l, lines, px, map);
}

const cell = (i, n) => (i - n / 2 + 0.5) * PX; // a cell's centre, from the grid's centre
// Pixel art over cols x rows cells of PX, at(x, y) taking each cell's centre in px.
export const grid = (b, l, cols, rows, at) => pixelArt(b, l, cols, rows, PX, (i, j) => at(cell(i, cols), cell(j, rows)));
export const inside = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;

// Every cell of a cols x rows grid that pick(x, y) keeps, lit in one colour: a rage overlay's
// stripes or gills.
export function litCells(l, cols, rows, pick, colour) {
  l.globalCompositeOperation = 'lighter';
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = cell(i, cols);
      const y = cell(j, rows);
      if (!pick(x, y)) continue;
      l.fillStyle = rgba(colour, 0.7);
      l.fillRect(x - PX / 2, y - PX / 2, PX, PX);
      bloom(l, x, y, PX * 2, colour, 0.35);
    }
  }
}

// Whiskers from (±x0, y0) out to (±x1, y1), one per [y0, x1, y1] spoke, mirrored; lights only.
export function whiskers(l, x0, spokes, colour, a, w) {
  for (const s of [-1, 1]) {
    for (const [y0, x1, y1] of spokes) {
      path(l, [[s * x0, y0], [s * x1, y1]], true);
      line(l, rgba(colour, a), w);
    }
  }
}

// A giant's live(): its lit brows at (±x, y) throb, quicker with every phase.
export const throb = (x, y) => (ctx, b, t) => {
  ctx.globalAlpha = 0.15 + 0.3 * (0.5 + 0.5 * Math.sin(t * (4 + b.phase * 3)));
  for (const s of [-1, 1]) ctx.drawImage(glow(RED), s * x - 80, y - 32, 160, 64);
  ctx.globalAlpha = 1;
};
