import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRng, createRng, rand, between, int, pick } from '../../src/core/rng.js';

const draw = (next, n) => Array.from({ length: n }, next);

test('makeRng is deterministic per seed and stays in [0, 1)', () => {
  const a = draw(makeRng(42), 200);
  assert.deepEqual(a, draw(makeRng(42), 200));
  assert.notDeepEqual(a, draw(makeRng(43), 200));
  for (const v of a) assert.ok(v >= 0 && v < 1);
});

test('rand(createRng(seed)) is the same stream as makeRng(seed)', () => {
  const r = createRng(7);
  assert.deepEqual(draw(() => rand(r), 100), draw(makeRng(7), 100));
});

test('createRng keeps its state in a plain { s } object that survives structuredClone', () => {
  const r = createRng(99);
  assert.deepEqual(Object.keys(r), ['s']);
  draw(() => rand(r), 10);
  const copy = structuredClone(r);
  assert.deepEqual(copy, r);
  assert.deepEqual(draw(() => rand(copy), 50), draw(() => rand(r), 50));
});

test('rand advances the state it is given and nothing else', () => {
  const r = createRng(5);
  const before = r.s;
  const v = rand(r);
  assert.notEqual(r.s, before);
  assert.ok(v >= 0 && v < 1);
});

test('between and pick draw from a makeRng stream', () => {
  const rng = makeRng(3);
  for (let i = 0; i < 100; i++) {
    const v = between(rng, 10, 20);
    assert.ok(v >= 10 && v < 20);
  }
  const seen = new Set(draw(() => pick(rng, ['a', 'b', 'c']), 100));
  assert.deepEqual([...seen].sort(), ['a', 'b', 'c']);
});

test('int is a whole number in [lo, hi], both ends included, from one draw', () => {
  const rng = makeRng(3);
  assert.deepEqual([...new Set(draw(() => int(rng, 3, 6), 200))].sort(), [3, 4, 5, 6]);
  assert.equal(int(() => 0, 3, 6), 3);
  assert.equal(int(() => 0.999999, 3, 6), 6);
  let calls = 0;
  int(() => calls++, 1, 2);
  assert.equal(calls, 1);
});

// Every level and the tests that prove each can be finished run on seeded streams, so these must
// never change: if a number here moves, every seeded run plays out differently.
const GOLDEN_42 = [
  0.6011037519201636, 0.44829055899754167, 0.8524657934904099,
  0.6697340414393693, 0.17481389874592423, 0.5265925421845168,
];

test('makeRng(42) is pinned to its first six outputs', () => {
  assert.deepEqual(draw(makeRng(42), 6), GOLDEN_42);
});

test('rand(createRng(42)) is pinned to the same six outputs and ends in a pinned state', () => {
  const r = createRng(42);
  assert.deepEqual(draw(() => rand(r), 6), GOLDEN_42);
  assert.equal(r.s, 2399460328);
});
