import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { root, walk, stripComments } from './repo-kit.js';
import { MOTION } from '../src/core/formations.js';
import { ENTRY } from '../src/core/formations-2.js';
import { EMIT } from '../src/core/patterns.js';
import { LEVEL } from '../src/core/levels.js';
import { bossDef } from '../src/core/bosses-data.js';
import { MOVES } from '../src/core/boss-move.js';
import { SFX } from '../src/ui/sfx.js';

// The dead-code gate: Persia keeps nothing level 1 does not run (the plan's Global Constraints).

const code = (f) => stripComments(readFileSync(f, 'utf8'));
const scripts = (dir) => walk(join(root, dir)).filter((f) => f.endsWith('.js')).map((f) => ({ f, text: code(f) }));
const src = scripts('src');
const tests = scripts('test');

const name = (spec) => spec.trim().split(/\s+as\s+/); // 'a as b' -> ['a', 'b']; 'a' -> ['a']
const list = (body) => body.split(',').filter((s) => s.trim()).map(name);
const LOCAL_LIST = /\bexport\s*\{[^}]*\}(?!\s*from)/g;

// The names a file exports ('default' for its default export).
function exportsOf(text) {
  const out = [...text.matchAll(/\bexport\s+(?:async\s+)?(?:function\*?|const|let|var|class)\s+([\w$]+)/g)].map((m) => m[1]);
  if (/\bexport\s+default\b/.test(text)) out.push('default');
  for (const m of text.matchAll(/\bexport\s*\{([^}]*)\}/g)) out.push(...list(m[1]).map((n) => n.at(-1)));
  return out;
}

// What a file imports, as 'file#name' keys: static imports and re-exports, a namespace (static or
// dynamic) by the properties read off it, and a destructured dynamic import.
function importsOf({ f, text }) {
  const out = [];
  const add = (spec, names) => {
    const from = resolve(dirname(f), spec);
    for (const n of names) out.push(`${from}#${n}`);
  };
  const props = (ns) => [...text.matchAll(new RegExp(`\\b${ns}\\.([\\w$]+)`, 'g'))].map((m) => m[1]);
  for (const [, clause, spec] of text.matchAll(/\bimport\s+([^'";]+?)\s+from\s*['"]([^'"]+)['"]/g)) {
    const ns = clause.match(/\*\s+as\s+([\w$]+)/);
    const braces = clause.match(/\{([^}]*)\}/);
    if (/^[\w$]+/.test(clause) && !ns) add(spec, ['default']);
    if (ns) add(spec, props(ns[1]));
    if (braces) add(spec, list(braces[1]).map((n) => n[0]));
  }
  for (const [, body, spec] of text.matchAll(/\bexport\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g)) add(spec, list(body).map((n) => n[0]));
  for (const [, bind, spec] of text.matchAll(/\b(?:const|let)\s+(\{[^}]*\}|[\w$]+)\s*=\s*await\s+import\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    add(spec, bind.startsWith('{') ? list(bind.slice(1, -1)).map((n) => n[0].split(':')[0].trim()) : props(bind));
  }
  return out;
}

// Whether the file uses a name of its own beyond declaring it (an export list does not count).
const usedHere = (text, n) => (text.replace(LOCAL_LIST, '').match(new RegExp(`\\b${n}\\b`, 'g')) ?? []).length > 1;

test('every export in src is used: by another src file, or in its own file and by a test', () => {
  const importers = new Map(); // 'file#name' -> the src files that import it
  for (const file of src) for (const k of importsOf(file)) importers.set(k, [...(importers.get(k) ?? []), file.f]);
  const byTests = new Set(tests.flatMap(importsOf));
  const dead = [];
  for (const file of src) {
    for (const n of exportsOf(file.text)) {
      const key = `${file.f}#${n}`;
      const bySrc = (importers.get(key) ?? []).some((g) => g !== file.f);
      if (!bySrc && !(n !== 'default' && usedHere(file.text, n) && byTests.has(key))) dead.push(`${relative(root, file.f)} ${n}`);
    }
  }
  assert.deepEqual(dead, []);
});

test('the export gate reads named, default, renamed, namespace and dynamic imports', () => {
  const f = join(root, 'src', 'x', 'a.js');
  const text = "import d, { p, q as r } from './b.js'; import * as ns from '../c.js'; ns.s(); export { t as u } from './b.js';"
    + " const { v: w } = await import('./d.js'); const m = await import('./e.js'); m.x;";
  const keys = importsOf({ f, text }).map((k) => `${basename(k.split('#')[0])}#${k.split('#')[1]}`);
  assert.deepEqual(keys.sort(), ['b.js#default', 'b.js#p', 'b.js#q', 'b.js#t', 'c.js#s', 'd.js#v', 'e.js#x']);
  assert.deepEqual(exportsOf('export const a = 1; export function b() {} export default {}; export { c, d as e };'),
    ['a', 'b', 'default', 'c', 'e']);
  assert.equal(usedHere('const W = 1; export { W };', 'W'), false);
  assert.equal(usedHere('export const W = 1; const k = W * 2;', 'W'), true);
});

const giant = bossDef(LEVEL.boss);

// The formations and patterns are the names in their own tables: the hold motions and the entries
// (formations.js, formations-2.js) and the bullet emitters (patterns.js).
test('every formation and pattern is flown by level 1 or fired by the giant', () => {
  const flown = new Set(LEVEL.waves.map((x) => x.formation));
  const fired = new Set([...LEVEL.waves.map((x) => x.pattern), ...giant.phases.flatMap((ph) => ph.attacks.map((a) => a.pattern))]);
  assert.deepEqual([...Object.keys(MOTION), ...Object.keys(ENTRY)].filter((x) => !flown.has(x)), []);
  assert.deepEqual(Object.keys(EMIT).filter((x) => !fired.has(x)), []);
});

test("every boss move is one the giant's phases use", () => {
  const used = new Set(giant.phases.map((ph) => ph.move));
  assert.deepEqual(Object.keys(MOVES).filter((m) => !used.has(m)), []);
});

// A sound is played by name: the first argument of a play(...) call (a literal, or the literals of a
// ternary), or SFX.name called directly. The patch files themselves do not count.
test('every sound in SFX is named by a play(...) call or an event mapping in src', () => {
  const named = new Set();
  for (const { f, text } of src) {
    if (basename(f).startsWith('sfx')) continue;
    for (const [, arg] of text.matchAll(/\bplay\(\s*([^,)]+)/g)) for (const [, n] of arg.matchAll(/'([\w$]+)'/g)) named.add(n);
    for (const [, n] of text.matchAll(/\bSFX\.([\w$]+)/g)) named.add(n);
  }
  assert.deepEqual(Object.keys(SFX).filter((n) => !named.has(n)), []);
});
