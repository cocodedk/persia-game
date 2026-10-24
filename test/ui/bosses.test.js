import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BOSS_DEFS } from '../../src/core/bosses-data.js';
import { CHAIN } from '../../src/core/boss-phase.js';
import { BOSS_ART, painterFor } from '../../src/ui/bosses/bake.js';
import { partStage } from '../../src/ui/bosses/parts.js';
import { collapse } from '../../src/ui/bosses/death.js';
import giant from '../../src/ui/bosses/giant.js';

const parts = (kind) => BOSS_DEFS.find((d) => d.kind === kind).parts.map((p) => ({ ...p }));
const dying = (kind, left) => ({ kind, dying: left, parts: parts(kind) });

test('the giant painter is the only one registered and draws every part id of the giant def', () => {
  assert.deepEqual(BOSS_ART, { giant });
  assert.equal(typeof giant.hull, 'function');
  const used = new Set();
  for (const p of BOSS_DEFS.find((d) => d.kind === 'giant').parts) {
    const found = painterFor(giant, p.id);
    assert.ok(found, `giant.${p.id} has a painter`);
    assert.equal(typeof found[0], 'function');
    used.add(found[0]);
  }
  assert.equal(used.size, Object.keys(giant.parts).length, 'no part painter is left over');
});

test('a right-hand part without its own painter is its left twin mirrored', () => {
  const art = { parts: { gun: () => {}, eyeR: () => {} } };
  assert.equal(painterFor(art, 'gunL')[1], 1);
  assert.equal(painterFor(art, 'gunR')[1], -1);
  assert.equal(painterFor(art, 'eyeR')[1], 1, 'its own painter is not mirrored');
  assert.equal(painterFor(art, 'dome'), null);
});

test('armour shows the hp it has lost out of its max: whole, cracked, badly cracked', () => {
  assert.deepEqual([8, 7.75, 5, 4, 3.9, 1, 0.25].map((hp) => partStage({ hp, max: 8 })), [0, 1, 1, 1, 2, 2, 2]);
  assert.equal(partStage({ hp: 0, max: 8 }), 2, 'a destroyed part is drawn as wreckage, not by stage, but never throws');
  assert.equal(partStage({ hp: 3, max: 3 }), 0);
});

test('the collapse starts whole and ends with every part torn off and the hull broken apart', () => {
  const start = collapse(dying('giant', CHAIN), 0);
  assert.equal(start.split, 0);
  assert.ok(start.parts.every((p) => p === null), 'nothing torn off at the start');
  const end = collapse(dying('giant', 0.001), 0.95);
  assert.ok(end.split > 0.99, 'the hull has broken');
  assert.ok(end.parts.every((p) => p !== null), 'every part torn off by the end');
  const [left, right] = end.halves;
  assert.ok(left.dx < 0 && right.dx > 0, 'the halves part sideways');
  assert.ok(left.rot < 0 && right.rot > 0, 'and droop outward');
  assert.ok(end.white > 0.9, 'white-hot at the end');
});

test('the collapse is a pure function of the boss and the chain left', () => {
  for (const def of BOSS_DEFS) {
    const a = collapse(dying(def.kind, CHAIN * 0.4), 1.7);
    const b = collapse(dying(def.kind, CHAIN * 0.4), 1.7);
    assert.deepEqual(a, b, def.kind);
    const torn = a.parts.filter(Boolean);
    assert.ok(torn.length > 0 && torn.length < def.parts.length, `${def.kind}: parts tear off one by one`);
  }
});
