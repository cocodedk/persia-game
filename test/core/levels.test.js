import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVEL, LEVELS, levelSpecies, waveNumber } from '../../src/core/levels.js';
import { SPECIES } from '../../src/core/kinds.js';
import { MOTION } from '../../src/core/formations.js';
import { EMIT } from '../../src/core/patterns.js';
import { bossDef } from '../../src/core/bosses-data.js';

const [, LEVEL_2, LEVEL_3] = LEVELS;

test('level 1 is five waves, then the giant; level 2 five more, then the giant mouse', () => {
  assert.equal(LEVELS[0], LEVEL);
  assert.equal(LEVEL.waves.length, 5);
  assert.equal(bossDef(LEVEL.boss).kind, 'giant');
  assert.equal(LEVEL_2.waves.length, 5);
  assert.equal(bossDef(LEVEL_2.boss).kind, 'giant-mouse');
  assert.equal(new Set(LEVELS.map((l) => l.id)).size, LEVELS.length, 'ids are unique');
  for (const level of LEVELS) assert.equal(typeof level.name, 'string');
});

test('every wave brings one or two species, at most 40 aliens, in a real formation with a real pattern', () => {
  for (const wave of LEVELS.flatMap((l) => l.waves)) {
    assert.ok(new Set(wave.species).size <= 2);
    assert.ok(wave.species.length * wave.cols <= 40);
    assert.ok(wave.formation in MOTION && wave.pattern in EMIT);
    assert.ok(Number.isInteger(wave.cols) && wave.cols >= 1 && wave.speed > 0);
  }
});

test('every level brings a carrier wave in its first two and flies four or more formations', () => {
  for (const level of LEVELS) {
    assert.ok(level.waves.slice(0, 2).some((x) => x.species.includes('rabbit')), level.id);
    assert.ok(new Set(level.waves.map((x) => x.formation)).size >= 4, level.id);
  }
});

test('level 1 brings every species but the mouse; level 2 brings all eight, the mouse in its first wave', () => {
  const all = Object.keys(SPECIES).sort();
  assert.deepEqual(levelSpecies(LEVEL).toSorted(), all.filter((id) => id !== 'mouse'));
  assert.deepEqual(levelSpecies(LEVEL_2).toSorted(), all);
  assert.ok(LEVEL_2.waves[0].species.includes('mouse'));
});

test('level 3 brings all eight, the fish, its boss, in four or more rows', () => {
  assert.deepEqual(levelSpecies(LEVEL_3).toSorted(), Object.keys(SPECIES).sort());
  assert.ok(LEVEL_3.waves.flatMap((x) => x.species).filter((id) => id === 'fish').length >= 4);
});

test('level 3 drops more power-ups than level 2: six rabbits in its escort, and its giant sends one in every phase', () => {
  const rabbits = (level) => level.waves.reduce((n, x) => n + x.cols * x.species.filter((id) => id === 'rabbit').length, 0);
  assert.equal(rabbits(LEVEL_3), 6);
  assert.ok(rabbits(LEVEL_3) > rabbits(LEVEL_2));
  for (const p of bossDef(LEVEL_3.boss).phases) assert.ok(p.minions.some((m) => m.species === 'rabbit'), `phase until ${p.until}`);
});

test('the world counts its waves across the levels: level 2 from six, level 3 from eleven', () => {
  assert.equal(waveNumber(LEVEL, 1), 1);
  assert.equal(waveNumber(LEVEL_2, 1), 6);
  assert.equal(waveNumber(LEVEL_2, 5), 10);
  assert.equal(waveNumber(LEVEL_3, 1), 11);
  assert.equal(waveNumber(LEVEL_3, 5), 15);
});

test('a level shows in Persian only parts of the HUD the game knows', () => {
  assert.deepEqual(LEVEL.persian, []);
  for (const level of LEVELS) for (const part of level.persian) assert.ok(['wave', 'score'].includes(part), `${level.id}: ${part}`);
});

test('every level has an integer seed and a difficulty in 0..1, and is plain data', () => {
  for (const level of LEVELS) {
    assert.ok(Number.isInteger(level.seed));
    assert.ok(level.d >= 0 && level.d <= 1);
    assert.deepEqual(JSON.parse(JSON.stringify(level)), level);
  }
});

test("levelSpecies: the level's animals in order of first appearance, its boss's last if new", () => {
  assert.deepEqual(levelSpecies(LEVEL), ['dog', 'cow', 'rabbit', 'bird', 'cat', 'horse', 'fish']);
  assert.deepEqual(levelSpecies({ waves: null, boss: 'giant' }), ['cat']);
});
