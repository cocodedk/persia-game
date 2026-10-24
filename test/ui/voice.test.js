import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PACK } from '../../src/data/pack.js';
import { createVoice } from '../../src/ui/voice.js';
import { installAudio, node } from './audio-kit.js';

const species = (id) => PACK.species.find((s) => s.id === id);
const number = (n) => PACK.numbers.find((x) => x.n === n);
const settle = () => new Promise((r) => setTimeout(r, 0)); // every pending fetch and decode resolves
const bytes = (url) => Promise.resolve({ ok: true, arrayBuffer: async () => ({ url }) });

// A voice whose decode tags each buffer with its clip, over a fake context (audio-kit.js) whose
// buffer sources record what they play, where to, and whether they were stopped.
function rig({ audio = true, fetch = bytes, decode = async (b) => ({ clip: b.url }) } = {}) {
  const started = [];
  installAudio({
    onNode(kind, n) {
      if (kind !== 'BufferSource') return;
      n.connect = (to) => { n.to = to; return to; };
      n.start = () => started.push(n);
      n.stop = () => { n.stopped = true; };
    },
  });
  const ctx = new globalThis.AudioContext();
  const bus = node();
  const ducks = [];
  const shown = [];
  const r = { started, ducks, shown, bus, hidden: 0, audio };
  r.voice = createVoice(PACK, {
    nodes: () => (r.audio ? { ctx, voice: bus } : null), duck: (level) => ducks.push(level), fetch, decode,
    show: (entry) => { shown.push(entry.word); r.said = entry; }, hide: () => { r.hidden += 1; },
  });
  return r;
}

test('with no audio nodes the word still shows on schedule', async () => {
  const r = rig({ audio: false }); // no gesture yet, or muted
  await settle();
  r.voice.hear([{ type: 'wave', wave: 1, species: ['dog'] }]);
  r.voice.update(0); // one, unheard
  assert.deepEqual(r.shown, [number(1).word]);
  assert.equal(r.said, number(1), 'the whole pack entry: its word, Latin name and length');
  r.voice.hear([{ type: 'kill' }]); // a tick with nothing to say keeps the backlog
  r.voice.update(0.9);
  assert.deepEqual(r.shown, [number(1).word]);
  r.voice.update(0.02);
  assert.deepEqual(r.shown, [number(1).word, species('dog').word]);
  assert.equal(r.said, species('dog'), 'and for a species its id, so its face shows too');
  assert.deepEqual(r.ducks, [], 'nothing played, so nothing ducked');
});

test('a rejected fetch is silent, does not throw, and still shows the word', async () => {
  const r = rig({ fetch: () => Promise.reject(new TypeError('Failed to fetch')) });
  await settle();
  r.voice.hear([{ type: 'boss', kind: 'giant', species: 'cat' }]);
  assert.doesNotThrow(() => r.voice.update(0));
  assert.deepEqual(r.shown, [species('cat').word]);
  assert.equal(r.started.length, 0);
  assert.deepEqual(r.ducks, []);
});

test('a line whose clip is not decoded yet is skipped, not played late', async () => {
  const pending = [];
  const r = rig({ decode: (b) => new Promise((done) => pending.push(() => done({ clip: b.url }))) });
  await settle(); // fetched, still decoding
  r.voice.hear([{ type: 'wave', wave: 1, species: ['dog'] }]);
  r.voice.update(0); // one starts before its clip is decoded
  assert.equal(r.started.length, 0);
  for (const done of pending) done();
  await settle();
  r.voice.update(0.5);
  assert.equal(r.started.length, 0, 'one is not played late');
  r.voice.update(0.42);
  assert.deepEqual(r.started.map((s) => s.buffer.clip), [species('dog').clip]);
});

test('a decoded clip plays on the voice bus and ducks to 0.45, then lifts after its ms', async () => {
  const r = rig();
  await settle();
  r.voice.hear([{ type: 'boss', kind: 'giant', species: 'cat' }]);
  r.voice.update(0);
  assert.equal(r.started.length, 1);
  assert.equal(r.started[0].buffer.clip, species('cat').clip);
  assert.equal(r.started[0].to, r.bus);
  assert.deepEqual(r.ducks, [0.45]);
  r.voice.update(species('cat').ms / 1000 - 0.01);
  assert.deepEqual(r.ducks, [0.45]);
  r.voice.update(0.02);
  assert.deepEqual(r.ducks, [0.45, 1]);
});

test('clear() drops the queue, hides the word and lifts the duck', async () => {
  const r = rig();
  await settle();
  r.voice.hear([{ type: 'wave', wave: 2, species: ['cow', 'rabbit'] }]);
  r.voice.update(0); // two plays
  r.voice.clear(); // Restart, mid-line
  assert.equal(r.started[0].stopped, true);
  assert.equal(r.hidden, 1);
  assert.deepEqual(r.ducks, [0.45, 1]);
  r.voice.update(5);
  assert.deepEqual(r.shown, [number(2).word], 'two was shown as it was said; the cow and the rabbit never are');
  assert.equal(r.started.length, 1);
  assert.deepEqual(r.ducks, [0.45, 1], 'and the old line does not lift the duck again');
});
