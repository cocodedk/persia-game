// Difficulty belongs to the level, not to progress: world 8 is hard even when played first.

// 0 at world 1 level 1, 1 at world 8 level 5, in 39 equal steps.
export const difficulty = (world, index) => ((world - 1) * 5 + index - 1) / 39;

// What d does to the rules. fireMult multiplies ROLES[role].fire; formationSpeed multiplies a
// wave's own speed; armorBonus is extra hp for armored and gunner aliens.
export const scaled = (d) => ({
  bulletSpeed: 260 + 260 * d,
  fireMult: 0.6 + 1.0 * d,
  formationSpeed: 1 + 0.6 * d,
  armorBonus: d > 0.6 ? 1 : 0,
});
