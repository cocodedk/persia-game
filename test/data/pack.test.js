import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { PACK } from '../../src/data/pack.js';
import { spoken } from '../../src/ui/voice-queue.js';
import { SPECIES } from '../../src/core/kinds.js';
import { LEVELS, waveNumber } from '../../src/core/levels.js';
import { root } from '../repo-kit.js';

const MANIFEST = JSON.parse(readFileSync(`${root}public/audio/manifest.json`, 'utf8'));
const LINES = spoken(PACK);

// A species word: Arabic script and ZWNJ only; never Arabic kaf or yeh, a diacritic, or a digit of any
// kind; no ZWNJ at either end. Written as escapes: only the pack holds Arabic-script characters.
const RULE = /^[\u0600-\u06FF\u200C]+$/;
const BANNED = /[\u0643\u064A\u064B-\u065F\u0660-\u0669\u06F0-\u06F90-9]/;
const EDGE = /^\u200C|\u200C$/;
const obeys = (word) => RULE.test(word) && !BANNED.test(word) && !EDGE.test(word);

test('every species word, every weather\'s and every HUD word is Persian script only: no Arabic kaf or yeh, no diacritics, no digits, no edge ZWNJ', () => {
  const words = [...PACK.species, ...Object.values(PACK.weather)].map((x) => x.word);
  for (const word of [...words, ...Object.values(PACK.hud)]) assert.ok(obeys(word), word);
});

test('the pack words each kind of weather: rain, stars, petals, the moon and dawn, and every kind a level has', () => {
  assert.deepEqual(Object.keys(PACK.weather).sort(), ['dawn', 'moon', 'petals', 'rain', 'stars']);
  for (const { weather } of LEVELS) assert.ok(!weather || PACK.weather[weather.kind], weather?.kind);
});

test('the digits are the ten Persian ones, 0 to 9, never Arabic-Indic or ASCII', () => {
  assert.equal(PACK.digits, Array.from({ length: 10 }, (_, d) => String.fromCharCode(0x06f0 + d)).join(''));
});

test('thousands are grouped with the Arabic thousands separator (U+066C), never a comma', () => {
  assert.equal(PACK.group, String.fromCharCode(0x066c));
});

test('every number is written in those digits', () => {
  for (const { n, word } of PACK.numbers) assert.equal(word, [...String(n)].map((d) => PACK.digits[d]).join(''), `${n}`);
});

test('the rule rejects Arabic kaf, Arabic yeh, a diacritic and an ASCII digit', () => {
  const [{ word }] = PACK.species;
  assert.ok(obeys(word));
  for (const bad of ['\u0643', '\u064A', '\u064E', '1']) assert.ok(!obeys(word + bad), `${word} + ${bad}`);
});

test('every line carries the name it is said by, in plain lowercase Latin letters, hyphens between the parts of bist-o-yek', () => {
  for (const { clip, say } of LINES) assert.match(say ?? '', /^[a-z]+(-[a-z]+)*$/, clip);
});

test('pack species are exactly the core SPECIES ids, and there is one number per wave of the game, in order from 1', () => {
  assert.deepEqual(PACK.species.map((s) => s.id).sort(), Object.keys(SPECIES).sort());
  const last = LEVELS.at(-1);
  const waves = waveNumber(last, last.waves.length);
  assert.deepEqual(PACK.numbers.map((x) => x.n), Array.from({ length: waves }, (_, i) => i + 1));
});

test('every pack clip is on disk, listed once in the manifest with its sha256, ms equal to durationMs, reviewed', () => {
  for (const { clip, ms } of LINES) {
    const records = MANIFEST.filter((r) => r.file === clip);
    assert.equal(records.length, 1, clip);
    const [{ sha256, durationMs, reviewedBy }] = records;
    assert.equal(createHash('sha256').update(readFileSync(`${root}${clip}`)).digest('hex'), sha256, clip);
    assert.equal(ms, durationMs, clip);
    assert.ok(reviewedBy.length > 0, clip);
  }
});

test('the manifest lists exactly the pack clips and nothing else', () => {
  assert.deepEqual(MANIFEST.map((r) => r.file).sort(), LINES.map((l) => l.clip).sort());
});
