import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ofKind, react, run } from './fx-kit.js';
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

test('bulletTime sets the tint flag and flashes; it does not touch the global slow factor', () => {
  const on = react({ type: 'bulletTime', on: true, left: 2 });
  assert.equal(on.bulletTime, true);
  assert.equal(on.slow, 1);
  assert.ok(on.flashes.some((f) => f.full));
  const off = react({ type: 'bulletTime', on: false });
  assert.equal(off.bulletTime, false);
});
