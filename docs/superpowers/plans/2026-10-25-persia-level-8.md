# Persia level 8 implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An eighth level, no harder to survive than the seventh: five waves numbered ۳۶ to ۴۰ on Naqsh-e Jahan Square in Isfahan at night, a new animal (the lion, شیر) and a giant lion as the boss, dawn colouring the sky from wave 38 with its word آسمان, and the HUD's bombs label in Persian (بمب). First, on its own: the bombs panel shows how to drop a bomb, and a tap on it drops one on a touch screen.

**Architecture:** The bomb hint is HUD drawing plus one touch case in `input.js`. Level 8 goes into the seams level 7 used: a level in `LEVELS`, a species in `SPECIES` with its sprite and pack line (as the mouse came in level 2), a boss in `BOSS_DEFS` (`faceFight`) and `BOSS_ART`, a landmark painter in `PAINTERS`, dawn as a fifth kind in the `WEATHER` table drawn in the sky phase, and `'bombsWord'` as a `persian` part with its word in the pack's `hud`.

**Tech Stack:** Plain ES modules, Canvas 2D, `node:test`; no dependencies and no build.

**Spec:** `docs/superpowers/specs/2026-10-24-persia-design.md` (its "Level 8 specification" section, and the decisions "Platform" and "Show how to bomb").

**Execution:** Opus drives and reviews; Sonnet agents implement one task each. Task 1 goes on `main` and ships alone once Babak says push. Tasks 2 and 5 run in parallel in worktrees meanwhile. Tasks 3 and 7 wait for Babak's approval of شیر and of 36 to 39 in the lessons repo (in review now); 4 follows 3, 6 follows 1.

## Global Constraints

- Every code file under 200 lines; Conventional Commits; never `--no-verify`.
- `src/core` and `src/fx` stay pure: no DOM, canvas, `Math.random` or `Date.now`.
- No Persian word, digit or separator in code outside `src/data/pack.js`; tests build Persian strings from the pack.
- Persian code points only; the pack test covers every new string; Persian a player reads goes through `humanizer-pa`.
- Clips come in through `scripts/lift-clips.mjs <lessons repo>` (its `NAMES` table), only approved IDs; the manifest keeps every other entry byte-identical and gains exactly seven: aseman (Task 5), shir (Task 3), 36 to 40 (Task 7).
- Every export is used (`test/repo-dead.test.js`); band heights are multiples of `PIXEL`.
- Levels 1 to 7, their seven giants and seven landmarks, and the baked sky stay pixel-identical (hash the bakes before and after with the session's Chromium probe, which hashes the data URLs of `buildSky`, `buildLayers` and `bossArt(...).hull.body`; it lives in the session scratchpad, not the repo); the rain, stars, petals and moon fall and turn exactly as before. The HUD's bombs panel changes in every level (Task 1), on purpose.
- Visual work follows `frontend-design` and is judged from screenshots; `simplify` runs at the end.

## Review Focus

1. A touch that starts on the bombs panel drops one bomb (none with no bombs left) and neither steers nor fires until it lifts; a touch anywhere else steers and fires as now; mouse and keys behave exactly as before. Task 1 tests `readInput` with a fake touch.
2. Dawn's word is said once, after wave 38's number and species, only in level 8; levels 4 to 7 still say their weather once; a retry says it again. Task 7 folds level 8 into the weather loop in `voice-queue.test.js`.
3. Dawn sits in the sky behind the mountains and the landmark, never tints the moon's disc, keeps the stars, lies on the 8 px grid, and costs well under a millisecond a frame. Task 5 screenshots it and measures it.
4. Eight cards fit side by side at 1920 x 1080 and in a 1280 x 720 window, each place name on one line, the dome visible on Naqsh-e Jahan's card. Task 7 screenshots both.
5. Level 8 never overwhelms (Babak, 2026-10-25): no more gunners than level 7, no wave with more divers than any earlier wave (40), level 7's `d` and speeds, the lion's fight the dog's and the horse's. Task 7 tests the counts; Task 4 uses `faceFight`.
6. The giant lion's plates sit where its ears and the mane's crown are drawn, and its eyes and mouth can be reached from below. Task 4 checks each part's box against the drawing.

---

### Task 0: Baselines (Opus)

- [x] Hash the sky bake, the layer bakes of all seven landmarks and the bakes of all seven giants on `main` before any task lands.

### Task 1: Show how to bomb, and bomb by touch

**Files:** `src/ui/hud.js` (`stock()`, the lives-and-bombs panel at `hud.js:130`), `src/ui/hud-kit.js` (the panel geometry and `BOMB_PANEL`, so `input.js` and `hud.js` do not import each other), create `src/ui/bomb-keys.js` (the hint glyphs), `src/ui/input.js` (the touch case, and `touchSeen`); tests `test/ui/bomb-keys.test.js`, `test/ui/input.test.js` (new). `createInput` needs `globalThis.addEventListener`, so the input test builds the input (`{ down, taps, mouse }`) and the view (`{ canvas: { width, height, getBoundingClientRect }, fit }`) by hand and calls `readInput`; `input.js` importing `hud-kit.js` is safe in node.

**Interfaces:** Produces `BOMB_PANEL = { x, y, w, h }` in `hud-kit.js`, the bombs half of the lives panel in world px (the panel is `x = W - 332`, `TOP`, 300 x `PH`; the bombs half starts where the BOMBS label does), `bombKeys(ctx, x, y, touch)` drawing the hint, and `touchSeen()` exported from `input.js` (true once any touch went down), which `hud.js` imports: `drawHud` gets only `v.hud` (`view.js:108`), so this getter is the path. `readInput` keeps its shape `{ dx, dy, fire, bomb, target }`.

- [x] `bomb-keys.js`: `bombKeys(ctx, x, y, touch)` draws, in the HUD's pixel style and its label colour, a small key cap with B and a mouse with its right button lit; with `touch` true a tap mark (a fingertip and a ring) instead. About the label's cap height, so it sits on the caption row; no text but the B.
- [x] `hud.js` `stock()`: draw `bombKeys(ctx, x, y, touchSeen())` on the caption row to the right of the BOMBS label, clear of the bomb icons under it; place it from a screenshot (frontend-design).
- [x] `input.js`: a `pointerdown` with `pointerType === 'touch'` sets the module's touch-seen flag. A touch that lands inside `BOMB_PANEL` (through `toWorld`, with the view of the last read, `input.view`, since a pointerdown has none) is claimed by its pointer id (`input.bombTouches`): it adds a `Mouse2` tap, one bomb (the core acts on the edge, `ship.js:92`), and its moves, lift and cancel touch nothing the ship uses after that. So it neither steers nor fires, and a thumb steering elsewhere keeps steering and firing while it taps and lifts. `resetInput` forgets the claimed touches. Mouse right button, Mouse2 taps, B and Shift unchanged. `canvas#game { touch-action: none }` in `src/ui/css/base.css`.
- [x] Tests: a fake input and view: a touch starting inside `BOMB_PANEL` yields `bomb` on the first read only, `fire` false, `target` null; a touch outside steers and fires; after a panel tap lifts, `target` is null (the ship is not pulled to the HUD), and a `pointercancel` ends a bomb touch the same way; a thumb steering and firing keeps doing both while another finger taps the panel and lifts; a mouse press inside the panel still fires and steers (only touch bombs there); `bombKeys` draws the key glyphs with `touch` false and the tap mark with `touch` true (count path calls on a fake ctx).
- [x] Screenshot the HUD at 1920 x 1080 in level 1 and level 7 (keys), and after a synthetic touch (tap mark); tap the panel in Chromium with touch emulation and see a bomb go off.
- [x] Commit `feat(ui): the bombs panel shows how to bomb, and a tap on it bombs`.

### Task 2: Naqsh-e Jahan at night

**Files:** create `src/ui/landmarks/naqsh.js` (split as Yazd and Milad split, e.g. `naqsh-mosque.js`, `naqsh-square.js`, each under 200 lines); modify `src/ui/parallax-shapes.js` (`PAINTERS.naqsh`), `src/ui/looks/persia.js` (`landmarks.naqsh`, and the header names it). Pin Naqsh's FAR height in the look (it varies 420 to 560 across landmarks) and keep the arcades' roofline below dawn's `FOOT` (about y 820, Task 5), so dawn's full colour shows above it.

- [x] The painter follows `milad.js` and `yazd.js`: block helpers from `landmarks/kit.js`, tones from its look entry (Hafez's tile blues and the Yazd mud-brick, plus a turquoise for the dome and a warm lamp), lights pushed for lamps.
- [x] The Shah Mosque at the layer's centre: the great turquoise dome on its drum, patterned in rings, over the tiled portal (a tall pointed arch in its rectangular frame) with a slim minaret either side; Ali Qapu to one side, a tall block with its porch on slim wooden columns under a flat roof; the two-storey arcades running across the whole width, lamps in their arches; the long pool in front with the dome's lights in it. The dome's crown inside the title-card crop (x 480, y 480, w 960, h 600). The layer's `height` is what the dome needs, a multiple of `PIXEL`; set `haze` as Milad did if the default mists it.
- [x] Screenshot the backdrop alone, its title-card crop and a wave over it; the seven earlier landmarks and the sky hash as in Task 0.
- [x] Commit `feat(ui): Naqsh-e Jahan at night, level 8's backdrop`.

### Task 3: The lion

Babak approves شیر in the lessons repo first.

**Files:** `src/core/kinds.js` (`SPECIES.lion = 'diver'`), `src/core/levels.js` (`LETTER.l`), `src/data/pack.js` (the species line, appended last), `src/ui/aliens/animals.js` (`ROWS.lion`; its header's "eight animals" becomes nine), `src/ui/looks/persia.js` (`palette.alien.lion`), `scripts/lift-clips.mjs` (`vocabulary-5-shir` as `shir`), `public/audio/`; tests as the mouse's (level 2 plan, Task 1), and `test/core/kinds.test.js:20` (the exact eight) and `test/ui/art.test.js:45` (`length, 8`), which gain the lion.

**Interfaces:** Produces the species id `'lion'`, fighting as `'diver'`, and its pack line `{ id: 'lion', word: 'شیر', say: 'shir', clip: 'public/audio/shir.mp3', ms }` (`ms` the approved record's), appended last.

- [x] Change the level tests that say a level brings every species (levels 2 to 7 bring all eight) to "every species but `'lion'`" (they pass before and after); the kinds, art and pack tests are the ones that fail once `SPECIES.lion` exists, until the sprite, palette and pack line land.
- [x] `ROWS.lion`: two frames, at most 11 cells wide, in the legend there: a golden face in a dark mane, round ears, lit red brows, a broad nose; frame 2 roars.
- [x] Screenshot a wave with a lion row (a temporary local edit of level 1's wave 1, not committed) at play size and in the word moment's face.
- [x] `npm test`: all pass. Commit `feat: the lion joins the animals`.

### Task 4: The giant lion

**Files:** `src/core/bosses-data.js` (`giantLion`, added to `BOSS_DEFS`), create `src/ui/bosses/giant-lion.js`, `src/ui/bosses/bake.js` (`BOSS_ART`); tests `test/core/boss-data.test.js`, `test/core/boss-kit.js`.

- [x] `giantLion = boss('giant-lion', 'Giant Lion', 'lion', 270, { w: 640, h: 300 }, parts, faceFight('lion', 'mouth', 'crown'))`. Plates `earL`, `earR` (round, at the mane's top corners) and `crown` (the mane's crown between them); weak `eyeL`, `eyeR` and `mouth` (the roaring jaws). The horse's part hp (plates 6, 6, 8; weak 44, 44, 70). Every part's box covers what is drawn for it, no wider, and passes the boss tests' reach and R28 rules. The boss-data loop over the face-on giants gains the lion; the first test's explicit list of kinds gains `'giant-lion'`.
- [x] `test/core/boss-kit.js` `realLevel`: `LEVELS.find((l) => l.boss === kind) ?? LEVELS.at(-1)` until Task 7.
- [x] The art follows `giant-horse.js` and the small lion sprite, so it reads as the same animal: its coat colour, the great dark mane framing the face in tufts, round ears, red brows angled down, a broad nose over the open roaring mouth with its fangs; rage lights it amber then red as the others. Its top stays clear of the HUD (R28 on what is drawn).
- [x] Screenshot it through its phases with a temporary, uncommitted level edit; the seven earlier giants hash as in Task 0.
- [x] Commit `feat: the giant lion, level 8's boss`.

### Task 5: Dawn, a fifth weather

**Files:** create `src/ui/dawn.js`; modify `src/ui/weather.js` (`WEATHER.dawn`), `src/data/pack.js` (`weather.dawn`), `scripts/lift-clips.mjs` (`vocabulary-3-aseman` as `aseman`), `public/audio/`; tests a dawn test, `test/data/pack.test.js`, `test/ui/weather.test.js`.

- [x] Pack `weather.dawn`: `{ word: 'آسمان', say: 'aseman', clip: 'public/audio/aseman.mp3', ms }`, `ms` from the approved record; the manifest gains this one entry.
- [x] `drawDawn(ctx, k, t, quality, reduced)` in `dawn.js`: horizontal bands with `fillRect`, each a multiple of `PIXEL` tall, the first at `ceil((MOON.y + MOON.r) / PIXEL) * PIXEL` (568, from `sky-bodies.js`'s `MOON`) with alpha 0, alpha rising to full at a `FOOT` constant (about 820) and full below it to the screen's bottom, all times `k`; colours from the night above through rose to amber at the horizon, so it reads as the bake's red glow (from y 560, `sky-bodies.js:28`) warming. Colours are constants in `dawn.js`, as `moon.js` and `stars.js` keep theirs (`drawDawn` gets no look). No sprite, no motion, quality and reduced motion ignored. `WEATHER.dawn = ['sky', drawDawn]`.
- [x] Comments: `weather.js`'s header, `levels.js`'s weather line and `pack.js`'s weather line name five kinds.
- [x] Tests: nothing drawn at `k` 0; at `k` 1 every band lies inside the screen's width, on the 8 px grid, at or below y 568, with alpha 0 at the top, rising to full at `FOOT`; in `weather.test.js` with a probe level, dawn draws in `'sky'` only, from wave 3 and at the giant; a wave event with `weather: 'dawn'` says the dawn line after the species.
- [x] Screenshot, with a temporary uncommitted edit giving level 7 `weather: { kind: 'dawn', from: 3 }`, the word moment, dawn mid-fade and settled with a wave in play; measure `drawDawn` per frame.
- [x] Commit `feat: dawn colours the sky, a weather the voice names aseman`.

### Task 6: The bombs label in Persian

**Files:** `src/data/pack.js` (`hud.bombs`, and its header's `hud { wave, score }` gains `bombs`), `src/core/levels.js` (the header names `'bombsWord'`), `src/ui/format.js` (`bombsLabel`), `src/ui/hud.js` (`stock()`); tests `test/ui/format.test.js`, `test/core/levels.test.js`.

- [x] Pack `hud.bombs: 'بمب'` (through `humanizer-pa`).
- [x] `format.js` `bombsLabel(level)`: the pack's word when `showsPersian(level, 'bombsWord')`, else `'BOMBS'`, as `scoreLabel`; its header line.
- [x] `hud.js` `stock()`: the word in the pack's face (`word()`) in the place and size of BOMBS when the part is shown, else the label; the hint from Task 1 stays beside it. Size judged from a screenshot, starting where SCORE's word did (18px).
- [x] Tests: `levels.test.js` `known` gains `'bombsWord'`; `format.test.js` `bombsLabel` from the pack, and `'BOMBS'` without the part.
- [x] Screenshot the HUD with a probe level that has `'bombsWord'`, and level 7's unchanged.
- [x] Commit `feat(ui): a level can name its bombs in Persian`.

### Task 7: Level 8 and waves thirty-six to forty

Babak approves 36 to 39 in the lessons repo first.

**Files:** `src/core/levels.js` (`LEVEL_8`), `src/data/pack.js` (numbers 36 to 40), `scripts/lift-clips.mjs`, `public/audio/`; tests as level 7's.

- [x] `LEVEL_8`: `id 'level-8'`, `name 'Level 8'`, `place 'Naqsh-e Jahan'`, `seed: 83311`, `d: 0.45`, `boss 'giant-lion'`, `landmark 'naqsh'`, `persian` level 7's plus `'bombsWord'`, `weather: { kind: 'dawn', from: 3 }`. Waves at level 7's speeds, two species each: 36 `w('grid', 6, 'llcc', 'aimed', 1.2)` (lions over cats), 37 `w('escort', 3, 'orro', 'aimed', 1.2)`, 38 `w('dive', 10, 'bbmm', 'fan', 1.25)` (birds and mice swoop as dawn begins), 39 `w('sway', 6, 'hhf', 'fan', 1.3)` (the gunners), 40 `w('spiral', 10, 'lldd', 'ring', 1.4)` (lions and dogs). All nine animals, 18 gunners (level 7 has 30), at most 40 divers in a wave.
- [x] Pack numbers 36 to 40: `say` `si-o-shesh`, `si-o-haft`, `si-o-hasht`, `si-o-noh`, `chehel`; `ms` from the approved records; clips from `counting-2199-tal-36` to `-39` and `counting-2199-ti-40`. The manifest gains five.
- [x] `test/core/boss-kit.js` `realLevel`: drop Task 4's `?? LEVELS.at(-1)`.
- [x] Eight cards: screenshot 1920 x 1080 and 1280 x 720; if a place name wraps, trim `.card-place` until each holds one line.
- [x] Tests that change or grow, as level 7's did: `weather.test.js` (`'level-8': 'dawn'`, the pair `[LEVELS[7], 'dawn']`), `levels-flow.test.js` (level 7 offers Next, level 8 `['Again', 'Title']`, its first wave 36, the parade walks all nine), `levels.test.js` (numbering 36 and 40; `gunners(LEVEL_8) <= gunners(LEVEL_7)`, every wave's divers at or under the most of any earlier wave, `d` and speeds at or under level 7's; its giant's species `'lion'`; `LEVEL_8.persian` deepEquals `[...LEVEL_7.persian, 'bombsWord']`; a rabbit every phase), `voice-queue.test.js` (the weather loop covers level 8; its first wave says ۳۶ then lion and cat), the autopilot clears level 8 and survives its first 60 s.
- [x] Play it at `?debug&level=8&auto`: the lion's word moment, dawn, the lion's fight with شیر on its bar and the lions it sends named, بمب on the HUD, the victory card with LEVEL ۸.
- [x] Commit `feat: level 8, the giant lion and waves thirty-six to forty`.

### Task 8: Finish (Opus)

- [x] `simplify` over the level; apply what holds.
- [x] README, `llms.txt`, the page's descriptions and the Open Graph tagline go from seven levels to eight and name the lion and the bomb tap (through `humanizer`); re-render `og.png` headed; CLAUDE.md's scope line.
- [x] Advisor review of the branch; apply what holds.
- [x] Memory: the state note, `landmark-backdrops`, a `level-8-decisions` note; `zg index` in `memory/`.
- [x] `npm test`, push `main`, check CI and Pages with `gh run list`.
