// The shared vocabulary: every name a level, a formation, a pattern or a world may use.

// fire = shots per second at difficulty 0.
export const ROLES = {
  grunt: { hp: 1, score: 100, fire: 0.08 },
  diver: { hp: 1, score: 150, fire: 0.05 },
  gunner: { hp: 2, score: 200, fire: 0.35 },
  armored: { hp: 3, score: 300, fire: 0.1 },
  carrier: { hp: 1, score: 250, fire: 0 },
};

export const FORMATIONS = ['grid', 'sway', 'dive', 'spiral', 'split', 'escort', 'rain', 'orbit'];
export const PATTERNS = ['aimed', 'fan', 'ring', 'spiral', 'laser', 'rain', 'homing', 'shuriken'];
export const POWERS = ['spread', 'laser', 'rapid', 'shield'];

// World order: WORLDS[i].twist is TWISTS[i] and WORLDS[i].boss is BOSSES[i].
export const TWISTS = ['bunkers', 'darkness', 'gusts', 'shuriken', 'acid', 'glitch', 'reassemble', 'gravity'];
export const BOSSES = ['mothership', 'pyramid', 'fortress', 'shogun', 'queen', 'agent', 'titan', 'singularity'];

// The playfield: a fixed 1920x1080 frame, y down. Its top is the HUD band, whose panels end at
// HUD_BOTTOM; nothing that must be seen or shot may sit behind them.
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const HUD_BOTTOM = 96;
export const MID_X = WIDTH / 2;
export const MID_Y = HEIGHT / 2;
export const EDGE = 20; // px: the closest an alien flies to either side

// The gravity world's well (a template: a world takes a copy, so it stays plain cloneable data).
export const WELL = { x: MID_X, y: 300 };

// Collision sizes shared by the collision code and by everything that must agree with it.
export const ALIEN_R = 26; // hit radius of an alien
export const NEAR_MISS = 28; // centre distance, for a standard 8 px bullet: 6 px outside the hit circle

// The fixed step of the simulation, in seconds: every stepWorld call in a game or a test.
export const TICK = 1 / 60;
