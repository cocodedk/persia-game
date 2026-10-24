// The end of a level: the best is saved the moment the level is cleared, so leaving through the
// pause menu during the slow motion does not lose it (M10); once that moment has played out, a clear
// goes to flow.showParade and then flow.showResults, a loss to flow.showFailed.
//   outcome = { level, score, stars, best, newBest, world }   best and newBest only on a clear
import { stars } from '../core/world.js';
import { LEVEL } from '../core/levels.js';
import { PACK } from '../data/pack.js';
import { LOOK } from './looks/index.js';
import { store } from './storage.js';
import { play, setBeam } from './audio.js';
import { finished } from '../core/util.js';
import { paradeScreen } from './screens/parade.js';
import { resultsScreen } from './screens/results.js';
import { failedScreen } from './screens/failed.js';

const CLEAR_WAIT = 2.4; // s after the clear: the slow motion and the bonus pop-up
const FAIL_WAIT = 1.6; // s after the last life

export function createFlow(r, stage, voice) {
  const { app } = r;
  const flow = {
    onEvent(scene, e) {
      if (e.type === 'cleared') scene.result = store.recordResult(scene.level.id, e);
    },

    // Once a frame while a level is up: has it ended, and has its moment played out?
    check(scene) {
      const { world, over } = scene.session;
      if (scene.ended || scene.mode !== 'play' || !finished(world)) return;
      const cleared = world.state === 'cleared';
      if (over < (cleared ? CLEAR_WAIT : FAIL_WAIT)) return;
      scene.ended = true;
      setBeam(false);
      const o = { level: scene.level, score: world.score, stars: stars(world), ...scene.result, world };
      if (cleared) flow.showParade(o);
      else flow.showFailed(o);
    },

    showParade(o) {
      app.screen = 'parade';
      stage.show(paradeScreen({ pack: PACK, look: LOOK, voice, onDone: () => flow.showResults(o) }));
    },

    // Again plays the level from wave 1 behind its card: the open is once a session.
    showResults(o) {
      app.screen = 'results';
      play('cleared');
      stage.show(resultsScreen({
        label: o.level.name, score: o.score, stars: o.stars, best: o.best, newBest: o.newBest,
      }, {
        again: () => r.startLevel(LEVEL),
        title: r.goTitle,
      }));
    },

    showFailed(o) {
      app.screen = 'failed';
      play('failed');
      const { level } = o; // the buttons close over this, not over o (its world)
      stage.show(failedScreen({ label: level.name, score: o.score, world: o.world }, {
        retry: () => r.startLevel(level),
        title: r.goTitle,
      }));
    },
  };
  r.flow = flow;
  return flow;
}
