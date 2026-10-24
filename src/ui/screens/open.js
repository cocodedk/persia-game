// The cinematic open, on a session's first Play: the lights go down, a braam, a thin warm line opens
// across the middle like a projector, PERSIA tightens in over it, eyes blink open in the dark, and an
// impact cuts to the first wave. The beats run on the frame clock (update(dt)); each adds `at-<name>`
// to the screen's classes, and open.css plays it.
//   OPEN_BEATS  [{ at, name }] in order;  SKIP_AFTER  s before a key may skip
//   beatsBetween(t0, t1) -> the names of the beats with t0 < at <= t1, in order
//   openScreen({ onDone }) -> a stage screen. Any key after SKIP_AFTER jumps to impact; done follows.
import { h, shell } from './dom.js';
import { play, duck } from '../audio.js';

export const OPEN_BEATS = [
  { at: 0.05, name: 'dark' }, // music ducks to 0; letterbox bars slide in over 0.6 s
  { at: 0.5, name: 'braam' },
  { at: 1.8, name: 'light' }, // a thin warm line opens across the middle, like a projector
  { at: 2.8, name: 'title' }, // PERSIA fades in, its tracking tightening over 3 s; the riser
  { at: 5.4, name: 'eyes' }, // 14 pairs of eyes blink open in the dark around the title
  { at: 7.6, name: 'impact' }, // a white flash; the title and bars cut away
  { at: 8.2, name: 'done' },
];
export const SKIP_AFTER = 1.0; // s before a key may skip

const IMPACT = OPEN_BEATS.find((b) => b.name === 'impact').at;

// The eyes: [x %, y %, size, delay s after the beat], a fixed scatter round the title.
const EYES = [
  [9, 24, 1.1, 0.35], [21, 36, 0.7, 0.9], [12, 62, 1.4, 0.05], [26, 76, 0.9, 1.15], [35, 22, 0.6, 0.6],
  [44, 72, 0.75, 1.3], [57, 21, 0.65, 0.2], [64, 74, 1.05, 0.75], [73, 31, 0.8, 1.0], [88, 21, 1.15, 0.45],
  [82, 52, 0.7, 1.4], [91, 66, 1.3, 0.15], [77, 81, 0.85, 1.05], [5, 82, 0.95, 0.55],
];

export const beatsBetween = (t0, t1) => OPEN_BEATS.filter((b) => t0 < b.at && b.at <= t1).map((b) => b.name);

function eyePair([x, y, s, d]) {
  const el = h('i', 'eye-pair', h('b'), h('b'));
  el.style.cssText = `left: ${x}%; top: ${y}%; --s: ${s}; --d: ${d}s`;
  return el;
}

export function openScreen({ onDone }) {
  const el = shell('open');
  el.append(
    h('div', 'open-beam'),
    h('div', 'open-eyes', ...EYES.map(eyePair)),
    h('h1', 'open-title', 'PERSIA'),
    h('div', 'open-bar top'), h('div', 'open-bar bottom'),
    h('div', 'open-flash'));
  const ACT = {
    dark: () => duck(0),
    braam: () => play('braam'),
    title: () => play('riser'),
    impact: () => play('impact'),
    done: () => {
      duck(1);
      onDone();
    },
  };
  const beat = (name) => {
    el.classList.add(`at-${name}`);
    ACT[name]?.();
  };
  let t = 0;
  return {
    el,
    onKey() {
      if (t >= SKIP_AFTER && t < IMPACT) {
        t = IMPACT;
        beat('impact');
      }
      return true; // the open keeps every key from the game
    },
    update(dt) {
      const t0 = t;
      t += dt;
      for (const name of beatsBetween(t0, t)) beat(name);
    },
  };
}
