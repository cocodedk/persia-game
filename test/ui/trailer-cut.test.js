import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cutClips, blooperSpan, timeline, CLIP_TICKS, BOSS_TICKS, BLOOPER_TICKS, cardSecs, FINAL_SECS } from '../../src/ui/trailer/cut.js';

const kill = (tick, mult = 1) => ({ type: 'kill', tick, mult, scored: true });
const clip = (start) => ({ start, end: start + CLIP_TICKS, peak: start + 90, kind: 'combo' });

function wellFormed(clips, ticks) {
  assert.ok(clips.length <= 4);
  for (const [i, c] of clips.entries()) {
    assert.ok(c.start >= 0 && c.start <= c.peak && c.peak <= c.end && c.end <= ticks, JSON.stringify(c));
    assert.ok(c.end - c.start <= (c.kind === 'bossDeath' ? BOSS_TICKS : CLIP_TICKS), JSON.stringify(c));
    if (i) assert.ok(clips[i - 1].end <= c.start, 'in order, never overlapping');
  }
}

test('the highlights are cut to about three seconds each, the boss kill keeps its whole chain', () => {
  const events = [
    kill(300), kill(310), kill(320), // a multi-kill
    { type: 'nearMiss', tick: 1200 }, { type: 'bomb', tick: 2000 },
    { type: 'bossDeath', tick: 3000 }, { type: 'cleared', tick: 3181, stars: 3 },
  ];
  const clips = cutClips(events, 3181);
  wellFormed(clips, 3181);
  assert.deepEqual(clips.map((c) => c.kind), ['multiKill', 'nearMiss', 'bomb', 'bossDeath']);
  const boss = clips[3];
  assert.ok(boss.end - boss.start > CLIP_TICKS, 'the boss clip is longer');
  assert.ok(boss.end >= 3180, 'the destruction chain is in the clip');
  for (const c of clips.slice(0, 3)) assert.equal(c.end - c.start, CLIP_TICKS);
});

test('the last alien sits late in its clip, so the clear plays out after it', () => {
  const clips = cutClips([kill(500), kill(560, 2), { type: 'waveClear', tick: 1999, last: true }], 2000);
  const last = clips.find((c) => c.kind === 'lastAlien');
  assert.equal(last.end, 2000);
  assert.ok(last.peak - last.start > (last.end - last.start) / 2);
});

test('a run with fewer than four moments is filled from other events to four clips', () => {
  const events = [kill(200), kill(900), { type: 'bossPhase', tick: 1600 }, kill(2400), { type: 'waveClear', tick: 3500, last: true }];
  const clips = cutClips(events, 3500);
  wellFormed(clips, 3500);
  assert.equal(clips.length, 4);
  assert.ok(clips.some((c) => c.kind === 'bossPhase'), 'a phase change is a good moment');
});

test('an uneventful run still gets its last seconds; a tiny run its whole length; nothing gives nothing', () => {
  assert.deepEqual(cutClips([], 1000).map(({ start, end }) => [start, end]), [[1000 - CLIP_TICKS, 1000]]);
  assert.deepEqual(cutClips([kill(30)], 100).map(({ start, end }) => [start, end]), [[0, 100]]);
  assert.deepEqual(cutClips([], 0), []);
});

test('the blooper is the last 1.2 s (72 ticks) before the fatal hit (R32)', () => {
  assert.equal(BLOOPER_TICKS, 72);
  const hits = [{ type: 'shipHit', tick: 400, lives: 2 }, { type: 'shipHit', tick: 900, lives: 0 }, { type: 'failed', tick: 900 }];
  assert.deepEqual(blooperSpan(hits, 901), { start: 828, hit: 900 });
  assert.deepEqual(blooperSpan([{ type: 'shipHit', tick: 50, lives: 0 }], 51), { start: 0, hit: 50 });
  assert.deepEqual(blooperSpan([{ type: 'failed', tick: 400 }], 401), { start: 328, hit: 400 }, 'no hit: the failure itself');
  assert.equal(blooperSpan([{ type: 'cleared', tick: 400 }], 401), null);
});

test('the timeline: a cold open, a card between clips, the final card; about twenty seconds', () => {
  const cards = [['A'], ['B'], ['C']];
  const four = timeline([clip(0), clip(400), clip(800), clip(1200)], cards);
  assert.deepEqual(four.map((s) => s.type), ['clip', 'card', 'clip', 'card', 'clip', 'card', 'clip', 'final']);
  assert.deepEqual(four.filter((s) => s.type === 'card').map((s) => s.lines), cards);
  for (const s of four.filter((x) => x.type === 'card')) assert.ok(s.secs >= 1.2 && s.secs <= 1.6, String(s.secs));
  const secs = four.reduce((n, s) => n + (s.type === 'clip' ? (s.end - s.start) / 60 + 0.6 : s.secs), 0);
  assert.ok(secs > 17 && secs < 23, `${secs.toFixed(1)} s`);
  assert.equal(four.at(-1).secs, FINAL_SECS);
  const two = timeline([clip(0), clip(400)], cards);
  assert.deepEqual(two.map((s) => s.type), ['card', 'clip', 'card', 'clip', 'final'], 'an opening card leads a short trailer');
  assert.deepEqual(timeline([], cards).map((s) => s.type), ['card', 'final']);
  assert.ok(cardSecs(['A LONG LONG LONG LONG LONG LONG LONG LINE', 'AND ANOTHER ONE HERE']) <= 1.6);
});
