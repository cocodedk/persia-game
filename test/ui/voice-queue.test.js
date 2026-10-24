import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PACK } from '../../src/data/pack.js';
import { LINE_GAP, voiceLines, clipOf, createQueue, enqueue, stepQueue } from '../../src/ui/voice-queue.js';

const wave = (n, ...species) => ({ type: 'wave', wave: n, species });

// Every line that starts while the queue is stepped `secs` seconds in steps of `dt`.
function drain(q, secs, dt = 1 / 60) {
  const said = [];
  for (let t = 0; t < secs; t += dt) {
    const line = stepQueue(q, dt, PACK);
    if (line) said.push(line);
  }
  return said;
}

test('a wave event says its number, then its species; a boss event says its species', () => {
  assert.deepEqual(voiceLines([{ type: 'wave', wave: 3, species: ['bird', 'cat'] }, { type: 'kill' }]),
    [{ kind: 'number', n: 3 }, { kind: 'species', id: 'bird' }, { kind: 'species', id: 'cat' }]);
  assert.deepEqual(voiceLines([{ type: 'boss', kind: 'giant', species: 'cat' }]), [{ kind: 'species', id: 'cat' }]);
});

test('clipOf gives every line its pack entry: clip, length, what is shown and its Latin name', () => {
  assert.equal(clipOf(PACK, { kind: 'number', n: 1 }), PACK.numbers[0]);
  assert.equal(clipOf(PACK, { kind: 'species', id: 'dog' }), PACK.species.find((s) => s.id === 'dog'));
});

test('lines start one after another, each clip length plus LINE_GAP apart', () => {
  const q = createQueue();
  enqueue(q, voiceLines([wave(1, 'dog')]));
  assert.deepEqual(stepQueue(q, 0, PACK), { kind: 'number', n: 1 });
  const next = PACK.numbers[0].ms / 1000 + LINE_GAP;
  assert.ok(Math.abs(next - 0.91) < 1e-9, 'number 1 (760 ms) holds the queue 0.91 s');
  assert.equal(stepQueue(q, next - 0.002, PACK), null, 'nothing in between');
  assert.deepEqual(stepQueue(q, 0.004, PACK), { kind: 'species', id: 'dog' });
  assert.deepEqual(drain(q, 5), [], 'and then nothing');
});

test('new lines replace the unstarted backlog', () => {
  const q = createQueue();
  enqueue(q, voiceLines([wave(4, 'cat', 'horse')]));
  stepQueue(q, 0, PACK); // four starts; the cat and the horse wait
  const wait = q.wait;
  enqueue(q, voiceLines([wave(5, 'fish')])); // wave 4 died before its lines were said
  assert.equal(q.wait, wait, 'the line already playing keeps its time');
  assert.deepEqual(drain(q, 5), [{ kind: 'number', n: 5 }, { kind: 'species', id: 'fish' }]);
});

test('the queue waits while it is not stepped', () => {
  const q = createQueue();
  enqueue(q, voiceLines([wave(1, 'dog')]));
  stepQueue(q, 0, PACK); // one starts, then the pause menu goes up and nothing steps for a while
  let stepped = 0;
  let line = null;
  while (!line && stepped < 5) {
    line = stepQueue(q, 0.05, PACK);
    stepped += 0.05;
  }
  assert.deepEqual(line, { kind: 'species', id: 'dog' });
  assert.ok(stepped > 0.9 && stepped < 0.96, `the dog waited for 0.91 s of stepped time, not ${stepped}`);
});
