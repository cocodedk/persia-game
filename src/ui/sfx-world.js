// Sound patches of the eight world twists: Neon Rain's thunder, Twin Suns' gusts, Ronin Moon's
// shuriken cut, Hive's acid, Code Rain's teleport glitch and bullet-time swell, Iron Dawn's wrecks
// that reassemble, Event Horizon's well swallowing bullets, and Arcade Origin's warbling saucer.
// A patch is (a, o) -> seconds (audio-kit.js); a.tail is a stereo panner when the sound has an x.
import { tone, hiss, fm, wobble, crush } from './audio-kit.js';

// Sweep the sound's panner from one side to the other over `secs`.
function sweep(a, from, to, secs) {
  const p = a.tail.pan;
  if (!p) return;
  p.setValueAtTime(from, a.t);
  p.linearRampToValueAtTime(to, a.t + secs);
}

export const WORLD = {
  thunder(a, o) {
    const s = o.strength ?? 0.8;
    hiss(a, { type: 'highpass', f0: 1800, f1: 700, dur: 0.1, peak: 0.36 * s });
    const r = hiss(a, { type: 'lowpass', f0: 900, f1: 70, attack: 0.05, dur: 2.3, peak: 0.5 * s });
    wobble(a, r.gain, 6.5, 0.12 * s, a.t, 2.3, 'square');
    hiss(a, { t: a.t + 0.4, type: 'lowpass', f0: 420, f1: 60, attack: 0.2, dur: 1.6, peak: 0.3 * s });
    return 2.8;
  },
  gust(a, o) {
    const dir = Math.sign(o.wind) || 1;
    sweep(a, -0.7 * dir, 0.7 * dir, 1.7);
    const w = hiss(a, { type: 'bandpass', f0: 280, f1: 1300, q: 1.3, attack: 0.65, dur: 1.05, peak: 0.5 });
    wobble(a, w.gain, 3.1, 0.05, a.t, 1.7);
    hiss(a, { type: 'highpass', f0: 5200, attack: 0.5, dur: 0.9, peak: 0.08 }); // the sand hiss on top
    return 1.9;
  },
  cut(a) { // a shot slices a shuriken: a steel shing
    fm(a, { f0: 3100, ratio: 1.41, index: 0.8, dur: 0.38, peak: 0.07 });
    hiss(a, { type: 'highpass', f0: 6400, f1: 2800, dur: 0.06, peak: 0.14 });
    return 0.42;
  },
  acid(a) { // a drip, then the sizzle where it lands
    tone(a, { f0: 1500, f1: 480, dur: 0.08, peak: 0.07 });
    const s = hiss(a, { t: a.t + 0.06, type: 'highpass', f0: 3600, f1: 2400, attack: 0.03, dur: 0.5, peak: 0.1 });
    wobble(a, s.gain, 41, 0.05, a.t + 0.06, 0.55, 'square');
    return 0.65;
  },
  teleport(a) { // a digital glitch out, and back in a beat later
    const d = crush(a, 6);
    tone(a, { type: 'square', f0: 2100, f1: 260, steps: 9, dur: 0.11, peak: 0.03, dest: d });
    hiss(a, { type: 'highpass', f0: 5200, dur: 0.04, peak: 0.05 });
    tone(a, { type: 'square', t: a.t + 0.1, f0: 300, f1: 1900, steps: 7, dur: 0.08, peak: 0.025, dest: d });
    return 0.25;
  },
  bulletOn(a) { // time thickens: everything swoops down
    tone(a, { type: 'sawtooth', f0: 440, f1: 82, dur: 0.95, peak: 0.12, cut: 2200, cut1: 260 });
    hiss(a, { type: 'lowpass', f0: 2400, f1: 180, dur: 0.95, peak: 0.14 });
    hiss(a, { type: 'highpass', f0: 3000, f1: 8000, attack: 0.35, dur: 0.1, peak: 0.06 });
    return 1.1;
  },
  bulletOff(a) {
    tone(a, { type: 'sawtooth', f0: 82, f1: 440, dur: 0.5, peak: 0.08, cut: 300, cut1: 2400 });
    return 0.6;
  },
  wreck(a) { // a machine knocked flat, still twitching
    tone(a, { f0: 170, f1: 58, dur: 0.22, peak: 0.26 });
    hiss(a, { type: 'lowpass', f0: 3200, f1: 280, dur: 0.32, peak: 0.2 });
    fm(a, { t: a.t + 0.1, f0: 820, ratio: 2.7, index: 2, dur: 0.12, peak: 0.04 });
    return 0.45;
  },
  wreckDown(a) {
    hiss(a, { type: 'lowpass', f0: 5000, f1: 250, dur: 0.4, peak: 0.32 });
    fm(a, { f0: 380, f1: 120, ratio: 1.41, index: 3.2, dur: 0.32, peak: 0.08, cut: 3200 });
    return 0.5;
  },
  reassemble(a) { // a ratchet winding faster, a servo whine, a clunk
    let t = a.t;
    for (let i = 0; i < 9; i++) {
      hiss(a, { t, type: 'highpass', f0: 2600 + i * 200, dur: 0.014, peak: 0.16 });
      t += 0.11 * 0.8 ** i;
    }
    tone(a, { type: 'sawtooth', f0: 190, f1: 760, attack: 0.5, dur: 0.12, peak: 0.05, cut: 1600 });
    tone(a, { t: t + 0.04, f0: 140, f1: 52, dur: 0.2, peak: 0.34 });
    return t - a.t + 0.3;
  },
  absorb(a) { // the well swallows a bullet: a dark falling thoom
    tone(a, { f0: 330, f1: 26, dur: 0.75, peak: 0.11 });
    hiss(a, { type: 'lowpass', f0: 700, f1: 50, dur: 0.6, peak: 0.06 });
    return 0.9;
  },
  saucer(a, o) { // the bonus saucer's warble, flying across
    const dir = o.dir ?? 1;
    sweep(a, -0.8 * dir, 0.8 * dir, 3.2);
    const w = tone(a, { type: 'triangle', f0: 540, attack: 0.4, dur: 2.9, peak: 0.11 });
    wobble(a, w.frequency, 7, 130, a.t, 3.3);
    const s = tone(a, { type: 'square', f0: 1080, attack: 0.4, dur: 2.9, peak: 0.025, cut: 2400 });
    wobble(a, s.frequency, 7, 260, a.t, 3.3);
    return 3.4;
  },
};
