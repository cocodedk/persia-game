import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advance, MAX_STEPS } from '../../src/core/loop.js';
import { TICK } from '../../src/core/kinds.js';

const close = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} vs ${b}`);

test('a 60 Hz frame is one tick, with nothing left over', () => {
  const { ticks, acc } = advance(0, TICK);
  assert.equal(ticks, 1);
  close(acc, 0, 'acc');
});

test('the remainder carries over to the next frame', () => {
  let r = advance(0, 0.01); // less than a tick
  assert.equal(r.ticks, 0);
  close(r.acc, 0.01, 'kept');
  r = advance(r.acc, 0.01); // 0.02 in all: one tick, 0.02 - 1/60 left
  assert.equal(r.ticks, 1);
  close(r.acc, 0.02 - TICK, 'remainder');
});

test('float sums of whole ticks never lose a tick (3 x 1/60 is three ticks)', () => {
  let acc = 0;
  let total = 0;
  for (let i = 0; i < 6000; i++) {
    const r = advance(acc, TICK);
    acc = r.acc;
    total += r.ticks;
  }
  assert.equal(total, 6000);
  assert.equal(advance(0, 0.05).ticks, 3);
});

test('at most five ticks a frame; whole ticks past the cap are dropped, the fraction is kept', () => {
  assert.equal(MAX_STEPS, 5);
  let r = advance(0, 0.1); // six ticks due
  assert.equal(r.ticks, 5);
  close(r.acc, 0, 'no backlog after a hitch');
  r = advance(0.004, 0.25); // fifteen ticks and 0.004 s due
  assert.equal(r.ticks, 5);
  close(r.acc, 0.004, 'the fraction survives the cap');
});

test('slow motion feeds less time: 0.3 x a 60 Hz frame steps a tick about every third frame', () => {
  let acc = 0;
  let total = 0;
  for (let i = 0; i < 30; i++) {
    const r = advance(acc, TICK * 0.3);
    acc = r.acc;
    total += r.ticks;
  }
  assert.equal(total, 9);
});

test('a negative or broken frame time steps nothing and keeps the accumulator', () => {
  for (const dt of [-1, NaN, undefined]) {
    const r = advance(0.01, dt);
    assert.equal(r.ticks, 0);
    close(r.acc, 0.01, String(dt));
  }
});
