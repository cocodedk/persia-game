import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setMusic, updateMusic, startLoop, fillLoop, stopLoop } from '../../src/ui/music.js';
import { LOOKS } from '../../src/ui/looks/index.js';
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
  for (const look of LOOKS) {
    const c = startLoop(nodes, look);
    fillLoop(c, nodes.ctx.currentTime + 2);
    nodes.ctx.currentTime += 2;
    stopLoop(c);
    assert.ok(c.made.some((n) => n.out.size > 0), 'still sounding while it fades');
    t.mock.timers.tick(3000);
    assert.deepEqual(c.made.filter((n) => n.out.size > 0).map((n) => n.kind), [], `world ${look.world}`);
    assert.ok(c.sources.every((s) => s.stopAt !== null), 'every drone source stopped');
  }
});

test('fifty world changes leave one loop connected, the echo feedback included (R31)', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const nodes = fakeAudio();
  const wet = LOOKS.filter((l) => l.music.mood === 'noir synth pads' || l.music.mood === 'organ swell');
  assert.equal(wet.length, 2, 'two worlds have the echo');
  const live = (kind) => nodes.ctx.nodes.filter((n) => n.kind === kind && n.out.size > 0).length;
  const intoMusic = () => nodes.ctx.nodes.filter((n) => n.out.has(nodes.music)).length;
  const counts = [];
  for (let i = 0; i < 50; i++) {
    setMusic(wet[i % 2]); // echo worlds both ways: the worst case for the feedback loop
    updateMusic(nodes);
    nodes.ctx.currentTime += 3;
    t.mock.timers.tick(3000);
    counts.push([intoMusic(), live('Delay')]);
  }
  for (const [into, delays] of counts) {
    assert.equal(into, 1, 'one loop feeds the music bus');
    assert.equal(delays, 1, 'one echo is connected');
  }
  setMusic(null);
  updateMusic(nodes);
  t.mock.timers.tick(3000);
  assert.equal(intoMusic(), 0, 'silence leaves nothing connected to the bus');
  assert.equal(live('Delay'), 0);
});
