import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addFlash, addPopup, addRing, addSlice, createFx, startSlowMo, stepFx } from '../../src/fx/fx.js';
import { addShake } from '../../src/fx/camera.js';
import { addParticle } from '../../src/fx/particles.js';
import { TICK, run } from './fx-kit.js';

test('a fresh fx holds every list and number the renderer reads', () => {
  const fx = createFx();
  for (const k of ['particles', 'rings', 'flashes', 'popups', 'slices']) assert.deepEqual(fx[k], [], k);
  assert.equal(fx.shake, 0);
  assert.equal(fx.shakeX, 0);
  assert.equal(fx.shakeY, 0);
  assert.equal(fx.slow, 1);
  assert.equal(fx.bulletTime, false);
  assert.equal(fx.density, 1);
});

test('shockwave expands then expires; inward rings (r0 > maxR) contract', () => {
  const fx = createFx();
  addRing(fx, { x: 5, y: 6, maxR: 100, life: 0.5 });
  addRing(fx, { x: 5, y: 6, r0: 80, maxR: 10, life: 0.5, kind: 'lens' });
  assert.deepEqual([fx.rings[0].r, fx.rings[1].r], [0, 80]);
  run(fx, 0.2);
  assert.ok(fx.rings[0].r > 0 && fx.rings[0].r < 100);
  assert.ok(fx.rings[1].r < 80 && fx.rings[1].r > 10);
  run(fx, 1);
  assert.equal(fx.rings.length, 0);
});

test('flashes, pop-ups and slices carry defaults, fade and expire', () => {
  const fx = createFx();
  addFlash(fx, { x: 1, y: 2, r: 50, life: 0.1 });
  addPopup(fx, { x: 10, y: 100, text: '+100', life: 0.5 });
  addSlice(fx, { x: 0, y: 0, w: 40, h: 5, dx: 10, life: 0.2 });
  const [f] = fx.flashes;
  assert.deepEqual([f.max, f.alpha, f.full, f.ramp], [0.1, 1, false, 0]);
  assert.equal(fx.popups[0].max, 0.5);
  assert.equal(fx.slices[0].max, 0.2);
  run(fx, 0.25);
  assert.equal(fx.flashes.length, 0);
  assert.equal(fx.slices.length, 0);
  assert.ok(fx.popups[0].y < 100, 'a pop-up floats up');
  run(fx, 0.5);
  assert.equal(fx.popups.length, 0);
});

test('the effect lists are capped, the oldest dropped', () => {
  const fx = createFx();
  for (let i = 0; i < 500; i++) {
    addFlash(fx, { x: i, life: 5 });
    addRing(fx, { x: i, life: 5 });
    addPopup(fx, { x: i, life: 5 });
    addSlice(fx, { x: i, life: 5 });
  }
  for (const k of ['flashes', 'rings', 'popups', 'slices']) {
    assert.ok(fx[k].length > 0 && fx[k].length <= 64, `${k} ${fx[k].length}`);
    assert.equal(fx[k][fx[k].length - 1].x, 499, `${k} keeps the newest`);
  }
});

test('shake decays to exactly 0 and the offset follows', () => {
  const fx = createFx();
  addShake(fx, 20);
  stepFx(fx, TICK);
  assert.ok(fx.shake > 0 && fx.shake < 20);
  assert.ok(Math.abs(fx.shakeX) + Math.abs(fx.shakeY) > 0);
  run(fx, 3);
  assert.equal(fx.shake, 0);
  assert.equal(fx.shakeX, 0);
  assert.equal(fx.shakeY, 0);
});

test('addShake keeps the larger amount and clamps a runaway one', () => {
  const fx = createFx();
  addShake(fx, 12);
  addShake(fx, 5);
  assert.equal(fx.shake, 12);
  addShake(fx, 9999);
  assert.ok(fx.shake <= 40 && fx.shake > 12);
});

test('slow motion: 0.3x for 0.8 real seconds, then back to 1', () => {
  const fx = createFx();
  startSlowMo(fx);
  assert.equal(fx.slow, 0.3);
  run(fx, 0.7);
  assert.equal(fx.slow, 0.3);
  run(fx, 0.2);
  assert.equal(fx.slow, 1);
  assert.equal(fx.slowLeft, 0);
});

test('slow motion slows particles, rings and pop-ups but not the shake decay', () => {
  const slow = createFx();
  const fast = createFx();
  for (const fx of [slow, fast]) {
    addParticle(fx, { vx: 100, life: 5 });
    addShake(fx, 20);
  }
  startSlowMo(slow);
  run(slow, 0.3);
  run(fast, 0.3);
  assert.ok(Math.abs(slow.particles[0].x - fast.particles[0].x * 0.3) < 1, `${slow.particles[0].x}`);
  assert.ok(Math.abs(slow.shake - fast.shake) < 1e-9, 'shake runs on real time');
});

test('startSlowMo restarts a running slow motion', () => {
  const fx = createFx();
  startSlowMo(fx);
  run(fx, 0.6);
  startSlowMo(fx);
  run(fx, 0.6);
  assert.equal(fx.slow, 0.3);
});
