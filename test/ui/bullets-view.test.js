import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installCanvas } from './dom-kit.js';

// drawBullets against a recording context: which transform each sprite is drawn under, and the
// angle a star is turned by. Sprites are baked into stand-in canvases that swallow every call.
installCanvas();
const { drawBullets } = await import('../../src/ui/bullets-view.js');
const { LOOKS } = await import('../../src/ui/looks/index.js');

// stale: drawn while the transform still holds an earlier sprite's translate (it lands off its spot).
function recorder() {
  const log = [];
  let at = null; // where the last translate put the origin, null at the base transform
  let fresh = false;
  let angle = 0;
  const ctx = {
    globalAlpha: 1, globalCompositeOperation: 'source-over',
    getTransform: () => 'base',
    setTransform: () => { at = null; angle = 0; },
    translate: (x, y) => { at = { x, y }; fresh = true; },
    rotate: (a) => { angle = a; },
    drawImage: (img, x, y) => {
      log.push({ stale: at !== null && !fresh, x: at ? at.x : x, angle });
      fresh = false;
    },
  };
  return { ctx, log };
}

const star = (x, vx, vy) => ({ pattern: 'shuriken', x, y: 500, vx, vy, r: 18, life: 6 });
const orb = (x) => ({ pattern: 'aimed', x, y: 500, vx: 0, vy: 300, r: 8, life: 6 });
const seeker = (x) => ({ pattern: 'homing', x, y: 500, vx: 20, vy: 200, r: 10, life: 4 });
const drop = (x) => ({ pattern: 'rain', x, y: 500, vx: 0, vy: 400, r: 7, life: 6 });

test('a bullet drawn after a turned one is drawn where it is, not under the turned one\'s transform', () => {
  for (const look of LOOKS) {
    const { ctx, log } = recorder();
    drawBullets(ctx, { bullets: [star(100, 0, 200), orb(400), drop(700), seeker(1000), orb(1300)] }, look, 2, 0.5);
    assert.equal(log.length, 5, `w${look.world}`);
    assert.deepEqual(log.filter((d) => d.stale), [], `w${look.world}: every sprite at its own spot`);
  }
});

test('a star keeps its angle when a bullet before it in the list is removed', () => {
  const angleOf = (list) => {
    const { ctx, log } = recorder();
    drawBullets(ctx, { bullets: list }, LOOKS[3], 3.21, 0.5);
    return log.at(-1).angle;
  };
  const make = () => [star(100, 30, 160), orb(300), star(500, -60, 170)];
  assert.equal(angleOf(make().slice(1)), angleOf(make()));
  assert.equal(angleOf(make().slice(2)), angleOf(make()));
});
