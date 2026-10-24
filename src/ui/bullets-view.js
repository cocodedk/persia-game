// Enemy bullets by pattern, in the look's colours: the look's own plain bullet (the cabinet's
// zigzag), drops for rain, pulsing seekers for homing. Lasers are in lasers-view.js. One glow + one
// body sprite per bullet; at half quality the glow is skipped.
import { glow } from './sprites.js';
import { bulletKit } from './bullet-sprites.js';

// A bullet's own animation offset: its heading and speed, which belong to the bullet (an index into
// the list does not: it shifts whenever an earlier bullet is removed, and every bullet after it would
// jump to another frame). It drifts smoothly when a homing bullet turns.
const phaseOf = (b) => Math.atan2(b.vy, b.vx) * 5 + Math.hypot(b.vx, b.vy) * 0.013;

// A sprite turned by `angle` round (x, y); the transform is `m` again afterwards, so the bullets
// drawn after it in plain coordinates land where they are.
function rotated(ctx, m, x, y, angle, sprite) {
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
  ctx.setTransform(m);
}
const heading = (vx, vy) => Math.atan2(vy, vx) + Math.PI / 2;

// The plain bullet in each bullet style (look.bullet).
const PLAIN = {
  pixel: (ctx, K, b, t) => ctx.drawImage(K.zig[Math.floor(t * 10 + phaseOf(b)) & 1], b.x - 10, b.y - 18),
};

export function drawBullets(ctx, world, look, t, quality = 1) {
  const list = world.bullets;
  if (quality >= 1) { // glows under everything, in one additive pass
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.75;
    const g = glow(look.palette.enemy);
    for (const b of list) {
      if (b.pattern === 'laser') continue;
      const r = b.r * 2.8;
      ctx.drawImage(g, b.x - r, b.y - r, r * 2, r * 2);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
  const m = ctx.getTransform();
  const plain = PLAIN[look.bullet];
  const K = bulletKit(look);
  for (const b of list) {
    const p = b.pattern;
    if (p === 'laser') continue;
    if (p === 'rain') rotated(ctx, m, b.x, b.y, heading(b.vx, b.vy), K.drop);
    else if (p === 'homing') {
      const pulse = 1 + 0.18 * Math.sin(t * 12 + phaseOf(b));
      const s = K.seeker;
      ctx.drawImage(s, b.x - s.width / 2 * pulse, b.y - s.height / 2 * pulse, s.width * pulse, s.height * pulse);
    } else plain(ctx, K, b, t);
  }
}
