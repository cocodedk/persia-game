import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installCanvas, sink } from './dom-kit.js';

// drawShip against a context that records the alpha of every sprite it draws: while the ship blinks
// (invulnerable, every other 1/14 s) nothing of it, the engine flames included, burns at full alpha.
installCanvas();
const { drawShip } = await import('../../src/ui/ship-view.js');
const { LOOKS } = await import('../../src/ui/looks/index.js');

function alphas(t) {
  const seen = [];
  const ctx = new Proxy({ globalAlpha: 1 }, {
    get: (o, k) => (k in o ? o[k] : k === 'drawImage' ? () => seen.push(o.globalAlpha) : () => sink),
    set: (o, k, v) => ((o[k] = v), true),
  });
  const ship = { alive: true, lives: 2, invuln: 1, x: 960, y: 900, vx: 300, vy: -600, power: null };
  drawShip(ctx, { ship }, LOOKS[0], t);
  return seen;
}

test('the engine flames blink with the ship', () => {
  const blinking = alphas(0); // floor(0 * 14) is even: the dim half of the blink
  assert.ok(blinking.length > 4, 'flames, wake and lights drawn');
  assert.ok(Math.max(...blinking) <= 0.3 + 1e-9, `brightest sprite ${Math.max(...blinking)}`);
  const lit = alphas(0.1); // the bright half
  assert.ok(Math.max(...lit) >= 0.9, 'between blinks the flames burn as ever');
});
