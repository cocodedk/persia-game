# Persia level 3 implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A third level: five waves numbered ۱۱ to ۱۵ before the Tomb of Hafez at night, a giant fish as the boss, and the HUD's score in Persian digits.

**Architecture:** Level 3 is data in the seams level 2 opened: a level in `LEVELS`, a boss in `BOSS_DEFS` and `BOSS_ART` (painted with `bosses/kit.js`), and a landmark painter in `PAINTERS` with its layers under `look.landmarks`. The title, Next, the parade and the wave count already work over `LEVELS`. The one new behaviour is the score's digits.

**Tech Stack:** Plain ES modules, Canvas 2D, `node:test`; no dependencies and no build.

**Spec:** `docs/superpowers/specs/2026-10-24-persia-design.md` (its "Level 3 specification" section and decisions table).

## Global Constraints

- Every code file under 200 lines; Conventional Commits; never `--no-verify`.
- `src/core` and `src/fx` stay pure: no DOM, canvas, `Math.random` or `Date.now`.
- No Persian word, digit or separator in code outside `src/data/pack.js`.
- Persian code points only (ک U+06A9, ی U+06CC, digits ۰ to ۹, the thousands separator ٬ U+066C); the pack test covers every new string.
- Clips are lifted by `scripts/lift-clips.mjs ../Danish-Persian-Lessons` (its `NAMES` table), only IDs in the lessons repo's `src/audio/approved.generated.json`; the manifest it writes keeps every existing entry byte-identical.
- Every export is used (`test/repo-dead.test.js`); band heights are multiples of `PIXEL`.
- Levels 1 and 2, both giants and both landmarks stay pixel-identical (hash the bakes before and after).
- Visual work follows `frontend-design` and is judged from screenshots; `simplify` runs at the end.

## Review Focus

1. The voice counts on: level 3's first wave says یازده and shows ۱۱, never یک or شش. Task 3 tests it through `voiceLines`.
2. The score's digits follow the level. The HUD caches the score's text; a score of 0 carried from level 2 must not stay ASCII when level 3 starts. Task 4 keys the cache on the level too, and tests `scoreText` per level.
3. A seven-digit score in Persian (۱٬۲۳۴٬۵۶۷) fits the score panel at 1920 x 1080. Task 4 screenshots it.
4. Level 2's results now offer Next into level 3, level 3's offer none, and the title lists three levels. Task 3 updates the flow test.
5. The giant fish leaves a weak point open from below at every moment. The boss tests run over every def in `BOSS_DEFS`, so the new def is covered without new code.

---

### Task 1: The giant fish

**Files:**
- Modify: `src/core/bosses-data.js` (def, `BOSS_DEFS`), `src/ui/bosses/bake.js` (`BOSS_ART`), `src/ui/bosses/kit.js` (a shared `litCells` for the rage overlays, which the cat's stripes use too), `test/core/boss-data.test.js` (its kind list)
- Create: `src/ui/bosses/giant-fish.js`

**Interfaces:** Produces boss kind `'giant-fish'`, name `'Giant Fish'`, species `'fish'`. Its painter has the shape of `giant-mouse.js` and draws with `bosses/kit.js` (`grid`, `inside`, `whiskers`, `throb`, the shared colours).

- [ ] Add the def with `boss(...)`: armour on the two pectoral fins spread at the sides and on the dorsal crest on top; weak points on the two round eyes and the gaping mouth. Three phases like the mouse's; the minions are fish from the mouth, with a rabbit in the last phase so power-ups still drop (minions never fire, whatever their role). The standing bot must win in 40 to 60 s (`boss-bots.test.js`), which sets the weak parts' HP. Run `npm test`: the generic boss tests fail until the art exists.
- [ ] Paint `giant-fish.js` in the giants' pixel style: a broad fish face, scaled, with gill arcs, lit red brows over round burning eyes, barbels at the mouth's corners drawn as lit whiskers, the mouth gaping with a row of teeth. Fins and crest are the armour plates, ribbed. Lights go amber, then red, as the phases heat up.
- [ ] Screenshot it at `?debug&boss` with level 1's boss temporarily set to `'giant-fish'` (a local edit, not committed), every phase and its death. Hash the cat's and the mouse's bakes before and after: unchanged.
- [ ] The real-fight boss tests look up the boss's own level (`realLevel` in `test/core/boss-kit.js`), so the fish's tests pass only once level 3 exists: Task 1 is committed together with Task 3, as `feat: level 3, the giant fish and waves eleven to fifteen`.

### Task 2: The Tomb of Hafez

**Files:**
- Modify: `src/ui/looks/persia.js` (`landmarks.hafez`), `src/ui/parallax-shapes.js` (PAINTERS), `test/ui/landmarks.test.js` if it lists landmarks by name
- Create: `src/ui/landmarks/hafez.js`, plus `src/ui/landmarks/hafez-art.js` if it stamps pictures

**Interfaces:** Layer kind `'hafez'` under the painter contract in `parallax-shapes.js`, drawn with `landmarks/kit.js` `blocks`. `landmarks.hafez` is `[FAR, { kind: 'hafez', ...STONE, height, ...its own tones }, GROUND]`.

- [ ] Paint `hafez`, in PIXEL blocks:
  - in the middle, the pavilion on a stepped stone platform: eight slender columns (the front five seen), a band of tile under the eaves, and the dome shaped like a dervish's hat, ribbed, rising to a finial, lit warm from inside (a pulsing layer light), the tombstone pale between the columns;
  - behind it, the long low colonnade of the entrance hall across the band;
  - either side, cypresses, tall and dark, and round orange trees with lit fruit dots.
- [ ] Screenshot the title, a wave and the boss over it (`?debug&level=3` once Task 3 lands; until then a local edit of LEVEL's landmark). Enemies and bullets must stay readable over it. Hash Persepolis and Si-o-se-pol: unchanged.
- [ ] `npm test`: all pass. Commit `feat(ui): the Tomb of Hafez at night`.

### Task 3: Level 3, waves eleven to fifteen

**Files:**
- Modify: `src/core/levels.js`, `src/data/pack.js` (numbers, header), `public/audio/manifest.json`, `test/core/levels.test.js`, `test/data/pack.test.js`, `test/ui/voice-queue.test.js`, `test/ui/levels-flow.test.js`, `test/ui/format.test.js` if its wave totals change
- Create: `public/audio/{yazdah,davazdah,sizdah,chahardah,panzdah}.mp3`, copied from `number-11-word.4241ab6f810a.mp3` to `number-15-word.587a1260a6dc.mp3`

**Interfaces:**
- `LEVELS = [LEVEL, LEVEL_2, LEVEL_3]`; level 3's `first` (11) is counted, not typed.
- Pack numbers gain `n` 11..15: `۱۱ yazdah 840`, `۱۲ davazdah 890`, `۱۳ sizdah 890`, `۱۴ chahardah 860`, `۱۵ panzdah 1070` (word, say, ms).

- [ ] Write the failing tests:
  - `waveNumber(LEVELS[2], 1)` is 11 and `waveNumber(LEVELS[2], 5)` is 15.
  - Level 3 brings all eight species, and the fish fills at least four of its rows.
  - `voiceLines` for a level 3 wave 1 event says `yazdah` first.
  - Pack numbers are 1..15, each `word` `n` in `PACK.digits`.
  - The title lists Level 1, Level 2 and Level 3; level 2's results offer Next into level 3 and level 3's offer Again and Title only; level 3's parade walks its animals.
- [ ] Add level 3, `id: 'level-3'`, `name: 'Level 3'`, a new integer seed, `d: 0.3`, `boss: 'giant-fish'`, `landmark: 'hafez'`, `persian: ['wave', 'score']`, with these waves (tune speeds and `d` only if the autopilot tests demand it):
  - 11: `w('dive', 10, 'bff', 'fan', 1.05)`: birds and fish swoop
  - 12: `w('escort', 3, 'oro', 'aimed', 1.05)`: the power-up wave
  - 13: `w('grid', 10, 'ddmm', 'aimed', 1.1)`: dogs over mice
  - 14: `w('sway', 8, 'hhff', 'fan', 1.15)`: the gunners
  - 15: `w('spiral', 10, 'ffcc', 'ring', 1.25)`: forty fish and cats
- [ ] Extend `NAMES` in `scripts/lift-clips.mjs` with level 2's six ids and level 3's five, re-run it, and check that `git diff public/audio/manifest.json` only adds the five new entries. Add their pack lines.
- [ ] `npm test`: all pass (the autopilot, predict and wave-shape tests already run over every level). Commit with Task 1.

### Task 4: The score in Persian

**Files:**
- Modify: `src/data/pack.js` (`group`, header), `src/ui/format.js`, `src/ui/hud.js` (`score()` and its cache), `src/core/levels.js` (the header's list of `persian` parts), `test/ui/format.test.js`, `test/core/levels.test.js` (known parts), `test/data/pack.test.js`

**Interfaces:**
- `PACK.group`: the Persian thousands separator, U+066C.
- `scoreText(level, score) -> string`: `fmt(score)`, and when `level.persian` includes `'score'`, each digit through `PACK.digits` and each comma as `PACK.group`.
- The HUD's score cache holds the level with the number, so a new level redraws its text.

- [ ] Write the failing tests:
  - `scoreText(level 1, 146800)` and `scoreText(level 2, 146800)` are `'146,800'`; `scoreText(level 3, 146800)` is ۱۴۶٬۸۰۰ built from `PACK.digits` and `PACK.group`.
  - A level's `persian` holds only known parts, now `'wave'` and `'score'`.
  - `PACK.group` is U+066C.
- [ ] Implement them and draw `scoreText` in `hud.js`'s `score()`.
- [ ] Screenshot level 3's HUD in play, and with the score set to 1234567 (a console edit), at 1920 x 1080.
- [ ] `npm test`: all pass. Commit `feat(ui): level 3 keeps its score in Persian digits`.

### Task 5: Finish

- [ ] Run `simplify` over the branch diff and apply what it justifies.
- [ ] Update README, `llms.txt` and the page's descriptions (through `humanizer`) from two levels to three. Leave `og.png` alone unless Babak asks.
- [ ] Ask the advisor to review the branch, update the memory state note and reindex. `npm test`, then push to main (the deploy).
