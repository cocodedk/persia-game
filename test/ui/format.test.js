import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PACK } from '../../src/data/pack.js';
import { LEVEL, LEVELS } from '../../src/core/levels.js';
import { bossDef } from '../../src/core/bosses-data.js';
import { fmt, localDigits, scoreText, hudLabel, waveText, levelName, localText, bossName } from '../../src/ui/format.js';
import { FONT, word } from '../../src/ui/hud-kit.js';

const D = PACK.digits; // the expected strings are built from the pack, so no Persian enters a test

test('fmt groups thousands and rounds', () => {
  assert.equal(fmt(12345.6), '12,346');
});

test('localDigits writes each digit in the given ten', () => {
  assert.equal(localDigits(10, D), D[1] + D[0]);
  assert.equal(localDigits(7, '0123456789'), '7');
  assert.equal(localDigits('+10 BONUS', D), `+${D[1]}${D[0]} BONUS`, 'anything else is kept');
});

test("level 1 counts its waves in ASCII; level 2 counts on from six in the pack's digits", () => {
  assert.equal(waveText(LEVEL, 0), 'WAVE 1 / 5', 'before the first wave it already shows wave 1');
  assert.equal(waveText(LEVEL, 3), 'WAVE 3 / 5');
  assert.equal(waveText(LEVELS[1], 1), `WAVE ${D[6]} / ${D[1]}${D[0]}`);
  assert.equal(waveText(LEVELS[1], 5), `WAVE ${D[1]}${D[0]} / ${D[1]}${D[0]}`);
});

test("a level with 'waveWord' leads its wave count with the pack's word, as level 6 does; levels 1 to 5 keep WAVE n / m", () => {
  assert.equal(waveText(LEVELS[5], 1), `${PACK.hud.wave} ${D[2]}${D[6]} / ${D[3]}${D[0]}`);
  assert.equal(waveText({ ...LEVELS[5], persian: ['waveWord'] }, 1), `${PACK.hud.wave} 26 / 30`, 'the word and the digits are separate parts');
  for (const level of LEVELS.slice(0, 5)) assert.ok(waveText(level, 1).startsWith('WAVE '), level.id);
});

test("levels 1 and 2 keep the score in ASCII; level 3 writes it in the pack's digits and grouping", () => {
  assert.equal(scoreText(LEVEL, 146800), '146,800');
  assert.equal(scoreText(LEVELS[1], 146800), '146,800');
  assert.equal(scoreText(LEVELS[2], 146800), `${D[1]}${D[4]}${D[6]}${PACK.group}${D[8]}${D[0]}${D[0]}`);
  assert.equal(scoreText(LEVELS[2], 0), D[0]);
  assert.equal(scoreText(LEVELS[2], 1234567.4), `${D[1]}${PACK.group}${D[2]}${D[3]}${D[4]}${PACK.group}${D[5]}${D[6]}${D[7]}`);
});

test("a level with 'scoreWord' labels its score with the pack's word; the others say SCORE", () => {
  assert.deepEqual(hudLabel(LEVELS[6], 'score'), { text: PACK.hud.score, persian: true });
  assert.deepEqual(hudLabel(LEVELS[5], 'score'), { text: 'SCORE', persian: false }, 'level 6 has the score digits but not the word');
});

test("a level with 'bombsWord' labels its bombs with the pack's word; the others say BOMBS", () => {
  assert.deepEqual(hudLabel(LEVELS[7], 'bombs'), { text: PACK.hud.bombs, persian: true });
  for (const level of LEVELS.slice(0, 7)) assert.deepEqual(hudLabel(level, 'bombs'), { text: 'BOMBS', persian: false }, level.id);
});

test("a level with 'livesWord' labels its lives with the pack's word; the others say LIVES", () => {
  assert.deepEqual(hudLabel(LEVELS[8], 'lives'), { text: PACK.hud.lives, persian: true });
  for (const level of LEVELS.slice(0, 8)) assert.deepEqual(hudLabel(level, 'lives'), { text: 'LIVES', persian: false }, level.id);
});

test("a level with 'comboWord' labels its combo with the pack's word; the others say COMBO", () => {
  assert.deepEqual(hudLabel(LEVELS[9], 'combo'), { text: PACK.hud.combo, persian: true });
  for (const level of LEVELS.slice(0, 9)) assert.deepEqual(hudLabel(level, 'combo'), { text: 'COMBO', persian: false }, level.id);
});

test("level 4 names itself and counts its combo in the pack's digits; levels 1 to 3 in ASCII", () => {
  assert.deepEqual(LEVELS.slice(0, 3).map(levelName), ['Level 1', 'Level 2', 'Level 3']);
  assert.equal(levelName(LEVELS[3]), `Level ${D[4]}`);
  assert.equal(localText(LEVELS[3], 'combo', '×8'), `×${D[8]}`);
  assert.equal(localText(LEVELS[2], 'combo', '×8'), '×8');
});

test("a level with 'boss' names its giant by its species' word in the pack; the others by its English name", () => {
  const bird = bossDef('giant-bird');
  const named = { ...LEVELS[3], persian: [...LEVELS[3].persian, 'boss'] };
  assert.equal(bossName(named, bird), PACK.species.find((s) => s.id === 'bird').word);
  assert.equal(bossName(LEVELS[3], bird), 'GIANT BIRD');
  for (const level of LEVELS.slice(0, 4)) {
    assert.ok(!level.persian.includes('boss'), level.id);
    assert.equal(bossName(level, bossDef(level.boss)), bossDef(level.boss).name.toUpperCase(), level.id);
  }
});

test('word sets a whole word in the pack face in one fillText, with no letter spacing, in the pack direction', () => {
  const calls = [];
  const ctx = { fillText: (...a) => calls.push([...a, ctx.direction]), letterSpacing: '3px' };
  word(ctx, 'abc', 960, 38, 22, '#fff');
  assert.equal(ctx.font, `${PACK.font.weight} 22px "${PACK.font.family}", sans-serif`);
  assert.equal(ctx.letterSpacing, '0px');
  assert.equal(ctx.textAlign, 'center');
  assert.deepEqual(calls, [['abc', 960, 38, PACK.dir]]);
  assert.equal(ctx.direction, 'inherit', 'the next text is set as before');
  word(ctx, 'abc', 56, 38, 18, '#fff', 'left');
  assert.equal(ctx.textAlign, 'left', 'a passed align reaches textAlign');
});

test("the HUD and the screens set numbers in the pack's digits face first", () => {
  assert.ok(FONT.startsWith(`"${PACK.font.digits}", `), FONT);
  const css = readFileSync(new URL('../../src/ui/css/base.css', import.meta.url), 'utf8');
  assert.ok(css.includes(`--display: "${PACK.font.digits}", `), 'the screens\' display face');
  assert.ok(css.includes(`--font: "${PACK.font.digits}", `), 'the screens\' text face');
});
