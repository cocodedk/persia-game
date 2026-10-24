import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, stepWorld } from '../../src/core/world.js';
import { ROLES } from '../../src/core/kinds.js';
import { level, wave, IDLE, TICK, playing } from './world-kit.js';
import { bossLevel, leave } from './boss-kit.js';

// Every alien carries maxHp, set once where it is made, so nothing downstream (the cracks the
// renderer draws) has to guess it: a wave alien and a boss minion.

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

test('a boss minion is made at its maxHp', () => {
  const w = createWorld(bossLevel('mothership', 1, { seed: 5 }), 5);
  w.ship.invuln = Infinity;
  assert.ok(w.scale.armorBonus > 0);
  leave(w, ['gunL', 'gunR', 'eye'], 5); // into the last phase: grunts from the eye
  let minion = null;
  for (let i = 0; i < 60 * 40 && !minion; i++) {
    stepWorld(w, TICK, IDLE);
    w.events.length = 0;
    minion = w.aliens.find((a) => a.minion && a.role === 'grunt') ?? null;
  }
  assert.ok(minion, 'a grunt minion launched');
  assert.deepEqual([minion.hp, minion.maxHp], [ROLES.grunt.hp, ROLES.grunt.hp]);
});
