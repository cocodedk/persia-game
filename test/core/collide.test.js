import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emitPattern } from '../../src/core/patterns.js';
import { INVULN } from '../../src/core/ship.js';
import {
  level, wave, step, seconds, playing, drain, ofType, shotAt, bulletAt, bulletOnShip,
} from './world-kit.js';

const lv = (roles, d = 0, cols = 3) => level([wave({ rows: roles.length, cols, roles })], d);

test('a shot kills a 1-hp grunt and is spent', () => {
  const w = playing(lv(['grunt'], 0, 4));
  const [a] = w.aliens;
  shotAt(w, a);
  step(w);
  assert.equal(w.aliens.length, 3);
  assert.ok(!w.aliens.includes(a));
  assert.equal(w.shots.length, 0);
  const ev = drain(w);
  assert.equal(ofType(ev, 'kill').length, 1);
  assert.equal(ofType(ev, 'explode').length, 1);
});

test('an armored alien needs 3 hits, and shows each one', () => {
  const w = playing(lv(['armored'], 0, 2));
  const a = w.aliens[0];
  for (const left of [2, 1]) {
    shotAt(w, a);
    step(w);
    assert.equal(a.hp, left);
    assert.ok(w.aliens.includes(a));
    const [hit] = ofType(drain(w), 'hit');
    assert.deepEqual([hit.id, hit.hp], [a.id, left]);
  }
  shotAt(w, a);
  step(w);
  assert.ok(!w.aliens.includes(a));
  assert.equal(ofType(drain(w), 'kill').length, 1);
});

// A shot that crosses 100 px in one tick: it starts 40 px below `a` and ends 60 px above it.
const fastShotAt = (w, a) =>
  w.shots.push({ pattern: 'shot', x: a.x, y: a.y + 40, vx: 0, vy: -6000, r: 5, life: 1, dmg: 1 });

test('a shot meets the nearest alien on its way, not the first in the list', () => {
  const w = playing(level([wave({ rows: 2, cols: 1, roles: ['grunt', 'grunt'] })]));
  const [top, low] = w.aliens;
  fastShotAt(w, low);
  step(w);
  assert.deepEqual(w.aliens.map((a) => a.id), [top.id], 'the lower alien took the shot, not the top one');
});

test('a very fast shot cannot tunnel through an alien', () => {
  const w = playing(lv(['grunt'], 0, 4));
  const a = w.aliens[0];
  fastShotAt(w, a);
  step(w);
  assert.ok(!w.aliens.includes(a), 'it ended 60 px past the alien, further than the hit circle');
});

test('one shot hits one alien even when several overlap it', () => {
  const w = playing(lv(['grunt'], 0, 40));
  assert.equal(w.aliens.length, 40);
  shotAt(w, w.aliens[20]);
  step(w);
  assert.equal(w.aliens.length, 39);
  assert.ok(!w.aliens.some((a) => a.id === 21), 'the one in front of the shot died');
});

test('a bullet hit costs a life, gives 1.5 s of invulnerability, and spends bullets meanwhile', () => {
  const w = playing(lv(['grunt'], 0, 4));
  bulletOnShip(w);
  step(w);
  assert.equal(w.ship.lives, 2);
  assert.equal(w.hits, 1);
  assert.ok(w.ship.invuln > INVULN - 0.05 && w.ship.invuln <= INVULN);
  assert.equal(w.bullets.length, 0, 'the bullet is spent');
  const [hit] = ofType(drain(w), 'shipHit');
  assert.equal(hit.lives, 2);
  bulletOnShip(w); // a lingering bullet (slow, homing) parked on the ship
  seconds(w, 1.2);
  assert.equal(w.ship.lives, 2, 'no second hit while invulnerable');
  assert.equal(w.bullets.length, 0, 'a bullet that touches a blinking ship is spent');
  seconds(w, 0.4);
  assert.equal(w.ship.lives, 2, 'so it cannot hurt once the blinking ends');
  assert.equal(ofType(drain(w), 'shipHit').length, 0);
});

test('the hit circle is 14 px plus the bullet radius', () => {
  const w = playing(lv(['grunt'], 0, 4));
  const { x, y } = w.ship;
  bulletAt(w, x + 22.5, y);
  step(w);
  assert.equal(w.ship.lives, 3);
  bulletAt(w, x + 21.5, y);
  step(w);
  assert.equal(w.ship.lives, 2);
});

test('0 lives fails the level and freezes the world', () => {
  const w = playing(lv(['grunt'], 0, 4));
  for (let i = 0; i < 3; i++) {
    bulletOnShip(w);
    seconds(w, 1.6);
  }
  assert.equal(w.state, 'failed');
  assert.equal(w.ship.alive, false);
  assert.equal(w.ship.lives, 0);
  const ev = drain(w);
  assert.equal(ofType(ev, 'failed').length, 1);
  assert.equal(ofType(ev, 'explode').length, 1, 'the ship goes up once');
  const { tick, t } = w;
  step(w, 30);
  assert.deepEqual([w.tick, w.t, w.state], [tick, t, 'failed']);
});

test('a bullet grazing the ship emits nearMiss once, and a hit or a clear miss emits none', () => {
  const run = (offset) => {
    const w = playing(lv(['grunt'], 0, 4));
    bulletAt(w, w.ship.x - 300, w.ship.y - offset, 400, 0);
    seconds(w, 1.5);
    return { w, ev: drain(w) };
  };
  const near = run(25);
  assert.equal(ofType(near.ev, 'nearMiss').length, 1);
  assert.equal(ofType(near.ev, 'shipHit').length, 0);
  const [m] = ofType(near.ev, 'nearMiss');
  assert.ok(m.dist > 22 && m.dist <= 28, `closest approach ${m.dist}`);
  assert.equal(ofType(run(10).ev, 'nearMiss').length, 0, 'a hit is not a near miss');
  assert.equal(ofType(run(10).ev, 'shipHit').length, 1);
  assert.equal(ofType(run(60).ev, 'nearMiss').length, 0);
});

test('nearMiss is per bullet: three bullets, three events; none for a fast bullet that skips the band', () => {
  const w = playing(lv(['grunt'], 0, 4));
  for (const dy of [24, 25, 26]) bulletAt(w, w.ship.x - 200, w.ship.y - dy, 500, 0);
  seconds(w, 1);
  assert.equal(ofType(drain(w), 'nearMiss').length, 3);
  bulletAt(w, w.ship.x - 600, w.ship.y - 26, 3000, 0);
  seconds(w, 1);
  assert.equal(ofType(drain(w), 'nearMiss').length, 1, 'swept, so speed cannot hop over the band');
});

test('a bullet spent on a blinking ship is not a near miss', () => {
  const w = playing(lv(['grunt'], 0, 4));
  w.ship.invuln = 5;
  bulletAt(w, w.ship.x - 100, w.ship.y, 300, 0);
  seconds(w, 1.5);
  assert.equal(ofType(drain(w), 'nearMiss').length, 0);
});

test('a laser warns harmlessly for 0.8 s, then burns whoever is on the line', () => {
  const w = playing(lv(['grunt'], 0, 4));
  const [beam] = emitPattern('laser', { x: w.ship.x, y: 100 }, w.ship, { speed: 400 }, w.rng);
  w.bullets.push(beam);
  seconds(w, 0.7);
  assert.equal(w.ship.lives, 3, 'the warning line hits nothing');
  seconds(w, 0.2);
  assert.equal(w.ship.lives, 2, 'the beam does');
  assert.equal(ofType(drain(w), 'nearMiss').length, 0, 'lasers never count for nearMiss');
  w.ship.x += 200;
  w.ship.invuln = 0;
  seconds(w, 0.3);
  assert.equal(w.ship.lives, 2, 'a ship off the line is safe');
});

test('a diver that rams the ship costs a life and dies for no points', () => {
  const w = playing(level([wave({ formation: 'sway', cols: 3, roles: ['diver'] })]));
  const a = w.aliens[0];
  a.mode = 'dive';
  a.t = 0;
  a.dive = { fx: a.x, fy: a.y, ax: w.ship.x, ay: w.ship.y };
  seconds(w, 1.3);
  assert.equal(w.ship.lives, 2);
  assert.ok(!w.aliens.includes(a));
  assert.equal(w.score, 0);
  const [kill] = ofType(drain(w), 'kill');
  assert.deepEqual([kill.score, kill.scored], [0, false]);
});
