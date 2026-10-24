import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from '../../src/core/world.js';
import { LEVELS, weatherOf } from '../../src/core/levels.js';
import { seconds, playing, drain, ofType, clear } from './world-kit.js';

// Level 4's rain begins with its third wave, 18, and falls to the end, the giant's fight included.
// No other level has weather, and a retry is a fresh world, so the rain begins at wave 18 again.

// A level's run through its waves: each wave's event, and the weather once it has spawned;
// then the world, its last wave cleared and its giant come.
function run(level) {
  const first = createWorld(level).events.find((e) => e.type === 'wave');
  const w = playing(level);
  const seen = [[first, weatherOf(w)]];
  for (let i = 1; i < level.waves.length; i++) {
    clear(w);
    seconds(w, 1.3);
    for (const e of ofType(drain(w), 'wave')) seen.push([e, weatherOf(w)]);
  }
  clear(w);
  seconds(w, 5);
  return { seen, world: w };
}

// A fresh world is a retry too, so its dry first waves are the retry's.
test("level 4's third wave brings the rain and it rains from then on; no other level has weather", () => {
  for (const level of LEVELS) {
    const { seen } = run(level);
    const four = level.id === 'level-4';
    assert.deepEqual(seen.map(([e]) => e.weather ?? null), level.waves.map((_, i) => (four && i === 2 ? 'rain' : null)), level.id);
    assert.deepEqual(seen.map(([, kind]) => kind), level.waves.map((_, i) => (four && i >= 2 ? 'rain' : null)), level.id);
  }
});

test("it rains through level 4's giant fight, and from the first frame when it starts at the giant", () => {
  const { world } = run(LEVELS[3]);
  assert.ok(world.boss, 'the giant has come');
  assert.equal(weatherOf(world), 'rain');
  assert.equal(weatherOf(createWorld({ ...LEVELS[3], waves: null })), 'rain'); // ?debug&boss
  assert.equal(weatherOf(createWorld({ ...LEVELS[2], waves: null })), null);
});

// Weather is one mechanism with a kind: level 4 with stars from its third wave does what its rain does.
test('a level whose weather is stars carries and names it the same way', () => {
  const stars = { ...LEVELS[3], weather: { kind: 'stars', from: 3 } };
  const { seen, world } = run(stars);
  assert.deepEqual(seen.map(([e]) => e.weather ?? null), [null, null, 'stars', null, null]);
  assert.deepEqual(seen.map(([, kind]) => kind), [null, null, 'stars', 'stars', 'stars']);
  assert.equal(weatherOf(world), 'stars', 'through the giant');
  assert.equal(weatherOf(createWorld({ ...stars, waves: null })), 'stars', 'and from the first frame at the giant');
});
