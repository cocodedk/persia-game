import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stepBullet, laserSegment, laserHits, LASER_WARN, LASER_BEAM, EMIT } from '../../src/core/patterns.js';
import { FROM, AIM, emit } from './pattern-kit.js';

test('stepBullet integrates position and counts life down', () => {
  const [b] = emit('aimed');
  const { x, y, vx, vy, life } = b;
  stepBullet(b, 0.5);
  assert.ok(Math.abs(b.x - (x + vx * 0.5)) < 1e-9 && Math.abs(b.y - (y + vy * 0.5)) < 1e-9);
  assert.ok(Math.abs(b.life - (life - 0.5)) < 1e-12);
});

test('life counts down to zero on every pattern', () => {
  for (const name of Object.keys(EMIT)) {
    for (const b of emit(name)) {
      for (let i = 0; i < 60 * 12; i++) stepBullet(b, 1 / 60);
      assert.ok(b.life <= 0, name);
    }
  }
});

test('laser is one stationary warning line for 0.8 s, then a 0.6 s beam, aim fixed at the start', () => {
  const list = emit('laser');
  assert.equal(list.length, 1);
  const [b] = list;
  assert.equal(b.warn, LASER_WARN);
  assert.equal(LASER_WARN, 0.8);
  assert.equal(LASER_BEAM, 0.6);
  assert.equal(b.r, 9, 'half the 18 px beam width');
  assert.ok(Math.abs(Math.atan2(b.vy, b.vx) - AIM) < 1e-12);
  const onLine = { x: 900, y: 600 };
  const ship = { ...onLine };
  for (let i = 0; i < 47; i++) {
    stepBullet(b, 1 / 60);
    assert.ok(!laserHits(b, ship, 14), 'harmless during the warning');
  }
  assert.deepEqual([b.x, b.y], [FROM.x, FROM.y], 'a laser never moves');
  assert.ok(Math.abs(Math.atan2(b.vy, b.vx) - AIM) < 1e-12, 'a laser never re-aims');
  for (let i = 0; i < 3; i++) stepBullet(b, 1 / 60);
  assert.equal(b.warn, 0);
  assert.ok(laserHits(b, ship, 14), 'a beam hits a ship on the line');
  for (let i = 0; i < 33; i++) stepBullet(b, 1 / 60);
  assert.ok(b.life <= 1e-9 || laserHits(b, ship, 14), 'the beam lasts about 0.6 s');
  for (let i = 0; i < 3; i++) stepBullet(b, 1 / 60);
  assert.ok(b.life <= 0 && !laserHits(b, ship, 14), 'then it is gone');
});

test('laser hit = ship centre within 9 + 14 px of the segment, which runs to the screen edge', () => {
  const b = { ...emit('laser')[0], x: 960, y: 100, vx: 0, vy: 1, warn: 0, life: 0.3 };
  const seg = laserSegment(b);
  assert.deepEqual(seg, { x1: 960, y1: 100, x2: 960, y2: 1080 });
  assert.ok(laserHits(b, { x: 960 + 22.9, y: 700 }, 14));
  assert.ok(!laserHits(b, { x: 960 + 23.1, y: 700 }, 14));
  assert.ok(laserHits(b, { x: 960, y: 1070 }, 14), 'reaches the bottom edge');
  assert.ok(!laserHits(b, { x: 960, y: 60 }, 14), 'does not extend behind the emitter');
  const slant = laserSegment({ ...b, x: 0, y: 0, vx: 1, vy: 1 });
  assert.ok(Math.abs(slant.x2 - 1080) < 1e-9 && Math.abs(slant.y2 - 1080) < 1e-9);
});
