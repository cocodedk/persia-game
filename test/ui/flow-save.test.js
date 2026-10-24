import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installElements } from './dom-kit.js';

// M10: the run is saved the moment the level is cleared, as the best score is, so leaving through
// the pause menu during the 2.4 s of slow motion after a clear (Restart, Select, Title) no longer
// loses it from Cinema. Still only a real, untainted play session (runs.js, R33).
installElements();
const backing = new Map();
globalThis.localStorage = { getItem: (k) => backing.get(k) ?? null, setItem: (k, v) => backing.set(k, String(v)) };

const { createFlow } = await import('../../src/ui/flow.js');
const { createSession, stepSession, taint } = await import('../../src/ui/session.js');
const { finished } = await import('../../src/core/util.js');
const { store } = await import('../../src/ui/storage.js');
const { decodeRun } = await import('../../src/core/replay.js');
const { levelById } = await import('../../src/core/levels.js');
const { autopilot } = await import('../../src/core/autopilot.js');

// Fly a level with the autopilot as the router's play scene does, stopping on the tick it ends.
function fly(id, { mode = 'play', tainted = false } = {}) {
  const flow = createFlow({ app: {} }, { show() {} });
  const scene = { mode, level: levelById(id), session: createSession(levelById(id)), view: null };
  if (tainted) taint(scene.session);
  for (let i = 0; i < 40000 && !finished(scene.session.world); i++) {
    stepSession(scene.session, 1 / 60, autopilot, (events) => events.forEach((e) => flow.onEvent(scene, e)));
  }
  assert.equal(scene.session.world.state, 'cleared', `the autopilot clears ${id}`);
  return { flow, scene };
}

test('the run is saved on the tick the level is cleared, before the slow motion plays out', () => {
  const { flow, scene } = fly('w1-1');
  const s = scene.session;
  assert.ok(s.over < 0.1, 'still inside the clear wait');
  assert.equal(scene.saved, 'saved');
  const run = decodeRun(store.bestRun('w1-1'));
  assert.ok(run, 'a playable run is stored');
  assert.equal(run.ticks, s.inputs.length);
  assert.equal(run.score, s.world.score);
  assert.equal(store.best('w1-1').score, s.world.score, 'the best is kept as before');
  let handed = null;
  flow.cleared = (o) => (handed = o); // what trailer/routes.js receives once the wait is over
  stepSession(s, 2.5, autopilot);
  flow.check(scene);
  assert.equal(handed.saved, 'saved', 'the outcome says whether the run was saved (the Cinema toast)');
  assert.equal(handed.recording.ticks, run.ticks, 'the trailer plays the run that was saved');
});

test('a tainted session or the demo stores no run; the tainted best is still recorded', () => {
  const t = fly('w1-2', { tainted: true });
  assert.equal(t.scene.saved, 'skip');
  assert.equal(store.bestRun('w1-2'), null);
  assert.equal(store.best('w1-2').score, t.scene.session.world.score);
  const demo = fly('w1-3', { mode: 'try' });
  assert.equal(demo.scene.saved, undefined);
  assert.equal(store.bestRun('w1-3'), null);
});
