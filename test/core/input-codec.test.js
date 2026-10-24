import { test } from 'node:test';
import assert from 'node:assert/strict';
import { quantizeInput, IDLE } from '../../src/core/input-codec.js';

test('quantizeInput gives the one shape the core is fed', () => {
  assert.deepEqual(quantizeInput({ dx: 5, dy: -0.3, fire: 1 }), { dx: 1, dy: -1, fire: true, bomb: false, target: null });
  assert.deepEqual(quantizeInput({ dx: 5, dy: -0.3, fire: 1, target: { x: 10.6, y: 700.4 } }),
    { dx: 0, dy: 0, fire: true, bomb: false, target: { x: 11, y: 700 } }, 'the ship ignores the keys under a pointer');
  assert.deepEqual(quantizeInput({}), IDLE);
  assert.deepEqual(quantizeInput({ target: { x: 5000, y: -5 } }).target, { x: 1920, y: 0 }, 'held on the screen');
  assert.deepEqual(quantizeInput({ target: { x: NaN, y: 3 } }).target, null);
});
