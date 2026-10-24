// Every sound patch by name (audio.js play(name)): the fight, power-ups and the bomb, the bosses and
// big blasts, bullet time, and the stingers and menus.
import { FIGHT } from './sfx-fight.js';
import { POWER } from './sfx-power.js';
import { BOSS } from './sfx-boss.js';
import { WORLD } from './sfx-world.js';
import { UI } from './sfx-ui.js';

export const SFX = { ...FIGHT, ...POWER, ...BOSS, ...WORLD, ...UI };
