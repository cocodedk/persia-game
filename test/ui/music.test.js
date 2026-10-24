import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setMusic, updateMusic, startLoop, fillLoop, stopLoop } from '../../src/ui/music.js';
import { LOOK } from '../../src/ui/looks/index.js';
import { node } from './audio-kit.js';

// A stand-in AudioContext that records every node and its outgoing connections.
function fakeAudio() {
  const ctx = { currentTime: 0, nodes: [] };
  const make = (kind) => () => {
    const n = node({
      kind, out: new Set(), stopAt: null,
      connect(target) { this.out.add(target); return target; },
      disconnect() { this.out.clear(); },
      stop(t) { this.stopAt = t; },
    });
    ctx.nodes.push(n);
    return n;
  };
  for (const kind of ['Gain', 'BiquadFilter', 'Oscillator', 'Delay', 'BufferSource']) ctx[`create${kind}`] = make(kind);
  const music = make('MusicBus')();
  return { ctx, music, noise: {} };
}

test('a loop that ends disconnects every node it made and stops its sources', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const nodes = fakeAudio();
  const c = startLoop(nodes, LOOK);
  fillLoop(c, nodes.ctx.currentTime + 2);
  nodes.ctx.currentTime += 2;
  stopLoop(c);
  assert.ok(c.made.some((n) => n.out.size > 0), 'still sounding while it fades');
  t.mock.timers.tick(3000);
  assert.deepEqual(c.made.filter((n) => n.out.size > 0).map((n) => n.kind), []);
  assert.ok(c.sources.every((s) => s.stopAt !== null), 'every drone source stopped');
});

test('fifty changes between the music and silence leave at most one loop connected (R31)', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const nodes = fakeAudio();
  const intoMusic = () => nodes.ctx.nodes.filter((n) => n.out.has(nodes.music)).length;
  for (let i = 0; i < 50; i++) {
    setMusic(i % 2 ? null : LOOK);
    updateMusic(nodes);
    nodes.ctx.currentTime += 3;
    t.mock.timers.tick(3000);
    assert.equal(intoMusic(), i % 2 ? 0 : 1, i % 2 ? 'silence leaves nothing on the bus' : 'one loop feeds the bus');
  }
});
