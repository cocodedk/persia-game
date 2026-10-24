import { test } from 'node:test';
import assert from 'node:assert/strict';
import { level, wave, step, seconds, playing, drain, ofType, shotAt, bulletAt } from './world-kit.js';

const armored = (twist) => level([wave({ roles: ['armored'], cols: 3 })], 0, { twist });

// Shoot the first armored alien dead (its hp is 3 at d = 0).
function killOne(w) {
  const a = w.aliens[0];
  a.hp = 1;
  shotAt(w, a);
  step(w);
  return a;
}

test('acid: an armored death drops 3 slow acid bullets over 2 s, and only an armored one', () => {
  const w = playing(armored('acid'));
  const a = killOne(w);
  const x = a.x;
  seconds(w, 2.1);
  const acid = w.bullets.filter((b) => b.pattern === 'acid');
  assert.equal(acid.length, 3);
  assert.ok(acid.every((b) => b.vx === 0 && b.vy > 60 && b.vy <= 120 && b.r >= 8), 'slow and fat');
  assert.ok(acid.every((b) => b.x === x), 'they drip from where it fell');
  const drops = ofType(drain(w), 'acid');
  assert.equal(drops.length, 3);
  const span = (drops[2].tick - drops[0].tick) / 60;
  assert.ok(span > 1 && span <= 2, `the drops span ${span} s`);
  assert.ok(acid[0].y > acid[2].y, 'one after another');
  seconds(w, 4);
  assert.equal(w.bullets.filter((b) => b.pattern === 'acid').length, 3, 'no more than 3');
});

test('acid: a grunt dies without a drip, and acid in a world without the twist does not happen', () => {
  const w = playing(level([wave({ roles: ['grunt'] })], 0, { twist: 'acid' }));
  shotAt(w, w.aliens[0]);
  seconds(w, 3);
  assert.equal(w.bullets.length, 0);
  const plain = playing(armored('bunkers'));
  killOne(plain);
  seconds(plain, 3);
  assert.equal(plain.bullets.length, 0);
});

test('acid hurts the ship like any bullet', () => {
  const w = playing(armored('acid'));
  const a = killOne(w);
  w.ship.x = a.x;
  w.ship.y = a.y + 150;
  seconds(w, 9);
  assert.ok(w.ship.lives <= 2, 'a ship that sits under the drip is hit (slow acid lingers, so maybe twice)');
  assert.equal(ofType(drain(w), 'shipHit')[0].source, 'acid');
});

// A grunt row with one hole in it: the hole is the free slot a blink can take.
const holed = () => {
  const w = playing(level([wave({ cols: 4 })], 0, { twist: 'glitch' }));
  shotAt(w, w.aliens[1]);
  step(w);
  return w;
};
const slotsOf = (w) => w.aliens.map((a) => a.slot.col);

test('glitch: a holding alien blinks to a free slot every 3 to 5 s, with a teleport event', () => {
  const w = holed();
  drain(w);
  const before = w.aliens.map((a) => [a.id, a.slot.col]);
  seconds(w, 40);
  const tps = ofType(drain(w), 'teleport');
  assert.ok(tps.length >= 8 && tps.length <= 14, `${tps.length} blinks in 40 s`);
  for (let i = 1; i < tps.length; i++) {
    const gap = (tps[i].tick - tps[i - 1].tick) / 60;
    assert.ok(gap >= 3 - 0.05 && gap <= 5 + 0.05, `gap ${gap}`);
  }
  assert.ok(tps.every((e) => typeof e.id === 'number' && e.fromX !== e.x), 'from and to');
  assert.equal(new Set(slotsOf(w)).size, 3, 'no two aliens ever share a slot');
  assert.equal(w.aliens.length, 3);
  assert.notDeepEqual(w.aliens.map((a) => [a.id, a.slot.col]), before);
});

test('glitch: the blinked alien lands on the free slot at once; with no free slot nothing blinks', () => {
  const w = holed();
  const hole = [0, 1, 2, 3].find((c) => !slotsOf(w).includes(c));
  drain(w);
  seconds(w, 5.2);
  const [tp] = ofType(drain(w), 'teleport');
  const a = w.aliens.find((x) => x.id === tp.id);
  assert.equal(a.slot.col, hole);
  assert.equal(a.slot.role, 'grunt');
  const full = playing(level([wave({ cols: 4 })], 0, { twist: 'glitch' }));
  seconds(full, 30);
  assert.equal(ofType(drain(full), 'teleport').length, 0);
});

// A bullet that skims past the ship: a near miss.
function nearMiss(w) {
  drain(w);
  bulletAt(w, w.ship.x + 25, w.ship.y - 80, 0, 600);
  for (let i = 0; i < 30 && !ofType(w.events, 'nearMiss').length; i++) step(w);
}

test('glitch: a near miss starts bullet time, 0.5x for 2 s on aliens and enemy bullets, then 8 s of cooldown', () => {
  const w = playing(level([wave({ formation: 'sway', cols: 3 })], 0, { twist: 'glitch' }));
  const clock = w.march.clock;
  seconds(w, 1);
  const normal = w.march.clock - clock;
  nearMiss(w);
  const start = w.tick;
  assert.ok(w.slow > 1.9 && w.slow <= 2, `slow ${w.slow}`);
  assert.deepEqual(ofType(drain(w), 'bulletTime').map((e) => e.on), [true]);
  bulletAt(w, 300, 100, 0, 100);
  const slowBullet = w.bullets.at(-1);
  const c0 = w.march.clock;
  seconds(w, 1);
  assert.ok(Math.abs(slowBullet.y - 150) < 1, `a bullet moved ${slowBullet.y - 100} px in 1 s of bullet time`);
  assert.ok(Math.abs((w.march.clock - c0) - normal / 2) < 0.03, 'the formation at half speed');
  const shot = { pattern: 'shot', x: 100, y: 900, vx: 0, vy: -1400, r: 5, life: 1, dmg: 1 };
  w.shots.push(shot);
  step(w);
  assert.ok(Math.abs(900 - shot.y - 1400 / 60) < 1e-9, 'the ship\'s own shots are not slowed');
  seconds(w, 1.2);
  assert.equal(w.slow, 0);
  assert.deepEqual(ofType(drain(w), 'bulletTime').map((e) => e.on), [false]);
  nearMiss(w);
  assert.equal(w.slow, 0, 'cooldown: no second bullet time within 8 s');
  seconds(w, 8 - (w.tick - start) / 60 + 0.1);
  nearMiss(w);
  assert.ok(w.slow > 1.9, 'and again once the cooldown is over');
});

test('glitch: near misses mean nothing in a world without the twist', () => {
  const w = playing(level([wave()], 0, { twist: 'bunkers' }));
  nearMiss(w);
  assert.equal(w.slow, 0);
});
