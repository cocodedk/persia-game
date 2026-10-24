import { test } from 'node:test';
import assert from 'node:assert/strict';
import { POWERS } from '../../src/core/kinds.js';
import { hurtAlien } from '../../src/core/aliens.js';
import { createWorld } from '../../src/core/world.js';
import {
  FIRE, level, wave, input, step, seconds, playing, drain, ofType, shotAt, bulletOnShip, pickupAt, pickupOnShip,
} from './world-kit.js';

const lv = (roles = ['grunt']) => level([wave({ rows: roles.length, cols: 3, roles })]);

test('a carrier that dies drops a pickup: radius 22, falling at 160 px/s, where it died', () => {
  const w = playing(lv(['carrier']));
  const [a] = w.aliens;
  shotAt(w, a);
  step(w);
  assert.equal(w.pickups.length, 1);
  const [p] = w.pickups;
  assert.ok([...POWERS, 'bomb'].includes(p.kind), p.kind);
  assert.deepEqual([p.r, p.vy], [22, 160]);
  assert.deepEqual([p.x, p.y], [a.x, a.y]);
});

test('a drop lands inside the ship\'s reach even when the carrier died at the screen edge', () => {
  const w = playing(lv());
  hurtAlien(w, { id: 90, role: 'carrier', x: 3, y: 200, hp: 1 }, 1);
  hurtAlien(w, { id: 91, role: 'carrier', x: 1915, y: 200, hp: 1 }, 1);
  assert.deepEqual(w.pickups.map((p) => p.x), [40, 1880]);
});

test('only carriers drop', () => {
  const w = playing(lv(['grunt', 'gunner']));
  for (const a of [...w.aliens]) hurtAlien(w, a, 9);
  assert.equal(w.pickups.length, 0);
});

test('1000 seeded carrier deaths: about 20 % bombs, the rest spread over all four powers', () => {
  const w = createWorld(lv(['carrier']), 99);
  for (let i = 0; i < 1000; i++) hurtAlien(w, { id: i, role: 'carrier', x: 500, y: 200, hp: 1 }, 1);
  const count = (k) => w.pickups.filter((p) => p.kind === k).length;
  assert.equal(w.pickups.length, 1000);
  assert.ok(count('bomb') >= 160 && count('bomb') <= 240, `bombs ${count('bomb')}`);
  for (const k of POWERS) assert.ok(count(k) >= 140 && count(k) <= 260, `${k} ${count(k)}`);
});

test('a pickup falls 160 px/s and is removed once it has left the screen', () => {
  const w = playing(lv());
  pickupAt(w, 'rapid', 100, 100);
  seconds(w, 1);
  assert.ok(Math.abs(w.pickups[0].y - 260) < 0.5, `y ${w.pickups[0].y}`);
  pickupAt(w, 'rapid', 100, 1095);
  seconds(w, 0.2);
  assert.equal(w.pickups.length, 1, 'the one below the floor is gone');
  assert.equal(w.ship.power, null, 'and was not collected');
});

test('a pickup is collected only when it overlaps the ship (22 + 14 px)', () => {
  const w = playing(lv());
  const { x, y } = w.ship;
  pickupAt(w, 'spread', x + 40, y);
  step(w);
  assert.equal(w.pickups.length, 1, '40 px away: not collected');
  assert.equal(w.ship.power, null);
  pickupAt(w, 'spread', x + 30, y);
  step(w);
  assert.equal(w.pickups.length, 1, 'only the near one was taken');
  assert.equal(w.ship.power.kind, 'spread');
  const ev = drain(w);
  assert.equal(ofType(ev, 'pickup')[0].kind, 'spread');
  assert.deepEqual(ofType(ev, 'power').map((e) => [e.kind, e.on]), [['spread', true]]);
});

test('a power lasts 10 s, then ends with a power event', () => {
  const w = playing(lv());
  pickupOnShip(w, 'rapid');
  step(w);
  assert.ok(w.ship.power.left > 9.9 && w.ship.power.left <= 10);
  seconds(w, 9.7);
  assert.equal(w.ship.power.kind, 'rapid');
  seconds(w, 0.5);
  assert.equal(w.ship.power, null);
  assert.deepEqual(ofType(drain(w), 'power').map((e) => [e.kind, e.on]), [['rapid', true], ['rapid', false]]);
});

test('a new power replaces the current one and restarts the clock', () => {
  const w = playing(lv());
  pickupOnShip(w, 'spread');
  seconds(w, 6);
  assert.ok(w.ship.power.left < 4.1);
  pickupOnShip(w, 'shield');
  step(w);
  assert.equal(w.ship.power.kind, 'shield');
  assert.ok(w.ship.power.left > 9.9);
  seconds(w, 5);
  pickupOnShip(w, 'shield');
  step(w);
  assert.ok(w.ship.power.left > 9.9, 'the same kind again also resets');
});

test('spread fires 5 shots fanned +-20 degrees at full speed; a base shot fires 1', () => {
  const w = playing(lv());
  step(w, 1, FIRE);
  assert.equal(w.shots.length, 1);
  const spread = playing(lv());
  spread.ship.power = { kind: 'spread', left: 10 };
  step(spread, 1, FIRE);
  assert.equal(spread.shots.length, 5);
  const deg = spread.shots.map((s) => Math.round((Math.atan2(s.vx, -s.vy) * 180) / Math.PI));
  assert.deepEqual(deg, [-20, -10, 0, 10, 20]);
  for (const s of spread.shots) assert.ok(Math.abs(Math.hypot(s.vx, s.vy) - 1400) < 1e-6);
  assert.deepEqual(ofType(drain(spread), 'fire').map((e) => e.power), ['spread']);
});

test('rapid cuts the gun cooldown from 0.18 s to 0.07 s', () => {
  const base = playing(lv());
  step(base, 1, FIRE);
  assert.equal(base.ship.cooldown, 0.18);
  const rapid = playing(lv());
  rapid.ship.power = { kind: 'rapid', left: 10 };
  step(rapid, 1, FIRE);
  assert.equal(rapid.ship.cooldown, 0.07);
  seconds(base, 2, FIRE);
  seconds(rapid, 2, FIRE);
  const fired = (w) => ofType(w.events, 'fire').length;
  assert.ok(fired(rapid) > 1.8 * fired(base), `rapid ${fired(rapid)} vs base ${fired(base)}`);
});

test('shield absorbs every hit while active: no life lost, bullet spent, no blink, no hit counted', () => {
  const w = playing(lv());
  w.ship.power = { kind: 'shield', left: 10 };
  for (let i = 0; i < 3; i++) {
    bulletOnShip(w);
    step(w);
  }
  assert.deepEqual([w.ship.lives, w.ship.invuln, w.hits, w.bullets.length], [3, 0, 0, 0]);
  const ev = drain(w);
  assert.equal(ofType(ev, 'shieldHit').length, 3);
  assert.equal(ofType(ev, 'shipHit').length, 0);
});

test('once the shield has run out the next bullet hurts', () => {
  const w = playing(lv());
  w.ship.power = { kind: 'shield', left: 0.02 };
  step(w, 3);
  assert.equal(w.ship.power, null);
  bulletOnShip(w);
  step(w);
  assert.equal(w.ship.lives, 2);
});

test('a world with a power, pickups and bombs survives structuredClone and replays identically', () => {
  const w = playing(lv(['carrier', 'grunt']), { quiet: false });
  w.ship.power = { kind: 'spread', left: 10 };
  pickupAt(w, 'bomb', 700, 300);
  const copy = structuredClone(w);
  for (const world of [w, copy]) seconds(world, 3, input({ fire: true, dx: 1, bomb: true }));
  assert.deepEqual(copy, w);
});
