// Stand-ins for the DOM under node. Install one before importing the module under test (with
// `await import(...)` after it), since the module may reach for `document` as it loads.
//   sink               a canvas context that takes any call or read and returns itself (0 as a number)
//   installCanvas(n)   document.createElement gives an n x n canvas whose context is sink
//   element(tag)       a stand-in element that keeps what is appended to it, and its click handler
//                      as onClick
//   installElements()  document.createElement gives such elements
//   FRAMES             uneven frame lengths (s), as a real frame clock gives
//   walkFrames(end, onFrame, frames = FRAMES)   steps a clock from 0 to `end` in frames cycling through
//                      `frames`, calling onFrame(t0, t1) for each
export const sink = new Proxy(() => sink, { get: (f, k) => (k === Symbol.toPrimitive ? () => 0 : sink), apply: () => sink });

export function installCanvas(size = 1) {
  globalThis.document = {
    createElement: () => ({ width: size, height: size, getContext: () => sink }),
    addEventListener() {},
  };
}

export const element = (tag) => ({
  tag, className: '', children: [], textContent: '', style: { setProperty(k, v) { this[k] = v; } },
  classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
  append(...kids) { this.children.push(...kids); },
  addEventListener(type, fn) { if (type === 'click') this.onClick = fn; },
  setAttribute() {}, focus() {},
});

export function installElements() {
  globalThis.document = { createElement: element, addEventListener() {}, activeElement: null, hidden: false };
}

export const FRAMES = [0.016, 0.1, 0.033, 0.0071, 0.067];

export function walkFrames(end, onFrame, frames = FRAMES) {
  let t = 0;
  for (let k = 0; t < end; k++) {
    const t1 = t + frames[k % frames.length];
    onFrame(t, t1);
    t = t1;
  }
}
