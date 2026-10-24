// Each world's sound, from its look's music entry { mood, root, scale, bpm } (looks/w1..w8.js).
// Pure data and maths, shared by the sound effects (one flavour per world) and the music loop.
//   kitFor(music) -> { style, root, scale, bpm, wave, cut, wet, pitch }
//     style  which signature the patches use: chip noir brass koto hive code iron cosmic
//     root   semitone of the root above C; scale: semitone steps of the scale
//     wave   the oscillator most of the world's tones use; cut: their lowpass ceiling (Hz);
//     wet    how much reverb (0..1); pitch: a multiplier on the patches' base pitches
//   STYLES[style].music: the loop's voices (music.js)
//     vol: the loop's level, trimmed so every world's loop measures about -36 dBFS RMS offline
//     drone: { wave, oct, cut, fifth }   lead: { wave, oct, cut, len (of a step), gain }
//     div: steps per beat, seq: scale degrees per step (null rests), drum: per-step hit letters
//     (k kick, t taiko, h hat, s snare-ish noise, . rest), bars: how many bars before the seq shifts
export const NOTES = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };

export const SCALES = {
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  in: [0, 1, 5, 7, 8], // the Japanese in scale
};

export const STYLES = {
  chip: {
    mood: 'chiptune march', wave: 'square', cut: 9000, wet: 0.1, pitch: 1,
    music: { vol: 1, drone: { wave: 'triangle', oct: 2, cut: 900, fifth: false }, lead: { wave: 'square', oct: 5, cut: 4200, len: 0.45, gain: 0.07 },
      div: 2, seq: [0, 2, 4, 7, 4, 2, 0, 4, 1, 3, 5, 8, 5, 3, 1, 5], drum: 'k.h.k.h.k.h.kkh.' },
  },
  noir: {
    mood: 'noir synth pads', wave: 'sawtooth', cut: 2600, wet: 0.4, pitch: 0.9,
    music: { vol: 1, drone: { wave: 'sawtooth', oct: 2, cut: 380, fifth: true }, lead: { wave: 'sawtooth', oct: 4, cut: 1500, len: 1.6, gain: 0.06 },
      div: 1, seq: [0, null, 2, null, 4, null, 1, null], drum: 'k...s...' },
  },
  brass: {
    mood: 'desert brass', wave: 'sawtooth', cut: 3600, wet: 0.22, pitch: 1,
    music: { vol: 0.8, drone: { wave: 'sawtooth', oct: 2, cut: 500, fifth: true }, lead: { wave: 'sawtooth', oct: 4, cut: 2200, len: 0.7, gain: 0.06 },
      div: 2, seq: [0, null, 4, 3, 4, null, 2, 1, 0, null, 4, 6, 7, null, 4, null], drum: 't...t.t.t...t.tt' },
  },
  koto: {
    mood: 'koto and taiko', wave: 'triangle', cut: 5200, wet: 0.32, pitch: 1.05,
    music: { vol: 0.6, drone: { wave: 'sine', oct: 2, cut: 600, fifth: true }, lead: { wave: 'triangle', oct: 5, cut: 5000, len: 0.35, gain: 0.08 },
      div: 2, seq: [0, 2, 4, null, 3, 2, 1, null, 0, 1, 2, 4, 5, null, null, null], drum: 't.......t..t....' },
  },
  hive: {
    mood: 'dread drones', wave: 'sine', cut: 1700, wet: 0.5, pitch: 0.75,
    music: { vol: 1.3, drone: { wave: 'sawtooth', oct: 1, cut: 220, fifth: false }, lead: { wave: 'sine', oct: 5, cut: 2000, len: 2.2, gain: 0.05 },
      div: 1, seq: [0, null, null, 1, null, null, null, 4, null, null, 3, null, null, null, null, null], drum: 'k...............' },
  },
  code: {
    mood: 'minimal techno', wave: 'square', cut: 6500, wet: 0.16, pitch: 1.1,
    music: { vol: 0.7, drone: { wave: 'square', oct: 2, cut: 300, fifth: false }, lead: { wave: 'square', oct: 5, cut: 2400, len: 0.3, gain: 0.05 },
      div: 4, seq: [0, null, 0, 7, null, 3, null, 0, 5, null, 0, 7, null, 3, 2, null], drum: 'k.h.k.h.k.h.k.hh' },
  },
  iron: {
    mood: 'industrial pulse', wave: 'sawtooth', cut: 3000, wet: 0.24, pitch: 0.85,
    music: { vol: 0.6, drone: { wave: 'square', oct: 1, cut: 260, fifth: true }, lead: { wave: 'square', oct: 3, cut: 900, len: 0.4, gain: 0.07 },
      div: 4, seq: [0, 0, null, 0, 4, null, 0, null, 0, 0, null, 0, 3, null, 1, null], drum: 'k..sk.s.k..sk.ss' },
  },
  cosmic: {
    mood: 'organ swell', wave: 'sine', cut: 4200, wet: 0.6, pitch: 0.95,
    music: { vol: 0.6, drone: { wave: 'sine', oct: 2, cut: 1200, fifth: true }, lead: { wave: 'sine', oct: 5, cut: 3000, len: 3.2, gain: 0.07 },
      div: 0.5, seq: [0, 2, 4, 6, 4, 2, 7, 4], drum: '........' },
  },
};

const BY_MOOD = Object.fromEntries(Object.entries(STYLES).map(([style, s]) => [s.mood, style]));

export function kitFor(music = {}) {
  const style = BY_MOOD[music.mood] ?? 'chip';
  const s = STYLES[style];
  return {
    style, root: NOTES[music.root] ?? 4, scale: SCALES[music.scale] ?? SCALES.minor, bpm: music.bpm || 100,
    wave: s.wave, cut: s.cut, wet: s.wet, pitch: s.pitch,
  };
}

// The MIDI note of a scale degree (0 = the root) in an octave (4 = the octave from middle C).
export function degreeMidi(kit, degree, octave) {
  const n = kit.scale.length;
  const oct = Math.floor(degree / n);
  return 12 * (octave + 1 + oct) + kit.root + kit.scale[((degree % n) + n) % n];
}

export const midiHz = (m) => 440 * 2 ** ((m - 69) / 12);
