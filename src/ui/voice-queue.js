// What the voice says, and when. DOM-free, so the timing is tested in node; voice.js plays it.
//   voiceLines(events) -> Line[]   a wave says its number, then each of its species; a boss its species
//   Line = { kind: 'number', n } | { kind: 'species', id }
//   clipOf(pack, line) -> { clip, ms, word }   word is null for a number (only species are shown)
//   createQueue() -> { lines, wait }   lines not started yet; wait = s until the next may start
//   enqueue(q, lines)   replaces the unstarted backlog (a wave cleared before its lines were said)
//   stepQueue(q, dt, pack) -> the Line that starts now, or null. Stepped only while the scene steps,
//   so the pause menu holds it.
export const LINE_GAP = 0.15; // s of silence between lines

export function voiceLines(events) {
  const lines = [];
  for (const e of events) {
    if (e.type === 'wave') {
      lines.push({ kind: 'number', n: e.wave });
      for (const id of e.species) lines.push({ kind: 'species', id });
    } else if (e.type === 'boss') {
      lines.push({ kind: 'species', id: e.species });
    }
  }
  return lines;
}

export function clipOf(pack, line) {
  if (line.kind === 'number') {
    const { clip, ms } = pack.numbers.find((x) => x.n === line.n);
    return { clip, ms, word: null };
  }
  const { clip, ms, word } = pack.species.find((s) => s.id === line.id);
  return { clip, ms, word };
}

export const createQueue = () => ({ lines: [], wait: 0 });

export function enqueue(q, lines) {
  q.lines = [...lines];
}

export function stepQueue(q, dt, pack) {
  q.wait = Math.max(0, q.wait - dt);
  if (q.wait > 0 || !q.lines.length) return null;
  const line = q.lines.shift();
  q.wait = clipOf(pack, line).ms / 1000 + LINE_GAP;
  return line;
}

export function clearQueue(q) {
  q.lines = [];
  q.wait = 0;
}
