import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../../src/core/rng.js';
import { emitPattern, EMIT } from '../../src/core/patterns.js';
import { FROM, TARGET, AIM, P, heading, speedOf, wrap, emit } from './pattern-kit.js';

const PATTERNS = Object.keys(EMIT);

test('emitPattern knows every pattern in EMIT and tags bullets with their pattern', () => {
  for (const name of PATTERNS) {
    const list = emit(name);
    assert.ok(list.length >= 1, name);
    for (const b of list) {
      assert.equal(b.pattern, name);
      assert.ok(b.r > 0 && b.life > 0, name);
      assert.ok(Number.isFinite(b.x + b.y + b.vx + b.vy), name);
    }
  }
  assert.throws(() => emit('boomerang'), /unknown pattern/);
});

test('aimed fires one bullet from the emitter, pointing at the target at the given speed', () => {
  const [b] = emit('aimed');
  assert.equal(emit('aimed').length, 1);
  assert.deepEqual([b.x, b.y], [FROM.x, FROM.y]);
  assert.ok(Math.abs(wrap(heading(b) - AIM)) < 1e-12);
  assert.ok(Math.abs(speedOf(b) - 400) < 1e-9);
});

test('fan has exactly count bullets spanning exactly spread, centred on the aim', () => {
  const list = emit('fan', { speed: 400, count: 7, spread: 1.2 });
  assert.equal(list.length, 7);
  const angles = list.map((b) => wrap(heading(b) - AIM));
  assert.ok(Math.abs(angles[0] + 0.6) < 1e-12 && Math.abs(angles[6] - 0.6) < 1e-12);
  for (let i = 1; i < 7; i++) assert.ok(Math.abs(angles[i] - angles[i - 1] - 0.2) < 1e-12);
  for (const b of list) assert.ok(Math.abs(speedOf(b) - 400) < 1e-9);
  assert.equal(emit('fan').length, 5, 'default count');
  const one = emit('fan', { speed: 400, count: 1, spread: 1 });
  assert.ok(one.length === 1 && Math.abs(wrap(heading(one[0]) - AIM)) < 1e-12, 'a single shot is aimed');
});

test('ring is evenly spaced over the full circle', () => {
  const list = emit('ring', { speed: 300, count: 10 });
  assert.equal(list.length, 10);
  const angles = list.map(heading);
  for (let i = 0; i < 10; i++) {
    const gap = wrap(angles[(i + 1) % 10] - angles[i]);
    assert.ok(Math.abs(gap - (2 * Math.PI) / 10) < 1e-9, `gap ${i}`);
    assert.ok(Math.abs(speedOf(list[i]) - 300) < 1e-9);
  }
  assert.equal(emit('ring').length, 12, 'default count');
});

test('patterns are deterministic per rng seed, and the seed matters where it is used', () => {
  for (const name of PATTERNS) {
    assert.deepEqual(emit(name, P, 5), emit(name, P, 5), name);
  }
  assert.notDeepEqual(emit('ring', P, 5), emit('ring', P, 6), 'ring');
});

test('emitPattern draws from the cloneable { s } state and advances it', () => {
  const a = createRng(9);
  const b = structuredClone(a);
  const first = emitPattern('ring', FROM, TARGET, P, a);
  assert.notEqual(a.s, b.s, 'the rng advanced');
  assert.deepEqual(emitPattern('ring', FROM, TARGET, P, b), first, 'a clone draws it again');
  const n = createRng(9);
  emitPattern('aimed', FROM, TARGET, P, n);
  assert.equal(n.s, createRng(9).s, 'aimed needs no randomness');
});

