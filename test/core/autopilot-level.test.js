import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from '../../src/core/world.js';
import { LEVELS } from '../../src/core/levels.js';
import { fly, LIMIT } from './autopilot-kit.js';

// Every level can be finished, and the autopilot is good enough to fly the title's backdrop.
for (const level of LEVELS) {
  test(`the autopilot clears ${level.id} within ${LIMIT} s with an invulnerable ship`, () => {
    const world = createWorld(level);
    world.ship.invuln = Infinity;
    fly(world);
    assert.equal(world.state, 'cleared', `${world.state} at ${world.t.toFixed(1)} s, wave ${world.wave}, `
      + `${world.aliens.length} aliens, boss hp ${world.boss?.hp}`);
  });

  test(`it survives the first 60 s of ${level.id} with its three lives, on the level seed and two others`, () => {
    for (const seed of [level.seed, 7, 12345]) {
      const world = fly(createWorld(level, seed), 60);
      assert.notEqual(world.state, 'failed', `seed ${seed}: failed at ${world.t.toFixed(1)} s`);
      assert.ok(world.score > 0);
    }
  });
}
