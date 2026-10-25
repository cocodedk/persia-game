import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInput, readInput, resetInput, touchSeen } from '../../src/ui/input.js';
import { BOMB_PANEL } from '../../src/ui/hud.js';

// The real handlers, fed fake pointer events: window listeners are kept by type, the canvas's own
// pointerdown runs first (as it bubbles to the window). The view is a 1:1 fit of the 1920 x 1080 world.
const view = {
  canvas: { width: 1920, height: 1080, getBoundingClientRect: () => ({ left: 0, top: 0, width: 1920, height: 1080 }) },
  fit: { s: 1, ox: 0, oy: 0 },
};
const PANEL = { x: BOMB_PANEL.x + BOMB_PANEL.w / 2, y: BOMB_PANEL.y + BOMB_PANEL.h / 2 };
const FIELD = { x: 600, y: 700 };

function make() {
  const on = {};
  const own = {};
  globalThis.addEventListener = (type, fn) => (on[type] ??= []).push(fn);
  const canvas = { ...view.canvas, addEventListener: (type, fn) => { own[type] = fn; }, setPointerCapture() {} };
  const input = createInput(canvas);
  const fire = (type, at, e = {}) => {
    const ev = { pointerId: 1, pointerType: 'touch', button: 0, buttons: 1, clientX: at?.x, clientY: at?.y, ...e };
    if (type === 'pointerdown') own.pointerdown(ev);
    for (const fn of on[type] ?? []) fn(ev);
  };
  return { input, fire, read: () => readInput(input, view) };
}

test('no touch has been seen until one goes down, and then it stays seen', () => {
  assert.equal(touchSeen(), false);
  const { fire } = make();
  fire('pointerdown', FIELD, { pointerType: 'mouse' });
  assert.equal(touchSeen(), false, 'a mouse press is not a touch');
  fire('pointerdown', FIELD);
  assert.equal(touchSeen(), true);
});

test('a touch on the bombs panel bombs on the first read only, and steers and fires nothing while held', () => {
  const { fire, read } = make();
  fire('pointerdown', PANEL);
  const first = read();
  assert.deepEqual([first.bomb, first.fire, first.target], [true, false, null]);
  fire('pointermove', { x: PANEL.x - 20, y: PANEL.y + 200 }, { buttons: 1 }); // a drag off the panel
  const held = read();
  assert.deepEqual([held.bomb, held.fire, held.target], [false, false, null]);
});

test('a touch anywhere else steers and fires, and does not bomb', () => {
  const { fire, read } = make();
  fire('pointerdown', FIELD);
  const r = read();
  assert.deepEqual([r.bomb, r.fire, r.target], [false, true, FIELD]);
  fire('pointerup', FIELD, { buttons: 0 });
  const after = read();
  assert.deepEqual([after.fire, after.target], [false, FIELD], 'the ship still goes to where the finger lifted');
});

test('a touch that drags onto the panel does not bomb', () => {
  const { fire, read } = make();
  fire('pointerdown', FIELD);
  read();
  fire('pointermove', PANEL);
  const r = read();
  assert.deepEqual([r.bomb, r.fire], [false, true]);
  assert.deepEqual(r.target, PANEL);
});

test('after a panel tap lifts, the ship is not pulled to the HUD', () => {
  const { input, fire, read } = make();
  fire('pointerdown', PANEL);
  read();
  fire('pointerup', PANEL, { buttons: 0 });
  const lifted = read();
  assert.deepEqual([lifted.bomb, lifted.fire, lifted.target], [false, false, null]);
  assert.equal(input.mouse.active, false);
  assert.equal(read().target, null);
  fire('pointermove', FIELD, { pointerType: 'mouse', buttons: 0 });
  assert.deepEqual(read().target, FIELD, 'the pointer steers again once it moves');
});

test('a tap shorter than a frame still bombs once, and steers nothing', () => {
  const { fire, read } = make();
  fire('pointerdown', PANEL);
  fire('pointerup', PANEL, { buttons: 0 });
  const r = read();
  assert.deepEqual([r.bomb, r.fire, r.target], [true, false, null]);
  const next = read();
  assert.deepEqual([next.bomb, next.target], [false, null]);
});

test('a pointercancel ends the hold the same way', () => {
  const { input, fire, read } = make();
  fire('pointerdown', PANEL);
  read();
  fire('pointercancel');
  const r = read();
  assert.deepEqual([r.bomb, r.fire, r.target], [false, false, null]);
  assert.equal(input.mouse.active, false);
});

test('a second tap bombs again', () => {
  const { fire, read } = make();
  for (let i = 0; i < 2; i++) {
    fire('pointerdown', PANEL);
    assert.equal(read().bomb, true);
    fire('pointerup', PANEL, { buttons: 0 });
    read();
  }
});

test('a screen taking over drops a bomb touch', () => {
  const { input, fire, read } = make();
  fire('pointerdown', PANEL);
  resetInput(input);
  assert.deepEqual([read().bomb, input.mouse.hold], [false, false]);
});

test('the mouse is unchanged on the panel: the left button fires and steers, the right bombs, keys bomb', () => {
  const { input, fire, read } = make();
  fire('pointerdown', PANEL, { pointerType: 'mouse' });
  const left = read();
  assert.deepEqual([left.fire, left.bomb, left.target], [true, false, PANEL]);
  fire('pointerup', PANEL, { pointerType: 'mouse', buttons: 0 });
  fire('pointerdown', PANEL, { pointerType: 'mouse', button: 2, buttons: 2 });
  const right = read();
  assert.deepEqual([right.bomb, right.fire], [true, false]);
  fire('pointerup', PANEL, { pointerType: 'mouse', button: 2, buttons: 0 });
  input.down.add('KeyB');
  assert.equal(read().bomb, true);
  input.down.clear();
  input.down.add('Space');
  assert.equal(read().fire, true);
});
