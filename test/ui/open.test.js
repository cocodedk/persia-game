import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installElements } from './dom-kit.js';

// The cinematic open (screens/open.js): its beats on the frame clock, and the skip.
installElements();
const { OPEN_BEATS, SKIP_AFTER, beatsBetween, openScreen } = await import('../../src/ui/screens/open.js');

const NAMES = ['dark', 'braam', 'light', 'title', 'eyes', 'impact', 'done'];

test('beatsBetween returns each beat once, in order, across uneven frames', () => {
  const heard = [];
  let t = 0;
  for (let i = 0; t < 9; i++) {
    const t1 = t + [0.016, 0.1, 0.033, 0.0071, 0.067][i % 5];
    heard.push(...beatsBetween(t, t1));
    t = t1;
  }
  assert.deepEqual(heard, NAMES);
  assert.deepEqual(beatsBetween(0.4, 0.5), ['braam'], 'a beat on a frame edge belongs to the frame it ends');
  assert.deepEqual(beatsBetween(0.5, 0.6), []);
});

test('beatsBetween(0, 8.2) names all seven beats', () => {
  assert.deepEqual(beatsBetween(0, 8.2), NAMES);
  assert.deepEqual(OPEN_BEATS.map((b) => b.name), NAMES);
});

test('a key before SKIP_AFTER does nothing; after it, impact fires once and onDone follows 0.6 s later', () => {
  let done = 0;
  const open = openScreen({ onDone: () => { done += 1; } });
  const beats = []; // each beat adds at-<name> to the screen's classes
  open.el.classList = { add: (c) => beats.push(c.replace(/^at-/, '')), remove() {}, toggle() {}, contains: () => false };
  open.update(SKIP_AFTER - 0.1);
  assert.equal(open.onKey('Space'), true, 'the open keeps every key from the game');
  open.update(0.15);
  assert.deepEqual(beats, ['dark', 'braam'], 'the early key skipped nothing');
  open.onKey('Enter');
  open.onKey('Space');
  assert.deepEqual(beats, ['dark', 'braam', 'impact']);
  open.update(0.59);
  assert.equal(done, 0);
  open.update(0.02);
  assert.equal(done, 1);
  open.onKey('Enter');
  open.update(3);
  assert.deepEqual(beats, ['dark', 'braam', 'impact', 'done']);
  assert.equal(done, 1);
});
