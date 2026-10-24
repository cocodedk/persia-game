import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, DEMO_LEVEL } from '../../src/core/levels.js';
import { scaled } from '../../src/core/difficulty.js';
import { makeSlots, slotPosition, entryPosition, diveCurve, HUD_CLEAR } from '../../src/core/formations.js';

// Ruling R41: the HUD band ends at y 96 and an alien's sprite reaches about 26 px from its centre,
// so no alien of any real wave may hold, sway, circle or swoop with its centre above y 122. An entry
// comes in from off the screen: one falling in from above crosses the band once, on its way down,
// and never climbs back into it.
const CLEAR = HUD_CLEAR - 1e-9; // y 122, give or take the last bit of a float
const WAVES = [...LEVELS, DEMO_LEVEL].flatMap((l) =>
  (l.waves ?? []).map((w, i) => ({ at: `${l.id} wave ${i + 1} (${w.formation})`, w, speed: w.speed * scaled(l.d).formationSpeed })));

test('every wave of every level holds its aliens below y 122, both ways, over 40 s of motion', () => {
  for (const { at, w, speed } of WAVES) {
    for (const slot of makeSlots(w)) {
      for (const dir of [1, -1]) {
        for (let t = 0; t <= 40; t += 1 / 20) {
          const { y } = slotPosition(w.formation, slot, t, { speed, dir });
          if (!(y >= CLEAR)) assert.fail(`${at} r${slot.row}c${slot.col} dir ${dir} t ${t.toFixed(2)}: y ${y.toFixed(1)}`);
        }
      }
    }
  }
});

test('every entry falls in at most once through the HUD band and never climbs back into it', () => {
  for (const { at, w } of WAVES) {
    for (const slot of makeSlots(w)) {
      let below = false;
      for (let u = 0; u <= 1; u += 1 / 400) {
        const { y } = entryPosition(w.formation, slot, u);
        if (y >= CLEAR) below = true;
        else if (below) assert.fail(`${at} r${slot.row}c${slot.col} u ${u.toFixed(3)}: back up to y ${y.toFixed(1)}`);
      }
      assert.ok(below, `${at}: the entry ends on the slot, below the band`);
    }
  }
});

test('a swoop from any slot at any ship stays below y 122, out and back', () => {
  for (const { at, w, speed } of WAVES) {
    for (const slot of makeSlots(w)) {
      for (const t of [0, 1.3, 2.9, 5.1]) {
        const from = slotPosition(w.formation, slot, t, { speed, dir: 1 });
        const home = slotPosition(w.formation, slot, t + 2.2, { speed, dir: 1 });
        for (const ship of [{ x: 40, y: 620 }, { x: 960, y: 1040 }, { x: 1880, y: 700 }]) {
          for (let u = 0; u <= 1; u += 1 / 50) {
            const { y } = diveCurve(from, ship, u, home);
            if (!(y >= CLEAR)) assert.fail(`${at} r${slot.row}c${slot.col} t ${t} u ${u.toFixed(2)}: y ${y.toFixed(1)}`);
          }
        }
      }
    }
  }
});
