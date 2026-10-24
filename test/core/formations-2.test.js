import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FORMATIONS } from '../../src/core/kinds.js';
import { makeSlots, entryPosition, diveCurve } from '../../src/core/formations.js';
import { wave, SHAPES } from './wave-shapes.js';

test('entry starts off-screen and ends exactly on the slot, for every formation', () => {
  for (const f of FORMATIONS) {
    for (const [key, w] of SHAPES) {
      for (const slot of makeSlots(w)) {
        const a = entryPosition(f, slot, 0);
        const at = `${f} ${key} r${slot.row}c${slot.col}`;
        assert.ok(a.x < 0 || a.x > 1920 || a.y < 0, `${at} starts on screen at ${a.x},${a.y}`);
        assert.deepEqual(entryPosition(f, slot, 1), { x: slot.sx, y: slot.sy }, at);
        assert.deepEqual(entryPosition(f, slot, 7), { x: slot.sx, y: slot.sy }, `${at} clamps u`);
        assert.deepEqual(entryPosition(f, slot, -3), a, `${at} clamps u`);
      }
    }
  }
});

test('entry paths are finite all the way in', () => {
  const slots = makeSlots(wave(3, 8));
  for (const f of FORMATIONS) {
    for (const s of slots) {
      let last = null;
      for (let u = 0; u <= 1.0001; u += 0.05) {
        const p = entryPosition(f, s, Math.min(u, 1));
        assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y), `${f} u${u}`);
        last = p;
      }
      assert.deepEqual(last, { x: s.sx, y: s.sy });
    }
  }
});

test('diveCurve leaves the slot, swoops to the ship x and back up, and returns exactly', () => {
  const from = { x: 700, y: 200 };
  const ship = { x: 1500, y: 900 };
  assert.deepEqual(diveCurve(from, ship, 0), from);
  assert.deepEqual(diveCurve(from, ship, 1), from);
  const mid = diveCurve(from, ship, 0.5);
  assert.ok(Math.abs(mid.x - ship.x) < 1, `mid x ${mid.x}`);
  assert.ok(mid.y > 800, `mid y ${mid.y}`);
  assert.ok(diveCurve(from, ship, 0.9).y < mid.y - 300, 'climbs back up');
  assert.ok(diveCurve(from, ship, 0.25).y > from.y);
  assert.deepEqual(from, { x: 700, y: 200 }, 'inputs are not mutated');
});

test('diveCurve without home is the same as home = from', () => {
  const from = { x: 700, y: 200 };
  const ship = { x: 1500, y: 900 };
  for (let u = 0; u <= 1; u += 0.05) assert.deepEqual(diveCurve(from, ship, u), diveCurve(from, ship, u, from), `u${u}`);
});

test('diveCurve lands exactly on the live slot (home) at u = 1, still aims at the ship, and has no jump', () => {
  const from = { x: 700, y: 200 };
  const ship = { x: 1500, y: 900 };
  for (const home of [{ x: 876, y: 200 }, { x: 524, y: 200 }, { x: 700, y: 376 }, { x: 800, y: 130 }]) {
    const at = JSON.stringify(home);
    assert.deepEqual(diveCurve(from, ship, 0, home), from, at);
    assert.deepEqual(diveCurve(from, ship, 1, home), home, at);
    assert.deepEqual(diveCurve(from, ship, 3, home), home, `${at} clamps u`);
    assert.ok(Math.abs(diveCurve(from, ship, 0.5, home).x - ship.x) < 1, `${at} the swoop still reaches the ship`);
    // The homed path may differ from the plain one by no more than a smooth drift: compare how far
    // each 0.01 step of u moves the two paths.
    let worst = 0;
    let a = diveCurve(from, ship, 0, home);
    let b = diveCurve(from, ship, 0);
    for (let i = 1; i <= 100; i++) {
      const c = diveCurve(from, ship, i / 100, home);
      const d = diveCurve(from, ship, i / 100);
      worst = Math.max(worst, Math.hypot(c.x - a.x - (d.x - b.x), c.y - a.y - (d.y - b.y)));
      a = c;
      b = d;
    }
    assert.ok(worst < 6, `${at} steps differ by ${worst} px; a 176 px snap would show here`);
  }
});

test('diveCurve stays on screen for ships at either edge and never dips above its slot', () => {
  for (const sx of [40, 960, 1880]) {
    for (const hx of [400, 960, 1520]) {
      const from = { x: hx, y: 392 };
      for (let u = 0; u <= 1; u += 0.02) {
        const p = diveCurve(from, { x: sx, y: 1000 }, u);
        assert.ok(p.x >= 0 && p.x <= 1920 && p.y >= from.y - 1e-9 && p.y <= 1080, `${sx} ${hx} u${u}`);
      }
    }
  }
});
