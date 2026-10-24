import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROLES } from '../../src/core/kinds.js';
import { stars } from '../../src/core/scoring.js';
import { level, wave, step, seconds, playing, drain, ofType, shotAt } from './world-kit.js';

const crowd = (roles, cols) => playing(level([wave({ rows: roles.length, cols, roles })]));

function kill(w, a, times = 1) {
  for (let i = 0; i < times; i++) {
    shotAt(w, a);
    step(w);
  }
}

test('each role scores its own value at multiplier 1', () => {
  const roles = ['grunt', 'diver', 'gunner', 'armored', 'carrier'];
  const w = crowd([...roles, 'grunt'], 1);
  for (const [i, role] of roles.entries()) {
    const before = w.score;
    kill(w, w.aliens.find((a) => a.role === role), ROLES[role].hp);
    assert.equal(w.score - before, ROLES[role].score, role);
    seconds(w, 2);
  }
});

test('the combo climbs by 1 per kill within 1.5 s and caps at x8', () => {
  const w = crowd(['grunt'], 12);
  const mults = [];
  for (let i = 0; i < 10; i++) {
    kill(w, w.aliens[0]);
    mults.push(ofType(drain(w), 'kill')[0].mult);
  }
  assert.deepEqual(mults, [1, 2, 3, 4, 5, 6, 7, 8, 8, 8]);
  assert.equal(w.combo.mult, 8);
  assert.equal(w.score, 100 * (1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 8 + 8));
});

test('a kill within 1.5 s of the last keeps the combo, 1.5 s of quiet resets it', () => {
  const w = crowd(['grunt'], 8);
  kill(w, w.aliens[0]);
  seconds(w, 1.3);
  assert.equal(w.combo.mult, 1);
  kill(w, w.aliens[0]);
  assert.equal(w.combo.mult, 2, '1.3 s later still counts');
  seconds(w, 1.3);
  kill(w, w.aliens[0]);
  assert.equal(w.combo.mult, 3, 'the window restarts at every kill');
  seconds(w, 1.6);
  assert.equal(w.combo.mult, 1, 'reset after 1.5 s without a kill');
  const before = w.score;
  kill(w, w.aliens[0]);
  assert.equal(w.score - before, 100);
});

test('the kill event carries what the score pop-up needs', () => {
  const w = crowd(['gunner', 'grunt'], 2);
  const a = w.aliens[0];
  const [x, y] = [a.x, a.y];
  kill(w, a, 2);
  const [k] = ofType(drain(w), 'kill');
  assert.equal(k.id, a.id);
  assert.equal(k.role, 'gunner');
  assert.equal(k.score, 200);
  assert.equal(k.mult, 1);
  assert.ok(Math.abs(k.x - x) < 5 && Math.abs(k.y - y) < 5);
  assert.equal(typeof k.tick, 'number');
});

test('stars: 3 with no hits, 2 after one life lost, 1 after two, 0 unless cleared', () => {
  const w = crowd(['grunt'], 2);
  assert.equal(stars(w), 0, 'a level in progress has no stars');
  w.state = 'cleared';
  const earned = [];
  for (const hits of [0, 1, 2, 3]) {
    w.hits = hits;
    w.ship.lives = 3 - hits;
    earned.push(stars(w));
  }
  assert.deepEqual(earned, [3, 2, 1, 1]);
  w.state = 'failed';
  assert.equal(stars(w), 0);
});
