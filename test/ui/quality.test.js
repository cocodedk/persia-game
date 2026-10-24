import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createQuality, sampleFrame, DROP_MS, RESTORE_MS, DROP_RATIO, DROP_CAP_MS, RESTORE_RATIO, BASE_MIN_MS, BASE_MAX_MS,
} from '../../src/ui/quality.js';

// Feed `secs` seconds of frames that each take `ms`.
function run(q, ms, secs) {
  for (let t = 0; t < secs * 1000; t += ms) sampleFrame(q, ms);
  return q.level;
}

test('starts at full quality', () => {
  assert.equal(createQuality().level, 1);
});

test('the thresholds are the spec values', () => {
  assert.equal(DROP_MS, 20);
  assert.equal(RESTORE_MS, 14);
});

test('a slow second drops to half, but not before the second is over', () => {
  const q = createQuality();
  run(q, 25, 0.9);
  assert.equal(q.level, 1, 'still averaging the first second');
  run(q, 25, 0.2);
  assert.equal(q.level, 0.5);
});

test('hysteresis: between 14 and 20 ms the level holds, whichever it is', () => {
  const q = createQuality();
  assert.equal(run(q, 18, 3), 1, '18 ms does not drop full quality');
  run(q, 25, 1.1);
  assert.equal(q.level, 0.5);
  assert.equal(run(q, 16, 3), 0.5, '16 ms does not restore half quality');
  assert.equal(run(q, 12, 1.1), 1, '12 ms restores it');
});

test('exactly at a threshold nothing changes (strictly above 20, strictly below 14)', () => {
  const q = createQuality();
  assert.equal(run(q, 20, 2), 1);
  run(q, 30, 1.1);
  assert.equal(run(q, 14, 2), 0.5);
});

test('the average is over the window, not the last frame', () => {
  const q = createQuality();
  for (let i = 0; i < 40; i++) {
    sampleFrame(q, 10);
    sampleFrame(q, 30); // average 20: not above the drop line
  }
  assert.equal(q.level, 1);
  for (let i = 0; i < 40; i++) {
    sampleFrame(q, 12);
    sampleFrame(q, 30); // average 21
  }
  assert.equal(q.level, 0.5);
});

// Feed `secs` seconds of a vsync-locked loop: each frame does `work` ms of work in an `interval` ms slot.
function runAt(q, work, interval, secs) {
  for (let t = 0; t < secs * 1000; t += interval) sampleFrame(q, work, interval);
  return q.level;
}

test('work time, not the 60 Hz interval: a heavy second drops, 6 ms of work restores within a second', () => {
  const q = createQuality();
  assert.equal(runAt(q, 24, 33.4, 1), 0.5, '24 ms of work a frame drops (30 frames, one window)');
  assert.equal(runAt(q, 6, 16.7, 1.05), 1, 'light work at 16.7 ms intervals restores');
  assert.ok(q.avg > 5.9 && q.avg < 6.1, `avg is the work, not the interval: ${q.avg}`);
});

test('the window is a second of frames even when the work per frame is tiny', () => {
  const q = createQuality();
  runAt(q, 25, 25, 1); // exactly one window: no frames left over
  assert.equal(q.level, 0.5);
  assert.equal(runAt(q, 0.5, 16.7, 0.9), 0.5, 'not judged before a second of intervals');
  assert.equal(runAt(q, 0.5, 16.7, 0.2), 1);
  assert.equal(runAt(q, 0, 16.7, 1.1), 1, 'zero work (a coarse timer) is a valid sample');
});

test('a stall (hidden tab, GC pause) or a bad sample is ignored', () => {
  const q = createQuality();
  run(q, 12, 0.5);
  sampleFrame(q, 4000);
  sampleFrame(q, NaN);
  sampleFrame(q, -5);
  run(q, 12, 0.6);
  assert.equal(q.level, 1);
  assert.ok(q.avg > 11 && q.avg < 13, `avg ${q.avg}`);
});

// Ruling R23: a GPU-bound Pi shows up in the display's pace, not in the work measured on the CPU.
// M1: the pace is judged against the display's own period, the quickest 1 s average interval seen
// (never below 60 Hz's 16.7 ms nor above 50 Hz's 20 ms): drop above min(22, 1.3 x it) (R49), restore
// below 1.1 x it.
const HZ60 = 1000 / 60;

test('the base period is the quickest second seen, judged between 60 Hz and 50 Hz', () => {
  assert.equal(DROP_RATIO, 1.3);
  assert.equal(RESTORE_RATIO, 1.1);
  const q = createQuality();
  assert.equal(q.base, BASE_MAX_MS, 'until a second is measured, the slowest display it allows');
  runAt(q, 5, 17.5, 2);
  assert.ok(Math.abs(q.base - 17.5) < 0.01, `base ${q.base}`);
  runAt(q, 5, 30, 2);
  assert.ok(Math.abs(q.base - 17.5) < 0.01, 'a slow second does not raise it');
  runAt(q, 5, 7, 2);
  assert.equal(q.base, BASE_MIN_MS, 'a 144 Hz display is judged as 60 Hz: the game ticks at 60');
});

test('60 Hz: light work at a pace above 1.3 x 16.7 ms drops; restoring needs both lines', () => {
  const q = createQuality();
  assert.equal(runAt(q, 5, HZ60, 2), 1);
  assert.equal(runAt(q, 5, 21, 2), 1, '21 ms is under 21.7 ms: holds');
  assert.equal(runAt(q, 5, 23, 1.05), 0.5, 'light work at 43 fps drops');
  assert.ok(q.interval > 22.9 && q.interval < 23.1, `the window's average interval is kept: ${q.interval}`);
  const dropped = () => {
    const d = createQuality();
    runAt(d, 5, 20, 1); // exactly one window at 50 fps: the base is 20 ms
    runAt(d, 5, HZ60, 1.0001); // one window at 60 Hz: the base is 16.7 ms
    runAt(d, 25, 25, 1); // exactly one heavy window: nothing carried into the next
    assert.equal(d.level, 0.5);
    assert.ok(d.base < 16.7, `base ${d.base}`);
    return d;
  };
  assert.equal(runAt(dropped(), 5, 20, 3), 0.5, 'a 50 fps pace on a 60 Hz display holds it down');
  assert.equal(runAt(dropped(), 15, HZ60, 2), 0.5, 'a 60 fps pace with 15 ms of work holds it down');
  assert.equal(runAt(dropped(), 5, HZ60, 1.05), 1, 'both under their lines restores');
});

test('50 Hz: steady 20 ms frames stay full, and a heavy second no longer sticks at half (M1)', () => {
  const q = createQuality();
  assert.equal(runAt(q, 5, 20, 3), 1, 'the display\'s own pace is not a slow pace');
  assert.equal(runAt(q, 25, 25, 1), 0.5, 'one heavy second drops');
  assert.equal(runAt(q, 5, 20, 1.05), 1, 'light work at the display\'s 20 ms restores');
  assert.equal(runAt(q, 5, 22, 2), 1, '22 ms is on the line, min(22, 1.3 x 20): holds');
  assert.equal(runAt(q, 5, 23, 1.1), 0.5, 'a pace above 22 ms drops (R49)');
});

test('a GPU-bound start cannot pass for a slow display: the base never rises above 20 ms (R23)', () => {
  const q = createQuality();
  assert.equal(runAt(q, 5, 33.4, 1.05), 0.5, 'light work at 30 fps from the first second drops');
  assert.equal(q.base, BASE_MAX_MS);
  assert.equal(runAt(q, 5, 22, 2), 0.5, 'and 22 ms (over 1.1 x 20) does not restore it');
});

// R49: the base starts at 20 ms, so 1.3 x base alone (26 ms) let a renderer stuck at 40 to 43 fps from
// its first second pass for a slow display. The pace line is capped: drop above min(22, 1.3 x base).
test('a fresh scaler at a steady 23 to 25 ms interval drops (R49)', () => {
  assert.equal(DROP_CAP_MS, 22);
  for (const interval of [23, 24, 25]) {
    assert.equal(runAt(createQuality(), 5, interval, 1.05), 0.5, `${interval} ms from the first second`);
  }
});
