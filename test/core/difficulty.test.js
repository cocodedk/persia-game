import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scaled } from '../../src/core/difficulty.js';

test('scaled gives the documented range at d = 0 and d = 1', () => {
  assert.deepEqual(scaled(0), { bulletSpeed: 260, fireMult: 0.6, formationSpeed: 1, armorBonus: 0 });
  const hard = scaled(1);
  assert.equal(hard.bulletSpeed, 520);
  assert.equal(hard.fireMult, 1.6);
  assert.equal(hard.formationSpeed, 1.6);
  assert.equal(hard.armorBonus, 1);
});

test('armorBonus switches on only above d = 0.6', () => {
  assert.equal(scaled(0.6).armorBonus, 0);
  assert.equal(scaled(0.61).armorBonus, 1);
});
