import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WORLDS, LEVELS, levelById } from '../../src/core/levels.js';
import { difficulty } from '../../src/core/difficulty.js';
import { ROLES, FORMATIONS, PATTERNS, BOSSES } from '../../src/core/kinds.js';

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

test('WORLDS has the one world, its name and its boss', () => {
  assert.deepEqual(WORLDS.map((w) => w.id), [1]);
  assert.equal(typeof WORLDS[0].name, 'string');
  assert.deepEqual(WORLDS.map((w) => w.boss), BOSSES);
});

test('there are 5 levels, in order, with unique ids that match world and index', () => {
  assert.equal(LEVELS.length, 5);
  assert.equal(new Set(LEVELS.map((l) => l.id)).size, 5);
  LEVELS.forEach((l, i) => {
    assert.equal(l.world, 1);
    assert.equal(l.index, i + 1);
    assert.equal(l.id, `w1-${l.index}`);
  });
});

test('every level has an integer seed (all distinct) and its difficulty', () => {
  for (const l of LEVELS) {
    assert.ok(Number.isInteger(l.seed), `${l.id} seed`);
    assert.equal(l.d, difficulty(l.world, l.index), `${l.id} d`);
  }
  assert.equal(new Set(LEVELS.map((l) => l.seed)).size, 5);
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

test('the boss level names the world boss and has no waves', () => {
  assert.equal(bossLevels.length, 1);
  for (const l of bossLevels) {
    assert.equal(l.boss, BOSSES[0], l.id);
    assert.ok(!('waves' in l), `${l.id} has waves`);
  }
});

test('the world uses at least 4 different formations across its wave levels', () => {
  const used = new Set(waveLevels.flatMap((l) => l.waves.map((w) => w.formation)));
  assert.ok(used.size >= 4, `world 1 uses only ${[...used]}`);
});

test('levels are plain data: a JSON round trip changes nothing', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(LEVELS)), LEVELS);
});

test('levelById finds every level and returns undefined for an unknown id', () => {
  for (const l of LEVELS) assert.equal(levelById(l.id), l);
  assert.equal(levelById('w2-1'), undefined);
  assert.equal(levelById(''), undefined);
});
