// Natural silhouettes: a ridge of crooked pines. See parallax-shapes.js for the painter contract.
import { profile, ridgeTop } from './parallax-kit.js';
import { TAU } from '../core/math.js';

// A tapered band along points `pts`, `w0` wide at the first and `w1` at the last.
function taper(g, pts, w0, w1) {
  const left = [];
  const right = [];
  pts.forEach(([x, y], i) => {
    const [ax, ay] = pts[Math.max(0, i - 1)];
    const [bx, by] = pts[Math.min(pts.length - 1, i + 1)];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    const w = (w0 + (w1 - w0) * (i / (pts.length - 1))) / 2;
    left.push([x - ((by - ay) / len) * w, y + ((bx - ax) / len) * w]);
    right.push([x + ((by - ay) / len) * w, y - ((bx - ax) / len) * w]);
  });
  g.beginPath();
  for (const [x, y] of left) g.lineTo(x, y);
  for (const [x, y] of right.toReversed()) g.lineTo(x, y);
  g.fill();
}

// A crooked pine: a bent trunk and flat clouds of needles, ink style.
function pine(g, x, base, s, rng) {
  const lean = (rng() - 0.5) * 0.8;
  const pts = [];
  for (let i = 0; i <= 10; i++) pts.push([x + Math.sin(i * 0.5 + lean * 3) * 10 * s + lean * i * 8 * s, base - i * 11 * s]);
  taper(g, pts, 9 * s, 2 * s);
  for (let k = 0; k < 4; k++) { // flat clouds of needles, scalloped, reaching out from the trunk
    const [px, py] = pts[4 + k * 2] ?? pts[pts.length - 1];
    const side = k % 2 ? 1 : -1;
    const reach = (26 + rng() * 22) * s * (1 - k * 0.15);
    g.beginPath();
    g.moveTo(px, py);
    g.lineTo(px + side * reach, py - 2 * s);
    g.lineWidth = 3 * s;
    g.stroke();
    for (let j = 0; j < 4; j++) {
      g.beginPath();
      g.ellipse(px + side * reach * (0.25 + j * 0.25), py - 4 * s - (j % 2) * 3 * s, 11 * s, 5 * s, 0, 0, TAU);
      g.fill();
    }
  }
}

function pines(g, w, h, rng, L) {
  const top = ridgeTop(rng, w, h, L.roughness, 0.2, 1.6);
  profile(g, w, h, top);
  g.strokeStyle = L.color;
  for (let x = 30; x < w; x += 70 + rng() * 200) pine(g, x, top(x) + 6, 0.7 + rng() * 0.8, rng);
}

export const WILD = { pines };
