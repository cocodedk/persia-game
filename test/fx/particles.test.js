import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFx, stepFx } from '../../src/fx/fx.js';
import { addParticle, MAX_PARTICLES, makeParticle, stepParticles } from '../../src/fx/particles.js';
import { run } from './fx-kit.js';

test('particle count is capped at 600 and the oldest are dropped', () => {
  const fx = createFx();
  for (let i = 0; i < MAX_PARTICLES + 50; i++) addParticle(fx, { x: i, life: 5 });
  assert.equal(MAX_PARTICLES, 600);
  assert.equal(fx.particles.length, 600);
  assert.equal(fx.particles[0].x, 50);
  assert.equal(fx.particles[599].x, 649);
});

test('particles carry every field a renderer needs', () => {
  const p = makeParticle({ x: 1, y: 2, life: 2 });
  for (const k of ['x', 'y', 'vx', 'vy', 'life', 'max', 'size', 'grow', 'color', 'kind', 'gravity', 'drag', 'additive']) {
    assert.ok(k in p, k);
  }
  assert.equal(p.max, 2);
});

test('particles expire after their life', () => {
  const fx = createFx();
  addParticle(fx, { life: 0.5 });
  addParticle(fx, { life: 2 });
  run(fx, 40 / 60);
  assert.equal(fx.particles.length, 1);
  run(fx, 2);
  assert.equal(fx.particles.length, 0);
});

test('a particle moves by its velocity, gravity pulls it down, drag slows it, size follows grow', () => {
  const list = [makeParticle({ x: 0, y: 0, vx: 100, vy: 0, gravity: 200, life: 5, size: 4, grow: -2 })];
  stepParticles(list, 0.5);
  assert.equal(list[0].x, 50);
  assert.ok(list[0].vy > 0 && list[0].y > 0, 'gravity is +y: the world is y down');
  assert.equal(list[0].size, 3);
  const drag = [makeParticle({ vx: 100, drag: 2, life: 5 })];
  stepParticles(drag, 1);
  assert.ok(drag[0].vx > 0 && drag[0].vx < 20, `drag left ${drag[0].vx}`);
  const gone = [makeParticle({ size: 1, grow: -10, life: 5 })];
  stepParticles(gone, 1);
  assert.equal(gone[0].size, 0, 'size never goes negative');
});

test('stepParticles keeps the list object and the order of the survivors', () => {
  const list = [makeParticle({ x: 1, life: 0.01 }), makeParticle({ x: 2, life: 1 }), makeParticle({ x: 3, life: 1 })];
  const same = list;
  stepParticles(list, 0.1);
  assert.equal(list, same);
  assert.deepEqual(list.map((p) => p.x), [2, 3]);
});

test('stepFx drives particles', () => {
  const fx = createFx();
  addParticle(fx, { vx: 60, life: 5 });
  stepFx(fx, 1);
  assert.equal(fx.particles[0].x, 60);
});
