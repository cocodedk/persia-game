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

test("a boss's minion event says that species' line, every time, and a rabbit's says the rabbit's", () => {
  const sent = (id) => ({ type: 'minion', species: id });
  assert.deepEqual(lines([sent('cat')]), [species('cat')]);
  assert.deepEqual(lines([sent('rabbit')]), [species('rabbit')]);
  assert.deepEqual(lines([sent('cat')]), [species('cat')], 'the same again');
  assert.deepEqual(lines([{ type: 'boss', kind: 'giant', species: 'horse' }, sent('rabbit')]), [species('horse'), species('rabbit')]);
});

test('each later level\'s first wave counts on from the one before: six, eleven, sixteen, twenty-one, twenty-six, thirty-one, thirty-six', () => {
  for (const [i, n, ids] of [[1, 6, ['dog', 'mouse']], [2, 11, ['bird', 'fish']], [3, 16, ['bird', 'horse']], [4, 21, ['cow', 'dog']], [5, 26, ['dog', 'cat']], [6, 31, ['horse', 'dog']], [7, 36, ['lion', 'cat']]]) {
    assert.deepEqual(lines(createWorld(LEVELS[i]).events), [number(n), ...ids.map(species)], LEVELS[i].id);
  }
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

test("a level's weather line is said once, with the wave it begins at, after that wave's number and species, and again on a retry", () => {
  for (const level of LEVELS.filter((l) => l.weather)) {
    const { kind, from } = level.weather;
    const line = PACK.weather[kind];
    const waves = sayLevel(level);
    waves.forEach((said, i) => assert.equal(said[0], number(level.first + i), `${level.id} wave ${i + 1} starts with its number`));
    assert.equal(waves.flat().filter((l) => l === line).length, 1, `${level.id} says the ${kind} once`);
    const said = waves[from - 1];
    assert.equal(said.at(-1), line, `${level.id} says the ${kind} last, with wave ${from}`);
    assert.ok(said.length > 2 && said.slice(1, -1).every((l) => PACK.species.includes(l)), `${level.id}: between the number and the ${kind} come species`);
    assert.deepEqual(sayLevel(level), waves, `${level.id} again on a retry`);
  }
});

test("a wave that begins the moon says the moon's line last, after its number and species", () => {
  assert.deepEqual(lines([{ ...wave(3, 'bird', 'mouse'), weather: 'moon' }]), [number(3), species('bird'), species('mouse'), PACK.weather.moon]);
});

test("a wave that begins the dawn says the dawn's line last, after its number and species", () => {
  assert.deepEqual(lines([{ ...wave(3, 'bird', 'mouse'), weather: 'dawn' }]), [number(3), species('bird'), species('mouse'), PACK.weather.dawn]);
});

test("a wave that begins the sunrise says the sunrise's line last, after its number and species", () => {
  assert.deepEqual(lines([{ ...wave(3, 'bird', 'mouse'), weather: 'sunrise' }]), [number(3), species('bird'), species('mouse'), PACK.weather.sunrise]);
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
