import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../../src/core/rng.js';
import { createFx, stepFx } from '../../src/fx/fx.js';
import { applyEvent } from '../../src/fx/react.js';
import { TICK, kindsOf, ofKind, react, run } from './fx-kit.js';

const kill = (o) => ({ type: 'kill', id: 1, role: 'gunner', x: 500, y: 300, score: 200, mult: 1, scored: true, ...o });

test('kill makes debris and a pop-up showing the points actually scored (score x combo)', () => {
  const fx = react(kill({ score: 600, mult: 3 }));
  assert.ok(ofKind(fx, 'debris').length > 0);
  assert.equal(fx.popups.length, 1);
  assert.equal(fx.popups[0].text, '+600');
  assert.ok(fx.popups[0].x === 500 && fx.popups[0].y < 300 && fx.popups[0].vy < 0);
});

test('a bigger combo makes a bigger, hotter pop-up', () => {
  const a = react(kill({ mult: 1 })).popups[0];
  const b = react(kill({ mult: 8, score: 1600 })).popups[0];
  assert.ok(b.scale > a.scale);
  assert.notEqual(b.color, a.color);
});

test('a ram (scored false, 0 points) crumbles without a pop-up', () => {
  const fx = react(kill({ score: 0, scored: false }));
  assert.equal(fx.popups.length, 0);
  assert.ok(ofKind(fx, 'debris').length > 0);
});

test('a carrier bursts in gold, richer than a grunt', () => {
  const grunt = react(kill({ role: 'grunt' }));
  const carrier = react(kill({ role: 'carrier', score: 250 }));
  assert.ok(carrier.particles.length > grunt.particles.length);
  assert.ok(ofKind(carrier, 'spark').length > 0);
});

test('explode: flash, shockwave, sparks and smoke; shake and size grow with the size', () => {
  const small = react({ type: 'explode', x: 400, y: 200, size: 1 });
  const ship = react({ type: 'explode', x: 400, y: 800, size: 2 });
  const boss = react({ type: 'explode', x: 960, y: 300, size: 3 });
  for (const fx of [small, ship, boss]) {
    assert.ok(fx.flashes.length >= 1 && fx.rings.length >= 1);
    for (const k of ['spark', 'smoke']) assert.ok(kindsOf(fx).has(k), k);
  }
  assert.ok(ship.shake > small.shake * 2);
  assert.ok(boss.shake > ship.shake);
  assert.ok(boss.rings[0].maxR > ship.rings[0].maxR && ship.rings[0].maxR > small.rings[0].maxR);
  assert.ok(boss.flashes.some((f) => f.full), 'the last blast of a boss lights the whole frame');
  assert.ok(!small.flashes.some((f) => f.full));
  assert.ok(ofKind(small, 'spark').every((p) => p.additive));
  assert.ok(ofKind(small, 'smoke').every((p) => p.grow > 0));
});

test('bomb: a full-screen flash, two shockwaves from the ship, sparks and a shake', () => {
  const fx = react({ type: 'bomb', x: 900, y: 900, cleared: 7, left: 1 });
  const full = fx.flashes.filter((f) => f.full);
  assert.equal(full.length, 1);
  assert.equal(full[0].tag, 'bomb');
  assert.ok(full[0].alpha >= 0.8);
  assert.ok(fx.rings.length >= 2 && fx.rings.every((r) => r.x === 900 && r.y === 900));
  assert.ok(Math.max(...fx.rings.map((r) => r.maxR)) >= 1200, 'the ring crosses the whole frame');
  assert.ok(fx.shake > 10);
  assert.ok(ofKind(fx, 'spark').length > 0);
});

test('shipHit: a red flash over the frame, a ring, sparks and a hard shake', () => {
  const fx = react({ type: 'shipHit', x: 700, y: 900, lives: 2, source: 'aimed' });
  const hurt = fx.flashes.find((f) => f.tag === 'hurt');
  assert.ok(hurt && hurt.full);
  assert.ok(hurt.alpha < 0.7, 'red wash stays readable');
  assert.equal(fx.rings[0].x, 700);
  assert.ok(fx.shake >= 10);
  assert.ok(ofKind(fx, 'spark').length > 0);
});

test('hit: sparks at the impact, more and paler on a plate than on a plain alien', () => {
  const plain = react({ type: 'hit', id: 3, role: 'gunner', x: 300, y: 200, hp: 1, dmg: 1 });
  const plate = react({ type: 'hit', id: 'capL', role: 'boss', part: 'capL', x: 300, y: 200, hp: 5, dmg: 0.25, weak: false });
  assert.ok(plain.particles.length > 0 && plain.particles.every((p) => p.kind === 'spark'));
  assert.ok(plate.particles.length >= plain.particles.length);
  assert.ok(plain.particles.every((p) => Math.abs(p.x - 300) < 1 && Math.abs(p.y - 200) < 1));
});

test('fire: a muzzle flash at the gun, ship and enemy alike; no particles', () => {
  const ship = react({ type: 'fire', side: 'ship', x: 800, y: 950, power: null });
  const enemy = react({ type: 'fire', side: 'enemy', id: 4, role: 'gunner', x: 400, y: 300, pattern: 'aimed' });
  const beam = react({ type: 'fire', side: 'ship', x: 800, y: 950, power: 'laser' });
  assert.equal(ship.flashes.length, 1);
  assert.equal(enemy.flashes.length, 1);
  assert.equal(ship.particles.length + enemy.particles.length, 0);
  assert.ok(beam.flashes[0].r > ship.flashes[0].r, 'the beam starting is bigger than a bullet');
  assert.notEqual(ship.flashes[0].color, enemy.flashes[0].color);
});

test('nearMiss: a small glint where the bullet passed', () => {
  const fx = react({ type: 'nearMiss', x: 600, y: 800, dist: 20 });
  assert.ok(fx.rings.length === 1 && fx.particles.length > 0 && fx.particles.length <= 6);
});

test('waveClear: slow motion, a soft flash and a label; the last wave leaves the label to the clear bonus', () => {
  const mid = react({ type: 'waveClear', wave: 1, last: false });
  const last = react({ type: 'waveClear', wave: 3, last: true });
  assert.equal(mid.slow, 0.3);
  assert.equal(last.slow, 0.3);
  assert.equal(mid.popups.length, 1);
  assert.equal(last.popups.length, 0);
  assert.ok(mid.flashes.length === 1 && last.flashes.length === 1);
});

test('cleared: the bonus floats up; failed is for the screens, not for fx', () => {
  const cleared = react({ type: 'cleared', score: 9000, bonus: 5000, stars: 3 });
  assert.equal(cleared.popups.length, 1);
  assert.match(cleared.popups[0].text, /5000/);
  const failed = react({ type: 'failed', score: 100 });
  assert.equal(failed.particles.length + failed.flashes.length + failed.popups.length, 0);
});

test('shieldHit: a flare at the ship, throttled so a burning beam cannot flood', () => {
  const rng = makeRng(3);
  const ev = { type: 'shieldHit', x: 900, y: 900, source: 'laser' };
  const fx = createFx();
  applyEvent(fx, ev, rng);
  assert.equal(fx.rings.length, 1, 'the first hit flares at once');
  applyEvent(fx, ev, rng);
  assert.equal(fx.rings.length, 1, 'the same instant adds nothing');
  // a 0.6 s laser sends a shieldHit on every tick: 36 events
  const burn = createFx();
  let flares = 0;
  for (let i = 0; i < 36; i++) {
    const before = burn.rings.length;
    applyEvent(burn, ev, rng);
    if (burn.rings.length > before) flares++;
    stepFx(burn, TICK);
  }
  assert.ok(flares >= 3 && flares <= 5, `${flares} flares in 0.6 s`);
  assert.ok(burn.particles.length < 40 && burn.rings.length <= 2);
});

test('shieldHit flares again once the gap has passed', () => {
  const fx = createFx();
  const rng = makeRng(3);
  const ev = { type: 'shieldHit', x: 900, y: 900, source: 'aimed' };
  applyEvent(fx, ev, rng);
  run(fx, 0.2);
  const before = fx.flashes.length + fx.rings.length;
  applyEvent(fx, ev, rng);
  assert.ok(fx.flashes.length + fx.rings.length > before);
});
