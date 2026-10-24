import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PACK } from '../../src/data/pack.js';
import { LINE_GAP, voiceLines, createQueue, enqueue, stepQueue, sayingOf } from '../../src/ui/voice-queue.js';
import { species, number } from './pack-kit.js';
import { createWorld } from '../../src/core/world.js';
import { LEVELS } from '../../src/core/levels.js';

const wave = (n, ...ids) => ({ type: 'wave', n, species: ids });
const lines = (events) => voiceLines(events, PACK);

// Every line that starts while the queue is stepped `secs` seconds in steps of `dt`.
function drain(q, secs, dt = 1 / 60) {
  const said = [];
  for (let t = 0; t < secs; t += dt) {
    const line = stepQueue(q, dt);
    if (line) said.push(line);
  }
  return said;
}

test('a wave event says its number, then its species; a boss event says its species', () => {
  const said = lines([wave(3, 'bird', 'cat'), { type: 'kill' }]);
  assert.equal(said.length, 3);
  assert.equal(said[0], number(3), 'each line is the pack entry itself: clip, length, word and Latin name');
  assert.equal(said[1], species('bird'));
  assert.equal(said[2], species('cat'));
  assert.deepEqual(lines([{ type: 'boss', kind: 'giant', species: 'cat' }]), [species('cat')]);
});

test('each later level\'s first wave counts on from the one before: six, eleven, sixteen', () => {
  for (const [i, n, ids] of [[1, 6, ['dog', 'mouse']], [2, 11, ['bird', 'fish']], [3, 16, ['bird', 'horse']]]) {
    assert.deepEqual(lines(createWorld(LEVELS[i]).events), [number(n), ...ids.map(species)], LEVELS[i].id);
  }
});

test("level 4's third wave says eighteen, its species, then the rain", () => {
  const said = lines([{ type: 'wave', n: 18, species: ['bird', 'cat'], rain: true }]);
  assert.deepEqual(said, [number(18), species('bird'), species('cat'), PACK.rain]);
  assert.equal(lines([wave(19, 'dog')]).includes(PACK.rain), false, 'only the wave the rain begins with says it');
});

test('a tick with no events, or none that speak, says nothing', () => {
  assert.equal(lines([]).length, 0);
  assert.equal(lines([]), lines([]), 'and allocates nothing');
  assert.equal(lines([{ type: 'kill' }]).length, 0);
});

test('lines start one after another, each clip length plus LINE_GAP apart', () => {
  const q = createQueue();
  enqueue(q, lines([wave(1, 'dog')]));
  assert.equal(stepQueue(q, 0), number(1));
  const next = PACK.numbers[0].ms / 1000 + LINE_GAP;
  assert.ok(Math.abs(next - 0.91) < 1e-9, 'number 1 (760 ms) holds the queue 0.91 s');
  assert.equal(stepQueue(q, next - 0.002), null, 'nothing in between');
  assert.equal(stepQueue(q, 0.004), species('dog'));
  assert.deepEqual(drain(q, 5), [], 'and then nothing');
});

test('new lines replace the unstarted backlog', () => {
  const q = createQueue();
  enqueue(q, lines([wave(4, 'cat', 'horse')]));
  stepQueue(q, 0); // four starts; the cat and the horse wait
  const wait = q.wait;
  enqueue(q, lines([wave(5, 'fish')])); // wave 4 died before its lines were said
  assert.equal(q.wait, wait, 'the line already playing keeps its time');
  assert.deepEqual(drain(q, 5), [number(5), species('fish')]);
});

test('the queue waits while it is not stepped', () => {
  const q = createQueue();
  enqueue(q, lines([wave(1, 'dog')]));
  stepQueue(q, 0); // one starts, then the pause menu goes up and nothing steps for a while
  let stepped = 0;
  let line = null;
  while (!line && stepped < 5) {
    line = stepQueue(q, 0.05);
    stepped += 0.05;
  }
  assert.equal(line, species('dog'));
  assert.ok(stepped > 0.9 && stepped < 0.96, `the dog waited for 0.91 s of stepped time, not ${stepped}`);
});

test('sayingOf is the species whose line is under way, for its length; a number names none', () => {
  const q = createQueue();
  assert.equal(sayingOf(q), null);
  enqueue(q, lines([wave(1, 'dog')]));
  stepQueue(q, 0);
  assert.equal(sayingOf(q), null, 'one');
  stepQueue(q, number(1).ms / 1000 + LINE_GAP);
  assert.equal(sayingOf(q), 'dog');
  stepQueue(q, species('dog').ms / 1000 + 0.01);
  assert.equal(sayingOf(q), null, 'the gap after the dog');
});
