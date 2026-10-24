// What the game loop runs and draws: a scene is a session (session.js) with its view, the source of
// its inputs and what its events do besides effects.
//   { mode, level, view, session, source(world), onEvents?(events, input), sound }
//   mode 'backdrop' (the title's autopilot battle, silent, no HUD) | 'play'
//   runScene(sc, dt, t, step)   one frame: step it (unless frozen), then draw it
import { LEVELS } from '../core/levels.js';
import { autopilot } from '../core/autopilot.js';
import { createSession, stepSession } from './session.js';
import { createView, drawFrame } from './view.js';
import { readInput } from './input.js';
import { eventSounds } from './sounds.js';
import { play, setBeam } from './audio.js';

const seed = () => crypto.getRandomValues(new Uint32Array(1))[0];
const BACKDROP_AGAIN = 2.5; // s after the backdrop battle ends before it starts over

// A random world's wave level, flown by the autopilot behind the logo; never world `skip` (the one
// the title showed last, so a return from a level brings another world: M5).
export function pickBackdrop(skip = 0) {
  const waves = LEVELS.filter((l) => l.waves && l.world !== skip);
  return waves[seed() % waves.length];
}

export function backdropScene(canvas, level) {
  const view = createView(canvas, level);
  view.showHud = false;
  return { mode: 'backdrop', level, view, session: createSession(level, seed()), source: autopilot, sound: false };
}

// A level played with the keys and the mouse, or flown by `pilot` (?debug&auto).
export function playScene(canvas, level, input, { pilot = null, onEvent = null } = {}) {
  const v = createView(canvas, level);
  const session = createSession(level);
  return {
    mode: 'play', level, view: v, session, sound: true,
    source: pilot ?? (() => readInput(input, v)),
    onEvents(events) {
      eventSounds(events, session.world, play);
      if (onEvent) for (const e of events) onEvent(e);
    },
  };
}

export function runScene(sc, dt, t, step) {
  const { session, view } = sc;
  if (step) stepSession(session, dt, sc.source, sc.onEvents);
  if (sc.mode === 'backdrop' && session.over > BACKDROP_AGAIN) {
    sc.session = createSession(sc.level, seed()); // the same level: no bake
  }
  drawFrame(view, sc.session.world, sc.session.fx, t);
  const ship = sc.session.world.ship;
  if (sc.sound) setBeam(step && ship.beam && sc.session.world.state === 'play', ship.x);
}
