# Persia level 4 implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A fourth level: five waves numbered ۱۶ to ۲۰ before the Azadi Tower at night, a giant bird as the boss, rain from wave 18 with its word باران, the combo and the level's number in Persian digits, and the title's levels as cards that name their places.

**Architecture:** Level 4 goes into the same seams as level 3: a level in `LEVELS`, a boss in `BOSS_DEFS` and `BOSS_ART`, and a landmark painter in `PAINTERS`. Two things are new. Rain is a level field the core turns into an event and a state, with a voice line and a view. The title menu becomes cards.

**Tech Stack:** Plain ES modules, Canvas 2D, `node:test`; no dependencies and no build.

**Spec:** `docs/superpowers/specs/2026-10-24-persia-design.md` (its "Level 4 specification" section and decisions table).

## Global Constraints

- Every code file under 200 lines; Conventional Commits; never `--no-verify`.
- `src/core` and `src/fx` stay pure: no DOM, canvas, `Math.random` or `Date.now`.
- No Persian word, digit or separator in code outside `src/data/pack.js`; tests build Persian strings from the pack.
- Persian code points only; the pack test covers every new string (the rain word included).
- Clips come in through `scripts/lift-clips.mjs ../Danish-Persian-Lessons` (its `NAMES` table), only approved IDs; the manifest keeps every existing entry byte-identical and gains exactly six.
- Every export is used (`test/repo-dead.test.js`); band heights are multiples of `PIXEL`.
- Levels 1 to 3, the three giants and the three landmarks stay pixel-identical (hash the bakes before and after).
- Visual work follows `frontend-design` and is judged from screenshots; `simplify` runs at the end.

## Review Focus

1. Rain's word is said once, after wave 18's number and species, only in level 4; a retry says it again at wave 18, not at 16. Task 4 tests it through the core events and `voiceLines`.
2. Rain never hides what kills you: thin, low, behind the aliens, the bullets and the ship. Task 4 screenshots wave 18 with bullets in the air.
3. Level 4 started at its giant (`?debug&level=4&boss`) rains from the first frame. Task 4 tests `isRaining` on a boss-start world.
4. The title's cards work from the keyboard (left and right move, Enter plays) and four fit side by side at 1920 x 1080 and in a 1280 x 720 window. Task 1 tests the keys and screenshots both sizes.
5. LEVEL ۴ shows wherever level 4 is named in play, the title menu keeps Level 4, and levels 1 to 3 keep their ASCII names. Task 5 tests `levelName` per level.

---

### Task 1: The title's levels as cards

**Files:** `src/core/levels.js` (a `place` per level), create `src/ui/landmark-art.js`, `src/ui/router.js` (items carry the place and the picture), `src/ui/screens/title.js`, `src/ui/css/screens.css`; test `test/ui/levels-flow.test.js`, `test/core/levels.test.js`.

- [ ] Invoke `frontend-design:frontend-design`. The cards keep invaders' screen look (the `btn` family, `--display`, the gold focus).
- [ ] Every level gets `place`: `'Persepolis'`, `'Si-o-se-pol'`, `'Tomb of Hafez'` (level 4's `'Azadi Tower'` comes in Task 3). Test: every level has a non-empty `place`, and no two levels share one.
- [ ] Create `src/ui/landmark-art.js`: `landmarkArt(look, level) -> canvas`, a small picture of the level's landmark. The canvas is the crop's size (the frame's lower middle, set from screenshots); translate by the crop's offset, fill `lin(g, 0, 0, 0, H, look.sky)`, then `drawLayers(g, buildLayers(look, look.landmarks[level.landmark], level.seed), W / 2, 0, 1)`. CSS sizes it on the card with `image-rendering: pixelated`. Only `makeCanvas` (no `Image`, no `OffscreenCanvas`), so the node stand-ins bake it harmlessly. Bake once per level id (a module `Map`). Test: a second call for the same level returns the same canvas.
- [ ] Measure the four bakes in `goTitle` once in the browser. If they delay the menu noticeably, bake them in the callback the backdrop already defers, and fill the cards then.
- [ ] `titleScreen({ items: [{ label, place, art, pick }], nowShowing })`: one card button per level in a row, its picture (`art`, when given) over its number (`label`) and its place. `button()` takes a single node as its label, so pass one wrapper holding the three. Keep `navigate(cards, code)` as it is: at `cols = 1` left and right already move and wrap. `goTitle` passes `place` and `art: landmarkArt(LOOK, level)`. Test (`levels-flow.test.js` reads string children today, so read the number and place spans by className and press by index): the title shows a card per level with its number and place; ArrowRight moves the focus to the next card; Enter on a card plays its level.
- [ ] Screenshot the title at 1920 x 1080 and in a 1280 x 720 window, both with four cards (level 4 in place from Task 3, or a temporary local fifth item, reverted).
- [ ] Commit `feat(ui): the title's levels are cards that name their places`.

### Task 2: The Azadi Tower at night

**Files:** create `src/ui/landmarks/azadi.js` (and `azadi-art.js` for its stamped pictures if it nears 200 lines, as Persepolis split its art); modify `src/ui/parallax-shapes.js` (`PAINTERS.azadi`), `src/ui/looks/persia.js` (`landmarks.azadi`).

- [ ] Painter `azadi(g, w, h, rng, L, lights)` on the `landmarks/kit.js` blocks, like `hafez.js`: the tower centred, its four legs splaying out to the plaza, the tall pointed split vault between them, the ribbed upper body narrowing to its lit top, floodlight pooling up the legs (layer lights); a wide plaza with a row of lamps; a low city of lit windows behind on the far band. Tones from the layer (`L.lit`, `L.ink`, `L.glow`, `L.lamp` and the tower's pale stone).
- [ ] Hash the baked layers of Persepolis, Si-o-se-pol and Hafez in the browser (the pixels `buildLayers` returns) before and after: unchanged.
- [ ] Screenshot it by pointing a level's `landmark` at `azadi` locally (reverted, `git diff --stat src/core/levels.js` empty).
- [ ] Commit `feat(ui): the Azadi Tower at night`.

### Task 3: Level 4, the giant bird and waves sixteen to twenty

**Files:** `src/core/bosses-data.js`, create `src/ui/bosses/giant-bird.js`, `src/ui/bosses/bake.js`, `src/core/levels.js`, `src/data/pack.js`, `scripts/lift-clips.mjs`, `public/audio/`; tests `test/core/boss-data.test.js`, `test/core/levels.test.js`, `test/data/pack.test.js`, `test/ui/voice-queue.test.js`, `test/ui/levels-flow.test.js`.

- [ ] `giant-bird` def, face on: armour `wingL`, `wingR` (wide, at the sides) and `crest` (head feathers on top); weak `eyeL`, `eyeR` and `beak`; three phases like the fish's, birds from the beak, a rabbit from the crest in every phase. Its resting `y` passes both R28 tests (hit boxes and drawn body). Weak-part HP is set by `boss-bots.test.js` (the bot wins in 40 to 60 s), as for the fish. Painter on `bosses/kit.js` (`eyeArt`, `litCells` for a rage overlay, `throb`).
- [ ] `LEVEL_4`: `id 'level-4'`, `name 'Level 4'`, `place 'Azadi Tower'`, a new seed, `d 0.35`, `boss 'giant-bird'`, `landmark 'azadi'`, `persian ['wave', 'score']`, waves `w('sway', 8, 'bbh', 'fan', 1.1)`, `w('escort', 3, 'orro', 'aimed', 1.1)`, `w('dive', 10, 'bbcc', 'fan', 1.15)`, `w('grid', 10, 'ddmm', 'aimed', 1.2)`, `w('spiral', 10, 'bbff', 'ring', 1.3)`. Tune speeds and `d` only if the autopilot tests demand it; don't tune for a first-try win.
- [ ] Pack numbers 16 to 20: `shanzdah` 910 ms, `hafdah` 780, `hojdah` 910, `nuzdah` 860, `bist` 760 (the clips' transcripts and lengths). `NAMES` gains `number-16-word` to `number-20-word`. Header comments follow: `pack.js` (numbers 1 to 20), `levels.js` (the `persian` parts).
- [ ] Tests: `waveNumber(LEVEL_4, 1)` is 16 and `(…, 5)` is 20; level 4 brings all eight with birds in more than four rows (the fish level had four); pack numbers are 1 to 20; level 4's first wave says `number(16)`; the title lists four levels; level 3's results offer Next into level 4 and level 4's offer none; level 4's parade walks its animals.
- [ ] Screenshot `?debug&level=4` and `?debug&level=4&boss&auto` (phases, death).
- [ ] Commit `feat: level 4, the giant bird and waves sixteen to twenty`.

### Task 4: Rain from wave 18

**Files:** `src/core/levels.js` (`rain: 3` on level 4), `src/core/aliens.js` (the flag), a pure `isRaining(world)` beside the level helpers, `src/data/pack.js` (`rain: { word, say, clip, ms }`), `scripts/lift-clips.mjs` (`vocabulary-3-baran`), `src/ui/voice-queue.js`, `src/ui/voice.js`, create `src/ui/rain.js`, `src/ui/view.js`; tests in `test/core/`, `test/data/pack.test.js`, `test/ui/voice-queue.test.js`.

- [ ] A level's optional `rain` is the number, within the level, of the wave the rain begins with. No new event: `spawnWave` adds `rain: true` to that wave's `'wave'` event, and only when true, so `test/core/level-flow.test.js`'s whole-event assertion and the `SILENT` emit tables stay as they are. `isRaining(world)` is `level.rain != null && (world.boss !== null || world.wave >= level.rain)`, so a boss-start world (debug-hooks' `{ ...level, waves: null }` keeps `rain`) rains. Tests: level 4's third wave event carries `rain`, and no other does; levels 1 to 3 never; a fresh level 4 world (a retry) does not rain until wave 18; a boss-start level 4 world rains.
- [ ] Pack `rain`: `{ word: 'باران', say: 'baran', clip: 'public/audio/baran.mp3', ms: 760 }`; add it to `LINES` in `test/data/pack.test.js` (the manifest, `say` and word-rule tests). `voiceLines` pushes it after a `'wave'` event's species when the event has `rain`. `voice.js` decodes it with the numbers and species, or the line is skipped silently. Test: level 4's third wave says `number(18)`, its species, then the rain line.
- [ ] The word moment shows the rain word as it shows a species' word (letters in turn coloured, its Latin beside it) without a face (`show()` already leaves the face out when there is no `id`).
- [ ] `drawRain(ctx, k, t, quality, reduced)` in `rain.js`, stateless like `ambient.js`: slanting streaks from index and time, `k` 0 to 1 is how far it has faded in; fewer and slower under reduced motion; nothing under low quality. `createView` reads `matchMedia('(prefers-reduced-motion: reduce)').matches` once (guarded for node) into `view.reduced`. The view keeps `view.rain = { k, t }` and moves `k` towards `isRaining(world)` by `(t - rain.t) / 2` per frame, clamped to 0 to 1, then draws it right after the parallax, before the boss and everything that fights.
- [ ] Screenshot wave 18 with bullets in the air, and the giant's fight in the rain.
- [ ] Commit `feat: rain falls on level 4 from wave 18, and the voice says its name`.

### Task 5: The combo and the level's number in Persian

**Files:** `src/core/levels.js` (level 4's `persian` gains `'combo'` and `'level'`), `src/ui/format.js`, `src/ui/hud.js`, `src/ui/screens/card.js`, the pause label's caller, `src/ui/screens/results.js`, `src/ui/screens/failed.js`; tests `test/ui/format.test.js`, `test/ui/results.test.js`, `test/core/levels.test.js`.

- [ ] `levelName(level)` in `format.js`: the level's name through `localText(level, 'level', …)`. The HUD label, the level's title card, the pause card and both end cards use it; the title menu keeps `level.name`. The HUD combo reads `×` and the multiplier through `localText(level, 'combo', …)`.
- [ ] Tests: `levelName` is `Level 4` with the pack's ۴ for level 4 and the ASCII name for levels 1 to 3; the known HUD parts are `wave`, `score`, `combo`, `level`; level 4's victory card's kicker carries the pack's digit.
- [ ] Screenshot the level 4 HUD with a combo of ×8, and its victory card.
- [ ] Commit `feat(ui): level 4 counts its combo and names itself in Persian digits`.

### Task 6: Finish

- [ ] `simplify` over the branch; apply what holds.
- [ ] README, `llms.txt`, the page's descriptions and the Open Graph tagline go from three levels to four (through `humanizer`); re-render `og.png` headed from the same frame.
- [ ] Advisor review of the branch; apply what holds.
- [ ] Memory: the state note, `landmark-backdrops`, `level-4-decisions`; `zg index` in `memory/`.
- [ ] `npm test`, push `main`, check CI and Pages with `gh run list`.
