import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installCanvas, sink } from './dom-kit.js';

// drawAmbient against a context that records the alpha of every sprite and the size of every star it
// draws: the CRT overlay covers the whole frame, so auto-quality drops it below level 1.
installCanvas();
const { drawAmbient } = await import('../../src/ui/ambient.js');
const { LOOK } = await import('../../src/ui/looks/index.js');

function frame(phase, quality) {
  const sprites = [];
  let rects = 0;
  const ctx = new Proxy({ globalAlpha: 1, globalCompositeOperation: 'source-over' }, {
    get: (o, k) => {
      if (k in o) return o[k];
      if (k === 'drawImage') return () => sprites.push(o.globalAlpha);
      if (k === 'fillRect') return () => { rects += 1; };
      return () => sink;
    },
    set: (o, k, v) => ((o[k] = v), true),
  });
  drawAmbient(ctx, LOOK, phase, 1.3, quality);
  return { sprites, rects, ctx };
}

test('at full quality the CRT overlay and its rolling band are drawn, then the context is reset', () => {
  const { sprites, ctx } = frame('screen', 1);
  assert.equal(sprites.length, 2, 'the baked tube and the band');
  assert.equal(sprites[0], LOOK.ambient.find((a) => a.kind === 'scanlines').alpha);
  assert.equal(ctx.globalAlpha, 1);
  assert.equal(ctx.globalCompositeOperation, 'source-over');
});

test('at half quality the CRT overlay is skipped altogether', () => {
  const { sprites, ctx } = frame('screen', 0.5);
  assert.deepEqual(sprites, []);
  assert.equal(ctx.globalAlpha, 1);
  assert.equal(ctx.globalCompositeOperation, 'source-over');
});

test('the stars over the sky are drawn at either quality', () => {
  const n = LOOK.ambient.find((a) => a.kind === 'twinkle').n;
  assert.equal(frame('sky', 1).rects, n);
  assert.equal(frame('sky', 0.5).rects, n);
});
