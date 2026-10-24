# Persia — design for the concept level

Date: 2026-10-24. Author: Fable (art director, planner). Decided with Babak in a one-question-at-a-time
session. The game's home is this repo, `persia-game`; the lessons repo's `docs/plans/ROADMAP.md` points
here. The implementation plan goes in `docs/superpowers/plans/`, as in invaders.

## Intent and why

The Danish-Persian lessons app gets no second visit. People try it once, give no feedback, and forget it.
Babak's own games do the opposite: he has watched people play invaders and wonderland and forget where
they were.

Persia is a 2D arcade shooter for a laptop, forked from invaders, that smuggles Persian in as the
soundtrack of meaning. It is a game first and never calls itself a lesson. The model is how Overwatch
teaches "Ryūjin no ken wo kurae" to players who never tried to learn Japanese: a spoken line glued to
a thing you see and do a hundred times.

We build one concept level, then judge.

## What success looks like

Babak is the first and, for now, only tester. The level passes if he finishes it and presses "again".
Nothing else is measured for the concept level.

## Goals

- Exhilarating: waves that look unsurvivable and are survived, a boss to kill, weapons and powers worth
  having. The things Babak named as the fun of invaders.
- A cinematic open: the first ten seconds feel like the lights going down before a film.
- Persian heard, tied to what is on screen, without the player sensing any teaching.
- Clean screen during play: no captions, no translations, no help text. Invaders' own HUD (score, combo,
  lives, power timer) stays; it is game chrome, not language.
- Replayable on its own merits as an arcade level.

## Non-goals for the concept level

- Phone or touch play. Laptop with keyboard and mouse only. Phone is "second, if ever".
- Danish anywhere on screen. Not in play, not between waves, not at the end.
- Any quiz, test, or "prove you understood".
- Learner speech or recording.
- Teaching the script. The Persian word is shown, never explained.
- Iranian backdrops beyond level 1's Persepolis.
- More than one level, more worlds, new voice clips.
- Accounts, backend, telemetry. Static, like every cocode.dk game.

## Anti-goals

Things that would make the level a failure even if it runs:

- It feels like a lesson wearing a game costume. If the player senses they are being taught, we lost.
- It is less fun than invaders level 1. Then the Persian layer cost something, which it must not.
- A word is spoken so often it grates. "Sag forty times" was named as overkill.
- Anything on screen competes with the action for attention.

## Constraints

- Same engineering conventions as invaders: Canvas 2D, no bundler, no runtime dependencies, Node's
  built-in test runner, every code file under 200 lines (CI enforced), pure `core/` and `fx/` apart
  from DOM-touching `ui/`, pause on blur, M mutes, `localStorage` under a prefixed key wrapped in
  try/catch, Pages deploy, pinned Actions, Apache-2.0, `llms.txt`, OG image.
- No network at runtime beyond the page's own origin. Clips and pictures ship in the repo.
- Persian text rules from the lessons repo apply: Persian code points only (ک U+06A9, ی U+06CC,
  digits ۰–۹), ZWNJ for نیم‌فاصله, no diacritics on UI chrome.
- The game code never contains a word. Everything language-specific lives in one data file (see
  "Word pack"). A Japanese-for-Danes or Persian-for-Japanese version is a separate repo, a fork of
  Persia with a different pack, never a runtime language switch. Same game logic, separate code.
- Voice clips must be ones a native Persian reviewer has approved. The lessons repo's pipeline
  (model-generated speech, native review, `src/audio/approved.generated.json`) is the source.

## Decisions made in the session

| Topic | Decision | Whose |
|---|---|---|
| Platform | Laptop, keyboard and mouse. Phone second, if ever. | Babak |
| Base | Fork invaders. | Fable, after recon of invaders, wonderland, breakout |
| Name and home | "Persia", own repo, `persia.cocode.dk`. | Babak (name), Fable (own repo and subdomain) |
| Audience | Grown-ups. | Babak |
| Language layer | Spoken names for what appears and happens. No quiz. | Babak agreed to Fable's proposal |
| Long-game shape | Worlds of 4 to 5 levels, each world its own look, sound and rule, as invaders. | Babak |
| World = word family | World 1 animals, later worlds other families. Numbers come free as wave counts. | Fable's guess, Babak agreed |
| Scope now | One level, then evaluate. | Babak |
| On-screen text | Clean screen. Picture plus voice plus the Persian word, each letter its own colour. No Danish. | Babak |
| Teaching ramp | Level 1 teaches nothing visibly. Later levels and richer endings add the layer gradually. | Babak |
| Backdrops | Every level's backdrop is a known place in Iran, in pixel art. Level 1 is Persepolis at night under the blood moon. Brought forward after playing the build. | Babak |
| Every spoken line is shown | Whatever the voice says is on screen as it is said: the Persian word, or a wave's Persian digit, with its Latin spelling beside it; a species also shows its face, its own enemy sprite drawn big. Added after playing the build. | Babak |
| Persian ramp | As levels are added, the screen turns gradually more Persian: points (score, combo, wave count) towards Persian digits, text (HUD labels, chrome, results) towards Persian words. Level 1 is the floor. | Babak |
| Level 2 | Si-o-se-pol at night; waves numbered ۶ to ۱۰, continuing level 1's count; the mouse joins the waves and a giant mouse is the boss; the HUD's wave count turns to Persian digits. Decided after playing level 1. | Babak |
| Level 3 | The Tomb of Hafez in Shiraz at night; waves numbered ۱۱ to ۱۵; a giant fish is the boss; no new species (every approved animal clip is in); the score turns to Persian digits everywhere it shows. Decided after playing level 2. | Babak |
| Level 4 | The Azadi Tower in Tehran at night; waves numbered ۱۶ to ۲۰; a giant bird is the boss; rain falls from wave 18 and the voice says باران as it begins; the combo and the level's number turn to Persian digits. The title's levels become cards side by side, each with a picture of its landmark and its place's name. Decided after playing level 3. | Babak |

## Level 1 specification

**Shape.** Cinematic open, five waves, a boss, about three to four minutes. In invaders a world is four
wave levels and a boss finale; Persia's concept level compresses that into one sitting so the boss
kill can be judged now. Fable's call.

**Enemies.** Swarms of crazy angry animals. The seven species are fixed by the clips we already have
approved: سگ sag (dog), گربه gorbe (cat), اسب asb (horse), گاو gav (cow), ماهی mahi (fish), پرنده
parande (bird), خرگوش khargush (rabbit). Each wave brings one or two species. Which species map to
which invaders roles (grid marcher, diver, shooter, carrier) is the builder's.

**Boss.** A giant version of one of the seven. Its name is spoken on arrival. Fable's call: the species
is the builder's pick, the giant-of-the-same-set rule is fixed so no new clip is needed.

**Spoken set.** Exactly these, nothing more:

- The seven animal names, each spoken when its species first appears in a wave.
- Wave numbers one to five, spoken as each wave starts: یک، دو، سه، چهار، پنج, shown as ۱ to ۵.
- No exclamations. The approval file holds no cheer clip (no آفرین or similar), and level 1 adds no
  new clips, so big moments are celebrated with sound effects only.
- Weapons and power-ups stay silent in level 1.

Verified 2026-10-24 against `src/audio/approved.generated.json`: all twelve clips below carry
`reviewedBy: ["cocodedk"]`, voice model Piper `fa_IR-ganji-medium`, locale fa-IR, 760 to 1070 ms.

| Use | Clip IDs |
|---|---|
| Animals | `vocabulary-5-asb`, `vocabulary-5-gav`, `vocabulary-5-gorbe`, `vocabulary-5-khargush`, `vocabulary-5-mahi`, `vocabulary-5-parande`, `vocabulary-5-sag` |
| Waves | `number-1-word`, `number-2-word`, `number-3-word`, `number-4-word`, `number-5-word` |

**Repetition.** A species' name is spoken on its first appearance in a wave, not per enemy. Across five
waves that gives each word a handful of hearings. Tune by feel; never approach forty.

**The word moment.** When a species first appears in a wave, the voice says its name and the Persian
word appears large for about a second, then fades. Each letter is a different colour from a fixed
palette, so the eye registers that the shape is made of parts. The word is rendered as a DOM overlay
on the canvas so joined letters stay joined (per-letter canvas text would break the joining). It is
the only language on screen during play. Every spoken line gets one: a wave's number shows as its
Persian digit (۱ while یک is said). While the clip plays, the line also shows in Latin letters
beside it (`yek`, `sag`, `gorbe`, as the clip IDs spell them), in one quiet colour so the lit letters
keep the eye, gone when the voice stops. No Danish. Invaders' HUD stays as it is, ASCII digits
included; the Persian digit appears only in the word moment.

**Music under speech.** The voice gets its own bus; music and effects duck under it using invaders'
existing `duck()` and `hush()`.

**The ending.** When the boss falls, the seven animals parade across the screen with their Persian
names, each spoken once as it passes. Then score and "again". No "you learned", no Danish. The parade
is the hook that later levels enrich.

**Failing.** Standard arcade: three lives as in invaders, then a full retry from wave 1. No checkpoints;
carrying progress across deaths would undercut the "impossible, and yet I survived" feeling that is
the point. The cinematic open plays once per session and is skipped on retry and on "again". Persia
is not bound by the lessons app's "never disappoint" contract.

**Chrome outside play.** Title, pause, mute, results and the "again" control are in English, as in
invaders, and live in `ui/`. The word pack holds the learned language only. A fork for another
language pair swaps the pack and may translate the chrome in `ui/` if its audience needs it.

## Level 2 specification

Decided with Babak on 2026-10-24, after he played level 1.

**Shape.** Five waves and a boss, as level 1, about as long and a step harder. World 1 counts its
waves across its levels, so level 2's waves are 6 to 10, and a world of four levels counts 1 to 20.
Approved clips exist for every number from 1 to 20.

**Where.** Si-o-se-pol in Isfahan at night: the bridge's 33 arches lit gold from inside and
reflected in the Zayandeh river. The sky, the blood moon, the far mountains, the palette and the
music stay level 1's. The world keeps its look and the landmark changes.

**Enemies.** All eight animals: the seven from level 1 and موش mush (mouse), the one approved animal
clip level 1 left unused. The mouse comes in wave 6 and again in two later waves.

**Boss.** A giant mouse. Its name is said as it arrives, and it lights up while the name is said, as
the giant cat does.

**Spoken set.** Level 1's set, plus six approved clips: `vocabulary-5-mush` and `number-6-word` to
`number-10-word` (شش، هفت، هشت، نه، ده, shown as ۶ to ۱۰), each with `reviewedBy: ["cocodedk"]`.
Nothing else is new.

**The first step of the Persian ramp.** The HUD's wave count shows Persian digits (WAVE ۶ of ۱۰,
drawn with the slash as level 1 draws it). Its label and the rest of the HUD stay English, ASCII
digits included.

**Reaching it.** Level 2 is always open: the title lists every level by name (Level 1, Level 2), and level 1's results
offer Next, which plays it. Nothing is locked. Failing level 2 retries level 2 from wave 6.

**The ending.** The parade walks the animals the level brought, all eight here, in the pack's order.

## Level 3 specification

Decided with Babak on 2026-10-24, after he played level 2.

**Shape.** Five waves and a boss, a step harder than level 2. The waves are 11 to 15.

**Where.** The Tomb of Hafez in Shiraz at night: the poet's open pavilion, eight slender columns under
a dome shaped like a dervish's hat, lit warm from inside, on a raised stone platform with steps, in a
garden of cypresses and orange trees. The sky, the blood moon, the far mountains, the palette and the
music stay the world's.

**Enemies.** The eight animals. Every approved animal clip is already in the game, so there is no new
species; the fish, the boss's species, fills more rows than before. After Babak found it very hard
to win, level 3 drops more power-ups: its escort wave (12) holds two rows of rabbits, six carriers
instead of three.

**Boss.** A giant fish, face on: a wide gaping mouth, round eyes, fins spread at the sides and a crest
of fin on top. Its name is said as it arrives, and it lights up while the name is said. A rabbit
leaves its crest in every phase, not only the last, so the fight brings power-ups all the way.

**Spoken set.** Level 2's set, plus five approved clips: `number-11-word` to `number-15-word`
(یازده، دوازده، سیزده، چهارده، پانزده, shown as ۱۱ to ۱۵), each with `reviewedBy: ["cocodedk"]`.

**The second step of the Persian ramp.** The score shows Persian digits wherever level 3 shows it, its
thousands grouped with the Persian separator (۱۴۶٬۸۰۰): the HUD, the points that pop up (+۸۰۰), and the
end cards' score and best (Babak chose everywhere over the HUD alone). The wave count stays Persian
as in level 2. The labels around them (SCORE, BONUS, Best) and the combo stay English, as do pick-up
counts such as +1 BOMB.

**Reaching it.** Open like level 2: the title lists Level 3, level 2's results offer Next. Failing
level 3 retries level 3 from wave 11.

**The ending.** The parade walks the animals the level brought, in the pack's order.

## Level 4 specification

Decided with Babak on 2026-10-24, after he played level 3. A level that takes several tries is fine:
each retry says the numbers and names again.

**Shape.** Five waves and a boss, a step harder than level 3. The waves are 16 to 20.

**Where.** The Azadi Tower in Tehran at night: the white tower on its four legs, the tall split vault
between them under the pointed arch, the ribbed upper body and its lit top, on a wide plaza with lamps,
a low lit city behind. The sky, the blood moon, the far mountains, the palette and the music stay the
world's.

**Enemies.** The eight animals; the bird, the boss's species, fills more rows than before. Wave 17 is
the escort with the rabbits, as wave 12 in level 3.

**Boss.** A giant bird, face on, wings spread: each wing and the crest of head feathers are its plates,
the round eyes and the open beak burn, and birds pour from the beak. A rabbit leaves the crest in every
phase. Its name is said as it arrives, and it lights up while the name is said.

**Rain.** Rain begins with wave 18 and falls to the end of the level, the giant's fight included. As
it begins the voice says باران (baran) after the wave's number and its species, and the word moment
shows it, each letter in its own colour, with baran beside it. The rain is thin, slanting streaks
behind the aliens, the bullets and the ship, so nothing that matters is hidden; it fades in over two
seconds, follows reduced motion (fewer, slower streaks), and drops out under low quality.

**Spoken set.** Level 3's set, plus six approved clips: `number-16-word` to `number-20-word`
(شانزده، هفده، هجده، نوزده، بیست, shown as ۱۶ to ۲۰) and `vocabulary-3-baran` (باران), each with
`reviewedBy: ["cocodedk"]`.

**The third step of the Persian ramp.** The combo (×۸) and the level's own number (LEVEL ۴) turn to
Persian digits wherever level 4 shows them in play: the HUD, the card as the level begins, the pause
card, and the victory and shot-down cards. The title menu keeps "Level 4". The wave count and the score
stay Persian as in level 3.

**The title's levels.** The title's menu becomes a row of cards side by side, one per level, each
with a small picture of its landmark, its number and the name of its place (Persepolis, Si-o-se-pol,
Tomb of Hafez, Azadi Tower), in English like the rest of the chrome. The picture is drawn from the
level's own backdrop, so it always matches what the level shows. Enter plays the first; the arrows move between cards.

**Reaching it.** Open like levels 2 and 3: the title lists Level 4, level 3's results offer Next.
Failing level 4 retries level 4 from wave 16.

**The ending.** The parade walks the animals the level brought, in the pack's order.

## Level 5 specification

Decided with Babak on 2026-10-24, after level 4 went live.

**Shape.** Five waves and a boss, a step harder than level 4. The waves are 21 to 25.

**Where.** The Tomb of Cyrus at Pasargadae at night: the stone tomb on its six stepped tiers, the
small gabled chamber on top with its low door, floodlit warm from below, alone on a wide plain. A few
lone columns and low wall stumps of the palaces stand off to the sides; the Zagros lie low behind. The
tomb is small in life, so it is drawn large and central, the only tall thing on the plain. The sky,
the blood moon, the far mountains, the palette and the music stay the world's.

**Enemies.** The eight animals; the cow, the boss's species, fills more rows than before. Wave 22 is
the escort with the rabbits, as waves 12 and 17.

**Boss.** A giant cow, face on: its two horns and the curl of hair between them are its plates; the
round eyes and the wide mouth under the pink muzzle burn, and cows pour from the mouth. A rabbit
leaves the curl in every phase. Its name is said as it arrives, and it lights up while the name is
said.

**Stars.** From wave 23 to the end, the giant's fight included, stars fall: a shower of shooting
stars across the upper sky, setting behind the landmark and the mountains, so they never cross in front
of them or of what fights.
As it begins the voice says ستاره (setare) after the wave's number and species, and the word moment
shows it as it shows باران. It fades in over two seconds, follows reduced motion (fewer, slower), and
thins out at half quality but never stops, as the rain does. Rain and stars are one mechanism: a
level's weather names its kind and the wave, within the level, it begins with.

**Spoken set.** Level 4's set, plus `counting-2199-tal-21` (۲۱, bist-o-yek), `word-bridge-setareh`
(ستاره), and four clips for 22 to 25 (`counting-2199-tal-22` to `-25`). Those four do not exist yet:
they are made and approved first, in a review round in the lessons repo (Babak, 2026-10-24), as
extra catalog entries beside its counting lesson, which stays as it is. Every clip carries
`reviewedBy: ["cocodedk"]`. A wave's word moment shows its Persian digits with the Latin beside them
(bist-o-do).

**The fourth step of the Persian ramp.** The giant's name bar in the HUD reads the cow's Persian word,
گاو, instead of GIANT COW: the word the player has heard all through the level. It is drawn in the
pack's word face as one whole word with no letter spacing, so its letters stay joined. Everything
level 4 shows in Persian digits stays Persian. The shot-down card's sentence about the giant stays
English, and so does the title menu.

**The title.** Five cards side by side, still fitting at 1920 x 1080 and in a 1280 x 720 window.

**Reaching it.** Open like levels 2 to 4: the title lists Level 5, level 4's results offer Next.
Failing level 5 retries level 5 from wave 21.

**The ending.** The parade walks the animals the level brought, in the pack's order.

## Word pack

One data file, for example `src/data/pack.js`, that is the only place language lives:

```js
export const PACK = {
  lang: 'fa', dir: 'rtl',
  species: [
    { id: 'sag', word: 'سگ', clip: 'audio/sag.mp3', picture: 'images/sag-480.webp' },
    // ...
  ],
  numbers: [{ n: 1, word: 'یک', clip: 'audio/yek.mp3' }, /* ... */],
  cheers: [{ id: 'afarin', word: 'آفرین', clip: 'audio/afarin.mp3' }],
  letterColours: ['#…', '#…', '#…', '#…'],
};
```

The exact shape is the builder's. The rule is that `core/`, `fx/` and `ui/` import the pack and
never a literal word, and that a test asserts every pack word obeys the Persian text rules.

## Assets to lift from the lessons repo

- Clips: the twelve files named by the clip IDs above, found under `public/audio/` with a content hash
  in the filename. Copy only IDs listed in `src/audio/approved.generated.json`. Keep the review
  provenance (voice model and checksum, reviewer, synthesis text) in a small manifest in the Persia repo.
- Pictures: `public/lesson-images/<id>-{120,480,960}.{jpg,webp}` for the seven animals, for the parade or
  loading cards if the builder wants photographs there. In-play enemies are sprites, not photos.
- The Persian text-rule tests (reject Arabic ك/ي and ASCII digits) as the model for the pack test.

## Lifted from invaders, and what to strip

Keep: the fixed-step loop, input layer, audio buses and kit, particles, camera shake, slow-mo and bullet
time, scoring and combo, weapons and power-ups, the wave-as-data level format, the pause, mute and
storage conventions, hooks, CI line-count check.

Strip before adding anything: trailer and blooper, demo screen, worlds 2 to 8 (looks, aliens, bosses,
parallax, music), bunkers unless the builder wants them, and the lobby's world picker. Invaders is about
9,400 lines; Persia level 1 should be a fraction of that.

Add: a clip loader (`fetch` plus `decodeAudioData`, relative URLs), a `voice.js` listener on core events
that plays pack clips through its own bus, the word-moment overlay, the ending parade, animal sprites
and one boss, and the pack.

## Prerequisites that are Babak's

- Create the `cocodedk/persia-game` GitHub repo and the DNS record for `persia.cocode.dk`.
- Switch the model to an executor (Opus or Sonnet) before implementation starts.

## Left to the builder

- Species-to-role mapping, formations, speeds and difficulty curve for the five waves.
- Which species is the boss and how it attacks.
- Sprite style for the animals and boss, within invaders' Canvas 2D look. Angry and a little absurd.
- The letter-colour palette and the word moment's timing and typeface.
- Whether bunkers stay.
- The cinematic open's exact beats, within "lights down, something is about to start".
- Repo scaffolding details: CNAME, workflows, copied hooks.
- Ducking effects under the voice: invaders' `duck()` only lowers the music bus, so the sfx bus needs a
  small addition.

## Evaluation after the concept level

Babak plays it. If he presses "again", we plan level 2 and the teaching ramp. If not, we find out
which of the two things failed, the game or the Persian layer, before building more. Either way, the
next design conversation decides what world 1's remaining levels add: Danish meanings, dansk
lydskrift and IPA from the lessons catalog, richer endings, Iranian backdrops.

Whatever else they add, each level after the first moves more of the screen to Persian (the Persian
ramp in the decisions table). Each level's plan names which points and texts move in it, and nothing
moves back. Every new Persian string lives in the pack and passes its text-rule tests.

## Process notes

- Implementation is for an executor model (Opus or Sonnet), not Fable. Switch the model before
  building.
- Next step after approval: an implementation plan via `superpowers:writing-plans`, gated by
  `plan-gate.sh` for simplicity.
