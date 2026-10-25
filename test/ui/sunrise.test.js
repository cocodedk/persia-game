import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installCanvas, rectsOf, channels } from './dom-kit.js';

// Sunrise is level 8's dawn with the sun over it: a disc of 8 px blocks that climbs out from behind the
// far mountains over RISE seconds, clear of the moon, and stays; with reduced motion it stands from the start.
installCanvas();
const { drawSunrise } = await import('../../src/ui/sunrise.js');
const { drawDawn } = await import('../../src/ui/dawn.js');
const { MOON } = await import('../../src/ui/sky-bodies.js');
const { W } = await import('../../src/ui/sprites.js');

const dawn = (k) => rectsOf((ctx) => drawDawn(ctx, k));
// The sun's own rects: the frame less dawn's bands under it, which cross the whole width.
const sun = (k, age, reduced = false) => {
  const all = rectsOf((ctx) => drawSunrise(ctx, k, 0, 1, reduced, age));
  const bands = dawn(k).length;
  assert.deepEqual(all.slice(0, bands), dawn(k), 'dawn is drawn first, as it is alone');
  return all.slice(bands);
};
const top = (rects) => Math.min(...rects.map((r) => r.y));

test('nothing is drawn while the weather has not begun to fade in', () => {
  assert.equal(rectsOf((ctx) => drawSunrise(ctx, 0, 0, 1, false, 0)).length, 0);
});

test('every rect of the sun lies on the 8 px grid, narrower than the screen, and outside the moon\'s disc', () => {
  for (const age of [0, 17, 40, 60, 200]) {
    const rects = sun(1, age);
    assert.ok(rects.length > 20, 'a disc of rows');
    for (const { x, y, w, h } of rects) {
      for (const v of [x, y, w, h]) assert.equal(v % 8, 0, `age ${age}: ${x} ${y} ${w} ${h}`);
      assert.equal(h, 8, 'a row of blocks');
      assert.ok(w < W);
      const near = Math.hypot(Math.max(x - MOON.x, 0, MOON.x - (x + w)), Math.max(y - MOON.y, 0, MOON.y - (y + h)));
      assert.ok(near > MOON.r, `age ${age}: ${x} ${y} ${w}`);
    }
  }
});

test('the disc is 12 to 14 blocks in radius, right of the screen\'s middle, with a near-white core in a gold rim', () => {
  const rects = sun(1, 200).filter((r) => r.alpha === 1);
  const left = Math.min(...rects.map((r) => r.x));
  const right = Math.max(...rects.map((r) => r.x + r.w));
  const radius = (right - left) / 2 / 8;
  assert.ok(radius >= 12 && radius <= 14, `radius ${radius} blocks`);
  const centre = left + radius * 8;
  assert.ok(centre > W / 2 + 200, 'right of the landmark at the middle');
  const rim = rects.find((r) => r.y === top(rects));
  const core = rects.find((r) => r.y === top(rects) + radius * 8 && r.x < centre && r.x + r.w > centre);
  const [r, g, b] = channels(rim.colour);
  assert.ok(r > 0xe0 && r > g && g > b, 'gold on the rim: red, then green, then blue');
  assert.ok(channels(core.colour).every((c) => c > 0xe0), 'white at the core');
});

test('faint rings of gold lie round the disc, wider than it, at low alpha', () => {
  const rects = sun(1, 200);
  const rings = rects.filter((r) => r.alpha < 0.1);
  assert.ok(rings.length > 20 && rings.length < rects.length / 2);
  const wide = (list) => Math.max(...list.map((r) => r.w));
  assert.ok(wide(rings) > wide(rects.filter((r) => r.alpha === 1)));
});

test('it fades in with k: every alpha of the sun is k times its settled one', () => {
  const settled = sun(1, 200);
  const half = sun(0.5, 200);
  assert.equal(half.length, settled.length);
  half.forEach((r, i) => assert.equal(r.alpha, settled[i].alpha * 0.5));
});

test('with reduced motion the sun stands at its height from the start, at any age', () => {
  assert.deepEqual(sun(1, 0, true), sun(1, 45, true));
  assert.deepEqual(sun(1, 0, true), sun(1, 200));
});

test('without it the sun climbs a block at a time and stops: higher at a later age, the same once it has risen', () => {
  const tops = [0, 10, 20, 30, 40, 50, 60].map((age) => top(sun(1, age)));
  tops.slice(1).forEach((y, i) => assert.ok(y <= tops[i], `age ${(i + 1) * 10}`));
  assert.ok(tops[0] - tops.at(-1) >= 8 * 12, 'it climbs the disc\'s height or more');
  assert.ok(tops.some((y, i) => i && y < tops[i - 1]), 'and moves');
  assert.deepEqual(sun(1, 60), sun(1, 600), 'and then it stays');
  assert.equal(top(sun(1, 60)), top(sun(1, 200, true)));
});
