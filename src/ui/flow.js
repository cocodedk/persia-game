// The end of a level: the best is saved the moment the level is cleared, so leaving through the
// pause menu during the slow motion does not lose it (M10); once that moment has played out, the
// outcome goes to flow.showResults or flow.showFailed.
//   outcome = { level, score, stars, best, newBest, world }   best and newBest only on a clear
import { LEVELS, worldName } from '../core/levels.js';
import { stars } from '../core/world.js';
import { store } from './storage.js';
import { play, setBeam } from './audio.js';
import { finished } from '../core/util.js';
import { resultsScreen } from './screens/results.js';
import { failedScreen } from './screens/failed.js';

const CLEAR_WAIT = 2.4; // s after the clear: the slow motion and the bonus pop-up
const FAIL_WAIT = 1.6; // s after the last life

function progress(world) {
  const b = world.boss;
  if (b) return `${worldName(world.level)}'s boss held at ${Math.ceil((100 * b.hp) / b.maxHp)} %`;
  return `Wave ${world.wave} of ${world.level.waves.length}`;
}

export function createFlow(r, stage) {
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
      if (cleared) flow.showResults(o);
      else flow.showFailed(o);
    },

    showResults(o) {
      app.screen = 'results';
      play('cleared');
      const { level } = o; // the buttons close over this, not over o (its world)
      const next = LEVELS[LEVELS.indexOf(level) + 1];
      stage.show(resultsScreen({
        label: r.labelOf(level), title: level.boss ? 'Victory' : 'Cleared',
        score: o.score, stars: o.stars, best: o.best, newBest: o.newBest,
      }, {
        next: next && (() => r.startLevel(next)),
        retry: () => r.startLevel(level),
        title: r.goTitle,
      }));
    },

    showFailed(o) {
      app.screen = 'failed';
      play('failed');
      const { level } = o;
      stage.show(failedScreen({ label: r.labelOf(level), score: o.score, progress: progress(o.world) }, {
        retry: () => r.startLevel(level),
        title: r.goTitle,
      }));
    },
  };
  r.flow = flow;
  return flow;
}
