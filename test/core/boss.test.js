import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from '../../src/core/world.js';
import { hurtPart } from '../../src/core/boss-hit.js';
import { BOSSES } from '../../src/core/kinds.js';
import { bossDef } from '../../src/core/bosses-data.js';
import { step, seconds, drain, ofType } from './world-kit.js';
import { bossLevel, bossWorld, part, shotOn, leave } from './boss-kit.js';

test('every boss level spawns its boss: parts copied from the definition, hp the sum of the parts', () => {
  for (const kind of BOSSES) {
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
  const w = createWorld(bossLevel('mothership'), 1);
  const top = w.boss.y;
  const eye = part(w, 'eye');
  const hp = eye.hp;
  seconds(w, 1.6);
  assert.equal(w.state, 'play');
  assert.ok(w.boss.y > top, 'it descends');
  assert.ok(w.boss.enter > 0);
  w.shots.push({ pattern: 'shot', x: eye.x, y: eye.y + 5, vx: 0, vy: -1400, r: 5, life: 1, dmg: 1 });
  step(w);
  assert.equal(eye.hp, hp);
  seconds(w, 1);
  assert.equal(w.boss.enter, 0);
});

test('a weak part takes full damage, an armour plate 25 %, and a bare hull none', () => {
  const w = bossWorld('mothership');
  const [gun, wing, dome] = ['gunL', 'wingL', 'dome'].map((id) => part(w, id));
  Object.assign(dome, { weak: false, armor: false }); // a bare hull
  const before = [gun.hp, wing.hp, dome.hp];
  for (const p of [gun, wing, dome]) shotOn(w, p);
  step(w);
  assert.deepEqual([gun.hp, wing.hp, dome.hp], [before[0] - 1, before[1] - 0.25, before[2]]);
  const hits = ofType(drain(w), 'hit').filter((e) => e.role === 'boss');
  assert.deepEqual(hits.map((e) => [e.part, e.dmg]).sort(), [['dome', 0], ['gunL', 1], ['wingL', 0.25]]);
  assert.equal(w.shots.filter((s) => s.life > 0).length, 0, 'every shot was spent');
  assert.equal(w.boss.hp, w.boss.maxHp - 1.25);
});

test('a shot is spent on the first part it meets: the eye shields the dome, which is open once the eye is gone', () => {
  const w = bossWorld('mothership');
  const [eye, dome] = ['eye', 'dome'].map((id) => part(w, id));
  w.shots.push({ pattern: 'shot', x: dome.x, y: 700, vx: 0, vy: -1400, r: 5, life: 2, dmg: 1 });
  seconds(w, 0.5);
  assert.equal(dome.hp, dome.max, 'the dome sits right behind the eye');
  assert.equal(eye.hp, eye.max - 1, 'the eye hangs lowest in that column');
  eye.hp = 0;
  w.shots.push({ pattern: 'shot', x: dome.x, y: 700, vx: 0, vy: -1400, r: 5, life: 2, dmg: 1 });
  seconds(w, 0.5);
  assert.equal(dome.hp, dome.max - 0.25, 'with the eye gone the dome takes the shot');
});

test('when the last weak part falls the plates crack open: bossExpose once, and they take full damage', () => {
  const w = bossWorld('mothership');
  part(w, 'gunL').hp = 0;
  part(w, 'gunR').hp = 0;
  step(w);
  assert.equal(ofType(drain(w), 'bossExpose').length, 0, 'the eye is still a weak point');
  hurtPart(w, part(w, 'eye'), 1000);
  const ev = ofType(drain(w), 'bossExpose');
  assert.deepEqual(ev.map((e) => e.parts), [['dome', 'wingL', 'wingR']]);
  assert.deepEqual([ev[0].kind, typeof ev[0].x, typeof ev[0].y], ['mothership', 'number', 'number']);
  for (const id of ['dome', 'wingL', 'wingR']) {
    const p = part(w, id);
    assert.deepEqual([p.weak, p.armor, p.cracked], [true, false, true], id);
  }
  const wing = part(w, 'wingL');
  const hp = wing.hp;
  shotOn(w, wing);
  step(w);
  assert.equal(wing.hp, hp - 1, 'a cracked plate takes a whole point');
  seconds(w, 3);
  assert.equal(ofType(drain(w), 'bossExpose').length, 0, 'once per occurrence');
});

test('cracking leaves a bare hull alone', () => {
  const w = bossWorld('mothership');
  const dome = Object.assign(part(w, 'dome'), { weak: false, armor: false }); // a bare hull
  part(w, 'gunL').hp = 0;
  part(w, 'gunR').hp = 0;
  step(w);
  hurtPart(w, part(w, 'eye'), 1000);
  const ev = ofType(drain(w), 'bossExpose');
  assert.deepEqual(ev.map((e) => e.parts), [['wingL', 'wingR']]);
  assert.deepEqual([dome.weak, dome.cracked], [false, false], 'the dome is no plate');
});

test('a destroyed part reports itself and stops blocking', () => {
  const w = bossWorld('mothership');
  const eye = part(w, 'eye');
  hurtPart(w, eye, 1000);
  const ev = drain(w);
  assert.equal(eye.hp, 0);
  assert.deepEqual(ofType(ev, 'partDown').map((e) => e.part), ['eye']);
  assert.ok(ofType(ev, 'explode').length >= 1);
  assert.equal(w.boss.hp, w.boss.maxHp - eye.max);
  hurtPart(w, eye, 5);
  assert.equal(ofType(drain(w), 'partDown').length, 0, 'once');
  shotOn(w, eye);
  step(w);
  assert.equal(w.boss.hp, w.boss.maxHp - eye.max, 'a shot flies through where the eye was');
});

test('damage crossing two thresholds in one tick emits two bossPhase events in order, landing in the later phase', () => {
  const w = bossWorld('mothership');
  leave(w, ['gunL', 'dome'], 1);
  step(w);
  const phases = ofType(drain(w), 'bossPhase');
  assert.deepEqual(phases.map((e) => e.phase), [1, 2]);
  assert.equal(w.boss.phase, 2);
  step(w, 5);
  assert.equal(ofType(drain(w), 'bossPhase').length, 0, 'each threshold is crossed once');
});

test('a phase change fires when one hit carries the boss over a threshold, not before', () => {
  const w = bossWorld('mothership');
  const line = bossDef('mothership').phases[0].until * w.boss.maxHp; // phase 1 begins at this hp
  hurtPart(w, part(w, 'eye'), w.boss.hp - line - 1);
  assert.equal(w.boss.phase, 0, 'one point above the first threshold');
  hurtPart(w, part(w, 'gunL'), 2);
  assert.equal(w.boss.phase, 1);
  assert.deepEqual(ofType(drain(w), 'bossPhase').map((e) => e.phase), [1]);
});
