import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../../src/core/rng.js';
import { createFx, stepFx } from '../../src/fx/fx.js';
import { applyEvent } from '../../src/fx/react.js';
import { level, wave, playing, step, shotAt, drain, ofType } from '../core/world-kit.js';
import { TICK } from './fx-kit.js';

// A real world, a real fx: feed what the core emits to fx tick by tick, the way main will.
function feed(world, fx, rng, ticks = 1) {
  const slowAt = [];
  for (let i = 0; i < ticks; i++) {
    step(world, 1);
    for (const ev of drain(world)) applyEvent(fx, ev, rng, world);
    stepFx(fx, TICK);
    slowAt.push(fx.slow);
  }
  return slowAt;
}

test('slow motion: only the last kill of a wave starts it, 0.3 for 0.8 s, then it ends', () => {
  const world = playing(level([wave({ cols: 3 })]));
  const fx = createFx();
  const rng = makeRng(5);
  for (let n = 0; n < 2; n++) {
    shotAt(world, world.aliens[0]);
    const events = [];
    step(world, 1);
    events.push(...drain(world));
    assert.equal(ofType(events, 'kill').length, 1);
    for (const ev of events) applyEvent(fx, ev, rng, world);
    stepFx(fx, TICK);
    assert.equal(fx.slow, 1, `kill ${n + 1} of 3 must not slow the game`);
  }
  shotAt(world, world.aliens[0]);
  step(world, 1);
  const events = drain(world);
  assert.equal(ofType(events, 'waveClear').length, 1);
  for (const ev of events) applyEvent(fx, ev, rng, world);
  stepFx(fx, TICK);
  assert.equal(fx.slow, 0.3);
  let ticks = 1;
  while (fx.slow < 1 && ticks < 200) { stepFx(fx, TICK); ticks++; }
  assert.ok(Math.abs(ticks / 60 - 0.8) < 0.05, `slow motion lasted ${ticks / 60} s`);
  assert.equal(fx.slow, 1);
});

test('every wave of a level gets its own slow motion', () => {
  const world = playing(level([wave({ cols: 1 }), wave({ cols: 1 })]));
  const fx = createFx();
  const rng = makeRng(5);
  for (let n = 1; n <= 2; n++) {
    for (let guard = 0; !world.aliens.length && guard < 600; guard++) feed(world, fx, rng);
    shotAt(world, world.aliens[0]);
    feed(world, fx, rng, 2);
    assert.equal(fx.slow, 0.3, `wave ${n}`);
    for (let i = 0; i < 60; i++) stepFx(fx, TICK);
    assert.equal(fx.slow, 1, `wave ${n} ends`);
  }
});

test('no slow motion without a clear: a long fight with kills and hits never slows below 1 until waveClear', () => {
  const world = playing(level([wave({ cols: 5 })]));
  const fx = createFx();
  const rng = makeRng(2);
  shotAt(world, world.aliens[0]);
  const slows = feed(world, fx, rng, 30);
  assert.ok(slows.every((s) => s === 1));
});
