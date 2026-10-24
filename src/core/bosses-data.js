import { boss, weak, armor, atk, minion, phase } from './bosses-kit.js';

// The boss: a giant angry cat head. Its parts are where the picture needs them: the brow plate
// carrying the ears on top, a paw reaching out at each side, and the weak points underneath, two
// eyes and the mouth. The layout keeps a clear column to some weak part from below at every moment
// of the fight (the boss tests check it tick by tick), and when the last weak part falls the plates
// crack open to be shot at full strength (boss-phase.js), so there is always something to aim at.

const giant = boss('giant', 'Giant', 'cat', 240, { w: 640, h: 220 }, [
  armor('brow', 0, -60, 240, 80, 8),
  armor('pawL', -240, 10, 150, 70, 6),
  armor('pawR', 240, 10, 150, 70, 6),
  weak('eyeL', -110, 50, 80, 60, 44),
  weak('eyeR', 110, 50, 80, 60, 44),
  weak('mouth', 0, 70, 90, 70, 70),
], [
  phase(0.65, 'sway', [
    atk('aimed', 2.2, 'mouth', { speed: 0.8 }),
    atk('fan', 4.2, 'eyeL', { count: 3, spread: 0.6 }),
    atk('fan', 4.2, 'eyeR', { count: 3, spread: 0.6 }),
  ]),
  phase(0.3, 'sway', [
    atk('fan', 3.2, 'mouth', { count: 5, spread: 0.9 }),
    atk('ring', 6, 'mouth', { count: 12 }),
    atk('aimed', 2.6, 'eyeL'),
    atk('aimed', 2.6, 'eyeR'),
  ], { rate: 1.2, minions: [minion('cat', 3, 10, 'mouth')] }),
  phase(0, 'charge', [
    atk('ring', 4.5, 'mouth', { count: 16, speed: 0.8 }),
    atk('fan', 3, 'eyeL', { count: 5, spread: 0.8 }),
    atk('fan', 3, 'eyeR', { count: 5, spread: 0.8 }),
    atk('laser', 8, 'mouth'),
  ], { rate: 1.4, minions: [minion('cat', 3, 9, 'mouth'), minion('rabbit', 1, 16, 'brow')] }),
]);

// Level 2's boss: a giant mouse head. Its great round ears and the snout between its eyes are
// armour; the eyes and the buck-toothed mouth are weak, and the mouth keeps pouring out mice.
const giantMouse = boss('giant-mouse', 'Giant Mouse', 'mouse', 240, { w: 600, h: 290 }, [
  armor('earL', -200, -75, 150, 130, 6),
  armor('earR', 200, -75, 150, 130, 6),
  armor('snout', 0, 45, 110, 60, 8),
  weak('eyeL', -95, 0, 80, 60, 44),
  weak('eyeR', 95, 0, 80, 60, 44),
  weak('mouth', 0, 100, 90, 70, 70),
], [
  phase(0.65, 'sway', [
    atk('aimed', 2, 'mouth', { speed: 0.9 }),
    atk('fan', 4.4, 'eyeL', { count: 3, spread: 0.5 }),
    atk('fan', 4.4, 'eyeR', { count: 3, spread: 0.5 }),
  ], { minions: [minion('mouse', 2, 9, 'mouth')] }),
  phase(0.3, 'sway', [
    atk('fan', 3, 'mouth', { count: 5, spread: 0.8 }),
    atk('aimed', 2.4, 'eyeL'),
    atk('aimed', 2.4, 'eyeR'),
  ], { rate: 1.3, minions: [minion('mouse', 4, 8, 'mouth')] }),
  phase(0, 'charge', [
    atk('ring', 4.2, 'mouth', { count: 14, speed: 0.85 }),
    atk('fan', 3, 'eyeL', { count: 5, spread: 0.8 }),
    atk('fan', 3, 'eyeR', { count: 5, spread: 0.8 }),
    atk('laser', 8, 'mouth'),
  ], { rate: 1.5, minions: [minion('mouse', 5, 7, 'mouth'), minion('rabbit', 1, 15, 'snout')] }),
]);

// The giant fish, face on: the dorsal crest on top and a pectoral fin spread at each side are its
// plates; the round eyes and the pouting mouth burn, and the fish pour from the mouth.
const giantFish = boss('giant-fish', 'Giant Fish', 'fish', 270, { w: 640, h: 300 }, [
  armor('crest', 0, -115, 220, 70, 8),
  armor('finL', -250, 20, 140, 110, 6),
  armor('finR', 250, 20, 140, 110, 6),
  weak('eyeL', -110, -10, 80, 60, 44),
  weak('eyeR', 110, -10, 80, 60, 44),
  weak('mouth', 0, 85, 120, 70, 70),
], [
  phase(0.65, 'sway', [
    atk('aimed', 2, 'mouth', { speed: 0.9 }),
    atk('fan', 4.4, 'eyeL', { count: 3, spread: 0.5 }),
    atk('fan', 4.4, 'eyeR', { count: 3, spread: 0.5 }),
  ], { minions: [minion('fish', 1, 10, 'mouth')] }),
  phase(0.3, 'sway', [
    atk('fan', 3, 'mouth', { count: 5, spread: 0.8 }),
    atk('aimed', 2.4, 'eyeL'),
    atk('aimed', 2.4, 'eyeR'),
  ], { rate: 1.3, minions: [minion('fish', 2, 9, 'mouth')] }),
  phase(0, 'charge', [
    atk('ring', 4.2, 'mouth', { count: 14, speed: 0.85 }),
    atk('fan', 3, 'eyeL', { count: 5, spread: 0.8 }),
    atk('fan', 3, 'eyeR', { count: 5, spread: 0.8 }),
    atk('laser', 8, 'mouth'),
  ], { rate: 1.5, minions: [minion('fish', 2, 8, 'mouth'), minion('rabbit', 1, 15, 'crest')] }),
]);

export const BOSS_DEFS = [giant, giantMouse, giantFish];

const BY_KIND = new Map(BOSS_DEFS.map((d) => [d.kind, d]));

// The static definition of a boss kind (the world keeps only the kind and the live part state).
export const bossDef = (kind) => BY_KIND.get(kind);
