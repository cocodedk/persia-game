import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installCanvas, rectsOf, channels } from './dom-kit.js';

// Dawn is flat bands across the sky under the red moon: on the sky's grid, rising from nothing to full
// strength at the foot and staying full to the bottom of the screen.
installCanvas();
const { drawDawn } = await import('../../src/ui/dawn.js');
const { MOON } = await import('../../src/ui/sky-bodies.js');
const { W, H, PIXEL } = await import('../../src/ui/sprites.js');

const frame = (k, ...rest) => rectsOf((ctx) => drawDawn(ctx, k, ...rest));

test('nothing is drawn while the weather has not begun to fade in', () => {
  assert.equal(frame(0).length, 0);
});

test('settled, the bands cover the screen\'s width on the 8 px grid, from just under the red moon to the bottom with no gap', () => {
  const rects = frame(1);
  assert.ok(rects.length > 2);
  for (const { x, w, y, h } of rects) {
    assert.deepEqual([x, w], [0, W], 'across the whole width');
    assert.equal(y % 8, 0, `y ${y}`);
    assert.equal(h % PIXEL, 0, `h ${h}`);
    assert.equal(h % 8, 0, `h ${h}`);
  }
  assert.ok(rects[0].y >= MOON.y + MOON.r, 'the moon\'s disc is never covered');
  assert.ok(rects[0].y - (MOON.y + MOON.r) < PIXEL, 'and the first band starts as close as the grid allows');
  rects.slice(1).forEach(({ y }, i) => assert.equal(y, rects[i].y + rects[i].h, 'each band starts where the one above ends'));
  const last = rects.at(-1);
  assert.equal(last.y + last.h, H);
});

test('the alpha is 0 at the top, rises to full at the foot, and stays full to the bottom of the screen', () => {
  const rects = frame(1);
  const alphas = rects.map((r) => r.alpha);
  assert.equal(alphas[0], 0);
  alphas.slice(1).forEach((a, i) => assert.ok(a > alphas[i], `band ${i + 1} is stronger than the one above`));
  const foot = rects.at(-1);
  assert.equal(foot.alpha, 1);
  assert.ok(rects.slice(0, -1).every((r) => r.alpha < 1), 'full strength starts at the foot');
  assert.ok(foot.y > 600 && foot.h > 100, 'a long, full strip under the ramp');
});

test('it fades in with k: every band\'s alpha is k times its settled one', () => {
  const settled = frame(1);
  const half = frame(0.5);
  assert.equal(half.length, settled.length);
  half.forEach((r, i) => assert.equal(r.alpha, settled[i].alpha * 0.5));
});

test('the colours warm from violet through rose to amber at the horizon', () => {
  const [top, bottom] = [frame(1).at(0), frame(1).at(-1)].map((r) => channels(r.colour));
  assert.ok(top[2] > top[1] && top[2] > 0x40, 'violet at the top: blue over green');
  assert.ok(bottom[0] > 0xe0 && bottom[0] > bottom[1] && bottom[1] > bottom[2], 'amber at the foot: red, then green, then blue');
  const rose = frame(1).map((r) => channels(r.colour)).find(([r, g, b]) => r > 0xc0 && b > g && b > 0x60);
  assert.ok(rose, 'a rose between: red high, blue over green');
});
