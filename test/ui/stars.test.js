import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installCanvas, counting } from './dom-kit.js';

// The stars thin out at half quality but never stop, and none are drawn before the weather has begun.
installCanvas();
const { drawStars } = await import('../../src/ui/stars.js');

// The stars (one tail each) a frame draws at time t.
function stars(k, t, quality, reduced) {
  const { ctx, count } = counting('moveTo');
  drawStars(ctx, k, t, quality, reduced);
  return count();
}

// What a quality draws across a minute of frames: the most at once, and every star seen.
function minute(quality, reduced) {
  let most = 0;
  let total = 0;
  for (let t = 0; t < 60; t += 0.1) {
    const n = stars(1, t, quality, reduced);
    most = Math.max(most, n);
    total += n;
  }
  return { most, total };
}

test('no star is drawn while the weather has not begun to fade in', () => {
  for (let t = 0; t < 10; t += 0.5) assert.equal(stars(0, t, 1, false), 0);
});

test('many fall at once at full quality; at half quality about half as many, never none', () => {
  const full = minute(1, false);
  const half = minute(0.5, false);
  assert.ok(full.most >= 6, `${full.most} at once`);
  assert.ok(half.total > 0.35 * full.total && half.total < 0.65 * full.total, `${half.total} of ${full.total}`);
});

test('reduced motion has fewer stars, and half quality on top of it still shows some', () => {
  const full = minute(1, false);
  const reduced = minute(1, true);
  assert.ok(reduced.total > 0 && reduced.total < 0.5 * full.total, `${reduced.total} of ${full.total}`);
  assert.ok(minute(0.5, true).total > 0);
});
