import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FIRE, level, wave, input, step, seconds, playing, drain, ofType, shotAt, bulletAt } from './world-kit.js';

const armored = (twist) => level([wave({ roles: ['armored'], cols: 3 })], 0, { twist });

// Shoot the first armored alien dead (its hp is 3 at d = 0).
function killOne(w) {
  const a = w.aliens[0];
  a.hp = 1;
  shotAt(w, a);
  step(w);
  return a;
}

test('reassemble: an armored death leaves a wreck for 2 s, and an unshot wreck stands up as a 2 hp armored alien', () => {
  const w = playing(armored('reassemble'));
  const a = killOne(w);
  assert.equal(w.aliens.length, 2);
  assert.equal(w.wrecks.length, 1);
  assert.deepEqual([w.wrecks[0].hp, w.wrecks[0].x, w.wrecks[0].y, w.wrecks[0].left], [1, a.x, a.y, 2 - 1 / 60]);
  assert.equal(ofType(drain(w), 'wreck').length, 1);
  seconds(w, 1.9);
  assert.equal(w.wrecks.length, 1);
  seconds(w, 0.2);
  assert.equal(w.wrecks.length, 0);
  assert.equal(w.aliens.length, 3);
  const back = w.aliens.find((x) => x.reborn);
  assert.deepEqual([back.role, back.hp, back.mode], ['armored', 2, 'hold']);
  assert.deepEqual([back.slot.row, back.slot.col], [a.slot.row, a.slot.col]);
  assert.equal(ofType(drain(w), 'reassemble').length, 1);
});

test('reassemble: a wreck hangs in the formation, so the alien stands up where the wreck was', () => {
  const w = playing(level([wave({ formation: 'sway', roles: ['armored'], cols: 3 })], 0, { twist: 'reassemble' }));
  killOne(w);
  const x0 = w.wrecks[0].x;
  seconds(w, 1.5);
  assert.ok(Math.abs(w.wrecks[0].x - x0) > 20, 'it sways with the others');
  seconds(w, 0.55);
  const back = w.aliens.find((a) => a.reborn);
  const [x, y] = [back.x, back.y];
  step(w);
  assert.ok(Math.hypot(back.x - x, back.y - y) < 6, 'no pop when it stands up');
});

test('reassemble: a shot wreck is gone for good, and a reborn alien leaves no second wreck', () => {
  const w = playing(armored('reassemble'));
  killOne(w);
  shotAt(w, w.wrecks[0]);
  step(w);
  assert.equal(w.wrecks.length, 0);
  assert.equal(ofType(drain(w), 'wreckDown').length, 1);
  seconds(w, 3);
  assert.equal(w.aliens.length, 2, 'it did not come back');
  const next = playing(armored('reassemble'));
  killOne(next);
  seconds(next, 2.1);
  const back = next.aliens.find((x) => x.reborn);
  back.hp = 1;
  shotAt(next, back);
  step(next);
  assert.equal(next.wrecks.length, 0, 'once');
});

test('reassemble: a bomb breaks wrecks, and the wave is not clear while any is standing', () => {
  const w = playing(armored('reassemble'));
  for (const a of [...w.aliens]) a.hp = 1;
  for (const a of [...w.aliens]) shotAt(w, a);
  step(w);
  assert.equal(w.wrecks.length, 3);
  assert.equal(ofType(drain(w), 'waveClear').length, 0, 'the wreckage still counts');
  w.ship.bombs = 1;
  step(w, 1, input({ bomb: true }));
  assert.equal(w.wrecks.length, 0);
  assert.equal(ofType(drain(w), 'waveClear').length, 1);
});

test('reassemble: an unshot last wreck stands up and the wave goes on', () => {
  const w = playing(level([wave({ roles: ['armored'], cols: 1 })], 0, { twist: 'reassemble' }));
  killOne(w);
  seconds(w, 1);
  assert.equal(ofType(drain(w), 'waveClear').length, 0);
  seconds(w, 1.2);
  assert.equal(w.aliens.length, 1);
  assert.equal(w.state, 'play');
});

test('gravity: a well at (960, 300) pulls every bullet and shot with 9e6 / max(d^2, 120^2)', () => {
  const w = playing(armored('gravity'));
  assert.deepEqual(w.well, { x: 960, y: 300 });
  bulletAt(w, 1260, 300);
  bulletAt(w, 1020, 300);
  w.shots.push({ pattern: 'shot', x: 660, y: 300, vx: 0, vy: 0, r: 5, life: 1, dmg: 1 });
  step(w);
  const [far, near] = w.bullets;
  assert.ok(Math.abs(far.vx + 100 / 60) < 1e-9, `d = 300: a = 100, got vx ${far.vx}`);
  assert.ok(Math.abs(near.vx + 625 / 60) < 1e-9, `inside 120 px the pull stops growing: ${near.vx}`);
  assert.ok(Math.abs(w.shots[0].vx - 100 / 60) < 1e-9, 'the ship\'s shot is pulled too, the other way');
});

test('gravity: anything within 40 px of the well is absorbed', () => {
  const w = playing(armored('gravity'));
  bulletAt(w, 990, 300);
  bulletAt(w, 1010, 300);
  w.shots.push({ pattern: 'shot', x: 960, y: 335, vx: 0, vy: 0, r: 5, life: 1, dmg: 1 });
  step(w);
  assert.deepEqual(w.bullets.map((b) => b.x), [1010]);
  assert.equal(w.shots.length, 0);
  assert.equal(ofType(drain(w), 'absorb').length, 2);
});

test('gravity bends a straight shot sideways; without it the shot stays straight', () => {
  const run = (twist) => {
    const w = playing(level([wave()], 0, { twist }));
    w.ship.x = 1300;
    w.ship.y = 1000;
    step(w, 1, FIRE);
    let shot;
    for (let i = 0; i < 45; i++) {
      step(w);
      shot = w.shots[0];
      if (shot && shot.y < 250) break;
    }
    return shot;
  };
  const bent = run('gravity');
  assert.ok(bent.x < 1297 && bent.vx < -10, `drifted to x ${bent.x}, vx ${bent.vx}`);
  const straight = run('bunkers');
  assert.deepEqual([straight.x, straight.vx], [1300, 0]);
});

test('gravity leaves a laser alone: its vx, vy are the aim', () => {
  const w = playing(armored('gravity'));
  w.bullets.push({ pattern: 'laser', x: 1100, y: 300, vx: 0, vy: 1, r: 9, life: 2, warn: 1 });
  step(w, 5);
  assert.deepEqual([w.bullets[0].vx, w.bullets[0].vy], [0, 1]);
});
