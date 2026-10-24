import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from '../../src/core/world.js';
import { hurtPart } from '../../src/core/boss-hit.js';
import { BOSS_DEFS, bossDef } from '../../src/core/bosses-data.js';
import { step, seconds, drain, ofType } from './world-kit.js';
import { bossLevel, bossWorld, part, shotOn, leave } from './boss-kit.js';

test('every boss level spawns its boss: parts copied from the definition, hp the sum of the parts', () => {
  for (const { kind } of BOSS_DEFS) {
    const w = createWorld(bossLevel(kind), 1);
    const b = w.boss;
    assert.equal(b.kind, kind);
    assert.equal(b.phase, 0);
    assert.equal(b.hp, b.maxHp);
    assert.equal(b.hp, b.parts.reduce((n, p) => n + p.hp, 0));
    assert.deepEqual(w.aliens, [], `${kind} brings no wave`);
    assert.doesNotThrow(() => structuredClone(w), `${kind} survives structuredClone`);
  }
});

test('the boss flies in during the intro and cannot be hurt until it has arrived', () => {
  const w = createWorld(bossLevel('giant'), 1);
  const top = w.boss.y;
  const mouth = part(w, 'mouth');
  const hp = mouth.hp;
  seconds(w, 1.6);
  assert.equal(w.state, 'play');
  assert.ok(w.boss.y > top, 'it descends');
  assert.ok(w.boss.enter > 0);
  w.shots.push({ pattern: 'shot', x: mouth.x, y: mouth.y + 5, vx: 0, vy: -1400, r: 5, life: 1, dmg: 1 });
  step(w);
  assert.equal(mouth.hp, hp);
  seconds(w, 1);
  assert.equal(w.boss.enter, 0);
});

test('a weak part takes full damage and an armour plate 25 %', () => {
  const w = bossWorld('giant');
  const [eye, paw] = ['eyeL', 'pawL'].map((id) => part(w, id));
  const before = [eye.hp, paw.hp];
  for (const p of [eye, paw]) shotOn(w, p);
  step(w);
  assert.deepEqual([eye.hp, paw.hp], [before[0] - 1, before[1] - 0.25]);
  const hits = ofType(drain(w), 'hit').filter((e) => e.role === 'boss');
  assert.deepEqual(hits.map((e) => [e.part, e.dmg]).sort(), [['eyeL', 1], ['pawL', 0.25]]);
  assert.equal(w.shots.filter((s) => s.life > 0).length, 0, 'every shot was spent');
  assert.equal(w.boss.hp, w.boss.maxHp - 1.25);
});

test('a shot is spent on the first part it meets: the mouth shields the brow, which is open once the mouth is gone', () => {
  const w = bossWorld('giant');
  const [mouth, brow] = ['mouth', 'brow'].map((id) => part(w, id));
  w.shots.push({ pattern: 'shot', x: brow.x, y: 700, vx: 0, vy: -1400, r: 5, life: 2, dmg: 1 });
  seconds(w, 0.5);
  assert.equal(brow.hp, brow.max, 'the brow sits right behind the mouth');
  assert.equal(mouth.hp, mouth.max - 1, 'the mouth hangs lowest in that column');
  mouth.hp = 0;
  w.shots.push({ pattern: 'shot', x: brow.x, y: 700, vx: 0, vy: -1400, r: 5, life: 2, dmg: 1 });
  seconds(w, 0.5);
  assert.equal(brow.hp, brow.max - 0.25, 'with the mouth gone the brow takes the shot');
});

test('when the last weak part falls the plates crack open: bossExpose once, and they take full damage', () => {
  const w = bossWorld('giant');
  part(w, 'eyeL').hp = 0;
  part(w, 'eyeR').hp = 0;
  step(w);
  assert.equal(ofType(drain(w), 'bossExpose').length, 0, 'the mouth is still a weak point');
  hurtPart(w, part(w, 'mouth'), 1000);
  const ev = ofType(drain(w), 'bossExpose');
  assert.deepEqual(ev.map((e) => e.parts), [['brow', 'pawL', 'pawR']]);
  assert.deepEqual([ev[0].kind, typeof ev[0].x, typeof ev[0].y], ['giant', 'number', 'number']);
  for (const id of ['brow', 'pawL', 'pawR']) {
    const p = part(w, id);
    assert.deepEqual([p.weak, p.armor, p.cracked], [true, false, true], id);
  }
  const paw = part(w, 'pawL');
  const hp = paw.hp;
  shotOn(w, paw);
  step(w);
  assert.equal(paw.hp, hp - 1, 'a cracked plate takes a whole point');
  seconds(w, 3);
  assert.equal(ofType(drain(w), 'bossExpose').length, 0, 'once per occurrence');
});

test('a destroyed part reports itself and stops blocking', () => {
  const w = bossWorld('giant');
  const mouth = part(w, 'mouth');
  hurtPart(w, mouth, 1000);
  const ev = drain(w);
  assert.equal(mouth.hp, 0);
  assert.deepEqual(ofType(ev, 'partDown').map((e) => e.part), ['mouth']);
  assert.ok(ofType(ev, 'explode').length >= 1);
  assert.equal(w.boss.hp, w.boss.maxHp - mouth.max);
  hurtPart(w, mouth, 5);
  assert.equal(ofType(drain(w), 'partDown').length, 0, 'once');
  shotOn(w, mouth);
  step(w);
  assert.equal(w.boss.hp, w.boss.maxHp - mouth.max, 'a shot flies through where the mouth was');
});

test('damage crossing two thresholds in one tick emits two bossPhase events in order, landing in the later phase', () => {
  const w = bossWorld('giant');
  leave(w, ['eyeL', 'brow'], 1);
  step(w);
  const phases = ofType(drain(w), 'bossPhase');
  assert.deepEqual(phases.map((e) => e.phase), [1, 2]);
  assert.equal(w.boss.phase, 2);
  step(w, 5);
  assert.equal(ofType(drain(w), 'bossPhase').length, 0, 'each threshold is crossed once');
});

test('a phase change fires when one hit carries the boss over a threshold, not before', () => {
  const w = bossWorld('giant');
  const line = bossDef('giant').phases[0].until * w.boss.maxHp; // phase 1 begins at this hp
  hurtPart(w, part(w, 'mouth'), w.boss.hp - line - 1);
  assert.equal(w.boss.phase, 0, 'one point above the first threshold');
  hurtPart(w, part(w, 'eyeL'), 2);
  assert.equal(w.boss.phase, 1);
  assert.deepEqual(ofType(drain(w), 'bossPhase').map((e) => e.phase), [1]);
});
