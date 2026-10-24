// Title: the logo over a live autopilot battle, and the main menu.
//   titleScreen({ items: [{ label, pick }], nowShowing }) -> screen
// items is the menu in order (Play, then the later levels); nowShowing names the backdrop's level.
import { h, button, navigate, shell } from './dom.js';
import { play } from '../audio.js';

export function titleScreen({ items, nowShowing }) {
  const el = shell('title');
  const word = 'PERSIA';
  const logo = h('h1', 'logo',
    h('span', 'logo-glow', word), h('span', 'logo-chroma c1', word), h('span', 'logo-chroma c2', word),
    h('span', 'logo-text', word), h('span', 'logo-shine', word));
  const buttons = items.map((it) => button(it.label, () => { play('select'); it.pick(); }, 'btn btn-big'));
  const menu = h('nav', 'menu', ...buttons);
  const hint = h('p', 'hint', 'Enter play · M sound');
  const now = nowShowing ? h('p', 'now-showing', h('span', null, 'Now showing'), ` ${nowShowing}`) : null;
  el.append(h('div', 'title-stack', logo, menu), now, hint);
  return { el, focus: buttons[0], onKey: (code) => navigate(buttons, code) };
}
