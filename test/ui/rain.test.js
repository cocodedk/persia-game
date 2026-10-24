import { test } from 'node:test';
import assert from 'node:assert/strict';
import { drawRain } from '../../src/ui/rain.js';

// The rain thins out at half quality but never stops.

test('no streak is drawn while dry; at half quality half as many fall, never none', () => {
  const streaks = (k, quality, reduced) => {
    const calls = [];
    drawRain(new Proxy({}, { get: (o, key) => (key in o ? o[key] : () => calls.push(key)) }), k, 1, quality, reduced);
    return calls.filter((key) => key === 'lineTo').length;
  };
  assert.equal(streaks(0, 1, false), 0, 'dry');
  assert.equal(streaks(1, 1, false), 120);
  assert.equal(streaks(1, 0.5, false), 60);
  assert.equal(streaks(1, 0.5, true), 25, 'reduced motion and half quality');
});
