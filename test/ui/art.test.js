import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROLES, TICK } from '../../src/core/kinds.js';
import { createBunker, BUNKER } from '../../src/core/bunkers.js';
import { createWorld, stepWorld } from '../../src/core/world.js';
import { levelById } from '../../src/core/levels.js';
import { IDLE } from '../core/world-kit.js';
import { leave } from '../core/boss-kit.js';
import { LOOKS } from '../../src/ui/looks/index.js';
import { art, ROLE_LIST } from '../../src/ui/aliens/bake.js';
import { crackStage } from '../../src/ui/aliens/index.js';
import { SKINS } from '../../src/ui/bunker-skins.js';
import { FRAMES, ICONS } from '../../src/ui/pickup-skins.js';
import { rgb } from '../../src/ui/sprites.js';

const at = (maxHp, hp) => crackStage({ role: 'armored', hp, maxHp });

// The first gunner minion of the real Code Rain boss fight (d > 0.6, so wave gunners get +1 hp).
function minionGunner() {
  const w = createWorld(levelById('w6-5'));
  w.ship.invuln = Infinity;
  leave(w, ['core', 'lensL', 'lensR', 'nodeL', 'nodeR', 'halo'], 3);
  for (let i = 0; i < 60 * 40; i++) {
    stepWorld(w, TICK, IDLE);
    w.events.length = 0;
    const m = w.aliens.find((a) => a.minion && a.role === 'gunner');
    if (m) return [w, m];
  }
  throw new Error('no gunner minion launched');
}

test('every world paints all five roles, and the saucer and the wreck where they fly', () => {
  assert.deepEqual(ROLE_LIST.toSorted(), Object.keys(ROLES).toSorted());
  for (const look of LOOKS) {
    const a = art(look);
    for (const role of ROLE_LIST) assert.equal(typeof a[role], 'function', `w${look.world} ${role}`);
    assert.ok(a.rate > 0 && a.halo >= 0 && a.bob >= 0, `w${look.world} motion`);
  }
  assert.equal(typeof art(LOOKS[0]).saucer, 'function', 'the bonus saucer crosses world 1');
  assert.equal(typeof art(LOOKS[6]).wreck, 'function', 'armored wrecks lie in world 7');
});

test("cracks follow the hp lost out of the alien's own maxHp: 3 hp shows 0, 1, 2; 5 hp stretches them", () => {
  assert.deepEqual([3, 2, 1].map((hp) => at(3, hp)), [0, 1, 2]);
  assert.deepEqual([5, 4, 3, 2, 1].map((hp) => at(5, hp)), [0, 1, 1, 2, 2]);
  assert.deepEqual([2, 1].map((hp) => at(2, hp)), [0, 1]);
  assert.equal(at(1, 1), 0, 'one-hit aliens never crack');
  assert.equal(crackStage({ role: 'armored', hp: 2 }), 0, 'an alien without maxHp is drawn whole');
});

test('a fresh boss minion gunner on a hard level is drawn whole, and one hit only cracks it', () => {
  const [w, m] = minionGunner();
  assert.ok(w.scale.armorBonus > 0, 'w6-5 has an armour bonus that minions do not get');
  assert.equal(crackStage(m), 0);
  assert.equal(crackStage({ ...m, hp: m.hp - 1 }), 1);
});

test('every look names a bunker skin that colours every pixel of a bunker sensibly', () => {
  const b = createBunker(0, 0, BUNKER.w, BUNKER.h);
  for (const look of LOOKS) {
    const skin = SKINS[look.bunker.skin];
    assert.equal(typeof skin, 'function', `w${look.world} skin ${look.bunker.skin}`);
    const P = {};
    for (const k of ['fill', 'light', 'dark', 'edge', 'accent']) P[k] = rgb(look.bunker[k] ?? look.bunker.light);
    for (let y = 0; y < b.h; y++) {
      for (let x = 0; x < b.w; x++) {
        const [c, k] = skin(x, y, b.w, b.h, P);
        assert.ok(Array.isArray(c) && c.length === 3, `w${look.world} colour at ${x},${y}`);
        assert.ok(Number.isFinite(k) && Math.abs(k) <= 1, `w${look.world} k ${k} at ${x},${y}`);
      }
    }
  }
});

test('every world has its own pickup rim, and the spec examples have their own icons', () => {
  for (const look of LOOKS) assert.equal(typeof FRAMES[look.world], 'function', `w${look.world} frame`);
  assert.equal(typeof ICONS[2].laser, 'function', "Neon Rain's laser is a neon beam");
  assert.equal(typeof ICONS[4].spread, 'function', "Ronin Moon's spread is a fan of throwing stars");
});
