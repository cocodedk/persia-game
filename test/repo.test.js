import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const SCHEME = ['http', 'https'].map((s) => `${s}://`);

function walk(path, out = []) {
  if (!existsSync(path)) return out;
  if (statSync(path).isDirectory()) {
    for (const name of readdirSync(path)) walk(join(path, name), out);
  } else {
    out.push(path);
  }
  return out;
}

const pages = readdirSync(root).filter((n) => n.endsWith('.html')).map((n) => join(root, n));
const checked = [...walk(join(root, 'src')), ...walk(join(root, 'test')), ...pages];

test('every file in src, test and the root html pages is under 200 lines', () => {
  assert.ok(pages.length >= 1, 'index.html exists');
  for (const f of checked) {
    const lines = readFileSync(f, 'utf8').split('\n').length;
    assert.ok(lines < 200, `${f} has ${lines} lines`);
  }
});

// Drop line and block comments so prose can say "window" or "document". Strings are kept as they are
// (two slashes inside one are not a comment); the rare regex literal holding a quote can only make
// this keep more text, never hide real code.
function stripComments(src) {
  let out = '';
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    const pair = src.slice(i, i + 2);
    if (pair === '//') {
      while (i < src.length && src[i] !== '\n') i++;
    } else if (pair === '/*') {
      const end = src.indexOf('*/', i + 2);
      i = end < 0 ? src.length : end + 2;
      out += ' ';
    } else if (c === '"' || c === "'" || c === '`') {
      const start = i++;
      while (i < src.length && src[i] !== c && (c === '`' || src[i] !== '\n')) i += src[i] === '\\' ? 2 : 1;
      i++;
      out += src.slice(start, i);
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

// Real uses of the browser or of ambient randomness and time: `window.x`, `document[x]`, Math.random,
// Date.now. The bare words, and any identifier that merely contains them, are fine.
const BANNED = [/\bwindow\s*[.[]/, /\bdocument\s*[.[]/, /Math\s*\.\s*random/, /Date\s*\.\s*now/];
const impureUses = (text) => BANNED.filter((re) => re.test(stripComments(text))).map(String);

test('src/core and src/fx stay pure: no window, document, Math.random or Date.now', () => {
  for (const dir of ['core', 'fx']) {
    for (const f of walk(join(root, 'src', dir))) {
      assert.deepEqual(impureUses(readFileSync(f, 'utf8')), [], `${f} touches the browser or ambient state`);
    }
  }
});

test('the purity check flags real uses and lets prose and identifiers through', () => {
  const clean = [
    '// the window around the peak, not window.foo',
    '/* document.title and Math.random() in a block comment,\n   Date.now() too */ const a = 1;',
    'const windows = pick(windowsOf(events)); const documents = []; const mywindow = 1;',
    'const s = "a // b"; const t = 1; // trailing window.foo',
  ];
  for (const text of clean) assert.deepEqual(impureUses(text), [], text);
  const dirty = ['window.foo()', 'const w = window ["x"]', 'document.getElementById(1)', 'x = Math.random()',
    'x = Date.now()', 'const s = "//"; window.foo()', 'x = 1 // fine\nwindow.foo()'];
  for (const text of dirty) assert.notDeepEqual(impureUses(text), [], text);
});

// index.html may name its own public address in metadata the browser never fetches: name/property
// <meta> tags, rel="canonical" and the JSON-LD block (as Barrage). Any other external URL is a request.
const INERT = [
  /<meta (?:name|property)="[^"]*" content="[^"]*">/g,
  /<link rel="canonical" href="[^"]*">/g,
  /<script type="application\/ld\+json">[\s\S]*?<\/script>/g,
];
const externalUrls = (text, html) => {
  const live = html ? INERT.reduce((t, re) => t.replace(re, ''), text) : text;
  return SCHEME.filter((s) => live.includes(s));
};

test('index.html and src contain no external URLs', () => {
  const files = [...walk(join(root, 'src')), join(root, 'index.html')];
  for (const f of files) assert.deepEqual(externalUrls(readFileSync(f, 'utf8'), f.endsWith('.html')), [], f);
});

test('the URL check lets head metadata through and still flags anything the browser would fetch', () => {
  const inert = ['<meta property="og:image" content="https://x.dk/og.png">', '<link rel="canonical" href="https://x.dk/">',
    '<script type="application/ld+json">{ "url": "https://x.dk/" }</script>'];
  for (const html of inert) assert.deepEqual(externalUrls(html, true), [], html);
  const live = ['<script src="https://x.dk/a.js"></script>', '<link rel="stylesheet" href="https://x.dk/a.css">',
    '<link rel="icon" href="http://x.dk/f.svg">', '<meta http-equiv="refresh" content="0;url=https://x.dk/">',
    '<img src="https://x.dk/a.png">', '<meta name="a" content="b"><script>fetch("https://x.dk/")</script>'];
  for (const html of live) assert.notDeepEqual(externalUrls(html, true), [], html);
  assert.notDeepEqual(externalUrls('// <meta name="a" content="https://x.dk/">', false), [], 'src gets no pass');
});

// The code never holds a Persian word: tests take theirs from PACK or write them as \u escapes.
test('no file in src or test outside src/data/pack.js contains Arabic-script characters', () => {
  const pack = join(root, 'src', 'data', 'pack.js');
  for (const f of [...walk(join(root, 'src')), ...walk(join(root, 'test'))]) {
    if (f !== pack) assert.doesNotMatch(readFileSync(f, 'utf8'), /[\u0600-\u06FF]/, f);
  }
});
