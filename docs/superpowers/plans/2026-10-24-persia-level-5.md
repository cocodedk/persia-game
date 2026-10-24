# Persia level 5 implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A fifth level: five waves numbered ۲۱ to ۲۵ before the Tomb of Cyrus at night, a giant cow as the boss, falling stars from wave 23 with their word ستاره, and the giant's name in Persian on its HUD bar.

**Architecture:** Level 5 goes into the seams level 4 used: a level in `LEVELS`, a boss in `BOSS_DEFS` and `BOSS_ART`, a landmark painter in `PAINTERS`. Level 4's rain becomes the first kind of a level's `weather`, and stars are the second, so the core, the voice and the view each choose by kind from one table instead of naming rain.

**Tech Stack:** Plain ES modules, Canvas 2D, `node:test`; no dependencies and no build.

**Spec:** `docs/superpowers/specs/2026-10-24-persia-design.md` (its "Level 5 specification" section).

**Execution:** Opus drives and reviews; Sonnet agents implement one task each (Babak, 2026-10-24). Tasks 1 and 2 run in parallel in worktrees; 3 and 4 follow on `main`; 5 waits for the four approved clips.

## Global Constraints

- Every code file under 200 lines; Conventional Commits; never `--no-verify`.
- `src/core` and `src/fx` stay pure: no DOM, canvas, `Math.random` or `Date.now`.
- No Persian word, digit or separator in code outside `src/data/pack.js`; tests build Persian strings from the pack.
- Persian code points only; the pack test covers every new string.
- Clips come in through `scripts/lift-clips.mjs ../Danish-Persian-Lessons` (its `NAMES` table), only approved IDs; the manifest keeps every existing entry byte-identical and gains exactly six.
- Every export is used (`test/repo-dead.test.js`); band heights are multiples of `PIXEL`.
- Levels 1 to 4, their four giants and four landmarks stay pixel-identical (hash the bakes before and after); level 4's rain falls exactly as before.
- Visual work follows `frontend-design` and is judged from screenshots; `simplify` runs at the end.

## Review Focus

1. The stars' word is said once, after wave 23's number and species, only in level 5, and level 4 still says باران once at wave 18; a retry says each again at its wave. Task 3 tests it through the core events and `voiceLines`.
2. The stars are never in front of the landmark or what fights: they are drawn under the parallax and the field. Task 3 screenshots wave 23 and the giant's fight.
3. Level 5 started at its giant (`?debug&level=5&boss`) has stars from the first frame and fades them in. Task 3 tests `weatherOf` on a boss-start world.
4. گاو on the HUD bar has its letters joined, in the pack's word face, and levels 1 to 4 keep their English giant names. Task 4 tests `bossName` per level and screenshots the bar.
5. Five cards fit side by side at 1920 x 1080 and in a 1280 x 720 window, and the arrows and Enter work along them. Task 5 screenshots both sizes.

---

### Task 0: Baselines (Opus)

- [x] Hash the sky and layer bakes of all four landmarks and the bakes of all four giants on `main` before any task lands; keep the hashes in the scratchpad.

### Task 1: The Tomb of Cyrus at night

**Files:** create `src/ui/landmarks/pasargadae.js` (split its stamped pictures into `pasargadae-art.js` if it nears 200 lines); modify `src/ui/parallax-shapes.js` (`PAINTERS.pasargadae`), `src/ui/looks/persia.js` (`landmarks.pasargadae`); test `test/ui/landmarks.test.js` if it lists painters.

- [x] The painter follows `azadi.js`: block helpers from `landmarks/kit.js`, the tones from its look entry, `F` and `BW` in blocks, lights pushed for lamps.
- [x] Look entry: the band `height: 600` (F 134), FAR `height: 440` (the Zagros low), and a tone `stone: '#e8d2a8'` (floodlit limestone, warmer than Hafez's `tomb`).
- [x] The tomb, large and central, in blocks from F: base half-width 72; six tiers 17, 11, 11, 6, 6, 6 tall, each inset 6 a side (the three low upper steps are the signature). The chamber's short gabled end faces us: half-width 30, walls 36 tall, a 6 x 10 `L.ink` door at the centre of its foot, a mortar line every 8 rows, a cornice two wider, a gable 20 tall. Lit from below: risers graded `mix(stone, L.ink, 0.05 → 0.45)` bottom to top, the gable darkest, one `L.ink` row at each tier's top edge. Lights: `L.glow` r 110 at ±60 blocks on the floor (a 0.4), `L.lamp` r 40 at the door. Three `post` columns 3 x 36 at ±140..200 in `mix(stone, L.ink, 0.5)`, wall stumps 2–3 tall, the plain one slab. The apex sits near F−116 (y ≈ 552), inside the title card's crop (y ≥ 480).
- [x] Screenshot the backdrop alone, its title card crop and a wave over it; adjust until the tomb reads at a glance as the Tomb of Cyrus. Levels 1 to 4 hash as in Task 0.
- [x] Commit `feat(ui): the Tomb of Cyrus at night, level 5's backdrop`.

### Task 2: The giant cow

**Files:** `src/core/bosses-data.js` (`giantCow`, added to `BOSS_DEFS`), create `src/ui/bosses/giant-cow.js`, `src/ui/bosses/bake.js` (`BOSS_ART`); tests `test/core/boss-data.test.js`.

- [x] `giantCow = boss('giant-cow', 'Giant Cow', 'cow', 270, { w: 640, h: 300 }, …)`. Plates: `hornL`, `hornR` and `curl` (the tuft between the horns, on top); weak: `eyeL`, `eyeR`, `mouth` (under the muzzle, at the bottom). Three phases with the bird's attacks and rates, `cow` minions from the mouth (1, 2, 2) and a `rabbit` from the curl in every phase, as the bird's.
- [x] Cow minions carry hp 3 where the bird's had 1; if the autopilot tests leave their 40–60 s, cut the mouth's cows to (1, 1, 2) before touching any weak part's hp.
- [x] The art follows `giant-bird.js` and `bosses/kit.js` (`eyeArt`, `litCells`, `fan` if useful), and the small cow sprite, not a Holstein: white hide (`palette.alien.cow`), curved horns, the curl, ears under the horns as hull, red brows, the pink muzzle filling the lower third with two dark nostrils and a lit nose ring (an AMBER bloom that swings in `live()`). Rage lights two dark patches amber then red with `litCells`. The body's bottom stays clear of the HUD (R28; the UI test checks it).
- [x] Screenshot it at `?debug&level=4&boss` with the def swapped in a probe (not committed), through its phases; the three earlier giants and the bird hash as in Task 0.
- [x] Commit `feat: the giant cow, level 5's boss`.

### Task 3: Weather: the rain as its first kind, and falling stars

**Files:** `src/core/levels.js` (level 4's `rain: 3` becomes `weather: { kind: 'rain', from: 3 }`; `isRaining` becomes `weatherOf(world) -> kind | null`), `src/core/aliens.js` (the wave event's `rain: true` becomes `weather: kind`), `src/data/pack.js` (`rain` moves to `weather: { rain, stars }`), `scripts/lift-clips.mjs` (`word-bridge-setareh` as `setare`), `public/audio/`, `src/ui/voice-queue.js`, `src/ui/voice.js`, `src/ui/rain.js` (its fade becomes the weather's), create `src/ui/stars.js`, `src/ui/view.js`; tests `test/core/rain.test.js` (renamed `weather.test.js`), `test/ui/rain.test.js`, a stars test, `test/data/pack.test.js`, `test/ui/voice-queue.test.js`.

- [x] `weatherOf(world)` is the level's `weather.kind` when the level has weather and `world.boss !== null || world.wave >= weather.from`, else `null`. `spawnWave` adds `weather: kind` to the `'wave'` event of the wave it begins with, and only then. Tests: level 4's third wave event carries `weather: 'rain'` and no other event of levels 1 to 4 carries weather; a fresh level 4 world is dry until wave 18; a boss-start world with weather has it. (Level 5 joins these tests in Task 5.)
- [x] Pack `weather.stars`: `{ word: 'ستاره', say: 'setare', clip: 'public/audio/setare.mp3', ms }`, `ms` from the approved record; the manifest gains this one entry here (Task 5 adds five). `voiceLines` pushes `pack.weather[e.weather]` after the species; `spoken = (pack) => [...pack.species, ...pack.numbers, ...Object.values(pack.weather)]`, and `test/data/pack.test.js`'s `LINES` likewise. Tests: level 4's wave 18 says the number, its species, then the rain line, as before; a wave event with `weather: 'stars'` says the stars line in the same place.
- [x] `drawStars(ctx, k, t, quality, reduced)` in `stars.js`, stateless like `rain.js`: flourish's slope and length, 14 lanes at full quality, 7 at half, 6 and slower under reduced motion; batched like the rain, one path for all tails per frame and the cached `glow('#ffffff')` for the heads, no per-star gradient. Drawn in the sky phase, after `drawFlourishes` and before `field`, so the mountains and the landmark cover them; the rain keeps its place in the field. `src/ui/weather.js` holds `fadeWeather` (rain.js's fade, moved) and `WEATHER = { rain: ['field', drawRain], stars: ['sky', drawStars] }`; `drawWeather(ctx, v, world, t, phase)` runs at both sites; the view keeps `weather: { since: null }`. Tests: none at `k` 0; half the lanes at half quality.
- [x] Screenshot level 4 at wave 18 (the rain exactly as before) and a probe of stars over the Persepolis backdrop.
- [x] Commit `refactor: a level's weather, with the rain its first kind` then `feat: falling stars, a weather the voice names setare`.

### Task 4: The giant's name in Persian

**Files:** `src/core/levels.js` (the header gains "'boss': its giant's name as the species' word"), `src/ui/format.js` (`bossName(level, def)`), `src/ui/hud.js`, `src/ui/hud-kit.js`; tests `test/ui/format.test.js`, `test/core/levels.test.js` (its `known` parts gain `'boss'`).

- [x] `bossName(level, def)`: the pack word of `def.species` when `level.persian` includes `'boss'`, else `def.name.toUpperCase()`. The HUD bar draws it. `word(ctx, s, x, y, size, color)` in `hud-kit.js`: `ctx.font` = `${PACK.font.weight} ${size}px "${PACK.font.family}", sans-serif` (not `FONT`, whose first face holds only digits), `letterSpacing '0px'`, one `fillText`; the bar draws the Persian name with it at 22 px, middle-aligned on the caption row, in the label's colour. `createWordMoment` loads the face at boot (`src/main.js`), minutes before a giant comes in play; on `?debug&level=5&boss` the first frames may fall back to the system face, still joined; say so in the comment. Tests: `bossName` is the pack's cow word for a level with `'boss'` and `GIANT COW` without; levels 1 to 4 do not include `'boss'`.
- [x] Screenshot the bar with the Persian name on a probe level; levels 1 to 4's bars are unchanged.
- [x] Commit `feat(ui): a level can name its giant in Persian`.

### Task 5: Level 5 and waves twenty-one to twenty-five

Waits for Babak's approval of `counting-2199-tal-22` to `-25` in the lessons repo.

**Files:** `src/core/levels.js` (`LEVEL_5`), `src/data/pack.js` (numbers 21 to 25), `scripts/lift-clips.mjs`, `public/audio/`, `src/ui/css/screens.css` if five cards need it; tests `test/core/levels.test.js`, `test/core/weather.test.js`, `test/data/pack.test.js`, `test/ui/voice-queue.test.js`, `test/ui/levels-flow.test.js`.

- [x] `LEVEL_5`: `id 'level-5'`, `name 'Level 5'`, `place 'Tomb of Cyrus'`, its own seed, `d` a step above level 4's, `boss 'giant-cow'`, `landmark 'pasargadae'`, `persian` level 4's plus `'boss'`, `weather: { kind: 'stars', from: 3 }`. `d: 0.4`. Five waves: 21 cows over a row of dogs, 22 the escort with two rows of rabbits, 23 a row of cows and the birds swoop as the stars begin, 24 the gunners, 25 forty cats and mice; waves 23 and 25 keep to two species (the wave contract in `levels.test.js`), and the cows' four rows are in 21 to 23; fire multipliers a step above level 4's; cows in four rows across the waves (they are armoured), and the test asserts more than two.
- [x] Drop the giant-cow fallback in `test/core/boss-kit.js` `realLevel` (`?? LEVELS.at(-1)`) now that level 5 carries the cow.
- [x] Pack numbers 21 to 25: `say` `bist-o-yek`, `bist-o-do`, `bist-o-se`, `bist-o-chahar`, `bist-o-panj`; `ms` from the approved records; clips lifted from `counting-2199-tal-21` to `-25`. The manifest gains five entries here (Task 3 added setare's).
- [x] Tests: level 5's first wave says ۲۱ (`number(21)`) then its species; its wave 23 says the stars line once; a retry is clear until wave 23; level 4's results offer Next to level 5; level 5 retries from wave 21; the parade walks its animals.
- [x] Five cards: `.level-cards { gap: 1.2rem }`, `.level-card { width: 17rem }` (89.8rem across; `html`'s font-size is min(vh/54, vw/96), so both sizes are one rem test); arrows and Enter work; screenshot 1920 x 1080 and 1280 x 720. The autopilot tests clear level 5 and survive its first 60 s.
- [x] Play it through at `?debug&level=5&auto`: the word moments, the stars at wave 23, the cow's fight, the victory card with LEVEL ۵.
- [x] Commit `feat: level 5, the giant cow and waves twenty-one to twenty-five`.

### Task 6: Finish (Opus)

- [x] `simplify` over the level; apply what holds.
- [x] README, `llms.txt`, the page's descriptions and the Open Graph tagline go from four levels to five (through `humanizer`); re-render `og.png` headed from the same frame; CLAUDE.md's scope line, and its rule becomes "Persian text renders as a DOM overlay, or as one whole word in one canvas `fillText` in the pack face with no letter spacing; never per-letter canvas text."
- [x] Advisor review of the branch; apply what holds.
- [x] Memory: the state note, `landmark-backdrops`, a `level-5-decisions` note; `zg index` in `memory/`.
- [x] `npm test`, push `main`, check CI and Pages with `gh run list`.
