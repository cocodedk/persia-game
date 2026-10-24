// The Giant Mouse: a grey mouse head grown to fill the sky, in the giant cat's pixel art (10 px
// phosphor cells), so it reads as one of the pack grown huge. A round head with puffed cheeks under
// lit red brows; a great round ear at each side, pink inside; the snout plate with its pink nose;
// the weak points burn underneath: two beady eyes and the buck-toothed mouth the mice pour out of.
// The brows throb quicker as the fight heats up, and the whiskers light amber, then red.
import { pixelArt, pixels, phosphor, bloom, path, line } from './kit.js';
import { glow, shade, rgba } from '../sprites.js';

const PX = 10;
const RED = '#ff2a3a';
const AMBER = '#ffb03a';
const PINK = '#ff5a8a';
const TOOTH = '#fff8e8';
const LID = '#1a0a20';

const cell = (i, n) => (i - n / 2 + 0.5) * PX; // a cell's centre, from the grid's centre
const grid = (b, l, cols, rows, at) => pixelArt(b, l, cols, rows, PX, (i, j) => at(cell(i, cols), cell(j, rows)));
const inside = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
const fur = (S) => S.look.palette.alien.mouse;

// The hull, in boss coordinates: the round head, the cheeks, the V of each brow, the whisker pads
// either side of the snout, and the chin under the mouth.
const headAt = (x, y) => inside(x, y, 0, 0, 196, 100) || inside(Math.abs(x), y, 140, 46, 76, 56) || inside(x, y, 0, 96, 84, 46);
const browAt = (x, y) => {
  const ax = Math.abs(x);
  const at = -54 + (150 - ax) * 0.3; // high at the outer end, low over the inner corner
  return ax > 44 && ax < 150 && y > at - 12 && y <= at + 4;
};
const padAt = (x, y) => inside(Math.abs(x), y, 78, 66, 46, 30);

function hullCell(x, y, c) {
  if (!headAt(x, y)) return null;
  if (browAt(x, y)) return [RED, true];
  if (!headAt(x, y - PX)) return shade(c, 0.35); // the moonlit rim of the fur
  if (!headAt(x, y + PX)) return '#120610';
  if (padAt(x, y)) return shade(c, 0.22);
  return y < -30 ? shade(c, -0.05) : y < 50 ? shade(c, -0.18) : shade(c, -0.3);
}

// Whiskers fanning out from the pads past the cheeks; lights only.
function whiskers(l, colour, a, w) {
  for (const s of [-1, 1]) {
    for (const [y0, x1, y1] of [[58, 330, 30], [68, 340, 74], [78, 320, 118]]) {
      path(l, [[s * 96, y0], [s * x1, y1]], true);
      line(l, rgba(colour, a), w);
    }
  }
}

function hull(b, l, S) {
  grid(b, l, 42, 26, (x, y) => hullCell(x, y, fur(S)));
  for (const s of [-1, 1]) bloom(l, s * 96, -26, 64, RED, 0.25);
  whiskers(l, '#ffffff', 0.45, 2);
  phosphor(b, l, 0.16, 5);
}

// An ear (drawn as the left one): a great round disc, rimmed in fur, pink inside and lit at its heart.
function ear(b, l, _part, S) {
  const c = fur(S);
  const at = (x, y) => inside(x, y, 0, 0, 76, 66);
  grid(b, l, 17, 15, (x, y) => {
    if (!at(x, y)) return null;
    if (inside(x, y, 6, 6, 48, 42)) return inside(x, y, 6, 6, 26, 22) ? [PINK, true] : '#b83a6a';
    if (!at(x, y - PX)) return shade(c, 0.4);
    if (!at(x, y + PX)) return shade(c, -0.5);
    return y > 20 ? shade(c, -0.2) : c;
  });
  phosphor(b, l, 0.22, 4);
}

// The snout plate: an armoured bridge between the eyes, tapering to a big pink nose.
function snout(b, l, _part, S) {
  const c = fur(S);
  const at = (x, y) => Math.abs(x) <= 54 - (y + 30) * 0.35 && y >= -30 && y <= 30;
  grid(b, l, 11, 7, (x, y) => {
    if (inside(x, y, 0, 18, 26, 14)) return y < 14 ? ['#ffb0c8', true] : [PINK, true];
    if (!at(x, y)) return null;
    if (!at(x, y - PX)) return shade(c, 0.4);
    if (!at(x, y + PX)) return shade(c, -0.5);
    return shade(c, -0.1);
  });
  phosphor(b, l, 0.2, 4);
}

// Bitmaps: L lid, Y lit iris, y its lower half, k pupil, g glint, w tooth, R the lit red of an open
// mouth, G its burning throat, p tongue.
const EYE = ['LLLL.....', 'YYYLLLL..', 'YYYYYYYL.', 'YgYkkYYYL', 'YYkkkkYYY', '.yYkkYYy.', '..yyyyy..'];
const MOUTH = ['LLLLLLLLL', 'LRwwLwwRL', 'LRwwLwwRL', 'LGwwLwwGL', 'LGGGGGGGL', '.LGpppGL.', '..LLLLL..'];

// An eye (drawn as the left one): round and beady under a heavy scowling lid, burning.
function eye(b, l, _part, S) {
  const w = S.pal.weak;
  pixels(b, l, EYE, PX, { L: LID, Y: [w, true], y: [shade(w, -0.3), true], k: '#0a0612', g: ['#ffffff', true] });
  bloom(l, 0, 0, 44, w, 0.35);
  phosphor(b, l, 0.25, 4);
}

// The mouth: two great buck teeth over a burning throat.
function mouth(b, l, _part, S) {
  const w = S.pal.weak;
  pixels(b, l, MOUTH, PX, { L: LID, w: TOOTH, R: ['#b0301a', true], G: [w, true], p: [PINK, true] });
  bloom(l, 0, 10, 50, w, 0.4);
  phosphor(b, l, 0.25, 4);
}

export default {
  pad: 50,
  margin: 40,
  crack: AMBER,
  hull,
  parts: { ear, snout, eye, mouth },
  rage: [null, (l) => whiskers(l, AMBER, 0.9, 3), (l) => whiskers(l, RED, 1, 4)],
  // The brows throb, quicker with every phase.
  live(ctx, b, t) {
    ctx.globalAlpha = 0.15 + 0.3 * (0.5 + 0.5 * Math.sin(t * (4 + b.phase * 3)));
    for (const s of [-1, 1]) ctx.drawImage(glow(RED), s * 96 - 80, -26 - 32, 160, 64);
    ctx.globalAlpha = 1;
  },
};
