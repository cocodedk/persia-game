import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROLES, POWERS } from '../../src/core/kinds.js';
import { level, wave, playing } from '../core/world-kit.js';
import { LOOK } from '../../src/ui/looks/index.js';
import { ART, ROLE_LIST } from '../../src/ui/aliens/bake.js';
import { crackStage } from '../../src/ui/aliens/index.js';
import { ICONS } from '../../src/ui/pickup-skins.js';

const at = (maxHp, hp) => crackStage({ role: 'armored', hp, maxHp });

// A wave gunner on a hard level (d > 0.6, so wave gunners get +1 hp).
function hardGunner() {
  const w = playing(level([wave({ roles: ['gunner'] })], 1));
  return [w, w.aliens[0]];
}

test('the art paints all five roles', () => {
  assert.deepEqual(ROLE_LIST.toSorted(), Object.keys(ROLES).toSorted());
  for (const role of ROLE_LIST) assert.equal(typeof ART[role], 'function', role);
  assert.ok(ART.rate > 0 && ART.halo >= 0 && ART.bob >= 0, 'motion');
});

test("cracks follow the hp lost out of the alien's own maxHp: 3 hp shows 0, 1, 2; 5 hp stretches them", () => {
  assert.deepEqual([3, 2, 1].map((hp) => at(3, hp)), [0, 1, 2]);
  assert.deepEqual([5, 4, 3, 2, 1].map((hp) => at(5, hp)), [0, 1, 1, 2, 2]);
  assert.deepEqual([2, 1].map((hp) => at(2, hp)), [0, 1]);
  assert.equal(at(1, 1), 0, 'one-hit aliens never crack');
  assert.equal(crackStage({ role: 'armored', hp: 2 }), 0, 'an alien without maxHp is drawn whole');
});

test('a fresh gunner with an armour bonus is drawn whole, and one hit only cracks it', () => {
  const [w, g] = hardGunner();
  assert.ok(w.scale.armorBonus > 0, 'd = 1 has an armour bonus');
  assert.equal(crackStage(g), 0);
  assert.equal(crackStage({ ...g, hp: g.hp - 1 }), 1);
});

test('every power has a pickup icon, and the look a colour for it', () => {
  for (const kind of [...POWERS, 'bomb']) {
    assert.equal(typeof ICONS[kind], 'function', `${kind} icon`);
    assert.equal(typeof LOOK.power[kind], 'string', `${kind} colour`);
  }
});
