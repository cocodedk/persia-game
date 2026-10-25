# Persia level 9 implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A ninth level, no harder to survive than the eighth: five waves numbered ۴۱ to ۴۵ at Gonbad-e Qabus at night, a new animal (the camel, شتر, a gunner) and a giant camel as the boss, the sun rising from wave 43 with its word خورشید, and the HUD's lives label in Persian (جان).

**Architecture:** The seams level 8 used: a level in `LEVELS`, a species in `SPECIES` with its sprite and pack line (as the lion came), a boss in `BOSS_DEFS` (`faceFight`) and `BOSS_ART`, a landmark painter in `PAINTERS`, sunrise as a sixth kind in the `WEATHER` table drawn in the sky phase on top of level 8's dawn, and `'livesWord'` as a `persian` part read through `hudLabel` with its word in the pack's `hud`.

**Tech Stack:** Plain ES modules, Canvas 2D, `node:test`; no dependencies and no build.

**Spec:** `docs/superpowers/specs/2026-10-24-persia-design.md` (its "Level 9 specification" section).

**Execution:** Opus drives and reviews; Sonnet agents implement one task each. Tasks 1, 2 and 5 can start now, in parallel worktrees. Babak approves the six clips in the lessons repo first (drafts on its review page now); then the pack lines of Tasks 2 and 3 and all of Task 6 follow. Task 4 follows 3; 6 follows the rest.

## Global Constraints

- Every code file under 200 lines; Conventional Commits; never `--no-verify`.
- `src/core` and `src/fx` stay pure: no DOM, canvas, `Math.random` or `Date.now`.
- No Persian word, digit or separator in code outside `src/data/pack.js`; tests build Persian strings from the pack.
- Persian code points only; the pack test covers every new string; Persian a player reads goes through `humanizer-pa`.
- Clips come in through `scripts/lift-clips.mjs <lessons repo>` (its `NAMES` table), only approved IDs; the manifest keeps every other entry byte-identical and gains exactly seven: khorshid (Task 2), shotor (Task 3), 41 to 45 (Task 6).
- Every export is used (`test/repo-dead.test.js`); band heights are multiples of `PIXEL`.
- Levels 1 to 8, their eight giants and eight landmarks, and the baked sky stay pixel-identical (the session's Chromium probe hashes `buildSky`, `buildLayers` and `bossArt(...).hull.body`; its level 1 to 8 baseline is from `0ca7f4d`); the HUD of levels 1 to 8 too (the HUD probe, touch and no touch); rain, stars, petals, moon and dawn fall and turn exactly as before.
- Visual work follows `frontend-design` and is judged from screenshots; `simplify` runs at the end.

## Review Focus

1. Sunrise's word is said once, after wave 43's number and species, only in level 9; levels 4 to 8 still say their weather once; a retry says it again. Task 6 folds level 9 into the weather loop in `voice-queue.test.js`.
2. The sun sits in the sky behind the mountains and the landmark, on the 8 px grid, clear of the moon's disc; with reduced motion it stands still; it costs well under a millisecond a frame. Task 2 tests the grid and the stillness, screenshots it and measures it.
3. Nine cards fit side by side at 1920 x 1080 and in a 1280 x 720 window, each place name on one line, the tower's cone on Gonbad-e Qabus's card. Task 6 screenshots both.
4. Level 9 never overwhelms: no more gunners than level 8 (18), no wave with more divers than any earlier wave (40), level 8's `d` and speeds, the camel's fight the lion's. Task 6 tests the counts; Task 4 uses `faceFight`.
5. جان fits the lives panel in its word face without touching the ship icons under it, and LIVES is unchanged in levels 1 to 8. Task 5 screenshots it and runs the HUD probe.

---

### Task 0: Baselines (Opus)

- [x] Bake hashes of the sky, all eight landmarks and all eight giants, and the HUD probe of levels 1 to 8, on `0ca7f4d`.

### Task 1: Gonbad-e Qabus at night

**Files:** create `src/ui/landmarks/qabus.js` (split as Naqsh split, e.g. `qabus-tower.js`, `qabus-park.js`, each under 200 lines); modify `src/ui/parallax-shapes.js` (`PAINTERS.qabus`), `src/ui/looks/persia.js` (`landmarks.qabus`, and the header names it).

- [ ] The painter follows `naqsh.js`: block helpers from `landmarks/kit.js`, the fired brick and its lamps from `yazd-brick.js` (`tones`, `brick`, `lamp`, `light`), tones from its look entry (a paler, yellower brick than Yazd's, a warm floodlight, the park's greens), lights pushed for the lamps.
- [ ] The tower at the layer's centre, about 14 blocks wide: of its ten sharp flanges five show from the front, each a lit edge beside a shaded face, the outer pairs narrower, floodlit from below so the light is brightest low down; the conical brick roof; a pale band of inscription under the roof and another over the tall pointed doorway at its foot; the green mound under it with steps up to the door; round the mound a park of pines and cypresses with lamps, the town's low lit roofs on the plain to either side. The cone's tip inside the title-card crop (x 480, y 480, w 960, h 600, taken on the frame, `landmark-art.js:10`), so the layer's `height` is at most 592, a multiple of `PIXEL`; pin its FAR height in the look as Naqsh did.
- [ ] Screenshot the backdrop alone, its title-card crop and a wave over it; the eight earlier landmarks and the sky hash as in Task 0.
- [ ] Commit `feat(ui): Gonbad-e Qabus at night, level 9's backdrop`.

### Task 2: Sunrise, a sixth weather

**Files:** create `src/ui/sunrise.js`; modify `src/ui/weather.js` (`WEATHER.sunrise`), `src/data/pack.js` (`weather.sunrise`, once خورشید is approved), `scripts/lift-clips.mjs` (`vocabulary-3-khorshid` as `khorshid`), `public/audio/`; tests a sunrise test, `test/data/pack.test.js`, `test/ui/weather.test.js`, `test/ui/voice-queue.test.js` (beside its dawn case, line 77).

**Interfaces:** Consumes `drawDawn(ctx, k)` from `dawn.js` and `MOON` from `sky-bodies.js`. Produces `drawSunrise(ctx, k, _t, _quality, reduced, age)`. `t` is the view's clock (`view.js:8`), not the weather's, so `drawWeather` passes a sixth argument, the weather's age `t - v.weather.since`, which the other kinds ignore.

- [ ] `drawSunrise`: `drawDawn(ctx, k)`, then the sun: a disc of whole `PIXEL` blocks drawn row by row with `fillRect`, a near-white core and a gold rim, a few faint glow rings at low alpha, 12 to 14 blocks in radius so it never rivals the moon's 205 px; right of the tower (the moon sits left at x 640, and a full moon sets opposite the rising sun) and clear of `MOON`'s disc; its centre climbs from below the far mountains' ridge to where about half the disc shows over `RISE` seconds of `age`, then stays; with `reduced` it stands at its last height from the start. Everything times `k`. Constants in `sunrise.js` (`SUN`, `RISE`), as `dawn.js` keeps its own; `SUN` placed provisionally here, and Task 6 checks it on level 9's own backdrop. `WEATHER.sunrise = ['sky', drawSunrise]`.
- [ ] Pack `weather.sunrise`: `{ word: 'خورشید', say: 'khorshid', clip: 'public/audio/khorshid.mp3', ms }`, `ms` from the approved record; the manifest gains this one entry.
- [ ] Comments: `weather.js`'s header, `levels.js`'s weather line and `pack.js`'s weather line name six kinds.
- [ ] Tests: nothing drawn at `k` 0; at `k` 1 every rect of the sun lies on the 8 px grid and outside `MOON`'s disc; with `reduced` two ages draw the same rects, without it the sun is higher at a later age and stops at its height; in `weather.test.js` with a probe level, sunrise draws in `'sky'` only, from wave 3 and at the giant, and gets the weather's age; in `voice-queue.test.js` a wave event with `weather: 'sunrise'` says the sunrise line after the species.
- [ ] Screenshot, with a temporary uncommitted edit giving level 8 `weather: { kind: 'sunrise', from: 3 }`, the word moment, the sun mid-climb and settled with a wave in play; measure `drawSunrise` per frame.
- [ ] Commit `feat: the sun rises, a weather the voice names khorshid`.

### Task 3: The camel

Babak approves شتر in the lessons repo first.

**Files:** `src/core/kinds.js` (`SPECIES.camel = 'gunner'`), `src/core/levels.js` (`LETTER.a`), `src/data/pack.js` (the species line, appended last), `src/ui/aliens/animals.js` (`ROWS.camel`; its header's "nine animals" becomes ten), `src/ui/looks/persia.js` (`palette.alien.camel`), `scripts/lift-clips.mjs` (`vocabulary-5-shotor` as `shotor`), `public/audio/`; tests as the lion's (level 8 plan, Task 3), and `test/core/kinds.test.js:21` (the exact nine) and `test/ui/art.test.js:45` (`length, 9`), which gain the camel.

**Interfaces:** Produces the species id `'camel'`, fighting as `'gunner'`, and its pack line `{ id: 'camel', word: 'شتر', say: 'shotor', clip: 'public/audio/shotor.mp3', ms }`, appended last.

- [x] Change the level tests that say a level brings every species (levels 2 to 8) to "every species but `'camel'`" (they pass before and after); the kinds, art and pack tests are the ones that fail once `SPECIES.camel` exists, until the sprite, palette and pack line land.
- [x] `ROWS.camel`: two frames, at most 11 cells wide, in the legend there: a long sandy face, small ears, heavy lids over dark eyes, lit red brows, a split upper lip; frame 2 spits.
- [x] Screenshot a wave with a camel row (a temporary local edit of level 1's wave 1, not committed) at play size and in the word moment's face.
- [x] `npm test`: all pass. Commit `feat: the camel joins the animals`.

### Task 4: The giant camel

**Files:** `src/core/bosses-data.js` (`giantCamel`, added to `BOSS_DEFS`), create `src/ui/bosses/giant-camel.js`, `src/ui/bosses/bake.js` (`BOSS_ART`); tests `test/core/boss-data.test.js`, `test/core/boss-kit.js`.

- [ ] `giantCamel = boss('giant-camel', 'Giant Camel', 'camel', 270, { w: 640, h: 300 }, parts, faceFight('camel', 'mouth', 'tuft'))`. Plates `earL`, `earR` (small, high at the head's sides) and `tuft` (the shaggy crown between them); weak `eyeL`, `eyeR` and `mouth` (the split-lipped jaws). The lion's part hp (plates 6, 6, 8; weak 44, 44, 70). Every part's box covers what is drawn for it, no wider, and passes the boss tests' reach and R28 rules. The face-on loop in the boss-data tests gains the camel; the explicit list of kinds gains `'giant-camel'`.
- [ ] `test/core/boss-kit.js` `realLevel`: `LEVELS.find((l) => l.boss === kind) ?? LEVELS.at(-1)` until Task 6.
- [ ] The art follows `giant-lion.js` and the small camel sprite, so it reads as the same animal: its sandy coat, the long face narrowing to the muzzle, the shaggy tuft and the small ears, heavy lids and red brows angled down, flared nostrils over the split lip; rage lights it amber then red as the others. Face on, a camel is the giant horse with heavy lids, so what tells it apart is drawn on purpose: the hump's dome behind the head between the ears (drawn, not a part), its top at y ≥ 100, and the small sprite's top rows carry the hump behind the ears too. The coat is a tan judged in one row beside the horse (`#c88a5a`), the dog (`#e8d0a8`) and the lion (`#e8a838`). Its top stays clear of the HUD (R28 on what is drawn).
- [ ] Screenshot it through its phases with a temporary, uncommitted level edit; the eight earlier giants hash as in Task 0.
- [ ] Commit `feat: the giant camel, level 9's boss`.

### Task 5: The lives label in Persian

**Files:** `src/data/pack.js` (`hud.lives`, and its header's `hud` line), `src/core/levels.js` (the header names `'livesWord'`), `src/ui/format.js` (its header: `hudLabel`'s keys gain `'lives'`, `showsPersian`'s parts `'livesWord'`), `src/ui/hud.js` (`stock()`); tests `test/ui/format.test.js`, `test/core/levels.test.js`.

- [ ] Pack `hud.lives: 'جان'` (through `humanizer-pa`).
- [ ] `hud.js` `stock()`: `caption(ctx, world.level, 'lives', x + 24, SCORE_WORD_SIZE)` in place of the LIVES label. جان has an alef as امتیاز does, and `hud.js:27-30` sizes alef words at 18 (24 is for بمب, which has none), so the two labels share the size; judged from a screenshot.
- [ ] Tests: `levels.test.js` `known` gains `'livesWord'`; `format.test.js` `hudLabel(level, 'lives')` gives the pack's word with the part, `{ text: 'LIVES', persian: false }` without it.
- [ ] Screenshot the HUD with a probe level that has `'livesWord'`; the HUD probe of levels 1 to 8 hashes as in Task 0.
- [ ] Commit `feat(ui): a level can name its lives in Persian`.

### Task 6: Level 9 and waves forty-one to forty-five

Babak approves 41, 43, 44 and 45 in the lessons repo first.

**Files:** `src/core/levels.js` (`LEVEL_9`), `src/data/pack.js` (numbers 41 to 45), `scripts/lift-clips.mjs`, `public/audio/`, `src/ui/css/screens.css` (the cards); tests as level 8's.

- [ ] `LEVEL_9`: `id 'level-9'`, `name 'Level 9'`, `place 'Gonbad-e Qabus'`, `seed: 94127`, `d: 0.45`, `boss 'giant-camel'`, `landmark 'qabus'`, `persian` level 8's plus `'livesWord'`, `weather: { kind: 'sunrise', from: 3 }`. Waves at level 8's speeds: 41 `w('grid', 6, 'aacc', 'aimed', 1.2)` (camels over cats), 42 `w('escort', 3, 'orro', 'aimed', 1.2)`, 43 `w('dive', 10, 'bbmm', 'fan', 1.25)` (birds and mice swoop as the sun rises), 44 `w('sway', 6, 'llf', 'fan', 1.3)` (two rows of lions over the fish), 45 `w('spiral', 10, 'ccdd', 'ring', 1.4)` (forty cats and dogs). Nine animals, no horse; 18 gunners, as level 8; at most 40 divers in a wave.
- [ ] Pack numbers 41 to 45: `say` `chehel-o-yek`, `chehel-o-do`, `chehel-o-se`, `chehel-o-chahar`, `chehel-o-panj`; `ms` from the approved records; clips from `counting-2199-tal-41` to `-45`. The manifest gains five.
- [ ] `test/core/boss-kit.js` `realLevel`: drop Task 4's `?? LEVELS.at(-1)`.
- [ ] Nine cards: `base.css:19` makes rem the viewport's, so a card is about 9rem wide at nine in any window. Set `.card-place` to the largest rem size (about 0.95rem) that holds Gonbad-e Qabus on one line in a 9rem card; screenshot 1920 x 1080 and 1280 x 720.
- [ ] The sun on level 9's own backdrop: play wave 43 and move `SUN` (Task 2) until about half the disc shows over the far ridge (the ridge is `makeRng(seed * 101 + i * 7)` at its FAR height, `parallax.js:16-23`; the far layer scrolls at 0.06, so check it across the wave).
- [ ] Tests that change or grow, as level 8's did: `test/core/weather.test.js:30,40` (`'level-9': 'sunrise'`, the pair `[LEVELS[8], 'sunrise']`), `levels-flow.test.js` (level 8 offers Next, level 9 `['Again', 'Title']`, its first wave 41, the parade walks its nine), `levels.test.js` (numbering 41 and 45; every species but `'horse'`; `gunners(LEVEL_9) <= gunners(LEVEL_8)`, every wave's divers at or under the most of any earlier wave, `d` and speeds at or under level 8's; its giant's species `'camel'`; `LEVEL_9.persian` deepEquals `[...LEVEL_8.persian, 'livesWord']`; a rabbit every phase), `voice-queue.test.js` (the weather loop covers level 9; its first wave says ۴۱ then camel and cat), the autopilot clears level 9 and survives its first 60 s.
- [ ] Play it at `?debug&level=9&auto`: the camel's word moment, the sun rising, the camel's fight with شتر on its bar and the camels it sends named, جان on the HUD, the victory card with LEVEL ۹.
- [ ] Commit `feat: level 9, the giant camel and waves forty-one to forty-five`.

### Task 7: Finish (Opus)

- [ ] `simplify` over the level; apply what holds.
- [ ] README, `llms.txt`, the page's descriptions and the Open Graph tagline go from eight levels to nine and name the camel (through `humanizer`); re-render `og.png` headed; CLAUDE.md's scope line.
- [ ] Advisor review of the branch; apply what holds.
- [ ] Memory: the state note, `landmark-backdrops`, a `level-9-decisions` note; `zg index` in `memory/`.
- [ ] `npm test`, push `main` once Babak has played it and says push, check CI and Pages with `gh run list`.
