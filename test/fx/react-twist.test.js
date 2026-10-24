import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kindsOf, ofKind, react, run } from './fx-kit.js';
import { flashK } from '../../src/fx/fx.js';

const world = { ship: { x: 800, y: 900 } };

test('pickup: a ring and sparks in the power-up colour, and its name floats up', () => {
  const fx = react({ type: 'pickup', kind: 'spread', x: 500, y: 700, points: 500 });
  assert.equal(fx.rings.length, 1);
  assert.ok(fx.particles.length > 0);
  assert.equal(fx.popups[0].text, 'SPREAD');
  const bomb = react({ type: 'pickup', kind: 'bomb', x: 500, y: 700, points: 500 });
  assert.equal(bomb.popups[0].text, '+1 BOMB');
  assert.notEqual(bomb.rings[0].color, fx.rings[0].color);
});

test('a caught pickup also pops its points, above its name', () => {
  const fx = react({ type: 'pickup', kind: 'laser', x: 500, y: 700, points: 500 });
  const [name, points] = ['LASER', '+500'].map((t) => fx.popups.find((p) => p.text === t));
  assert.ok(name && points, fx.popups.map((p) => p.text).join());
  assert.ok(name.y - points.y >= 40, 'the two do not overlap');
});

// R51: swept up at the clear, a pickup streaks from where it was into the ship and its +500 pops up.
test('a swept-up pickup streaks into the ship and pops +500 where it was, with no name or ring', () => {
  const ev = { type: 'sweep', kind: 'spread', x: 300, y: 200, points: 500, nth: 0 };
  const fx = react(ev, world);
  assert.deepEqual(fx.popups.map((p) => [p.text, p.x]), [['+500', 300]]);
  assert.equal(fx.rings.length, 0);
  assert.ok(fx.particles.length >= 3, 'a head and a tail');
  for (const p of fx.particles) {
    assert.ok(Math.hypot(p.x + p.vx * p.life - 800, p.y + p.vy * p.life - 900) < 1, 'each lands on the ship');
    assert.equal(p.gravity + p.drag, 0, 'on a straight line');
  }
  assert.ok(fx.flashes.some((f) => f.ramp && f.x === 800 && f.y === 900), 'the ship glows as it arrives');
  run(fx, 1);
  assert.equal(fx.particles.length, 0, 'gone once it has landed');
  assert.doesNotThrow(() => react(ev), 'no world, no crash');
});

// R52: the clear's whole sweep, in one tick's events.
const swept = (n) => Array.from({ length: n }, (_, i) => ({ type: 'sweep', kind: 'laser', x: 200 + 150 * i, y: 300, points: 500, nth: i }));
const glows = (fx) => fx.flashes.filter((f) => f.x === 800 && f.y === 900);

test('a sweep gives the ship one glow, a little stronger for each pickup, that fades out once they land', () => {
  const [one] = glows(react(swept(1), world));
  const many = glows(react(swept(6), world));
  assert.equal(many.length, 1, 'one glow, not one per pickup');
  assert.ok(many[0].alpha > one.alpha && many[0].r > one.r, 'stronger for more pickups');
  const [most] = glows(react(swept(30), world));
  assert.deepEqual([most.alpha, most.r], [1, 1.5 * one.r], 'up to a cap');
  const at = (s) => {
    const fx = react(swept(6), world);
    run(fx, s);
    return glows(fx).map(flashK)[0] ?? 0;
  };
  assert.ok(at(0.45) > at(0.2), 'it brightens as they fly in');
  assert.ok(at(0.7) > 0 && at(0.7) < at(0.5), 'then fades once they have landed, instead of cutting off');
  assert.equal(at(1.5), 0, 'and is gone');
});

test('a swept pickup\'s +500 keeps clear of the "+N BONUS" row; away from it, it pops where the pickup was', () => {
  const fx = react([
    { type: 'sweep', kind: 'laser', x: 960, y: 530, points: 500, nth: 0 }, // its +500 would land on the bonus
    { type: 'sweep', kind: 'bomb', x: 1150, y: 480, points: 500, nth: 1 },
    { type: 'sweep', kind: 'rapid', x: 400, y: 224, points: 500, nth: 2 },
    { type: 'cleared', score: 9000, bonus: 5000, stars: 3 },
  ], world);
  const bonus = fx.popups.find((p) => p.text.endsWith('BONUS'));
  const points = fx.popups.filter((p) => p.text === '+500');
  assert.equal(points.length, 3);
  for (const p of points.slice(0, 2)) {
    assert.ok(Math.abs(p.y - bonus.y) >= 60, `+500 at ${p.y}, the bonus at ${bonus.y}`); // clear even as both pop in
    assert.equal(p.vy, bonus.vy, 'they rise together, so it stays clear');
  }
  assert.equal(points[2].y, 200, 'away from the row it stays where it was');
});

test('power on: a ring leaves the ship; off: it fizzles into smoke; no world, no crash', () => {
  const on = react({ type: 'power', kind: 'shield', on: true }, world);
  assert.deepEqual([on.rings[0].x, on.rings[0].y], [800, 900]);
  const off = react({ type: 'power', kind: 'shield', on: false }, world);
  assert.ok(ofKind(off, 'smoke').length > 0);
  assert.doesNotThrow(() => react({ type: 'power', kind: 'rapid', on: true }));
});

test('lightning: a bright full-screen flash scaled by its strength', () => {
  const weak = react({ type: 'lightning', x: 700, strength: 0.6 });
  const strong = react({ type: 'lightning', x: 700, strength: 1 });
  assert.ok(weak.flashes[0].full && weak.flashes[0].tag === 'lightning');
  assert.ok(strong.flashes[0].alpha > weak.flashes[0].alpha);
});

test('teleport: glitch slices and a flash at both the old and the new slot', () => {
  const fx = react({ type: 'teleport', id: 4, fromX: 300, fromY: 200, x: 900, y: 240 });
  assert.ok(fx.slices.length >= 4);
  assert.ok(fx.slices.some((s) => s.x < 400) && fx.slices.some((s) => s.x > 800));
  assert.ok(fx.slices.every((s) => s.w > 0 && s.h > 0 && s.dx !== 0));
  assert.equal(fx.flashes.length, 2);
  run(fx, 0.6);
  assert.equal(fx.slices.length, 0);
});

test('absorb: an inward lensing ring', () => {
  const fx = react({ type: 'absorb', x: 960, y: 300 });
  assert.equal(fx.rings[0].kind, 'lens');
  assert.ok(fx.rings[0].r0 > fx.rings[0].maxR);
});

test('saucer: a glint at the edge it enters from', () => {
  const left = react({ type: 'saucer', x: -60, y: 70, dir: 1 });
  const right = react({ type: 'saucer', x: 1980, y: 70, dir: -1 });
  assert.ok(left.flashes[0].x < 200 && right.flashes[0].x > 1700);
});

test('gust: sand streaks that fly the way the wind blows; a dead calm does nothing', () => {
  const east = react({ type: 'gust', wind: 300 });
  const west = react({ type: 'gust', wind: -300 });
  assert.ok(east.particles.length > 0 && east.particles.every((p) => p.vx > 0 && p.x < 100));
  assert.ok(west.particles.every((p) => p.vx < 0 && p.x > 1800));
  assert.equal(react({ type: 'gust', wind: 0 }).particles.length, 0);
});

test('acid: green drops fall from the spot', () => {
  const fx = react({ type: 'acid', x: 400, y: 300 });
  const drops = ofKind(fx, 'acid');
  assert.ok(drops.length >= 3 && drops.every((p) => p.gravity > 0));
});

test('wreck, wreckDown and reassemble each have a look of their own', () => {
  const wreck = react({ type: 'wreck', x: 500, y: 300 });
  const down = react({ type: 'wreckDown', x: 500, y: 300 });
  const back = react({ type: 'reassemble', id: 2, x: 500, y: 300 });
  assert.ok(kindsOf(wreck).has('smoke') && kindsOf(wreck).has('ember'));
  assert.ok(ofKind(down, 'debris').length > 0 && down.flashes.length > 0);
  assert.ok(back.rings[0].r0 > back.rings[0].maxR, 'the pieces draw together');
  const converge = back.particles.filter((p) => Math.hypot(p.x - 500, p.y - 300) > 20);
  assert.ok(converge.length > 0);
  for (const p of converge) {
    const inward = (500 - p.x) * p.vx + (300 - p.y) * p.vy;
    assert.ok(inward > 0, 'each piece flies toward the spot');
  }
});

test('bulletTime sets the tint flag and flashes; it does not touch the global slow factor', () => {
  const on = react({ type: 'bulletTime', on: true, left: 2 });
  assert.equal(on.bulletTime, true);
  assert.equal(on.slow, 1);
  assert.ok(on.flashes.some((f) => f.full));
  const off = react({ type: 'bulletTime', on: false });
  assert.equal(off.bulletTime, false);
});

test('cut and bunker: a slash flash, and dust or sparks off the cover', () => {
  const cut = react({ type: 'cut', x: 600, y: 400 });
  assert.ok(cut.flashes.length === 1 && ofKind(cut, 'spark').length > 0);
  const dust = react({ type: 'bunker', x: 600, y: 700 });
  const beam = react({ type: 'bunker', x: 600, y: 700, laser: true });
  assert.ok(ofKind(dust, 'dust').length > 0);
  assert.ok(ofKind(beam, 'spark').length > 0);
});
