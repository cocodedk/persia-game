// A failed level: SHOT DOWN, how far the run got (the wave, or what the giant had left), and
// Retry / Title.
//   failedScreen({ label, score, world }, { retry, title }) -> screen
import { h, button, shell, armed, endKeys } from './dom.js';
import { fmt } from '../format.js';
import { bossDef } from '../../core/bosses-data.js';

const SETTLE = 1100; // ms the fire key and held-key repeats are ignored once the card is up

function progress(world) {
  const b = world.boss;
  if (b) return `The ${bossDef(b.kind).name.toLowerCase()} held at ${Math.ceil((100 * b.hp) / b.maxHp)} %`;
  return `Wave ${world.wave} of ${world.level.waves.length}`;
}

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
      h('p', 'result-best', progress(o.world))),
    h('nav', 'menu menu-row', ...items));
  return { el, focus: items[0], onKey: endKeys(items, ready, armed(SETTLE)) };
}
