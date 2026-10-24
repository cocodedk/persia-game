import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installElements, walkFrames, FRAMES } from './dom-kit.js';

// The parade (screens/parade.js): the seven animals cross the middle of a 1920-wide line, right to
// left, one at a time, and each is named as it crosses.
installElements();
const { PARADE_LEAD, PARADE_STEP, PARADE_SPEED, PARADE_TAIL, paradeX, paradeCues } = await import('../../src/ui/screens/parade.js');

const N = 7;
const MID = 960;
const END = PARADE_LEAD + (N - 1) * PARADE_STEP + PARADE_TAIL;

// Walk the parade's clock in uneven frames; -> [{ i, t }] for every cue, with the frame's end time.
function walk(frames) {
  const cues = [];
  walkFrames(END, (t0, t1) => {
    for (const i of paradeCues(t0, t1, N)) cues.push({ i, t: t1 });
  }, frames);
  return cues;
}

test('every animal crosses the middle once, PARADE_STEP apart, starting at PARADE_LEAD', () => {
  for (let i = 0; i < N; i++) {
    const at = PARADE_LEAD + i * PARADE_STEP;
    assert.ok(Math.abs(paradeX(at, i) - MID) < 1e-6, `animal ${i} is at the middle at ${at} s`);
    assert.ok(Math.abs(paradeX(at - 1, i) - (MID + PARADE_SPEED)) < 1e-6, `${i} comes from the right`);
    assert.ok(Math.abs(paradeX(at + 1, i) - (MID - PARADE_SPEED)) < 1e-6, `${i} goes to the left`);
  }
  const cues = walk([1 / 60]);
  assert.deepEqual(cues.map((c) => c.i), [0, 1, 2, 3, 4, 5, 6]);
  cues.forEach(({ i, t }) => assert.ok(t - (PARADE_LEAD + i * PARADE_STEP) < 1 / 60 + 1e-9, `${i} is cued on its frame`));
});

test('paradeCues splits cleanly across frames', () => {
  for (const frames of [FRAMES, [0.1], [0.25, 0.001]]) {
    assert.deepEqual(walk(frames).map((c) => c.i), [0, 1, 2, 3, 4, 5, 6], `frames ${frames}`);
  }
  assert.deepEqual(paradeCues(0, PARADE_LEAD, N), [0], 'a cue on a frame edge belongs to the frame it ends');
  assert.deepEqual(paradeCues(PARADE_LEAD, PARADE_LEAD + 0.1, N), []);
  assert.deepEqual(paradeCues(0, END, N), [0, 1, 2, 3, 4, 5, 6]);
  assert.deepEqual(paradeCues(0, END, 3), [0, 1, 2], 'only n animals');
});
