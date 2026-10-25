import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installCanvas } from './dom-kit.js';

// The white moon is drawn over the red one's centre: a halo, then one sprite that swells with the fade.
installCanvas();
const { drawMoon } = await import('../../src/ui/moon.js');
const { MOON } = await import('../../src/ui/sky-bodies.js');

// What a frame draws: each drawImage as [x, y, w, h, the alpha it was drawn at, the image].
function frame(k, { t = 3, quality = 1, reduced = false } = {}) {
  const calls = [];
  const ctx = new Proxy({}, {
    get: (o, key) => (key in o ? o[key] : (...a) => { if (key === 'drawImage') calls.push([...a.slice(1), o.globalAlpha, a[0]]); }),
  });
  drawMoon(ctx, k, t, quality, reduced);
  return calls;
}
const disc = (calls) => calls.at(-1);

test('nothing is drawn while the weather has not begun to fade in', () => {
  assert.equal(frame(0).length, 0);
});

test('settled, a halo and a disc are drawn, both centred on the red moon, the disc on whole blocks', () => {
  const calls = frame(1);
  assert.equal(calls.length, 2);
  for (const [x, y, w, h] of calls) {
    assert.equal(x + w / 2, MOON.x);
    assert.equal(y + h / 2, MOON.y);
  }
  const [x, y, w, h, alpha] = disc(calls);
  assert.ok(w > 2 * MOON.r && w === h, 'a square larger than the red moon');
  assert.equal(w % 8, 0, 'a whole number of 2-block steps');
  assert.deepEqual([x % 8, y % 8], [0, 0], 'its blocks sit on the sky grid');
  assert.equal(alpha, 1);
  assert.ok(calls[0][4] > 0 && calls[0][4] <= 1, 'the halo has its own alpha');
});

test('the disc is one sprite baked once, however often it is drawn', () => {
  assert.equal(disc(frame(1))[5], disc(frame(0.4))[5]);
});

test('it fades in at alpha k and swells from the red moon\'s size to its own; reduced motion only brightens', () => {
  const size = (k, reduced) => disc(frame(k, { reduced }))[2];
  assert.equal(disc(frame(0.5))[4], 0.5);
  assert.equal(size(1, true), size(1, false), 'the same size once settled');
  assert.ok(size(0.5, false) < size(1, false), 'smaller half way');
  assert.ok(size(0.01, false) > 2 * MOON.r, 'but about the red moon\'s, never smaller');
  assert.ok(size(0.2, false) < size(0.5, false), 'and it keeps growing');
  assert.equal(size(0.5, true), size(1, true), 'no swell under reduced motion');
  assert.equal(disc(frame(0.5, { reduced: true }))[4], 0.5, 'but it still brightens');
});

test('half quality and the clock change nothing', () => {
  const strip = (calls) => calls.map((c) => c.slice(0, 5));
  assert.deepEqual(strip(frame(0.7, { quality: 0.5 })), strip(frame(0.7)));
  assert.deepEqual(strip(frame(1, { t: 40 })), strip(frame(1)));
});
