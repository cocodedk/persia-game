// A failed level: SHOT DOWN, how far the run got, and Retry / Title.
//   failedScreen({ label, score, progress }, { retry, title }) -> screen
import { h, button, shell, armed, endKeys } from './dom.js';
import { fmt } from '../format.js';

const SETTLE = 1100; // ms the fire key and held-key repeats are ignored once the card is up

export function failedScreen(o, act) {
  const ready = armed();
  const go = (fn) => () => ready() && fn();
  const el = shell('results dim lost');
  const items = [button('Retry', go(act.retry), 'btn btn-big'), button('Title', go(act.title), 'btn btn-big')];
  el.append(
    h('div', 'banner',
      h('p', 'banner-kicker', o.label),
      h('h2', 'banner-title', 'Shot down'),
      h('p', 'result-line', h('span', 'result-cap', 'Score'), h('span', 'result-score', fmt(o.score))),
      h('p', 'result-best', o.progress)),
    h('nav', 'menu menu-row', ...items));
  return { el, focus: items[0], onKey: endKeys(items, ready, armed(SETTLE)) };
}
