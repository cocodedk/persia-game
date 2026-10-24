import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installElements, texts, all } from './dom-kit.js';
import { PACK } from '../../src/data/pack.js';
import { LEVEL, LEVELS } from '../../src/core/levels.js';

// The end cards built on a few stand-in elements: which lines and buttons they show.
installElements();
const { resultsScreen } = await import('../../src/ui/screens/results.js');
const { failedScreen } = await import('../../src/ui/screens/failed.js');

const results = (o) => resultsScreen({ level: LEVEL, score: 1200, stars: 2, best: { score: 3400, stars: 3 }, newBest: false, ...o },
  { again() {}, title() {} });
const bestLines = (o) => texts(results(o).el, (e) => e.className.startsWith('result-best'));
const kicker = (el) => texts(el, (e) => e.className === 'banner-kicker');

test('the results card shows the best, or New best!', () => {
  assert.deepEqual(bestLines({ best: { score: 3400, stars: 3 }, newBest: false }), ['Best 3,400']);
  assert.deepEqual(bestLines({ best: { score: 1200, stars: 2 }, newBest: true }), ['New best!']);
});

test('results offer Again and Title, and no Next', () => {
  const { el } = results({});
  assert.deepEqual(texts(el, (e) => e.tag === 'button'), ['Again', 'Title']);
  assert.deepEqual(texts(el, (e) => e.className === 'banner-title'), ['Victory']);
  assert.deepEqual(kicker(el), ['Level 1']);
});

test('failed shows the wave or the giant\'s hp', () => {
  const level = { name: 'Level 1', first: 1, persian: [], waves: [{}, {}, {}, {}, {}] };
  const failed = (world) => failedScreen({ score: 900, world: { level, boss: null, ...world } },
    { retry() {}, title() {} }).el;
  const progress = (world) => texts(failed(world), (e) => e.className === 'result-best');
  assert.deepEqual(progress({ wave: 3 }), ['Wave 3 of 5']);
  assert.deepEqual(progress({ wave: 5, boss: { kind: 'giant', hp: 96, maxHp: 240 } }), ['The giant held at 40 %']);
  const el = failed({ wave: 1 });
  assert.deepEqual(texts(el, (e) => e.className === 'banner-title'), ['Shot down']);
  assert.deepEqual(texts(el, (e) => e.tag === 'button'), ['Retry', 'Title']);
});

test("level 3's end cards give the score and the best in the pack's digits; level 2's in ASCII", () => {
  const D = PACK.digits; // the expected strings are built from the pack, so no Persian enters a test
  const G = PACK.group;
  const score = (el) => texts(el, (e) => e.className.startsWith('result-score'));
  const won = results({ level: LEVELS[2], score: 146800 });
  assert.deepEqual(score(won.el), [D[0]], 'the count-up starts at nought');
  won.update(5); // the count-up is done
  const span = all(won.el).find((e) => e.className.startsWith('result-score'));
  assert.equal(span.className, 'result-score local', 'Persian digits are set proportional');
  const counted = span.textContent;
  assert.equal(counted, `${D[1]}${D[4]}${D[6]}${G}${D[8]}${D[0]}${D[0]}`);
  assert.deepEqual(bestLines({ level: LEVELS[2] }), [`Best ${D[3]}${G}${D[4]}${D[0]}${D[0]}`]);
  assert.deepEqual(bestLines({ level: LEVELS[1] }), ['Best 3,400']);
  const lost = failedScreen({ score: 900, world: { level: LEVELS[2], wave: 2, boss: null } }, { retry() {}, title() {} });
  assert.deepEqual(score(lost.el), [`${D[9]}${D[0]}${D[0]}`]);
  assert.deepEqual(kicker(lost.el), ['Level 3']);
});

test("level 4's end cards name it in the pack's digits", () => {
  const four = `Level ${PACK.digits[4]}`;
  assert.deepEqual(kicker(results({ level: LEVELS[3] }).el), [four]);
  const lost = failedScreen({ score: 900, world: { level: LEVELS[3], wave: 3, boss: null } }, { retry() {}, title() {} });
  assert.deepEqual(kicker(lost.el), [four]);
});
