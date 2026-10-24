import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BOSSES } from '../../src/core/kinds.js';
import { bossDef } from '../../src/core/bosses-data.js';
import { ofType } from './world-kit.js';
import { botFight, reachable } from './boss-kit.js';

// The bar every boss has to clear: a bot that stands under the nearest weak part and never stops
// firing, with a ship that cannot be hurt, wins inside 120 simulated seconds. Task 6's autopilot
// builds on the same promise. A boss is the centrepiece of its world, so the bot's win takes 40 to
// 60 s (task 13b: the weak parts' hp is what sets it).
for (const kind of BOSSES) {
  test(`the ${bossDef(kind).name} loses to a bot that just stands under it and fires, in 40 to 60 s`, () => {
    const { world, log } = botFight(kind);
    assert.equal(world.state, 'cleared', `${kind} still standing at ${world.t.toFixed(1)} s, hp ${world.boss.hp}`);
    assert.ok(world.t >= 40 && world.t <= 60, `took ${world.t.toFixed(1)} s`);
    const phases = ofType(log, 'bossPhase').map((e) => e.phase);
    assert.deepEqual(phases, bossDef(kind).phases.slice(1).map((_, i) => i + 1), 'every phase, once, in order');
    assert.equal(ofType(log, 'bossDeath').length, 1);
    assert.equal(ofType(log, 'cleared').length, 1);
    const last = log.findIndex((e) => e.type === 'bossDeath');
    assert.ok(log.slice(last).some((e) => e.type === 'explode' && e.size === 3), 'the finale');
    assert.ok(world.score >= 10000);
  });
}

// "At least one weak part exposed in every phase" has to hold while the fight runs, not just on
// paper: on every tick from the end of the fly-in to the boss's death some live weak part has a
// clear column from the player zone.
for (const kind of BOSSES) {
  test(`the ${bossDef(kind).name} always has a live weak part a shot can reach`, () => {
    let ticks = 0;
    const { world } = botFight(kind, 120, (w) => {
      if (w.boss.enter > 0 || w.boss.dying !== null) return;
      ticks++;
      const weak = w.boss.parts.filter((p) => p.hp > 0 && p.weak);
      assert.ok(weak.some((p) => reachable(w, p)),
        `${kind} at ${w.t.toFixed(2)} s (phase ${w.boss.phase}): live weak ${weak.map((p) => p.id)} but none reachable`);
    });
    assert.equal(world.state, 'cleared');
    assert.ok(ticks > 60 * 10, `${ticks} ticks checked`);
  });
}
