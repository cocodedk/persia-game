// Painting kit for the boss painters (bosses/<kind>.js), on top of the alien kit (aliens/kit.js):
// the same body/lights split, plus procedural pixel art. Bake-time only; nothing here runs per
// frame. A painter draws centred on (0, 0) in world px: the hull in boss coordinates, a part in its
// own (its rect is w x h around the origin and its art must cover it, since the rect is the hit box).
import { pixels } from '../aliens/kit.js';

export { TAU, path, bloom, phosphor, line, pixels } from '../aliens/kit.js';

// Pixel art from a function: at(i, j) -> null | colour | [colour, lit], over cols x rows cells of
// px, centred (the alien kit's bevelled phosphor cells).
export function pixelArt(b, l, cols, rows, px, at) {
  const keys = new Map();
  const map = {};
  const grid = [];
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
    grid.push(row);
  }
  pixels(b, l, grid, px, map);
}
