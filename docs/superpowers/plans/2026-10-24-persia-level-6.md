# Persia level 6 implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A sixth level: five waves numbered ۲۶ to ۳۰ over Yazd's windcatchers at night, a giant dog as the boss, flower petals from wave 28 with their word گل, and the HUD's wave line in Persian (موج).

**Architecture:** Level 6 goes into the seams level 5 used: a level in `LEVELS`, a boss in `BOSS_DEFS` and `BOSS_ART`, a landmark painter in `PAINTERS`, and petals as a third kind in the `WEATHER` table. The wave line is a new `persian` part with its word in the pack.

**Tech Stack:** Plain ES modules, Canvas 2D, `node:test`; no dependencies and no build.

**Spec:** `docs/superpowers/specs/2026-10-24-persia-design.md` (its "Level 6 specification" section).

**Execution:** Opus drives and reviews; Sonnet agents implement one task each. Tasks 1, 2 and 3 run in parallel in worktrees; 4 and then 5 follow on `main`.

## Global Constraints

- Every code file under 200 lines; Conventional Commits; never `--no-verify`.
- `src/core` and `src/fx` stay pure: no DOM, canvas, `Math.random` or `Date.now`.
- No Persian word, digit or separator in code outside `src/data/pack.js`; tests build Persian strings from the pack.
- Persian code points only; the pack test covers every new string; Persian a player reads goes through `humanizer-pa`.
- Clips come in through `scripts/lift-clips.mjs <lessons repo>` (its `NAMES` table), only approved IDs; the manifest keeps every existing entry byte-identical and gains exactly seven (gol in Task 3, the five numbers in Task 5).
- Every export is used (`test/repo-dead.test.js`); band heights are multiples of `PIXEL`.
- Levels 1 to 5, their five giants and five landmarks stay pixel-identical (hash the bakes before and after); the rain and the stars fall exactly as before.
- Visual work follows `frontend-design` and is judged from screenshots; `simplify` runs at the end.

## Review Focus

1. The petals' word is said once, after wave 28's number and species, only in level 6; levels 4 and 5 still say their weather once at their wave; a retry says each again. Task 3 tests it through the core events and `voiceLines`.
2. The petals never hide what kills you: small, behind the aliens, the bullets and the ship. Task 3 screenshots a wave with bullets in the air under the petals.
3. The Persian wave line reads right to left (the word on the right, then the count), its letters joined, centred where the English one sat, and levels 1 to 5 keep `WAVE n / m`. Task 4 tests the string per level and screenshots both.
4. Six cards fit side by side in one row at 1920 x 1080 and in a 1280 x 720 window (the row is 90rem inside `.screen`'s padding, and `.menu-row` wraps), each place name on one line, arrows and Enter working. Task 5 screenshots both sizes.
5. The giant dog's plates sit where its ears and nose are drawn (every armour hit box matches its art). Task 2 checks each part's box against the drawing.

---

### Task 0: Baselines (Opus)

- [x] Hash the sky and layer bakes of all five landmarks and the bakes of all five giants on `main` before any task lands.

### Task 1: Yazd's windcatchers at night

**Files:** create `src/ui/landmarks/yazd.js` (split pictures into `yazd-art.js` if it nears 200 lines); modify `src/ui/parallax-shapes.js` (`PAINTERS.yazd`), `src/ui/looks/persia.js` (`landmarks.yazd`).

- [ ] The painter follows `pasargadae.js` and `azadi.js`: block helpers from `landmarks/kit.js`, tones from its look entry, lights pushed for lamps.
- [ ] A dense old-city skyline across the whole width: flat mud-brick roofs at several heights and a few low domes, with many windcatchers rising from them, each a square tower with two or three tall dark vent slots at its top and a flat cap. In the centre, the tallest: Dowlat Abad's octagonal windcatcher, much taller than the rest, its faces slotted, standing over a low garden wall with a pale pool line. Behind and to one side, the Jameh Mosque's portal with its twin slim minarets, the tallest things after the badgir. Mud brick in warm ochre, lit from lamps in doorways and on walls, darker in the slots and on the shadow faces.
- [ ] Screenshot the backdrop alone, its title-card crop (x 480, y 480, w 960, h 600; the tallest windcatcher's top inside it) and a wave over it; levels 1 to 5 hash as in Task 0.
- [ ] Commit `feat(ui): Yazd's windcatchers at night, level 6's backdrop`.

### Task 2: The giant dog

**Files:** `src/core/bosses-data.js` (`giantDog`, added to `BOSS_DEFS`), create `src/ui/bosses/giant-dog.js`, `src/ui/bosses/bake.js` (`BOSS_ART`); tests `test/core/boss-data.test.js`, `test/core/boss-kit.js`.

- [ ] `giantDog = boss('giant-dog', 'Giant Dog', 'dog', 270, { w: 640, h: 300 }, …)`. Plates: `earL`, `earR` (floppy ears hanging at the sides of the head) and `nose` (the black nose, centre); weak: `eyeL`, `eyeR`, `mouth` (open and barking, under the nose). The cow's part hp (plates 6, 6, 8; weak 44, 44, 70); start from the cow's boxes (horns become the ears at about ±235, the curl becomes the nose between and below the eyes, the mouth as is), each ear outboard of its eye's column so the boss tests' clear-column rule holds. Three phases with the cow's attacks and rates, `dog` minions from the mouth and a `rabbit` from the nose in every phase. Every part's box covers what is drawn for it, no wider. Keep the def's comment to three lines so `bosses-data.js` stays under 200.
- [ ] `test/core/boss-kit.js` `realLevel`: `LEVELS.find((l) => l.boss === kind) ?? LEVELS.at(-1)`, until Task 5 gives a level the dog (the boss tests loop `BOSS_DEFS` through it).
- [ ] The art follows `giant-cow.js` and `bosses/kit.js` and the small dog sprite in `src/ui/aliens/`, so it reads as the same animal: its coat colour (`palette.alien.dog`), long floppy ears, a broad muzzle, the black nose, red brows angled down, fangs in the open mouth; rage lights it amber then red as the others. The body's bottom stays clear of the HUD (R28).
- [ ] Screenshot it through its phases with a temporary, uncommitted level edit pointing a level's `boss` at it; the five earlier giants hash as in Task 0.
- [ ] Commit `feat: the giant dog, level 6's boss`.

### Task 3: Petals, a third weather

**Files:** create `src/ui/petals.js`; modify `src/ui/weather.js` (`WEATHER.petals`), `src/data/pack.js` (`weather.petals`), `scripts/lift-clips.mjs` (`vocabulary-3-gol` as `gol`), `public/audio/`; tests a petals test, `test/data/pack.test.js`, `test/ui/voice-queue.test.js`.

- [ ] Pack `weather.petals`: `{ word: 'گل', say: 'gol', clip: 'public/audio/gol.mp3', ms }`, `ms` from the approved record; the manifest gains this one entry.
- [ ] `drawPetals(ctx, k, t, quality, reduced)` in `petals.js`, stateless like `rain.js`: small petals (a few pixels, in two or three pinks and a white) drifting down slowly across the whole frame, each swaying sideways and tumbling (its width pulsing as it turns); batched, one fill per colour per frame; 70 at full quality, half at half quality, never none, fewer and slower under reduced motion. `WEATHER.petals = ['field', drawPetals]`, so they fall where the rain does. Tests count one `ellipse` per petal (as rain counts `lineTo` and stars `moveTo`): none at `k` 0; 70 at full, 35 at half quality; and in `test/ui/weather.test.js`, with a probe level, petals draw in `'field'` and not in `'sky'`, as the stars test does.
- [ ] Comments: `weather.js`'s header and `pack.js`'s weather line name three kinds.
- [ ] Tests: a wave event with `weather: 'petals'` says the petals line after the species; levels 4 and 5 say theirs as before.
- [ ] Screenshot, with a temporary uncommitted edit giving level 5 `weather: { kind: 'petals', from: 3 }`, wave 23's word moment and a wave under the petals with bullets in the air; level 4's rain and level 5's stars unchanged.
- [ ] Commit `feat: flower petals, a weather the voice names gol`.

### Task 4: The wave line in Persian

**Files:** `src/data/pack.js` (`hud: { wave }`), `src/core/levels.js` (the header names the `'waveWord'` part), `src/ui/format.js` (`waveText`), `src/ui/hud.js`, `src/ui/hud-kit.js` if `word` needs a direction; tests `test/ui/format.test.js`, `test/core/levels.test.js`, `test/data/pack.test.js`.

- [ ] Pack `hud: { wave: 'موج' }` (through `humanizer-pa`), documented in the pack header as words the HUD shows in place of its English labels, read and never heard; the word-rule test (`pack.test.js`, the list it checks) adds `Object.values(PACK.hud)`.
- [ ] `waveText(level, wave)` (today `WAVE ۲۱ / ۲۵` for a Persian level): `const count = \`${show(first)} / ${show(last)}\`; return showsPersian(level, 'waveWord') ? \`${PACK.hud.wave} ${count}\` : \`WAVE ${count}\`;`. Update its doc comment and `levels.js`'s list of parts.
- [ ] `hud.js` `wave()` mirrors `bossBar`: `showsPersian(world.level, 'waveWord') ? word(ctx, s, W / 2, MAIN, 32, '#ffffff') : text(…as now)`. In `hud-kit.js` `word()`: `ctx.direction = PACK.dir;` before its `fillText`, `ctx.direction = 'inherit';` after; no `save()`/`restore()` (the format test's fake ctx has none). `textAlign 'center'` still centres.
- [ ] Tests: `format.test.js` builds the expectation from the pack, `` `${PACK.hud.wave} ${D[2]}${D[6]} / ${D[3]}${D[0]}` `` for a probe level at wave 26 of 30, and levels 1 to 5 keep `WAVE n / m`; its `word()` test records `ctx.direction` inside `fillText` (the pack's `dir`) and asserts `'inherit'` after; `levels.test.js` `known` gains `'waveWord'`.
- [ ] Screenshot the HUD with a probe level that has `'waveWord'`, and level 5's HUD unchanged.
- [ ] Commit `feat(ui): a level can name its waves in Persian`.

### Task 5: Level 6 and waves twenty-six to thirty

Babak approved `counting-2199-tal-26` to `-29` in the lessons repo (pushed there as `37ea154`).

**Files:** `src/core/levels.js` (`LEVEL_6`), `src/data/pack.js` (numbers 26 to 30), `scripts/lift-clips.mjs`, `public/audio/`, `src/ui/css/screens.css`; tests as level 5's.

- [ ] `LEVEL_6`: `id 'level-6'`, `name 'Level 6'`, `place 'Yazd'`, `seed: 61847`, `d: 0.45`, `boss 'giant-dog'`, `landmark 'yazd'`, `persian` level 5's plus `'waveWord'`, `weather: { kind: 'petals', from: 3 }`. Waves, two species each: 26 `w('grid', 10, 'ddcc', 'aimed', 1.2)` (dogs over cats), 27 `w('escort', 3, 'orro', 'aimed', 1.2)`, 28 `w('dive', 10, 'ddbb', 'fan', 1.25)` (dogs and birds swoop as the petals begin), 29 `w('sway', 8, 'hhff', 'fan', 1.3)` (the gunners), 30 `w('spiral', 10, 'ddmm', 'ring', 1.4)` (forty dogs and mice). All eight animals; six rows of dogs, more than any level before.
- [ ] Pack numbers 26 to 30: `say` `bist-o-shesh`, `bist-o-haft`, `bist-o-hasht`, `bist-o-noh`, `si`; `ms` from the approved records; clips from `counting-2199-tal-26` to `-29` and `counting-2199-ti-30`. The manifest gains five. The pack header says numbers 1 to 30.
- [ ] `test/core/boss-kit.js` `realLevel`: drop Task 2's `?? LEVELS.at(-1)`.
- [ ] Six cards: `.level-cards { gap: 1rem }`, `.level-card { width: 14rem }` (89rem of the row's 90rem); trim the card type only if a place name breaks onto two lines; screenshot 1920 x 1080 and 1280 x 720.
- [ ] Tests that change or grow:
  - `test/core/weather.test.js`: `KIND` gains `'level-6': 'petals'`; the level/kind pairs gain `[LEVELS[5], 'petals']`.
  - `test/data/pack.test.js`: numbers are 1 to 30.
  - `test/ui/levels-flow.test.js`: level 5's results offer `['Next', 'Again', 'Title']`, level 6's `['Again', 'Title']`; `started` gains `LEVELS[5]`; the first waves `[6, 11, 16, 21]` gain 26; the parade walks all eight in level 6.
  - `test/core/levels.test.js`: wave numbering 26 and 30; a level 6 test, `dogs(LEVEL_6) > 5 && LEVELS.slice(0, 5).every((l) => dogs(l) <= 5)`, `d` above level 5's; `LEVEL_6.persian` deepEquals `[...LEVEL_5.persian, 'waveWord']`; level 6's giant sends a rabbit every phase.
  - `test/ui/voice-queue.test.js`: a level 6 twin of the level 5 test, the first wave saying ۲۶ then its species, the petals said once at wave 28 (`[false, false, true, false, false]`), again on a retry.
  - The autopilot clears level 6 and survives its first 60 s, as the level 5 test.
- [ ] Play it at `?debug&level=6&auto`: the word moments, the petals, the dog's fight with its Persian bar, the Persian wave line, the victory card with LEVEL ۶.
- [ ] Commit `feat: level 6, the giant dog and waves twenty-six to thirty`.

### Task 6: Finish (Opus)

- [ ] `simplify` over the level; apply what holds.
- [ ] README, `llms.txt`, the page's descriptions and the Open Graph tagline go from five levels to six (through `humanizer`); re-render `og.png` headed; CLAUDE.md's scope line.
- [ ] Advisor review of the branch; apply what holds.
- [ ] Memory: the state note, `landmark-backdrops`, a `level-6-decisions` note; `zg index` in `memory/`.
- [ ] `npm test`, push `main`, check CI and Pages with `gh run list`.
