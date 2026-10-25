import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as ART from '../../src/ui/landmarks/persepolis-art.js';
import { WINGED } from '../../src/ui/landmarks/ferdowsi-art.js';
import { installCanvas } from './dom-kit.js';

installCanvas();
const { PIXEL, W, H } = await import('../../src/ui/sprites.js');
const { LOOK } = await import('../../src/ui/looks/index.js');
const { LEVELS } = await import('../../src/core/levels.js');
const { landmarkArt } = await import('../../src/ui/landmark-art.js');

// pixelate works in whole blocks, and the landmark paints in them: a band off the grid blurs.
test("the sky and every landmark's layer bands sit on the pixel grid", () => {
  const bands = Object.values(LOOK.landmarks).flat().map((L) => L.height);
  for (const n of [W, H, ...bands]) assert.equal(n % PIXEL, 0, `${n} px`);
});

test("every level's landmark is one the look paints", () => {
  for (const level of LEVELS) assert.ok(level.landmark in LOOK.landmarks, `${level.id}: ${level.landmark}`);
});

// Every picture persepolis.js stamps is a rectangle in the painter's tones, so a slip in a hand-drawn
// row fails here rather than tearing a sprite on screen.
test('the Persepolis pictures are rectangles of known tones', () => {
  for (const [name, rows] of Object.entries(ART)) {
    assert.ok(rows.length > 0, name);
    for (const row of rows) {
      assert.equal(row.length, rows[0].length, `${name}: ${row}`);
      assert.match(row, /^[.#+\-fy]+$/, `${name}: ${row}`);
    }
  }
});

// The tomb's winged figure is hand-drawn the same way, in the stone's three tones.
test("the Tomb of Ferdowsi's winged figure is a rectangle of known tones", () => {
  for (const row of WINGED) {
    assert.equal(row.length, WINGED[0].length, row);
    assert.match(row, /^[.#+\-]+$/, row);
  }
});

// The title bakes each level's picture once; coming back to the title reuses it.
test("a level's landmark picture is baked once", () => {
  for (const level of LEVELS) assert.equal(landmarkArt(level), landmarkArt(level), level.id);
  assert.notEqual(landmarkArt(LEVELS[0]), landmarkArt(LEVELS[1]));
});
