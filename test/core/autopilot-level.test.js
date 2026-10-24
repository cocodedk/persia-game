import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from '../../src/core/world.js';
import { LEVEL } from '../../src/core/levels.js';
import { fly, LIMIT } from './autopilot-kit.js';

// Level 1 can be finished, and the autopilot is good enough to fly the title's backdrop.

test(`the autopilot clears ${LEVEL.id} within ${LIMIT} s with an invulnerable ship`, () => {
  const world = createWorld(LEVEL);
  world.ship.invuln = Infinity;
  fly(world);
  assert.equal(world.state, 'cleared', `${world.state} at ${world.t.toFixed(1)} s, wave ${world.wave}, `
    + `${world.aliens.length} aliens, boss hp ${world.boss?.hp}`);
});

test(`it survives the first 60 s of ${LEVEL.id} with its three lives, on the level seed and two others`, () => {
  for (const seed of [LEVEL.seed, 7, 12345]) {
    const world = fly(createWorld(LEVEL, seed), 60);
    assert.notEqual(world.state, 'failed', `seed ${seed}: failed at ${world.t.toFixed(1)} s`);
    assert.ok(world.score > 0);
  }
});
