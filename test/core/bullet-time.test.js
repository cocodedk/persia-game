import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SLOW_TIME, SLOW_COOL, enemyDt } from '../../src/core/bullet-time.js';
import { TICK, level, wave, step, seconds, playing, drain, ofType, bulletAt, shotFrom } from './world-kit.js';

// A quiet world whose formation sways, so its clock shows how fast the aliens move.
const swaying = () => playing(level([wave({ formation: 'sway', cols: 3 })]));

// A bullet that skims past the ship: a near miss.
function nearMiss(w) {
  drain(w);
  bulletAt(w, w.ship.x + 25, w.ship.y - 80, 0, 600);
  for (let i = 0; i < 30 && !ofType(w.events, 'nearMiss').length; i++) step(w);
}

test('a near miss starts bullet time and emits bulletTime on', () => {
  const w = swaying();
  assert.equal(w.slow, 0);
  nearMiss(w);
  assert.ok(w.slow > SLOW_TIME - 0.05 && w.slow <= SLOW_TIME, `slow ${w.slow}`);
  assert.deepEqual(ofType(drain(w), 'bulletTime').map((e) => e.on), [true]);
});

test('enemies move at the slowed enemyDt, and the ship\'s own shots do not', () => {
  const w = swaying();
  const clock = w.march.clock;
  seconds(w, 1);
  const normal = w.march.clock - clock;
  nearMiss(w);
  assert.equal(enemyDt(w, TICK), TICK / 2);
  bulletAt(w, 300, 100, 0, 100);
  const bullet = w.bullets.at(-1);
  const c0 = w.march.clock;
  seconds(w, 1);
  assert.ok(Math.abs(bullet.y - 150) < 1, `a bullet moved ${bullet.y - 100} px in 1 s of bullet time`);
  assert.ok(Math.abs((w.march.clock - c0) - normal / 2) < 0.03, 'the formation at half speed');
  const shot = shotFrom(w, 100, 900);
  step(w);
  assert.ok(Math.abs(900 - shot.y - 1400 / 60) < 1e-9, 'the ship\'s own shots are not slowed');
});

test('it ends after SLOW_TIME and emits bulletTime off', () => {
  const w = swaying();
  nearMiss(w);
  drain(w);
  seconds(w, SLOW_TIME - 0.1);
  assert.ok(w.slow > 0, 'still on');
  assert.deepEqual(ofType(drain(w), 'bulletTime'), []);
  seconds(w, 0.2);
  assert.equal(w.slow, 0);
  assert.equal(enemyDt(w, TICK), TICK);
  assert.deepEqual(ofType(drain(w), 'bulletTime').map((e) => e.on), [false]);
});

test('no second start inside SLOW_COOL, and a near miss after it starts it again', () => {
  const w = swaying();
  nearMiss(w);
  const start = w.tick;
  seconds(w, SLOW_TIME + 0.2);
  nearMiss(w);
  assert.equal(w.slow, 0, `cooldown: no second bullet time within ${SLOW_COOL} s`);
  seconds(w, SLOW_COOL - (w.tick - start) / 60 + 0.1);
  nearMiss(w);
  assert.ok(w.slow > SLOW_TIME - 0.05, 'and again once the cooldown is over');
});
