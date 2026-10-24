import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installElements } from './dom-kit.js';

// M10: the best is saved the moment the level is cleared, so leaving through the pause menu during
// the 2.4 s of slow motion after a clear (Restart, Title) does not lose it.
installElements();
const backing = new Map();
globalThis.localStorage = { getItem: (k) => backing.get(k) ?? null, setItem: (k, v) => backing.set(k, String(v)) };

const { createFlow } = await import('../../src/ui/flow.js');
const { createSession, stepSession } = await import('../../src/ui/session.js');
const { finished } = await import('../../src/core/util.js');
const { store } = await import('../../src/ui/storage.js');
const { levelById } = await import('../../src/core/levels.js');
const { autopilot } = await import('../../src/core/autopilot.js');

// Fly a level with the autopilot as the router's play scene does, stopping on the tick it ends.
function fly(id) {
  const flow = createFlow({ app: {} }, { show() {} });
  const scene = { mode: 'play', level: levelById(id), session: createSession(levelById(id)) };
  for (let i = 0; i < 40000 && !finished(scene.session.world); i++) {
    stepSession(scene.session, 1 / 60, autopilot, (events) => events.forEach((e) => flow.onEvent(scene, e)));
  }
  assert.equal(scene.session.world.state, 'cleared', `the autopilot clears ${id}`);
  return { flow, scene };
}

test('the best is saved on the tick the level is cleared, before the slow motion plays out', () => {
  const { flow, scene } = fly('w1-1');
  const s = scene.session;
  assert.ok(s.over < 0.1, 'still inside the clear wait');
  assert.equal(store.best('w1-1').score, s.world.score);
  let shown = null;
  flow.showResults = (o) => (shown = o);
  flow.check(scene);
  assert.equal(shown, null, 'the results wait for the slow motion');
  stepSession(s, 2.5, autopilot);
  flow.check(scene);
  assert.equal(shown.score, s.world.score);
  assert.deepEqual(shown.best, store.best('w1-1'));
  assert.equal(shown.newBest, true);
});
