import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, stepWorld } from '../../src/core/world.js';
import { levelById } from '../../src/core/levels.js';
import { IDLE, TICK, level, wave, input, step, seconds, playing, drain, ofType, shotAt, bulletAt } from './world-kit.js';
import { bossLevel, bossWorld, leave, part, shotOn } from './boss-kit.js';

// Small fairness rules (task 13a): near misses that end early still count (wipes do not, R37), a cut
// star cannot hit on
// its last tick, minions come only from parts still standing and gunner minions shoot, and an
// armored alien that falls mid-dive stands up where it fell and flies home.

test('a bullet that runs out of life inside the near band is still a near miss', () => {
  const w = playing(level([wave()]));
  bulletAt(w, w.ship.x, w.ship.y - 25); // in the band (28), not touching (8 + 14)
  w.bullets[0].life = 0.1;
  seconds(w, 0.5);
  const near = ofType(drain(w), 'nearMiss');
  assert.equal(near.length, 1);
  assert.ok(near[0].dist > 22 && near[0].dist <= 28, `closest approach ${near[0].dist}`);
  assert.equal(w.bullets.length, 0);
});

test('a bullet that never came near leaves no near miss when it expires', () => {
  const w = playing(level([wave()]));
  bulletAt(w, w.ship.x, w.ship.y - 80);
  w.bullets[0].life = 0.1;
  seconds(w, 0.5);
  assert.equal(ofType(drain(w), 'nearMiss').length, 0);
});

// R37: a wipe is not a dodge. Bullets inside the band that a bomb, a boss's death or a cut removes
// settle silently (no fx ring, no trailer tally, no Code Rain bullet time on an empty screen).
test('a bomb that wipes a bullet inside the near band is no near miss', () => {
  const w = playing(level([wave()], 0, { twist: 'glitch' }));
  bulletAt(w, w.ship.x - 25, w.ship.y);
  step(w);
  assert.equal(ofType(drain(w), 'nearMiss').length, 0, 'still in the band');
  step(w, 1, input({ bomb: true }));
  const ev = drain(w);
  assert.equal(ofType(ev, 'bomb').length, 1);
  assert.equal(ofType(ev, 'nearMiss').length, 0);
  assert.equal(ofType(ev, 'bulletTime').length, 0, 'Code Rain: no bullet time on the bomb');
  assert.equal(w.slow, 0);
});

test('a boss\'s death wipes bullets inside the near band without a near miss', () => {
  const w = bossWorld('mothership');
  bulletAt(w, w.ship.x - 25, w.ship.y);
  step(w);
  assert.equal(w.bullets[0].near, 25, 'it is in the band');
  leave(w, ['eye'], 1);
  shotOn(w, part(w, 'eye'));
  step(w);
  const ev = drain(w);
  assert.equal(ofType(ev, 'bossDeath').length, 1);
  assert.equal(w.bullets.length, 0);
  assert.equal(ofType(ev, 'nearMiss').length, 0);
});

test('Ronin Moon: a shuriken cut inside the near band is no near miss', () => {
  const w = playing(level([wave()], 0, { twist: 'shuriken' }));
  const { x, y } = w.ship;
  w.bullets.push({ pattern: 'shuriken', x, y: y - 35, vx: 0, vy: 0, r: 18, life: 6 }); // band 38, hit 32
  step(w);
  assert.equal(w.bullets[0].near, 35, 'it is in the band');
  w.shots.push({ pattern: 'shot', x, y: y - 5, vx: 0, vy: -1400, r: 5, life: 1, dmg: 1 });
  step(w);
  const ev = drain(w);
  assert.equal(ofType(ev, 'cut').length, 1);
  assert.equal(ofType(ev, 'nearMiss').length, 0);
});

test('Ronin Moon: a shot that cuts a shuriken on the ship saves the ship on that very tick', () => {
  const w = playing(level([wave()], 0, { twist: 'shuriken' }));
  const { x, y } = w.ship;
  w.bullets.push({ pattern: 'shuriken', x, y: y - 30, vx: 0, vy: 0, r: 18, life: 6 }); // 30 < 18 + 14
  w.shots.push({ pattern: 'shot', x, y, vx: 0, vy: -1400, r: 5, life: 1, dmg: 1 });
  step(w);
  const ev = drain(w);
  assert.equal(ofType(ev, 'cut').length, 1);
  assert.equal(ofType(ev, 'shipHit').length, 0);
  assert.equal(w.ship.lives, 3);
});

const fight = (kind) => {
  const w = createWorld(bossLevel(kind, 0, { seed: 5 }), 5);
  w.ship.invuln = Infinity;
  return w;
};

test('a destroyed part launches no minions; a live one still does', () => {
  const w = fight('mothership'); // its last phase: grunts from the eye, a carrier from the dome
  leave(w, ['gunL', 'gunR', 'eye'], 5); // the dome is gone
  const seen = new Set();
  for (let i = 0; i < 60 * 45; i++) {
    stepWorld(w, TICK, IDLE);
    w.events.length = 0;
    for (const a of w.aliens) seen.add(a.role);
  }
  assert.deepEqual([...seen], ['grunt']);
});

test('gunner minions shoot at the ship', () => {
  const w = createWorld(levelById('w6-5'));
  w.ship.invuln = Infinity;
  leave(w, ['core', 'lensL', 'lensR', 'nodeL', 'nodeR', 'halo'], 3);
  const shots = [];
  for (let i = 0; i < 60 * 40 && !shots.length; i++) {
    stepWorld(w, TICK, IDLE);
    const gunners = new Set(w.aliens.filter((a) => a.minion && a.role === 'gunner').map((a) => a.id));
    shots.push(...w.events.filter((e) => e.type === 'fire' && e.side === 'enemy' && gunners.has(e.id)));
    w.events.length = 0;
  }
  assert.ok(shots.length > 0, 'a gunner minion fired');
  assert.equal(shots[0].role, 'gunner');
});

// A gunner minion held `dy` px above the ship (negative: below it) for 20 s: how often it fires.
function minionShots(dy) {
  const w = createWorld(levelById('w6-5'));
  w.ship.invuln = Infinity;
  while (w.state !== 'play' || w.boss.enter > 0) stepWorld(w, TICK, IDLE);
  const m = { id: 999, role: 'gunner', x: 0, y: 0, hp: 2, maxHp: 2, slot: null, mode: 'dive', t: 0, dive: null, minion: true, vx: 0 };
  w.aliens.push(m);
  let n = 0;
  for (let i = 0; i < 60 * 20; i++) {
    Object.assign(m, { x: w.ship.x + 40, y: w.ship.y - dy, hp: 2 });
    stepWorld(w, TICK, IDLE);
    n += w.events.filter((e) => e.type === 'fire' && e.id === 999).length;
    w.events.length = 0;
  }
  return n;
}

test('a gunner minion holds its fire inside 180 px of the ship, and once it is below the ship', () => {
  assert.ok(minionShots(400) > 0, 'it fires from afar');
  assert.equal(minionShots(150), 0, 'not point blank');
  assert.equal(minionShots(-60), 0, 'not from below');
});

test('Iron Dawn: an armored alien shot down mid-dive stands up at its wreck and flies home, no snap', () => {
  const w = playing(level([wave({ roles: ['armored'], cols: 3 })], 0, { twist: 'reassemble' }));
  w.ship.x = 1700; // out of the way of the swoop
  const a = w.aliens[0];
  Object.assign(a, { mode: 'dive', t: 0, dive: { fx: a.x, fy: a.y, ax: a.x, ay: 900 } });
  seconds(w, 0.8);
  a.hp = 1;
  shotAt(w, a);
  step(w);
  assert.equal(w.wrecks.length, 1);
  const wreck = { x: w.wrecks[0].x, y: w.wrecks[0].y };
  assert.ok(wreck.y > 400, `it fell low on its dive (y ${wreck.y.toFixed(0)})`);
  let back = null;
  for (let i = 0; i < 200 && !back; i++) {
    step(w);
    back = w.aliens.find((x) => x.reborn);
  }
  assert.ok(back, 'it stood up');
  assert.equal(back.mode, 'return');
  assert.ok(Math.hypot(back.x - wreck.x, back.y - wreck.y) < 1, 'where the wreck lay');
  let jump = 0;
  for (let i = 0; i < 120 && back.mode !== 'hold'; i++) {
    const [x, y] = [back.x, back.y];
    step(w);
    jump = Math.max(jump, Math.hypot(back.x - x, back.y - y));
  }
  assert.equal(back.mode, 'hold', 'back in the formation');
  assert.ok(jump < 25, `the largest step home was ${jump.toFixed(1)} px`);
  assert.ok(back.y < 400, 'in its slot at the top');
});
