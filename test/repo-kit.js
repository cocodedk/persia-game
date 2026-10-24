// What the repo tests share: the repo root, a file walk, and source with its comments dropped.
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('..', import.meta.url));

export function walk(path, out = []) {
  if (!existsSync(path)) return out;
  if (statSync(path).isDirectory()) {
    for (const name of readdirSync(path)) walk(join(path, name), out);
  } else {
    out.push(path);
  }
  return out;
}

// Drop line and block comments so prose can say "window" or "document". Strings are kept as they are
// (two slashes inside one are not a comment); the rare regex literal holding a quote can only make
// this keep more text, never hide real code.
export function stripComments(src) {
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
