import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installElements, all, texts } from './dom-kit.js';

// From one level to the next: the title offers every level, each level's parade walks its own
// animals, and the results of a level that has a next one offer Next. Nothing is locked, so none of
// it reads storage.
installElements();
globalThis.requestAnimationFrame = () => 0;
let now = 0;
performance.now = () => now; // end cards arm after a moment (armed in dom.js)
const later = () => (now += 1000);
const { createRouter } = await import('../../src/ui/router.js');
const { createFlow } = await import('../../src/ui/flow.js');
const { LEVEL, LEVELS } = await import('../../src/core/levels.js');

const buttons = (screen) => all(screen.el).filter((e) => e.tag === 'button');
const labels = (screen) => texts(screen.el, (e) => e.tag === 'button');
const press = (screen, label) => buttons(screen).find((b) => b.children.join('') === label).onClick();

function setup() {
  let shown = null;
  const stage = { show: (s) => (shown = s) };
  const r = createRouter({ canvas: {}, stage, input: {}, voice: { clear() {}, queue() {} } });
  const said = [];
  const flow = createFlow(r, stage, { clear() {}, queue: (line) => said.push(line.id) });
  const started = [];
  r.startLevel = (level) => started.push(level);
  return { r, flow, started, said, screen: () => shown };
}

test('the title offers every level as a card with its name and place, from the first visit', () => {
  const { r, started, screen } = setup();
  r.goTitle();
  const spans = (cls) => texts(screen().el, (e) => e.className === cls);
  assert.deepEqual(spans('card-number'), LEVELS.map((l) => l.name));
  assert.deepEqual(spans('card-place'), LEVELS.map((l) => l.place));
  for (const card of buttons(screen())) card.onClick();
  assert.deepEqual(started, LEVELS);
});

test('the arrows move along the cards and Enter plays the one in focus', () => {
  const { r, started, screen } = setup();
  r.goTitle();
  const cards = buttons(screen());
  for (const c of cards) {
    c.focus = () => (document.activeElement = c);
    c.click = c.onClick;
  }
  document.activeElement = cards[0];
  screen().onKey('ArrowRight');
  assert.equal(document.activeElement, cards[1]);
  screen().onKey('ArrowLeft');
  screen().onKey('ArrowLeft');
  assert.equal(document.activeElement, cards.at(-1), 'the row wraps round');
  screen().onKey('Enter');
  assert.deepEqual(started, [LEVELS.at(-1)]);
  document.activeElement = null;
});

test("each level's parade names its own animals: level 1 seven, levels 2 and 3 all eight", () => {
  const { flow, said, screen } = setup();
  const walk = (level) => {
    said.length = 0;
    flow.showParade({ level, score: 100, stars: 1, best: { score: 100, stars: 1 }, newBest: true });
    screen().update(60); // past every animal's cue
    return [...said];
  };
  assert.deepEqual(walk(LEVEL), ['dog', 'cow', 'rabbit', 'bird', 'cat', 'horse', 'fish']);
  const eight = ['dog', 'cow', 'rabbit', 'bird', 'cat', 'horse', 'fish', 'mouse'];
  assert.deepEqual(walk(LEVELS[1]), eight);
  assert.deepEqual(walk(LEVELS[2]), eight);
});

test("results offer Next to the level after, none after the last, and Again replays the level just played", () => {
  const { flow, started, screen } = setup();
  const result = { score: 100, stars: 1, best: { score: 100, stars: 1 }, newBest: true };
  flow.showResults({ level: LEVEL, ...result });
  assert.deepEqual(labels(screen()), ['Next', 'Again', 'Title']);
  assert.equal(screen().focus, buttons(screen())[0], 'Next has the focus');
  later();
  press(screen(), 'Next');
  press(screen(), 'Again');
  flow.showResults({ level: LEVELS[1], ...result });
  assert.deepEqual(labels(screen()), ['Next', 'Again', 'Title']);
  later();
  press(screen(), 'Next');
  flow.showResults({ level: LEVELS[2], ...result });
  assert.deepEqual(labels(screen()), ['Again', 'Title']);
  later();
  press(screen(), 'Again');
  flow.showResults({ level: { ...LEVEL, waves: null }, ...result }); // ?debug&boss: not a level of the list
  assert.deepEqual(labels(screen()), ['Again', 'Title']);
  assert.deepEqual(started, [LEVELS[1], LEVEL, LEVELS[2], LEVELS[2]]);
});

test('failing level 2 retries level 2', () => {
  const { flow, started, screen } = setup();
  const world = { level: LEVELS[1], wave: 2, boss: null };
  flow.showFailed({ level: LEVELS[1], score: 100, world });
  later();
  press(screen(), 'Retry');
  assert.deepEqual(started, [LEVELS[1]]);
});
