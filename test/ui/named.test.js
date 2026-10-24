import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installCanvas, sink } from './dom-kit.js';
import { bossWorld } from '../core/boss-kit.js';

// While a species' name is said its giant lights up too: a soft disc under the hull (not at half
// quality) and a white lift on the hull and every live part, on top of the boss as otherwise drawn.
installCanvas(64);
const { drawBoss } = await import('../../src/ui/bosses/index.js');
const { warmBoss } = await import('../../src/ui/bosses/bake.js');
const { LOOK } = await import('../../src/ui/looks/index.js');

// The images drawBoss draws, on a context that otherwise swallows every call as sink does.
function draws(world, named, q = 1) {
  let n = 0;
  const ctx = Object.assign(Object.create(sink), { drawImage() { n += 1; } });
  drawBoss(ctx, world, LOOK, 1, q, named);
  return n;
}

test('the giant lights up while its species is said, and for no other', () => {
  warmBoss(LOOK, 'giant');
  const world = bossWorld('giant');
  const plain = draws(world, null);
  const live = world.boss.parts.filter((p) => p.hp > 0).length;
  assert.equal(draws(world, 'cat'), plain + 2 + live, 'the disc, the hull lift and one lift per live part');
  assert.equal(draws(world, 'cat', 0.5), plain + 1 + live, 'at half quality, the lifts without the disc');
  assert.equal(draws(world, 'dog'), plain, 'another species leaves it as it was');
});
