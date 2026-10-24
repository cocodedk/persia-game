import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { makeRng } from '../../src/core/rng.js';
import { createFx, stepFx } from '../../src/fx/fx.js';
import { MAX_PARTICLES } from '../../src/fx/particles.js';
import { applyEvent, applyEvents, REACTS } from '../../src/fx/react.js';
import { createWorld, stepWorld } from '../../src/core/world.js';
import { autopilot } from '../../src/core/autopilot.js';
import { LEVEL } from '../../src/core/levels.js';
import { realLevel } from '../core/boss-kit.js';
import { TICK, react } from './fx-kit.js';
import { sampleEvent } from '../event-sample.js';

// Events the core emits that fx deliberately leaves to the screens and the voice.
const SILENT = ['failed', 'wave', 'boss'];

test('every event type the core emits has a reaction, or is listed as silent here', () => {
  const dir = fileURLToPath(new URL('../../src/core/', import.meta.url));
  const types = new Set();
  for (const name of readdirSync(dir)) {
    for (const m of readFileSync(dir + name, 'utf8').matchAll(/emit\(world, '(\w+)'/g)) types.add(m[1]);
  }
  assert.ok(types.size >= 20, `found ${types.size} event types`);
  for (const t of types) {
    assert.ok(REACTS.includes(t) || SILENT.includes(t), `no fx reaction for core event '${t}'`);
  }
  for (const t of SILENT) assert.ok(types.has(t));
});

test('an unknown event, even one named like an Object method, changes nothing', () => {
  for (const type of ['nope', 'constructor', 'toString', '__proto__']) {
    const fx = react({ type, x: 1, y: 2 });
    assert.equal(fx.particles.length + fx.flashes.length + fx.rings.length + fx.popups.length, 0, type);
  }
});

test('the same seed gives the same effects; another seed gives different ones', () => {
  const ev = { type: 'explode', x: 400, y: 300, size: 3 };
  assert.deepEqual(react(ev, undefined, 7).particles, react(ev, undefined, 7).particles);
  assert.notDeepEqual(react(ev, undefined, 7).particles, react(ev, undefined, 8).particles);
});

test('fx never draws from the world rng', () => {
  const world = createWorld(LEVEL);
  const before = world.rng.s;
  const fx = createFx();
  const rng = makeRng(1);
  for (const type of REACTS) applyEvent(fx, sampleEvent(type), rng, world);
  assert.equal(world.rng.s, before);
});

test('density halves the particle spawns for the auto quality scaler', () => {
  const ev = { type: 'explode', x: 400, y: 300, size: 3 };
  const full = react(ev).particles.length;
  const fx = createFx();
  fx.density = 0.5;
  applyEvent(fx, ev, makeRng(1));
  assert.ok(fx.particles.length <= full * 0.6 && fx.particles.length >= full * 0.4, `${fx.particles.length} vs ${full}`);
});

test('a storm of events cannot pass 600 particles', () => {
  const fx = createFx();
  const rng = makeRng(9);
  for (let i = 0; i < 200; i++) {
    applyEvent(fx, { type: 'explode', x: 100 + i * 5, y: 300, size: 3 }, rng);
    applyEvent(fx, { type: 'kill', role: 'carrier', x: 300, y: 200, score: 250, mult: 1, scored: true }, rng);
  }
  assert.equal(fx.particles.length, MAX_PARTICLES);
});

test('a whole autopiloted fight with the giant: every effect stays finite and bounded', () => {
  const world = createWorld(realLevel('giant'));
  const fx = createFx();
  const rng = makeRng(4);
  let peak = 0;
  for (let i = 0; i < 60 * 40 && world.state !== 'cleared'; i++) {
    stepWorld(world, TICK, autopilot(world));
    applyEvents(fx, world.events.splice(0), rng, world);
    stepFx(fx, TICK);
    peak = Math.max(peak, fx.particles.length);
    assert.ok(fx.particles.length <= MAX_PARTICLES);
  }
  assert.ok(peak > 20, `peak ${peak}: the fight made effects`);
  const nums = [fx.shake, fx.shakeX, fx.shakeY, fx.slow, ...fx.particles.flatMap((p) => [p.x, p.y, p.vx, p.vy, p.size])];
  assert.ok(nums.every(Number.isFinite));
});
