import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStorage } from '../../src/ui/storage.js';
import { saveBestRun, cinemaReels, MAX_RUN_CHARS } from '../../src/ui/trailer/runs.js';
import { levelById } from '../../src/core/levels.js';
import { makeRun } from '../../src/core/replay.js';
import { IDLE } from '../../src/core/input-codec.js';

const runFor = (id, score = 9000, n = 120) => makeRun(levelById(id), levelById(id).seed, Array.from({ length: n }, () => ({ ...IDLE })), { score, stars: 2 });

function backend({ refuseRuns = false } = {}) {
  const map = new Map();
  return {
    map,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => {
      if (refuseRuns && k.includes('.run.')) throw new Error('QuotaExceededError');
      map.set(k, String(v));
    },
  };
}

// The outcome flow.js hands over, with storage's own recordResult as the cleared event did it.
function outcome(store, id, { score = 9000, mode = 'play', cleared = true, run = runFor(id, score) } = {}) {
  const res = cleared && mode === 'play' ? store.recordResult(id, { score, stars: 2 }) : { newBest: false };
  return { level: levelById(id), mode, cleared, score, newBest: res.newBest, run };
}

test('a cleared run that beats the best is saved as the level best run', () => {
  const back = backend();
  const store = createStorage(() => back);
  assert.equal(saveBestRun(store, outcome(store, 'w2-1')), 'saved');
  assert.ok(back.map.has('persia.run.w2-1'));
  assert.deepEqual(store.bestRun('w2-1'), runFor('w2-1'));
});

test('only when it beats the saved run: a lower score, a tainted run, the demo and a failure keep what is there', () => {
  const store = createStorage(() => backend());
  saveBestRun(store, outcome(store, 'w2-1', { score: 9000 }));
  assert.equal(saveBestRun(store, outcome(store, 'w2-1', { score: 8000 })), 'skip', 'lower than the saved run');
  assert.equal(saveBestRun(store, outcome(store, 'w2-1', { score: 9000 })), 'skip', 'equal is not better');
  assert.equal(store.bestRun('w2-1').score, 9000);
  assert.equal(saveBestRun(store, outcome(store, 'w3-1', { run: null })), 'skip', 'tainted: no run');
  assert.equal(store.bestRun('w3-1'), null);
  assert.equal(saveBestRun(store, outcome(store, 'w1-1', { mode: 'try' })), 'skip', 'the demo');
  assert.equal(saveBestRun(store, outcome(store, 'w1-2', { cleared: false })), 'skip', 'failed');
  assert.equal(store.bestRun('w1-2'), null);
});

// R33: the gate is the saved run, not the level's best score, which a tainted debug run, a level
// played before trailers existed or a save the quota refused can hold without any run behind it.
test('with no saved run, a cleared run is saved even when the level best is higher', () => {
  const store = createStorage(() => backend());
  store.recordResult('w5-2', { score: 50000, stars: 3 }); // a best with no run behind it
  const o = outcome(store, 'w5-2', { score: 12000 });
  assert.equal(o.newBest, false, 'not a new level best');
  assert.equal(saveBestRun(store, o), 'saved');
  assert.equal(store.bestRun('w5-2').score, 12000);
});

test('a corrupted or mislabelled saved run is replaced by the next clear', () => {
  // cut off; an old version (v 4, the pickups before R51); another level's run
  for (const bad of ['{"v":5,"level":"w6-1","seed":', JSON.stringify({ ...runFor('w6-1', 99999), v: 4 }), JSON.stringify(runFor('w1-1', 99999))]) {
    const back = backend();
    back.map.set('persia.run.w6-1', bad);
    const store = createStorage(() => back);
    store.recordResult('w6-1', { score: 99999, stars: 3 }); // the best the broken run once set
    assert.equal(saveBestRun(store, outcome(store, 'w6-1', { score: 3000 })), 'saved', bad.slice(0, 30));
    assert.equal(store.bestRun('w6-1').level, 'w6-1');
    assert.equal(store.bestRun('w6-1').score, 3000);
  }
});

test('a run that beats the saved run but not the level best is saved', () => {
  const store = createStorage(() => backend());
  saveBestRun(store, outcome(store, 'w7-3', { score: 8000 }));
  store.recordResult('w7-3', { score: 20000, stars: 3 }); // a higher best whose run was never kept (tainted)
  const o = outcome(store, 'w7-3', { score: 9500 });
  assert.equal(o.newBest, false);
  assert.equal(saveBestRun(store, o), 'saved');
  assert.equal(store.bestRun('w7-3').score, 9500);
});

test('a full or blocked storage never crashes and keeps the score; the run lasts the session', () => {
  const back = backend({ refuseRuns: true });
  const store = createStorage(() => back);
  const o = outcome(store, 'w4-2', { score: 12000 });
  assert.equal(saveBestRun(store, o), 'unsaved');
  assert.deepEqual(createStorage(() => back).best('w4-2'), { score: 12000, stars: 2 }, 'the score was kept');
  assert.equal(createStorage(() => back).bestRun('w4-2'), null, 'the run was not');
  assert.deepEqual(cinemaReels(store).map((r) => r.level.id), ['w4-2'], 'this session can still watch it');
  const broken = createStorage(() => { throw new Error('SecurityError'); });
  assert.equal(saveBestRun(broken, outcome(broken, 'w4-2')), 'unsaved');
});

test('cinema lists the levels with a playable saved run, in level order, skipping corrupted ones', () => {
  const back = backend();
  const put = (id, value) => back.map.set(`persia.run.${id}`, typeof value === 'string' ? value : JSON.stringify(value));
  put('w3-2', runFor('w3-2', 5000));
  put('w1-1', runFor('w1-1', 7000));
  put('w1-2', '{"v":5,"level":"w1-2","seed":'); // cut off mid-write
  put('w1-3', { ...runFor('w1-3'), v: 4 }); // an old version (the pickups before R51)
  put('w2-1', runFor('w1-1')); // another level's run under this key
  put('w2-2', { ...runFor('w2-2'), inputs: runFor('w2-2').inputs.slice(0, 2) }); // truncated inputs
  put('w2-3', 'null');
  const reels = cinemaReels(createStorage(() => back));
  assert.deepEqual(reels.map((r) => r.level.id), ['w1-1', 'w3-2']);
  assert.equal(reels[0].run.score, 7000);
  assert.equal(reels[0].run.inputs.length, 120, 'decoded, ready to replay');
  assert.deepEqual(cinemaReels(createStorage(() => backend())), [], 'nothing saved, nothing listed');
});

// M9: the Pi's games share one origin's ~5 MB of localStorage; a run too long to keep is not
// stored at all (the best score still is: recordResult), and Cinema simply lacks it.
test('a run whose encoded inputs pass the cap is not stored; the score and the saved run stay', () => {
  assert.equal(MAX_RUN_CHARS, 96 * 1024);
  const back = backend();
  const store = createStorage(() => back);
  saveBestRun(store, outcome(store, 'w5-5', { score: 4000 }));
  const huge = { ...runFor('w5-5', 60000), inputs: 'A'.repeat(MAX_RUN_CHARS + 1) };
  assert.equal(saveBestRun(store, outcome(store, 'w5-5', { score: 60000, run: huge })), 'skip');
  assert.equal(createStorage(() => back).bestRun('w5-5').score, 4000, 'the saved run is kept');
  assert.deepEqual(createStorage(() => back).best('w5-5'), { score: 60000, stars: 2 }, 'the score was kept');
  assert.deepEqual(cinemaReels(store).map((r) => r.run.score), [4000]);
  const fits = { ...runFor('w6-5', 7000), inputs: 'A'.repeat(MAX_RUN_CHARS) }; // at the cap: stored
  assert.equal(saveBestRun(store, outcome(store, 'w6-5', { score: 7000, run: fits })), 'saved');
});
