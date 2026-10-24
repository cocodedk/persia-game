import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PACK } from '../../src/data/pack.js';
import { LEVEL, LEVELS } from '../../src/core/levels.js';
import { fmt, localDigits, waveText } from '../../src/ui/format.js';
import { FONT } from '../../src/ui/hud-kit.js';

const D = PACK.digits; // the expected strings are built from the pack, so no Persian enters a test

test('fmt groups thousands and rounds', () => {
  assert.equal(fmt(12345.6), '12,346');
});

test('localDigits writes each digit in the given ten', () => {
  assert.equal(localDigits(10, D), D[1] + D[0]);
  assert.equal(localDigits(7, '0123456789'), '7');
});

test("level 1 counts its waves in ASCII; level 2 counts on from six in the pack's digits", () => {
  assert.equal(waveText(LEVEL, 0, D), 'WAVE 1 / 5', 'before the first wave it already shows wave 1');
  assert.equal(waveText(LEVEL, 3, D), 'WAVE 3 / 5');
  assert.equal(waveText(LEVELS[1], 1, D), `WAVE ${D[6]} / ${D[1]}${D[0]}`);
  assert.equal(waveText(LEVELS[1], 5, D), `WAVE ${D[1]}${D[0]} / ${D[1]}${D[0]}`);
});

test("the HUD font falls back to the pack's face, which has the Persian digits", () => {
  const families = FONT.split(',').map((f) => f.trim().replaceAll('"', ''));
  assert.ok(families.indexOf(PACK.font.family) >= 0 && families.indexOf(PACK.font.family) < families.indexOf('sans-serif'));
});
