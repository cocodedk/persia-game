# Persia level 2 implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A second level: five waves numbered ۶ to ۱۰ before Si-o-se-pol at night, the mouse in the waves, a giant mouse as the boss, and the HUD's wave count in Persian digits.

**Architecture:** Level 2 is data, plugged into the seams level 1 kept: a level in `LEVELS`, a species in `SPECIES` with its sprite and pack line, a boss in `BOSS_DEFS` and `BOSS_ART`, and a landmark painter in `PAINTERS`. A level names its landmark and its first wave number. Only the flow between levels and the HUD's wave text are new behaviour.

**Tech Stack:** Plain ES modules, Canvas 2D, `node:test`; no dependencies and no build.

**Spec:** `docs/superpowers/specs/2026-10-24-persia-design.md` (its "Level 2 specification" section and decisions table).

## Global Constraints

- Every code file under 200 lines; Conventional Commits; never `--no-verify`.
- `src/core` and `src/fx` stay pure: no DOM, canvas, `Math.random` or `Date.now`.
- No Persian word or digit in code outside `src/data/pack.js`; digits reach the HUD through the pack.
- Persian code points only (ک U+06A9, ی U+06CC, digits ۰ to ۹); the pack test covers every new string.
- Clips are copied from `../Danish-Persian-Lessons/public/audio/`, and only IDs in its `src/audio/approved.generated.json`. Each one gets a `public/audio/manifest.json` entry with the existing entries' fields.
- Every export is used (`test/repo-dead.test.js`); band heights are multiples of `PIXEL`.
- Visual work follows `frontend-design` and is judged from screenshots; `simplify` runs at the end.

## Review Focus

1. The voice must count on from level 1. Wave 1 of level 2 says شش and shows ۶, never یک. Task 4 tests this through `voiceLines`.
2. Failing level 2 retries level 2, and Again replays the level just played. Task 6 adds a flow test for each.
3. Persian digits must draw on a machine whose `system-ui` lacks them. The HUD font stack names the pack's face, and Task 5 tests that stack.
4. Level 2 is open from the first visit, with no storage involved: the title lists it even in a private window. Task 6 tests the title items.
5. The giant mouse must leave a weak point open from below at every moment, as the cat does. The boss tests run over every def in `BOSS_DEFS`, so the new def is covered without new code.

---

### Task 1: The mouse

**Files:**
- Modify: `src/core/kinds.js` (SPECIES), `src/data/pack.js`, `public/audio/manifest.json`, `src/ui/aliens/animals.js`, `src/ui/looks/persia.js` (palette.alien), `test/core/levels.test.js`
- Create: `public/audio/mush.mp3` (copy of `vocabulary-5-mush.7f19d8459f94.mp3`)

**Interfaces:** Produces the species id `'mouse'`, which fights as `'diver'`, and its pack line `{ id: 'mouse', word: 'موش', say: 'mush', clip: 'public/audio/mush.mp3', ms: 970 }`, appended last.

- [ ] Change the level 1 test "all seven species appear" to assert that level 1 brings every SPECIES id except `'mouse'`. Run it and see it pass before the change and fail after `SPECIES.mouse` is added (the existing pack and art tests also fail until the pack line and painter exist).
- [ ] Add `mouse: 'diver'` to SPECIES, the pack line, the clip and its manifest entry (sha256 checked against the file), and `palette.alien.mouse`.
- [ ] Add `ROWS.mouse` to animals.js: two frames, at most 11 cells wide, in the legend there. Big round ears, lit red brows, a pink nose, whiskers, buck teeth; frame 2 squeaks with its teeth bared.
- [ ] Add `levelSpecies(level) -> string[]` to levels.js: the distinct species of its waves, then its boss's. The parade takes `species` (pack lines), and flow passes the pack's species filtered by `levelSpecies(level)`, so level 1's parade stays seven. Test `levelSpecies` on level 1.
- [ ] Screenshot a level with a mouse row (a temporary local edit of level 1's wave 1, not committed) and check it reads as a mouse at play size and in the word moment's face.
- [ ] `npm test`: all pass. Commit `feat: the mouse joins the animals`.

### Task 2: The giant mouse

**Files:**
- Modify: `src/core/bosses-data.js`, `src/ui/bosses/bake.js` (BOSS_ART)
- Create: `src/ui/bosses/giant-mouse.js`

**Interfaces:** Produces boss kind `'giant-mouse'`, name `'Giant Mouse'`, species `'mouse'`, HP in the cat's range. Its painter module has the same shape as `giant.js` (the shape is in `bake.js`'s header).

- [ ] Add the def with `boss(...)` from `bosses-kit.js`. The standing bot must win in 40 to 60 s (`boss-bots.test.js`), which sets the weak parts' HP. Generalise `test/ui/bosses.test.js`'s painter test and `test/core/boss-data.test.js`'s kind list to both bosses. The def needs: armour plates on the two big ears and the snout, and weak points on the two eyes and the buck-toothed mouth. Use three phases like the cat's, whose minions are mice (`minion('mouse', ...)`), with a rabbit in the last phase so power-ups still drop. Run `npm test`. The generic boss tests in `test/core/boss-bots.test.js` and `test/ui/bosses.test.js` fail until the art exists, and must then pass: the open column to a weak point, and every part painted.
- [ ] Write `giant-mouse.js` in the giant's pixel style (10 px phosphor cells). A grey head with huge round ears in pink, whisker pads with lit whiskers, red brows, slit eyes and buck teeth burning as the weak points. Lights go amber, then red, as the phases heat up.
- [ ] Screenshot it at `?debug&boss` with level 1's boss temporarily set to `'giant-mouse'` (a local edit, not committed). Check every phase and its death.
- [ ] `npm test`: all pass. Commit `feat(ui): a giant mouse boss`.

### Task 3: Si-o-se-pol

**Files:**
- Modify: `src/ui/looks/persia.js`, `src/ui/looks/index.js` (header), `src/ui/parallax.js`, `src/ui/parallax-shapes.js`, `src/ui/view.js`, `src/core/levels.js` (level 1 gets `landmark: 'persepolis'`), `test/ui/landmarks.test.js`
- Create: `src/ui/landmarks/siosepol.js`, plus `src/ui/landmarks/siosepol-art.js` if it stamps pictures

**Interfaces:**
- The look's `layers` becomes `landmarks: { persepolis: [3 layers], siosepol: [3 layers] }`; the far mountains and the ground are consts in persia.js that both lists share.
- `buildLayers(look, layers, seed)`: `createView` passes `look.landmarks[level.landmark]`.
- A level has `landmark`, a key of `look.landmarks` (not `backdrop`: `app.backdrop` is the title battle).
- `siosepol` uses the painter contract in `parallax-shapes.js`.

- [ ] Extend the landmarks test so the grid check covers every landmark's layer heights and every art module's pictures. Add a test that LEVEL's `landmark` is a key of `LOOK.landmarks` (Task 4 widens it to LEVELS). Run them and see them fail.
- [ ] Move level 1's layers under `landmarks.persepolis`, thread `landmark` through `createView`, and confirm level 1 still bakes the same pixels: hash the baked sky and layers in a browser (`buildSky`, `buildLayers`) before and after.
- [ ] Paint `siosepol`, in PIXEL blocks:
  - the bridge across the whole band: 33 pointed arches on piers, each pier pierced by its small arch, an arcade of smaller arches above under a flat parapet, and a pavilion at each end;
  - each lower arch lit gold from inside, as a pulsing layer light;
  - below the bridge, the river: the bridge mirrored darker and broken by ripple rows, with the lit arches as gold streaks.

  Its far layer is level 1's mountains, and its ground is level 1's ground.
- [ ] Screenshot the title, a wave and the boss over it (`?debug&level=2` arrives in Task 6, so until then use a local edit of LEVEL's landmark). Enemies and bullets must stay readable over it.
- [ ] `npm test`: all pass. Commit `feat(ui): Si-o-se-pol at night`.

### Task 4: Level 2 and its count

**Files:**
- Modify: `src/core/levels.js`, `src/core/aliens.js` (wave event), `src/ui/voice-queue.js`, `src/data/pack.js` (numbers, `digits`, header), `public/audio/manifest.json`, `src/ui/screens/failed.js`, and the tests that span every level or build wave events: `test/core/levels.test.js`, `test/core/autopilot-level.test.js`, `test/core/formations-hud.test.js`, `test/core/predict.test.js`, `test/repo-dead.test.js`, `test/data/pack.test.js`, `test/ui/voice-queue.test.js`, `test/ui/voice.test.js`, `test/core/level-flow.test.js`
- Create: `public/audio/{shesh,haft,hasht,noh,dah}.mp3`, copied from `number-6-word.d8b64423e980.mp3`, `number-7-word.f43bde0ba3bf.mp3`, `number-8-word.d2a2ed89ec0c.mp3`, `number-9-word.b4a4f0ef76bc.mp3` and `number-10-word.68701360f819.mp3`

**Interfaces:**
- `LEVELS = [LEVEL, LEVEL_2]` beside `LEVEL`, which stays level 1 (16 importers keep it). Each level is `{ id, name, seed, d, boss, first, landmark, persian, waves }`. `first` is the world-count number of its first wave. `persian` lists the HUD parts shown in Persian (`[]` or `['wave']`).
- `waveNumber(level, wave) -> (level.first ?? 1) + wave - 1`, the one place `first` defaults (test fixtures build levels without it).
- The `wave` event becomes `{ wave, n, species }`, with `n = waveNumber(level, world.wave)`.
- `PACK.digits`: the ten Persian digits in order, ۰ to ۹.
- Pack numbers gain `n` 6..10: `۶ shesh 810`, `۷ haft 760`, `۸ hasht 760`, `۹ noh 760`, `۱۰ dah 760` (word, say, ms).

- [ ] Write the failing tests:
  - Every level in LEVELS obeys level 1's wave rules: at most two species per wave, at most 40 aliens, real formations and patterns, four or more formations, and a carrier wave in its first two.
  - Ids are unique. `LEVELS[i].first` is `LEVELS[i-1].first + LEVELS[i-1].waves.length`.
  - Each level's `persian` holds only known parts (`'wave'`).
  - Level 2 brings all eight species, the mouse in its first wave. `levelSpecies` gives level 1 the seven and level 2 all eight.
  - `voiceLines` for a level 2 wave 1 event says `shesh` first.
  - Pack numbers are 1..10, and each `word` is `n` written in `PACK.digits` (two glyphs for 10). `PACK.digits` is U+06F0 to U+06F9 and obeys the text rules.
  - The autopilot tests run over every level: each clears within LIMIT with an invulnerable ship, and survives 60 s with three lives.
- [ ] Add level 2, `id: 'level-2'`, `name: 'Level 2'`, a new integer seed, `d: 0.2`, `boss: 'giant-mouse'`, `first: 6`, `landmark: 'siosepol'`, `persian: ['wave']`, with these waves (tune speeds and `d` only if the autopilot tests demand it):
  - 6: `w('grid', 10, 'dmm', 'aimed', 1.0)`: mice behind a row of dogs
  - 7: `w('escort', 3, 'oro', 'aimed', 1.0)`: the power-up wave
  - 8: `w('dive', 8, 'bmm', 'fan', 1.05)`: birds and mice swoop
  - 9: `w('sway', 8, 'hhff', 'fan', 1.1)`: the gunners
  - 10: `w('spiral', 10, 'ccmm', 'ring', 1.2)`: forty cats and mice

  Add `m: 'mouse'` to LETTER. Level 1 gets `first: 1` and `persian: []`. Wherever LEVEL meant level 1 alone, keep it; the tests that should hold for every level iterate LEVELS.
- [ ] Emit `n`, say lines by `n` (event fixtures in the voice and level-flow tests gain `n`), and add the five clips, their pack lines, `digits` and manifest entries. The failed screen counts with `waveNumber` too ("Wave 8 of 10").
- [ ] `npm test`: all pass. Commit `feat: level 2, waves six to ten`.

### Task 5: The wave count in Persian

**Files:**
- Modify: `src/ui/format.js`, `src/ui/hud.js`, `src/ui/hud-kit.js` (FONT)
- Create: a test for `waveText` beside format.js's existing test, or `test/ui/format.test.js` if there is none

**Interfaces:**
- `localDigits(n, digits) -> string`.
- `waveText(level, wave, digits) -> 'WAVE a / b'`: `a = waveNumber(level, max(1, wave))` and `b = waveNumber(level, waves.length)`, both through `localDigits` when `level.persian` includes `'wave'`.

- [ ] Write the failing tests:
  - `waveText(level 1, 1)` is `'WAVE 1 / 5'`, and `waveText(level 2, 1)` is `'WAVE ۶ / ۱۰'` (the test builds the expected string from `PACK.digits`, so no Persian enters the test either).
  - FONT names `PACK.font.family` ahead of the generic family.
- [ ] Implement them and draw `waveText` in `hud.js`'s `wave()`.
- [ ] Screenshot the HUD in level 2 at 1920 x 1080 and in a small window.
- [ ] `npm test`: all pass. Commit `feat(ui): level 2 counts its waves in Persian digits`.

### Task 6: From one level to the next

**Files:**
- Modify: `src/ui/router.js`, `src/ui/flow.js`, `src/ui/screens/results.js`, `src/ui/screens/parade.js`, `src/ui/debug-hooks.js`, `test/ui/results.test.js`, `test/ui/parade.test.js`, `test/ui/flow-save.test.js` (or a new `test/ui/flow-levels.test.js`)

**Interfaces:**
- `resultsScreen(o, { next?, again, title })`: Next comes first and takes the focus when `next` is given.
- `paradeScreen({ species, look, voice, onDone })`, where `species` holds pack lines. Flow passes the pack's species filtered by `levelSpecies(level)`, keeping the pack's order.
- The title's menu: `Play` for level 1, then every later level, labelled with its `name`. Nothing is locked.
- `?debug&level=2` boots level 2, and `?debug&level=2&boss` boots it straight into its boss.

- [ ] Write the failing tests:
  - Results with `next` lists Next, Again and Title, with Next focused. Without it, it lists Again and Title.
  - The level 2 parade walks eight animals and level 1's seven.
  - The title lists Play and Level 2, and each starts its own level.
  - Failed on level 2 retries `LEVELS[1]`.
- [ ] Implement them. `flow.showResults` finds the next level by its index in LEVELS; a debug boss level, which is not in LEVELS, gets no Next. `?debug&level=2` already landed in Task 4.
- [ ] Play level 1 to its results with `?debug&auto`, press Next, and see level 2's card, its waves and the giant mouse (screenshots).
- [ ] `npm test`: all pass. Commit `feat(ui): Next plays level 2, and the title offers it`.

### Task 7: Finish

- [ ] Run `simplify` over the branch diff and apply what it justifies.
- [ ] Update README's "What it is" and `llms.txt` (through `humanizer`) wherever they say the game is one level. Leave `og.png` alone unless Babak asks.
- [ ] Update the memory state note and reindex. `npm test`, then commit and push to main (the deploy).
