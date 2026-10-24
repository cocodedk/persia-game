import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from '../../src/core/world.js';
import { LEVELS, isRaining } from '../../src/core/levels.js';
import { step, seconds, playing, drain, ofType } from './world-kit.js';

// Level 4's rain begins with its third wave, 18, and falls to the end, the giant's fight included.
// No other level has rain, and a retry is a fresh world, so the rain begins at wave 18 again.

const clear = (w) => {
  for (const a of w.aliens) a.hp = 0;
  step(w);
};

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
  return Object.assign(seen, { world: w });
}

test("level 4's third wave brings the rain, and no other wave of any level does", () => {
  for (const level of LEVELS) {
    const marked = run(level).map(([e]) => e.rain === true);
    assert.deepEqual(marked, level.waves.map((_, i) => level.id === 'level-4' && i === 2), level.id);
  }
});

test('it rains on level 4 from wave 18 on, and never on levels 1 to 3', () => {
  for (const level of LEVELS) {
    const raining = run(level).map(([, on]) => on);
    assert.deepEqual(raining, level.waves.map((_, i) => level.id === 'level-4' && i >= 2), level.id);
  }
});

test('a retry is dry until wave 18 again', () => {
  const level = LEVELS[3];
  assert.equal(isRaining(createWorld(level)), false);
  assert.equal(isRaining(playing(level)), false);
});

test("it rains through level 4's giant fight, and from the first frame when it starts at the giant", () => {
  const { world } = run(LEVELS[3]);
  assert.ok(world.boss, 'the giant has come');
  assert.equal(isRaining(world), true);
  assert.equal(isRaining(createWorld({ ...LEVELS[3], waves: null })), true); // ?debug&boss
  assert.equal(isRaining(createWorld({ ...LEVELS[2], waves: null })), false);
});
