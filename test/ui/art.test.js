import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SPECIES, POWERS } from '../../src/core/kinds.js';
import { level, wave, playing } from '../core/world-kit.js';
import { LOOK } from '../../src/ui/looks/index.js';
import { RATE, HALO, PAINTERS } from '../../src/ui/aliens/animals.js';
import { SPECIES_LIST, speciesSprites, warmAliens } from '../../src/ui/aliens/bake.js';
import { crackStage } from '../../src/ui/aliens/index.js';
import { ICONS } from '../../src/ui/pickup-skins.js';
import { installCanvas } from './dom-kit.js';

installCanvas(1); // canvases are stand-ins that swallow every call (nothing touches the DOM at load)

const at = (maxHp, hp) => crackStage({ role: 'armored', hp, maxHp });

// A wave gunner on a hard level (d > 0.6, so wave gunners get +1 hp).
function hardGunner() {
  const w = playing(level([wave({ roles: ['gunner'] })], 1));
  return [w, w.aliens[0]];
}

test('every species has a painter and a palette colour, and no painter is left over', () => {
  assert.deepEqual(SPECIES_LIST, Object.keys(SPECIES));
  assert.deepEqual(Object.keys(PAINTERS).toSorted(), SPECIES_LIST.toSorted());
  assert.deepEqual(Object.keys(LOOK.palette.alien).toSorted(), SPECIES_LIST.toSorted());
  for (const s of SPECIES_LIST) assert.match(LOOK.palette.alien[s], /^#[0-9a-f]{6}$/, `${s} colour`);
  assert.ok(RATE > 0 && HALO >= 0, 'motion');
});

test('speciesSprites bakes two frames of body, lights and flash for each species', () => {
  for (const s of SPECIES_LIST) {
    const set = speciesSprites(LOOK, s);
    for (const k of ['body', 'lights', 'flash']) assert.equal(set[k].length, 2, `${s} ${k}`);
    assert.equal(set.scale, 1);
    assert.equal(speciesSprites(LOOK, s), set, `${s} is baked once`);
    const big = speciesSprites(LOOK, s, 2);
    assert.equal(big.scale, 2);
    assert.equal(big.flash, null, `${s} at scale 2 is never hit, so it bakes no flash`);
    assert.equal(big.size, set.size * 2, `${s} at scale 2 is drawn twice the size`);
    assert.equal(big.body[0].width, set.body[0].width * 2, `${s} at scale 2 is baked at twice the resolution`);
  }
});

test('warmAliens bakes all eleven without throwing', () => {
  assert.equal(SPECIES_LIST.length, 11);
  assert.doesNotThrow(() => warmAliens(LOOK));
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
