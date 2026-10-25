import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, stepWorld } from '../../src/core/world.js';
import { WARN, stepMinions } from '../../src/core/boss-attack.js';
import { BOSS_DEFS, bossDef } from '../../src/core/bosses-data.js';
import { IDLE, TICK, seconds, drain, ofType, shotAt } from './world-kit.js';
import { bossLevel, bossWorld, part, leave, realLevel } from './boss-kit.js';

const live = (kind, d = 1) => {
  const w = createWorld(bossLevel(kind, d, { seed: 5 }), 5);
  w.ship.invuln = Infinity;
  return w;
};

test('every attack is announced by a bossWarn at least 0.6 s before its bullets appear', () => {
  for (const { kind } of BOSS_DEFS) {
    const w = live(kind);
    const warns = [];
    let fired = 0;
    for (let i = 0; i < 60 * 40; i++) {
      stepWorld(w, TICK, IDLE);
      for (const e of w.events.splice(0)) {
        if (e.type === 'bossWarn') warns.push(e);
        if (e.type === 'fire' && e.role === 'boss') {
          const at = warns.findIndex((x) => x.part === e.id && x.pattern === e.pattern);
          assert.ok(at >= 0, `${kind}: ${e.pattern} from ${e.id} fired with no warning`);
          assert.ok((e.tick - warns[at].tick) * TICK >= 0.6 - 1e-9, `${kind}: warned only ${(e.tick - warns[at].tick) * TICK} s ahead`);
          warns.splice(at, 1);
          fired++;
        }
      }
    }
    assert.ok(fired >= 5, `${kind} attacked ${fired} times in 40 s`);
  }
});

test('bossWarn carries what the renderer needs, and boss.warns holds the pending ones', () => {
  const w = live('giant');
  let warn;
  for (let i = 0; i < 60 * 20 && !warn; i++) {
    stepWorld(w, TICK, IDLE);
    warn = ofType(w.events, 'bossWarn')[0];
  }
  assert.ok(warn);
  assert.deepEqual(Object.keys(warn).sort(), ['kind', 'part', 'pattern', 'tick', 'type', 'warn', 'x', 'y']);
  assert.equal(warn.warn, WARN);
  assert.equal(w.boss.warns.length, 1);
  assert.deepEqual([w.boss.warns[0].part, w.boss.warns[0].pattern], [warn.part, warn.pattern]);
});

test('a destroyed part stops attacking, and an attack in its telegraph is cancelled', () => {
  const w = live('giant');
  const eyeL = part(w, 'eyeL');
  for (let i = 0; i < 60 * 30 && !w.boss.warns.some((x) => x.part === 'eyeL'); i++) stepWorld(w, TICK, IDLE);
  assert.ok(w.boss.warns.some((x) => x.part === 'eyeL'), 'eyeL started an attack');
  eyeL.hp = 0;
  w.events.length = 0;
  for (let i = 0; i < 60 * 12; i++) stepWorld(w, TICK, IDLE);
  assert.equal(w.events.filter((e) => e.type === 'fire' && e.id === 'eyeL').length, 0);
});

test('a quiet world (fireMult 0) never attacks', () => {
  const w = bossWorld('giant');
  leave(w, ['mouth'], 3);
  seconds(w, 30);
  const ev = drain(w);
  assert.equal(ofType(ev, 'bossWarn').length, 0);
  assert.equal(ofType(ev, 'fire').length, 0);
});

test('later phases bring minions that fly at the ship, and a carrier among them drops a power-up', () => {
  const w = live('giant', 0);
  leave(w, ['eyeL', 'eyeR', 'mouth', 'brow'], 5); // the carrier (a rabbit) comes from the brow: it must stand
  assert.deepEqual(bossDef('giant').phases[2].minions.map((m) => m.role), ['diver', 'carrier']);
  const seen = new Set();
  for (let i = 0; i < 60 * 45; i++) {
    stepWorld(w, TICK, IDLE);
    w.events.length = 0;
    for (const a of w.aliens) {
      assert.ok(a.minion && a.slot === null, 'minions have no formation slot');
      seen.add(a.role);
    }
  }
  assert.ok(seen.has('diver') && seen.has('carrier'), [...seen].join());
  assert.ok(w.aliens.length <= 8, 'bounded');
  for (let i = 0; i < 60 * 30 && !w.aliens.some((a) => a.role === 'carrier'); i++) stepWorld(w, TICK, IDLE);
  shotAt(w, w.aliens.find((a) => a.role === 'carrier'));
  stepWorld(w, TICK, IDLE);
  assert.equal(w.pickups.length, 1);
});

// One minion group, due now, from the giant's mouth: stepMinions on its own.
function launch(w, count = 3, species = 'cat') {
  const def = { phases: [{ minions: [{ species, role: 'diver', count, every: 10, from: 'mouth' }] }] };
  w.boss.phase = 0;
  w.boss.mcd = [0];
  stepMinions(w, w.boss, def, 0);
  return ofType(drain(w), 'minion');
}

test('a launch emits one minion event with the species and how many left the giant', () => {
  const w = bossWorld('giant');
  const sent = launch(w, 3, 'rabbit');
  assert.equal(sent.length, 1);
  assert.equal(sent[0].species, 'rabbit');
  assert.equal(sent[0].count, 3);
  assert.equal(w.aliens.filter((a) => a.minion).length, 3);
});

test('a destroyed part sends nothing and says nothing', () => {
  const w = bossWorld('giant');
  part(w, 'mouth').hp = 0;
  assert.equal(launch(w).length, 0);
  assert.equal(w.aliens.length, 0);
});

test('the cap counts what was launched: a full screen says nothing, a nearly full one only what fit', () => {
  const w = bossWorld('giant');
  for (let i = 0; i < 6; i++) w.aliens.push({ id: 100 + i, minion: true, hp: 1 });
  const sent = launch(w, 3);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].count, 2);
  assert.equal(launch(w).length, 0, 'eight are out: no room');
  assert.equal(w.aliens.length, 8);
});

test('the boss stays on screen and above the player zone in every phase of a real fight', () => {
  for (const { kind } of BOSS_DEFS) {
    const def = bossDef(kind);
    const w = createWorld(realLevel(kind));
    w.ship.invuln = Infinity;
    let low = 0;
    def.phases.forEach((ph, k) => {
      const frac = k === 0 ? 1 : def.phases[k - 1].until - 0.02;
      for (const p of w.boss.parts) p.hp = p.max * frac;
      for (let i = 0; i < 60 * 20; i++) {
        stepWorld(w, TICK, IDLE);
        w.events.length = 0;
        for (const p of w.boss.parts) {
          low = Math.max(low, p.y + p.h / 2);
          assert.ok(p.x - p.w / 2 >= 0 && p.x + p.w / 2 <= 1920, `${kind}/${p.id} at x ${p.x}`);
        }
      }
      assert.equal(w.boss.phase, k, `${kind} is in phase ${k}`);
    });
    assert.ok(low <= 600, `${kind} reached y ${low}`);
  }
});

test('boss fights are deterministic and the world survives structuredClone mid-fight', () => {
  const run = (clone) => {
    let w = createWorld(realLevel('giant'));
    w.ship.invuln = Infinity;
    for (let i = 0; i < 60 * 25; i++) {
      stepWorld(w, TICK, IDLE);
      if (clone && i === 600) w = structuredClone(w);
    }
    return JSON.stringify(w);
  };
  assert.equal(run(false), run(false));
  assert.equal(run(true), run(false));
});
