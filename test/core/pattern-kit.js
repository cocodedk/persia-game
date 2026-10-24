import { createRng } from '../../src/core/rng.js';
import { angleTo } from '../../src/core/math.js';
import { emitPattern } from '../../src/core/patterns.js';

// Shared by the pattern tests: one emitter, one target, and a few angle helpers.
export const FROM = { x: 600, y: 300 };
export const TARGET = { x: 1200, y: 900 };
export const AIM = angleTo(FROM, TARGET);
export const P = { speed: 400 };
export const heading = (b) => Math.atan2(b.vy, b.vx);
export const speedOf = (b) => Math.hypot(b.vx, b.vy);
export const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a)); // an angle folded into -PI..PI
export const emit = (pattern, p = P, seed = 1) => emitPattern(pattern, FROM, TARGET, p, createRng(seed));
