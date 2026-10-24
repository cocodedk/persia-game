import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, stepWorld } from '../../src/core/world.js';
import { finished } from '../../src/core/util.js';
import { LEVEL } from '../../src/core/levels.js';
import { autopilot } from '../../src/core/autopilot.js';
import { TICK } from '../../src/core/kinds.js';
import { realLevel } from './boss-kit.js';

// The aim is the autopilot's whole skill, so it is measured on real flights: the waves and the boss,
// quiet (nothing shoots back), ship invulnerable, power-ups swept away (a spread would blur the
// count). A ship that fires constantly wastes shots while it travels between targets and when a
// column is already empty, so the bar is a share of all shots, not all of them. The autopilot lands
// 47-49 % on level 1's waves and 86 % on the giant; on invaders' levels one that did not lead its
// targets landed 9-46 % on waves and 41-77 % on bosses.

const USEFUL = new Set(['partDown', 'wreckDown']);
const useful = (e) => USEFUL.has(e.type) || (e.type === 'hit' && e.dmg > 0) || (e.type === 'kill' && e.scored);

function shotShare(level) {
  const world = createWorld(level, level.seed);
  world.scale.fireMult = 0;
  world.ship.invuln = Infinity;
  let before = new Set();
  let ended = 0;
  let landed = 0;
  while (!finished(world) && world.t < 120) {
    stepWorld(world, TICK, autopilot(world));
    world.pickups.length = 0;
    const now = new Set(world.shots);
    ended += [...before].filter((s) => !now.has(s)).length;
    landed += world.events.filter(useful).length;
    world.events.length = 0;
    before = now;
  }
  return { share: landed / ended, state: world.state, ended };
}

// The level's waves and its boss are measured apart: their bars differ.
const PARTS = [["level 1's waves", { ...LEVEL, boss: undefined }, 0.3], ['the giant', realLevel('giant'), 0.65]];

test('the autopilot clears the waves and the giant, and most of its shots land (waves 30 %, boss 65 %)', () => {
  for (const [what, level, bar] of PARTS) {
    const { share, state, ended } = shotShare(level);
    assert.equal(state, 'cleared', what);
    assert.ok(ended > 100, `${what}: only ${ended} shots`);
    assert.ok(share >= bar, `${what}: ${(share * 100).toFixed(0)} % of ${ended} shots landed`);
  }
});
