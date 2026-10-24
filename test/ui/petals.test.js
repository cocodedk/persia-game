import { test } from 'node:test';
import assert from 'node:assert/strict';
import { drawPetals } from '../../src/ui/petals.js';
import { W, H } from '../../src/ui/sprites.js';

// The petals are small, soft and slow, drawn in a few batches, and thin out at half quality but never stop.

// What a frame draws: every call to the context, in order, as [name, args, the alpha it was drawn at].
function frame(k, t, quality, reduced) {
  const calls = [];
  const ctx = new Proxy({}, { get: (o, key) => (key in o ? o[key] : (...args) => calls.push([key, args, o.globalAlpha])) });
  drawPetals(ctx, k, t, quality, reduced);
  return calls;
}
const ovals = (calls) => calls.filter(([name]) => name === 'ellipse');

test('no petal is drawn while the weather has not begun; at half quality half as many fall, never none', () => {
  const petals = (k, quality, reduced) => ovals(frame(k, 1, quality, reduced)).length;
  assert.equal(petals(0, 1, false), 0, 'not begun');
  assert.equal(petals(1, 1, false), 70);
  assert.equal(petals(1, 0.5, false), 35);
  assert.equal(petals(1, 1, true), 30, 'reduced motion');
  assert.equal(petals(1, 0.5, true), 15, 'reduced motion and half quality');
});

test('they are batched, one fill per tone, and each oval starts its own piece of the path', () => {
  const calls = frame(1, 3, 1, false);
  assert.equal(calls.filter(([name]) => name === 'fill').length, 4);
  calls.forEach(([name, [x, y, rx, , rot]], i) => {
    if (name !== 'ellipse') return;
    const [prev, [px, py]] = calls[i - 1];
    assert.equal(prev, 'moveTo');
    assert.ok(Math.hypot(px - (x + rx * Math.cos(rot)), py - (y + rx * Math.sin(rot))) < 1e-9, "at the oval's own start");
  });
});

test('every petal is a few pixels, sits in or at the edge of the frame and is see-through, so a bullet shows', () => {
  for (let t = 0; t < 60; t += 3.7) {
    for (const [, [x, y, long, wide], alpha] of ovals(frame(1, t, 1, false))) {
      assert.ok(long <= 12 && wide > 0 && wide < long, `${long} x ${wide}`);
      assert.ok(x > -120 && x < W + 120 && y >= -20 && y <= H + 20, `${x}, ${y}`);
      assert.ok(alpha > 0 && alpha <= 0.7, `${alpha}`);
    }
  }
});

test('they drift down slowly, and tumble: the same petal changes width as it turns', () => {
  const before = ovals(frame(1, 10, 1, false));
  const after = ovals(frame(1, 10.1, 1, false));
  const fell = before.map(([, [, y]], i) => after[i][1][1] - y);
  assert.ok(fell.every((dy) => dy > 0 && dy < 20), `${Math.min(...fell)} to ${Math.max(...fell)} px in a tenth of a second`);
  assert.ok(before.every(([, [, , , wide]], i) => Math.abs(after[i][1][3] - wide) > 1e-6), 'every petal turns');
});

test('reduced motion falls slower than full motion', () => {
  const fall = (reduced) => ovals(frame(1, 10.1, 1, reduced))[0][1][1] - ovals(frame(1, 10, 1, reduced))[0][1][1];
  assert.ok(fall(true) > 0 && fall(true) < 0.6 * fall(false));
});
