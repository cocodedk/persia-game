import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installCanvas, sink } from './dom-kit.js';

// The film look on a stand-in context that logs its calls: at half quality (R46) the grain pass is
// skipped, while the grade, the vignette and the letterbox bars still draw.
installCanvas();
const { drawFilm } = await import('../../src/ui/film-view.js');

function recorder() {
  const calls = [];
  const ctx = new Proxy({}, {
    get: (o, k) => (k in o ? o[k] : (...args) => (calls.push(k), sink)),
    set: (o, k, v) => ((o[k] = v), true),
  });
  return { ctx, calls, count: (name) => calls.filter((c) => c === name).length };
}

const film = { k: 1, grade: 0.4, tint: '#ff8040', grain: 0.2, seed: 3, frame: 7, vignette: 0.6, letterbox: 1 };

test('full quality draws the grain; half quality skips it and keeps the rest of the look', () => {
  const full = recorder();
  drawFilm(full.ctx, film);
  assert.equal(full.count('createPattern'), 1, 'the grain at full quality (the default)');
  const half = recorder();
  drawFilm(half.ctx, film, 0.5);
  assert.equal(half.count('createPattern'), 0, 'no grain at half quality');
  assert.equal(half.count('drawImage'), 1, 'the vignette still draws');
  assert.equal(half.count('fillRect'), full.count('fillRect') - 1, 'the grade and both bars still draw');
  const again = recorder();
  drawFilm(again.ctx, film, 1);
  assert.equal(again.count('createPattern'), 1);
});
