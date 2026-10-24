// Screen routing: title (over the backdrop battle) -> title card -> play -> pause -> results /
// failed. `app` is the one piece of state the loop reads.
//   app = { screen, scene, backdrop, token }
//   screen 'title' | 'loading' | 'play' | 'paused' | 'results' | 'failed'
//   backdrop: the title's battle, kept across menu visits; starting a level drops it, so the title
//   bakes another battle on the menu, never mid-level
//   token: counts the routes taken, so a deferred bake can tell its screen was left
// The end of a level goes through flow.js. r.pilot (debug-hooks.js, ?debug&auto) flies every level.
// Every route away from a level goes through leave(): the old scene stops stepping at once (the
// loop only runs app.scene) and the level's own sounds (the laser hum) stop with it.
import { LEVELS } from '../core/levels.js';
import { LOOK } from './looks/index.js';
import { play, duck, setBeam } from './audio.js';
import { setWorld } from './music.js';
import { resetInput } from './input.js';
import { backdropScene, pickBackdrop, playScene } from './scenes.js';
import { titleScreen } from './screens/title.js';
import { cardScreen } from './screens/card.js';
import { pauseScreen } from './screens/pause.js';

const MIN_CARD = 0.9; // s the title card stays, so it reads as a moment, not a flicker

export function createRouter({ canvas, stage, input }) {
  const app = { screen: 'boot', scene: null, backdrop: null, token: 0 };
  const r = { app, pilot: null };
  const live = () => app.screen === 'play';

  // Leave whatever runs for `screen`: nothing steps until the caller sets a new scene.
  function leave(screen) {
    app.token += 1;
    app.screen = screen;
    app.scene = null;
    setBeam(false);
    duck(1);
  }

  r.goTitle = () => {
    leave('title');
    const items = [{ label: 'Play', pick: () => r.startLevel(LEVELS[0]) }];
    const level = app.backdrop?.level ?? pickBackdrop();
    setWorld(LOOK);
    stage.show(titleScreen({ items, nowShowing: level.name }));
    if (app.backdrop) {
      app.scene = app.backdrop;
      return;
    }
    const token = app.token; // the first time, the battle is baked once the menu has painted
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (token !== app.token) return; // already gone (Play pressed at once): bake it next time
      app.backdrop = backdropScene(canvas, level);
      app.scene = app.backdrop;
    }));
  };

  // Show the level's card, bake its view behind it, then play.
  r.startLevel = (level) => {
    leave('loading');
    app.backdrop = null; // back on the title, another battle
    const token = app.token;
    setWorld(LOOK);
    stage.show(cardScreen(level));
    play('start');
    const t0 = performance.now();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (token !== app.token) return;
      const scene = playScene(canvas, level, input, { pilot: r.pilot, onEvent: (e) => r.flow.onEvent(app.scene, e) });
      setTimeout(() => {
        if (token !== app.token) return;
        app.scene = scene;
        resetInput(input);
        app.screen = 'play';
        stage.show(null);
        if (document.hidden) r.pause(); // the tab went away during the card: start paused, not unseen
      }, Math.max(0, MIN_CARD * 1000 - (performance.now() - t0)));
    }));
  };

  r.restart = () => r.startLevel(app.scene.level);

  r.pause = () => {
    if (!live()) return;
    app.screen = 'paused';
    setBeam(false);
    duck(0.35);
    play('pause');
    stage.show(pauseScreen({
      label: app.scene.level.name,
      resume: () => {
        app.screen = 'play';
        duck(1);
        resetInput(input);
        stage.show(null);
      },
      restart: r.restart,
      title: r.goTitle,
    }));
  };

  r.live = live;
  r.leave = leave;
  return r;
}
