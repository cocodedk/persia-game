import { test } from 'node:test';
import assert from 'node:assert/strict';
import { channels } from './dom-kit.js';

// The rainbow is a moonbow drawn as a pixel game draws one: seven flat, full-coloured bands of 16 px
// blocks, baked once as one sprite, drawn nearly whole in the sky opposite the moon, clear of its disc
// and under the HUD band.
const baked = [];
const recorder = new Proxy({}, {
  get: (o, key) => (key in o ? o[key] : (...a) => { if (key === 'fillRect') baked.push([...a, o.fillStyle]); }),
});
globalThis.document = { createElement: () => ({ width: 1, height: 1, getContext: () => recorder }), addEventListener() {} };
const { drawRainbow } = await import('../../src/ui/rainbow.js');
const { MOON } = await import('../../src/ui/sky-bodies.js');
const { W } = await import('../../src/ui/sprites.js');
const { HUD_BOTTOM } = await import('../../src/core/kinds.js');

// What a frame draws: each drawImage as [x, y, the alpha it was drawn at, the image].
function frame(k) {
  const calls = [];
  const ctx = new Proxy({}, {
    get: (o, key) => (key in o ? o[key] : (...a) => { if (key === 'drawImage') calls.push([...a.slice(1), o.globalAlpha, a[0]]); }),
  });
  drawRainbow(ctx, k);
  return calls;
}

// The bow on screen: the first frame bakes it, and each block it painted lands at the bake's place
// as [x, y, w, h, colour].
const [[left, top]] = frame(1);
const BLOCKS = baked.map(([x, y, w, h, colour]) => [x + left, y + top, w, h, colour]);

test('nothing is drawn while the weather has not begun to fade in', () => {
  assert.equal(frame(0).length, 0);
});

test('every block is 16 px on the 8 px grid, inside the frame, outside the moon\'s disc and below the HUD band', () => {
  assert.ok(BLOCKS.length > 100, 'an arc of blocks');
  for (const [x, y, w, h] of BLOCKS) {
    assert.deepEqual([x % 8, y % 8, w, h], [0, 0, 16, 16], `${x} ${y}`);
    assert.ok(x >= 0 && x + w <= W, `${x}`);
    assert.ok(y >= HUD_BOTTOM, `${y}`);
    const near = Math.hypot(Math.max(x - MOON.x, 0, MOON.x - (x + w)), Math.max(y - MOON.y, 0, MOON.y - (y + h)));
    assert.ok(near > MOON.r, `${x} ${y}`);
  }
});

// The arc is symmetric about its top row's middle: the column there goes straight down through the bands.
const crest = BLOCKS.filter(([, y]) => y === top);
const apex = (crest[0][0] + crest.at(-1)[0] + 16) / 2;

test('the bow rises from the right: its top lies right of the screen\'s middle and its feet reach the right side', () => {
  assert.ok(apex > W / 2 + 200, 'the apex is right of the landmark at the middle');
  assert.equal(Math.max(...BLOCKS.map(([x, , w]) => x + w)), W, 'and runs off the right edge');
});

test('it is seven bands, red outside to violet inside, one 16 px block each, each a full colour', () => {
  const column = BLOCKS.filter(([x, , w]) => x <= apex && apex < x + w);
  assert.equal(column.length, 7);
  column.forEach(([, y], i) => assert.equal(y, top + i * 16, `band ${i} one block below the last`));
  const colours = column.map((b) => b[4]);
  assert.equal(new Set(colours).size, 7, 'seven colours');
  const [red, , , , , , violet] = colours.map(channels);
  assert.ok(red[0] > red[1] && red[0] > red[2], 'red outside');
  assert.ok(violet[2] > violet[0] && violet[0] > violet[1], 'violet inside');
  assert.ok(colours.every((c) => Math.max(...channels(c)) >= 0xe0 && Math.min(...channels(c)) <= 0x40), 'every band a full colour');
});

test('settled, one bake that holds every block is drawn nearly whole, and fades in with k', () => {
  const [[, , alpha, image]] = frame(1);
  assert.ok(alpha >= 0.7 && alpha < 1, `alpha ${alpha}: the colours stand out, the sky still a little behind them`);
  assert.equal(frame(0.5)[0][2], alpha / 2);
  for (const [x, y, w, h] of baked) assert.ok(x >= 0 && y >= 0 && x + w <= image.width && y + h <= image.height, `${x} ${y}`);
});

test('it is baked once, however often it is drawn', () => {
  const painted = baked.length;
  assert.equal(frame(1)[0][3], frame(0.4)[0][3]);
  assert.equal(baked.length, painted);
});
