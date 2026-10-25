// The Shah Mosque on Naqsh-e Jahan (naqsh.js), in the middle: the tall tiled portal with its pointed
// arch cut into a rectangular frame, a honeycomb of lit niches in the arch and a lit door at its
// foot, stacked blind niches either side; on the portal's two top corners the slim twin minarets,
// banded with tile, each with its balcony, its lantern and a lamp; and behind it all the great
// dome (naqsh-dome.js). Painted as the middle row, a little misted. `up` counts blocks up from the
// street. Tones: T U u tile, k K recess, g h G the door and lamps; the brick is Yazd's (yazd-brick.js).
import { PIXEL } from '../sprites.js';
import { BASE, key, brick, light, lamp, archHalf } from './yazd-brick.js';
import { dome } from './naqsh-dome.js';

const D = 1;
export const PORTAL = { half: 31, tall: 60 }; // the frame's half-width, its height
const ARCHES = [[20, 34, 57], [18, 35, 54], [14, 36, 50]]; // outline, tile band, recess: half-width, where it starts to close, its point
const DOOR = [6, 14, 22];
const NICHES = [6, 20, 34]; // the blind niches either side: the row each one starts on
const TOWER = { at: 28, wide: 5, tall: 104, balcony: 90 }; // each minaret: from the middle, shaft width, height, its balcony's

export function mosque(art) {
  const { lights, row, L } = art;
  const cx = art.mid;
  lamp(art, D, cx, row(26), 20, 0.9, false);
  lights.push({ x: (cx + 0.5) * PIXEL, y: row(26) * PIXEL, r: 110, color: L.lamp, ph: 0.9, a: 0.22 });
  dome(art, cx);
  portal(art, cx);
  for (const s of [-1, 1]) minaret(art, cx + s * TOWER.at);
}

// A tile of the portal's field at block x, row `up`: the diagonal check, lit near a lamp.
function field(art, x, up) {
  const check = (x + up) % 2 === 0;
  return light(art.lamps[D], x, art.row(up)) > 0.3 ? (check ? 'U' : 'T') : check ? 'T' : 'u';
}

function portal(art, cx) {
  const { box, row } = art;
  const { half, tall } = PORTAL;
  for (let up = 0; up < tall; up++) {
    const frieze = up >= tall - 4;
    for (let x = cx - half; x <= cx + half; x++) {
      const edge = Math.abs(x - cx) >= half - 1;
      box(x, row(up), 1, 1, edge || up === tall - 5 ? 'u' : frieze ? (x % 2 ? 'U' : 'T') : field(art, x, up));
    }
  }
  box(cx - half - 1, row(tall), half * 2 + 3, 1, key(D, BASE[D] + 0.3)); // the cornice, lit on top and shadowed under
  box(cx - half - 1, row(tall - 1), half * 2 + 3, 1, key(D, BASE[D] - 0.25));
  for (const s of [-1, 1]) for (const up of NICHES) niche(art, s > 0 ? cx + 23 : cx - 26, up);
  for (let up = 0; up <= ARCHES[0][2]; up++) {
    const [outline, band, recess] = ARCHES.map((a) => archHalf(a, up));
    if (up < ARCHES[0][2]) box(cx - outline - 1, row(up), outline * 2 + 3, 1, key(D, BASE[D] - 0.3));
    for (let x = cx - band; x <= cx + band; x++) {
      const inner = Math.abs(x - cx) <= recess && up <= ARCHES[2][2];
      box(x, row(up), 1, 1, inner ? honeycomb(x - cx, up) : field(art, x, up));
    }
  }
  for (let up = 0; up <= DOOR[2]; up++) {
    const hw = archHalf(DOOR, up);
    box(cx - hw, row(up), hw * 2 + 1, 1, up > DOOR[2] - 3 ? 'h' : 'g');
  }
  box(cx, row(DOOR[2] - 5), 1, 3, 'G');
}

// The dark arch's vault, a honeycomb of niches: some glint, some are lit from below.
function honeycomb(dx, up) {
  if (up < 24) return 'k';
  const cell = (dx + 2 * (up >> 1) + 80) % 4;
  return up % 2 === 0 && cell === 0 ? 'h' : cell === 2 && up % 2 ? 'K' : 'k';
}

// A blind niche 4 wide, 10 high, its foot on row `up`, its left edge on column x.
function niche({ box, row }, x, up) {
  box(x, row(up + 9), 4, 10, 'u');
  box(x + 1, row(up + 8), 2, 8, 'k');
  box(x + 1, row(up + 1), 2, 1, 'h');
}

// A minaret on the portal's top, centred on column mx.
function minaret(art, mx) {
  const { box, row } = art;
  const { wide, tall, balcony } = TOWER;
  const x = mx - (wide >> 1);
  brick(art, D, x, row(balcony - 1), wide, balcony - PORTAL.tall, (i) => BASE[D] - 0.05 + (i === 0 ? -0.2 : i === wide - 1 ? 0.3 : 0), 1);
  for (let up = PORTAL.tall + 3; up < balcony - 3; up += 8) {
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
