import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fadeRain, drawRain } from '../../src/ui/rain.js';

// The rain fades in over two seconds, and draws nothing below full quality.

test('the rain fades in over 2 s once it begins, from the first frame too', () => {
  assert.equal(fadeRain({ k: 0, t: null }, true, 500), 0, 'a world that rains from its start fades in too');
  const r = { k: 0, t: null };
  assert.equal(fadeRain(r, false, 10), 0, 'dry');
  assert.equal(fadeRain(r, true, 11), 0.5);
  assert.equal(fadeRain(r, true, 13), 1);
});

test('no streak is drawn while dry or below full quality, and some are while raining', () => {
  const calls = [];
  const ctx = new Proxy({}, { get: (o, k) => (k in o ? o[k] : () => calls.push(k)) });
  drawRain(ctx, 0, 1, 1, false);
  drawRain(ctx, 1, 1, 0.5, false);
  assert.deepEqual(calls, []);
  drawRain(ctx, 1, 1, 1, true);
  assert.ok(calls.filter((k) => k === 'lineTo').length > 0);
});
