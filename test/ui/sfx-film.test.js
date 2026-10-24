import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FILM } from '../../src/ui/sfx-film.js';
import { SFX } from '../../src/ui/sfx.js';
import { kitFor } from '../../src/ui/sound-data.js';
import { LOOKS } from '../../src/ui/looks/index.js';
import { node } from './audio-kit.js';

// A stand-in AudioContext: every node it makes, and whether each source was started and stopped.
function fakeVoice(kit) {
  const nodes = [];
  const make = (kind) => () => {
    const n = node({ kind, started: false, stopAt: null, curve: null, start() { this.started = true; }, stop(t) { this.stopAt = t; } });
    nodes.push(n);
    return n;
  };
  const ctx = {};
  for (const kind of ['Gain', 'BiquadFilter', 'Oscillator', 'BufferSource', 'WaveShaper']) ctx[`create${kind}`] = make(kind);
  return { a: { ctx, t: 1, out: make('Out')(), noise: {}, kit }, nodes };
}

test('every film sound builds in every world, is reachable by name, and stops every source it starts', () => {
  for (const name of Object.keys(FILM)) assert.equal(SFX[name], FILM[name], name);
  for (const look of LOOKS) {
    for (const [name, patch] of Object.entries(FILM)) {
      for (const n of [0, 1, 2]) {
        const { a, nodes } = fakeVoice(kitFor(look.music));
        const secs = patch(a, { n });
        assert.ok(secs > 0 && secs < 4, `${name}: ${secs}`);
        const sources = nodes.filter((x) => x.kind === 'Oscillator' || x.kind === 'BufferSource');
        assert.ok(sources.length > 0, name);
        for (const s of sources) assert.ok(s.started && s.stopAt > a.t && s.stopAt <= a.t + secs + 0.1, `${name}: a source left running`);
      }
    }
  }
});
