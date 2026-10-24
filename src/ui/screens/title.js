// Title: the logo over a live autopilot battle in a random world, and the main menu.
//   titleScreen({ items: [{ label, pick }], nowShowing }) -> screen
// items is the menu in order (Play); nowShowing names the backdrop's world.
import { h, button, navigate, shell } from './dom.js';
import { play } from '../audio.js';
import { LEVELS, WORLDS } from '../../core/levels.js';

export function titleScreen({ items, nowShowing }) {
  const el = shell('title');
  const word = 'PERSIA';
  const logo = h('h1', 'logo',
    h('span', 'logo-glow', word), h('span', 'logo-chroma c1', word), h('span', 'logo-chroma c2', word),
    h('span', 'logo-text', word), h('span', 'logo-shine', word));
  const tag = h('p', 'tagline', `${WORLDS.length} worlds · ${LEVELS.length} levels · one pilot`);
  const buttons = items.map((it) => button(it.label, () => { play('select'); it.pick(); }, 'btn btn-big'));
  const menu = h('nav', 'menu', ...buttons);
  const hint = h('p', 'hint', '↑ ↓ choose · Enter select · M sound');
  const now = nowShowing ? h('p', 'now-showing', h('span', null, 'Now showing'), ` ${nowShowing}`) : null;
  el.append(h('div', 'title-stack', logo, tag, menu), now, hint);
  return { el, focus: buttons[0], onKey: (code) => navigate(buttons, code) };
}
