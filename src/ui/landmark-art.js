// A level's landmark as a small picture for the title's cards: its own backdrop's layers, baked as the
// level bakes them, over the look's sky, seen as the battle opens (the ship at the centre) and cropped
// to the frame's lower middle. CSS sets its size on the card.
//   landmarkArt(look, level) -> canvas, baked once per level
import { W, H, makeCanvas, lin } from './sprites.js';
import { buildLayers, drawLayers } from './parallax.js';

const CROP = { x: 480, y: 480, w: 960, h: 600 }; // on the pixel grid, so the blocks stay whole

const baked = new Map();

export function landmarkArt(look, level) {
  if (baked.has(level.id)) return baked.get(level.id);
  const c = makeCanvas(CROP.w, CROP.h);
  const g = c.getContext('2d');
  g.translate(-CROP.x, -CROP.y);
  g.fillStyle = lin(g, 0, 0, 0, H, look.sky);
  g.fillRect(0, 0, W, H);
  drawLayers(g, buildLayers(look, look.landmarks[level.landmark], level.seed), W / 2, 0, 1);
  baked.set(level.id, c);
  return c;
}
