import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installCanvas } from './dom-kit.js';

// The title's backdrop battle: a random wave level, flown by the autopilot.
installCanvas();
const { pickBackdrop } = await import('../../src/ui/scenes.js');
const { LEVELS } = await import('../../src/core/levels.js');

test('the backdrop is a wave level, and every wave level comes up', () => {
  const seen = new Set();
  for (let i = 0; i < 400; i++) {
    const level = pickBackdrop();
    assert.ok(level.waves, `${level.id} is a wave level`);
    seen.add(level.id);
  }
  assert.equal(seen.size, LEVELS.filter((l) => l.waves).length, 'every wave level comes up');
});
