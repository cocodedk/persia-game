import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickHighlights } from '../../src/core/highlights.js';
import { TICK } from '../../src/core/replay.js';
import { autopilot } from '../../src/core/autopilot.js';
import { createWorld, stepWorld } from '../../src/core/world.js';
import { levelById } from '../../src/core/levels.js';

const ev = (type, tick, fields = {}) => ({ type, tick, ...fields });
const kill = (tick, mult = 1, scored = true) =>
  ev('kill', tick, { id: tick, role: 'grunt', x: 0, y: 0, score: 100 * mult, mult, scored });
const TOTAL = 6000;
const only = (events, total = TOTAL) => pickHighlights(events, total);

function assertWellFormed(list, total) {
  assert.ok(list.length <= 4, `${list.length} windows`);
  list.forEach((w, i) => {
    assert.ok(0 <= w.start && w.start < w.peak + 1 && w.peak <= w.end && w.end <= total, JSON.stringify(w));
    assert.ok(w.end - w.start >= Math.min(180, total) && w.end - w.start <= 300, JSON.stringify(w));
    assert.equal(typeof w.kind, 'string');
    if (i) assert.ok(list[i - 1].end <= w.start, 'sorted by start, no overlap');
  });
}

test('a run with no events, or only uninteresting ones, yields an empty list', () => {
  assert.deepEqual(pickHighlights([], 3000), []);
  assert.deepEqual(pickHighlights([], 0), []);
  const dull = [ev('fire', 10), ev('hit', 20), kill(100), kill(300), ev('explode', 400), ev('waveClear', 500, { wave: 1, last: false })];
  assert.deepEqual(only(dull), []);
});

test('each kind of moment makes one window of its own kind around its peak', () => {
  const cases = [
    ['bossDeath', [ev('bossDeath', 3000, { kind: 'x', score: 10000 })], 3000],
    ['lastAlien', [ev('waveClear', 3000, { wave: 4, last: true })], 3000],
    ['multiKill', [kill(3000), kill(3012), kill(3030)], 3012],
    ['bomb', [ev('bomb', 3000, { cleared: 5 })], 3000],
    ['nearMiss', [ev('nearMiss', 3000, { dist: 20 })], 3000],
    ['combo', [kill(2800, 1), kill(2900, 2), kill(3000, 3), kill(3100, 1)], 3000],
  ];
  for (const [kind, events, peak] of cases) {
    const list = only(events);
    assert.equal(list.length, 1, kind);
    assert.equal(list[0].kind, kind);
    assert.equal(list[0].peak, peak, kind);
    assertWellFormed(list, TOTAL);
  }
});

test('multi-kills need three scored kills in 30 ticks', () => {
  assert.deepEqual(only([kill(1000), kill(1010)]), []);
  assert.deepEqual(only([kill(1000), kill(1015), kill(1031)]), []);
  assert.equal(only([kill(1000), kill(1015), kill(1030)])[0].kind, 'multiKill');
  assert.deepEqual(only([kill(1000, 1, false), kill(1005, 1, false), kill(1010, 1, false)]), [], 'rams are not kills');
  assert.equal(only([kill(1000), kill(1010), kill(1020), kill(1029), kill(1040)]).length, 1, 'one cluster, one window');
});

test('a burst may start on any kill: a short stretch does not hide the three kills after it', () => {
  for (const base of [0, 1000]) {
    const list = only([kill(base), kill(base + 25), kill(base + 40), kill(base + 50)]);
    assert.equal(list.length, 1, `from ${base}`);
    assert.equal(list[0].kind, 'multiKill');
    assert.equal(list[0].peak, base + 40, 'the middle of the three kills in 25 ticks');
  }
  assert.deepEqual(only([kill(1000), kill(1025), kill(1056), kill(1090)]), [], 'no three within 30 ticks');
});

test('a combo needs a multiplier of two or more, and peaks where the multiplier is highest', () => {
  assert.deepEqual(only([kill(1000, 1), kill(2000, 1)]), []);
  const list = only([kill(1000, 1), kill(1100, 2), kill(1200, 3), kill(1300, 4), kill(1400, 1), kill(1500, 2)]);
  assert.equal(list.length, 1, 'both combos fall inside one window');
  assert.equal(list[0].kind, 'combo');
  assert.equal(list[0].peak, 1300);
});

test('window length grows with the weight, stays within 180..300 ticks and inside the run', () => {
  const len = (events) => { const w = only(events)[0]; return w.end - w.start; };
  const nearMiss = len([ev('nearMiss', 3000)]);
  const boss = len([ev('bossDeath', 3000)]);
  assert.ok(nearMiss >= 180 && boss <= 300 && boss > nearMiss, `${nearMiss} ${boss}`);
  const early = only([ev('bomb', 5)])[0];
  assert.equal(early.start, 0);
  assert.ok(early.end >= 180);
  const late = only([ev('bomb', TOTAL - 3)])[0];
  assert.equal(late.end, TOTAL);
  assert.ok(late.end - late.start >= 180);
  const tiny = pickHighlights([ev('bomb', 50)], 100);
  assert.deepEqual(tiny.map((w) => [w.start, w.end]), [[0, 100]]);
});

test('the boss kill window covers its destruction chain (3 s) and the pick after it', () => {
  const w = only([ev('bossDeath', 3000)])[0];
  assert.ok(w.start < 3000 && w.end >= 3000 + 180, JSON.stringify(w));
});

test('at most four windows, sorted by start, never overlapping, the heaviest kept', () => {
  const events = [
    ev('nearMiss', 400), ev('bomb', 1000), ev('waveClear', 1600, { wave: 3, last: true }),
    kill(2200), kill(2210), kill(2220), ev('bomb', 2800), ev('nearMiss', 3400), ev('nearMiss', 4000),
  ];
  const list = only(events);
  assertWellFormed(list, TOTAL);
  assert.equal(list.length, 4);
  assert.deepEqual(list.map((w) => w.kind), ['bomb', 'lastAlien', 'multiKill', 'bomb'], 'the three-point near misses lose');
});

test('a combo is worth twice its multiplier: x3 ties the last alien, and beats a near miss', () => {
  const events = [
    ev('bomb', 500), ev('waveClear', 1500, { wave: 3, last: true }), kill(2500), kill(2510), kill(2520),
    ev('nearMiss', 3500), kill(4400, 1), kill(4500, 2), kill(4600, 3),
  ];
  assert.deepEqual(only(events).map((w) => w.kind), ['bomb', 'lastAlien', 'multiKill', 'combo']);
});

test('overlapping moments share one window, and the heavier one owns it', () => {
  const list = only([ev('nearMiss', 1000), ev('waveClear', 1060, { wave: 2, last: true }), ev('nearMiss', 1100)]);
  assert.equal(list.length, 1);
  assert.equal(list[0].kind, 'lastAlien');
});

test('a boss kill always wins a slot, even against heavier combos', () => {
  const combos = [400, 1000, 1600, 2200, 2800, 3400].flatMap((t) => [kill(t, 7), kill(t + 40, 8), kill(t + 80, 1)]);
  const events = [...combos, ev('bossDeath', 5200, { kind: 'x', score: 10000 })];
  const list = only(events);
  assertWellFormed(list, TOTAL);
  assert.ok(list.some((w) => w.kind === 'bossDeath'), JSON.stringify(list));
  assert.equal(list.length, 4);
});

test('it is pure: the same events give the same windows and the input is left alone', () => {
  const events = [kill(1000), kill(1010), kill(1020), ev('bomb', 3000), ev('nearMiss', 4000)];
  const copy = structuredClone(events);
  assert.deepEqual(only(events), only(events));
  assert.deepEqual(events, copy);
  assert.deepEqual(only([...events].reverse()), only(events), 'event order does not matter');
});

test('a real autopilot clear of the mothership gets a boss-kill window ending on the cleared tick', () => {
  const level = levelById('w1-5');
  const world = createWorld(level, level.seed);
  world.ship.invuln = Infinity;
  const events = [];
  let ticks = 0;
  while (world.state !== 'cleared' && ticks < 60 * 150) {
    stepWorld(world, TICK, autopilot(world));
    events.push(...world.events.splice(0));
    ticks++;
  }
  assert.equal(world.state, 'cleared');
  const list = pickHighlights(events, ticks);
  assertWellFormed(list, ticks);
  const boss = list.find((w) => w.kind === 'bossDeath');
  assert.ok(boss, JSON.stringify(list));
  assert.ok(boss.end >= events.find((e) => e.type === 'cleared').tick, 'the chain is in the clip');
});
