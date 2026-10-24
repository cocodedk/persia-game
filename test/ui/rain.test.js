import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fadeRain, drawRain } from '../../src/ui/rain.js';

// The rain fades in over two seconds and out again, and draws nothing below full quality.

test('the rain fades in over 2 s once it begins, and out over 2 s if it stops', () => {
  const r = { k: 0, t: 10 };
  assert.equal(fadeRain(r, true, 11), 0.5);
  assert.equal(fadeRain(r, true, 13), 1);
  assert.equal(fadeRain(r, false, 14), 0.5);
  assert.equal(fadeRain(r, false, 20), 0);
});

test('no streak is drawn while dry or below full quality, and some are while raining', () => {
  const calls = [];
  const ctx = new Proxy({}, { get: (o, k) => (k in o ? o[k] : () => calls.push(k)), set: (o, k, v) => ((o[k] = v), true) });
  drawRain(ctx, 0, 1, 1, false);
  drawRain(ctx, 1, 1, 0.5, false);
  assert.deepEqual(calls, []);
  drawRain(ctx, 1, 1, 1, true);
  assert.ok(calls.filter((k) => k === 'lineTo').length > 0);
});
