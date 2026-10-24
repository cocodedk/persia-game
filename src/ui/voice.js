// The voice: the core's events, said with the pack's approved clips on a bus of their own, each
// species word shown, its Latin name beside it, as it is said (show/hide: word-moment.js).
//   createVoice(pack, { nodes, duck, fetch, decode, show, hide }) -> { hear(events), update(dt), speak(line), clear() }
// Every clip is fetched and decoded once, at creation, on an offline context: the game's context
// waits for a gesture, and wave 1 is said on the first frame of play. A failed fetch or decode is
// silence. A line whose clip is not decoded when it starts is skipped, never played late; its word
// still shows, and so it does with the sound locked or muted. A playing line ducks the music and
// effects for its length.
import { audioNodes, duckSpeech } from './audio.js';
import { voiceLines, clipOf, createQueue, enqueue, stepQueue, clearQueue } from './voice-queue.js';

const UNDER_SPEECH = 0.45; // the music and effects level while a line plays

let offline = null; // an AudioBuffer plays on any context, so one offline context decodes them all
const decodeOffline = (bytes) => (offline ??= new OfflineAudioContext(1, 1, 48000)).decodeAudioData(bytes);

export function createVoice(pack, { nodes = audioNodes, duck = duckSpeech, fetch = globalThis.fetch, decode = decodeOffline, show, hide }) {
  const buffers = new Map();
  for (const { clip } of [...pack.numbers, ...pack.species]) {
    fetch(clip).then((r) => (r.ok ? r.arrayBuffer() : null)).then((bytes) => bytes && decode(bytes))
      .then((buffer) => buffer && buffers.set(clip, buffer))
      .catch(() => {});
  }
  const q = createQueue();
  let playing = null;
  let lift = 0; // s until the duck lifts; 0 when no line holds it

  const voice = {
    hear(events) {
      const lines = voiceLines(events);
      if (lines.length) enqueue(q, lines); // a tick with nothing to say keeps the backlog
    },
    update(dt) {
      if (lift > 0) {
        lift -= dt;
        if (lift <= 0) duck(1);
      }
      const line = stepQueue(q, dt, pack);
      if (line) voice.speak(line);
    },
    speak(line) {
      const { clip, ms, word, say } = clipOf(pack, line);
      if (word) show(word, say, ms);
      const n = nodes();
      const buffer = buffers.get(clip);
      if (!n || !buffer) return;
      playing = n.ctx.createBufferSource();
      playing.buffer = buffer;
      playing.connect(n.voice);
      playing.start();
      duck(UNDER_SPEECH);
      lift = ms / 1000;
    },
    clear() {
      clearQueue(q);
      playing?.stop();
      playing = null;
      lift = 0;
      duck(1);
      hide();
    },
  };
  return voice;
}
