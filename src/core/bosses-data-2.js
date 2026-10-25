import { boss, weak, armor, atk, minion, phase } from './bosses-kit.js';

// Level 7's giant horse, face on: each pointed ear and the forelock between them are its plates; the
// wide-set eyes and the muzzle with its flared nostrils burn, and the horses pour from the muzzle. A
// rabbit leaves the forelock in every phase. Its phases, attacks and rates are the dog's, unchanged.
export const giantHorse = boss('giant-horse', 'Giant Horse', 'horse', 270, { w: 640, h: 300 }, [
  armor('earL', -80, -115, 60, 70, 6),
  armor('earR', 80, -115, 60, 70, 6),
  armor('forelock', 0, -75, 60, 70, 8),
  weak('eyeL', -92, -10, 80, 60, 44),
  weak('eyeR', 92, -10, 80, 60, 44),
  weak('mouth', 0, 100, 120, 80, 70),
], [
  phase(0.65, 'sway', [
    atk('aimed', 2, 'mouth', { speed: 0.9 }),
    atk('fan', 4.4, 'eyeL', { count: 3, spread: 0.5 }),
    atk('fan', 4.4, 'eyeR', { count: 3, spread: 0.5 }),
  ], { minions: [minion('horse', 1, 10, 'mouth'), minion('rabbit', 1, 12, 'forelock')] }),
  phase(0.3, 'sway', [
    atk('fan', 3, 'mouth', { count: 5, spread: 0.8 }),
    atk('aimed', 2.4, 'eyeL'),
    atk('aimed', 2.4, 'eyeR'),
  ], { rate: 1.3, minions: [minion('horse', 2, 9, 'mouth'), minion('rabbit', 1, 12, 'forelock')] }),
  phase(0, 'charge', [
    atk('ring', 4.2, 'mouth', { count: 14, speed: 0.85 }),
    atk('fan', 3, 'eyeL', { count: 5, spread: 0.8 }),
    atk('fan', 3, 'eyeR', { count: 5, spread: 0.8 }),
    atk('laser', 8, 'mouth'),
  ], { rate: 1.5, minions: [minion('horse', 2, 8, 'mouth'), minion('rabbit', 1, 12, 'forelock')] }),
]);
