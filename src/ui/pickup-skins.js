// Per-world pickup skins (look.world 1..8). A pickup must still read as "catch me" in every world,
// so the falling capsule keeps its dark middle, coloured rim, pulse and turning dashes
// (pickups-view.js); a world changes the rim's shape and redraws some icons in its own idiom.
//   FRAMES[world](g, color)        the capsule's rim, centred, inside a 60 x 60 sprite (baked)
//   ICONS[world][kind](g, color)   replaces drawIcon's default for that kind (centred, ~30 px);
//                                  also drawn by the HUD every frame, so plain paths only
//                                  (pickup-icons.js worlds 1-4, pickup-icons-2.js worlds 5-8)
import { INK, rgba } from './sprites.js';
import { TAU } from '../core/math.js';
import { ICONS1 } from './pickup-icons.js';
import { ICONS2 } from './pickup-icons-2.js';

export const disc = (g, r) => {
  g.fillStyle = 'rgba(8,10,20,0.88)';
  g.beginPath();
  g.arc(0, 0, r, 0, TAU);
  g.fill();
};
export const ring = (g, r, color, w) => {
  g.lineWidth = w;
  g.strokeStyle = color;
  g.beginPath();
  g.arc(0, 0, r, 0, TAU);
  g.stroke();
};
const poly = (g, n, r, rot = 0) => {
  g.beginPath();
  for (let i = 0; i < n; i++) g.lineTo(Math.cos(rot + (i * TAU) / n) * r, Math.sin(rot + (i * TAU) / n) * r);
  g.closePath();
};

export const FRAMES = {
  1(g, color) { // a ring of phosphor pixels
    for (let i = -7; i <= 7; i++) {
      for (let j = -7; j <= 7; j++) {
        const d = Math.hypot(i, j);
        if (d >= 6.7) continue;
        g.fillStyle = d >= 5.6 ? color : 'rgba(8,10,20,0.9)';
        g.fillRect(i * 4 - 2, j * 4 - 2, 4, 4);
      }
    }
  },
  2(g, color) { // a neon tube
    disc(g, 24);
    for (const [w, a] of [[11, 0.12], [7, 0.25]]) ring(g, 25, rgba(color, a), w);
    ring(g, 25, color, 3);
    ring(g, 25, rgba('#ffffff', 0.85), 1);
  },
  3(g, color) { // a brass collar with rivets
    disc(g, 24);
    ring(g, 26, INK, 7);
    ring(g, 26, color, 4);
    g.fillStyle = '#fff3d8';
    for (let i = 0; i < 6; i++) g.fillRect(Math.cos((i * TAU) / 6) * 26 - 1.5, Math.sin((i * TAU) / 6) * 26 - 1.5, 3, 3);
  },
  4(g, color) { // one brush stroke, thick to thin, left open
    disc(g, 23);
    g.strokeStyle = color;
    g.lineCap = 'round';
    for (let i = 0; i < 24; i++) {
      const a = -1.2 + (i / 24) * 5.6;
      g.lineWidth = 7 - i * 0.24;
      g.beginPath();
      g.arc(0, 0, 25, a, a + 0.26);
      g.stroke();
    }
    g.lineCap = 'butt';
  },
  5(g, color) { // a living membrane
    g.beginPath();
    for (let i = 0; i <= 48; i++) {
      const a = (i / 48) * TAU;
      const r = 25 + Math.sin(a * 6) * 1.6;
      g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    g.fillStyle = 'rgba(6,14,8,0.9)';
    g.fill();
    g.lineWidth = 6;
    g.strokeStyle = INK;
    g.stroke();
    g.lineWidth = 3;
    g.strokeStyle = color;
    g.stroke();
  },
  6(g, color) { // a code block in brackets
    g.fillStyle = 'rgba(2,10,4,0.9)';
    g.fillRect(-23, -23, 46, 46);
    g.lineWidth = 4;
    g.strokeStyle = color;
    for (const s of [-1, 1]) {
      g.beginPath();
      g.moveTo(s * 18, -26);
      g.lineTo(s * 26, -26);
      g.lineTo(s * 26, 26);
      g.lineTo(s * 18, 26);
      g.stroke();
    }
  },
  7(g, color) { // a steel nut
    poly(g, 6, 27, Math.PI / 6);
    g.fillStyle = 'rgba(10,10,14,0.92)';
    g.fill();
    g.lineWidth = 6;
    g.strokeStyle = INK;
    g.stroke();
    g.lineWidth = 3.4;
    g.strokeStyle = color;
    g.stroke();
  },
  8(g, color) { // a ring with an orbit passing behind it and a bead riding the orbit
    g.save();
    g.rotate(-0.4);
    g.scale(1, 0.32);
    ring(g, 28, rgba(color, 0.8), 3.5);
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.arc(28, 0, 7, 0, TAU);
    g.fill();
    g.restore();
    disc(g, 23);
    ring(g, 24, color, 2.5);
  },
};

export const ICONS = { ...ICONS1, ...ICONS2 };
