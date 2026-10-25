// The rainbow, the seventh kind of weather (levels.js weatherOf, ui/weather.js): a moonbow, the arc a
// night sky shows opposite the moon, drawn as a pixel game draws a rainbow. Drawn in the sky phase,
// before the parallax layers, so the mountains and the landmark stand in front of it and hide its feet.
// The moon, the stars and the dawn stay as they were.
// Seven bands, red outside to violet inside, each one chunky block thick (a block is BLOCK px, four
// PIXELs), so the bow is 112 px across and its edges step block by block; each band one flat, full
// colour, so every band stands apart from the next. BLOCKS lists them once at load as rows
// [x, y, w, colour] on the 8 px grid, a cell going to the band its centre lies in; the bow is baked
// from them once as one sprite and drawn at alpha k times STRENGTH, nearly whole, the sky showing
// through only a little. Its centre BOW lies below the far ridge, so only the arc above it is
// listed and its feet are behind the far mountains: it rises behind the landmark from the right,
// opposite the moon, clear of its disc and under the HUD band. Its place is a constant here, as the
// moon's and the sun's are (the look is not asked); where it stands is set against level 10's backdrop.
//   drawRainbow(ctx, k)   k 0..1 how far the weather has faded in, scaling the alpha; it takes no
//     motion, so the clock, the quality and reduced motion change nothing (the voice has named it)
import { W, PIXEL, cached } from './sprites.js';

const BLOCK = 4 * PIXEL; // 16
const BOW = { x: 1400, y: 904, r: 560 }; // the arc's centre and its outer radius in px
const STRENGTH = 0.85;
const SPECTRUM = ['#ff2a3a', '#ff8a1a', '#ffe01a', '#2ae04a', '#1aa8ff', '#3a4aff', '#a83aff'];

// The band a cell whose centre is d px from BOW's centre falls in, red 0 .. violet 6, -1 for none.
const bandAt = (d) => {
  const band = Math.floor((BOW.r - d) / BLOCK);
  return band >= 0 && band < SPECTRUM.length ? band : -1;
};

// The arc above BOW's centre, a row of blocks at a time, the cells of one band side by side in a row
// making one span.
export const BLOCKS = [];
for (let y = BOW.y - BOW.r; y < BOW.y; y += BLOCK) {
  let run = -1;
  let start = 0;
  for (let x = 0; x <= W; x += BLOCK) {
    const band = x < W ? bandAt(Math.hypot(x + BLOCK / 2 - BOW.x, y + BLOCK / 2 - BOW.y)) : -1;
    if (band === run) continue;
    if (run >= 0) BLOCKS.push([start, y, x - start, SPECTRUM[run]]);
    [run, start] = [band, x];
  }
}

// The blocks' bounding box, which is the bake: its top left lands on the 8 px grid.
const LEFT = Math.min(...BLOCKS.map(([x]) => x));
const TOP = BLOCKS[0][1];
const WIDTH = Math.max(...BLOCKS.map(([x, , w]) => x + w)) - LEFT;
const HEIGHT = BOW.y - TOP;

function paintBow(g) {
  for (const [x, y, w, colour] of BLOCKS) {
    g.fillStyle = colour;
    g.fillRect(x - LEFT, y - TOP, w, BLOCK);
  }
}

export function drawRainbow(ctx, k) {
  if (k <= 0) return;
  ctx.globalAlpha = k * STRENGTH;
  ctx.drawImage(cached('rainbow', WIDTH, HEIGHT, paintBow), LEFT, TOP);
  ctx.globalAlpha = 1;
}
