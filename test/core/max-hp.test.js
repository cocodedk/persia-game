import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, stepWorld } from '../../src/core/world.js';
import { ROLES } from '../../src/core/kinds.js';
import { level, wave, IDLE, TICK, step, seconds, playing, shotAt } from './world-kit.js';
import { bossLevel, leave } from './boss-kit.js';

// Every alien carries maxHp, set once where it is made, so nothing downstream (the cracks the
// renderer draws) has to guess it: a wave alien, a boss minion, a reborn wreck and the saucer.

const ROWS = ['grunt', 'diver', 'gunner', 'armored', 'carrier'];

test('a wave alien is made at its maxHp, the armour bonus of a hard level included', () => {
  const w = playing(level([wave({ roles: ROWS, rows: 5, cols: 2 })], 1));
  assert.ok(w.scale.armorBonus > 0, 'd = 1 has an armour bonus');
  assert.equal(w.aliens.length, 10);
  for (const a of w.aliens) assert.equal(a.maxHp, a.hp, a.role);
  const armored = w.aliens.find((a) => a.role === 'armored');
  assert.equal(armored.maxHp, ROLES.armored.hp + w.scale.armorBonus);
  assert.equal(w.aliens.find((a) => a.role === 'grunt').maxHp, ROLES.grunt.hp);
});

test('a boss minion is made at its maxHp, which carries no armour bonus', () => {
  const w = createWorld(bossLevel('agent', 1, { seed: 5 }), 5);
  w.ship.invuln = Infinity;
  assert.ok(w.scale.armorBonus > 0);
  leave(w, ['core', 'lensL', 'lensR', 'nodeL', 'nodeR', 'halo'], 3); // into the phases with minions
  let minion = null;
  for (let i = 0; i < 60 * 40 && !minion; i++) {
    stepWorld(w, TICK, IDLE);
    w.events.length = 0;
    minion = w.aliens.find((a) => a.minion && a.role === 'gunner') ?? null;
  }
  assert.ok(minion, 'a gunner minion launched');
  assert.deepEqual([minion.hp, minion.maxHp], [ROLES.gunner.hp, ROLES.gunner.hp]);
});

test('a reborn armored keeps the maxHp of the alien that fell, so it stands up hurt', () => {
  const w = playing(level([wave({ roles: ['armored'], cols: 3 })], 1, { twist: 'reassemble' }));
  const a = w.aliens[0];
  const max = a.maxHp;
  a.hp = 1;
  shotAt(w, a);
  step(w);
  assert.equal(w.wrecks.length, 1);
  seconds(w, 2.1);
  const back = w.aliens.find((x) => x.reborn);
  assert.ok(back, 'it stood up');
  assert.equal(back.maxHp, max);
  assert.ok(back.hp < back.maxHp);
});

test('the bonus saucer is made at its maxHp and crosses just under the HUD band, at y 104', () => {
  const w = playing(level([wave()], 0, { twist: 'bunkers' }));
  seconds(w, 20.2);
  assert.ok(w.saucer);
  assert.deepEqual([w.saucer.hp, w.saucer.maxHp, w.saucer.y], [1, 1, 104]);
});
