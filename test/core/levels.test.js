import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WORLDS, LEVELS, DEMO_LEVEL, levelById } from '../../src/core/levels.js';
import { difficulty } from '../../src/core/difficulty.js';
import { ROLES, FORMATIONS, PATTERNS, TWISTS, BOSSES } from '../../src/core/kinds.js';

const waveLevels = LEVELS.filter((l) => l.index < 5);
const bossLevels = LEVELS.filter((l) => l.index === 5);
const aliens = (w) => w.rows * w.cols;

function assertWaveValid(w, at) {
  assert.ok(FORMATIONS.includes(w.formation), `${at} formation ${w.formation}`);
  assert.ok(PATTERNS.includes(w.pattern), `${at} pattern ${w.pattern}`);
  assert.ok(Number.isInteger(w.rows) && w.rows >= 1, `${at} rows`);
  assert.ok(Number.isInteger(w.cols) && w.cols >= 1, `${at} cols`);
  assert.equal(w.roles.length, w.rows, `${at} one role per row`);
  for (const r of w.roles) assert.ok(r in ROLES, `${at} role ${r}`);
  assert.ok(typeof w.speed === 'number' && w.speed > 0, `${at} speed`);
  assert.ok(aliens(w) <= 40, `${at} has ${aliens(w)} aliens`);
}

test('WORLDS has the 8 worlds with names, twists and bosses in the spec order', () => {
  assert.deepEqual(WORLDS.map((w) => w.id), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(WORLDS.map((w) => w.name), ['Arcade Origin', 'Neon Rain', 'Twin Suns',
    'Ronin Moon', 'Hive', 'Code Rain', 'Iron Dawn', 'Event Horizon']);
  assert.deepEqual(WORLDS.map((w) => w.twist), TWISTS);
  assert.deepEqual(WORLDS.map((w) => w.boss), BOSSES);
});

test('there are 40 levels, in order, with unique ids that match world and index', () => {
  assert.equal(LEVELS.length, 40);
  assert.equal(new Set(LEVELS.map((l) => l.id)).size, 40);
  LEVELS.forEach((l, i) => {
    assert.equal(l.world, Math.floor(i / 5) + 1);
    assert.equal(l.index, (i % 5) + 1);
    assert.equal(l.id, `w${l.world}-${l.index}`);
  });
});

test('every level has an integer seed (all distinct), its difficulty and its world twist', () => {
  for (const l of LEVELS) {
    assert.ok(Number.isInteger(l.seed), `${l.id} seed`);
    assert.equal(l.d, difficulty(l.world, l.index), `${l.id} d`);
    assert.equal(l.twist, WORLDS[l.world - 1].twist, `${l.id} twist`);
    assert.equal(typeof l.bunkers, 'boolean', `${l.id} bunkers`);
  }
  assert.equal(new Set(LEVELS.map((l) => l.seed)).size, 40);
});

test('every wave of every level is valid against kinds.js', () => {
  for (const l of waveLevels) l.waves.forEach((w, i) => assertWaveValid(w, `${l.id} wave ${i}`));
});

test('wave levels have 3 to 5 waves and at least one carrier', () => {
  for (const l of waveLevels) {
    assert.ok(l.waves.length >= 3 && l.waves.length <= 5, `${l.id} has ${l.waves.length} waves`);
    assert.ok(l.waves.some((w) => w.roles.includes('carrier')), `${l.id} has no carrier`);
    assert.ok(!('boss' in l), `${l.id} has a boss`);
  }
});

test('boss levels name their world boss and have no waves or bunkers', () => {
  assert.equal(bossLevels.length, 8);
  for (const l of bossLevels) {
    assert.equal(l.boss, BOSSES[l.world - 1], l.id);
    assert.ok(!('waves' in l), `${l.id} has waves`);
    assert.equal(l.bunkers, false, `${l.id} bunkers`);
  }
});

test('each world uses at least 4 different formations across its wave levels', () => {
  for (let world = 1; world <= 8; world++) {
    const used = new Set(waveLevels.filter((l) => l.world === world)
      .flatMap((l) => l.waves.map((w) => w.formation)));
    assert.ok(used.size >= 4, `world ${world} uses only ${[...used]}`);
  }
});

test('world 1 has bunkers on every wave level, world 4 waves all fire shuriken', () => {
  for (const l of waveLevels.filter((x) => x.world === 1)) assert.equal(l.bunkers, true, l.id);
  for (const l of waveLevels.filter((x) => x.world === 4)) {
    for (const w of l.waves) assert.equal(w.pattern, 'shuriken', l.id);
  }
});

test('levels are plain data: a JSON round trip changes nothing', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(LEVELS)), LEVELS);
});

test('DEMO_LEVEL is a gentle world 1 level: a 6x3 grunt grid, then a sway with one carrier', () => {
  assert.equal(DEMO_LEVEL.world, 1);
  assert.equal(DEMO_LEVEL.d, 0);
  assert.ok(Number.isInteger(DEMO_LEVEL.seed));
  assert.equal(DEMO_LEVEL.waves.length, 2);
  DEMO_LEVEL.waves.forEach((w, i) => assertWaveValid(w, `demo wave ${i}`));
  const [first, second] = DEMO_LEVEL.waves;
  assert.deepEqual([first.formation, first.rows, first.cols], ['grid', 3, 6]);
  assert.ok(first.roles.every((r) => r === 'grunt'));
  assert.equal(second.formation, 'sway');
  const carriers = second.roles.filter((r) => r === 'carrier').length * second.cols;
  assert.equal(carriers, 1);
  assert.ok(LEVELS.every((l) => l.id !== DEMO_LEVEL.id));
});

test('levelById finds every level and returns undefined for an unknown id', () => {
  for (const l of LEVELS) assert.equal(levelById(l.id), l);
  assert.equal(levelById('w9-1'), undefined);
  assert.equal(levelById(''), undefined);
});
