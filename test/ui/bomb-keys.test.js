import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bombKeys } from '../../src/ui/bomb-keys.js';

const X = 1800;
const Y = 38; // the caption row

// Every call bombKeys makes on a context, as [name, ...args].
function draw(touch) {
  const log = [];
  const ctx = new Proxy({}, { get: (o, k) => (k in o ? o[k] : (...a) => { log.push([k, ...a]); }), set: (o, k, v) => { o[k] = v; return true; } });
  bombKeys(ctx, X, Y, touch);
  return log;
}
const named = (log, n) => log.filter(([k]) => k === n);

test('the hint shows a B key cap and a mouse by default: one letter, no rings', () => {
  const log = draw(false);
  assert.deepEqual(named(log, 'fillText').map(([, s]) => s), ['B']);
  assert.equal(named(log, 'arc').length, 0);
  assert.ok(named(log, 'stroke').length >= 3, 'the cap, the mouse and its buttons are stroked');
  assert.equal(named(log, 'fill').length, 1, 'the right button is lit');
});

test('once a touch has been seen the hint is a fingertip in a ring, with no letter', () => {
  const log = draw(true);
  assert.equal(named(log, 'fillText').length, 0);
  const arcs = named(log, 'arc');
  assert.equal(arcs.length, 2);
  assert.equal(named(log, 'stroke').length, 1, 'the ring');
  assert.equal(named(log, 'fill').length, 1, 'the fingertip');
  assert.ok(arcs[0][3] > arcs[1][3], 'the ring is wider than the fingertip');
});

test('both hints stay inside their 26 x 14 slot, on the caption row', () => {
  for (const touch of [false, true]) {
    for (const [k, a, b, c, d] of draw(touch)) {
      const pts = k === 'arc' ? [[a - d, b - d], [a + d, b + d]] : ['moveTo', 'lineTo'].includes(k) ? [[a, b]] : k === 'arcTo' ? [[a, b], [c, d]] : [];
      for (const [x, y] of pts) {
        assert.ok(x >= X && x <= X + 26, `${k} x ${x} (touch ${touch})`);
        assert.ok(y >= Y - 7 && y <= Y + 7, `${k} y ${y} (touch ${touch})`);
      }
    }
  }
});
