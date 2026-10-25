# Persia — working notes

A 2D arcade shooter for a laptop, forked from invaders (`../invaders`), that plays Persian as the
soundtrack of what happens on screen. It is a game first and never calls itself a lesson. The design
is `docs/superpowers/specs/2026-10-24-persia-design.md` and the build plan goes in
`docs/superpowers/plans/`; the spec is the authority. Scope now: world 1 (animals), eight levels so far;
Babak plays each one before the next is planned. Deploys to `persia.cocode.dk`.

Invaders is the reference architecture: copy and adapt from it, never import across repos. The lessons
repo (`../Danish-Persian-Lessons`) lends approved voice clips, pictures and the Persian text-rule tests;
copy files and provenance, never link to it at runtime.

## Product contract

- Laptop, keyboard and mouse. No phone or touch work.
- Exhilarating first: waves that look unsurvivable and are survived, a boss, weapons and powers.
- Every spoken Persian clip is one a native reviewer approved. No synthesis at runtime, no new clips
  without a review round.
- Clean screen in play: no captions, translations or help text. Invaders' HUD stays. The only
  language on screen is the word moment, and every spoken line gets one: a species' Persian name
  (each letter its own colour) when it first appears in a wave, a wave's Persian digit as its
  number is said, each with its Latin spelling beside it while it is said.
- No Danish anywhere in level 1. Chrome is English, as in invaders. Teaching arrives in later levels.
- The code never contains a Persian word. Everything language-specific lives in the word pack
  (`src/data/pack.js`). Another language pair is a separate fork with another pack, never a runtime switch.
- Static: no backend, accounts or telemetry. `localStorage` under `persia.` keys, wrapped in try/catch.

## Persian text rules

- Persian code points only: ک (U+06A9) never ك, ی (U+06CC) never ي; digits ۰–۹ when Persian digits
  are shown at all. ZWNJ (U+200C) for نیم‌فاصله.
- No diacritics in UI chrome. The pack carries the plain word; clips carry the sound.
- Persian text renders as a DOM overlay, or as one whole word in one canvas `fillText` in the pack face with no letter spacing; never per-letter canvas text, so letters stay joined.
- A test asserts every pack word obeys these rules.

## Commands

| What | Command |
|---|---|
| All tests | `npm test` (`node --test "test/**/*.test.js"`) |
| Play locally | `python3 -m http.server 8000`, then open http://localhost:8000/ |
| Memory recall | `python3 ~/.claude/skills/memory-vault/scripts/recall.py "<question>" --vault memory` |

## Layout

Same as invaders: `src/core/` and `src/fx/` pure (no `window`, `document`, canvas, `Math.random`,
`Date.now`; randomness from an `rng`, time from `dt`), `src/ui/` touches the DOM, `src/main.js` boots,
`test/` mirrors core and fx with `node:test`. New in Persia: `src/data/pack.js` (the word pack),
`src/ui/voice.js` (plays pack clips on core events through its own bus), the word-moment overlay,
`public/audio/` and `public/images/` with a provenance manifest beside the clips.

## Global constraints

- No npm dependencies, no bundler, no build step, no network at runtime beyond the page's own origin.
- Every code file under 200 lines (JS, HTML, CSS), enforced in CI. Markdown is exempt.
- Fixed-step core (`TICK = 1/60`), quantized inputs, 1920x1080 world, as invaders.
- Pause on blur, M mutes, frame time capped, reduced-motion respected.
- Names are original: no film titles, character names, logos or quoted lines.
- Conventional Commits. Never `--no-verify`. Never force-push `main`. Pre-push only to `github.com/cocodedk`.
- Never commit machine-specific absolute paths. Sibling repos are named by relative path only.

## Agent roles

- **Fable — planner, art director, reviewer.** Owns `docs/superpowers/`, writes and approves plans,
  reviews executor output. Does not implement.
- **Opus and Sonnet — executors.** Take the plan, implement it exactly, stop at the plan boundary. No
  new dependencies, no scope creep. Blocked or ambiguous: write questions at the top of the plan and stop.
- Remind Babak to switch the model from Fable to an executor before building starts.

## Required skills

| Situation | Skill |
|---|---|
| Any new UI, screen, or visual element | `frontend-design:frontend-design` |
| Before writing or editing code | `karpathy-guidelines` |
| Persian copy a player reads | `humanizer-pa` |
| English copy (README, site, chrome) | `humanizer` |
| After implementing | `simplify` |
| Session start, and before trusting a memory | `memory-vault` |

Invoke nothing beyond these and the built-ins without Babak asking.

## Starting a session

1. Read this file, then `memory/MEMORY.md` and the note under `## Now`.
2. Read the design spec. If the plan exists, take the next unchecked task.
3. UI work: invoke `frontend-design:frontend-design` first and keep invaders' Canvas 2D look.
