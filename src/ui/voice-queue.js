// What the voice says, and when. DOM-free, so the timing is tested in node; voice.js plays it.
//   voiceLines(events) -> Line[]   a wave says its number, then each of its species; a boss its species
//   Line = { kind: 'number', n } | { kind: 'species', id }
//   clipOf(pack, line) -> the line's pack entry: { clip, ms } is played, { word, say } shown meanwhile
//   createQueue() -> { lines, wait, now }   lines not started yet; wait = s until the next may start;
//   now = the last Line started
//   enqueue(q, lines)   replaces the unstarted backlog (a wave cleared before its lines were said)
//   stepQueue(q, dt, pack) -> the Line that starts now, or null. Stepped only while the scene steps,
//   so the pause menu holds it.
//   sayingOf(q) -> the species id whose line is under way (for its ms), else null; a number names none
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
  return line.kind === 'number'
    ? pack.numbers.find((x) => x.n === line.n)
    : pack.species.find((s) => s.id === line.id);
}

export const createQueue = () => ({ lines: [], wait: 0, now: null });

export function enqueue(q, lines) {
  q.lines = [...lines];
}

export function stepQueue(q, dt, pack) {
  q.wait = Math.max(0, q.wait - dt);
  if (q.wait > 0 || !q.lines.length) return null;
  const line = q.lines.shift();
  q.wait = clipOf(pack, line).ms / 1000 + LINE_GAP;
  q.now = line;
  return line;
}

export const sayingOf = (q) => (q.wait > LINE_GAP && q.now?.kind === 'species' ? q.now.id : null);

export function clearQueue(q) {
  q.lines = [];
  q.wait = 0;
}
