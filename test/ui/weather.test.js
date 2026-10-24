import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fadeWeather, drawWeather } from '../../src/ui/weather.js';
import { LEVELS } from '../../src/core/levels.js';

// The weather fades in over two seconds, and each kind is drawn in its own phase of the frame.

test('the weather fades in over 2 s from the first frame it is drawn, a world that has it from its start too', () => {
  assert.equal(fadeWeather({ since: null }, 500), 0);
  const w = { since: null };
  assert.equal(fadeWeather(w, 11), 0);
  assert.equal(fadeWeather(w, 12), 0.5);
  assert.equal(fadeWeather(w, 14), 1);
});

// The lines a frame's weather draws in `phase` for `world` at t = 5 s, its fade begun at 0.
function lines(world, phase) {
  const calls = [];
  const ctx = new Proxy({}, { get: (o, key) => (key in o ? o[key] : () => calls.push(key)), set: (o, key, value) => ((o[key] = value), true) });
  drawWeather(ctx, { weather: { since: 0 }, quality: { level: 1 }, reduced: false }, world, 5, phase);
  return calls.filter((key) => key === 'lineTo').length;
}

test("level 4's rain is drawn in the field and not in the sky; it is dry before its wave", () => {
  const world = (wave) => ({ level: LEVELS[3], boss: null, wave });
  assert.equal(lines(world(3), 'field'), 120);
  assert.equal(lines(world(3), 'sky'), 0);
  assert.equal(lines(world(2), 'field'), 0, 'dry');
  assert.equal(lines({ level: LEVELS[2], boss: null, wave: 5 }, 'field'), 0, 'level 3 has no weather');
});
