// The boss sprite cache. A boss's painter module (bosses/<kind>.js) is run once per level into
// offscreen canvases; per frame the game only blits them (bosses/index.js).
//   bossArt(look, kind)   -> { mod, S, hull, parts } (baked on first call, then kept)
//     hull  = { body, lights, flash, rage: [canvas | null per phase], x0, y0 } boss-local top-left
//             (flash: null until hullFlash(B) bakes it; only the dying boss needs it)
//     parts = { [id]: set }, set = { body, lights, flash, open?, w, h, m, seed, crack, cracks, ... }
//             drawn at the part's centre; the damage states (cracks.js) are baked on first use
//   warmBoss(look, kind)  bossArt plus everything the fight will need, the damage states and the hull
//                         flash included, so nothing is baked mid-fight (createView, on a level with a boss)
//   hullFlash(B)          the hull's white silhouette (the collapse), baked on first use
//   painterFor(mod, id)   [painter, mirror] for a part: its own painter, or its left twin's
//                         mirrored for an id ending in R (eyeR from eye), or null
// A module is { pad?, margin?, margins?: { [id]: px }, crack?, hull(b, l, S),
//   parts: { [id | base]: (b, l, p, S) } (margin: px of canvas round a part's rect for art that
//   overhangs it, 34 by default; margins overrides it per part id),
//   opened?: { [id]: painter } (art once a phase opens the part), rage?: [(l, S) | null per phase]
//   (extra hull lights that fade in with that phase), live?(ctx, boss, t) (per-frame extras
//   in boss coordinates, 'lighter', cached sprites only) }.
// S = { def, pal: look.palette.boss, look, W, H, pad }; b, l are the body and lights contexts.
import { makeCanvas, white } from '../sprites.js';
import { bossDef } from '../../core/bosses-data.js';
import { cracked, exposed, wreck } from './cracks.js';
import giant from './giant.js';

export const BOSS_ART = { giant };
const cache = new Map();

export function painterFor(mod, id) {
  if (mod.parts[id]) return [mod.parts[id], 1];
  const base = id.replace(/[LR]$/, '');
  if (base !== id && mod.parts[base]) return [mod.parts[base], id.endsWith('R') ? -1 : 1];
  return null;
}

// A w x h canvas with the origin at (ox, oy), mirrored when flip is -1; pair = body and lights.
function layer(w, h, ox, oy, flip = 1) {
  const c = makeCanvas(w, h);
  const g = c.getContext('2d');
  g.translate(ox, oy);
  g.scale(flip, 1);
  return [c, g];
}
const pair = (w, h, ox, oy, flip) => [layer(w, h, ox, oy, flip), layer(w, h, ox, oy, flip)];

function bakePart(mod, p, S, i) {
  const m = mod.margins?.[p.id] ?? mod.margin ?? 34;
  const w = p.w + m * 2;
  const h = p.h + m * 2;
  const [paint, flip] = painterFor(mod, p.id);
  const [[body, b], [lights, l]] = pair(w, h, w / 2, h / 2, flip);
  paint(b, l, p, S);
  const set = { body, lights, flash: white(body), w: p.w, h: p.h, m, seed: 31 + i * 17, crack: mod.crack ?? null, cracks: {} };
  const open = mod.opened?.[p.id];
  if (open) {
    const [[ob, obg], [ol, olg]] = pair(w, h, w / 2, h / 2, flip);
    open(obg, olg, p, S);
    set.open = { body: ob, lights: ol };
  }
  return set;
}

function bake(look, kind) {
  const mod = BOSS_ART[kind];
  const def = bossDef(kind);
  const pad = mod.pad ?? 60;
  const W = def.size.w + pad * 2;
  const H = def.size.h + pad * 2;
  const S = { def, pal: look.palette.boss, look, W, H, pad };
  const [[body, b], [lights, l]] = pair(W, H, W / 2, H / 2);
  mod.hull(b, l, S);
  const rage = (mod.rage ?? []).map((paint) => {
    if (!paint) return null;
    const [c, g] = layer(W, H, W / 2, H / 2);
    paint(g, S);
    return c;
  });
  const parts = {};
  def.parts.forEach((p, i) => {
    parts[p.id] = bakePart(mod, p, S, i);
  });
  return { mod, S, hull: { body, lights, flash: null, rage, x0: -W / 2, y0: -H / 2 }, parts };
}

export function bossArt(look, kind) {
  let a = cache.get(kind);
  if (!a) cache.set(kind, (a = bake(look, kind)));
  return a;
}

export const hullFlash = (B) => (B.hull.flash ??= white(B.hull.body));

export function warmBoss(look, kind) {
  if (!kind) return null;
  const B = bossArt(look, kind);
  for (const p of B.S.def.parts) {
    const set = B.parts[p.id];
    cracked(set, 1);
    cracked(set, 2);
    if (p.armor) exposed(set, look.palette.boss.weak); // a plate cracks open once no weak part is left
    wreck(set);
    if (set.open) wreck(set, true);
  }
  hullFlash(B);
  return B;
}
