import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStorage, PREFIX } from '../../src/ui/storage.js';

// A working localStorage stand-in.
function memoryBackend(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    map,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

// Private windows, kiosks with blocked storage, a full quota: every call throws.
const throwing = {
  getItem() { throw new Error('SecurityError'); },
  setItem() { throw new Error('QuotaExceededError'); },
  removeItem() { throw new Error('SecurityError'); },
};

test('keys are prefixed persia. and results survive a new instance over the same storage', () => {
  assert.equal(PREFIX, 'persia.');
  const back = memoryBackend();
  const s = createStorage(() => back);
  const r = s.recordResult('w2-1', { score: 12000, stars: 2 });
  assert.deepEqual(r.best, { score: 12000, stars: 2 });
  assert.equal(r.newBest, true);
  for (const key of back.map.keys()) assert.ok(key.startsWith('persia.'), key);
  assert.deepEqual(createStorage(() => back).best('w2-1'), { score: 12000, stars: 2 });
});

test('best score and best stars are kept apart, each the highest so far', () => {
  const back = memoryBackend();
  const s = createStorage(() => back);
  assert.deepEqual(s.best('w1-1'), { score: 0, stars: 0 }, 'never played');
  s.recordResult('w1-1', { score: 9000, stars: 3 });
  const r = s.recordResult('w1-1', { score: 15000, stars: 1 });
  assert.deepEqual(r.best, { score: 15000, stars: 3 });
  assert.equal(r.newBest, true);
  const again = s.recordResult('w1-1', { score: 15000, stars: 3 });
  assert.equal(again.newBest, false, 'a tie is not a new best');
  assert.deepEqual(JSON.parse(back.map.get('persia.best')), { 'w1-1': { score: 15000, stars: 3 } });
});

test('a throwing localStorage never breaks the game: everything holds for the session', () => {
  const s = createStorage(() => throwing);
  assert.deepEqual(s.best('w3-2'), { score: 0, stars: 0 });
  const r = s.recordResult('w3-2', { score: 5000, stars: 1 });
  assert.equal(r.newBest, true);
  assert.deepEqual(s.best('w3-2'), { score: 5000, stars: 1 }, 'remembered in memory');
  s.setMuted(true);
  assert.equal(s.muted(), true);
});

test('a localStorage getter that throws, or no localStorage at all, works the same', () => {
  for (const get of [() => { throw new Error('denied'); }, () => undefined, () => null]) {
    const s = createStorage(get);
    s.recordResult('w8-5', { score: 100, stars: 1 });
    assert.deepEqual(s.best('w8-5'), { score: 100, stars: 1 });
    assert.equal(s.muted(), false);
  }
});

test('corrupted JSON reads as nothing saved, and the next result overwrites it', () => {
  const back = memoryBackend({ 'persia.best': '{"w1-1": {"score": 50' });
  const s = createStorage(() => back);
  assert.deepEqual(s.best('w1-1'), { score: 0, stars: 0 });
  s.recordResult('w1-1', { score: 700, stars: 1 });
  assert.deepEqual(JSON.parse(back.map.get('persia.best')), { 'w1-1': { score: 700, stars: 1 } });
});

test('well-formed JSON of the wrong shape is cleaned entry by entry, and the next result keeps only the clean ones', () => {
  const saved = {
    'w1-1': { score: 4000, stars: 2 },
    'w1-2': { score: 'lots', stars: 2 },
    'w1-3': { score: 10, stars: 9 },
    'w1-4': null,
    'w1-5': { score: -5, stars: 1 },
  };
  const overflow = JSON.stringify(saved).replace(/}$/, ',"w2-1":{"score":1e999,"stars":1}}'); // parses to Infinity
  const fresh = { 'w3-1': { score: 1, stars: 0 } };
  for (const raw of [JSON.stringify(saved), overflow, '[1,2,3]', '"text"', 'null', '42']) {
    const back = memoryBackend({ 'persia.best': raw });
    const s = createStorage(() => back);
    for (const id of ['w1-2', 'w1-3', 'w1-4', 'w1-5', 'w2-1']) assert.deepEqual(s.best(id), { score: 0, stars: 0 }, `${raw}: ${id}`);
    s.recordResult('w3-1', fresh['w3-1']);
    const kept = raw.startsWith('{') ? { 'w1-1': { score: 4000, stars: 2 }, ...fresh } : fresh;
    assert.deepEqual(JSON.parse(back.map.get('persia.best')), kept, raw);
  }
});

test('the mute switch reads garbage as off', () => {
  const s = createStorage(() => memoryBackend({ 'persia.muted': 'maybe' }));
  assert.equal(s.muted(), false);
  s.setMuted(true);
  assert.equal(s.muted(), true);
  s.setMuted(false);
  assert.equal(s.muted(), false);
});
