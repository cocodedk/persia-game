import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PATTERNS } from '../../src/core/kinds.js';
import { createRng } from '../../src/core/rng.js';
import { emitPattern } from '../../src/core/patterns.js';
import { FROM, TARGET, AIM, P, heading, speedOf, wrap, emit } from './pattern-kit.js';

test('emitPattern knows every pattern in PATTERNS and tags bullets with their pattern', () => {
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

test('spiral is one burst that winds out: every angle different, speeds rising', () => {
  const list = emit('spiral', { speed: 400, count: 12 });
  assert.equal(list.length, 12);
  for (let i = 1; i < 12; i++) {
    assert.ok(speedOf(list[i]) > speedOf(list[i - 1]));
    assert.ok(Math.abs(wrap(heading(list[i]) - heading(list[i - 1])) - (2 * Math.PI) / 12) < 1e-9);
  }
  assert.ok(speedOf(list[11]) <= 400 + 1e-9, 'never faster than the pattern speed');
});

test('rain falls straight down, scattered around the emitter within spread', () => {
  const list = emit('rain', { speed: 300, count: 40, spread: 200 });
  assert.equal(list.length, 40);
  for (const b of list) {
    assert.equal(b.vx, 0);
    assert.ok(b.vy > 200 && b.vy <= 345, `vy ${b.vy}`);
    assert.ok(Math.abs(b.x - FROM.x) <= 100 && b.y === FROM.y);
  }
  assert.ok(new Set(list.map((b) => b.x)).size > 30, 'x is scattered');
});

test('shuriken is aimed, 0.6x speed, radius 18', () => {
  const [b] = emit('shuriken');
  assert.equal(b.r, 18);
  assert.ok(Math.abs(speedOf(b) - 0.6 * 400) < 1e-9);
  assert.ok(Math.abs(wrap(heading(b) - AIM)) < 1e-12);
  assert.ok(b.life > 5, 'slow, so it lives long enough to cross the screen');
});

test('patterns are deterministic per rng seed, and the seed matters where it is used', () => {
  for (const name of PATTERNS) {
    assert.deepEqual(emit(name, P, 5), emit(name, P, 5), name);
  }
  for (const name of ['ring', 'spiral', 'rain']) {
    assert.notDeepEqual(emit(name, P, 5), emit(name, P, 6), name);
  }
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

