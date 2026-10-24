import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROLES, POWERS, SPECIES } from '../../src/core/kinds.js';

test('ROLES carry the agreed hp, score and fire rate', () => {
  assert.deepEqual(ROLES, {
    grunt: { hp: 1, score: 100, fire: 0.08 },
    diver: { hp: 1, score: 150, fire: 0.05 },
    gunner: { hp: 2, score: 200, fire: 0.35 },
    armored: { hp: 3, score: 300, fire: 0.1 },
    carrier: { hp: 1, score: 250, fire: 0 },
  });
});

test('the powers are the agreed names in the agreed order', () => {
  assert.deepEqual(POWERS, ['spread', 'laser', 'rapid', 'shield']);
});

test('each of the seven species fights as an invaders role', () => {
  assert.deepEqual(SPECIES, {
    dog: 'grunt', cat: 'diver', bird: 'diver', fish: 'gunner', horse: 'gunner', cow: 'armored', rabbit: 'carrier',
  });
  for (const role of Object.values(SPECIES)) assert.ok(role in ROLES, role);
});
