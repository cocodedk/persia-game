import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeInputs, decodeInputs, quantizeInput, MAX_TICKS, IDLE } from '../../src/core/input-codec.js';
import { makeRng } from '../../src/core/rng.js';
import { randomInputs } from './replay-kit.js';

const at = (x, y, o = {}) => ({ ...IDLE, ...o, target: { x, y } });
const roundTrip = (list) => decodeInputs(encodeInputs(list));

test('encode/decode round-trips random input lists, keys and pointer alike', () => {
  for (let seed = 1; seed <= 30; seed++) {
    const list = randomInputs(seed, (seed * 97) % 1500, { mouse: seed % 3 !== 0 });
    assert.deepEqual(roundTrip(list), list, `seed ${seed}`);
  }
  assert.deepEqual(roundTrip([]), []);
});

test('every combination of keys, fire and bomb, and of fire and bomb under a pointer, survives the round trip', () => {
  const list = [];
  for (const dx of [-1, 0, 1]) for (const dy of [-1, 0, 1]) for (const fire of [false, true]) for (const bomb of [false, true]) {
    list.push({ dx, dy, fire, bomb, target: null });
  }
  for (const fire of [false, true]) for (const bomb of [false, true]) list.push(at(1920, 620, { fire, bomb }), at(0, 1080, { fire, bomb }));
  assert.deepEqual(roundTrip(list), list);
});

test('the wire format is pinned: saved runs are read with it', () => {
  assert.equal(encodeInputs([IDLE, IDLE, { ...IDLE, fire: true }]), 'Q*2S');
  assert.equal(encodeInputs([at(961, 958)]), 'kCF', 'a pointer move from the middle of the screen: +1, -2');
  assert.equal(encodeInputs([at(961, 958, { fire: true })]), 'mCF');
  assert.equal(encodeInputs([at(961, 958, { bomb: true })]), 'lCF');
  assert.equal(encodeInputs([at(961, 958), at(962, 956), at(963, 954), IDLE, at(964, 954)]), 'kCF*3QkCA',
    'the same move again is a count; a pointer back from nothing is the hop from where it was');
  assert.deepEqual(decodeInputs('kCF*3QkCA'),[at(961, 958), at(962, 956), at(963, 954), IDLE, at(964, 954)]);
  assert.deepEqual(decodeInputs('nAA*2'), [at(960, 960, { fire: true, bomb: true }), at(960, 960, { fire: true, bomb: true })]);
});

test('runs of identical inputs, a pointer at rest and a steady sweep are run-length encoded', () => {
  const held = Array.from({ length: 3000 }, () => ({ ...IDLE, fire: true }));
  assert.equal(encodeInputs(held), 'S*3000');
  const still = Array.from({ length: 3000 }, () => at(500, 700, { fire: true }));
  assert.ok(encodeInputs(still).endsWith('mAA*2999'), encodeInputs(still));
  assert.ok(encodeInputs(still).length <= 16, encodeInputs(still));
  const steady = Array.from({ length: 600 }, (_, t) => at(100 + 3 * t, 1000 - t));
  assert.ok(encodeInputs(steady).length <= 16, encodeInputs(steady));
  assert.deepEqual(roundTrip(steady), steady);
});

test('quantizeInput gives the one shape the core is fed and the encoder writes', () => {
  assert.deepEqual(quantizeInput({ dx: 5, dy: -0.3, fire: 1 }), { dx: 1, dy: -1, fire: true, bomb: false, target: null });
  assert.deepEqual(quantizeInput({ dx: 5, dy: -0.3, fire: 1, target: { x: 10.6, y: 700.4 } }),
    { dx: 0, dy: 0, fire: true, bomb: false, target: { x: 11, y: 700 } }, 'the ship ignores the keys under a pointer');
  assert.deepEqual(quantizeInput({}), IDLE);
  assert.deepEqual(quantizeInput({ target: { x: 5000, y: -5 } }).target, { x: 1920, y: 0 }, 'held on the screen');
  assert.deepEqual(quantizeInput({ target: { x: NaN, y: 3 } }).target, null);
  assert.deepEqual(roundTrip([{ dx: 3, fire: 1 }]), [{ ...IDLE, dx: 1, fire: true }]);
});

// ---- size ---------------------------------------------------------------------------------------

const TICKS = 3600; // 60 s
const sweep = (period, rx, ry) => Array.from({ length: TICKS }, (_, t) =>
  at(960 + rx * Math.sin((2 * Math.PI * t) / period), 850 + ry * Math.sin((2 * Math.PI * t) / (period * 0.6)), { fire: true }));

test('60 s of a smoothly sweeping pointer that moves every tick costs at most 12 KB', () => {
  const run = sweep(480, 700, 150).map(quantizeInput); // 1400 px across the screen every 4 s
  const moved = run.filter((c, t) => t && (c.target.x !== run[t - 1].target.x || c.target.y !== run[t - 1].target.y)).length;
  assert.ok(moved >= TICKS * 0.95, `the pointer moves on ${moved} of ${TICKS} ticks`);
  const text = encodeInputs(run);
  assert.ok(text.length <= 12000, `${text.length} characters`);
  assert.deepEqual(decodeInputs(text), run);
});

test('60 s of a hand-held pointer (a jittery walk, steps up to 6 px) costs at most 12 KB; keys stay tiny', () => {
  const rng = makeRng(7);
  let x = 960;
  let y = 900;
  const walk = Array.from({ length: TICKS }, () => {
    x = Math.min(1900, Math.max(20, x + Math.round((rng() - 0.5) * 12)));
    y = Math.min(1040, Math.max(620, y + Math.round((rng() - 0.5) * 12)));
    return at(x, y, { fire: true });
  });
  const text = encodeInputs(walk);
  assert.ok(text.length <= 12000, `${text.length} characters`);
  assert.deepEqual(decodeInputs(text), walk);
  assert.ok(encodeInputs(randomInputs(5, TICKS, { mouse: false })).length <= 1300, 'a keyboard run is about 1.2 KB a minute');
});

// ---- the corners of the format -----------------------------------------------------------------

test('large jumps, the edges of the screen and the hop back after a gap round-trip exactly', () => {
  const corners = [at(0, 0), at(1920, 1080), at(0, 1080), at(1920, 0), at(0, 0), at(1920, 1080), at(960, 540), at(0, 540), at(1920, 540)];
  assert.deepEqual(roundTrip(corners), corners);
  const jumps = [at(960, 960), at(15, 1000), at(1905, 20), at(1889, 36), at(1890, 37)]; // 15, 16 and 1890 px in one tick
  assert.deepEqual(roundTrip(jumps), jumps);
  const everywhere = [];
  for (const x of [0, 1, 15, 16, 17, 511, 512, 1919, 1920]) for (const y of [0, 1, 15, 16, 511, 512, 1079, 1080]) everywhere.push(at(x, y));
  assert.deepEqual(roundTrip(everywhere), everywhere);
});

test('a pointer that vanishes and comes back, and a run that starts or ends without one, round-trip exactly', () => {
  const list = [IDLE, { ...IDLE, dx: 1, fire: true }, at(300, 700), at(310, 705), IDLE, IDLE, { ...IDLE, dy: -1, bomb: true }, at(1900, 40, { fire: true }),
    IDLE, at(1900, 40), at(0, 1080), ...Array.from({ length: 50 }, () => IDLE), at(5, 5), IDLE];
  assert.deepEqual(roundTrip(list), list);
  assert.deepEqual(roundTrip([at(1, 1)]), [at(1, 1)]);
  assert.deepEqual(roundTrip([IDLE, IDLE]), [IDLE, IDLE]);
});

test('decodeInputs rejects garbage, broken tokens, wild pointers and absurd run lengths with null', () => {
  const corner = encodeInputs([at(1920, 1080)]);
  const origin = encodeInputs([at(0, 0)]);
  const bad = [
    'garbage!', 'A ', 'A*', 'A*0', 'A*1', 'A**3', '*3', 'o', 'AA*5!', 'AkCF*', // heads, counts
    'k', 'kC', 'kAA*1', 'kCg', 'kgggB', 'kgggAA', 'kgAA', 'kBA', 'kAB', 'k!A', // pointer tokens: missing, cut, too long, not canonical
    'A@960,1000', '@1,2', 'A@1,2,3', // the old absolute form
    `${corner}kCA`, `${corner}kAC`, `${origin}kDA`, `${origin}kAD`, 'kCA*1500', // off the screen
    'A*99999999999', `A*${MAX_TICKS + 1}`, 'A*60000A*60000A*60000', // too long
  ];
  for (const text of bad) assert.equal(decodeInputs(text), null, JSON.stringify(text));
  for (const x of [null, undefined, 42, {}, [], true]) assert.equal(decodeInputs(x), null);
  assert.notEqual(decodeInputs('kCA*960'), null, 'a move that ends exactly on the edge is fine');
  assert.notEqual(decodeInputs(`${corner}kDA`), null);
});

test('every proper prefix of an encoded run either fails or is a shorter run, never a wrong one', () => {
  const list = randomInputs(9, 400);
  const text = encodeInputs(list);
  for (let n = 0; n < text.length; n++) {
    const part = decodeInputs(text.slice(0, n));
    if (part) assert.deepEqual(part, list.slice(0, part.length), `cut at ${n}`);
  }
});
