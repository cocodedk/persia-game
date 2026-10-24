import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installElements, texts } from './dom-kit.js';

// The end cards built on a few stand-in elements: which lines and buttons they show.
installElements();
const { resultsScreen } = await import('../../src/ui/screens/results.js');
const { failedScreen } = await import('../../src/ui/screens/failed.js');

const results = (o) => resultsScreen({ label: 'Level 1', score: 1200, stars: 2, best: { score: 3400, stars: 3 }, newBest: false, ...o },
  { again() {}, title() {} });
const bestLines = (o) => texts(results(o).el, (e) => e.className.startsWith('result-best'));

test('the results card shows the best, or New best!', () => {
  assert.deepEqual(bestLines({ best: { score: 3400, stars: 3 }, newBest: false }), ['Best 3,400']);
  assert.deepEqual(bestLines({ best: { score: 1200, stars: 2 }, newBest: true }), ['New best!']);
});

test('results offer Again and Title, and no Next', () => {
  const { el } = results({});
  assert.deepEqual(texts(el, (e) => e.tag === 'button'), ['Again', 'Title']);
  assert.deepEqual(texts(el, (e) => e.className === 'banner-title'), ['Victory']);
  assert.deepEqual(texts(el, (e) => e.className === 'banner-kicker'), ['Level 1']);
});

test('failed shows the wave or the giant\'s hp', () => {
  const level = { name: 'Level 1', first: 1, waves: [{}, {}, {}, {}, {}] };
  const failed = (world) => failedScreen({ label: level.name, score: 900, world: { level, boss: null, ...world } },
    { retry() {}, title() {} }).el;
  const progress = (world) => texts(failed(world), (e) => e.className === 'result-best');
  assert.deepEqual(progress({ wave: 3 }), ['Wave 3 of 5']);
  assert.deepEqual(progress({ wave: 5, boss: { kind: 'giant', hp: 96, maxHp: 240 } }), ['The giant held at 40 %']);
  const el = failed({ wave: 1 });
  assert.deepEqual(texts(el, (e) => e.className === 'banner-title'), ['Shot down']);
  assert.deepEqual(texts(el, (e) => e.tag === 'button'), ['Retry', 'Title']);
});
