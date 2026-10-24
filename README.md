# Persia

Persia is an arcade shooter for a laptop, played with keyboard and mouse in your browser. There is nothing to install and no account to make.

## What it is

You fly a ship along the bottom of the screen and shoot angry pixel animals. The one level so far has five waves, and a wave is a group of enemies that flies in together. Across them you meet a dog, a cow, a rabbit, a bird, a cat, a horse and a fish. After wave 5 a giant cat arrives as the boss.

You have three lives. Lose all three and you start again from wave 1. Beat the boss and the seven animals parade past, each named once.

The first time you press Play after the page loads, a short film-style opening runs. Press any key after the first second to skip it. Reloading the page brings it back.

A voice speaks Persian as things happen. It says each wave's number as the wave starts, and each animal's name the first time that animal appears in a wave. Whatever it says also shows on screen for about a second:

- the Persian word, each letter in its own colour (for a wave number, the Persian digit);
- the same word in Latin letters beside it while it is said, so the cat shows گربه next to "gorbe";
- for an animal, its face drawn big.

There are no captions or translations.

Persia is forked from [Invaders](https://github.com/cocodedk/invaders), Babak Bandpey's own arcade shooter.

## How to play

Open [persia.cocode.dk](https://persia.cocode.dk) and press Play, or press Enter. Sound starts after your first key press or click, because browsers keep pages silent until then.

| Action | Keyboard | Mouse |
|---|---|---|
| Move | Arrow keys or W A S D | Move the pointer; the ship follows it |
| Fire | Space (hold to keep firing) | Left button |
| Bomb | B or Shift | Right button |
| Pause | P or Esc | |
| Sound on or off | M | |
| Menus | Arrow keys to move, Enter or Space to choose | Click |

Shoot a rabbit and it drops a power-up (spread shot, laser, rapid fire or shield) or a bomb. Fly into it to pick it up. A bomb removes every enemy bullet and hits everything on screen. You start with one and can hold three.

The pause menu offers Resume, Restart and Title. Switching to another tab pauses the game too.

## Run it locally

You need Python 3, or any other static file server.

1. Open a terminal in the project folder.
2. Run `python3 -m http.server 8000`. It prints that it is serving on port 8000.
3. Open http://localhost:8000/ in your browser. You should see the PERSIA title screen with a Play button.

Browsers do not run module scripts from a `file://` address, so double-clicking `index.html` will not work. There are no dependencies and no build step.

## Tests and code layout

Run `npm test`. It uses Node's built-in test runner, so there is nothing to install first. You need a recent Node.js; this was checked on Node 24. A passing run ends with a summary that shows `fail 0`.

- `src/core/` holds the game rules. It never touches the browser, `Math.random` or the clock. Randomness comes from a seeded generator and time from the step size, so tests replay a game exactly.
- `src/fx/` holds particles and camera effects, under the same rules.
- `src/ui/` is everything that touches the page: drawing, screens, input and sound. `voice.js` plays the clips and `word-moment.js` draws the word on screen as real text, so the letters stay joined.
- `src/data/pack.js` is the word pack and the only place a Persian word appears. It lists the words, their Latin spellings, the clip files and the letter colours. Another language would be a separate fork with its own pack.
- `src/main.js` starts the game and runs the frame loop.
- `test/` mirrors `core`, `fx` and `ui`.
- `public/` holds the voice clips and the font.

## Voice clips

There are twelve clips, in `public/audio/`: the seven animal names and the numbers one to five. Nothing is generated while you play. Each clip was made ahead of time with the Piper voice model `fa_IR-ganji-medium`, and a native Persian reviewer approved it before it was added. A new clip needs a new review.

`public/audio/manifest.json` records, for every clip, the text it speaks, the voice model and its checksum, the engine version, the reviewer and the clip's own SHA-256 checksum. The script that copied the clips in, `scripts/lift-clips.mjs`, refuses any clip with no reviewer on record.

## Licences

- The code is under the Apache License 2.0, copyright 2026 Babak Bandpey / Cocode. See `LICENSE`.
- The font is Vazirmatn Bold by Saber Rastikerdar, under the SIL Open Font License 1.1. The full text is in `public/fonts/OFL.txt`.
- For the voice clips, the manifest records the voice model as MIT-licensed and its dataset as CC0.
