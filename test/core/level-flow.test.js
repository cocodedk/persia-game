import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, stepWorld } from '../../src/core/world.js';
import { LEVEL } from '../../src/core/levels.js';
import { BOSS_GAP } from '../../src/core/world-step.js';
import { CHAIN } from '../../src/core/boss-phase.js';
import { bossDef } from '../../src/core/bosses-data.js';
import { SPECIES } from '../../src/core/kinds.js';
import { TICK, IDLE, level, wave, step, seconds, playing, drain, ofType } from './world-kit.js';
import { bossLevel, leave } from './boss-kit.js';

// Level 1 runs its waves in order, each naming its species, then the giant after a gap.

// Wipe the field (no kills scored), and step the tick that notices it.
const clear = (w) => {
  for (const a of w.aliens) a.hp = 0;
  step(w);
};
const oneWaveThenGiant = () => playing(level([wave()], 0, { boss: 'giant' }));

test('spawning a wave emits its number and its distinct species in row order', () => {
  assert.deepEqual(createWorld(LEVEL).events, [{ type: 'wave', tick: 0, wave: 1, species: ['dog'] }]);
  const mixed = createWorld(level([wave({ species: ['cat', 'dog', 'cat'] })]));
  assert.deepEqual(ofType(mixed.events, 'wave').map((e) => e.species), [['cat', 'dog']]);
  const w = playing(LEVEL);
  const said = [];
  for (let i = 1; i < LEVEL.waves.length; i++) {
    clear(w);
    seconds(w, 1.3);
    said.push(...ofType(drain(w), 'wave').map((e) => [e.wave, e.species]));
  }
  assert.deepEqual(said, LEVEL.waves.slice(1).map((x, i) => [i + 2, [...new Set(x.species)]]));
});

test('every alien carries its row species', () => {
  const w = playing(LEVEL);
  LEVEL.waves.forEach((spec, i) => {
    assert.equal(w.wave, i + 1);
    assert.equal(w.aliens.length, spec.rows * spec.cols);
    for (const a of w.aliens) {
      assert.equal(a.species, spec.species[a.slot.row], `wave ${i + 1} row ${a.slot.row}`);
      assert.equal(a.role, SPECIES[a.species]);
    }
    clear(w);
    seconds(w, 1.3);
  });
  assert.ok(createWorld(level([wave()])).aliens.every((a) => a.species === null), 'a test wave has none');
});

test('the last wave cleared brings the giant after BOSS_GAP, and it says so', () => {
  const solo = playing(level([wave()]));
  clear(solo);
  assert.deepEqual(ofType(drain(solo), 'waveClear').map((e) => e.last), [true], 'no boss follows');
  const w = oneWaveThenGiant();
  clear(w);
  assert.deepEqual(ofType(drain(w), 'waveClear').map((e) => e.last), [false], 'the giant follows');
  seconds(w, BOSS_GAP - TICK);
  assert.equal(w.boss, null);
  assert.equal(w.state, 'play');
  assert.equal(ofType(drain(w), 'boss').length, 0);
  step(w);
  assert.equal(w.boss.kind, 'giant');
  assert.deepEqual(ofType(drain(w), 'boss'), [{ type: 'boss', tick: w.tick, kind: 'giant', species: 'cat' }]);
});

test('the giant is not there with wave 1, and no waveClear fires once it is up', () => {
  assert.equal(createWorld(LEVEL).boss, null);
  const w = oneWaveThenGiant();
  clear(w);
  seconds(w, BOSS_GAP);
  assert.ok(w.boss);
  drain(w);
  seconds(w, 10);
  assert.equal(w.aliens.length, 0, 'a quiet giant launches nothing: the field stays empty');
  assert.equal(ofType(drain(w), 'waveClear').length, 0);
});

test('a waves-then-boss level is cleared only when the boss chain is over', () => {
  const w = oneWaveThenGiant();
  clear(w);
  seconds(w, 1);
  assert.equal(w.state, 'play', 'the last wave gone is no clear while the giant is to come');
  seconds(w, BOSS_GAP);
  while (w.boss.enter > 0) step(w);
  leave(w, []);
  step(w);
  assert.equal(ofType(drain(w), 'bossDeath').length, 1);
  seconds(w, CHAIN - 0.1);
  assert.equal(w.state, 'play', 'the chain plays out first');
  seconds(w, 0.2);
  assert.equal(w.state, 'cleared');
  assert.equal(ofType(drain(w), 'cleared').length, 1);
});

test('the giant launches cats and a rabbit, each carrying its species', () => {
  const minions = bossDef('giant').phases.flatMap((p) => p.minions ?? []);
  assert.deepEqual(minions.map((m) => [m.species, m.role]), [['cat', 'diver'], ['cat', 'diver'], ['rabbit', 'carrier']]);
  const w = createWorld(bossLevel('giant', 0, { seed: 5 }), 5);
  w.ship.invuln = Infinity;
  leave(w, ['eyeL', 'eyeR', 'mouth', 'brow'], 5); // into the last phase: cats from the mouth, a rabbit from the brow
  const seen = new Set();
  for (let i = 0; i < 60 * 45; i++) {
    stepWorld(w, TICK, IDLE);
    w.events.length = 0;
    for (const a of w.aliens) {
      assert.equal(a.role, SPECIES[a.species], `a ${a.species} fights as its role`);
      seen.add(a.species);
    }
  }
  assert.deepEqual([...seen].sort(), ['cat', 'rabbit']);
});
