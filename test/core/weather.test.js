import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from '../../src/core/world.js';
import { LEVELS, weatherOf } from '../../src/core/levels.js';
import { seconds, playing, drain, ofType, clear } from './world-kit.js';

// Level 4's rain begins with its third wave, 18, and falls to the end, the giant's fight included;
// level 5's stars do the same from wave 23, level 6's petals from wave 28, level 7's moon from wave 33 and
// level 8's dawn from wave 38, level 9's sunrise from wave 43 and level 10's rainbow from wave 48.
// No other level has weather, and a retry is a fresh world, so each begins at its wave again.

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
test("level 4's third wave brings the rain, level 5's the stars, level 6's the petals, level 7's the moon, level 8's the dawn, level 9's the sunrise and level 10's the rainbow, and it lasts from then on; no other level has weather", () => {
  const KIND = { 'level-4': 'rain', 'level-5': 'stars', 'level-6': 'petals', 'level-7': 'moon', 'level-8': 'dawn', 'level-9': 'sunrise', 'level-10': 'rainbow' };
  for (const level of LEVELS) {
    const { seen } = run(level);
    const kind = KIND[level.id];
    assert.deepEqual(seen.map(([e]) => e.weather ?? null), level.waves.map((_, i) => (kind && i === 2 ? kind : null)), level.id);
    assert.deepEqual(seen.map(([, k]) => k), level.waves.map((_, i) => (kind && i >= 2 ? kind : null)), level.id);
  }
});

test("it rains through level 4's giant fight, the stars fall through level 5's, the petals through level 6's, the moon shines through level 7's, dawn colours level 8's, the sun rises through level 9's and the rainbow arches over level 10's, and from the first frame when it starts at the giant", () => {
  for (const [level, kind] of [[LEVELS[3], 'rain'], [LEVELS[4], 'stars'], [LEVELS[5], 'petals'], [LEVELS[6], 'moon'], [LEVELS[7], 'dawn'], [LEVELS[8], 'sunrise'], [LEVELS[9], 'rainbow']]) {
    const { world } = run(level);
    assert.ok(world.boss, 'the giant has come');
    assert.equal(weatherOf(world), kind);
    assert.equal(weatherOf(createWorld({ ...level, waves: null })), kind); // ?debug&boss
  }
  assert.equal(weatherOf(createWorld({ ...LEVELS[2], waves: null })), null);
});

