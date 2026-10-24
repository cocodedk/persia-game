// Persia's night: a blood-red moon low over violet mountains, a ridge of crooked pines, a black
// ground with an amber line, stars and a CRT's scanlines; brass in a Persian mode. Data only (the
// shape is described in looks/index.js).
export default {
  sky: [[0, '#05030f'], [0.5, '#120a2e'], [0.82, '#3a1240'], [1, '#6a1e3a']],
  body: 'redmoon',
  haze: '#5a2a6a',
  layers: [
    { kind: 'mountains', color: '#1e1236', height: 400, speed: 0.06, roughness: 0.75 },
    { kind: 'pines', color: '#0d0716', height: 270, speed: 0.22, roughness: 0.55 },
    { kind: 'ground', color: '#05030a', height: 70, speed: 0.6, roughness: 0, line: '#ffb03a', rim: '#ffb03a', haze: 0 },
  ],
  ambient: [
    { kind: 'twinkle', phase: 'sky', n: 60, colors: ['#ffffff', '#ffe0b8', '#c8b8ff'], alpha: 1 },
    { kind: 'scanlines', phase: 'screen', alpha: 0.5 },
  ],
  flourish: ['shooting'],
  palette: {
    accent: '#ffb03a', shot: '#c8ffe0', beam: '#5dff8a', enemy: '#ff5ad8', enemyRim: '#1a0420',
    alien: { dog: '#e8d0a8', cat: '#ff9a3a', bird: '#3affc8', fish: '#5ab8ff', horse: '#c88a5a', cow: '#f4f4f4', rabbit: '#ff7ac8' },
    boss: { hull: '#2a1430', plate: '#ff9a3a', weak: '#ffe14a' },
  },
  bullet: 'pixel',
  power: { spread: '#ffd23a', laser: '#ff5ad8', rapid: '#3affc8', shield: '#7aa8ff', bomb: '#ff6a3a' },
  music: { mood: 'desert brass', root: 'D', scale: 'homayoun', bpm: 112 },
};
