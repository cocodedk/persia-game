// The word moment: a species' word, large over the play for about a second as it is said, each
// letter its own colour from the pack's palette. A DOM overlay, never canvas text, so the letters
// stay joined: one plain inline span per letter, which the browser shapes as one word. Beside it, the
// name in Latin letters for as long as it is said (ms).
//   letterRuns(word, colours) -> [{ text, colour }]   one run per letter; a ZWNJ stays with the letter before it
//   createWordMoment(root, canvas, pack) -> { show(word, say, ms), hide() }   word.css times it
// It is placed on the world as drawn: the canvas box holds the 1920 x 1080 world letterboxed (view.js).
import { WIDTH, HEIGHT } from '../core/kinds.js';
import { h } from './screens/dom.js';

const ZWNJ = '\u200c';
const MIDDLE = 0.34; // the word's middle, as a share of the world's height from its top
const SIZE = 0.15; // the font size, as a share of the world's height

export function letterRuns(word, colours) {
  const runs = [];
  for (const ch of word) {
    if (ch === ZWNJ && runs.length) runs[runs.length - 1].text += ch;
    else runs.push({ text: ch, colour: colours[runs.length % colours.length] });
  }
  return runs;
}

export function createWordMoment(root, canvas, pack) {
  const { family, file, weight } = pack.font;
  const face = new FontFace(family, `url("${file}")`, { weight });
  document.fonts.add(face);
  face.load().catch(() => {}); // ready before the first word; a face that fails falls back
  const el = h('div', 'word-moment');
  el.lang = pack.lang;
  el.dir = pack.dir;
  el.style.fontFamily = `"${family}", sans-serif`;
  el.style.fontWeight = weight;
  root.append(el);

  return {
    show(word, say, ms) {
      el.replaceChildren(...letterRuns(word, pack.letterColours).map(({ text, colour }) => {
        const span = h('span', null, text);
        span.style.color = colour;
        return span;
      }), h('span', 'say', say));
      el.style.setProperty('--said', `${ms}ms`);
      const r = canvas.getBoundingClientRect();
      const worldH = Math.min(r.height, (r.width * HEIGHT) / WIDTH);
      el.style.left = `${r.left + r.width / 2}px`;
      el.style.top = `${r.top + (r.height - worldH) / 2 + MIDDLE * worldH}px`;
      el.style.fontSize = `${SIZE * worldH}px`;
      el.classList.remove('show');
      void el.offsetWidth; // commit the restart so the animation runs again
      el.classList.add('show');
    },
    hide() {
      el.classList.remove('show');
    },
  };
}
