import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, stepWorld } from '../../src/core/world.js';
import { finished } from '../../src/core/util.js';
import { LEVELS, WORLDS } from '../../src/core/levels.js';
import { autopilot } from '../../src/core/autopilot.js';
import { TICK } from '../../src/core/kinds.js';

// The aim is the autopilot's whole skill, so it is measured on real flights: every level, quiet
// (nothing shoots back), ship invulnerable, power-ups swept away (a spread would blur the count).
// A ship that fires constantly wastes shots while it travels between targets and when a column is
// already empty, so the bar is a share of all shots, not all of them. The autopilot lands 35-62 %
// on the wave levels and 77-84 % on the bosses; one that does not lead its targets lands 9-46 %
// and 41-77 %.

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

for (const { id: n } of WORLDS) {
  test(`world ${n}: the autopilot clears its levels, and most of its shots land (waves 30 %, boss 65 %)`, () => {
    for (const level of LEVELS.filter((l) => l.world === n)) {
      const { share, state, ended } = shotShare(level);
      assert.equal(state, 'cleared', level.id);
      assert.ok(ended > 100, `${level.id}: only ${ended} shots`);
      assert.ok(share >= (level.boss ? 0.65 : 0.3), `${level.id}: ${(share * 100).toFixed(0)} % of ${ended} shots landed`);
    }
  });
}
