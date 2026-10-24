// Stand-ins for the DOM under node. Install one before importing the module under test (with
// `await import(...)` after it), since the module may reach for `document` as it loads.
//   sink               a canvas context that takes any call or read and returns itself (0 as a number)
//   installCanvas(n)   document.createElement gives an n x n canvas whose context is sink
//   element(tag)       a stand-in element that keeps what is appended to it
//   installElements()  document.createElement gives such elements
export const sink = new Proxy(() => sink, { get: (f, k) => (k === Symbol.toPrimitive ? () => 0 : sink), apply: () => sink });

export function installCanvas(size = 1) {
  globalThis.document = {
    createElement: () => ({ width: size, height: size, getContext: () => sink }),
    addEventListener() {},
  };
}

export const element = (tag) => ({
  tag, className: '', children: [], textContent: '', style: {},
  classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
  append(...kids) { this.children.push(...kids); },
  addEventListener() {}, setAttribute() {}, focus() {},
});

export function installElements() {
  globalThis.document = { createElement: element, addEventListener() {}, activeElement: null, hidden: false };
}
