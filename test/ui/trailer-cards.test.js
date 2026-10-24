import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VOICES, KEYS, statsOf, fillLine, cardsFor, finalCard } from '../../src/ui/trailer/cards.js';
import { levelById, WORLDS } from '../../src/core/levels.js';
import { bossDef } from '../../src/core/bosses-data.js';
import { GUARDED, guardOf, borrowedIn } from './borrowed-kit.js';

const ZERO = { kills: 0, near: 0, combo: 0, time: 0, bombs: 0, stars: 0, hits: 0, boss: null };
const ONE = { kills: 1, near: 1, combo: 1, time: 1, bombs: 1, stars: 1, hits: 1 };
const TYPICAL = { kills: 47, near: 9, combo: 6, time: 107.4, bombs: 2, stars: 3, hits: 0 };
const LONG = { kills: 1234, near: 88, combo: 8, time: 1800, bombs: 3, stars: 2, hits: 2 };
const ALL = [ZERO, ONE, TYPICAL, LONG];

// A filled line reads well: no placeholder or junk left, no bare zero count, no "1 THINGS", no x0/x1 combo.
function readsWell(line, where) {
  assert.ok(line.length > 0, `${where}: empty`);
  assert.equal(line, line.toUpperCase(), `${where}: ${line}`);
  assert.doesNotMatch(line, /[{}]|undefined|NaN|null|Infinity/, `${where}: ${line}`);
  assert.doesNotMatch(line, /(^|\s)0 [A-Z]/, `${where}: a bare zero in "${line}"`);
  assert.doesNotMatch(line, /(^|\s)1 [A-Z]+S\b/, `${where}: singular/plural in "${line}"`);
  assert.doesNotMatch(line, /×[01]\b/, `${where}: a combo of nothing in "${line}"`);
  assert.doesNotMatch(line, /\s{2,}/, `${where}: double space in "${line}"`);
  assert.equal(borrowedIn(line), null, `${where}: borrows a guarded line: "${line}"`);
}

// R48: the guard knows its lines by hash alone. A harmless made-up line, guarded only here, shows that a
// card holding a guarded line anywhere fails, whatever its case or spacing, and that a near miss passes.
test('the borrowed-line guard finds a guarded line by its hash, anywhere in a card line', () => {
  const guard = guardOf(['TOAST AT DAWN']);
  assert.ok(borrowedIn('WE RAISE A TOAST AT DAWN.', guard));
  assert.ok(borrowedIn('we raise a toast   at dawn', guard), 'case and spacing do not hide it');
  assert.equal(borrowedIn('A TOAST AT NOON.', guard), null);
  assert.equal(GUARDED.length, 13, 'all thirteen guarded lines are kept');
  assert.equal(new Set(GUARDED.map(([, hash]) => hash)).size, 13);
  for (const [n, hash] of GUARDED) assert.ok(n > 0 && /^[0-9a-f]{64}$/.test(hash), hash);
});

test('every world has three cards of one to three lines, and every placeholder is a known stat', () => {
  assert.equal(VOICES.length, 8);
  for (const [w, cards] of VOICES.entries()) {
    assert.equal(cards.length, 3, `world ${w + 1}`);
    const used = new Set();
    for (const card of cards) {
      assert.ok(card.length >= 1 && card.length <= 3, `world ${w + 1}: ${card}`);
      for (const line of card) {
        for (const [, key] of line.matchAll(/\{(\w+)\}/g)) {
          assert.ok(KEYS.includes(key), `world ${w + 1}: unknown placeholder {${key}}`);
          used.add(key);
        }
      }
    }
    assert.ok(used.size >= 2, `world ${w + 1} speaks from at least two stats`);
  }
});

test('cards fill every placeholder for every world, and read well for zeros, ones and big numbers', () => {
  for (let world = 1; world <= 8; world++) {
    for (const stats of ALL) {
      const cards = cardsFor(world, stats);
      assert.equal(cards.length, 3);
      for (const [i, card] of cards.entries()) {
        for (const line of card) readsWell(line, `world ${world} card ${i + 1} ${JSON.stringify(stats)}`);
      }
    }
  }
});

test('the stat line reads like a trailer: the spec example, and its zero and one forms', () => {
  assert.deepEqual(cardsFor(1, TYPICAL)[1], ['47 INVADERS.', '9 NEAR MISSES.', 'ONE PILOT.']);
  assert.deepEqual(cardsFor(1, ZERO)[1], ['NOT ONE INVADER.', 'NO NEAR MISSES.', 'ONE PILOT.']);
  assert.deepEqual(cardsFor(1, ONE)[1], ['ONE INVADER.', 'ONE NEAR MISS.', 'ONE PILOT.']);
  assert.deepEqual(cardsFor(2, ZERO)[1], ['NOT ONE INVADER WENT DARK.', 'NO NEAR MISSES IN THE NEON.']);
  assert.deepEqual(cardsFor(2, TYPICAL)[0], ['IN A CITY', 'OF ENDLESS RAIN…']);
});

test('each phrase has its zero form', () => {
  assert.equal(fillLine('{combo}.', ZERO), 'NO COMBO NEEDED.');
  assert.equal(fillLine('{combo}.', ONE), 'NO COMBO NEEDED.');
  assert.equal(fillLine('{combo}.', TYPICAL), 'A ×6 COMBO.');
  assert.equal(fillLine('{time} OF UPTIME.', ZERO), 'AN INSTANT OF UPTIME.');
  assert.equal(fillLine('{time}', ONE), 'ONE SECOND');
  assert.equal(fillLine('{time}', { ...ZERO, time: 41.2 }), '41 SECONDS');
  assert.equal(fillLine('{time}', TYPICAL), '2 MINUTES');
  assert.equal(fillLine('{bombs} DROPPED.', ZERO), 'NO BOMBS DROPPED.');
  assert.equal(fillLine('{bombs}', TYPICAL), '2 BOMBS');
  assert.equal(fillLine('{stars}', ZERO), 'NO STARS');
  assert.equal(fillLine('{stars}', ONE), 'ONE STAR');
  assert.equal(fillLine('{kills}', LONG), '1,234 INVADERS');
});

test('stats come from the event log: scored kills, near misses, the top combo, bombs, hits, stars and time', () => {
  const events = [
    { type: 'kill', tick: 10, mult: 1, scored: true }, { type: 'kill', tick: 20, mult: 2, scored: true },
    { type: 'kill', tick: 30, mult: 3, scored: true }, { type: 'kill', tick: 40, mult: 1, scored: false },
    { type: 'nearMiss', tick: 50 }, { type: 'nearMiss', tick: 60 }, { type: 'bomb', tick: 70 },
    { type: 'shipHit', tick: 80, lives: 2 }, { type: 'cleared', tick: 600, stars: 2 },
  ];
  const stats = { kills: 3, near: 2, combo: 3, time: 10, bombs: 1, stars: 2, hits: 1, boss: null };
  assert.deepEqual(statsOf(events, 600), stats, 'a ram (scored: false) is no kill');
  assert.deepEqual(statsOf([], 0), ZERO);
  const fight = [{ type: 'kill', tick: 5, mult: 1, scored: false }, { type: 'bossDeath', tick: 900, kind: 'queen' }];
  assert.deepEqual(statsOf(fight, 960), { ...ZERO, time: 16, boss: 'queen' });
});

// M4: a boss victory names the boss where the other levels count invaders, never "NOT ONE INVADER".
test('on a boss level the stat card names the boss that fell, in every world', () => {
  assert.deepEqual(cardsFor(1, { ...ZERO, boss: 'mothership' })[1], ['THE MOTHERSHIP.', 'NO NEAR MISSES.', 'ONE PILOT.']);
  assert.deepEqual(cardsFor(2, { ...TYPICAL, boss: 'pyramid' })[1], ['THE CORPORATE PYRAMID WENT DARK.', '9 NEAR MISSES IN THE NEON.']);
  assert.deepEqual(cardsFor(8, { ...ZERO, boss: 'singularity' })[2], ['THE SINGULARITY.', 'NO NEAR MISSES.', 'ONE WAY HOME.']);
  for (const [i, w] of WORLDS.entries()) {
    for (const stats of ALL) {
      const lines = cardsFor(w.id, { ...stats, boss: w.boss }).flat();
      for (const line of lines) readsWell(line, `world ${w.id} boss ${line}`);
      assert.ok(!lines.some((l) => l.includes('INVADER')), `world ${i + 1}: ${lines}`);
      assert.ok(lines.some((l) => l.includes(bossDef(w.boss).name.toUpperCase())), `world ${i + 1} names its boss: ${lines}`);
    }
  }
});

test('the final card: the world as a film title, stars as critics, the score as box office or a record', () => {
  const level = levelById('w2-1');
  const f = finalCard({ level, stats: TYPICAL, stars: 2, score: 42350, newBest: false });
  assert.equal(f.title, 'NEON RAIN');
  assert.equal(f.kicker, 'WORLD 2 · REEL 1');
  assert.equal(f.stars, 2);
  assert.equal(f.label, 'BOX OFFICE');
  assert.equal(f.score, '42,350');
  assert.equal(f.record, false);
  assert.match(f.billing, /RUNNING TIME 1:47/);
  const r = finalCard({ level: levelById('w8-5'), stats: ZERO, stars: 0, score: 0, newBest: true });
  assert.equal(r.record, true);
  assert.equal(r.label, 'RECORD BOX OFFICE');
  assert.equal(r.kicker, 'WORLD 8 · FINALE');
  assert.equal(r.score, '0');
  for (const line of [r.title, r.kicker, r.label, r.billing, f.billing]) readsWell(line, 'final');
});
