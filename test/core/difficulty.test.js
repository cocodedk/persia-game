import { test } from 'node:test';
import assert from 'node:assert/strict';
import { difficulty, scaled } from '../../src/core/difficulty.js';

test('difficulty runs from 0 at world 1 level 1 to 1 at world 8 level 5', () => {
  assert.equal(difficulty(1, 1), 0);
  assert.equal(difficulty(8, 5), 1);
  assert.equal(difficulty(2, 1), 5 / 39);
});

test('difficulty never falls as (world, level) advances', () => {
  let last = -1;
  for (let w = 1; w <= 8; w++) {
    for (let i = 1; i <= 5; i++) {
      const d = difficulty(w, i);
      assert.ok(d >= 0 && d <= 1);
      assert.ok(d > last, `w${w}-${i}`);
      last = d;
    }
  }
});

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
