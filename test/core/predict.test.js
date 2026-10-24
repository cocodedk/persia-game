import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from '../../src/core/world.js';
import { LEVEL } from '../../src/core/levels.js';
import { BOSS_DEFS } from '../../src/core/bosses-data.js';
import { posAt, bossShifts } from '../../src/core/predict.js';
import { step } from './world-kit.js';
import { leave, realLevel } from './boss-kit.js';

// The autopilot's aim is only as good as its forecast, so the forecast is checked against the
// simulation itself: stand still (no shots, so nothing dies and the grid keeps its pace), look
// `tau` ahead, then really step that long and compare.

const TAUS = [0.2, 0.5, 0.8];
const near = (a, b, what, within = 0.01) => { // the message is built only on a miss
  if (!(Math.hypot(a.x - b.x, a.y - b.y) < within)) assert.fail(`${what}: forecast ${a.x},${a.y} but was ${b.x},${b.y}`);
};

// An undisturbed copy of the level: quiet, and the ship cannot be rammed off its spot.
function still(level) {
  const world = createWorld(level, level.seed);
  world.scale.fireMult = 0;
  world.ship.invuln = Infinity;
  return world;
}

function checkAliens(world, what) {
  const checked = { enter: 0, hold: 0, dive: 0 };
  const later = structuredClone(world);
  let ticks = 0;
  for (const tau of TAUS) {
    const n = Math.round(tau * 60);
    step(later, n - ticks); // the same copy, stepped on to each look-ahead in turn
    ticks = n;
    for (const a of world.aliens) {
      const b = later.aliens.find((x) => x.id === a.id);
      const mode = a.mode === 'return' ? 'dive' : a.mode;
      const newDive = b?.dive && b.dive.fx !== a.dive?.fx; // a swoop that began in between is not foreseen
      if (!b || newDive || (a.mode === 'hold' && b.mode !== 'hold')) continue;
      near(posAt(world, a, tau), b, `${what} ${mode} alien ${a.id} after ${tau}`);
      checked[mode]++;
    }
  }
  return checked;
}

// Every wave of the level, each flown as a level's first: nothing dies here, so the later waves
// would never fly.
const FIRSTS = LEVEL.waves.map((w, i) => ({ ...LEVEL, id: `${LEVEL.id}.${i}`, waves: [w] }));

test('posAt forecasts every alien of every wave to a hundredth of a pixel, entering, holding and diving', () => {
  const seen = { enter: 0, hold: 0, dive: 0 };
  for (const level of FIRSTS) {
    const world = still(level);
    for (let tick = 0; tick < 60 * 40; tick += 53) {
      for (const [mode, n] of Object.entries(checkAliens(world, `${level.id} at ${tick}`))) seen[mode] += n;
      step(world, 53);
    }
  }
  assert.ok(seen.enter > 100 && seen.hold > 1000 && seen.dive > 20, `modes covered: ${JSON.stringify(seen)}`);
});

test('posAt forecasts a wave that flies in after the first one', () => {
  const second = still(LEVEL);
  step(second, 150);
  for (const a of second.aliens) a.hp = 0;
  step(second, 1 + 72 + 15);
  assert.equal(second.wave, 2, 'the second wave has spawned');
  assert.ok(second.aliens.every((a) => a.mode === 'enter'));
  assert.ok(checkAliens(second, 'second wave').enter > 10);
});

test('bossShifts forecasts the whole boss, in every phase style, to a hundredth of a pixel', () => {
  for (const { kind } of BOSS_DEFS) {
    const world = still(realLevel(kind));
    step(world, 125);
    for (let n = 0; n < 12; n++) {
      const shifts = bossShifts(world, 45);
      for (const k of [1, 15, 45]) {
        const later = structuredClone(world);
        step(later, k);
        near({ x: world.boss.x + shifts[k].dx, y: world.boss.y + shifts[k].dy }, later.boss, `${kind} after ${k} ticks`);
      }
      step(world, 111);
    }
  }
});

test('posAt forecasts the minions a boss launches', () => {
  let checked = 0;
  const world = createWorld(realLevel('giant'));
  world.ship.invuln = Infinity;
  leave(world, ['eyeL', 'eyeR', 'mouth', 'brow'], 5); // into the last phase: cats and a rabbit
  for (let i = 0; i < 30; i++) {
    step(world, 90);
    const later = structuredClone(world);
    step(later, 20);
    for (const a of world.aliens.filter((m) => m.minion && m.hp > 0)) {
      const b = later.aliens.find((m) => m.id === a.id);
      if (!b || b.hp <= 0 || b.x <= 20 || b.x >= 1900) continue;
      near(posAt(world, a, 20 / 60), b, `minion ${a.species}`, 1); // integrated in 1/30 s steps, not 1/60
      checked++;
    }
  }
  assert.ok(checked > 10, `${checked} minions checked`);
});
