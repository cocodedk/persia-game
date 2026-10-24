// Per-world bunker textures, named by look.bunker.skin. A skin colours one inner pixel of a bunker:
// skin(x, y, w, h, P) -> [rgb, k], with (x, y) in the bunker's own pixels, P = the look's bunker
// colours as [r, g, b] (fill, light, dark, edge, accent) and k in [-1, 1] blending the colour toward
// light (k > 0) or dark (k < 0). The rim (bunkers-view.js) is drawn over every skin, so every
// carve still shows as a lit edge. Baked per carve, never per frame.
import { hash2, noise2 } from './sprites.js';

const grain = (x, y, a) => (hash2(x >> 1, y >> 1) - 0.5) * a;

// The default: lit from above, faint strata every 12 rows, grain.
function plain(x, y, w, h, P) {
  return [P.fill, 0.3 * (1 - y / h) + grain(x, y, 0.16) - (y % 12 === 11 ? 0.12 : 0)];
}

// Arcade: 4 px phosphor cells, each lit on its top-left, with a scanline on every other row.
function phosphor(x, y, w, h, P) {
  const cx = x % 4;
  const cy = y % 4;
  const k = 0.2 * (1 - y / h) + (cx === 0 || cy === 0 ? 0.22 : 0) - (cx === 3 || cy === 3 ? 0.25 : 0);
  return [P.fill, k - (y % 2 ? 0.1 : 0)];
}

// Neon Rain: a street kiosk of riveted panels, a neon strip under the roof, rows of lit windows.
function kiosk(x, y, w, h, P) {
  if (y === 4 || y === 5) return [P.edge, 0.2];
  const px = x % 32;
  const py = (y - 6) % 18;
  if (px === 0 || py === 0) return [P.dark, 0];
  if (py >= 6 && py <= 9 && px % 7 >= 2 && px % 7 <= 5 && hash2(x / 7, y / 18) > 0.45) {
    return [P.accent, py === 6 ? 0.3 : 0];
  }
  return [P.fill, 0.12 * (1 - y / h) + grain(x, y, 0.1) - (px === 31 ? 0.25 : 0)];
}

// Twin Suns: sandstone in wavy strata with coarse grain.
function sandstone(x, y, w, h, P) {
  const band = Math.sin(y * 0.6 + noise2(x, y, 26, 1) * 5);
  return [P.fill, 0.22 * (1 - y / h) + band * 0.11 + grain(x, y, 0.2) + (noise2(x, y, 7, 3) - 0.5) * 0.18];
}

// Ronin Moon: a shrine gate in lacquer, a black beam across the top, vermilion below, wood grain.
function shrine(x, y, w, h, P) {
  if (y < 8) return [P.accent, y < 2 ? 0.35 : grain(x, y, 0.08)];
  if (y < 11) return [P.fill, 0.25];
  if (y < 13) return [P.dark, 0];
  const post = Math.abs(((x + 8) % 40) - 20) < 3;
  return [P.fill, (noise2(x * 3, y * 0.2, 6, 2) - 0.5) * 0.3 - (post ? 0.2 : 0) + 0.1 * (1 - y / h)];
}

// Hive: ribbed resin, glossy at the top, glowing veins wandering through it.
function resin(x, y, w, h, P) {
  if (Math.abs(noise2(x, y, 24, 5) - 0.5) < 0.012) return [P.edge, 0];
  const rib = Math.sin(x * 0.5 + noise2(x, y, 15, 2) * 4);
  const pit = noise2(x, y, 6, 9) > 0.78 ? -0.35 : 0;
  return [P.fill, rib * 0.28 + 0.3 * (1 - y / h) + grain(x, y, 0.08) + pit];
}

// Code Rain: a wall of data cells, some lit, the grid between them dark.
function data(x, y, w, h, P) {
  const cx = x % 6;
  const cy = y % 6;
  if (cx === 0 || cy === 0) return [P.dark, 0];
  const on = hash2(x / 6 + Math.floor(y / 6) * 31, 7);
  if (on > 0.86) return [P.light, cx === 1 || cy === 1 ? 0.4 : 0];
  return [P.fill, on * 0.35 - 0.05];
}

// Iron Dawn: broken concrete, cracks, a little rebar, scorched toward the top.
function rubble(x, y, w, h, P) {
  const yy = y + Math.floor(noise2(x, 0, 30, 6) * 6); // slab joints, a little out of level
  if (yy % 15 === 0) return [P.dark, 0];
  const slab = Math.floor(yy / 15);
  if (Math.abs(noise2(x, y, 26, 7) - 0.5) < 0.01) return [P.dark, -0.3];
  if ((x * 2 + y) % 41 === 0 && noise2(x, y, 12, 4) > 0.6) return [P.accent, 0.1];
  const scorch = y < 10 ? -0.25 * (1 - y / 10) : 0;
  return [P.fill, (hash2(slab, 3) - 0.5) * 0.25 + (noise2(x, y, 5, 1) - 0.5) * 0.3 + grain(x, y, 0.18) + scorch + 0.1];
}

// Event Horizon: frozen crystal in facets (cells around seeded points), each a shade of its own,
// bright along the seams where two facets meet.
const CELL = 22;
function ice(x, y, w, h, P) {
  const gx = Math.floor(x / CELL);
  const gy = Math.floor(y / CELL);
  let d1 = Infinity;
  let d2 = Infinity;
  let id = 0;
  for (let j = gy - 1; j <= gy + 1; j++) {
    for (let i = gx - 1; i <= gx + 1; i++) {
      const sx = (i + hash2(i, j)) * CELL;
      const sy = (j + hash2(j + 91, i)) * CELL;
      const d = (x - sx) ** 2 + (y - sy) ** 2;
      if (d < d1) [d2, d1, id] = [d1, d, i * 131 + j];
      else if (d < d2) d2 = d;
    }
  }
  if (Math.sqrt(d2) - Math.sqrt(d1) < 1.1) return [P.light, 0.2];
  return [P.fill, (hash2(id, 5) - 0.5) * 0.5 + 0.15 * (1 - y / h) + grain(x, y, 0.05)];
}

export const SKINS = { plain, phosphor, kiosk, sandstone, shrine, resin, data, rubble, ice };
