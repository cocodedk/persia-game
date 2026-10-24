import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, stepWorld } from '../../src/core/world.js';
import { finished } from '../../src/core/util.js';
import { levelById } from '../../src/core/levels.js';
import { autopilot } from '../../src/core/autopilot.js';
import { TICK } from '../../src/core/kinds.js';

// The Pi 4 gets 16 ms a frame for everything, so the simulation gets a small slice of it.
// w5-4 is the busiest level: flown by the autopilot it holds the most enemy bullets (up to the cap
// of 400, 98 on average) and has gunners, rings and spirals all at once.

const p95 = (list) => [...list].sort((a, b) => a - b)[Math.floor(list.length * 0.95)];

test('stepWorld on the busiest level stays under 2 ms per tick at the 95th percentile, and the autopilot under 1.5 ms', () => {
  const level = levelById('w5-4');
  const world = createWorld(level, level.seed);
  const steps = [];
  const pilots = [];
  let peak = 0;
  while (!finished(world) && world.t < 60) {
    const t0 = performance.now();
    const input = autopilot(world);
    const t1 = performance.now();
    stepWorld(world, TICK, input);
    steps.push(performance.now() - t1);
    pilots.push(t1 - t0);
    world.events.length = 0;
    peak = Math.max(peak, world.bullets.length);
  }
  assert.ok(steps.length >= 1200, `only ${steps.length} ticks were measured`);
  assert.ok(peak >= 150, `the level is not busy any more (${peak} bullets at most): pick the busiest again`);
  assert.ok(p95(steps) < 2, `stepWorld p95 ${p95(steps).toFixed(3)} ms`);
  assert.ok(p95(pilots) < 1.5, `autopilot p95 ${p95(pilots).toFixed(3)} ms`);
});
