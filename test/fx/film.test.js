import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFilm, stepFilm } from '../../src/fx/film.js';
import { createWorld } from '../../src/core/world.js';
import { levelById } from '../../src/core/levels.js';
import { TICK } from './fx-kit.js';

const film = (id = 'w2-1') => createFilm(createWorld(levelById(id)));
const run = (f, secs, on) => { for (let i = 0; i < Math.round(secs * 60); i++) stepFilm(f, TICK, on); };

test('a fresh film is off: no bars, no look, a grain seed from the level', () => {
  const f = film();
  assert.deepEqual([f.letterbox, f.vignette, f.grade, f.grain], [0, 0, 0, 0]);
  assert.equal(f.seed, levelById('w2-1').seed >>> 0);
  assert.equal(film('w2-2').seed, levelById('w2-2').seed >>> 0);
});

test('the grade tint belongs to the world and differs between worlds', () => {
  const tints = [1, 2, 3, 4, 5, 6, 7, 8].map((w) => film(`w${w}-1`).tint);
  for (const t of tints) assert.match(t, /^#[0-9a-f]{6}$/i);
  assert.equal(new Set(tints).size, 8);
});

test('letterbox eases in to exactly 1 and out to exactly 0, through every value between', () => {
  const f = film();
  let last = 0;
  let mid = false;
  for (let i = 0; i < 240; i++) {
    stepFilm(f, TICK, true);
    assert.ok(f.letterbox >= last, 'never goes back while on');
    if (f.letterbox > 0.05 && f.letterbox < 0.95) mid = true;
    last = f.letterbox;
  }
  assert.ok(mid, 'it passes through the middle, it does not jump');
  assert.equal(f.letterbox, 1);
  for (let i = 0; i < 240; i++) {
    stepFilm(f, TICK, false);
    assert.ok(f.letterbox <= last);
    last = f.letterbox;
  }
  assert.equal(f.letterbox, 0);
});

test('the ease is slow at both ends (smooth, not linear)', () => {
  const f = film();
  stepFilm(f, TICK, true);
  const first = f.letterbox;
  run(f, 0.4, true);
  assert.ok(first < 1 / 60 / 0.8 * 0.5, `starts gently: ${first}`);
  assert.ok(f.letterbox > 0.3 && f.letterbox < 0.7, `half-way at half the time: ${f.letterbox}`);
});

test('vignette, grade and grain follow the same ease to their full strength and back to 0', () => {
  const f = film();
  run(f, 2, true);
  assert.ok(f.vignette > 0 && f.vignette <= 1);
  assert.ok(f.grade > 0 && f.grade <= 1);
  assert.ok(f.grain > 0 && f.grain <= 1);
  run(f, 2, false);
  assert.deepEqual([f.vignette, f.grade, f.grain], [0, 0, 0]);
});

test('turning off half-way eases back from where it was', () => {
  const f = film();
  run(f, 0.4, true);
  const mid = f.letterbox;
  stepFilm(f, TICK, false);
  assert.ok(f.letterbox < mid && f.letterbox > mid - 0.1);
});

test('the grain frame advances at film speed only while the look is on', () => {
  const f = film();
  run(f, 1, false);
  assert.equal(f.frame, 0);
  run(f, 1, true);
  assert.ok(f.frame >= 23 && f.frame <= 25, `frame ${f.frame}`);
});

test('createFilm and stepFilm leave the world alone', () => {
  const world = createWorld(levelById('w3-1'));
  const before = structuredClone(world);
  const f = createFilm(world);
  stepFilm(f, TICK, true);
  assert.deepEqual(world, before);
});
