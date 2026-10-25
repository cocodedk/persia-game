# Persia level 7 implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A seventh level, no harder to survive than the sixth: five waves numbered ۳۱ to ۳۵ under the Milad Tower in Tehran at night, a giant horse as the boss, the blood moon turning white from wave 33 with its word ماه, and the HUD's score label in Persian (امتیاز).

**Architecture:** Level 7 goes into the seams level 6 used: a level in `LEVELS`, a boss in `BOSS_DEFS` and `BOSS_ART`, a landmark painter in `PAINTERS`, and the moon as a fourth kind in the `WEATHER` table, drawn in the sky phase as the stars are. The score label is a new `persian` part with its word in the pack's `hud`, as the wave line's was.

**Tech Stack:** Plain ES modules, Canvas 2D, `node:test`; no dependencies and no build.

**Spec:** `docs/superpowers/specs/2026-10-24-persia-design.md` (its "Level 7 specification" section).

**Execution:** Opus drives and reviews; Sonnet agents implement one task each. Tasks 1, 2 and 3 run in parallel in worktrees; 4 and then 5 follow on `main`. Task 5 waits for Babak's approval of clips 32 to 35.

## Global Constraints

- Every code file under 200 lines; Conventional Commits; never `--no-verify`.
- `src/core` and `src/fx` stay pure: no DOM, canvas, `Math.random` or `Date.now`.
- No Persian word, digit or separator in code outside `src/data/pack.js`; tests build Persian strings from the pack.
- Persian code points only; the pack test covers every new string; Persian a player reads goes through `humanizer-pa`.
- Clips come in through `scripts/lift-clips.mjs <lessons repo>` (its `NAMES` table), only approved IDs; the manifest keeps every other entry byte-identical, gains exactly six (mah in Task 3, the five numbers in Task 5), and has its 21 to 29 entries replaced by the re-recorded clips (Task 5).
- Every export is used (`test/repo-dead.test.js`); band heights are multiples of `PIXEL`.
- Levels 1 to 6, their six giants and six landmarks, and the baked sky stay pixel-identical (hash the bakes before and after); the rain, the stars and the petals fall exactly as before.
- Visual work follows `frontend-design` and is judged from screenshots; `simplify` runs at the end.

## Review Focus

1. The moon's word is said once, after wave 33's number and species, only in level 7; levels 4 to 6 still say their weather once at their wave; a retry says each again. Task 5 folds level 7 into the weather loop in `voice-queue.test.js`.
2. The white moon sits exactly over the red one's centre, the clouds still cross it, its blocks are on the sky's pixel grid once it has settled, and twinkles and shooting stars outside it are untouched. Task 3 screenshots it before, mid-fade and settled.
3. The Persian score label sits where SCORE sat, its letters joined, reading right to left, not crowding the score under it; levels 1 to 6 keep SCORE. Task 4 screenshots both.
4. Seven cards fit side by side in one row at 1920 x 1080 and in a 1280 x 720 window, each place name on one line, arrows and Enter working, the Milad Tower's pod visible on its card. Task 5 screenshots both sizes.
5. Level 7 never overwhelms (Babak, 2026-10-25: the game is for relaxing and learning; enemies may shoot but never overwhelm): no more gunners than level 6, level 6's `d` and speeds, the horse's attacks and rates the dog's. Task 5 tests the counts; Task 2 copies the dog's phases unchanged.

Shooting stars and twinkles draw before the weather's sky phase, so they pass behind the white disc, as behind a real moon; accepted.
6. The giant horse's plates sit where its ears and forelock are drawn (every armour hit box matches its art), and its eyes and muzzle can be reached from below. Task 2 checks each part's box against the drawing.

---

### Task 0: Baselines (Opus)

- [x] Hash the sky bake, the layer bakes of all six landmarks and the bakes of all six giants on `main` before any task lands.

### Task 1: The Milad Tower at night

**Files:** create `src/ui/landmarks/milad.js` (split into `milad-tower.js` and `milad-city.js` as Yazd split, keeping each under 200 lines); modify `src/ui/parallax-shapes.js` (`PAINTERS.milad`), `src/ui/looks/persia.js` (`landmarks.milad`, and the header names it).

- [x] The painter follows `azadi.js` and `yazd.js`: block helpers from `landmarks/kit.js`, tones from its look entry (start from Azadi's `tower`/`towerLit`, `glow`, `lamp`, plus a red for the mast's lights), lights pushed for lamps and the mast's blinking reds.
- [x] The tower at the layer's centre, the tallest thing on screen: a broad octagonal base a few storeys high, the slim concrete shaft tapering up from it, the pod near the top (wider than the base, its underside flaring out to bands of lit windows, a narrower open deck above, a small dome on top), then the slim mast, its tip near y 200 on screen. The pod's middle near y 560 on screen so it shows on the title card. Round its foot, the city low across the whole width: blocks and a few taller towers at several heights with lit windows, and a highway's lamps in a line in front. The layer's `height` is what the tower needs, a multiple of `PIXEL`, with `haze: 0.08` (the default for so tall a band mists the pod and mast).
- [x] Screenshot the backdrop alone, its title-card crop (x 480, y 480, w 960, h 600; the pod inside it) and a wave over it; the six earlier landmarks and the sky hash as in Task 0.
- [x] Commit `feat(ui): the Milad Tower at night, level 7's backdrop`.

### Task 2: The giant horse

**Files:** `src/core/bosses-data.js` (`giantHorse`, added to `BOSS_DEFS`), create `src/ui/bosses/giant-horse.js`, `src/ui/bosses/bake.js` (`BOSS_ART`); tests `test/core/boss-data.test.js`, `test/core/boss-kit.js`.

- [x] `giantHorse = boss('giant-horse', 'Giant Horse', 'horse', 270, { w: 640, h: 300 }, …)`. Plates: `earL`, `earR` (pointed, upright, at the top of the head) and `forelock` (the tuft of mane between them, over the brow); weak: `eyeL`, `eyeR` (wide-set at the sides of the long face) and `mouth` (the muzzle with its flared nostrils, at the bottom). The dog's part hp (plates 6, 6, 8; weak 44, 44, 70). Three phases with the dog's attacks and rates, `horse` minions from the mouth and a `rabbit` from the forelock in every phase. Every part's box covers what is drawn for it, no wider, and passes the boss tests' reach and R28 rules. Keep the def's comment to three lines so `bosses-data.js` stays under 200; a test beside the dog's checks the horse's species, its parts and the rabbit in every phase, and the first test's explicit list of kinds gains `'giant-horse'`.
- [x] `test/core/boss-kit.js` `realLevel`: `LEVELS.find((l) => l.boss === kind) ?? LEVELS.at(-1)`, until Task 5 gives a level the horse.
- [x] The art follows `giant-dog.js` and `bosses/kit.js` (its `spine`/`spineAt`) and the small horse sprite in `src/ui/aliens/`, so it reads as the same animal: its coat colour (`palette.alien.horse`), a long face narrowing to the muzzle, a pale blaze down the middle, the dark forelock, the pointed ears, red brows angled down, dark flared nostrils over the open mouth; rage lights it amber then red as the others. Its top stays clear of the HUD (R28 on what is drawn).
- [x] Screenshot it through its phases with a temporary, uncommitted level edit pointing a level's `boss` at it; the six earlier giants hash as in Task 0.
- [x] Commit `feat: the giant horse, level 7's boss`.

### Task 3: The moon, a fourth weather

**Files:** create `src/ui/moon.js`; modify `src/ui/sky-bodies.js` (export what the moon needs), `src/ui/weather.js` (`WEATHER.moon`), `src/data/pack.js` (`weather.moon`), `scripts/lift-clips.mjs` (`vocabulary-3-mah` as `mah`), `public/audio/`; tests a moon test, `test/data/pack.test.js`, `test/ui/weather.test.js`.

- [x] Pack `weather.moon`: `{ word: 'ماه', say: 'mah', clip: 'public/audio/mah.mp3', ms }`, `ms` from the approved record; the manifest gains this one entry.
- [x] `sky-bodies.js`: export the red moon's centre and radius as data and a `clouds(g)` painter (the strokes, their colours and seeds in one place), and `redmoon` uses both, so the moon draws over exactly what the sky baked; the sky bake hashes as in Task 0.
- [x] `drawMoon(ctx, k, t, quality, reduced)` in `moon.js`: one sprite baked once (`cached`, then `pixelate(g.canvas)`): the opaque disc only, a white full moon (pale blue-grey mottles, the sky-paint `moon()` helper) about 22% larger than the red one, with `clouds(g)` drawn over it clipped to the disc. `pixelate` binarises alpha, so the sprite holds no halo: the halo is drawn live under it each frame with `addGlow(ctx, glow('#ffffff'), x, y, r, a * k)`, as `redmoon` draws the red one. The sprite is square, its side a multiple of `2 * PIXEL`, drawn at scale 1 with its top left at the moon's centre less half the side (both coordinates multiples of 8), and `clouds` is translated by that origin when baked, so the settled blocks sit on the sky's grid. Drawn with alpha `k`; the scale eases from the red moon's size to 1 with `k` (`imageSmoothingEnabled = false` round the scaled draw), and stays 1 under reduced motion. Quality does not change it. `WEATHER.moon = ['sky', drawMoon]`.
- [x] Comments: `weather.js`'s header, `levels.js`'s weather line and `pack.js`'s weather line name four kinds.
- [x] Tests: `drawMoon` draws nothing at `k` 0, and at `k` 1 the halo and the disc centred on the moon; the drawn size at `k` 1 is the same with `reduced` true or false, and at `k` 0.5 it is smaller unless `reduced`; in `weather.test.js`, with a probe level and counting `drawImage` (its `drawn()` counts `moveTo`, which a sprite never makes): two in `'sky'` at `k` 1 (halo and disc), none in `'field'`, none before wave 3, two at the giant; the size assertions read the disc's `drawImage` width; a wave event with `weather: 'moon'` says the moon line after the species.
- [x] Screenshot, with a temporary uncommitted edit giving level 6 `weather: { kind: 'moon', from: 3 }`, wave 28's word moment, the moon mid-fade and settled with a wave in play; level 5's stars and level 6's petals unchanged.
- [x] Commit `feat: the moon turns white, a weather the voice names mah`.

### Task 4: The score label in Persian

**Files:** `src/data/pack.js` (`hud.score`), `src/core/levels.js` (the header names the `'scoreWord'` part), `src/ui/hud.js` (`score()`), `src/ui/hud-kit.js` (`word()` takes an `align`); tests `test/ui/format.test.js`, `test/core/levels.test.js`.

- [x] Pack `hud: { wave: 'موج', score: 'امتیاز' }` (through `humanizer-pa`); the word-rule test already checks `Object.values(PACK.hud)`.
- [x] `hud-kit.js`: `word(ctx, s, x, y, size, color, align = 'center')`, setting `ctx.textAlign = align`; existing callers unchanged.
- [x] `hud.js` imports `PACK` from `'../data/pack.js'`. `score()`: `showsPersian(world.level, 'scoreWord') ? word(ctx, PACK.hud.score, 56, CAP, size, 'rgba(255,255,255,0.62)', 'left') : label(ctx, 'SCORE', 56, CAP)`, starting at 18px (20 would touch the 46px number under it), judged from a screenshot. `format.js`'s header list of parts gains `'scoreWord'`.
- [x] Tests: `levels.test.js` `known` gains `'scoreWord'`; `format.test.js`'s `word()` test also checks a passed `align` reaches `textAlign` and the default stays `'center'`.
- [x] Screenshot the HUD with a probe level that has `'scoreWord'`, and level 6's HUD unchanged.
- [x] Commit `feat(ui): a level can name its score in Persian`.

### Task 5: Level 7 and waves thirty-one to thirty-five

Babak approves the re-recorded composed numbers in the lessons repo first. Babak heard the 32 to 35 drafts say "si va do"; Piper read every composed number's و as "va", the approved 21 to 29 and 31 included. On 2026-10-25 he chose to fix it in the lessons repo's number builder (the synthesis text marks the ten with a damma, `سیُ دو`, so the voice says "si-o-do"; the written form keeps و) and to re-record all twenty of its composed numbers.

**Files:** `src/core/levels.js` (`LEVEL_7`), `src/data/pack.js` (numbers 31 to 35), `scripts/lift-clips.mjs`, `public/audio/`; tests as level 6's.

- [ ] `LEVEL_7`: `id 'level-7'`, `name 'Level 7'`, `place 'Milad Tower'`, `seed: 72269`, `d: 0.45` (level 6's), `boss 'giant-horse'`, `landmark 'milad'`, `persian` level 6's plus `'scoreWord'`, `weather: { kind: 'moon', from: 3 }`. Waves at level 6's speeds, two species each (`levels.test.js` checks it): 31 `w('grid', 6, 'hhdd', 'aimed', 1.2)` (horses over dogs), 32 `w('escort', 3, 'orro', 'aimed', 1.2)`, 33 `w('dive', 10, 'bbmm', 'fan', 1.25)` (birds and mice swoop, and the moon turns white), 34 `w('sway', 6, 'hhf', 'fan', 1.3)` (two rows of horses over the fish: the gunners), 35 `w('spiral', 10, 'ccdd', 'ring', 1.4)` (forty cats and dogs). All eight animals; four rows of horses, where no level before had more than two, and 30 gunner aliens, under level 6's 32. The game relaxes and teaches: no harder to survive than level 6.
- [ ] Pack numbers 31 to 35: `say` `si-o-yek`, `si-o-do`, `si-o-se`, `si-o-chahar`, `si-o-panj`; `ms` from the approved records; clips from `counting-2199-tal-31` to `-35`. The manifest gains five. Re-lift 21 to 29 from their re-recorded approvals: the same files and `say` names, new audio, the pack's `ms` and the manifest's entries for them updated; levels 5 and 6 then say "bist-o-…".
- [ ] `test/core/boss-kit.js` `realLevel`: drop Task 2's `?? LEVELS.at(-1)`.
- [ ] Seven cards: the row already shrinks them, but at 1280 x 720 a card has about 137 px for text and "Tomb of Cyrus" in 1.25rem bold needs about 145, so expect to trim `.card-place` (to about 1.1rem) until every place name holds one line; screenshot 1920 x 1080 and 1280 x 720.
- [ ] Tests that change or grow:
  - `test/core/weather.test.js`: `KIND` gains `'level-7': 'moon'`; the level/kind pairs gain `[LEVELS[6], 'moon']`.
  - `test/ui/levels-flow.test.js`: level 6's results offer `['Next', 'Again', 'Title']`, level 7's `['Again', 'Title']`; `started` gains `LEVELS[6]`; the first waves gain 31; the parade walks all eight in level 7.
  - `test/core/levels.test.js`: wave numbering 31 and 35; a level 7 test, `horses(LEVEL_7) > 2 && LEVELS.slice(0, 6).every((l) => horses(l) <= 2)` (rows), `gunners(LEVEL_7) <= gunners(LEVEL_6)` (aliens whose `SPECIES` role is `'gunner'`, rows times `cols`), `LEVEL_7.d === LEVEL_6.d` and each wave's `speed` at or under level 6's same wave, its giant's species `'horse'`; `LEVEL_7.persian` deepEquals `[...LEVEL_6.persian, 'scoreWord']`; level 7's giant sends a rabbit every phase.
  - `test/ui/voice-queue.test.js`: the weather loop covers level 7; the first-wave test gains level 7 saying ۳۱ then horse and dog.
  - The autopilot clears level 7 and survives its first 60 s, as the level 6 test.
- [ ] Play it at `?debug&level=7&auto`: the word moments, the moon turning, the horse's fight with its Persian bar, امتیاز over the score, the victory card with LEVEL ۷.
- [ ] Commit `feat: level 7, the giant horse and waves thirty-one to thirty-five`.

### Task 6: Finish (Opus)

- [ ] `simplify` over the level; apply what holds.
- [ ] README, `llms.txt`, the page's descriptions and the Open Graph tagline go from six levels to seven (through `humanizer`); re-render `og.png` headed; CLAUDE.md's scope line.
- [ ] Advisor review of the branch; apply what holds.
- [ ] Memory: the state note, `landmark-backdrops`, a `level-7-decisions` note; `zg index` in `memory/`.
- [ ] `npm test`, push `main`, check CI and Pages with `gh run list`.
