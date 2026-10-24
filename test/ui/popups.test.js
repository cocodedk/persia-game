import { test } from 'node:test';
import assert from 'node:assert/strict';
import { popupYs, POPUP_MIN_Y } from '../../src/ui/fx-view.js';

const pop = (x, y, scale = 1, text = '+100') => ({ x, y, scale, text });

test('pop-ups below the HUD line keep their own height', () => {
  assert.deepEqual(popupYs([pop(500, 400), pop(500, 410), pop(900, 151)]), [400, 410, 151]);
});

test('pop-ups held at the line under the HUD stack instead of piling up, three rows at most', () => {
  const ys = popupYs([pop(880, 110), pop(910, 100), pop(890, 90), pop(900, 80)]);
  assert.deepEqual(ys, [POPUP_MIN_Y, POPUP_MIN_Y + 34, POPUP_MIN_Y + 68, POPUP_MIN_Y + 68]);
});

test('held pop-ups side by side do not stack, and a big one takes a taller row', () => {
  assert.deepEqual(popupYs([pop(300, 120), pop(900, 120), pop(1500, 120)]), [150, 150, 150]);
  const ys = popupYs([pop(960, 120, 2, '+1000'), pop(960, 120)]);
  assert.deepEqual(ys, [150, 218], 'the small one clears the big one\'s taller row');
  assert.deepEqual(popupYs([pop(960, 120), pop(960, 120, 2, '+1000')]), [150, 218]);
});

test('the output array is reused', () => {
  const out = [1, 2, 3, 4, 5];
  assert.equal(popupYs([pop(0, 500)], out), out);
  assert.deepEqual(out, [500]);
});
