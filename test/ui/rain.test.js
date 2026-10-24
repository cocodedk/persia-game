import { test } from 'node:test';
import assert from 'node:assert/strict';
import { drawRain } from '../../src/ui/rain.js';
import { counting } from './dom-kit.js';

// The rain thins out at half quality but never stops.

test('no streak is drawn while dry; at half quality half as many fall, never none', () => {
  const streaks = (k, quality, reduced) => {
    const { ctx, count } = counting('lineTo');
    drawRain(ctx, k, 1, quality, reduced);
    return count();
  };
  assert.equal(streaks(0, 1, false), 0, 'dry');
  assert.equal(streaks(1, 1, false), 120);
  assert.equal(streaks(1, 0.5, false), 60);
  assert.equal(streaks(1, 0.5, true), 25, 'reduced motion and half quality');
});
