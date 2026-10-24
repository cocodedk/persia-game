import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBunker } from '../../src/core/bunkers.js';
import { autopilot } from '../../src/core/autopilot.js';
import { level, wave, playing, step, IDLE } from './world-kit.js';
import { oneShot, landed } from './autopilot-kit.js';

// Things that stop a shot on its way up: the autopilot picks targets it can reach, and threads
// its shot through the gaps.

const kinds = (events, type) => events.filter((e) => e.type === type).length;

// Fire once from (x, 1000) and say what happened to the shot.
function shotFrom(world, x) {
  const w = structuredClone(world);
  Object.assign(w.ship, { x, y: 1000, vx: 0, vy: 0, cooldown: 0 });
  w.events.length = 0;
  step(w, 1, { ...IDLE, fire: true });
  step(w, 100);
  return w.events;
}

test('it prefers an alien it can shoot over one behind a bunker', () => {
  const world = playing(level([wave({ rows: 1, cols: 2 })], 0, { bunkers: true }));
  world.bunkers = [createBunker(820, 560, 160, 60)];
  Object.assign(world.ship, { x: 940, y: 1000 });
  assert.ok(Math.abs(world.aliens[0].x - 900) < 15 && Math.abs(world.aliens[1].x - 1020) < 15, 'one alien over the bunker');
  assert.ok(autopilot(world).target.x >= 985, `aims at ${autopilot(world).target.x}`);
});

test('it threads a shot past the corner of a bunker, whichever side the bunker is on', () => {
  const lv = level([wave({ rows: 1, cols: 1, formation: 'spiral', speed: 0.001 })], 0, { bunkers: true });
  const free = Math.round(autopilot(playing(lv)).target.x); // where it would shoot without cover
  // The left edge of a bunker 160 px wide: its right edge 6 px past the column (a shot moved 8 px
  // over still clips it), 3 px short of it, or its left edge 4 px past it.
  for (const left of [free + 6 - 160, free - 3 - 160, free + 4]) {
    const world = playing(lv);
    world.bunkers = [createBunker(left, 560, 160, 60)];
    assert.equal(kinds(shotFrom(world, free), 'bunker'), 1, `straight up the alien's column clips the corner (${left})`);
    const events = oneShot(world);
    assert.equal(kinds(events, 'bunker'), 0, `the autopilot's shot goes by (${left})`);
    assert.equal(landed(events).length, 1);
  }
});

test('it keeps its shots out of the gravity well, shooting the aliens either side of it', () => {
  const world = playing(level([wave({ rows: 1, cols: 3, formation: 'spiral', speed: 0.001 })], 0, { twist: 'gravity' }));
  assert.ok(world.well && Math.abs(world.aliens[1].x - 960) < 30);
  assert.equal(kinds(shotFrom(world, 960), 'absorb'), 1, 'a shot up the middle is swallowed');
  const { target } = autopilot(world);
  assert.ok(Math.abs(target.x - 960) > 100, `aims at ${target.x}`);
  const events = oneShot(world);
  assert.equal(kinds(events, 'absorb'), 0);
  assert.equal(landed(events).length, 1);
});
