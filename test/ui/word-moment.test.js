import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PACK } from '../../src/data/pack.js';
import { letterRuns } from '../../src/ui/word-moment.js';

const word = (id) => PACK.species.find((s) => s.id === id).word;
const ZWNJ = '\u200c';

test('letterRuns gives each letter its own colour in order, wrapping the palette', () => {
  const rabbit = word('rabbit');
  const runs = letterRuns(rabbit, ['a', 'b', 'c']);
  assert.deepEqual(runs.map((r) => r.text), [...rabbit]);
  assert.deepEqual(runs.map((r) => r.colour), ['a', 'b', 'c', 'a', 'b']);
});

test('a ZWNJ stays inside the letter before it', () => {
  const cow = word('cow');
  const runs = letterRuns(cow + ZWNJ + word('dog'), PACK.letterColours);
  assert.equal(runs.length, 5);
  assert.equal(runs[2].text, [...cow].at(-1) + ZWNJ);
  assert.equal(runs.map((r) => r.text).join(''), cow + ZWNJ + word('dog'));
  assert.deepEqual(runs.map((r) => r.colour), PACK.letterColours.slice(0, 5));
});
