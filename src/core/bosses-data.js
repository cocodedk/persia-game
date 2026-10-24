import { boss, weak, armor, atk, minion, phase } from './bosses-kit.js';

// The boss. Its parts are where the picture needs them. The layout keeps a clear column to some weak
// part from below at every moment of the fight (the boss tests check it tick by tick), and when the
// last weak part falls the plates crack open to be shot at full strength (boss-phase.js), so there
// is always something to aim at.

const mothership = boss('mothership', 'Mothership', 240, { w: 640, h: 220 }, [
  armor('dome', 0, -60, 240, 80, 8),
  armor('wingL', -240, 10, 150, 70, 6),
  armor('wingR', 240, 10, 150, 70, 6),
  weak('gunL', -110, 50, 80, 60, 44),
  weak('gunR', 110, 50, 80, 60, 44),
  weak('eye', 0, 70, 90, 70, 70),
], [
  phase(0.65, 'sway', [
    atk('aimed', 2.2, 'eye', { speed: 0.8 }),
    atk('fan', 4.2, 'gunL', { count: 3, spread: 0.6 }),
    atk('fan', 4.2, 'gunR', { count: 3, spread: 0.6 }),
  ]),
  phase(0.3, 'sway', [
    atk('fan', 3.2, 'eye', { count: 5, spread: 0.9 }),
    atk('ring', 6, 'eye', { count: 12 }),
    atk('aimed', 2.6, 'gunL'),
    atk('aimed', 2.6, 'gunR'),
  ], { rate: 1.2, minions: [minion('grunt', 3, 10, 'eye')] }),
  phase(0, 'charge', [
    atk('ring', 4.5, 'eye', { count: 16, speed: 0.8 }),
    atk('fan', 3, 'gunL', { count: 5, spread: 0.8 }),
    atk('fan', 3, 'gunR', { count: 5, spread: 0.8 }),
    atk('laser', 8, 'eye'),
  ], { rate: 1.4, minions: [minion('grunt', 3, 9, 'eye'), minion('carrier', 1, 16, 'dome')] }),
]);

export const BOSS_DEFS = [mothership];

const BY_KIND = new Map(BOSS_DEFS.map((d) => [d.kind, d]));

// The static definition of a boss kind (the world keeps only the kind and the live part state).
export const bossDef = (kind) => BY_KIND.get(kind);
