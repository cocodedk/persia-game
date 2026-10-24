// One event carrying the fields the fx reactions and sounds read, so each sees a value where it looks.
// A field a reaction or sound starts reading gets added here, once; a test overrides by spreading.
export const sampleEvent = (type) => ({
  type, x: 500, y: 300, side: 'ship', power: null, pattern: 'aimed', role: 'grunt', mult: 3, size: 2,
  on: true, kind: 'spread', lives: 2, wind: 120, strength: 0.8, dir: 1, warn: 0.7, phase: 1, open: ['core'], last: false, nth: 0,
  score: 100, scored: true, points: 50, bonus: 500, dmg: 1, weak: false, laser: false, fromX: 400, fromY: 200, parts: [],
});
