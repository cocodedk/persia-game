import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVEL, levelSpecies } from '../../src/core/levels.js';
import { SPECIES } from '../../src/core/kinds.js';
import { MOTION } from '../../src/core/formations.js';
import { EMIT } from '../../src/core/patterns.js';
import { bossDef } from '../../src/core/bosses-data.js';

test('level 1 is five waves, then the giant', () => {
  assert.equal(LEVEL.waves.length, 5);
  assert.equal(LEVEL.boss, 'giant');
  assert.equal(bossDef(LEVEL.boss).kind, 'giant');
  assert.equal(typeof LEVEL.name, 'string');
});

test('every wave brings one or two species, at most 40 aliens, in a real formation with a real pattern', () => {
  for (const wave of LEVEL.waves) {
    assert.ok(new Set(wave.species).size <= 2);
    assert.ok(wave.species.length * wave.cols <= 40);
    assert.ok(wave.formation in MOTION && wave.pattern in EMIT);
    assert.ok(Number.isInteger(wave.cols) && wave.cols >= 1 && wave.speed > 0);
  }
});

test('every species but the mouse appears, a carrier wave comes before wave 3, four or more formations', () => {
  const seen = new Set(LEVEL.waves.flatMap((x) => x.species));
  assert.deepEqual([...seen].sort(), Object.keys(SPECIES).filter((id) => id !== 'mouse').sort());
  assert.ok(LEVEL.waves.slice(0, 2).some((x) => x.species.includes('rabbit')));
  assert.ok(new Set(LEVEL.waves.map((x) => x.formation)).size >= 4);
});

test('the level has an integer seed and a difficulty in 0..1', () => {
  assert.ok(Number.isInteger(LEVEL.seed));
  assert.ok(LEVEL.d >= 0 && LEVEL.d <= 1);
});

test('the level is plain data: a JSON round trip changes nothing', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(LEVEL)), LEVEL);
});

test("levelSpecies: the level's animals in order of first appearance, its boss's last if new", () => {
  assert.deepEqual(levelSpecies(LEVEL), ['dog', 'cow', 'rabbit', 'bird', 'cat', 'horse', 'fish']);
  assert.deepEqual(levelSpecies({ waves: null, boss: 'giant' }), ['cat']);
});
