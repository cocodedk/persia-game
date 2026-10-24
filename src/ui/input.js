// Keyboard and mouse, adapted from Barrage. Held keys live in `down`; presses also land in `taps`
// until the next tick reads them, so a tap shorter than a frame still fires or bombs. The pointer
// steers once it moves (or clicks) and hands back to the keys as soon as a movement key is pressed.
// Controls (spec): arrows/WASD move · Space fires (hold for auto-fire) · B or Shift bombs ·
// P/Esc pauses · M mutes · Enter confirms. Mouse: the ship eases toward the pointer, the left
// button fires, the right button bombs.
//   createInput(canvas) -> input   input.onKey(code, event) for screens and global keys,
//                                  input.onGesture() on the first key or click (audio unlock)
//   readInput(input, view) -> raw  { dx, dy, fire, bomb, target } for quantizeInput
//   resetInput(input)              forget held keys and buttons (a screen took over)
// Keys with Alt, Ctrl or Meta held are left alone: Alt+Left must stay the browser's Back.
import { MOVE } from './keys.js';

const FIRE = ['Space'];
const BOMB = ['KeyB', 'ShiftLeft', 'ShiftRight'];
const GAME_KEYS = new Set([...Object.keys(MOVE), 'Space', 'Enter', 'NumpadEnter', 'Escape', 'Tab']);

export function createInput(canvas) {
  const input = {
    canvas, down: new Set(), taps: new Set(),
    mouse: { x: 0, y: 0, left: false, right: false, active: false },
    onKey: null, onGesture: null,
  };
  const m = input.mouse;
  const gesture = () => input.onGesture?.();

  addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    gesture();
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    if (e.repeat) {
      if (MOVE[e.code]) input.onKey?.(e.code, e); // menus scroll on a held arrow
      return;
    }
    input.down.add(e.code);
    input.taps.add(e.code);
    if (MOVE[e.code]) m.active = false; // the keys take the ship back from the pointer
    input.onKey?.(e.code, e);
  });
  addEventListener('keyup', (e) => {
    if (GAME_KEYS.has(e.code)) e.preventDefault(); // no native button click on Space-up
    input.down.delete(e.code);
  });
  addEventListener('blur', () => resetInput(input)); // key-ups are lost while unfocused

  addEventListener('pointermove', (e) => {
    if (e.clientX === m.x && e.clientY === m.y) return; // a synthetic move at rest is not steering
    m.x = e.clientX;
    m.y = e.clientY;
    m.active = true;
    if (m.left && !(e.buttons & 1)) m.left = false; // its pointerup went missing
    if (m.right && !(e.buttons & 2)) m.right = false;
  });
  canvas.addEventListener('pointerdown', (e) => {
    Object.assign(m, { x: e.clientX, y: e.clientY, active: true });
    if (e.button === 0) m.left = true;
    if (e.button === 2) m.right = true;
    input.taps.add(`Mouse${e.button}`);
    try {
      canvas.setPointerCapture(e.pointerId); // the pointerup arrives even outside the window
    } catch {
      // the pointer is already gone: the buttonless-move check above releases it
    }
  });
  addEventListener('pointerup', (e) => {
    if (e.button === 0) m.left = false;
    if (e.button === 2) m.right = false;
  });
  addEventListener('pointercancel', () => { m.left = false; m.right = false; });
  addEventListener('pointerdown', gesture);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  return input;
}

// A screen took over or a level starts: nothing held, and the pointer steers again only once it moves.
export function resetInput(input) {
  input.down.clear();
  input.taps.clear();
  input.mouse.active = false;
  input.mouse.left = false;
  input.mouse.right = false;
}

const any = (input, codes) => codes.some((c) => input.down.has(c) || input.taps.has(c));

// The pointer in world px, through the view's letterbox fit (view.js).
function toWorld(view, x, y) {
  const c = view.canvas;
  const r = c.getBoundingClientRect();
  const f = view.fit;
  if (!r.width || !r.height || !f.s) return null;
  const px = ((x - r.left) * c.width) / r.width;
  const py = ((y - r.top) * c.height) / r.height;
  return { x: (px - f.ox) / f.s, y: (py - f.oy) / f.s };
}

export function readInput(input, view) {
  let dx = 0;
  let dy = 0;
  for (const code of input.down) {
    const mv = MOVE[code];
    if (!mv) continue;
    dx += mv[0];
    dy += mv[1];
  }
  const m = input.mouse;
  const raw = {
    dx, dy,
    fire: any(input, FIRE) || m.left || input.taps.has('Mouse0'),
    bomb: any(input, BOMB) || m.right || input.taps.has('Mouse2'),
    target: m.active ? toWorld(view, m.x, m.y) : null,
  };
  input.taps.clear(); // read by this tick
  return raw;
}
