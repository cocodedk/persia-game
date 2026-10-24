import { test } from 'node:test';
import assert from 'node:assert/strict';

// The end cards' keys (screens/dom.js endKeys) with stand-in buttons: enough DOM for navigate().
globalThis.document = { activeElement: null, addEventListener() {} };
const { endKeys } = await import('../../src/ui/screens/dom.js');

function card() {
  const log = [];
  const item = (name) => ({
    click: () => log.push(`pick ${name}`),
    focus: () => {
      document.activeElement = items.find((i) => i.name === name);
      log.push(`focus ${name}`);
    },
    name,
  });
  const items = [item('next'), item('retry'), item('select')];
  document.activeElement = items[0];
  const state = { ready: false, settled: false };
  const onKey = endKeys(items, () => state.ready, () => state.settled);
  return { log, state, onKey };
}

test('an end card ignores every key until it is armed', () => {
  const { log, onKey } = card();
  for (const code of ['Enter', 'Space', 'ArrowRight']) assert.equal(onKey(code, {}), true, code);
  assert.deepEqual(log, []);
});

test('until the count-up and the stars are done, fire and held-key repeats are swallowed; Enter confirms', () => {
  const { log, state, onKey } = card();
  state.ready = true;
  onKey('Space', {});
  onKey('ArrowRight', { repeat: true });
  onKey('KeyD', { repeat: true });
  assert.deepEqual(log, [], 'fire mashing and a held arrow do nothing yet');
  onKey('ArrowRight', {});
  assert.deepEqual(log, ['focus retry'], 'a fresh arrow press still moves');
  onKey('Enter', {});
  assert.deepEqual(log, ['focus retry', 'pick retry']);
});

test('once the card has settled, Space picks and a held arrow scrolls like any menu', () => {
  const { log, state, onKey } = card();
  Object.assign(state, { ready: true, settled: true });
  onKey('ArrowRight', { repeat: true });
  onKey('Space', {});
  assert.deepEqual(log, ['focus retry', 'pick retry']);
});
