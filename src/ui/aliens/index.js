// Everything alien-shaped on the playfield, in the sprites aliens/w1.js paints and bake.js bakes
// once: world.aliens (formation and boss minions).
//   drawAliens(ctx, world, look, t)   world space, after the boss (minions fly over the boss they
//                                     launch from)
//   crackStage(alien)                 0 | 1 | 2, how cracked an alien is drawn (a.maxHp)
// Per alien: a halo (cached glow, 'lighter'), the body (cracked once it has lost hp; a white
// silhouette for FLASH s after a hit) and its lights ('lighter'); frames alternate at the art's
// rate, swoopers lean into the swoop. The flash is the renderer's own memory: a WeakMap of the hp
// each alien had when last drawn. Nothing on world or fx is written.
import { glow } from '../sprites.js';
import { clamp } from '../../core/math.js';
import { isSwooping } from '../../core/aliens.js';
import { ART, roleSprites } from './bake.js';
import { cracked } from './cracks.js';

const FLASH = 0.09; // s
const seen = new WeakMap(); // alien -> { hp, at }

function flashing(a, t) {
  let m = seen.get(a);
  if (!m) {
    m = { hp: a.hp, at: -Infinity };
    seen.set(a, m);
  }
  if (a.hp < m.hp) m.at = t;
  m.hp = a.hp;
  return t >= m.at && t - m.at < FLASH;
}

// 0 unhurt, 1 hurt, 2 badly hurt, from the hp lost out of the alien's own maxHp (set by the core
// where it was made; ruling R25). An alien without one is drawn whole. Exported for tests.
export function crackStage(a) {
  const max = a.maxHp ?? a.hp;
  if (a.hp >= max) return 0;
  return Math.min(2, Math.ceil((2 * (max - a.hp)) / max - 1e-9));
}

const frameOf = (A, a, t) => Math.floor(t * A.rate + (A.sync ? 0 : a.id * 0.37)) & 1;
const bobOf = (A, a, t) => (A.bob ? Math.sin(t * 2.3 + a.id * 1.7) * A.bob : 0);

// A swooping alien leans into its swoop (sprites face down): toward its aim on the way out, a little
// back the other way on the return; a boss minion leans toward the ship it is falling on.
function lean(world, a) {
  if (!isSwooping(a)) return 0;
  const dx = a.dive ? a.dive.ax - a.dive.fx : a.minion ? world.ship.x - a.x : 0;
  return clamp(-dx / 500, -0.55, 0.55) * (a.mode === 'return' ? -0.6 : 1);
}

function blit(ctx, img, set, x, y, rot = 0) {
  const s = set.size;
  if (!rot) {
    ctx.drawImage(img, x - s / 2, y - s / 2, s, s);
    return;
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.drawImage(img, -s / 2, -s / 2, s, s);
  ctx.restore();
}

function halos(ctx, list, look, A, t) {
  const colors = look.palette.alien;
  ctx.globalCompositeOperation = 'lighter';
  for (const a of list) {
    const carrier = a.role === 'carrier';
    const r = carrier ? 62 : 44;
    ctx.globalAlpha = carrier ? 0.42 + 0.18 * Math.sin(t * 5 + a.id) : A.halo;
    ctx.drawImage(glow(colors[a.role]), a.x - r, a.y + bobOf(A, a, t) - r, r * 2, r * 2);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

export function drawAliens(ctx, world, look, t) {
  const A = ART;
  halos(ctx, world.aliens, look, A, t);
  for (const a of world.aliens) {
    const set = roleSprites(look, a.role);
    const f = frameOf(A, a, t);
    const k = crackStage(a);
    const img = flashing(a, t) ? set.flash[f] : k ? cracked(set, f, k) : set.body[f];
    blit(ctx, img, set, a.x, a.y + bobOf(A, a, t), lean(world, a));
  }
  ctx.globalCompositeOperation = 'lighter';
  for (const a of world.aliens) {
    const set = roleSprites(look, a.role);
    blit(ctx, set.lights[frameOf(A, a, t)], set, a.x, a.y + bobOf(A, a, t), lean(world, a));
  }
  ctx.globalCompositeOperation = 'source-over';
}
