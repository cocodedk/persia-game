import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installCanvas } from './dom-kit.js';

// drawBullets against a recording context: which transform each sprite is drawn under. Sprites are
// baked into stand-in canvases that swallow every call.
installCanvas();
const { drawBullets } = await import('../../src/ui/bullets-view.js');
const { LOOK } = await import('../../src/ui/looks/index.js');

// stale: drawn while the transform still holds an earlier sprite's translate (it lands off its spot).
function recorder() {
  const log = [];
  let at = null; // where the last translate put the origin, null at the base transform
  let fresh = false;
  const ctx = {
    globalAlpha: 1, globalCompositeOperation: 'source-over',
    getTransform: () => 'base',
    setTransform: () => { at = null; },
    translate: (x, y) => { at = { x, y }; fresh = true; },
    rotate: () => {},
    drawImage: (img, x, y) => {
      log.push({ stale: at !== null && !fresh, x: at ? at.x : x });
      fresh = false;
    },
  };
  return { ctx, log };
}

const orb = (x) => ({ pattern: 'aimed', x, y: 500, vx: 0, vy: 300, r: 8, life: 6 });
const seeker = (x) => ({ pattern: 'homing', x, y: 500, vx: 20, vy: 200, r: 10, life: 4 });
const drop = (x) => ({ pattern: 'rain', x, y: 500, vx: 40, vy: 400, r: 7, life: 6 });

test('a bullet drawn after a turned one is drawn where it is, not under the turned one\'s transform', () => {
  const { ctx, log } = recorder();
  drawBullets(ctx, { bullets: [drop(100), orb(400), drop(700), seeker(1000), orb(1300)] }, LOOK, 2, 0.5);
  assert.equal(log.length, 5);
  assert.deepEqual(log.filter((d) => d.stale), [], 'every sprite at its own spot');
});
