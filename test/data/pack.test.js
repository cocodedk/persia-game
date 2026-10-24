import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { PACK } from '../../src/data/pack.js';
import { SPECIES } from '../../src/core/kinds.js';
import { root } from '../repo-kit.js';

const MANIFEST = JSON.parse(readFileSync(`${root}public/audio/manifest.json`, 'utf8'));
const LINES = [...PACK.species, ...PACK.numbers];

// A species word: Arabic script and ZWNJ only; never Arabic kaf or yeh, a diacritic, or a digit of any
// kind; no ZWNJ at either end. Written as escapes: only the pack holds Arabic-script characters.
const RULE = /^[\u0600-\u06FF\u200C]+$/;
const BANNED = /[\u0643\u064A\u064B-\u065F\u0660-\u0669\u06F0-\u06F90-9]/;
const EDGE = /^\u200C|\u200C$/;
const obeys = (word) => RULE.test(word) && !BANNED.test(word) && !EDGE.test(word);

test('every species word is Persian script only: no Arabic kaf or yeh, no diacritics, no digits, no edge ZWNJ', () => {
  for (const { word } of PACK.species) assert.ok(obeys(word), word);
});

test('every number is written as its Persian digit, never an Arabic-Indic or ASCII one', () => {
  for (const { n, word } of PACK.numbers) assert.equal(word, String.fromCharCode(0x06f0 + n), `${n}`);
});

test('the rule rejects Arabic kaf, Arabic yeh, a diacritic and an ASCII digit', () => {
  const [{ word }] = PACK.species;
  assert.ok(obeys(word));
  for (const bad of ['\u0643', '\u064A', '\u064E', '1']) assert.ok(!obeys(word + bad), `${word} + ${bad}`);
});

test('every line carries the name it is said by, in plain lowercase Latin letters', () => {
  for (const { clip, say } of LINES) assert.match(say ?? '', /^[a-z]+$/, clip);
});

test('pack species are exactly the core SPECIES ids, and numbers are 1..5', () => {
  assert.deepEqual(PACK.species.map((s) => s.id).sort(), Object.keys(SPECIES).sort());
  assert.deepEqual(PACK.numbers.map((x) => x.n), [1, 2, 3, 4, 5]);
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
