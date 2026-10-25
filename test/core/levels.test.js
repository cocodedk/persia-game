import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVEL, LEVELS, levelSpecies, waveNumber } from '../../src/core/levels.js';
import { SPECIES } from '../../src/core/kinds.js';
import { MOTION } from '../../src/core/formations.js';
import { EMIT } from '../../src/core/patterns.js';
import { bossDef } from '../../src/core/bosses-data.js';

const [, LEVEL_2, LEVEL_3, LEVEL_4, LEVEL_5, LEVEL_6, LEVEL_7] = LEVELS;
const rows = (level, id) => level.waves.flatMap((x) => x.species).filter((s) => s === id).length;

test('level 1 is five waves, then the giant; level 2 five more, then the giant mouse', () => {
  assert.equal(LEVELS[0], LEVEL);
  assert.equal(LEVEL.waves.length, 5);
  assert.equal(bossDef(LEVEL.boss).kind, 'giant');
  assert.equal(LEVEL_2.waves.length, 5);
  assert.equal(bossDef(LEVEL_2.boss).kind, 'giant-mouse');
  assert.equal(new Set(LEVELS.map((l) => l.id)).size, LEVELS.length, 'ids are unique');
  for (const level of LEVELS) {
    assert.equal(typeof level.name, 'string');
    assert.ok(level.place, `${level.id} names its place`);
  }
  assert.equal(new Set(LEVELS.map((l) => l.place)).size, LEVELS.length, 'every level is somewhere else');
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

test('level 4 brings all eight, the bird, its boss, in more rows than the fish had in level 3', () => {
  assert.deepEqual(levelSpecies(LEVEL_4).toSorted(), Object.keys(SPECIES).sort());
  assert.equal(bossDef(LEVEL_4.boss).species, 'bird');
  assert.ok(LEVEL_4.waves.flatMap((x) => x.species).filter((id) => id === 'bird').length > 4);
});

test('level 5 brings all eight animals, the cow, its boss, in more rows than any earlier level, a step harder than level 4', () => {
  assert.deepEqual(levelSpecies(LEVEL_5).toSorted(), levelSpecies(LEVEL_4).toSorted());
  assert.equal(bossDef(LEVEL_5.boss).species, 'cow');
  assert.ok(rows(LEVEL_5, 'cow') > 2 && LEVELS.slice(0, 4).every((level) => rows(level, 'cow') <= 2));
  assert.ok(LEVEL_5.d > LEVEL_4.d);
});

test('level 6 brings all eight animals, the dog, its boss, in more rows than any earlier level, a step harder than level 5', () => {
  assert.deepEqual(levelSpecies(LEVEL_6).toSorted(), levelSpecies(LEVEL_5).toSorted());
  assert.equal(bossDef(LEVEL_6.boss).species, 'dog');
  assert.ok(rows(LEVEL_6, 'dog') > 5 && LEVELS.slice(0, 5).every((level) => rows(level, 'dog') <= 5));
  assert.ok(LEVEL_6.d > LEVEL_5.d);
});

test('level 7 brings all eight animals, the horse, its boss, in more rows than any earlier level, and is no harder to survive than level 6', () => {
  const gunners = (level) => level.waves.reduce((n, x) => n + x.cols * x.species.filter((id) => SPECIES[id] === 'gunner').length, 0);
  assert.deepEqual(levelSpecies(LEVEL_7).toSorted(), levelSpecies(LEVEL_6).toSorted());
  assert.equal(bossDef(LEVEL_7.boss).species, 'horse');
  assert.ok(rows(LEVEL_7, 'horse') > 2 && LEVELS.slice(0, 6).every((level) => rows(level, 'horse') <= 2));
  assert.ok(gunners(LEVEL_7) <= gunners(LEVEL_6), 'no more gunners than level 6');
  assert.equal(LEVEL_7.d, LEVEL_6.d);
  LEVEL_7.waves.forEach((x, i) => assert.ok(x.speed <= LEVEL_6.waves[i].speed, `wave ${i + 31} is no faster than wave ${i + 26}`));
});

test('level 3 drops more power-ups than level 2: six rabbits in its escort; its giant and those of levels 4 to 7 send one in every phase', () => {
  const rabbits = (level) => level.waves.reduce((n, x) => n + x.cols * x.species.filter((id) => id === 'rabbit').length, 0);
  assert.equal(rabbits(LEVEL_3), 6);
  assert.ok(rabbits(LEVEL_3) > rabbits(LEVEL_2));
  for (const level of [LEVEL_3, LEVEL_4, LEVEL_5, LEVEL_6, LEVEL_7]) {
    for (const p of bossDef(level.boss).phases) assert.ok(p.minions.some((m) => m.species === 'rabbit'), `${level.id} until ${p.until}`);
  }
});

test('the world counts its waves across the levels: level 2 from six, level 3 from eleven, level 4 from sixteen, level 5 from twenty-one, level 6 from twenty-six, level 7 from thirty-one', () => {
  assert.equal(waveNumber(LEVEL, 1), 1);
  assert.equal(waveNumber(LEVEL_2, 1), 6);
  assert.equal(waveNumber(LEVEL_2, 5), 10);
  assert.equal(waveNumber(LEVEL_3, 1), 11);
  assert.equal(waveNumber(LEVEL_3, 5), 15);
  assert.equal(waveNumber(LEVEL_4, 1), 16);
  assert.equal(waveNumber(LEVEL_4, 5), 20);
  assert.equal(waveNumber(LEVEL_5, 1), 21);
  assert.equal(waveNumber(LEVEL_5, 5), 25);
  assert.equal(waveNumber(LEVEL_6, 1), 26);
  assert.equal(waveNumber(LEVEL_6, 5), 30);
  assert.equal(waveNumber(LEVEL_7, 1), 31);
  assert.equal(waveNumber(LEVEL_7, 5), 35);
});

test('a level shows in Persian only parts the game knows', () => {
  assert.deepEqual(LEVEL.persian, []);
  const known = ['wave', 'waveWord', 'score', 'scoreWord', 'combo', 'level', 'boss'];
  for (const level of LEVELS) for (const part of level.persian) assert.ok(known.includes(part), `${level.id}: ${part}`);
  for (const part of ['combo', 'level']) assert.ok(LEVEL_4.persian.includes(part), `level 4 shows its ${part}`);
  assert.deepEqual(LEVEL_5.persian, [...LEVEL_4.persian, 'boss']);
  assert.deepEqual(LEVEL_6.persian, [...LEVEL_5.persian, 'waveWord']);
  assert.deepEqual(LEVEL_7.persian, [...LEVEL_6.persian, 'scoreWord']);
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
