import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inColumn } from '../../src/core/damage.js';
import { FIRE, input, step, seconds, drain, ofType, bulletAt } from './world-kit.js';
import { bossWorld, part, shotOn, leave } from './boss-kit.js';

test('the laser beam burns a weak part for 8 a second and an armour plate for 2', () => {
  const w = bossWorld('mothership');
  w.ship.power = { kind: 'laser', left: 10 };
  const [gun, wing] = ['gunL', 'wingL'].map((id) => part(w, id));
  for (const [p, per] of [[gun, 8], [wing, 2]]) {
    const before = p.hp;
    for (let i = 0; i < 30; i++) {
      w.ship.x = p.x;
      step(w, 1, FIRE);
    }
    assert.ok(Math.abs(before - p.hp - per * 0.5) <= per / 8 + 1e-9, `${p.id} lost ${before - p.hp}`);
  }
});

test('the beam and the bomb only reach what is on screen: inColumn needs y >= 0', () => {
  assert.equal(inColumn({ x: 100, y: -5 }, 100, 13), false);
  assert.equal(inColumn({ x: 100, y: 5 }, 100, 13), true);
  assert.equal(inColumn({ part: true, x: 100, y: -5, w: 80, h: 40 }, 100, 13), false);
  assert.equal(inColumn({ part: true, x: 140, y: 5, w: 80, h: 40 }, 100, 13), true, 'a part is as wide as it is');
  assert.equal(inColumn({ part: true, x: 160, y: 5, w: 80, h: 40 }, 100, 13), false);
});

test('bossDeath comes exactly once even when the laser and a bomb land on the same tick', () => {
  const w = bossWorld('mothership');
  leave(w, ['eye', 'gunL'], 1);
  w.ship.power = { kind: 'laser', left: 10 };
  w.ship.bombs = 1;
  w.ship.x = part(w, 'gunL').x;
  step(w, 1, input({ fire: true, bomb: true }));
  step(w, 5, FIRE);
  const ev = drain(w);
  assert.equal(ofType(ev, 'bossDeath').length, 1);
  assert.equal(w.score, 10000, 'the boss is worth 10 000');
  assert.equal(w.boss.hp, 0);
});

test('death: bullets and minions vanish, a destruction chain plays, then the level is cleared', () => {
  const w = bossWorld('mothership');
  bulletAt(w, 500, 500, 0, 100);
  w.aliens.push({ id: 99, role: 'grunt', x: 100, y: 100, hp: 1, slot: null, mode: 'dive', t: 0, dive: null, minion: true });
  leave(w, []);
  step(w);
  assert.equal(w.bullets.length, 0);
  assert.equal(w.aliens.length, 0);
  assert.equal(w.state, 'play');
  const early = drain(w);
  assert.deepEqual(ofType(early, 'bossDeath').map((e) => e.kind), ['mothership']);
  seconds(w, 1.5);
  assert.equal(w.state, 'play', 'the chain is long');
  assert.ok(ofType(drain(w), 'explode').length >= 6, 'staggered blasts');
  seconds(w, 2);
  const ev = drain(w);
  assert.equal(w.state, 'cleared');
  assert.equal(ofType(ev, 'cleared').length, 1);
  const booms = ofType(ev, 'explode');
  assert.equal(Math.max(...booms.map((e) => e.size)), 3, 'a finale');
  assert.equal(booms.filter((e) => e.size === 3).length, 1);
});

test('a boss killed on the tick a bullet reaches the ship wipes that bullet: no life is lost', () => {
  const w = bossWorld('mothership');
  w.ship.lives = 1;
  bulletAt(w, w.ship.x, w.ship.y);
  leave(w, ['eye'], 1);
  shotOn(w, part(w, 'eye'));
  step(w);
  assert.equal(w.ship.lives, 1);
  seconds(w, 4);
  assert.equal(w.state, 'cleared');
});

test('with the ship out of lives and the boss alive, the level is failed', () => {
  const w = bossWorld('mothership');
  w.ship.lives = 1;
  bulletAt(w, w.ship.x, w.ship.y);
  step(w);
  assert.equal(w.state, 'failed');
});
