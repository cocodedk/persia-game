# Persia Level 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

Written 2026-10-24 by Opus, not Fable, because Babak asked for it after approving the design. Fable
reviewed it. Revised the same day after Babak's rule: no unused or dead code.

**Goal:** Turn a copy of invaders into Persia's concept level: a cinematic open, five waves of angry
animals named in Persian, a giant boss, a parade of the seven names, then "Again". Persia keeps no
code that level 1 does not run.

**Architecture:** Copy invaders at commit `332a622` into this repo, then cut it down to what level 1
runs, in three passes:

1. the trailer, demo, lobby and run recording;
2. worlds 2–8 and every world rule except bullet time;
3. once level 1 is final, every formation, pattern, move and export it never uses, with tests that
   keep them out.

The Persian layer goes on top. The fixed-step core gains species, one level that runs waves into a
boss, and two events (`wave`, `boss`). A DOM-free voice queue turns those events into lines.
`voice.js` plays the approved clips on a voice bus of their own, and a DOM overlay shows each spoken
species word. All language lives in `src/data/pack.js`.

**Tech Stack:** Plain ES modules, Canvas 2D, WebAudio, DOM overlays, `node:test`. No dependencies.

**Spec:** `docs/superpowers/specs/2026-10-24-persia-design.md`, approved by Babak on 2026-10-24.
Read it before Task 1. The reference code is `../invaders` at `332a622`. Read its `CLAUDE.md` for
the level shorthand and the core rules.

## Global Constraints

- **No dead code.** Persia keeps nothing level 1 does not run. That rules out dormant features, "for
  later" branches, exports that only tests import, and any registry entry, kind, event, field, sound
  or test whose subject the game no longer runs. When a cut needs surgery, do the surgery; git
  history keeps the old code. Task 8 adds tests that enforce this from then on.
- Laptop, keyboard and mouse. No phone or touch work.
- No npm dependencies, no bundler, no build step, no network at runtime beyond the page's own
  origin. All URLs relative.
- Every code file under 200 lines (JS, HTML, CSS, scripts), enforced in CI and in
  `test/repo.test.js`. Markdown is exempt.
- `src/core` and `src/fx` stay pure: no `window`, `document`, canvas, `Math.random` or `Date.now`.
  Randomness comes from an `rng`, time from `dt`. Data that changes at runtime lives in arrays, not
  in object-key order.
- Fixed step `TICK = 1/60`, quantized inputs, a 1920x1080 world with y down.
- Pause on blur, M mutes, frame time capped at 0.1 s, `prefers-reduced-motion` respected.
- `localStorage` only under `persia.` keys, always inside try/catch. The game works without it.
- Clean screen in play: no captions, translations or help text. Invaders' HUD stays. The only
  language on screen is the word moment. No Danish anywhere. Chrome is English. No English animal
  name is ever shown, because it would be a translation.
- The code never contains a Persian word. Arabic-script characters (U+0600–U+06FF) appear in `src/`
  and `test/` only in `src/data/pack.js`. Species ids in code are English (`dog`, `cat`, …).
- Persian text rules: ک U+06A9, never ك U+0643. ی U+06CC, never ي U+064A. ZWNJ U+200C for
  نیم‌فاصله. No diacritics in pack words. Digits ۰–۹ only if digits are shown, and none are in
  level 1.
- Persian text renders as a DOM overlay, never as per-letter canvas text.
- Only these twelve approved clips, copied with provenance:
  `vocabulary-5-{sag,gorbe,asb,gav,mahi,parande,khargush}` and `number-{1..5}-word`. No synthesis,
  no new clips.
- Names are original: no film titles, character names, logos or quoted lines.
- Conventional Commits. Never `--no-verify`. Never force-push `main`. Push only to
  `github.com/cocodedk`.
- Never commit machine-specific absolute paths. Name sibling repos by relative path
  (`../invaders`, `../Danish-Persian-Lessons`).
- Skills, from `CLAUDE.md`: `karpathy-guidelines` before writing code;
  `frontend-design:frontend-design` before any task that changes what the player sees (3, 7, 9, 10);
  `humanizer` for English copy (11); `simplify` after each task's code is done and before its commit.
- Executors stop at the plan boundary. When blocked or unsure, write the question under "Questions"
  at the top of this file and stop.

## Review Focus

1. **Sound locked or muted when a species appears** (no gesture yet, or M pressed). The word still
   shows on time, and nothing plays late when sound returns.
   Test: Task 7, `voice.test.js`, "with no audio nodes the word still shows on schedule".
2. **A wave cleared before its lines finish.** The old wave's unstarted lines are dropped, so no
   word shows for a species that is already dead.
   Test: Task 7, `voice-queue.test.js`, "new lines replace the unstarted backlog".
3. **Pause mid-line.** No new line starts under the pause menu, and lifting the speech duck does not
   lift the pause duck.
   Tests: Task 7, `voice-queue.test.js`, "the queue waits while it is not stepped", and
   `audio-duck.test.js`, "menu and speech ducks multiply".
4. **A clip that fails to load or decode** (404, `file://`, an old browser). The player gets
   silence, no throw, and the word still shows. A clip that decodes late is never played late.
   Tests: Task 7, `voice.test.js`, "a rejected fetch is silent" and "a line whose clip is not
   decoded yet is skipped, not played late".
5. **Leaving mid-line** (Restart, Title, Retry, Again). The queue and the word clear, so no word
   appears over the title or the next run's first frame.
   Test: Task 7, `voice.test.js`, "clear() drops the queue, hides the word and lifts the duck". The
   wiring in `router.js` `leave()` is checked in review.

## Questions

(none yet)

---

### Task 1: Fork invaders

**Files:**
- Create: everything `git -C ../invaders archive 332a622` holds, except `CLAUDE.md`, `README.md`,
  `docs/` and `og.png`.
- Modify: `src/ui/storage.js` (prefix), `test/ui/storage.test.js`, `package.json`, `CNAME`,
  `index.html` (`<title>` only), `src/ui/screens/title.js` (logo word).

**Interfaces:**
- Produces: the invaders game, renamed, with `PREFIX = 'persia.'` in `src/ui/storage.js`.

- [x] **Step 1: Copy the tree**

```bash
git -C ../invaders archive 332a622 | tar -x --exclude=CLAUDE.md --exclude=README.md --exclude=docs --exclude=og.png
```

Expected: 288 files land. This repo's `CLAUDE.md`, `docs/` and `memory/` are untouched.

- [x] **Step 2: Rename the identity.**
  - In `storage.js`, set `PREFIX = 'persia.'` and update the key comments. Update the expected keys
    in `storage.test.js` to match.
  - Set `"name":"persia"` in `package.json` and `persia.cocode.dk` in `CNAME`.
  - Set `<title>Persia</title>` in `index.html` and `const word = 'PERSIA'` in `title.js`.
  - Leave the rest of the site copy for Task 11.
- [x] **Step 3: Install the hooks and run the suite.**
  Run `bash scripts/install-hooks.sh && npm test`. Expect every test to pass, with 0 failures.
- [x] **Step 4: Commit.** Leave `.mcp.json` and `.claude/` out:
  `git add -A -- . ':!.mcp.json' ':!.claude' && git commit -m "chore: fork invaders at 332a622"`

### Task 2: Strip the trailer, cinema, demo, lobby and run recording

**Files:**
- Delete:
  - `src/ui/trailer/` (all) and `src/ui/demo/` (all)
  - `src/ui/film-view.js`, `src/fx/film.js`, `src/core/highlights.js`
  - `src/ui/screens/{cinema,posters,lobby}.js`
  - `src/ui/css/{cinema,demo,lobby}.css`
  - `src/ui/aliens/sheet.js` and `dev.html`
  - `src/core/replay.js` and `src/core/state-hash.js` (only the trailer's run saving needs replays)
  - `src/ui/debug.js` (the Pi frame readout)
  - `scripts/difficulty.mjs` and `scripts/difficulty-run.mjs`
  - every test whose subject is gone: `test/ui/trailer-*.test.js`, `test/fx/film.test.js`,
    `test/ui/film-view.test.js`, `test/core/highlights.test.js`, `test/ui/demo-script.test.js`,
    `test/core/replay*.test.js`, `test/core/replay-kit.js`
- Modify:
  - `src/main.js`, `src/ui/router.js`, `src/ui/flow.js`, `src/ui/session.js`, `src/ui/scenes.js`,
    `src/ui/storage.js`, `src/ui/screens/{title,card}.js`
  - `src/ui/debug-hooks.js`, `src/ui/audio.js`, `src/ui/music.js`, `src/ui/sfx-film.js`
  - `src/core/input-codec.js`, `src/core/levels.js` (drop `DEMO_LEVEL`)
  - `index.html` (stylesheet links), and the tests of the trimmed modules

**Interfaces:**
- Produces in `router.js`: `startLevel(level)`, `goTitle()`, `pause()`, `restart()` and
  `leave(screen)`. The title menu has one item, Play, which calls `r.startLevel(LEVELS[0])`.
- Produces in `flow.js`: `showResults(o)` and `showFailed(o)`, called directly. The outcome is built
  from the world (score, stars, state). There is no recording, run or tainted flag.
- Produces in `session.js`: `createSession(level, seed?)` and `stepSession(...)`, with no `record`,
  `inputs`, `events`, `recording`, `runOf` or `taint`.
- Produces in `input-codec.js`: `IDLE` and `quantizeInput` only. `encodeInputs`, `decodeInputs` and
  `MAX_TICKS` go. `TICK` comes from `kinds.js`.
- Produces in `storage.js`: the `best` and `muted` keys only. The `run.<id>` and `demoSeen` keys go,
  and so does `allBest`.
- `audio.js` loses `hush` and the voice groups, which only the trailer used. `music.js` loses
  `musicLook`. `sfx-film.js` keeps `braam`, `riser` and `impact` for the open in Task 9; `tick`,
  `pop`, `whoosh`, `rewind` and `clap` go.
- `debug-hooks.js` keeps two hooks: `?debug&level=<id>` and `?debug&auto`, where the autopilot flies
  a play scene. Every other hook goes.

- [ ] **Step 1: Delete the files listed above.**
- [ ] **Step 2: Fix every import of a deleted file and drop what only served it.**
  - Pause offers Resume, Restart and Title.
  - Results offer Next (while there is a next level), Retry and Title.
  - Failed offers Retry and Title.
  - `card.js` drops the tagline.
  - When a test covers both kept and deleted behaviour, delete only the deleted cases. Never weaken
    an assertion about kept behaviour.
- [ ] **Step 3: Run the suite.** `npm test` should report 0 failures. Then run
  `grep -rnE "trailer|blooper|cinema|poster|lobby|DEMO_LEVEL|startDemo|startTry|saveBestRun|replay|stateHash|hush|musicLook" src test index.html`.
  It should print nothing.
- [ ] **Step 4: Play it.** Serve with `python3 -m http.server 8000` and open
  http://localhost:8000/.
  - Play starts w1-1.
  - P pauses, and Title goes back to the title.
  - M toggles sound.
  - `?debug&auto` flies the level by itself.
  - The console shows no errors.
- [ ] **Step 5: Commit.**
  `git add -A && git commit -m "refactor: strip the trailer, cinema, demo, lobby and run recording"`

### Task 3: Strip worlds 2–8 and every rule but bullet time, and set the night look

Invoke `frontend-design:frontend-design` first. The look is the backdrop and the music. The sprites
come in Task 6.

**Files:**
- Delete:
  - `src/ui/looks/w1.js`…`w8.js`, `src/ui/aliens/w2.js`…`w8.js`
  - `src/ui/bosses/{pyramid,fortress,shogun,queen,agent,titan,singularity}.js`
  - `src/core/bosses-data-2.js` and `src/core/levels-2.js` (move `w` and `lv` into `levels.js`)
  - `src/core/twists.js`, `src/core/twists-2.js`, `src/core/bunkers.js`
  - `src/ui/bunker-skins.js`, `src/ui/bunkers-view.js`, `src/ui/parallax-city.js`,
    `src/ui/parallax-barren.js`
  - every file left with no importer (expect `glyphs.js` and `sky-bodies-2.js`)
  - `test/core/autopilot-w2.test.js`…`w8.test.js`, `test/core/twists*.test.js`,
    `test/core/bunkers.test.js`, `test/core/autopilot-cover.test.js`, and every other test case
    about a deleted rule or world
- Create:
  - `src/core/bullet-time.js`. It holds the glitch world's near-miss slow-down, moved out of
    `twists-2.js`, and runs on every level.
  - `test/core/bullet-time.test.js` (its cases moved from the twist tests)
  - `src/ui/looks/persia.js`
- Modify:
  - core: `kinds.js`, `levels.js`, `world.js`, `world-step.js`, `collide.js`, `damage.js`,
    `weapons.js`, `aim.js`, `dodge.js`, `predict.js`, `aliens.js`, `bosses-data.js`
  - ui: `looks/index.js`, `aliens/{bake,index}.js`, `bosses/bake.js`, `view.js`, `fx-view.js`,
    `bullets-view.js`, `parallax-shapes.js`, `parallax-wild.js`, `sky-bodies.js`, `ambient*.js`,
    `flourish*.js`, `sound-data.js`, `sounds.js`, `sfx-*.js`, `hud.js`
  - fx: `fx/react-world.js`
  - `test/core/world-kit.js` and the tests

**Interfaces:**
- Produces in `bullet-time.js`: `SLOW_TIME`, `SLOW_COOL`, `stepBulletTime(world, dt)` (a near miss
  off cooldown starts it and emits `bulletTime`), and `enemyDt(world, dt)`.
- Produces on the world: `slow` and `cool`. The fields `wind`, `saucer`, `wrecks`, `well`, `twist`
  and `bunkers` are gone. `world-step.js` calls `stepBulletTime` where `applyTwist` was.
- Produces in `kinds.js`: `TWISTS` and `WELL` are gone, and `BOSSES = ['mothership']` (renamed in
  Task 4).
- Produces in `levels.js`: `LEVELS` is invaders world 1 (`w1-1`…`w1-5`) with no `twist` or
  `bunkers` field. `WORLDS` has one entry.
- Produces in `looks/persia.js` (the starting values; the sprite colours come in Task 6):
  ```js
  sky: [[0, '#05030f'], [0.5, '#120a2e'], [0.82, '#3a1240'], [1, '#6a1e3a']], body: 'redmoon', haze: '#5a2a6a',
  layers: [mountains far, pines mid, ground near with an amber line], ambient: [twinkle, scanlines],
  flourish: ['shooting'], palette.accent '#ffb03a', bullet: 'pixel',
  music: { mood: 'desert brass', root: 'D', scale: 'homayoun', bpm: 112 }
  ```
  The music is invaders' Web Audio engine (drone, lead, drums) in `brass`, which is the kind of
  produced track Babak likes. The fields not listed (`palette.alien`, `palette.boss`, `power`,
  `shot`, `beam`, `enemy`, `enemyRim`) start with world 1's values. Task 6 sets the sprite colours.
  - The registries keep only what this look uses: `BODIES.redmoon`, parallax kinds `mountains`,
    `pines` and `ground`, ambient `twinkle` and `scanlines`, flourish `shooting`, `STYLES.brass`,
    bullet style `pixel`, and one pickup skin set.
  - `SCALES` keeps `homayoun = [0, 1, 4, 5, 7, 8, 10]` and whatever else `brass` needs.

- [ ] **Step 1: Write `bullet-time.test.js`.** Move the near-miss cases from the twist tests into
  it, rewritten for a world without a twist field:
  - a near miss starts bullet time and emits `{ type: 'bulletTime', on: true }`
  - enemies move at the slowed `enemyDt`
  - it ends after `SLOW_TIME` and emits `on: false`
  - no second start inside `SLOW_COOL`

  Run `npm test`. It should FAIL on the missing module.
- [ ] **Step 2: Cut and move.**
  - Delete the files listed above and every branch, field, event, sound and reaction of a deleted
    rule.
  - Move bullet time into `bullet-time.js`.
  - Rewrite `levels.test.js` for one world of five levels, keeping its data rules: 3–5 waves, at
    most 40 aliens a wave, a carrier on every wave level, plain data.
  - Tests that named another world's level now build what they need with `world-kit`'s `level()`
    and `wave()`, or use `w1-x`. Delete a test outright when its subject is a deleted rule or world.
  - `sounds.test.js` still holds: every core event is sounded or listed in `SILENT`, and the core
    emits no event that `SILENT` names.
- [ ] **Step 3: Run the suite and the name check.** `npm test` should report 0 failures. Then run
  `grep -rnwE "gusts?|wind|darkness|lightning|shuriken|cut|acid|drips?|glitch|teleport|reassemble|wrecks?|gravity|well|saucer|bunkers?|twist|pyramid|fortress|shogun|queen|singularity|titan|arcade|blocks|chip" src`.
  It should print nothing; the only exception allowed is a word in English prose that means
  something else, so read each hit.
- [ ] **Step 4: Play w1-1 and w1-5 in the browser** (`?debug&level=w1-5`).
  - Expect invaders world 1 under the red moon, with mountains, pines and the brass music.
  - Expect bullet time on a near miss and no console errors.
  - Screenshot both levels and report the paths.
  - Report the size with `git ls-files src | xargs wc -l | tail -1`.
- [ ] **Step 5: Commit.**
  `git add -A && git commit -m "refactor: strip worlds 2-8 and every rule but bullet time; set the night look"`

### Task 4: Level 1 in the core: species, five waves, then the giant

**Files:**
- Modify:
  - core: `kinds.js`, `levels.js`, `formations.js` (`makeSlots`), `aliens.js` (`spawnWave`),
    `bosses-kit.js` (`minion`), `boss-attack.js`, `bosses-data.js`, `boss.js` (`spawnBoss`),
    `world.js`, `world-step.js`
  - ui: `sounds.js` (`SILENT`) and `bosses/bake.js` (the mothership painter draws `giant` until
    Task 6)
  - every reader of `worldName`, `reelName` or `WORLDS`: `hud.js`, `router.js`, `flow.js`,
    `screens/{title,card}.js`, `debug-hooks.js`. The title's tagline goes.
- Test:
  - `test/core/levels.test.js` (rewrite) and `test/core/level-flow.test.js` (new)
  - `test/core/autopilot-level.test.js` (replaces `autopilot-w1.test.js`)
  - the boss tests, now on `giant`
  - every test that used a `w1-x` level, now on `LEVEL` or a `world-kit` literal

**Interfaces:**
- Produces in `kinds.js`:
  ```js
  // The animal an alien is drawn as and named by; its value is the invaders role it fights as.
  export const SPECIES = { dog: 'grunt', cat: 'diver', bird: 'diver', fish: 'gunner', horse: 'gunner', cow: 'armored', rabbit: 'carrier' };
  export const BOSSES = ['giant'];
  ```
- Produces in `levels.js`: `w(formation, cols, rows, pattern, speed)`.
  - `rows` is one species letter per row, top row first: d dog, c cat, b bird, f fish, h horse,
    o cow, r rabbit.
  - It returns
    `{ formation, rows, cols, species: [id per row], roles: [SPECIES[id] per row], pattern, speed }`.
  - `levels.js` also produces `LEVEL`, `LEVELS = [LEVEL]` and `levelById(id)`. `lv`, `worldName`,
    `reelName` and `WORLDS` go, and the UI labels read `level.name`.
  ```js
  export const LEVEL = {
    id: 'level-1', name: 'Level 1', seed: 10417, d: 0.1, boss: 'giant',
    waves: [
      w('grid', 10, 'ddd', 'aimed', 0.9),     // 1: a pack of dogs marches in
      w('escort', 3, 'oro', 'aimed', 0.95),   // 2: cows guard the rabbits: the first power-ups
      w('dive', 8, 'bcc', 'fan', 1.0),        // 3: birds and cats swoop
      w('sway', 8, 'hhf', 'fan', 1.05),       // 4: horses and fish, all gunners
      w('spiral', 10, 'ccdd', 'ring', 1.15),  // 5: forty cats and dogs
    ],
  };
  ```
  These numbers are the starting point. Tune them by playing, inside the rules `levels.test.js`
  sets. Drop `world` and `index` wherever nothing reads them.
- Produces on aliens: `alien.species` (a string, or `null` for test waves without species). Slots
  carry `species: wave.species?.[row] ?? null`.
- Produces two events on `world.events`:
  - `{ type: 'wave', tick, wave, species }`: `wave` is the 1-based number and `species` the wave's
    distinct ids in row order. `spawnWave` emits it, so wave 1's comes at tick 0.
  - `{ type: 'boss', tick, kind, species }`, emitted by `spawnBoss`.
- Produces in `bosses-kit.js`: `minion(species, count, every, from)` returns
  `{ species, role: SPECIES[species], count, every, from }`. A minion alien carries `species`.
- Produces in `bosses-data.js`: `giant`, a giant angry cat head.
  - It keeps the mothership's geometry and phases, so the boss tests' clear-column checks still
    hold.
  - Parts are renamed: `dome`→`brow`, `wingL/R`→`pawL/R`, `gunL/R`→`eyeL/R`, `eye`→`mouth`.
  - It has `name: 'Giant'` and `species: 'cat'`.
  - Minions: `minion('cat', 3, …)` where the mothership had grunts, and
    `minion('rabbit', 1, 16, 'brow')` where it had the carrier.
- Produces in `world.js`: `createWorld` spawns the boss at creation only when the level has no
  `waves`. Today it spawns whenever `level.boss` is set, which would put the giant beside wave 1.
- Produces in `world-step.js`: `BOSS_GAP = 2.5` (seconds).
  - When the last wave clears on a level with a boss, the gap runs, then `spawnBoss`.
  - `stepWave` returns at once while `world.boss` is set. Without that, it emits `waveClear` on
    every tick the field is empty during the fight.
  - `won()` on such a level waits for `world.boss?.dying === 0`.
  - `waveClear.last` is true only when no boss follows.
- Produces in `sounds.js`: `SILENT.wave` and `SILENT.boss`, both `'the voice speaks it (voice.js)'`.
- `debug-hooks.js`: `level=` becomes `?debug&boss`, which starts level 1 with the giant already
  spawned.

- [ ] **Step 1: Write the failing tests**

```js
// test/core/levels.test.js
test('there is one level: five waves, then the giant', () => {
  assert.deepEqual(LEVELS, [LEVEL]);
  assert.equal(LEVEL.waves.length, 5);
  assert.equal(LEVEL.boss, 'giant');
});
test('every wave brings one or two species, at most 40 aliens, valid against kinds.js', () => {
  for (const wave of LEVEL.waves) {
    assert.ok(new Set(wave.species).size <= 2 && wave.species.length === wave.rows);
    assert.ok(wave.rows * wave.cols <= 40);
    assert.deepEqual(wave.roles, wave.species.map((s) => SPECIES[s]));
    assert.ok(FORMATIONS.includes(wave.formation) && PATTERNS.includes(wave.pattern));
  }
});
test('all seven species appear, a carrier wave comes before wave 3, four or more formations', () => {
  const seen = new Set(LEVEL.waves.flatMap((x) => x.species));
  assert.deepEqual([...seen].sort(), Object.keys(SPECIES).sort());
  assert.ok(LEVEL.waves.slice(0, 2).some((x) => x.roles.includes('carrier')));
  assert.ok(new Set(LEVEL.waves.map((x) => x.formation)).size >= 4);
});
// test/core/level-flow.test.js (world-kit's level() and wave() gain species)
test('spawning a wave emits its number and its distinct species in row order', ...);
//   createWorld(LEVEL).events has { type: 'wave', wave: 1, species: ['dog'] }
test('every alien carries its row species', ...);
test('the last wave cleared brings the giant after BOSS_GAP, and it says so', ...);
//   kill the last wave; after BOSS_GAP - TICK: world.boss === null, state 'play';
//   after BOSS_GAP: world.boss.kind === 'giant', an event { type: 'boss', kind: 'giant', species: 'cat' }
test('the giant is not there with wave 1, and no waveClear fires once it is up', ...);
//   createWorld(LEVEL).boss === null; after the boss event, 10 s of play emit no waveClear
test('a waves-then-boss level is cleared only when the boss chain is over', ...);
test('the giant launches cats and a rabbit, each carrying its species', ...);
// test/core/autopilot-level.test.js
test('the autopilot clears level-1 within 300 s with an invulnerable ship', ...);
test('it survives the first 60 s of level-1 with its three lives, on the level seed and two others', ...);
```

- [ ] **Step 2: Run the new tests.** `npm test` should FAIL on the missing `LEVEL` and `SPECIES` and
  the `wave` and `boss` events.
- [ ] **Step 3: Implement the interfaces above.**
  - Move the world-1 survival test out of `autopilot.test.js` into `autopilot-level.test.js`, on
    `LEVEL`.
  - Run the boss tests on `giant`.
- [ ] **Step 4: Run the suite.** `npm test` should report 0 failures, including `sounds.test.js`.
- [ ] **Step 5: Play level 1 in the browser,** once in full (`?debug&auto` will do) and once with
  `?debug&boss`. Expect five waves, a 2.5 s gap, and the boss drawn in the mothership art, then the
  results.
- [ ] **Step 6: Commit.** `git commit -am "feat(core): level 1 runs five animal waves into the giant"`

### Task 5: The word pack and its assets

**Files:**
- Create:
  - `scripts/lift-clips.mjs`
  - `public/audio/{sag,gorbe,asb,gav,mahi,parande,khargush,yek,do,se,chahar,panj}.mp3`
  - `public/audio/manifest.json`
  - `public/fonts/Vazirmatn-Bold.woff2` and `public/fonts/OFL.txt`
  - `src/data/pack.js`
- Test: `test/data/pack.test.js`, and one new test in `test/repo.test.js`.

**Interfaces:**
- Produces `PACK` in `src/data/pack.js`. Species are listed in the order they first appear in
  level 1, which is also the parade order:
  ```js
  export const PACK = {
    lang: 'fa', dir: 'rtl',
    font: { family: 'PackWord', file: 'public/fonts/Vazirmatn-Bold.woff2', weight: '700' },
    species: [
      { id: 'dog', word: 'سگ', clip: 'public/audio/sag.mp3', ms: 760 },
      { id: 'cow', word: 'گاو', clip: 'public/audio/gav.mp3', ms: 760 },
      { id: 'rabbit', word: 'خرگوش', clip: 'public/audio/khargush.mp3', ms: 1070 },
      { id: 'bird', word: 'پرنده', clip: 'public/audio/parande.mp3', ms: 780 },
      { id: 'cat', word: 'گربه', clip: 'public/audio/gorbe.mp3', ms: 760 },
      { id: 'horse', word: 'اسب', clip: 'public/audio/asb.mp3', ms: 760 },
      { id: 'fish', word: 'ماهی', clip: 'public/audio/mahi.mp3', ms: 860 },
    ],
    numbers: [
      { n: 1, word: 'یک', clip: 'public/audio/yek.mp3', ms: 760 },
      { n: 2, word: 'دو', clip: 'public/audio/do.mp3', ms: 760 },
      { n: 3, word: 'سه', clip: 'public/audio/se.mp3', ms: 760 },
      { n: 4, word: 'چهار', clip: 'public/audio/chahar.mp3', ms: 760 },
      { n: 5, word: 'پنج', clip: 'public/audio/panj.mp3', ms: 840 },
    ],
    letterColours: ['#ffd23a', '#3affc8', '#ff5ad8', '#7aa8ff', '#ff8a3a'],
  };
  ```
- Produces `public/audio/manifest.json`: an array with one record per clip, holding
  `{ file, clipId, sha256, durationMs, transcript, synthesisText, voiceModel, modelSha256, engineVersion, reviewedBy, license, sourceFile }`.
  Every field except `file`, `sha256` and `sourceFile` is copied from the clip's record in the
  lessons repo.
- Produces `scripts/lift-clips.mjs <lessons-repo-dir>`, run from the repo root as
  `node scripts/lift-clips.mjs ../Danish-Persian-Lessons`. It:
  - reads `src/audio/approved.generated.json` in the lessons repo
  - copies the twelve clip IDs from `public<record.file>` to `public/audio/<name>.mp3`, using a
    clip-ID→name table in the script
  - refuses any record whose `reviewedBy` is empty
  - computes each clip's sha256 and writes the manifest
- `PACK` has no consumer in `src` until Task 7. That is the only export allowed to wait, and Task
  8's gate checks it.

- [ ] **Step 1: Write the failing tests**

```js
// test/data/pack.test.js
const RULE = /^[؀-ۿ‌]+$/;
test('every pack word is Persian script only: no ك, no ي, no diacritics, no digits, no edge ZWNJ', () => {
  for (const { word } of [...PACK.species, ...PACK.numbers]) {
    assert.match(word, RULE);
    assert.doesNotMatch(word, /[كيً-ٟ٠-٩۰-۹0-9]/);
    assert.doesNotMatch(word, /^‌|‌$/);
  }
});
test('the rule rejects ك, ي, a diacritic and an ASCII digit', ...); // cases written as \u escapes, built from PACK words
test('pack species are exactly the core SPECIES ids, and numbers are 1..5', ...);
test('every pack clip is on disk, listed once in the manifest with its sha256, ms equal to durationMs, reviewed', ...);
test('the manifest lists exactly the pack clips and nothing else', ...);
// test/repo.test.js
test('no file in src or test outside src/data/pack.js contains Arabic-script characters', ...);
//   tests take their Persian from PACK or write it as \u escapes
```

- [ ] **Step 2: Run the new tests.** `npm test` should FAIL on the missing pack and files.
- [ ] **Step 3: Lift the assets and write the pack.**
  - Write `lift-clips.mjs` and run it.
  - Copy `Vazirmatn-Bold.woff2` and `OFL.txt` from `../Danish-Persian-Lessons/public/fonts/`.
  - Write `pack.js`.
- [ ] **Step 4: Run the suite.** `npm test` should report 0 failures.
- [ ] **Step 5: Commit.**
  `git add -A && git commit -m "feat(data): add the word pack, twelve approved clips and their provenance"`

### Task 6: The animals and the giant

Invoke `frontend-design:frontend-design` first. Keep invaders' world-1 language: crisp pixel sprites
and lit phosphor cells, with glow from cached sprites and `'lighter'`, never `shadowBlur`. The animals
are angry and a little absurd:

- The dog snarls and its ears flap.
- The cat arches with slit eyes, claws out on frame 2.
- The bird dives beak-first, its wings beating.
- The fish stands upright and spits.
- The horse rears, nostrils flared.
- The cow is horned and plated, with a nose ring.
- The rabbit has huge ears and hugs a glowing core, the power-up it drops.

Every species except the rabbit has lit red brows.

**Files:**
- Create: `src/ui/aliens/animals.js` (split into `animals-2.js` if it nears 200 lines) and
  `src/ui/bosses/giant.js`.
- Delete: `src/ui/aliens/w1.js` and `src/ui/bosses/mothership.js`.
- Modify: `src/ui/aliens/bake.js`, `src/ui/aliens/index.js`, `src/ui/aliens/cracks.js`,
  `src/ui/bosses/bake.js`, `src/ui/looks/persia.js` (sprite colours), and `src/ui/hud.js` if it
  reads alien colours.
- Test: `test/ui/art.test.js` and `test/ui/bosses.test.js`.

**Interfaces:**
- Consumes: `SPECIES` and `alien.species` (Task 4), and the boss part ids `brow`, `pawL`, `pawR`,
  `eyeL`, `eyeR` and `mouth`.
- Produces in `bake.js`:
  - `SPECIES_LIST = Object.keys(SPECIES)`.
  - `speciesSprites(look, species, scale = 1)`, which returns `{ body, lights, flash, size, scale }`
    with 2 frames each and replaces `roleSprites`.
  - `warmAliens(look)`, which bakes all seven, plus cracks for the species whose role is crackable.
    `CRACKABLE` stays keyed by role, so map species to role through `SPECIES`.
  - Painters keep the shape `(b, l, frame, colour)`, with `colour = look.palette.alien[species]`.
  - Each sprite is at most 11–12 cells wide at `PX = 5`, no wider than its hit circle.
  - Any painter, extra or crack set level 1 never draws (the saucer and the wreck) goes.
- `palette.alien` becomes keyed by species, so every reader follows. The draw loops in
  `aliens/index.js` look up colours and sprites by `a.species`; today they use `colors[a.role]`.
  Any read of the carrier's colour takes `palette.alien.rabbit`.
- Produces in `looks/persia.js`, as starting values:
  - `palette.alien`: `{ dog: '#e8d0a8', cat: '#ff9a3a', bird: '#3affc8', fish: '#5ab8ff', horse: '#c88a5a', cow: '#f4f4f4', rabbit: '#ff7ac8' }`
  - `palette.boss`: `{ hull: '#2a1430', plate: '#ff9a3a', weak: '#ffe14a' }`

- [ ] **Step 1: Write the failing tests.**
  - In `art.test.js`:
    - "every species has a painter and a palette colour, and no painter is left over"
    - "speciesSprites bakes two frames of body, lights and flash for each species"
    - "warmAliens bakes all seven without throwing"
  - In `bosses.test.js`: "the giant painter is the only one registered and draws every part id of
    the giant def"
- [ ] **Step 2: Run them.** `npm test` should FAIL.
- [ ] **Step 3: Draw the seven animals and the giant cat head.**
  - The brow plate carries the ears.
  - The paws reach out at the sides.
  - The eyes and mouth glow as the weak points, and their cracks follow the parts.
- [ ] **Step 4: Run the suite.** `npm test` should report 0 failures.
- [ ] **Step 5: Screenshot and look.** Use the Playwright browser tools at 1920x1080 to capture the
  title backdrop, waves 1, 3 and 5, and the boss mid-fight (`?debug&boss`). Save the shots to the
  scratchpad and report the paths. Each species should read at a glance and differ from the others
  in shape, not just colour.
- [ ] **Step 6: Commit.** `git add -A && git commit -m "feat(ui): angry animal sprites and the giant cat"`

### Task 7: The voice and the word moment

Invoke `frontend-design:frontend-design` for the overlay.

**Files:**
- Modify: `src/ui/audio.js`, `src/ui/scenes.js`, `src/ui/router.js`, `src/main.js`, and `index.html`
  (add `<div id="words"></div>` between the canvas and `#ui`, and link `word.css`).
- Create: `src/ui/voice-queue.js` (DOM-free), `src/ui/voice.js`, `src/ui/word-moment.js` and
  `src/ui/css/word.css`.
- Test: `test/ui/voice-queue.test.js`, `test/ui/voice.test.js`, `test/ui/word-moment.test.js` and
  `test/ui/audio-duck.test.js`.

**Interfaces:**
- Consumes: the `wave` and `boss` events (Task 4) and `PACK` (Task 5).
- Produces in `audio.js`:
  - A voice bus, `VOICE = 1.2` (tuned by ear), feeding `master`.
  - `audioNodes()` returns `{ ctx, music, noise, voice }`.
  - `duckSpeech(level)`. Music gain is `MUSIC × menuDuck × speechDuck`, and the sfx bus gain is
    `speechDuck`. Ducking uses a 0.06 s time constant going down and 0.25 s coming back up.
  - `duck(level)` keeps its signature and sets `menuDuck`.
  - With `hush` gone in Task 2, `audio.js` stays under 200 lines.
- Produces in `voice-queue.js`:
  - `LINE_GAP = 0.15`, the seconds between lines.
  - `voiceLines(events)` returns `Line[]`:
    - a `wave` event gives `{ kind: 'number', n: e.wave }`, then one `{ kind: 'species', id }` per
      entry in `e.species`
    - a `boss` event gives `{ kind: 'species', id: e.species }`
    - any other event gives nothing
  - `clipOf(pack, line)` returns `{ clip, ms, word }`, with `word` null for numbers.
  - `createQueue()` returns `{ lines: [], wait: 0 }`.
  - `enqueue(q, lines)` replaces the lines that have not started yet and leaves `wait` alone.
  - `stepQueue(q, dt, pack)` returns the `Line` that starts now, or `null`. After a start,
    `wait = ms / 1000 + LINE_GAP`.
  - `clearQueue(q)`.
- Produces in `voice.js`:
  `createVoice(pack, { nodes = audioNodes, duck = duckSpeech, fetch = globalThis.fetch, show, hide })`,
  which returns `{ hear(events), update(dt), speak(line), clear() }`.
  - At creation it fetches every clip's bytes. A failed fetch becomes `null`.
  - On the first `update` that finds `nodes()` non-null, it decodes every clip, once.
  - `speak(line)` calls `show(word)` for species lines. If `nodes()` is non-null and the clip is
    decoded, it plays the clip on `voice` and calls `duck(0.45)`. Once the clip's `ms` has passed in
    `update` time, it calls `duck(1)`. A clip that is not decoded yet is skipped, never played late.
  - `update(dt)` steps the queue and speaks whatever line starts.
  - `clear()` empties the queue, stops the clip that is playing, calls `duck(1)` and calls `hide()`.
- Produces in `word-moment.js`:
  - `letterRuns(word, colours)` returns `[{ text, colour }]`, one run per letter. A ZWNJ stays
    inside the run before it. Run `i` gets `colours[i % colours.length]`.
  - `createWordMoment(root, canvas, pack)` returns `{ show(word), hide() }`.
    - It loads the pack font with
      `new FontFace(pack.font.family, url(pack.font.file), { weight })` and `document.fonts.add`.
    - It builds `<div class="word-moment" lang dir>` with one `<span>` per run.
    - It sizes and places the div from `canvas.getBoundingClientRect()`: centred horizontally, its
      middle at 34% of the canvas height, with a font size of 15% of the canvas height.
    - It restarts the animation on each `show`.
- `word.css`:
  - The moment lasts 1.35 s: a 0.12 s fade in from scale 0.86, a hold to 1.0 s, then a fade out.
  - The glow is `text-shadow`.
  - It has `pointer-events: none`, and the stage screens sit above it.
  - Under reduced motion it only fades.
- Wiring:
  - `main.js` creates `words` and `voice` and hands `voice` to the router.
  - `playScene(..., { voice })` calls `voice.hear(events)` in `onEvents`.
  - `runScene` calls `sc.voice.update(dt)` only when it steps the scene, so a paused screen holds
    the queue.
  - `router.leave()` calls `voice.clear()`.
  - The title backdrop has no voice.

- [ ] **Step 1: Write the failing tests**

```js
// test/ui/voice-queue.test.js
test('a wave event says its number, then its species; a boss event says its species', () => {
  assert.deepEqual(voiceLines([{ type: 'wave', wave: 3, species: ['bird', 'cat'] }, { type: 'kill' }]),
    [{ kind: 'number', n: 3 }, { kind: 'species', id: 'bird' }, { kind: 'species', id: 'cat' }]);
  assert.deepEqual(voiceLines([{ type: 'boss', kind: 'giant', species: 'cat' }]), [{ kind: 'species', id: 'cat' }]);
});
test('lines start one after another, each clip length plus LINE_GAP apart', ...);
//   number 1 (760 ms) at 0, dog at 0.91 s; nothing in between
test('new lines replace the unstarted backlog', ...);          // Review Focus 2
test('the queue waits while it is not stepped', ...);            // Review Focus 3
// test/ui/voice.test.js (fake ctx from test/ui/audio-kit.js, fake fetch)
test('with no audio nodes the word still shows on schedule', ...);              // Review Focus 1
test('a rejected fetch is silent, does not throw, and still shows the word', ...); // Review Focus 4
test('a line whose clip is not decoded yet is skipped, not played late', ...);    // Review Focus 4
test('a decoded clip plays on the voice bus and ducks to 0.45, then lifts after its ms', ...);
test('clear() drops the queue, hides the word and lifts the duck', ...);          // Review Focus 5
// test/ui/audio-duck.test.js
test('menu and speech ducks multiply: duck(0.35), duckSpeech(0.45), duckSpeech(1) leaves music at 0.35 of MUSIC', ...);
// test/ui/word-moment.test.js
test('letterRuns gives each letter its own colour in order, wrapping the palette', ...); // the rabbit's PACK word, 3 colours
test('a ZWNJ stays inside the letter before it', ...);
//   cow word + '‌' + dog word -> 5 runs; run 2 is the cow word's last letter followed by '‌'
```

- [ ] **Step 2: Run them.** `npm test` should FAIL.
- [ ] **Step 3: Implement the interfaces above.**
- [ ] **Step 4: Run the suite.** `npm test` should report 0 failures, and `wc -l src/ui/audio.js`
  should show fewer than 200 lines.
- [ ] **Step 5: Hear and see it.**
  - Play waves 1–3 in the browser.
  - Screenshot a word moment in Chromium and in Firefox (Playwright), and check that the letters are
    joined in both. If either browser breaks the joining across spans, stop and write it under
    Questions.
  - Check by ear that each line is clear over the fire, and tune `VOICE` if it isn't.
  - Press M mid-wave and confirm the words still appear.
- [ ] **Step 6: Commit.**
  `git add -A && git commit -m "feat(ui): speak the waves and species on a voice bus and show the word moment"`

### Task 8: Cut what level 1 never runs, and keep it cut

Level 1 and its sprites are final now, so every kind and branch they do not use goes. Tests then keep
dead code out for the rest of the plan.

**Files:**
- Modify:
  - core: `kinds.js`, `formations.js`, `formations-2.js`, `patterns.js`, `patterns-2.js`,
    `boss-move.js`, `boss-phase.js`, `bosses-kit.js`, `difficulty.js`, `levels.js`, `aim.js`,
    `dodge.js`, `predict.js`
  - ui: `sfx-*.js`, `sound-data.js`, and any `src/ui/` file left holding an unused branch
  - the tests of all of these
- Create: `test/repo-dead.test.js`

**Interfaces:**
- Produces in `kinds.js`: `FORMATIONS` holds only the formations `LEVEL` flies (today `grid`,
  `escort`, `dive`, `sway`, `spiral`). `PATTERNS` holds only what the waves and the giant fire
  (today `aimed`, `fan`, `ring`, `laser`).
- The code for every other formation, pattern, boss move (keep the giant's `sway` and `charge`) and
  boss feature the giant lacks goes. That includes bare `hull` parts and phase `open`. So do
  `difficulty()` (`scaled` stays) and every sound no event or screen plays.
- `LEVELS` and `levelById` go if nothing but tests reads them, and `LEVEL` is imported directly.

- [ ] **Step 1: Write the gate tests in `repo-dead.test.js`.**
  - "every export in src is used": another `src` file imports it by name (or imports the module's
    default, for a default export), or it is used in its own file and a test imports it.
  - "every formation and pattern in kinds.js is flown by level 1 or fired by the giant"
  - "every boss move is one the giant's phases use"
  - "every sound in SFX is named by a play(...) call or an event mapping in src"
- [ ] **Step 2: Run them.** `npm test` should FAIL, and the failures list the dead code.
- [ ] **Step 3: Cut until the gate passes.** Delete each item the gate lists, along with its tests
  and every branch that existed only for it.
- [ ] **Step 4: Run the suite.** `npm test` should report 0 failures. Report
  `git ls-files src | xargs wc -l | tail -1` next to the number from Task 3.
- [ ] **Step 5: Play level 1 to the end in the browser** (`?debug&auto`). Expect the same game as
  after Task 7, and no console errors.
- [ ] **Step 6: Commit.** `git add -A && git commit -m "refactor: cut every kind and export level 1 never uses"`

### Task 9: The cinematic open

Invoke `frontend-design:frontend-design` first.

**Files:**
- Create: `src/ui/screens/open.js` and `src/ui/css/open.css`.
- Modify: `src/ui/router.js`, `src/ui/screens/title.js` and `index.html` (stylesheet).
- Test: `test/ui/open.test.js`.

**Interfaces:**
- Produces in `open.js`:
  ```js
  export const OPEN_BEATS = [
    { at: 0.05, name: 'dark' },   // music ducks to 0; letterbox bars slide in over 0.6 s
    { at: 0.5, name: 'braam' },   // play('braam')
    { at: 1.8, name: 'light' },   // a thin warm line opens across the middle, like a projector
    { at: 2.8, name: 'title' },   // PERSIA fades in, its tracking tightening over 3 s; play('riser')
    { at: 5.4, name: 'eyes' },    // 14 pairs of eyes blink open in the dark around the title
    { at: 7.6, name: 'impact' },  // play('impact'); a white flash; the title and bars cut away
    { at: 8.2, name: 'done' },
  ];
  export const SKIP_AFTER = 1.0; // s before a key may skip
  ```
  - `beatsBetween(t0, t1)` returns the names of the beats with `t0 < at <= t1`, in order.
  - `openScreen({ onDone })` returns a stage screen `{ el, onKey, update(dt) }`. Any key after
    `SKIP_AFTER` jumps to `impact`, which fires once; `done` follows 0.6 s later.
- Router:
  - `app.opened` lives in session memory, never in `localStorage`.
  - The first Play after a page load runs the open instead of the card and builds the play scene
    behind it. Play begins once the open reaches `done` and the scene is built.
  - Restart, Retry and Again use the card.
  - The title menu is Play only, with the hint `Enter play · M sound` and no tagline.

- [ ] **Step 1: Write the failing tests.**
  - "beatsBetween returns each beat once, in order, across uneven frames"
  - "beatsBetween(0, 8.2) names all seven beats"
  - "a key before SKIP_AFTER does nothing; after it, impact fires once and onDone follows 0.6 s
    later" (`openScreen` with the `test/ui/dom-kit.js` stub)
- [ ] **Step 2: Run them.** `npm test` should FAIL.
- [ ] **Step 3: Implement.**
  - The eyes take their positions from a fixed list, not `Math.random`.
  - Under reduced motion, the bars, the light and the eyes appear and disappear without moving.
- [ ] **Step 4: Run the suite.** `npm test` should report 0 failures, the dead-code gate included.
- [ ] **Step 5: Watch it in the browser.**
  - Play shows the open once, then wave 1 with "یک" and "سگ".
  - Retry, Again, and Title followed by Play all skip the open. A reload shows it again.
  - Screenshot the title beat and the eyes beat.
- [ ] **Step 6: Commit.** `git add -A && git commit -m "feat(ui): a cinematic open on the first Play of a session"`

### Task 10: The parade and the end screens

Invoke `frontend-design:frontend-design` first.

**Files:**
- Create: `src/ui/screens/parade.js`. Put the parade styles in `src/ui/css/screens.css`, or in
  `parade.css` if `screens.css` would pass 199 lines.
- Modify: `src/ui/flow.js`, `src/ui/router.js`, `src/ui/screens/{results,failed}.js`, and
  `src/main.js`, where screen `'parade'` steps and draws like `'results'`.
- Test: `test/ui/parade.test.js` and `test/ui/results.test.js`.

**Interfaces:**
- Consumes: `speciesSprites(look, id, 2)` (Task 6), `voice.speak(line)` and `voice.clear()` (Task 7),
  and the `PACK.species` order (Task 5).
- Produces in `parade.js`:
  - Constants:
    - `PARADE_LEAD = 0.8`: seconds before the first animal crosses the middle
    - `PARADE_STEP = 1.4`
    - `PARADE_SPEED = 480`: world px/s, right to left
    - `PARADE_TAIL = 1.6`
  - `paradeX(t, i)` returns the x of animal `i` on a 1920-wide line.
  - `paradeCues(t0, t1, n)` returns the indices that cross the middle in `(t0, t1]`.
  - `paradeScreen({ pack, look, voice, onDone })` returns a stage screen.
    - It owns a transparent 1920x320 canvas at 62% of the screen height, where the animals walk with
      their frames alternating.
    - At each cue it calls `voice.speak({ kind: 'species', id })`, which shows the word above the
      line.
    - `onDone` fires `PARADE_TAIL` after the last cue.
    - Any key after 1 s calls `voice.clear()` and then `onDone`.
- Flow:
  - On a clear, wait `CLEAR_WAIT`, then run the parade, then show the results.
  - Results show `Victory`, the stars, the score and the best, with Again and Title. Again calls
    `startLevel(LEVEL)`, so the card plays and the open does not. Next and its code go.
  - Failed shows `Shot down` and a progress line (`Wave 3 of 5`, or `The giant held at 40 %`),
    with Retry and Title.
  - The kicker on both screens is `level.name`.

- [ ] **Step 1: Write the failing tests.**
  - "every animal crosses the middle once, PARADE_STEP apart, starting at PARADE_LEAD"
  - "paradeCues splits cleanly across frames"
  - "results offer Again and Title, and no Next"
  - "failed shows the wave or the giant's hp"
- [ ] **Step 2: Run them.** `npm test` should FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the suite.** `npm test` should report 0 failures, the dead-code gate included.
- [ ] **Step 5: Play the whole level in the browser** (`?debug&auto` is fine).
  - At the end, seven animals cross right to left, each named and shown once.
  - The results come next, with Again, and Again starts wave 1 without the open.
  - Screenshot the parade with a word up.
- [ ] **Step 6: Commit.** `git add -A && git commit -m "feat(ui): end on a parade of the seven names, then Again"`

### Task 11: Site, README and handover

Run `humanizer` on every English line written here. Site copy may say the animals are named in
Persian. It never says lesson, learn, teach or course.

**Files:**
- Modify:
  - `index.html` (head: the title, description, Open Graph and Twitter tags, canonical
    `https://persia.cocode.dk/`, and JSON-LD with `codeRepository`
    `https://github.com/cocodedk/persia-game`)
  - `og.html`, `llms.txt`, `sitemap.xml`, `robots.txt`
  - `favicon.svg` (a pixel cat head in the look's colours)
  - `CONTRIBUTING.md`, `SECURITY.md`
- Create: `README.md`, and `og.png` (1200x630, rendered from `og.html` with the Playwright browser
  tools).
- Update: the vault note `memory/persia-state-2026-10-24.md`, with what is built and what Babak does
  next.

- [ ] **Step 1: Write the copy and the head.** The README covers:
  - what the game is
  - how to play it locally
  - the tests and the layout
  - where the clips came from (the manifest, native review)
  - the licences: Apache-2.0 for the code, OFL for Vazirmatn, and the clips' licence as the manifest
    gives it
- [ ] **Step 2: Render `og.png` and check it.** Open the PNG. It should show the Persia title over
  the night look with animals, and no Persian beyond one species word at most.
- [ ] **Step 3: Run the suite.** `npm test` should report 0 failures, including the external-URL,
  line-count and dead-code checks. Then run
  `grep -rniE "invaders|lesson|learn" index.html og.html llms.txt sitemap.xml robots.txt`.
  It should print nothing.
- [ ] **Step 4: Commit.** `git add -A && git commit -m "docs: Persia site, README, Open Graph image and favicon"`
- [ ] **Step 5: Hand over to Babak.**
  - Before the first push: create `cocodedk/persia-game` on GitHub and the DNS record for
    `persia.cocode.dk`.
  - After it: turn on Pages from `main` at the root.
  - Then play the level, and press Again or don't.
