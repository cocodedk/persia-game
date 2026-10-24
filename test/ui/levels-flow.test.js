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

test('the title offers Play for level 1 and Level 2 for level 2, from the first visit', () => {
  const { r, started, screen } = setup();
  r.goTitle();
  assert.deepEqual(labels(screen()), ['Play', 'Level 2']);
  press(screen(), 'Play');
  press(screen(), 'Level 2');
  assert.deepEqual(started, [LEVEL, LEVELS[1]]);
});

test("each level's parade names its own animals: level 1 seven, level 2 the eight with the mouse", () => {
  const { flow, said, screen } = setup();
  const walk = (level) => {
    said.length = 0;
    flow.showParade({ level, score: 100, stars: 1, best: { score: 100, stars: 1 }, newBest: true });
    screen().update(60); // past every animal's cue
    return [...said];
  };
  assert.deepEqual(walk(LEVEL), ['dog', 'cow', 'rabbit', 'bird', 'cat', 'horse', 'fish']);
  assert.deepEqual(walk(LEVELS[1]), ['dog', 'cow', 'rabbit', 'bird', 'cat', 'horse', 'fish', 'mouse']);
});

test("level 1's results offer Next, which plays level 2, and Again replays the level just played", () => {
  const { flow, started, screen } = setup();
  const result = { score: 100, stars: 1, best: { score: 100, stars: 1 }, newBest: true };
  flow.showResults({ level: LEVEL, ...result });
  assert.deepEqual(labels(screen()), ['Next', 'Again', 'Title']);
  assert.equal(screen().focus, buttons(screen())[0], 'Next has the focus');
  later();
  press(screen(), 'Next');
  press(screen(), 'Again');
  flow.showResults({ level: LEVELS[1], ...result });
  assert.deepEqual(labels(screen()), ['Again', 'Title']);
  later();
  press(screen(), 'Again');
  flow.showResults({ level: { ...LEVEL, waves: null }, ...result }); // ?debug&boss: not a level of the list
  assert.deepEqual(labels(screen()), ['Again', 'Title']);
  assert.deepEqual(started, [LEVELS[1], LEVEL, LEVELS[1]]);
});

test('failing level 2 retries level 2', () => {
  const { flow, started, screen } = setup();
  const world = { level: LEVELS[1], wave: 2, boss: null };
  flow.showFailed({ level: LEVELS[1], score: 100, world });
  later();
  press(screen(), 'Retry');
  assert.deepEqual(started, [LEVELS[1]]);
});
