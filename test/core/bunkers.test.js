import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBunker, hitBunker, carveRect, sweepBunkers, BUNKER } from '../../src/core/bunkers.js';
import { emitPattern } from '../../src/core/patterns.js';
import { createWorld } from '../../src/core/world.js';
import { solid, level, wave, step, playing, drain, ofType, bulletAt } from './world-kit.js';

const at = (b, lx, ly) => b.mask[ly * b.w + lx];
const fresh = () => createBunker(100, 560, 160, 60);
const lv = () => level([wave()], 0, { bunkers: true });

test('a bunker is a stepped arch: roof and legs solid, arch and top corners empty', () => {
  const b = fresh();
  assert.deepEqual([b.x, b.y, b.w, b.h], [100, 560, 160, 60]);
  assert.ok(b.mask instanceof Uint8Array);
  assert.equal(b.mask.length, 160 * 60);
  assert.equal(at(b, 80, 5), 1, 'roof');
  assert.equal(at(b, 80, 35), 1, 'roof, just above the arch');
  assert.equal(at(b, 80, 40), 0, 'arch');
  assert.equal(at(b, 80, 59), 0, 'arch, bottom');
  assert.equal(at(b, 3, 3), 0, 'stepped top corner');
  assert.equal(at(b, 3, 20), 1, 'shoulder below the steps');
  assert.equal(at(b, 30, 59), 1, 'leg');
  assert.equal(at(b, 130, 59), 1, 'leg');
  const share = solid(b) / b.mask.length;
  assert.ok(share > 0.6 && share < 0.9, `solid share ${share}`);
});

test('the arch is stepped: narrower at its top than at its foot', () => {
  const b = fresh();
  const gap = (ly) => b.mask.slice(ly * b.w, (ly + 1) * b.w).filter((v) => !v).length;
  assert.ok(gap(40) < gap(55));
});

test('hitBunker misses empty air and the arch, and changes nothing', () => {
  const b = fresh();
  const before = Uint8Array.from(b.mask);
  assert.equal(hitBunker(b, 100, 300, 8), false);
  assert.equal(hitBunker(b, 900, 590, 8), false);
  assert.equal(hitBunker(b, 100 + 80, 560 + 50, 5), false, 'inside the arch');
  assert.deepEqual(b.mask, before);
});

test('hitBunker carves a disc wider than the projectile and reports the hit', () => {
  const b = fresh();
  const total = solid(b);
  assert.equal(hitBunker(b, 130, 590, 5), true);
  const removed = total - solid(b);
  assert.ok(removed > 200 && removed < 330, `removed ${removed}`);
  assert.equal(at(b, 30, 30), 0);
  assert.equal(at(b, 30 + 8, 30), 0, 'radius 5 + 4 reaches 8 px out');
  assert.equal(at(b, 30 + 14, 30), 1, 'but not 14');
});

test('a carved hole lets the same shot through', () => {
  const b = fresh();
  assert.equal(hitBunker(b, 130, 590, 5), true);
  assert.equal(hitBunker(b, 130, 590, 5), false);
  assert.equal(hitBunker(b, 130, 593, 5), false, 'a little off-centre too');
  assert.equal(hitBunker(b, 130, 590, 20), true, 'a bigger projectile still touches the rim');
});

test('a projectile touching the edge from outside hits; bounds never throw', () => {
  const b = fresh();
  assert.equal(hitBunker(b, 100 - 4, 590, 5), true);
  assert.equal(hitBunker(b, -5000, 590, 5), false);
  assert.equal(hitBunker(b, 100, 9999, 5), false);
});

test('carveRect clears exactly the pixels whose centres lie inside, and counts them', () => {
  const b = fresh();
  const total = solid(b);
  const n = carveRect(b, 130, 140, 570, 600);
  assert.equal(total - solid(b), n);
  assert.equal(n, 10 * 30, 'ten columns, thirty rows');
  assert.equal(carveRect(b, 130, 140, 570, 600), 0, 'nothing left to carve');
  assert.equal(carveRect(b, 0, 50, 0, 50), 0, 'outside the bunker');
});

test('a bunker keeps count of its solid pixels through hits and carves (the view reads it)', () => {
  const b = fresh();
  assert.equal(b.solid, solid(b));
  for (const x of [100, 130, 160, 190]) hitBunker(b, x, 575, 8);
  carveRect(b, 200, 230, 560, 620);
  assert.ok(b.solid < b.w * b.h && b.solid === solid(b), `counted ${b.solid}, mask has ${solid(b)}`);
});

test('sweepBunkers follows the whole path, so a 12000 px/s bullet cannot tunnel', () => {
  const b = fresh();
  const p = { x: 130, y: 650, vx: 0, vy: 12000, r: 5 };
  const hit = sweepBunkers([b], p, 1 / 60);
  assert.ok(hit, 'path 450 -> 650 crosses the bunker (560-620)');
  assert.ok(hit.y < 575, `hit at the top, got ${hit.y}`);
  assert.ok(solid(b) < solid(fresh()));
  assert.equal(sweepBunkers([fresh()], { x: 700, y: 650, vx: 0, vy: 12000, r: 5 }, 1 / 60), null);
});

test('levels with bunkers: true place 4 solid bunkers at y 560, clear of each other and the edges', () => {
  const { bunkers } = createWorld(lv(), 1);
  assert.equal(bunkers.length, 4);
  assert.equal(createWorld(level([wave()]), 1).bunkers.length, 0);
  assert.equal(BUNKER.y, 560);
  for (const [i, b] of bunkers.entries()) {
    assert.equal(b.y, 560);
    assert.ok(b.x >= 0 && b.x + b.w <= 1920);
    assert.ok(b.y + b.h <= 620, 'above the player zone');
    if (i) assert.ok(b.x >= bunkers[i - 1].x + bunkers[i - 1].w + 100, 'room to slip between');
    assert.deepEqual(b.mask, fresh().mask);
  }
});

test('a ship shot is stopped by a bunker and erodes it', () => {
  const w = playing(lv());
  const b = w.bunkers[0];
  const total = solid(b);
  w.shots.push({ pattern: 'shot', x: b.x + 30, y: 640, vx: 0, vy: -1400, r: 5, life: 1, dmg: 1 });
  step(w);
  assert.equal(w.shots.length, 0);
  assert.ok(solid(b) < total);
  assert.equal(ofType(drain(w), 'bunker').length, 1);
});

test('an enemy bullet is stopped by a bunker before it reaches the ship behind it', () => {
  const w = playing(lv());
  const b = w.bunkers[0];
  w.ship.x = b.x + 30;
  const total = solid(b);
  bulletAt(w, b.x + 30, 480, 0, 400);
  step(w, 90);
  assert.equal(w.ship.lives, 3);
  assert.equal(w.bullets.length, 0);
  assert.ok(solid(b) < total);
});

test('a fast bullet cannot skip a bunker between two ticks, even with the ship right behind it', () => {
  const w = playing(lv());
  const b = w.bunkers[0];
  w.ship.x = b.x + 30;
  w.ship.y = 640;
  bulletAt(w, b.x + 30, 450, 0, 12000); // 450 -> 650 in one tick: through the bunker onto the ship
  step(w);
  assert.equal(w.bullets.length, 0);
  assert.ok(solid(b) < solid(fresh()));
  assert.equal(w.ship.lives, 3, 'the bunker was met first');
});

test('once a column is carved through, bullets reach the ship; before that they do not', () => {
  const w = playing(lv());
  const b = w.bunkers[0];
  w.ship.x = b.x + 30;
  let fired = 0;
  while (w.ship.lives === 3 && fired < 40) {
    bulletAt(w, b.x + 30, 480, 0, 600);
    fired++;
    step(w, 60);
    w.ship.invuln = 0;
  }
  assert.equal(w.ship.lives, 2, 'a bullet finally got through');
  assert.ok(fired > 2 && fired < 40, `after ${fired} bullets`);
});

test('an enemy laser burns straight through bunkers: it still hits the ship and carves nothing', () => {
  const w = playing(lv());
  const b = w.bunkers[0];
  w.ship.x = b.x + 30;
  const total = solid(b);
  w.bullets.push(...emitPattern('laser', { x: b.x + 30, y: b.y + 30 }, w.ship, { speed: 400 }, w.rng));
  step(w, 60);
  assert.equal(w.ship.lives, 2);
  assert.equal(solid(b), total);
});
