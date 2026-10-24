import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fadeWeather, drawWeather } from '../../src/ui/weather.js';
import { LEVELS } from '../../src/core/levels.js';
import { installCanvas, counting } from './dom-kit.js';

installCanvas(); // the stars' heads are a baked sprite

// The weather fades in over two seconds, and each kind is drawn in its own phase of the frame.

test('the weather fades in over 2 s from the first frame it is drawn, a world that has it from its start too', () => {
  assert.equal(fadeWeather({ since: null }, 500), 0);
  const w = { since: null };
  assert.equal(fadeWeather(w, 11), 0);
  assert.equal(fadeWeather(w, 12), 0.5);
  assert.equal(fadeWeather(w, 14), 1);
});

// The streaks or stars (one `moveTo` each) or petals (one `ellipse` each, with `key`) the weather draws
// in `phase` for `world` at t = 5 s, its fade begun at 0.
function drawn(world, phase, t = 5, key = 'moveTo') {
  const { ctx, count } = counting(key);
  drawWeather(ctx, { weather: { since: 0 }, quality: { level: 1 }, reduced: false }, world, t, phase);
  return count();
}

test("level 4's rain is drawn in the field and not in the sky; it is dry before its wave", () => {
  const world = (wave) => ({ level: LEVELS[3], boss: null, wave });
  assert.equal(drawn(world(3), 'field'), 120);
  assert.equal(drawn(world(3), 'sky'), 0);
  assert.equal(drawn(world(2), 'field'), 0, 'dry');
  assert.equal(drawn({ level: LEVELS[2], boss: null, wave: 5 }, 'field'), 0, 'level 3 has no weather');
});

// What the stars draw in `phase` over ten seconds of frames.
function shower(world, phase) {
  let n = 0;
  for (let t = 3; t < 13; t += 0.5) n += drawn(world, phase, t);
  return n;
}

test('stars are drawn in the sky, under the parallax and the field, and never in the field', () => {
  const world = { level: { weather: { kind: 'stars', from: 3 } }, boss: null, wave: 3 };
  assert.ok(shower(world, 'sky') > 0, 'some fall');
  assert.equal(shower(world, 'field'), 0);
  assert.equal(shower({ ...world, wave: 2 }, 'sky'), 0, 'dry before its wave');
  assert.ok(shower({ ...world, wave: 1, boss: {} }, 'sky') > 0, 'and at the giant');
});

test('petals are drawn in the field, over the parallax and under what fights, and never in the sky', () => {
  const world = { level: { weather: { kind: 'petals', from: 3 } }, boss: null, wave: 3 };
  const petals = (w, phase) => drawn(w, phase, 5, 'ellipse');
  assert.equal(petals(world, 'field'), 70);
  assert.equal(petals(world, 'sky'), 0);
  assert.equal(petals({ ...world, wave: 2 }, 'field'), 0, 'dry before its wave');
  assert.equal(petals({ ...world, wave: 1, boss: {} }, 'field'), 70, 'and at the giant');
});
