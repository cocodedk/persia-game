// Sound patches of the fight: the ship's gun (one signature per world, varied by power-up), enemy
// fire, hits, the ship's scrapes and bunkers (kills by role: sfx-kill.js; pickups: sfx-power.js).
// A patch is (a, o) -> seconds it rings; a = { ctx, t, out, tail, noise, kit } (audio-kit.js).
import { tone, hiss, fm, wobble, crush } from './audio-kit.js';
import { LASER_WARN, LASER_BEAM } from '../core/patterns.js';
import { kill } from './sfx-kill.js';

// The ship's shot per world style; k scales the pitch (power-up and world).
const SHOT = {
  chip: (a, k) => (tone(a, { type: 'square', f0: 1480 * k, f1: 360 * k, dur: 0.09, peak: 0.13, steps: 6, cut: 7000 }), 0.12),
  noir: (a, k) => {
    tone(a, { type: 'sawtooth', f0: 1900 * k, f1: 240 * k, dur: 0.13, peak: 0.18, cut: 4500, cut1: 600 });
    tone(a, { type: 'sawtooth', t: a.t + 0.13, f0: 1900 * k, f1: 240 * k, dur: 0.12, peak: 0.05, cut: 2400, cut1: 400 });
    return 0.3; // and its echo down the wet street
  },
  brass: (a, k) => {
    fm(a, { f0: 2500 * k, f1: 230 * k, ratio: 1.5, index: 0.7, dur: 0.16, peak: 0.14 });
    hiss(a, { type: 'highpass', f0: 5200, dur: 0.03, peak: 0.06 });
    return 0.2;
  },
  koto: (a, k) => {
    tone(a, { type: 'triangle', f0: 1760 * k, f1: 1660 * k, dur: 0.16, peak: 0.16 });
    hiss(a, { type: 'bandpass', f0: 6500, f1: 2400, q: 2, dur: 0.09, peak: 0.16 });
    return 0.2;
  },
  hive: (a, k) => {
    hiss(a, { type: 'bandpass', f0: 650 * k, f1: 2600 * k, q: 6, dur: 0.09, peak: 0.62 });
    tone(a, { f0: 420 * k, f1: 960 * k, dur: 0.07, peak: 0.16 });
    return 0.12;
  },
  code: (a, k) => {
    tone(a, { type: 'square', f0: 880 * k, f1: 1760 * k, steps: 3, dur: 0.07, peak: 0.13, cut: 6000 });
    hiss(a, { type: 'highpass', f0: 7000, dur: 0.02, peak: 0.1 });
    return 0.1;
  },
  iron: (a, k) => {
    hiss(a, { type: 'highpass', f0: 2600, f1: 1100, dur: 0.05, peak: 0.12 });
    tone(a, { f0: 190 * k, f1: 52 * k, dur: 0.11, peak: 0.16 });
    tone(a, { type: 'sawtooth', f0: 900 * k, f1: 210 * k, dur: 0.06, peak: 0.06, cut: 3000 });
    return 0.14;
  },
  cosmic: (a, k) => {
    const o = tone(a, { f0: 1320 * k, f1: 620 * k, dur: 0.24, peak: 0.11 });
    wobble(a, o.frequency, 28, 36, a.t, 0.24);
    return 0.26;
  },
};

// Enemy fire by bullet pattern: quieter and lower than the ship's, in the world's own wave.
function enemy(a, o) {
  const { kit } = a;
  const k = kit.pitch * (o.boss ? 0.7 : 1);
  const w = { type: kit.wave, cut: Math.min(kit.cut, 3000), peak: 0.05 };
  switch (o.pattern) {
    case 'homing': wobble(a, tone(a, { ...w, f0: 330 * k, f1: 250 * k, dur: 0.32 }).frequency, 11, 25, a.t, 0.32); return 0.35;
    case 'shuriken':
      hiss(a, { type: 'bandpass', f0: 2600, f1: 900, q: 2.5, dur: 0.22, peak: 0.12, attack: 0.04 });
      fm(a, { f0: 2400, ratio: 1.41, index: 0.5, dur: 0.18, peak: 0.025 });
      return 0.3;
    case 'rain': tone(a, { f0: 1300 * k, f1: 420 * k, dur: 0.07, peak: 0.05 }); return 0.1;
    case 'ring': case 'fan':
      tone(a, { ...w, f0: 520 * k, f1: 190 * k, dur: 0.14 });
      tone(a, { ...w, f0: 780 * k, f1: 290 * k, dur: 0.12, peak: 0.03 });
      return 0.18;
    case 'spiral': tone(a, { ...w, f0: 300 * k, f1: 700 * k, dur: 0.1 }); return 0.13;
    default: tone(a, { ...w, f0: 620 * k, f1: 200 * k, dur: 0.12 }); return 0.15;
  }
}

export const FIGHT = {
  shot(a, o) {
    const p = o.power;
    if (p === 'rapid') a.out.gain.value *= 0.62;
    if (p === 'spread') hiss(a, { type: 'bandpass', f0: 900, f1: 3800, q: 1.4, dur: 0.12, peak: 0.08 });
    return SHOT[a.kit.style](a, a.kit.pitch * (p === 'spread' ? 0.84 : p === 'rapid' ? 1.19 : 1));
  },
  enemyShot: enemy,
  laserWarn(a) { // an enemy laser: a warning that climbs for LASER_WARN, then the beam burns
    tone(a, { type: 'sawtooth', f0: 200, f1: 900, dur: LASER_WARN, attack: LASER_WARN * 0.8, peak: 0.05, cut: 1600, cut1: 3200 });
    const t = a.t + LASER_WARN;
    hiss(a, { t, type: 'lowpass', f0: 4200, f1: 900, dur: LASER_BEAM, peak: 0.16 });
    tone(a, { t, type: 'sawtooth', f0: 110, f1: 92, dur: LASER_BEAM, peak: 0.07, dest: crush(a, 4) });
    return LASER_WARN + LASER_BEAM + 0.1;
  },
  hit(a, o) { // an alien hurt but standing: plates clank, the rest thud
    if (o.role === 'armored') fm(a, { f0: 540, ratio: 2.76, index: 2, dur: 0.13, peak: 0.08, cut: 5000 });
    else tone(a, { f0: 260, f1: 120, dur: 0.07, peak: 0.16 });
    hiss(a, { type: 'highpass', f0: 3800, dur: 0.03, peak: 0.08 });
    return 0.16;
  },
  kill,
  nearMiss(a) {
    hiss(a, { type: 'bandpass', f0: 3200, f1: 650, q: 2.4, attack: 0.06, dur: 0.22, peak: 0.12 });
    tone(a, { f0: 1250, f1: 700, attack: 0.05, dur: 0.18, peak: 0.02 });
    return 0.3;
  },
  shield(a) {
    fm(a, { f0: 1400, ratio: 3.5, index: 1.1, dur: 0.42, peak: 0.08 });
    tone(a, { f0: 170, f1: 90, dur: 0.2, peak: 0.16 });
    return 0.45;
  },
  shipHit(a, o) {
    hiss(a, { type: 'lowpass', f0: 5200, f1: 180, dur: 0.45, peak: 0.42 });
    tone(a, { type: 'sawtooth', f0: 520, f1: 55, dur: 0.5, peak: 0.16, cut: 2400, dest: crush(a, 3) });
    tone(a, { f0: 120, f1: 40, dur: 0.35, peak: 0.4 });
    if (o.lives > 0) [0, 1].forEach((i) => tone(a, { type: 'square', t: a.t + 0.32 + i * 0.13, f0: 880 - 220 * i, dur: 0.09, peak: 0.035, cut: 2600 }));
    return 0.7;
  },
  bunker(a, o) {
    hiss(a, { type: o.laser ? 'highpass' : 'bandpass', f0: o.laser ? 4000 : 1300, dur: 0.06, peak: 0.07 });
    return 0.1;
  },
};
