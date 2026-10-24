// The title card while a level's art bakes: a film's opening card in the look's sky colours,
// "WORLD 1 · REEL 1" and the world's name.
import { h, shell, skyCss } from './dom.js';
import { reelName, worldName } from '../../core/levels.js';
import { LOOK } from '../looks/index.js';

export function cardScreen(level) {
  const el = shell('card');
  el.style.background = skyCss(LOOK);
  el.style.setProperty('--accent', LOOK.palette.accent);
  el.append(h('div', 'card-body',
    h('p', 'card-kicker', `World ${level.world} · ${reelName(level)}`),
    h('h2', 'card-name', worldName(level)),
    h('div', 'card-bar', h('span'))));
  return { el, onKey: () => true };
}
