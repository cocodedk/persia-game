import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from '../../src/core/world.js';
import { LEVELS, isRaining } from '../../src/core/levels.js';
import { seconds, playing, drain, ofType, clear } from './world-kit.js';

// Level 4's rain begins with its third wave, 18, and falls to the end, the giant's fight included.
// No other level has rain, and a retry is a fresh world, so the rain begins at wave 18 again.

// A level's run through its waves: each wave's event, and whether it rains once it has spawned;
// then the world, its last wave cleared and its giant come.
function run(level) {
  const first = createWorld(level).events.find((e) => e.type === 'wave');
  const w = playing(level);
  const seen = [[first, isRaining(w)]];
  for (let i = 1; i < level.waves.length; i++) {
    clear(w);
    seconds(w, 1.3);
    for (const e of ofType(drain(w), 'wave')) seen.push([e, isRaining(w)]);
  }
  clear(w);
  seconds(w, 5);
  return { seen, world: w };
}

// A fresh world is a retry too, so its dry first waves are the retry's.
test("level 4's third wave brings the rain and it rains from then on; no other level has rain", () => {
  for (const level of LEVELS) {
    const { seen } = run(level);
    const four = level.id === 'level-4';
    assert.deepEqual(seen.map(([e]) => e.rain === true), level.waves.map((_, i) => four && i === 2), level.id);
    assert.deepEqual(seen.map(([, on]) => on), level.waves.map((_, i) => four && i >= 2), level.id);
  }
});

test("it rains through level 4's giant fight, and from the first frame when it starts at the giant", () => {
  const { world } = run(LEVELS[3]);
  assert.ok(world.boss, 'the giant has come');
  assert.equal(isRaining(world), true);
  assert.equal(isRaining(createWorld({ ...LEVELS[3], waves: null })), true); // ?debug&boss
  assert.equal(isRaining(createWorld({ ...LEVELS[2], waves: null })), false);
});
