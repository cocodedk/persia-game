import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from '../../src/core/world.js';
import { ROLES } from '../../src/core/kinds.js';
import { slotPosition, MOTION } from '../../src/core/formations.js';
import { level, wave, step, seconds, playing, drain, ofType, shotAt } from './world-kit.js';

const mixed = ['grunt', 'diver', 'gunner', 'armored', 'carrier'];

test('a wave spawns on creation: one alien per slot, entering, with its role hp', () => {
  const w = createWorld(level([wave({ rows: 5, cols: 4, roles: mixed })]), 1);
  assert.equal(w.aliens.length, 20);
  assert.equal(w.wave, 1);
  assert.equal(new Set(w.aliens.map((a) => a.id)).size, 20, 'ids are unique');
  for (const a of w.aliens) {
    assert.equal(a.mode, 'enter');
    assert.equal(a.hp, ROLES[a.role].hp);
    assert.equal(a.t, 0);
    assert.ok(a.slot && Number.isFinite(a.slot.sx));
  }
  assert.ok(w.aliens.every((a) => a.y < 0), 'they fly in from above the screen');
});

test('armorBonus adds hp to armored and gunner aliens only, past d = 0.6', () => {
  const hp = (d) => {
    const w = createWorld(level([wave({ rows: 5, cols: 1, roles: mixed })], d), 1);
    return Object.fromEntries(w.aliens.map((a) => [a.role, a.hp]));
  };
  assert.deepEqual(hp(0.6), { grunt: 1, diver: 1, gunner: 2, armored: 3, carrier: 1 });
  assert.deepEqual(hp(0.7), { grunt: 1, diver: 1, gunner: 3, armored: 4, carrier: 1 });
});

test('entry lasts 1.5 s, then every alien holds on its slot', () => {
  const w = createWorld(level([wave({ formation: 'sway', cols: 6 })]), 1);
  seconds(w, 1.4);
  assert.ok(w.aliens.every((a) => a.mode === 'enter' && a.t > 1.3));
  seconds(w, 0.2);
  assert.ok(w.aliens.every((a) => a.mode === 'hold'));
  for (const a of w.aliens) {
    const home = slotPosition('sway', a.slot, w.march.clock, { dir: w.march.dir, speed: w.march.speed });
    assert.ok(Math.hypot(a.x - home.x, a.y - home.y) < 1e-9, 'holding means standing on the live slot');
  }
});

test('entry hands over to hold without a jump, for every formation', () => {
  for (const f of Object.keys(MOTION)) {
    const w = createWorld(level([wave({ formation: f, rows: 2, cols: 5, roles: ['grunt', 'carrier'] })]), 1);
    step(w, 80);
    let prev = w.aliens.map((a) => ({ x: a.x, y: a.y }));
    let worst = 0;
    for (let i = 0; i < 30; i++) {
      step(w);
      w.aliens.forEach((a, k) => {
        worst = Math.max(worst, Math.hypot(a.x - prev[k].x, a.y - prev[k].y));
        prev[k] = { x: a.x, y: a.y };
      });
    }
    assert.ok(worst < 15, `${f}: moved ${worst.toFixed(1)} px in one tick around the hand-over`);
  }
});

test('killing aliens never makes the grid jump, it only marches faster', () => {
  const w = playing(level([wave({ rows: 3, cols: 8, roles: ['grunt', 'grunt', 'grunt'] })]));
  let prev = new Map(w.aliens.map((a) => [a.id, { x: a.x, y: a.y }]));
  let worst = 0;
  for (let i = 0; i < 60 * 40 && w.aliens.length > 1; i++) {
    if (i % 45 === 0) shotAt(w, w.aliens[(i / 45) % w.aliens.length]);
    step(w);
    for (const a of w.aliens) {
      const p = prev.get(a.id);
      if (p) worst = Math.max(worst, Math.hypot(a.x - p.x, a.y - p.y));
      prev.set(a.id, { x: a.x, y: a.y });
    }
  }
  assert.ok(w.aliens.length <= 2, 'most of the wave was killed');
  assert.ok(worst < 10, `largest step ${worst.toFixed(2)} px (a jump would be 24 or more)`);
});

test('divers dive one at a time at d = 0, every 2 to 4 s, and land back on their slot', () => {
  const w = playing(level([wave({ formation: 'sway', cols: 6, roles: ['diver'] })]));
  w.ship.invuln = 1e9;
  let most = 0;
  let dives = 0;
  const was = new Map();
  let worst = 0;
  const last = new Map();
  for (let i = 0; i < 60 * 40; i++) {
    step(w);
    most = Math.max(most, w.aliens.filter((a) => a.mode === 'dive' || a.mode === 'return').length);
    for (const a of w.aliens) {
      if (was.get(a.id) === 'hold' && a.mode === 'dive') dives++;
      if (was.get(a.id) !== 'hold' && last.has(a.id)) {
        worst = Math.max(worst, Math.hypot(a.x - last.get(a.id).x, a.y - last.get(a.id).y));
      }
      if (was.get(a.id) === 'return' && a.mode === 'hold') {
        const home = slotPosition('sway', a.slot, w.march.clock, { dir: w.march.dir, speed: w.march.speed });
        assert.ok(Math.hypot(a.x - home.x, a.y - home.y) < 1e-6, 'the diver lands exactly on its slot');
      }
      was.set(a.id, a.mode);
      last.set(a.id, { x: a.x, y: a.y });
    }
  }
  assert.equal(most, 1, 'one at a time');
  assert.ok(dives >= 8 && dives <= 20, `${dives} dives in 40 s`);
  assert.ok(worst < 40, `a diver moved ${worst.toFixed(1)} px in a tick`);
  assert.ok(w.aliens.every((a) => a.mode === 'hold' || a.mode === 'dive' || a.mode === 'return'));
});

test('up to 3 divers at once at d = 1', () => {
  const w = playing(level([wave({ formation: 'sway', cols: 8, roles: ['diver', 'diver'] })], 1));
  w.ship.invuln = 1e9;
  let most = 0;
  for (let i = 0; i < 60 * 90; i++) {
    step(w);
    most = Math.max(most, w.aliens.filter((a) => a.mode === 'dive' || a.mode === 'return').length);
  }
  assert.ok(most >= 2 && most <= 3, `${most} at once`);
});

test('only divers dive', () => {
  const w = playing(level([wave({ formation: 'sway', cols: 6, roles: ['grunt', 'armored'] })]));
  seconds(w, 20);
  assert.ok(w.aliens.every((a) => a.mode === 'hold'));
});

test('firing rate is ROLES[role].fire * fireMult per alien, with the wave pattern', () => {
  const w = playing(level([wave({ formation: 'sway', cols: 6, roles: ['gunner'] })]), { quiet: false });
  w.ship.invuln = 1e9;
  const shots = [];
  for (let i = 0; i < 60 * 120; i++) {
    step(w);
    w.bullets.length = 0;
    shots.push(...ofType(drain(w), 'fire').filter((e) => e.side === 'enemy'));
  }
  const expected = 6 * ROLES.gunner.fire * 0.6 * 120;
  assert.ok(shots.length > expected * 0.7 && shots.length < expected * 1.3, `${shots.length} vs ${expected}`);
  assert.ok(shots.every((e) => e.pattern === 'aimed'));
});

test('carriers never fire, and aliens that are still entering do not fire either', () => {
  const w = createWorld(level([wave({ rows: 2, cols: 6, roles: ['gunner', 'carrier'] })], 1), 1);
  w.scale.fireMult = 1000;
  w.ship.invuln = 1e9;
  seconds(w, 1.4);
  assert.equal(w.bullets.length, 0, 'intro and entry are quiet');
  seconds(w, 3);
  const fires = ofType(w.events, 'fire').filter((e) => e.side === 'enemy');
  assert.ok(fires.length > 0);
  assert.ok(fires.every((e) => e.role === 'gunner'), 'only the gunner row fires');
});

test('enemy bullets never exceed 400', () => {
  const w = playing(level([wave({ formation: 'sway', cols: 10, roles: ['gunner', 'gunner'], pattern: 'ring' })], 1), { quiet: false });
  w.ship.invuln = 1e9;
  w.scale.fireMult = 200;
  let most = 0;
  for (let i = 0; i < 600; i++) {
    step(w);
    most = Math.max(most, w.bullets.length);
  }
  assert.ok(most > 300 && most <= 400, `peak ${most}`);
});
