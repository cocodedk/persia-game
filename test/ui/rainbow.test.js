import { test } from 'node:test';
import assert from 'node:assert/strict';
import { channels } from './dom-kit.js';

// The rainbow is a moonbow: seven pale bands of 8 px blocks, baked once as one sprite, drawn faint in
// the sky opposite the moon, clear of its disc and under the HUD band.
const baked = [];
const recorder = new Proxy({}, {
  get: (o, key) => (key in o ? o[key] : (...a) => { if (key === 'fillRect') baked.push([...a, o.fillStyle]); }),
});
globalThis.document = { createElement: () => ({ width: 1, height: 1, getContext: () => recorder }), addEventListener() {} };
const { drawRainbow, BLOCKS } = await import('../../src/ui/rainbow.js');
const { MOON } = await import('../../src/ui/sky-bodies.js');
const { W } = await import('../../src/ui/sprites.js');
const { HUD_BOTTOM } = await import('../../src/core/kinds.js');

const left = Math.min(...BLOCKS.map(([x]) => x));
const top = BLOCKS[0][1];

// What a frame draws: each drawImage as [x, y, the alpha it was drawn at, the image].
function frame(k, ...rest) {
  const calls = [];
  const ctx = new Proxy({}, {
    get: (o, key) => (key in o ? o[key] : (...a) => { if (key === 'drawImage') calls.push([...a.slice(1), o.globalAlpha, a[0]]); }),
  });
  drawRainbow(ctx, k, ...rest);
  return calls;
}

test('nothing is drawn while the weather has not begun to fade in', () => {
  assert.equal(frame(0).length, 0);
});

test('every block lies on the 8 px grid, inside the frame, outside the moon\'s disc and below the HUD band', () => {
  assert.ok(BLOCKS.length > 100, 'an arc of rows');
  for (const [x, y, w] of BLOCKS) {
    for (const v of [x, y, w]) assert.equal(v % 8, 0, `${x} ${y} ${w}`);
    assert.ok(x >= 0 && x + w <= W && w >= 8, `${x} ${w}`);
    assert.ok(y >= HUD_BOTTOM, `${y}`);
    const near = Math.hypot(Math.max(x - MOON.x, 0, MOON.x - (x + w)), Math.max(y - MOON.y, 0, MOON.y - (y + 8)));
    assert.ok(near > MOON.r, `${x} ${y} ${w}`);
  }
});

test('the bow rises from the right: its top lies right of the screen\'s middle and its feet reach the right side', () => {
  const [x, , w] = BLOCKS[0];
  assert.ok(x + w / 2 > W / 2 + 200, 'the apex is right of the landmark at the middle');
  assert.equal(Math.max(...BLOCKS.map(([bx, , bw]) => bx + bw)), W, 'and runs off the right edge');
});

test('it is seven bands, red outside to violet inside, one block each, in colours pulled toward white', () => {
  const [x, , w] = BLOCKS[0];
  const apex = x + w / 2; // the arc is symmetric about its middle: this column goes straight down through the bands
  const column = BLOCKS.filter(([bx, , bw]) => bx <= apex && apex < bx + bw);
  assert.equal(column.length, 7);
  column.forEach(([, y], i) => assert.equal(y, top + i * 8, `band ${i} one block below the last`));
  assert.equal(new Set(column.map((b) => b[3])).size, 7, 'seven colours');
  const [red, , , , , , violet] = column.map((b) => channels(b[3]));
  assert.ok(red[0] > red[1] && red[0] > red[2], 'red outside');
  assert.ok(violet[2] > violet[0] && violet[0] > violet[1], 'violet inside');
  assert.ok(column.every((b) => channels(b[3]).every((c) => c >= 0x90)), 'a moonbow is pale');
});

test('settled, one bake of the blocks is drawn at their top left, faint, and fades in with k', () => {
  const [[x, y, alpha, image]] = frame(1);
  assert.deepEqual([x, y], [left, top]);
  assert.ok(alpha > 0 && alpha <= 0.4, `alpha ${alpha}: faint, so the night stays night`);
  assert.equal(frame(0.5)[0][2], alpha / 2);
  assert.equal(image.width, Math.max(...BLOCKS.map(([bx, , bw]) => bx + bw)) - left);
  assert.equal(image.height, BLOCKS.at(-1)[1] + 8 - top);
  assert.deepEqual(baked.map(([bx, by, bw, bh, colour]) => [bx + left, by + top, bw, colour, bh]), BLOCKS.map((b) => [...b, 8]));
});

test('it is baked once, however often it is drawn', () => {
  assert.equal(frame(1)[0][3], frame(0.4)[0][3]);
  assert.equal(baked.length, BLOCKS.length);
});

test('the clock, half quality, reduced motion and the weather\'s age change nothing', () => {
  const strip = (calls) => calls.map((c) => c.slice(0, 3));
  assert.deepEqual(strip(frame(0.7, 40, 0.5, true, 12)), strip(frame(0.7, 0, 1, false, 0)));
});
