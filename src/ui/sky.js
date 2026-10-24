// The sky: the look's gradient plus its baked body (sky-bodies.js), one pixelated 1920 x 1080 canvas.
import { W, H, makeCanvas, lin, pixelate } from './sprites.js';
import { BODIES } from './sky-bodies.js';

export function buildSky(look) {
  const c = makeCanvas(W, H);
  const g = c.getContext('2d');
  g.fillStyle = lin(g, 0, 0, 0, H, look.sky);
  g.fillRect(0, 0, W, H);
  BODIES[look.body](g);
  return pixelate(c);
}
