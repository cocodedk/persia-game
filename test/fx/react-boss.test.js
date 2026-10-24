import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kindsOf, ofKind, react, run } from './fx-kit.js';

test('bossWarn: a charge glow on the firing part that builds until the shot, plus a closing ring', () => {
  const fx = react({ type: 'bossWarn', kind: 'giant', part: 'eyeL', pattern: 'aimed', x: 700, y: 250, warn: 0.7 });
  const glow = fx.flashes[0];
  assert.deepEqual([glow.x, glow.y, glow.ramp], [700, 250, 1]);
  assert.equal(glow.max, 0.7);
  const ring = fx.rings[0];
  assert.ok(ring.r0 > ring.maxR, 'the ring closes in on the part');
  assert.equal(ring.max, 0.7);
  run(fx, 0.8);
  assert.equal(fx.flashes.length + fx.rings.length, 0);
});

test('bossPhase: a white-out blink, a wide shockwave, sparks, smoke and a shake', () => {
  const fx = react({ type: 'bossPhase', kind: 'giant', phase: 1, x: 960, y: 250, hp: 40, open: [] });
  assert.ok(fx.flashes.some((f) => f.full));
  assert.ok(fx.rings[0].maxR > 500);
  assert.ok(fx.shake >= 15);
  for (const k of ['spark', 'smoke']) assert.ok(kindsOf(fx).has(k), k);
});

test('bossExpose: a crack burst on each plate that opened, at the plate when the world knows it', () => {
  const world = { boss: { parts: [{ id: 'pawL', x: 600, y: 220 }, { id: 'pawR', x: 1300, y: 220 }, { id: 'mouth', x: 960, y: 300 }] } };
  const ev = { type: 'bossExpose', kind: 'giant', parts: ['pawL', 'pawR'], x: 960, y: 260 };
  const fx = react(ev, world);
  assert.equal(fx.rings.length, 2);
  assert.deepEqual(fx.rings.map((r) => r.x).toSorted((a, b) => a - b), [600, 1300]);
  assert.ok(ofKind(fx, 'spark').length > 0);
  assert.ok(fx.shake > 0);
  const blind = react(ev);
  assert.ok(blind.rings.length >= 1 && blind.rings.every((r) => r.x === 960), 'without a world it bursts at the boss centre');
  const bare = react({ type: 'bossExpose', kind: 'giant', x: 960, y: 260 }, world);
  assert.equal(bare.rings[0].x, 960, 'an event without a parts list bursts at the boss centre');
});

test('partDown: wreckage flies off the part', () => {
  const fx = react({ type: 'partDown', kind: 'giant', part: 'eyeL', x: 800, y: 260, weak: true });
  assert.ok(ofKind(fx, 'debris').length >= 6);
});

test('bossDeath: slow motion, a long white-out, a huge pop-up with the boss score, big shake', () => {
  const fx = react({ type: 'bossDeath', kind: 'giant', x: 960, y: 280, score: 10000 });
  assert.equal(fx.slow, 0.3);
  const white = fx.flashes.find((f) => f.full && f.tag === 'whiteout');
  assert.ok(white && white.alpha >= 0.9 && white.max >= 0.8);
  assert.equal(fx.popups[0].text, '+10000');
  assert.ok(fx.popups[0].scale >= 2.5);
  assert.ok(fx.shake >= 25);
});
