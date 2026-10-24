import { test } from 'node:test';
import assert from 'node:assert/strict';
import { input, step, drain, ofType } from './world-kit.js';
import { bossWorld, part, leave } from './boss-kit.js';

// A bomb takes 8 % of the boss's max hp as raw damage (no armour rule), shared equally by the live
// parts that can be damaged (weak ones first); what a part cannot take moves on to the next, so the
// total is min(8 % of max hp, what is left to take).
const BOMB = input({ bomb: true });
const close = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg ?? ''} ${a} vs ${b}`);
const bomb = (w) => {
  w.ship.bombs = 1;
  step(w, 1, BOMB);
};
const total = (w) => w.boss.parts.reduce((n, p) => n + p.hp, 0);
const lost = (w, ids) => ids.map((id) => part(w, id).max - part(w, id).hp);

test('a bomb takes exactly 8 % of the boss\'s max hp, shared equally, plates and weak points alike', () => {
  const w = bossWorld('mothership');
  bomb(w);
  close(w.boss.maxHp - w.boss.hp, w.boss.maxHp * 0.08, 'the boss lost');
  const share = (w.boss.maxHp * 0.08) / 6;
  lost(w, ['gunL', 'gunR', 'eye', 'dome', 'wingL', 'wingR']).forEach((l, i) => close(l, share, `part ${i}`));
  const hits = ofType(drain(w), 'hit').filter((e) => e.role === 'boss');
  assert.equal(hits.length, 6);
  assert.ok(hits.every((e) => Math.abs(e.dmg - share) < 1e-9), 'raw damage, whatever the rule');
});

test('a bare hull takes no part of the bomb, and the others share it', () => {
  const w = bossWorld('mothership');
  const dome = Object.assign(part(w, 'dome'), { weak: false, armor: false }); // a bare hull
  bomb(w);
  assert.equal(dome.hp, dome.max);
  close(w.boss.maxHp - w.boss.hp, w.boss.maxHp * 0.08);
  const share = (w.boss.maxHp * 0.08) / 5;
  lost(w, ['gunL', 'gunR', 'eye', 'wingL', 'wingR']).forEach((l) => close(l, share));
});

test('a part with less hp than its share gives the rest to the next, weak parts first', () => {
  const w = bossWorld('mothership');
  const share = (w.boss.maxHp * 0.08) / 6;
  part(w, 'gunL').hp = 0.5;
  const before = total(w);
  bomb(w);
  assert.equal(part(w, 'gunL').hp, 0);
  close(lost(w, ['gunR'])[0], share + (share - 0.5), 'the next weak part took the spill');
  close(lost(w, ['eye'])[0], share);
  close(lost(w, ['dome'])[0], share);
  close(before - total(w), w.boss.maxHp * 0.08, 'all 8 % was dealt');
});

test('what the last parts cannot take goes back to the first that can', () => {
  const w = bossWorld('mothership');
  const share = (w.boss.maxHp * 0.08) / 6;
  for (const id of ['dome', 'wingL', 'wingR']) part(w, id).hp = 0.1;
  const before = total(w);
  bomb(w);
  for (const id of ['dome', 'wingL', 'wingR']) assert.equal(part(w, id).hp, 0);
  close(lost(w, ['gunR'])[0], share);
  close(lost(w, ['gunL'])[0], w.boss.maxHp * 0.08 - 0.3 - 2 * share, 'gunL took what the plates could not');
  close(before - total(w), w.boss.maxHp * 0.08, 'still the full 8 %');
});

test('the bomb deals min(8 % of max hp, what is left): one point left, one point taken, boss dead', () => {
  const w = bossWorld('mothership');
  leave(w, ['eye'], 1);
  bomb(w);
  assert.equal(w.boss.hp, 0);
  assert.equal(ofType(drain(w), 'bossDeath').length, 1);
});

test('with no weak point left the bomb is still raw damage on what stands', () => {
  const w = bossWorld('mothership');
  for (const p of w.boss.parts) if (p.weak) p.hp = 0;
  const before = ['dome', 'wingL', 'wingR'].map((id) => part(w, id).hp);
  bomb(w);
  const share = (w.boss.maxHp * 0.08) / 3;
  ['dome', 'wingL', 'wingR'].forEach((id, i) => close(before[i] - part(w, id).hp, share, id));
});

test('a bomb dropped while the boss is still flying in costs a bomb and hurts nothing', () => {
  const w = bossWorld('mothership');
  w.boss.enter = 1;
  bomb(w);
  assert.equal(w.boss.hp, w.boss.maxHp);
  assert.equal(w.ship.bombs, 0);
});
