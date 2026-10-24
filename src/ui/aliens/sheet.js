// dev.html?sheet=w4: one world's art on its own sky, for judging it by eye (not shipped UI).
//   two big rows    every role, frame 0 then frame 1, baked at BIG x so the detail is real
//   a 1:1 strip     per role: frame 0, frame 1, the hit flash, cracked 1, cracked 2, as in the game
//   the last row    a bunker fresh and carved, the five pickups, the saucer and the wreck (if any)
import { clamp } from '../../core/math.js';
import { WORLDS } from '../../core/levels.js';
import { W, H } from '../sprites.js';
import { createBunker, hitBunker, BUNKER } from '../../core/bunkers.js';
import { LOOKS } from '../looks/index.js';
import { buildSky } from '../sky.js';
import { label } from '../hud-kit.js';
import { drawBunkers } from '../bunkers-view.js';
import { drawPickups } from '../pickups-view.js';
import { roleSprites, extraSprites, ROLE_LIST } from './bake.js';
import { cracked } from './cracks.js';

const BIG = 2.6;

function put(g, set, img, f, x, y, lights = true) {
  const s = set.size * set.scale;
  g.drawImage(img, x - s / 2, y - s / 2, s, s);
  if (!lights) return;
  g.globalCompositeOperation = 'lighter';
  g.drawImage(set.lights[f], x - s / 2, y - s / 2, s, s);
  g.globalCompositeOperation = 'source-over';
}

function bunkers(g, look) {
  const fresh = createBunker(70, 905, BUNKER.w, BUNKER.h);
  const carved = createBunker(260, 905, BUNKER.w, BUNKER.h);
  for (const [x, y, r] of [[300, 905, 8], [312, 915, 6], [380, 930, 10], [345, 960, 5], [400, 905, 7]]) {
    hitBunker(carved, x, y, r);
  }
  drawBunkers(g, { bunkers: [fresh, carved] }, look);
}

export function drawSheet(canvas, id) {
  const n = clamp(parseInt(String(id).replace(/\D/g, ''), 10) || 1, 1, 8);
  const look = LOOKS[n - 1];
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext('2d');
  g.drawImage(buildSky(look), 0, 0);
  label(g, `W${n} · ${WORLDS[n - 1].name.toUpperCase()} · ALIEN SHEET`, 40, 44, 'left', look.palette.accent);
  ROLE_LIST.forEach((role, i) => {
    const cx = 192 + i * 384;
    const big = roleSprites(look, role, BIG);
    put(g, big, big.body[0], 0, cx, 240);
    put(g, big, big.body[1], 1, cx, 530);
    label(g, role.toUpperCase(), cx, 92, 'center');
    const one = roleSprites(look, role);
    const strip = [[one.body[0], 0], [one.body[1], 1], [one.flash[0], 0], [cracked(one, 0, 1), 0], [cracked(one, 0, 2), 0]];
    strip.forEach(([img, f], k) => put(g, one, img, f, cx - 136 + k * 68, 760, k !== 2));
  });
  label(g, 'FRAME 0 (×2.6)', 40, 392);
  label(g, 'FRAME 1', 40, 690);
  label(g, '1:1 · FRAME 0 · FRAME 1 · FLASH · CRACK 1 · CRACK 2', 40, 830);
  bunkers(g, look);
  const pickups = ['spread', 'laser', 'rapid', 'shield', 'bomb'].map((kind, k) => ({ kind, x: 560 + k * 92, y: 935 }));
  drawPickups(g, { pickups }, look, 0.3);
  [['saucer', 1240], ['wreck', 1420]].forEach(([name, x]) => {
    const s = extraSprites(look, name, 1.5);
    if (s) put(g, s, s.body[0], 0, x, 935);
  });
  label(g, 'BUNKERS · PICKUPS · SAUCER · WRECK', 40, 1060);
}
