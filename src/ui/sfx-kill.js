// An alien's death: a pop of air and a body pitched by role (grunts pop high, armored crash low,
// carriers sparkle up the world's scale), the combo lifting it a semitone a step, and one layer in
// the world's own voice so a kill in Ronin Moon sounds like Ronin Moon. A patch: (a, o) -> seconds.
import { tone, hiss, fm, crush, semis, noteHz } from './audio-kit.js';

const BODY = { grunt: [720, 110, 0.12], diver: [1150, 170, 0.14], gunner: [400, 60, 0.18], armored: [260, 50, 0.26], carrier: [880, 140, 0.15] };
const HEAVY = { gunner: true, armored: true };

// The world's layer: f0 is the role's body pitch.
const FLAVOUR = {
  chip: (a, f0, heavy) => tone(a, { type: 'square', f0: f0 * 1.6, f1: 70, steps: heavy ? 10 : 7, dur: heavy ? 0.24 : 0.16, peak: 0.05, cut: 6000 }),
  noir: (a, f0) => tone(a, { type: 'sawtooth', t: a.t + 0.15, f0, f1: f0 * 0.2, dur: 0.14, peak: 0.04, cut: 2200, cut1: 300 }), // the echo
  brass: (a, f0) => fm(a, { f0: f0 * 2, f1: f0 * 0.5, ratio: 1.5, index: 1.2, dur: 0.18, peak: 0.05 }),
  koto: (a, f0, heavy) => {
    tone(a, { f0: heavy ? 130 : 180, f1: heavy ? 46 : 70, dur: heavy ? 0.38 : 0.22, peak: heavy ? 0.3 : 0.16 }); // taiko
    tone(a, { type: 'triangle', t: a.t + 0.03, f0: noteHz(a.kit, heavy ? 0 : 4, 5), dur: 0.3, peak: 0.06 }); // a plucked note
  },
  hive: (a) => hiss(a, { type: 'bandpass', f0: 1900, f1: 260, q: 7, dur: 0.24, peak: 0.5 }), // a wet squelch
  code: (a, f0) => tone(a, { type: 'square', f0: f0 * 2.2, f1: f0 * 0.3, steps: 5, dur: 0.12, peak: 0.03, dest: crush(a, 8) }),
  iron: (a, f0) => fm(a, { f0: f0 * 0.6, f1: f0 * 0.18, ratio: 1.41, index: 3, dur: 0.32, peak: 0.08, cut: 4000 }),
  cosmic: (a, f0) => tone(a, { f0: f0 * 0.5, f1: f0 * 0.12, attack: 0.06, dur: 0.5, peak: 0.07 }), // a soft implosion
};

export function kill(a, o) {
  const { kit } = a;
  const k = kit.pitch * semis(Math.min(7, (o.mult ?? 1) - 1));
  const [f0, f1, dur] = BODY[o.role] ?? BODY.grunt;
  const heavy = Boolean(HEAVY[o.role]);
  hiss(a, { type: 'lowpass', f0: 6500, f1: 280, dur: 0.22, peak: kit.style === 'hive' ? 0.16 : 0.24 });
  if (o.role === 'armored') fm(a, { f0: 310 * k, f1: 90 * k, ratio: 1.41, index: 3, dur: 0.32, peak: 0.1, cut: 4000 });
  const type = kit.style === 'chip' ? 'square' : kit.style === 'cosmic' ? 'sine' : 'triangle';
  tone(a, { type, f0: f0 * k, f1: f1 * k, dur, peak: 0.14, dest: o.role === 'gunner' ? crush(a, 3) : a.out, cut: kit.cut });
  FLAVOUR[kit.style]?.(a, f0 * k, heavy);
  if (o.role === 'carrier') {
    [4, 7, 9, 11].forEach((d, i) => tone(a, { t: a.t + 0.04 + i * 0.045, f0: noteHz(kit, d, 6), dur: 0.16, peak: 0.07 }));
  }
  return kit.style === 'cosmic' ? 0.6 : 0.42;
}
