// Cached bullet sprites. Every enemy bullet has a dark rim and a bright core so it reads on any sky
// (spec); the colour between is the world's enemy colour. Glow is a separate additive sprite.
import { INK, cached, rgba, roundRect, lin, rad } from './sprites.js';
import { TAU } from '../core/math.js';

// A round bullet of radius r: dark rim, coloured ring, white-hot core.
const orb = (color, rim, r) => cached(`orb${color}${rim}${r}`, r * 2 + 6, r * 2 + 6, (g, w) => {
  const c = w / 2;
  g.fillStyle = rgba(rim, 0.92);
  g.beginPath();
  g.arc(c, c, r + 2, 0, TAU);
  g.fill();
  g.fillStyle = rad(g, c, c, 0, r, [[0, '#ffffff'], [0.42, '#ffffff'], [0.62, color], [1, color]]);
  g.beginPath();
  g.arc(c, c, r, 0, TAU);
  g.fill();
});

// A capsule pointing up, `len` long and `wd` wide: a blaster bolt or a falling drop.
const capsule = (color, rim, len, wd) => cached(`cap${color}${rim}${len}${wd}`, wd + 6, len + 6, (g, w, h) => {
  const pill = (x, y, cw, ch) => {
    roundRect(g, x, y, cw, ch, cw / 2);
    g.fill();
  };
  g.fillStyle = rgba(rim, 0.92);
  pill(1, 1, w - 2, h - 2);
  g.fillStyle = color;
  pill(3, 3, w - 6, h - 6);
  g.fillStyle = '#ffffff';
  pill(w / 2 - wd * 0.2, 6, wd * 0.4, h - 14);
});

// The cabinet's zigzag shot in 4 px blocks, two frames; outlined in the rim colour.
const ZIG = [
  ['.x.', 'x..', '.x.', '..x', '.x.', 'x..', '.x.'],
  ['.x.', '..x', '.x.', 'x..', '.x.', '..x', '.x.'],
];
const zigzag = (color, rim, frame) => cached(`zig${color}${rim}${frame}`, 20, 36, (g) => {
  const rows = ZIG[frame];
  for (const [pad, fill] of [[2, rim], [0, color]]) {
    g.fillStyle = fill;
    rows.forEach((row, y) => [...row].forEach((ch, x) => {
      if (ch === 'x') g.fillRect(4 + x * 4 - pad, 4 + y * 4 - pad, 4 + pad * 2, 4 + pad * 2);
    }));
  }
  g.fillStyle = '#ffffff';
  rows.forEach((row, y) => { const x = row.indexOf('x'); g.fillRect(5 + x * 4, 5 + y * 4, 2, 2); });
});

// A four-point throwing star, steel with a bright edge and a dark outline.
const shuriken = (glowColor) => cached('shu' + glowColor, 48, 48, (g) => {
  g.translate(24, 24);
  g.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const r = i % 2 ? 7 : 20;
    g.lineTo(Math.cos(a + 0.25 * (i % 2)) * r, Math.sin(a + 0.25 * (i % 2)) * r);
  }
  g.closePath();
  g.fillStyle = lin(g, -20, -20, 20, 20, [[0, '#f4f6ff'], [0.5, '#8a8e9e'], [1, '#3a3c48']]);
  g.fill();
  g.lineWidth = 2;
  g.strokeStyle = INK;
  g.stroke();
  g.strokeStyle = rgba(glowColor, 0.9);
  g.lineWidth = 1.5;
  g.stroke();
  g.fillStyle = INK;
  g.beginPath();
  g.arc(0, 0, 4, 0, TAU);
  g.fill();
});

// Every enemy bullet sprite of a look, baked on its first frame and then plain property reads:
// drawBullets asks once per bullet per frame. Lasers (strip) are drawn by lasers-view.js.
const kits = new WeakMap();
export function bulletKit(look) {
  let k = kits.get(look);
  if (!k) {
    const { enemy: c, enemyRim: rim } = look.palette;
    k = {
      ball: orb(c, rim, 8), seeker: orb(c, rim, 10), bolt: capsule(c, rim, 28, 9), drop: capsule(c, rim, 26, 9),
      acid: capsule('#a6ff3a', '#0a1a04', 22, 12), star: shuriken(c), zig: [zigzag(c, rim, 0), zigzag(c, rim, 1)],
    };
    kits.set(look, k);
  }
  return k;
}

// A horizontal cross-section of a beam (transparent edges, colour, white centre): stretch it.
export const strip = (color) => cached('strip' + color, 64, 4, (g, w, h) => {
  g.fillStyle = lin(g, 0, 0, w, 0, [
    [0, rgba(color, 0)], [0.25, rgba(color, 0.35)], [0.4, rgba(color, 0.95)], [0.5, '#ffffff'],
    [0.6, rgba(color, 0.95)], [0.75, rgba(color, 0.35)], [1, rgba(color, 0)],
  ]);
  g.fillRect(0, 0, w, h);
});
