import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, stepWorld } from '../../src/core/world.js';
import { levelById } from '../../src/core/levels.js';
import { autopilot } from '../../src/core/autopilot.js';
import { TICK } from '../../src/core/replay.js';
import { level, wave, playing, step, seconds, bulletAt, pickupAt, IDLE } from './world-kit.js';
import { bossWorld } from './boss-kit.js';
import { fly, oneShot, landed } from './autopilot-kit.js';

const oneAlien = (o) => playing(level([wave({ rows: 1, cols: 1, ...o })]));

test('it answers in the shape of a human input: keys in -1..1, booleans, an integer pointer target', () => {
  const world = playing(level([wave({ cols: 5 })]));
  for (let n = 0; n < 5; n++) {
    const i = autopilot(world);
    assert.deepEqual(Object.keys(i).sort(), ['bomb', 'dx', 'dy', 'fire', 'target']);
    assert.ok([-1, 0, 1].includes(i.dx) && [-1, 0, 1].includes(i.dy));
    assert.equal(typeof i.bomb, 'boolean');
    assert.equal(i.fire, true, 'it fires constantly');
    assert.ok(Number.isInteger(i.target.x) && Number.isInteger(i.target.y));
    assert.ok(i.target.x >= 40 && i.target.x <= 1880 && i.target.y >= 620 && i.target.y <= 1040);
    step(world, 1);
  }
});

test('it is a pure function of the world: no mutation, no draw from the world rng, same answer twice', () => {
  for (const id of ['w1-2', 'w4-3', 'w5-5', 'w8-5']) {
    const world = createWorld(levelById(id));
    for (let n = 0; n < 5; n++) {
      step(world, 130);
      const before = structuredClone(world);
      const a = autopilot(world);
      assert.deepEqual(world, before, `${id} was changed`);
      assert.deepEqual(autopilot(structuredClone(world)), a, `${id} answered differently for a clone`);
      assert.equal(world.rng.s, before.rng.s);
    }
  }
});

test('a finished world gets an idle input, and the intro already gets a flight plan', () => {
  const world = oneAlien();
  world.state = 'cleared';
  assert.deepEqual(autopilot(world), { dx: 0, dy: 0, fire: false, bomb: false, target: null });
  world.state = 'failed';
  assert.equal(autopilot(world).target, null);
  const fresh = createWorld(level([wave({ rows: 1, cols: 1 })]));
  assert.equal(fresh.state, 'intro');
  assert.ok(autopilot(fresh).target);
});

test('it flies under the alien, whichever side it starts on', () => {
  for (const x of [120, 1800]) {
    const world = oneAlien();
    world.ship.x = x;
    assert.ok(Math.abs(autopilot(world).target.x - 960) < 100, `from ${x}`);
  }
});

test('it leads a moving target: its shot lands where a shot from under the alien misses', () => {
  const world = oneAlien({ speed: 3 });
  seconds(world, 0.5);
  assert.equal(landed(oneShot(world)).length, 1, 'the led shot lands');
  const control = structuredClone(world);
  Object.assign(control.ship, { x: world.aliens[0].x, y: 1000, vx: 0, vy: 0, cooldown: 0 });
  control.events.length = 0;
  step(control, 1, { ...IDLE, fire: true });
  step(control, 100);
  assert.equal(landed(control.events).length, 0, 'an unled shot from straight underneath misses');
});

test('it bombs with six bullets within 160 px, not five, not further out, not without a bomb or while the key is down', () => {
  const crowd = (n, r = 120) => {
    const w = oneAlien();
    for (let i = 0; i < n; i++) {
      const a = (i * 2 * Math.PI) / n;
      bulletAt(w, w.ship.x + r * Math.cos(a), w.ship.y + r * Math.sin(a), 0, 0);
    }
    return w;
  };
  assert.equal(autopilot(crowd(6)).bomb, true);
  assert.equal(autopilot(crowd(5)).bomb, false);
  assert.equal(autopilot(crowd(6, 200)).bomb, false);
  const empty = crowd(6);
  empty.ship.bombs = 0;
  assert.equal(autopilot(empty).bomb, false);
  const held = crowd(6);
  held.ship.bombHeld = true;
  assert.equal(autopilot(held).bomb, false, 'a held key is not a fresh press');
});

test('with one life left against a boss it bombs, once the fight is on', () => {
  const world = bossWorld('mothership');
  assert.equal(autopilot(world).bomb, false, 'three lives');
  world.ship.lives = 2;
  assert.equal(autopilot(world).bomb, false, 'two lives');
  world.ship.lives = 1;
  assert.equal(autopilot(world).bomb, true);
  world.ship.bombs = 0;
  assert.equal(autopilot(world).bomb, false, 'no bombs');
  const entering = createWorld(levelById('w1-5'));
  step(entering, 100);
  entering.ship.lives = 1;
  assert.ok(entering.boss.enter > 0 && entering.state === 'play');
  assert.equal(autopilot(entering).bomb, false, 'nothing to hurt while the boss flies in');
});

test('it collects a power-up that is about to pass, without leaving its post for one that is far off', () => {
  const near = oneAlien();
  pickupAt(near, 'rapid', 400, 850);
  assert.ok(Math.abs(autopilot(near).target.x - 400) < 60, 'it goes for the near one');
  for (let i = 0; i < 150; i++) stepWorld(near, TICK, autopilot(near));
  assert.equal(near.ship.power?.kind, 'rapid');
  const far = oneAlien();
  pickupAt(far, 'rapid', 400, 200);
  assert.ok(Math.abs(autopilot(far).target.x - 960) < 100, 'the far one can wait');
});

test('it survives 60 s of w1-1 with its three lives, on the level seed and two others', () => {
  const lv = levelById('w1-1');
  for (const seed of [lv.seed, 7, 12345]) {
    const world = fly(createWorld(lv, seed), 60);
    assert.notEqual(world.state, 'failed', `seed ${seed}: failed at ${world.t.toFixed(1)} s`);
    assert.ok(world.score > 0);
  }
});
