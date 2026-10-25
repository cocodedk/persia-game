// The Jameh Mosque of Yazd, behind the roofs a little right of the middle (yazd.js): its tall flat
// portal with the pointed arch cut into it, three arches nested in one another, their tiles dimly
// turquoise and lit from inside; the great tiled dome beside it, and on the portal's two top
// corners the twin slim minarets, banded with tile, each with its balcony, its lantern and a lamp.
// Painted as the middle row, so the houses in front of it hide its foot. `up` counts blocks up from
// the street.
import { PIXEL } from '../sprites.js';
import { BASE, key, brick, light, lamp, archHalf } from './yazd-brick.js';

const D = 1;
const PORTAL = { half: 18, tall: 58 }; // the frame's half-width, its height
const ARCHES = [[11, 22, 56], [9, 24, 52], [6, 27, 46]]; // outline, tile band, recess: half-width, where it starts to close, its point
const TOWER = { at: 13, wide: 5, tall: 96, balcony: 80 }; // each minaret: from the middle, shaft width, height, its balcony's
const DOME = { at: -36, r: 13, from: 30 }; // the great dome: from the middle, radius, the row its drum starts on

export function jameh(art, cx) {
  const { box, row } = art;
  lamp(art, D, cx, row(36), 16, 0.9, false);
  art.lights.push({ x: (cx + 0.5) * PIXEL, y: row(36) * PIXEL, r: 56, color: art.L.lamp, ph: 0.9, a: 0.25 });
  dome(art, cx + DOME.at);
  brick(art, D, cx - PORTAL.half, row(PORTAL.tall - 1), PORTAL.half * 2, PORTAL.tall, (i, j) => {
    const edge = i < 2 ? -0.15 : i > PORTAL.half * 2 - 3 ? 0.25 : 0;
    return BASE[D] + 0.05 + edge + (j === 0 ? -0.3 : j === 2 ? 0.25 : 0);
  }, 2);
  for (let up = 0; up <= ARCHES[0][2]; up++) {
    const [outline, band, recess] = ARCHES.map((a) => archHalf(a, up));
    if (up < ARCHES[0][2]) box(cx - outline - 1, row(up), outline * 2 + 3, 1, key(D, BASE[D] - 0.3));
    for (let x = cx - band; x <= cx + band; x++) {
      const lit = light(art.lamps[D], x, row(up));
      const inner = Math.abs(x - cx) <= recess && up <= ARCHES[2][2];
      const tile = (x + up) % 2 === 0;
      box(x, row(up), 1, 1, inner ? (lit > 0.4 ? 'T' : 'u') : lit > 0.3 ? (tile ? 'U' : 'T') : tile ? 'T' : 'u');
    }
  }
  for (const s of [-1, 1]) minaret(art, cx + s * TOWER.at);
}

// The great dome with its centre on column x: a tiled drum, the bulb above it ribbed and lit down its
// left, a finial.
function dome(art, x) {
  const { box, row } = art;
  const { r, from } = DOME;
  box(x - r + 2, row(from + 5), r * 2 - 3, 6, 'u');
  for (let c = x - r + 3; c < x + r - 2; c += 3) box(c, row(from + 4), 1, 4, 'T');
  for (let up = 0; up < r; up++) {
    const hw = Math.round(r * Math.sqrt(1 - (up / r) ** 2)) - 1;
    for (let c = x - hw; c <= x + hw; c++) {
      const lit = (c - x + hw) / (hw * 2 + 1);
      box(c, row(from + 6 + up), 1, 1, lit < 0.25 ? 'U' : lit < 0.7 ? 'T' : 'u');
    }
  }
  box(x, row(from + 6 + r + 2), 1, 3, key(D, BASE[D] - 0.3));
}

// A minaret on the portal's top, centred on column mx.
function minaret(art, mx) {
  const { box, row } = art;
  const { wide, tall, balcony } = TOWER;
  const x = mx - (wide >> 1);
  brick(art, D, x, row(balcony - 1), wide, balcony - PORTAL.tall + 6, (i) => BASE[D] - 0.05 + (i === 0 ? -0.2 : i === wide - 1 ? 0.3 : 0), 1);
  for (let up = PORTAL.tall + 2; up < balcony - 4; up += 8) {
    box(x + 1, row(up + 1), wide - 2, 2, 'T');
    box(x + 1, row(up + 1), wide - 2, 1, 'U');
  }
  box(mx - 4, row(balcony), 9, 1, key(D, BASE[D] + 0.3)); // the balcony, lit on top, shadowed under
  box(mx - 4, row(balcony + 1), 9, 1, key(D, BASE[D] - 0.25));
  for (let i = 0; i < 9; i += 2) box(mx - 4 + i, row(balcony + 2), 1, 2, 'k'); // its railing
  brick(art, D, mx - 1, row(tall - 4), 3, tall - balcony - 6, (i) => BASE[D] - 0.1 + (i === 2 ? 0.3 : 0), 1);
  box(mx - 2, row(tall - 3), 5, 2, 'T'); // the lantern, capped in tile
  box(mx - 2, row(tall - 3), 5, 1, 'U');
  box(mx, row(tall + 1), 1, 3, key(D, BASE[D] - 0.3));
  box(mx, row(balcony + 2), 1, 2, 'G');
  lamp(art, D, mx, row(balcony + 2), 7, 0.7);
}
