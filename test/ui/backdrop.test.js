import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installCanvas } from './dom-kit.js';

// The title's backdrop battle (M5): a random world's wave level, and on a return to the title from a
// level, another world than the one just shown (the router passes it), so a kiosk cycles worlds.
installCanvas();
const { pickBackdrop } = await import('../../src/ui/scenes.js');

test('the backdrop is a wave level of any world, and never the world it is told to skip', () => {
  const worlds = new Set();
  for (let i = 0; i < 400; i++) {
    const level = pickBackdrop();
    assert.ok(level.waves, `${level.id} is a wave level`);
    worlds.add(level.world);
  }
  assert.equal(worlds.size, 8, 'every world comes up');
  for (let skip = 1; skip <= 8; skip++) {
    const other = new Set();
    for (let i = 0; i < 200; i++) {
      const level = pickBackdrop(skip);
      assert.ok(level.waves, `${level.id} is a wave level`);
      assert.notEqual(level.world, skip, `skipping world ${skip}`);
      other.add(level.world);
    }
    assert.equal(other.size, 7, `the other seven worlds come up when skipping ${skip}`);
  }
});
