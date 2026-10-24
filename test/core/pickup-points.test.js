import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  level, wave, step, seconds, playing, drain, ofType, shotAt, pickupAt, pickupOnShip, bulletOnShip,
} from './world-kit.js';
import { bossWorld, leave } from './boss-kit.js';

// R51: a pickup is worth a flat 500 however it is collected, and the clear sweeps up every pickup
// still in the air (a `sweep` event: worth its points, too late for its power or bomb) before
// `cleared` is sent.

const one = () => playing(level([wave({ rows: 1, cols: 1 })]));
const types = (ev) => ev.map((e) => e.type);

test('a caught pickup scores a flat 500: no combo multiplier, the combo untouched', () => {
  const w = playing(level([wave({ rows: 1, cols: 3 })]));
  w.combo.mult = 5;
  w.combo.timer = 1.4;
  for (const kind of ['spread', 'bomb']) {
    const before = w.score;
    pickupOnShip(w, kind);
    step(w);
    assert.equal(w.score - before, 500, kind);
    const [e] = ofType(drain(w), 'pickup');
    assert.deepEqual([e.kind, e.points], [kind, 500]);
  }
  assert.equal(w.combo.mult, 5, 'a pickup is not a kill');
});

test('the clear sweeps up every pickup in the air: scored before `cleared`, none left', () => {
  const w = one();
  const bombs = w.ship.bombs;
  pickupAt(w, 'laser', 200, 150);
  pickupAt(w, 'bomb', 1700, 300);
  shotAt(w, w.aliens[0]);
  const before = w.score;
  step(w);
  assert.equal(w.state, 'cleared');
  const ev = drain(w);
  assert.deepEqual(types(ev).slice(-4), ['waveClear', 'sweep', 'sweep', 'cleared'], 'the order on the clear tick');
  const swept = ofType(ev, 'sweep');
  assert.deepEqual(swept.map((e) => [e.kind, e.points, e.nth]), [['laser', 500, 0], ['bomb', 500, 1]], 'in drop order');
  assert.ok(swept.every((e) => e.y < 400 && e.tick === ev.at(-1).tick), 'from where they were, on the clear tick');
  const [kill] = ofType(ev, 'kill');
  const [done] = ofType(ev, 'cleared');
  assert.equal(done.score, before + kill.score + 2 * 500 + done.bonus, 'the cleared score includes them');
  assert.equal(w.score, done.score);
  assert.equal(w.pickups.length, 0);
  assert.equal(w.ship.power, null, 'no power after the level');
  assert.equal(w.ship.bombs, bombs, 'no bomb after the level');
  assert.equal(ofType(ev, 'power').length + ofType(ev, 'pickup').length, 0, 'none of them caught');
});

test('a level cleared with no pickup in the air ends as before', () => {
  const w = one();
  shotAt(w, w.aliens[0]);
  const before = w.score;
  step(w);
  const ev = drain(w);
  assert.equal(ofType(ev, 'sweep').length, 0);
  assert.equal(ev.at(-1).type, 'cleared');
  const [kill] = ofType(ev, 'kill');
  assert.equal(w.score, before + kill.score + ev.at(-1).bonus);
});

test('a pickup the ship touches on the clear tick is caught as usual, not swept', () => {
  const w = one();
  pickupOnShip(w, 'rapid');
  shotAt(w, w.aliens[0]);
  step(w);
  const ev = drain(w);
  assert.deepEqual([ofType(ev, 'pickup').length, ofType(ev, 'sweep').length], [1, 0]);
  assert.equal(w.ship.power.kind, 'rapid');
});

// R52: the two ties settle() and collide() decide on the clear tick.
test('the clear and the ship\'s last life on one tick: cleared wins, and the pickup in the air is swept', () => {
  const w = one();
  w.ship.lives = 1;
  pickupAt(w, 'laser', 200, 150);
  shotAt(w, w.aliens[0]);
  bulletOnShip(w);
  const before = w.score;
  step(w);
  assert.deepEqual([w.state, w.ship.lives], ['cleared', 0]);
  const ev = drain(w);
  const ends = types(ev).filter((t) => ['shipHit', 'sweep', 'cleared', 'failed'].includes(t));
  assert.deepEqual(ends, ['shipHit', 'sweep', 'cleared']);
  const [kill] = ofType(ev, 'kill');
  assert.equal(w.score, before + kill.score + 500 + ev.at(-1).bonus, 'its 500 counts');
  assert.equal(w.pickups.length, 0);
});

test('a carrier killed on the clear tick drops its pickup, and the sweep takes it at once', () => {
  const w = playing(level([wave({ rows: 1, cols: 1, roles: ['carrier'] })]));
  const [carrier] = w.aliens;
  shotAt(w, carrier);
  const before = w.score;
  step(w);
  assert.equal(w.state, 'cleared');
  const ev = drain(w);
  assert.deepEqual(types(ev).slice(-2), ['sweep', 'cleared']);
  const [swept] = ofType(ev, 'sweep');
  assert.deepEqual([swept.x, swept.y], [carrier.x, carrier.y], 'from where the carrier died');
  assert.equal(ofType(ev, 'pickup').length, 0, 'not caught');
  const [kill] = ofType(ev, 'kill');
  assert.equal(w.score, before + kill.score + 500 + ev.at(-1).bonus);
  assert.equal(w.pickups.length, 0);
});

test('a failed level sweeps nothing: the pickups in the air score nothing', () => {
  const w = one();
  w.ship.lives = 1;
  pickupAt(w, 'spread', 200, 150);
  bulletOnShip(w);
  const before = w.score;
  step(w);
  assert.equal(w.state, 'failed');
  assert.equal(ofType(drain(w), 'sweep').length, 0);
  assert.equal(w.score, before);
});

test('a boss level: the destruction chain ends in the same sweep, before `cleared`', () => {
  const w = bossWorld('giant');
  leave(w, []);
  step(w);
  while (w.boss.dying > 0.5) step(w);
  pickupAt(w, 'shield', 150, 200);
  drain(w);
  const before = w.score;
  seconds(w, 1);
  assert.equal(w.state, 'cleared');
  const ev = drain(w);
  assert.deepEqual(types(ev).slice(-2), ['sweep', 'cleared']);
  assert.equal(w.score, before + 500 + ev.at(-1).bonus);
  assert.equal(w.pickups.length, 0);
});
