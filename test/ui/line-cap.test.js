import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installCanvas, sink } from './dom-kit.js';

// The round-capped strokes of the sky (W7 tracers, W8 lensed stars and photon ring) must leave the
// context's lineCap as they found it, or later strokes (the HUD's power ring) inherit round caps.
installCanvas();
const { FLOURISH2 } = await import('../../src/ui/flourish-2.js');
const { AMBIENT2 } = await import('../../src/ui/ambient-2.js');

const context = () => new Proxy({ lineCap: 'butt' }, {
  get: (o, k) => (k in o ? o[k] : () => sink),
  set: (o, k, v) => ((o[k] = v), true),
});
const level = { world: 8, index: 1, waves: [] };

test('the sky\'s round-capped strokes leave lineCap at butt', () => {
  const world = { well: { x: 960, y: 300 }, level };
  const runs = {
    tracers: (ctx) => FLOURISH2.tracers.sky(ctx, { t: 0.2, world }),
    lens: (ctx) => FLOURISH2.lens.near(ctx, { t: 1, world }),
    lensed: (ctx) => AMBIENT2.lensed(ctx, { n: 20, speed: 1, size: [1, 3], alpha: 0.5, colors: ['#ffffff'] }, 1, 0, 0, world),
  };
  for (const [name, run] of Object.entries(runs)) {
    const ctx = context();
    run(ctx);
    assert.equal(ctx.lineCap, 'butt', name);
  }
});
