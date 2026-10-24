import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BOSS_DEFS, bossDef } from '../../src/core/bosses-data.js';
import { BOSSES, PATTERNS, ROLES, HUD_BOTTOM } from '../../src/core/kinds.js';
import { WARN } from '../../src/core/boss-attack.js';

const sum = (parts) => parts.reduce((n, p) => n + p.hp, 0);

// The weak parts by the time phase `i` begins: weak from the start, or opened by phase i or before.
const weakAt = (def, i) => def.parts.filter((p) =>
  p.weak || def.phases.some((ph, j) => j <= i && ph.open?.includes(p.id)));

test('there is a definition for every boss kind, in order, looked up by kind', () => {
  assert.deepEqual(BOSS_DEFS.map((d) => d.kind), BOSSES);
  for (const kind of BOSSES) assert.equal(bossDef(kind).kind, kind);
  assert.equal(bossDef('nope'), undefined);
});

test('each definition is plain data: maxHp is the sum of its parts, ids are unique, parts fit the size', () => {
  for (const def of BOSS_DEFS) {
    assert.equal(def.maxHp, sum(def.parts), def.kind);
    assert.equal(new Set(def.parts.map((p) => p.id)).size, def.parts.length, `${def.kind} ids`);
    assert.equal(typeof def.name, 'string');
    assert.doesNotThrow(() => structuredClone(def));
    for (const p of def.parts) {
      assert.ok(p.hp > 0 && p.w > 0 && p.h > 0, `${def.kind}/${p.id}`);
      assert.ok(!(p.weak && p.armor), `${def.kind}/${p.id} is weak or armoured, not both`);
      assert.ok(Math.abs(p.dx) + p.w / 2 <= def.size.w / 2, `${def.kind}/${p.id} fits the width`);
      assert.ok(Math.abs(p.dy) + p.h / 2 <= def.size.h / 2, `${def.kind}/${p.id} fits the height`);
    }
    assert.ok(def.y - def.size.h / 2 >= 0 && def.y + def.size.h / 2 <= 620, `${def.kind} stays above the player zone`);
  }
});

// Ruling R28: at its resting place (before any sway, hover or charge) no part is under the HUD,
// which ends at HUD_BOTTOM (y 96), so every silhouette is seen whole.
test('at rest every part of every boss is below the HUD (no rect top above y 100)', () => {
  for (const def of BOSS_DEFS) {
    for (const p of def.parts) {
      const top = def.y + p.dy - p.h / 2;
      assert.ok(top >= HUD_BOTTOM + 4, `${def.kind}/${p.id} top at y ${top}`);
    }
  }
});

test('every boss has 2 or 3 phases at falling hp thresholds, the last at 0', () => {
  for (const def of BOSS_DEFS) {
    const n = def.phases.length;
    assert.ok(n >= 2 && n <= 3, `${def.kind} has ${n} phases`);
    const until = def.phases.map((p) => p.until);
    assert.equal(until[n - 1], 0);
    for (let i = 0; i < n - 1; i++) assert.ok(until[i] > until[i + 1] && until[i] < 1, `${def.kind} thresholds`);
    for (const ph of def.phases) assert.ok(['sway', 'hover', 'charge', 'orbit'].includes(ph.move), ph.move);
  }
});

test('every phase of every boss defines a weak part, and the bare hulls fit inside the last phase', () => {
  for (const def of BOSS_DEFS) {
    def.phases.forEach((ph, i) => assert.ok(weakAt(def, i).length >= 1, `${def.kind} phase ${i}`));
    // Hulls cannot be hurt until a phase opens them: their hp must be what is left when the last
    // phase begins, or a boss reduced to its hulls could not be finished.
    const hulls = def.parts.filter((p) => !p.weak && !p.armor);
    const opens = hulls.every((p) => def.phases.some((ph) => ph.open?.includes(p.id)));
    assert.ok(opens, `${def.kind}: every hull is opened by some phase`);
    const last = def.phases.at(-2).until;
    assert.ok(sum(hulls) <= last * def.maxHp + 1e-9, `${def.kind}: hulls hold ${sum(hulls)} of ${def.maxHp}`);
  }
});

test('attacks come from real parts with real patterns, and are slower than their own telegraph', () => {
  for (const def of BOSS_DEFS) {
    const ids = def.parts.map((p) => p.id);
    for (const ph of def.phases) {
      assert.ok(ph.attacks.length >= 1, `${def.kind} attacks in every phase`);
      for (const a of ph.attacks) {
        assert.ok(PATTERNS.includes(a.pattern), `${def.kind}: ${a.pattern}`);
        assert.ok(ids.includes(a.from), `${def.kind}: from ${a.from}`);
        assert.ok(a.every >= WARN + 0.8, `${def.kind} ${a.pattern} every ${a.every}`);
      }
      for (const m of ph.minions ?? []) {
        assert.ok(m.role in ROLES && m.count >= 1 && m.every >= 4, `${def.kind} minions`);
        assert.ok(ids.includes(m.from), `${def.kind}: minions from ${m.from}`);
      }
    }
  }
  assert.ok(WARN >= 0.6, 'the telegraph is at least 0.6 s');
});
