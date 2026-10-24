import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PACK } from '../../src/data/pack.js';
import { LINE_GAP, voiceLines, createQueue, enqueue, stepQueue, sayingOf } from '../../src/ui/voice-queue.js';
import { species, number } from './pack-kit.js';
import { createWorld } from '../../src/core/world.js';
import { LEVELS } from '../../src/core/levels.js';
import { playing, clear, seconds, drain as events } from '../core/world-kit.js';

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

test('each later level\'s first wave counts on from the one before: six, eleven, sixteen, twenty-one, twenty-six', () => {
  for (const [i, n, ids] of [[1, 6, ['dog', 'mouse']], [2, 11, ['bird', 'fish']], [3, 16, ['bird', 'horse']], [4, 21, ['cow', 'dog']], [5, 26, ['dog', 'cat']]]) {
    assert.deepEqual(lines(createWorld(LEVELS[i]).events), [number(n), ...ids.map(species)], LEVELS[i].id);
  }
});

test("level 4's third wave says eighteen, its species, then the rain", () => {
  const said = lines([{ type: 'wave', n: 18, species: ['bird', 'cat'], weather: 'rain' }]);
  assert.deepEqual(said, [number(18), species('bird'), species('cat'), PACK.weather.rain]);
  assert.equal(lines([wave(19, 'dog')]).includes(PACK.weather.rain), false, 'only the wave the rain begins with says it');
});

test('a wave that begins the stars says the stars line in the same place', () => {
  const said = lines([{ type: 'wave', n: 23, species: ['bird', 'cow'], weather: 'stars' }]);
  assert.deepEqual(said, [number(23), species('bird'), species('cow'), PACK.weather.stars]);
});

test('a wave that begins the petals says the petals line in the same place, and only that wave', () => {
  const said = lines([{ type: 'wave', n: 28, species: ['dog', 'bird'], weather: 'petals' }]);
  assert.deepEqual(said, [number(28), species('dog'), species('bird'), PACK.weather.petals]);
  assert.equal(lines([wave(29, 'dog')]).includes(PACK.weather.petals), false);
});

// Everything a level says, wave by wave, from a fresh world (a retry is one).
function sayLevel(level) {
  const w = playing(level);
  const waves = [lines(createWorld(level).events)];
  for (let i = 1; i < level.waves.length; i++) {
    clear(w);
    seconds(w, 1.3);
    waves.push(lines(events(w)));
  }
  return waves;
}

test('level 5 says the stars once, with wave 23, and a retry is clear until then', () => {
  const waves = sayLevel(LEVELS[4]);
  assert.deepEqual(waves.map((said) => said.includes(PACK.weather.stars)), [false, false, true, false, false]);
  assert.deepEqual(waves.map((said) => said[0]), [21, 22, 23, 24, 25].map(number));
});

test('level 6 says the petals once, with wave 28, after the number and the species, and again on a retry', () => {
  const waves = sayLevel(LEVELS[5]);
  assert.deepEqual(waves.map((said) => said.includes(PACK.weather.petals)), [false, false, true, false, false]);
  assert.deepEqual(waves.map((said) => said[0]), [26, 27, 28, 29, 30].map(number));
  assert.deepEqual(waves[2], [number(28), species('dog'), species('bird'), PACK.weather.petals]);
  assert.ok(sayLevel(LEVELS[4]).every((said) => !said.includes(PACK.weather.petals)), 'level 5 keeps its stars');
  assert.deepEqual(sayLevel(LEVELS[5]), waves, 'again on a retry');
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
