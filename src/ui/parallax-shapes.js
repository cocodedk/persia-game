// Silhouette painters for the parallax layers, one per layer kind (adapted from Barrage). Each fills
// `g` (w x h, the band standing on the frame's bottom) in the layer colour; `rng` is seeded, `lights`
// collects the glows that pulse on top ({ x, y, r, color, ph, a }).
import { profile, ridgeTop } from './parallax-kit.js';
import { WILD } from './parallax-wild.js';

// A flat floor whose top is one glowing line.
function ground(g, w, h, rng, L, lights) {
  g.fillRect(0, h * 0.3, w, h);
  g.fillStyle = L.line;
  g.fillRect(0, h * 0.3, w, 4);
  for (let x = 40; x < w; x += 180 + rng() * 120) lights.push({ x, y: h * 0.3 + 2, r: 34, color: L.line, ph: rng(), a: 0.5 });
}

const GENERIC = {
  mountains: (g, w, h, rng, L) => profile(g, w, h, ridgeTop(rng, w, h, L.roughness)),
  ground,
};

export function paintLayer(g, w, h, rng, L, lights) {
  g.fillStyle = L.color;
  const paint = GENERIC[L.kind] ?? WILD[L.kind];
  paint(g, w, h, rng, L, lights);
}
