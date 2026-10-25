# Persia level 10 implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A tenth level, no harder to survive than the ninth: five waves numbered ۴۶ to ۵۰ at the Tomb of Ferdowsi at night, a new animal (the fox, روباه, a diver) and a giant fox as the boss, a moonbow from wave 48 with its word رنگین‌کمان, and the HUD's combo label in Persian (پیاپی).

**Architecture:** The seams level 9 used: a level in `LEVELS`, a species in `SPECIES` with its sprite and pack line (as the camel came), a boss in `BOSS_DEFS` (`faceFight`) and `BOSS_ART`, a landmark painter in `PAINTERS` built on `scene()`, the rainbow as a seventh kind in the `WEATHER` table drawn in the sky phase, and `'comboWord'` as a `persian` part read through `hudLabel` with its word in the pack's `hud`.

**Tech Stack:** Plain ES modules, Canvas 2D, `node:test`; no dependencies and no build.

**Spec:** `docs/superpowers/specs/2026-10-24-persia-design.md` (its "Level 10 specification" section).

**Execution:** Opus drives and reviews; Sonnet agents implement one task each. Tasks 1, 2 and 5 can start now, in parallel worktrees. Babak approves the five clips in the lessons repo first (drafts on its review page now); then the pack lines of Tasks 2 and 3 and all of Task 6 follow. Task 4 follows 3; 6 follows the rest.

## Global Constraints

- Every code file under 200 lines; Conventional Commits; never `--no-verify`.
- `src/core` and `src/fx` stay pure: no DOM, canvas, `Math.random` or `Date.now`.
- No Persian word, digit or separator in code outside `src/data/pack.js`; tests build Persian strings from the pack.
- Persian code points only; the pack test covers every new string; Persian a player reads goes through `humanizer-pa`.
- Clips come in through `scripts/lift-clips.mjs <lessons repo>` (its `NAMES` table), only approved IDs; the manifest keeps every other entry byte-identical and gains exactly seven: rangin-kaman (Task 2), rubah (Task 3), 46 to 50 (Task 6).
- Every export is used (`test/repo-dead.test.js`); band heights are multiples of `PIXEL`.
- Levels 1 to 9, their nine giants and nine landmarks, and the baked sky stay pixel-identical (the session's Chromium probe hashes `buildSky`, `buildLayers` and `bossArt(...).hull.body`; its level 1 to 9 baseline is from `2d7d759`); the HUD of levels 1 to 9 too (the HUD probe, touch and no touch); rain, stars, petals, the moon, dawn and sunrise fall and turn exactly as before.
- Visual work follows `frontend-design` and is judged from screenshots; `simplify` runs at the end.

## Review Focus

1. The rainbow's word is said once, after wave 48's number and species, only in level 10; levels 4 to 9 still say their weather once; a retry says it again. Its word moment shows رنگین‌کمان whole: the ZWNJ keeps its two halves unjoined with no gap or box, and every letter takes its colour. Task 6 folds level 10 into the weather loop in `voice-queue.test.js`; Task 2 screenshots the word.
2. The rainbow sits in the sky behind the mountains and the landmark, on the 8 px grid, clear of `MOON`'s disc and under the HUD band; it is baked once and costs well under a millisecond a frame. Task 2 tests the grid, the moon and the single bake, and measures it.
3. Ten cards fit in two rows of five at 1920 x 1080 and in a 1280 x 720 window with the logo and the hint, each place name on one line, Left and Right walking them in level order and Up and Down changing row, the tomb's cornice on its card. Task 6 screenshots both.
4. Level 10 never overwhelms: no more gunners than level 9 (18), no wave with more divers than any earlier level's (40), level 9's `d` and speeds, the fox's fight the camel's. Task 6 runs `noHarder(LEVEL_10)`; Task 4 uses `faceFight`.
5. پیاپی sits centred over the combo meter in its word face, clear of the number at its x8 pulse, and COMBO is unchanged in levels 1 to 9. Task 5 screenshots it cold and burning and runs the HUD probe.

---

### Task 0: Baselines (Opus)

- [x] Bake hashes of the sky, all nine landmarks and all nine giants, and the HUD probe of levels 1 to 9, on `2d7d759`.

### Task 1: The Tomb of Ferdowsi at night

**Files:** create `src/ui/landmarks/ferdowsi.js` (split as Qabus split, e.g. `ferdowsi-tomb.js`, `ferdowsi-garden.js`, each under 200 lines); modify `src/ui/parallax-shapes.js` (`PAINTERS.ferdowsi`), `src/ui/looks/persia.js` (`landmarks.ferdowsi`, and the header names it), `src/ui/landmarks/kit.js` and `src/ui/landmarks/siosepol.js` (`reflect` moves into the kit).

- [x] The painter builds its art with `scene()` from `landmarks/kit.js`, as `qabus.js` does, with tones from its look entry: a white stone warmed by the floodlight, its shade a cool grey, the pool's water, the lawns' and hedges' greens, the lamps; lights pushed for the lamps.
- [x] The tomb at the layer's centre, wide and squat beside Qabus's tower: a broad white cube on a wide, low platform of steps; four tall corner columns with double-headed bull capitals (`stamp` the `CAPITAL` exported by `persepolis-art.js`, which reads the painter's own tones) under a deep stepped cornice; a pair of shorter engaged columns on each wall; the winged figure high on the front over panels of verse (a few rows of dark marks, not letters); floodlit from below, brightest low.
- [x] The pool, side on: `F` is its far edge at the platform's foot, as Si-o-se-pol's `F` is its waterline, and the water is the band's `UNDER` rows (about 30 to 36 blocks, since the ground hides the lowest 14) in the middle x-range, with lawn and low hedges either side, lamps on the paths beside it, trees beyond, and the fountains as lit specks on the water. The mirror: move `reflect` from `siosepol.js:97` into `landmarks/kit.js` as `reflect(g, x, w, F, depth)`; Si-o-se-pol passes `0, w, F, 44` (its hash holds), Ferdowsi the pool's x-range and its own depth.
- [x] Heights: the cornice inside the title-card crop (x 480, y 480, w 960, h 600, taken on the frame, `landmark-art.js:10`); the layer about 480 high (squat beside Qabus's 592, never over 592), a multiple of `PIXEL`. Pin its FAR height in the look, as Milad and Si-o-se-pol pin 560, high enough that the far ridge at the rainbow's feet stays above the bow's centre (Task 2); Task 6 moves the bow, never FAR.
- [x] Screenshot the backdrop alone, its title-card crop and a wave over it; the nine earlier landmarks and the sky hash as in Task 0.
- [x] Commit `feat(ui): the Tomb of Ferdowsi at night, level 10's backdrop`.

### Task 2: The rainbow, a seventh weather

**Files:** create `src/ui/rainbow.js`; modify `src/ui/weather.js` (`WEATHER.rainbow`, its header), `src/data/pack.js` (`weather.rainbow`, once رنگین‌کمان is approved, and its header's weather line), `src/core/levels.js` (its weather line), `scripts/lift-clips.mjs` (`vocabulary-3-ranginkaman` as `rangin-kaman`), `public/audio/`; tests a rainbow test, `test/data/pack.test.js`, `test/ui/weather.test.js`, `test/ui/voice-queue.test.js` (beside its sunrise case).

**Interfaces:** Consumes `cached(key, w, h, paint)` (`sprites.js:62`) as `moon.js` uses it and `MOON` from `sky-bodies.js`. Produces `drawRainbow(ctx, k)` and `BLOCKS`, the bow's blocks in frame coordinates as rows of `[x, y, w, colour]`, built at load as `sunrise.js` builds `LAYERS`; the bake paints them and the test imports them (an export used in its own file and by a test passes `test/repo-dead.test.js:60-66`).

- [x] `drawRainbow`: nothing at `k` 0; else `drawImage` of the bow baked once by `cached`, at `globalAlpha` `k` times `STRENGTH` (0.85 as shipped, Babak's ask: the colours distinct, as a Japanese pixel game draws a rainbow). The bake is `BLOCKS`' bounding box, its top-left a multiple of 8, drawn at that top-left; it paints each block with `fillRect`. Seven bands, red outside to violet inside, one block per band; as shipped the block is `4 * PIXEL` (16 px) so the bow is 112 px across with chunky steps, and each band is one flat, full colour (the first draft, 8 px blocks pulled toward white, read too pale for the word). Its centre right of the tomb and below the far ridge, so the arc rises behind the tomb from the right, its feet behind the far mountains, its top under the HUD band, every block outside `MOON`'s disc. Constants in `rainbow.js` (`BOW`, `STRENGTH`), placed provisionally here; Task 6 checks them on level 10's own backdrop. It takes no motion, so `reduced` and the quality change nothing. `WEATHER.rainbow = ['sky', drawRainbow]`.
- [x] Pack `weather.rainbow`: `{ word: 'رنگین‌کمان', say: 'rangin-kaman', clip: 'public/audio/rangin-kaman.mp3', ms }`, `ms` from the approved record; the manifest gains this one entry; `test/data/pack.test.js:27`'s list of weather kinds gains `'rainbow'`.
- [x] Comments: `weather.js`'s header, `levels.js`'s weather line and `pack.js`'s weather line name seven kinds.
- [x] Tests: nothing drawn at `k` 0; every block of `BLOCKS` lies on the 8 px grid, outside `MOON`'s disc and below the HUD band; at `k` 1 the `drawImage` destination is the blocks' top-left, and two frames draw the same canvas (as `test/ui/moon.test.js:38-41` checks); in `weather.test.js` with a probe level, the rainbow draws in `'sky'` only, from wave 3 and at the giant; in `voice-queue.test.js` a wave event with `weather: 'rainbow'` says the rainbow line after the species.
- [x] Screenshot, with a temporary uncommitted edit giving level 9 `weather: { kind: 'rainbow', from: 3 }`, the word moment (رنگین‌کمان whole, its halves apart at the ZWNJ, each letter coloured) and the bow settled with a wave in play; measure `drawRainbow` per frame.
- [x] Commit `feat: a moonbow, a weather the voice names rangin-kaman`.

### Task 3: The fox

Babak approves روباه in the lessons repo first.

**Files:** `src/core/kinds.js` (`SPECIES.fox = 'diver'`), `src/core/levels.js` (`LETTER.x`), `src/data/pack.js` (the species line, appended last), `src/ui/aliens/animals.js` (`ROWS.fox`; its header's "ten animals" becomes eleven), `src/ui/looks/persia.js` (`palette.alien.fox`), `scripts/lift-clips.mjs` (`vocabulary-5-rubah` as `rubah`), `public/audio/`; tests as the camel's (level 9 plan, Task 3): `test/core/kinds.test.js` (the exact ten) and `test/ui/art.test.js` (`length, 10`) gain the fox.

**Interfaces:** Produces the species id `'fox'`, fighting as `'diver'`, its row letter `x`, and its pack line `{ id: 'fox', word: 'روباه', say: 'rubah', clip: 'public/audio/rubah.mp3', ms }`, appended last.

- [x] Level 8's and 9's species assertions (`test/core/levels.test.js:95`, `:101`, `Object.keys(SPECIES).filter(...)`) gain `&& id !== 'fox'` (they pass before and after; levels 2 to 7 compare with the fixed `EIGHT` and need nothing); the kinds, art and pack tests are the ones that fail once `SPECIES.fox` exists, until the sprite, palette and pack line land.
- [x] `ROWS.fox`: two frames, at most 11 cells wide: a russet face narrowing to a pointed muzzle with a black nose, white cheeks, tall pointed ears with black backs, amber eyes, lit red brows; frame 2 shows its teeth. The legend (`animals.js:103-107`) has no amber eye, so it gains one lit letter, `A: ['#ffb03a', true]` (the kit's amber); the cheeks reuse `w` (`#fff8e8`, the teeth and claws) unless a screenshot wants their own letter. `palette.alien.fox` a russet redder than the cat's `#ff9a3a`, judged in one row beside the cat, the lion and the camel.
- [x] Screenshot a wave with a fox row (a temporary local edit of level 1's wave 1, not committed) at play size and in the word moment's face.
- [x] `npm test`: all pass. Commit `feat: the fox joins the animals`.

### Task 4: The giant fox

**Files:** `src/core/bosses-data.js` (`giantFox`, added to `BOSS_DEFS`), create `src/ui/bosses/giant-fox.js`, `src/ui/bosses/bake.js` (`BOSS_ART`); tests `test/core/boss-data.test.js`, `test/core/boss-kit.js`.

- [x] `giantFox = boss('giant-fox', 'Giant Fox', 'fox', 270, { w: 640, h: 300 }, parts, faceFight('fox', 'mouth', 'brow'))`. Plates `earL`, `earR` (tall, high at the head's sides, each 60 wide as the horse's and the camel's) and `brow` (the russet crown between them); weak `eyeL`, `eyeR` and `mouth` (the jaws under the black nose). The camel's part hp. Every part's box covers what is drawn for it, no wider, and passes the boss tests' reach and R28 rules. The face-on loop in the boss-data tests gains the fox; the explicit list of kinds gains `'giant-fox'`.
- [x] `test/core/boss-kit.js` `realLevel`: `LEVELS.find((l) => l.boss === kind) ?? LEVELS.at(-1)` until Task 6.
- [x] The art follows `giant-camel.js` and the small fox sprite, so it reads as the same animal: the russet coat, the white cheeks flaring sideways below the eyes, the long muzzle narrowing to the black nose, the tall ears with black backs and pale insides, red brows angled down; the eyes burn in the weak colour as every giant's do (`eyeArt`, `bosses/kit.js:120`); rage lights it amber then red as the others. The hull is an `OUTLINE` read through `outlineWidth`, as `giant-camel.js:17`, narrowing to a muzzle about a third of the brow's width, with no paws. Face on, a fox is the giant cat with a longer muzzle, so what tells it apart is drawn on purpose: the white cheek ruff, the black ear backs and nose, round pupils (not `giant.js:98`'s slit), a coat redder than the cat's, and the cat's muzzle-less oval head (`headAt`, `giant.js:19`) and paws are not its shape. The ear tips stay clear of the HUD (R28 on what is drawn).
- [x] Screenshot it through its phases beside the giant cat, with a temporary, uncommitted level edit; the nine earlier giants hash as in Task 0.
- [x] Commit `feat: the giant fox, level 10's boss`.

### Task 5: The combo label in Persian

**Files:** `src/data/pack.js` (`hud.combo`, and its header's `hud` line), `src/core/levels.js` (the header names `'comboWord'`), `src/ui/format.js` (its header: `hudLabel`'s keys gain `'combo'`, `showsPersian`'s parts `'comboWord'`), `src/ui/hud.js` (`caption()`, `combo()`); tests `test/ui/format.test.js`, `test/core/levels.test.js`.

- [x] Pack `hud.combo: 'پیاپی'` (through `humanizer-pa`).
- [x] `caption(ctx, level, key, x, size, align = 'left')`, passing `align` to `word` and `label`; `combo()` calls `caption(ctx, world.level, 'combo', x + 75, ALEF_WORD_SIZE, 'center')` in place of the COMBO label. پیاپی has an alef, so it starts at the alef words' size, and `ALEF_WORD_SIZE`'s comment names the three labels; if its final ی's tail touches the x8 number at its pulse, a `COMBO_WORD_SIZE` of 16, never a move of `COMBO_MID`. Judged from a screenshot.
- [x] Tests: `levels.test.js` `known` gains `'comboWord'`; `format.test.js` `hudLabel(level, 'combo')` gives the pack's word with the part, `{ text: 'COMBO', persian: false }` without it.
- [x] Screenshot the HUD with a probe level that has `'comboWord'`, cold and burning (x8); the HUD probe of levels 1 to 9 hashes as in Task 0.
- [x] Commit `feat(ui): a level can name its combo in Persian`.

### Task 6: Level 10 and waves forty-six to fifty

Babak approves 46, 47 and 49 in the lessons repo first.

**Files:** `src/core/levels.js` (`LEVEL_10`), `src/data/pack.js` (numbers 46 to 50), `scripts/lift-clips.mjs`, `public/audio/`, `src/ui/css/screens.css` (the cards), `src/ui/screens/title.js` and `src/ui/screens/dom.js` (the arrows in a grid); tests as level 9's.

- [x] `LEVEL_10`: `id 'level-10'`, `name 'Level 10'`, `place 'Tomb of Ferdowsi'`, `seed: 104173`, `d: 0.45`, `boss 'giant-fox'`, `landmark 'ferdowsi'`, `persian` level 9's plus `'comboWord'`, `weather: { kind: 'rainbow', from: 3 }`. Waves at level 9's speeds: 46 `w('grid', 6, 'xxaa', 'aimed', 1.2)` (foxes over camels), 47 `w('escort', 3, 'orro', 'aimed', 1.2)`, 48 `w('dive', 10, 'bbmm', 'fan', 1.25)` (birds and mice swoop as the rainbow comes), 49 `w('sway', 6, 'llh', 'fan', 1.3)` (two rows of lions over the horses), 50 `w('spiral', 10, 'ccdd', 'ring', 1.4)` (forty cats and dogs). Ten animals, no fish; 18 gunners, as level 9; at most 40 divers in a wave.
- [x] Pack numbers 46 to 50: `say` `chehel-o-shesh`, `chehel-o-haft`, `chehel-o-hasht`, `chehel-o-noh`, `panjah`; `ms` from the approved records; clips from `counting-2199-tal-46` to `-49` and `counting-2199-ti-50`. The manifest gains five.
- [x] `test/core/boss-kit.js` `realLevel`: drop Task 4's `?? LEVELS.at(-1)`.
- [x] Ten cards in two rows of five: `.level-cards` wraps, centred, its `max-width` exactly five cards (5 x the card's width + 4rem for the gaps; wrapping in 89rem would give rows of six and four); the comment above it says so. rem is the 96 x 54 stage (`base.css:19`). The budget: logo 11rem, gaps 2.4rem, and two rows (a card is about 0.625 x (width - 1.64) + 5.9 rem tall, 1rem between) must end above the hint (bottom 2.4rem, about 1.4 tall) with room for the focused card's `scale(1.05)`. At 17rem the lower row touches the hint, so start at about 14rem (a stack of about 42rem); Tomb of Ferdowsi at 0.89rem bold needs about 8 of the card's 12.4 inner rem. Set `.card-number` and `.card-place` to the largest sizes that keep every name on one line, never under 0.89rem; if the stack does not fit, narrow the cards (their pictures), never the names.
- [x] The arrows in the grid: `title.js` calls `navigate(cards, code, 5)`, and `dom.js:43-45` keeps horizontal moves wrapping in a grid (`if (cols === 1 || mv[1] === 0)`), so Left and Right walk the cards in level order and Up and Down change row; the `levels-flow` wrap test stands and gains a Down check. Screenshot 1920 x 1080 and 1280 x 720.
- [x] The rainbow on level 10's own backdrop: play wave 48 and move `BOW` (Task 2), never FAR, until the arc rises behind the tomb from the right with its feet behind the far ridge, clear of the moon (the far layer shifts only about 8.6 px across the ship's range, 0.06 x SHIFT 0.15 x 960); set `STRENGTH` so the bow reads and the night stays night.
- [x] Tests that change or grow, as level 9's did: `test/core/weather.test.js` (`'level-10': 'rainbow'`, the pair `[LEVELS[9], 'rainbow']`), `levels-flow.test.js` (level 9 offers Next, level 10 `['Again', 'Title']`, its first wave 46, the parade walks its ten), `levels.test.js` (numbering 46 and 50; every species but `'fish'`; `noHarder(LEVEL_10)`; its giant's species `'fox'`; `LEVEL_10.persian` deepEquals `[...LEVEL_9.persian, 'comboWord']`; a rabbit every phase), `voice-queue.test.js` (the weather loop covers level 10; its first wave says ۴۶ then fox and camel), the autopilot clears level 10 and survives its first 60 s.
- [x] Play it at `?debug&level=10&auto`: the fox's word moment, the rainbow, the fox's fight with روباه on its bar and the foxes it sends named, پیاپی on the HUD, the victory card with LEVEL ۱۰.
- [x] Commit `feat: level 10, the giant fox and waves forty-six to fifty`.

### Task 7: Finish (Opus)

- [ ] `simplify` over the level; apply what holds.
- [x] README, `llms.txt`, the page's descriptions and the Open Graph tagline go from nine levels to ten and name the fox (through `humanizer`); re-render `og.png` headed; CLAUDE.md's scope line.
- [ ] Advisor review of the branch; apply what holds.
- [ ] Memory: update the state note, `landmark-backdrops` and `level-10-decisions` (it exists); `zg index` in `memory/`.
- [ ] `npm test`, push `main` once Babak has played it and says push, check CI and Pages with `gh run list`.
