import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installCanvas } from './dom-kit.js';

// What is baked when (Pi 4: at load, never mid-fight). Canvases are stand-ins that swallow every call.
installCanvas(64);
const { warmAliens, roleSprites } = await import('../../src/ui/aliens/bake.js');
const { CRACKABLE } = await import('../../src/ui/aliens/cracks.js');
const { bossArt, warmBoss } = await import('../../src/ui/bosses/bake.js');
const { BOSS_DEFS } = await import('../../src/core/bosses-data.js');
const { LOOK } = await import('../../src/ui/looks/index.js');

test('warmAliens bakes the cracked bodies of every role that can be hurt and live', () => {
  assert.deepEqual(CRACKABLE.toSorted(), ['armored', 'gunner']);
  warmAliens(LOOK);
  for (const role of CRACKABLE) {
    const set = roleSprites(LOOK, role);
    assert.equal(Object.keys(set.cracks).length, 4, `${role}: 2 frames x 2 stages`);
  }
});

test('warmBoss bakes every damage state the fight can show, and the hull flash; bossArt alone does not', () => {
  for (const def of BOSS_DEFS) {
    const art = bossArt(LOOK, def.kind);
    assert.equal(art.hull.flash, null, `${def.kind}: a boss only drawn whole has no flash`);
    const B = warmBoss(LOOK, def.kind);
    assert.equal(B, art, 'the same bake, completed');
    assert.ok(B.hull.flash, `${def.kind} flash`);
    for (const p of def.parts) {
      const set = B.parts[p.id];
      assert.ok(set.cracks[1] && set.cracks[2] && set.wreck, `${def.kind}.${p.id} cracked and wreck`);
      if (p.armor) assert.ok(set.exposed, `${def.kind}.${p.id} exposed`);
      if (set.open) assert.ok(set.openWreck, `${def.kind}.${p.id} wrecked open`);
    }
  }
});
