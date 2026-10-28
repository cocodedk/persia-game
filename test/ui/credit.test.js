import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installElements, all } from './dom-kit.js';
import { LEVEL } from '../../src/core/levels.js';

// The author's credit on every screen that is not play, and the privacy note on the title, built on stand-in elements.
installElements();
const { titleScreen } = await import('../../src/ui/screens/title.js');
const { pauseScreen } = await import('../../src/ui/screens/pause.js');
const { resultsScreen } = await import('../../src/ui/screens/results.js');
const { failedScreen } = await import('../../src/ui/screens/failed.js');

const text = (el) => el.children.map((k) => (typeof k === 'object' ? text(k) : k)).join('');
const act = { again() {}, retry() {}, title() {}, resume() {}, restart() {} };
const level = { name: 'Level 1', first: 1, persian: [], waves: [{}, {}, {}, {}, {}] };
const SCREENS = {
  title: () => titleScreen({ items: [{ label: 'Level 1', place: 'Forest', art: null, pick() {} }], nowShowing: 'Level 1' }),
  pause: () => pauseScreen({ label: 'Level 1', ...act }),
  results: () => resultsScreen({ level: LEVEL, score: 1200, stars: 2, best: { score: 3400, stars: 3 }, newBest: false }, act),
  failed: () => failedScreen({ score: 900, world: { level, boss: null, wave: 3 } }, act),
};

for (const [name, make] of Object.entries(SCREENS)) {
  test(`the ${name} screen carries the credit, a link to cocode.dk the keys never land on`, () => {
    const links = all(make().el).filter((e) => e.className === 'credit');
    assert.equal(links.length, 1);
    const [a] = links;
    assert.equal(text(a), 'Babak Bandpey · cocode.dk');
    assert.equal(a.href, 'https://cocode.dk');
    assert.equal(a.target, '_blank');
    assert.equal(a.tabIndex, -1);
  });
}

test('the title says what the game keeps and what its host logs, and links the host\'s own words', () => {
  const [note] = all(SCREENS.title().el).filter((e) => e.className === 'privacy');
  assert.match(text(note), /no tracking/);
  assert.match(text(note), /stays in this browser/);
  assert.match(text(note), /GitHub Pages, logs visitors’ IP addresses/);
  const [a] = all(note).filter((e) => e.href);
  assert.match(a.href, /^https:\/\/docs\.github\.com\/.*#data-collection$/);
});
