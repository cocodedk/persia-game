import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBunker } from '../../src/core/bunkers.js';
import { createWorld } from '../../src/core/world.js';
import {
  FIRE, solid, IDLE, level, wave, input, step, seconds, playing, drain, ofType, bulletAt, pickupOnShip,
} from './world-kit.js';

const BOMB = input({ bomb: true });
const lv = (roles, extra) => level([wave({ rows: roles.length, cols: 3, roles })], 0, extra);

// The laser's column is 26 px wide: an alien (radius 26) is hit within 13 + 26 = 39 px of the ship.
function beamWorld(offset) {
  const w = playing(lv(['armored']));
  w.ship.power = { kind: 'laser', left: 10 };
  const [a] = w.aliens;
  for (let i = 0; i < 18; i++) {
    w.ship.x = w.aliens[0].x + offset;
    step(w, 1, FIRE);
  }
  return { w, a };
}

test('the laser burns 8 damage a second into every alien in its column and only that column', () => {
  const { w, a } = beamWorld(0);
  assert.equal(a.hp, 1, '0.3 s of beam is 2 hits on a 3 hp alien');
  assert.deepEqual(w.aliens.slice(1).map((x) => x.hp), [3, 3]);
  assert.equal(w.shots.length, 0, 'the beam replaces the shots');
  assert.equal(w.ship.beam, true);
  assert.deepEqual(ofType(w.events, 'fire').map((e) => e.power), ['laser'], 'one fire event when the beam starts');
});

test('the beam reaches aliens whose edge touches the column (30 px off) and misses at 50 px', () => {
  assert.equal(beamWorld(30).a.hp, 1);
  assert.equal(beamWorld(50).a.hp, 3);
});

test('the laser hits several aliens stacked in its column at once, and each kill scores', () => {
  const w = playing(lv(['grunt', 'grunt', 'grunt']));
  w.ship.power = { kind: 'laser', left: 10 };
  const col = w.aliens.filter((a) => a.slot.col === 1);
  assert.equal(col.length, 3);
  for (let i = 0; i < 12; i++) {
    w.ship.x = col[0].x;
    step(w, 1, FIRE);
  }
  assert.equal(w.aliens.length, 6);
  assert.equal(ofType(w.events, 'kill').length, 3);
  assert.ok(w.score >= 300);
});

test('the beam is off when fire is released, when the power is another one, and after it expires', () => {
  const w = playing(lv(['armored']));
  w.ship.power = { kind: 'laser', left: 0.1 };
  step(w, 1, FIRE);
  assert.equal(w.ship.beam, true);
  step(w);
  assert.equal(w.ship.beam, false);
  w.ship.power = { kind: 'rapid', left: 5 };
  step(w, 1, FIRE);
  assert.equal(w.ship.beam, false);
  w.ship.power = { kind: 'laser', left: 0.05 };
  seconds(w, 0.2, FIRE);
  assert.equal(w.ship.beam, false);
});

test('the laser carves a 26 px slot through a bunker above it and leaves the rest', () => {
  const w = playing(lv(['grunt'], { bunkers: true }));
  w.ship.power = { kind: 'laser', left: 10 };
  const b = w.bunkers[1];
  const before = Uint8Array.from(b.mask);
  w.ship.x = b.x + 40;
  w.ship.y = 900;
  step(w, 3, FIRE);
  for (let ly = 0; ly < b.h; ly++) {
    for (let lx = 0; lx < b.w; lx++) {
      const cx = b.x + lx + 0.5; // a pixel belongs to the slot when its centre does
      const inside = cx >= w.ship.x - 13 && cx <= w.ship.x + 13;
      assert.equal(b.mask[ly * b.w + lx], inside ? 0 : before[ly * b.w + lx], `(${lx},${ly})`);
    }
  }
  assert.ok(solid(b) < before.reduce((n, v) => n + v, 0));
  assert.equal(ofType(w.events, 'bunker').filter((e) => e.laser).length, 1, 'reported once, when it carved');
  assert.equal(solid(w.bunkers[0]), solid(createBunker(0, 0, b.w, b.h)), 'the other bunkers are untouched');
});

test('a bomb clears every enemy bullet and deals 3 damage to every alien', () => {
  const w = playing(lv(['armored', 'grunt']));
  const armored = w.aliens.filter((a) => a.role === 'armored');
  for (const a of armored) a.hp = 6;
  for (let i = 0; i < 5; i++) bulletAt(w, 200 + i * 300, 400, 0, 200);
  step(w, 1, BOMB);
  const ev = drain(w);
  assert.equal(w.bullets.length, 0);
  assert.deepEqual(armored.map((a) => a.hp), [3, 3, 3]);
  assert.deepEqual(w.aliens.map((a) => a.role), ['armored', 'armored', 'armored'], 'the grunts died');
  assert.equal(w.ship.bombs, 0);
  const [bomb] = ofType(ev, 'bomb');
  assert.deepEqual([bomb.cleared, bomb.left], [5, 0]);
  assert.equal(ofType(ev, 'kill').length, 3);
  assert.equal(ofType(ev, 'hit').length, 3);
});

test('a bomb does not reach aliens that are still flying in from off screen', () => {
  const w = playing(level([wave(), wave({ formation: 'sway' })]));
  w.aliens.length = 0;
  while (w.wave < 2) step(w);
  const hp = w.aliens.map((a) => a.hp);
  assert.ok(w.aliens.every((a) => a.y < 0));
  step(w, 1, BOMB);
  assert.equal(w.ship.bombs, 0);
  assert.deepEqual(w.aliens.map((a) => a.hp), hp);
});

test('a bomb also removes enemy lasers; with no bombs left nothing happens', () => {
  const w = playing(lv(['grunt']));
  w.bullets.push({ pattern: 'laser', x: 500, y: 100, vx: 0, vy: 1, r: 9, life: 1, warn: 0.5 });
  w.ship.bombs = 0;
  step(w, 1, BOMB);
  assert.equal(w.bullets.length, 1);
  assert.equal(w.aliens.length, 3);
  w.ship.bombs = 1;
  step(w, 1, IDLE);
  step(w, 1, BOMB);
  assert.equal(w.bullets.length, 0);
});

test('a bomb needs a fresh press: holding the key spends one, releasing and pressing spends another', () => {
  const w = playing(lv(['armored']));
  for (const a of w.aliens) a.hp = 99; // the wave must outlive three bombs
  w.ship.bombs = 3;
  seconds(w, 2, BOMB);
  assert.equal(w.ship.bombs, 2);
  step(w, 1, IDLE);
  step(w, 1, BOMB);
  assert.equal(w.ship.bombs, 1);
});

test('a bomb key held since the intro is not a fresh press', () => {
  const w = createWorld(lv(['armored']), 1);
  while (w.state === 'intro') step(w, 1, BOMB);
  step(w, 5, BOMB);
  assert.equal(w.ship.bombs, 1);
  step(w, 1, IDLE);
  step(w, 1, BOMB);
  assert.equal(w.ship.bombs, 0);
});

test('bomb pickups add one up to a stock of 3, and are used up even at the cap', () => {
  const w = playing(lv(['grunt']));
  for (const expected of [2, 3, 3]) {
    pickupOnShip(w, 'bomb');
    step(w);
    assert.equal(w.ship.bombs, expected);
    assert.equal(w.pickups.length, 0);
  }
  assert.equal(w.ship.power, null);
});
