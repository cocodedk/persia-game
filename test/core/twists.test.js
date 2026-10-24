import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, stepWorld } from '../../src/core/world.js';
import { carveRect } from '../../src/core/bunkers.js';
import { TWISTS } from '../../src/core/kinds.js';
import { levelById } from '../../src/core/levels.js';
import {
  TICK, IDLE, level, wave, step, seconds, playing, drain, ofType, shotAt, bulletAt, solid,
} from './world-kit.js';

const lv = (twist, extra = {}, waves = [wave()]) => level(waves, 0, { twist, ...extra });
const cover = (w) => w.bunkers.reduce((n, b) => n + solid(b), 0); // every bunker's solid pixels

test('every world has the twist state, plain data, and keeps it identical on a re-run', () => {
  for (const twist of TWISTS) {
    const w = createWorld(lv(twist), 3);
    assert.deepEqual([w.wind === 0 || twist === 'gusts', w.slow, w.saucer, w.wrecks], [true, 0, null, []], twist);
    assert.equal(w.well !== null, twist === 'gravity');
    assert.doesNotThrow(() => structuredClone(w));
  }
  for (const id of ['w1-1', 'w2-2', 'w3-3', 'w4-4', 'w5-5', 'w6-1', 'w7-2', 'w8-3']) {
    const run = (clone) => {
      let w = createWorld(levelById(id));
      w.ship.invuln = Infinity;
      for (let i = 0; i < 60 * 30; i++) {
        stepWorld(w, TICK, { ...IDLE, dx: i % 120 < 60 ? 1 : -1, fire: true });
        if (clone && i === 900) w = structuredClone(w);
      }
      return JSON.stringify(w);
    };
    assert.equal(run(true), run(false), `${id} replays exactly, even through a structuredClone`);
  }
});

test('bunkers: fresh cover in every wave, and none where the level has none', () => {
  const w = playing(lv('bunkers', { bunkers: true }, [wave(), wave()]));
  const whole = cover(w);
  carveRect(w.bunkers[0], 0, 1920, 0, 2000);
  assert.ok(cover(w) < whole);
  for (const a of [...w.aliens]) shotAt(w, a);
  seconds(w, 1.6);
  assert.equal(w.wave, 2);
  assert.equal(cover(w), whole, 'the second wave comes with whole bunkers');
  assert.equal(playing(lv('bunkers', { bunkers: false }, [wave(), wave()])).bunkers.length, 0);
});

test('bunkers: a carrier saucer crosses the top every 20 s, and shooting it down drops a power-up', () => {
  const w = playing(lv('bunkers'));
  seconds(w, 19.8);
  assert.equal(w.saucer, null);
  seconds(w, 0.4);
  const s = w.saucer;
  assert.deepEqual([s.role, s.hp, s.saucer], ['carrier', 1, true]);
  assert.equal(s.y, 104, 'across the top, just under the HUD band (y 16..96)');
  const launch = ofType(drain(w), 'saucer');
  assert.equal(launch.length, 1);
  const x0 = s.x;
  seconds(w, 2);
  assert.ok(Math.abs(w.saucer.x - x0) > 300, 'it crosses');
  seconds(w, 8);
  assert.equal(w.saucer, null, 'and leaves');
  seconds(w, 9.5);
  assert.equal(w.saucer, null);
  seconds(w, 0.6);
  assert.ok(w.saucer, 'the next one comes 20 s after the last');
  assert.notEqual(Math.sign(w.saucer.vx), Math.sign(launch[0].dir), 'from the other side');
  shotAt(w, w.saucer);
  step(w);
  const ev = drain(w);
  assert.equal(w.saucer, null);
  assert.equal(ofType(ev, 'kill').filter((e) => e.role === 'carrier').length, 1);
  assert.equal(w.pickups.length, 1);
});

test('bunkers: a saucer overhead never holds up a wave', () => {
  const w = playing(lv('bunkers'));
  seconds(w, 20.2);
  assert.ok(w.saucer);
  for (const a of [...w.aliens]) shotAt(w, a);
  step(w);
  assert.equal(ofType(drain(w), 'waveClear').length, 1);
});

test('darkness: lightning every 6 to 10 s, and only in the dark', () => {
  const w = playing(lv('darkness'));
  const start = w.tick;
  seconds(w, 90);
  const hits = ofType(drain(w), 'lightning');
  assert.ok(hits.length >= 9 && hits.length <= 15, `${hits.length} flashes in 90 s`);
  const times = [start, ...hits.map((e) => e.tick)];
  for (let i = 1; i < times.length; i++) {
    const gap = (times[i] - times[i - 1]) / 60;
    assert.ok(gap >= 6 - 0.05 && gap <= 10 + 0.05, `gap ${gap}`);
  }
  assert.ok(hits.every((e) => e.x >= 0 && e.x <= 1920 && e.strength > 0 && e.strength <= 1));
  const other = playing(lv('bunkers'));
  seconds(other, 30);
  assert.equal(ofType(drain(other), 'lightning').length, 0);
});

test('gusts: the wind is re-rolled every 4 to 7 s within +-120 px/s^2', () => {
  const w = playing(lv('gusts'));
  const winds = [];
  for (let i = 0; i < 60 * 90; i++) {
    step(w);
    if (w.wind !== winds.at(-1)?.wind) winds.push({ wind: w.wind, at: w.t });
  }
  assert.ok(winds.length >= 12 && winds.length <= 23, `${winds.length} gusts in 90 s`);
  assert.ok(winds.every((g) => Math.abs(g.wind) <= 120));
  assert.ok(winds.some((g) => g.wind > 60) && winds.some((g) => g.wind < -60), 'both directions');
  for (let i = 2; i < winds.length; i++) {
    const gap = winds[i].at - winds[i - 1].at;
    assert.ok(gap >= 4 - 0.02 && gap <= 7 + 0.02, `gap ${gap}`);
  }
});

test('gusts: the wind pushes the ship\'s shots and the enemy\'s bullets alike, but not a laser', () => {
  const w = playing(lv('gusts'));
  w.wind = 100;
  w.shots.push({ pattern: 'shot', x: 600, y: 700, vx: 0, vy: -1400, r: 5, life: 1, dmg: 1 });
  bulletAt(w, 1200, 400, 0, 200);
  w.bullets.push({ pattern: 'laser', x: 300, y: 300, vx: 0, vy: 1, r: 9, life: 2, warn: 1 });
  step(w, 30);
  const [shot] = w.shots;
  const bullet = w.bullets.find((b) => b.pattern === 'aimed');
  assert.ok(Math.abs(shot.vx - 50) < 1e-9 && Math.abs(bullet.vx - 50) < 1e-9, `${shot.vx} ${bullet.vx}`);
  assert.ok(shot.x > 600 && bullet.x > 1200, 'both drift downwind');
  assert.equal(w.bullets.find((b) => b.pattern === 'laser').vx, 0);
  const calm = playing(lv('bunkers'));
  calm.wind = 100;
  calm.shots.push({ pattern: 'shot', x: 600, y: 700, vx: 0, vy: -1400, r: 5, life: 1, dmg: 1 });
  step(calm, 30);
  assert.equal(calm.shots[0].vx, 0, 'no wind in a world without the twist');
});

test('shuriken: a ship shot destroys the shuriken it touches, and only shuriken', () => {
  const w = playing(lv('shuriken'));
  const star = () => ({ pattern: 'shuriken', x: 500, y: 500, vx: 0, vy: 0, r: 18, life: 6 });
  w.bullets.push(star());
  bulletAt(w, 800, 500);
  w.shots.push({ pattern: 'shot', x: 500, y: 540, vx: 0, vy: -1400, r: 5, life: 1, dmg: 1 });
  w.shots.push({ pattern: 'shot', x: 800, y: 540, vx: 0, vy: -1400, r: 5, life: 1, dmg: 1 });
  step(w);
  assert.equal(w.bullets.length, 1, 'the star is cut');
  assert.equal(w.bullets[0].pattern, 'aimed');
  assert.deepEqual(ofType(drain(w), 'cut').map((e) => [e.x, e.y]), [[500, 500]]);
  assert.equal(w.shots.filter((s) => s.life > 0).length, 1, 'the shot that cut it is spent');
  const plain = playing(lv('bunkers'));
  plain.bullets.push(star());
  plain.shots.push({ pattern: 'shot', x: 500, y: 540, vx: 0, vy: -1400, r: 5, life: 1, dmg: 1 });
  step(plain);
  assert.equal(plain.bullets.length, 1, 'in other worlds a shot goes through');
});
