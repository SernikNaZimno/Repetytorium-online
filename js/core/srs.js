// Prosty system powtórek w odstępach (pudełka Leitnera).
// Poprawna odpowiedź przesuwa słowo do kolejnego pudełka, błędna – z powrotem do pierwszego.
import { shuffle } from './utils.js';

const MIN = 60e3;
const DAY = 864e5;
export const INTERVALS = [0, 10 * MIN, DAY, 3 * DAY, 7 * DAY, 16 * DAY, 35 * DAY, 90 * DAY];
export const MASTERED_BOX = 4;

// grade: 0 – źle, 1 – dobrze, 2 – łatwe (przeskakuje pudełko)
export function review(stat, grade, now = Date.now()) {
  const s = { box: 0, seen: 0, ok: 0, bad: 0, ...stat };
  s.seen += 1;
  s.last = now;
  if (grade > 0) {
    s.ok += 1;
    s.box = Math.min(s.box + grade, INTERVALS.length - 1);
  } else {
    s.bad += 1;
    s.box = 1;
  }
  s.due = now + INTERVALS[s.box];
  return s;
}

export function status(stat) {
  if (!stat || !stat.seen) return 'new';
  return stat.box >= MASTERED_BOX ? 'mastered' : 'learning';
}

export function isDue(stat, now = Date.now()) {
  return !!(stat && stat.seen && stat.due <= now);
}

export function isHard(stat) {
  return !!(stat && stat.bad > 0 && stat.box <= 2);
}

// Kolejność: najpierw zaległe powtórki, potem nowe słowa (w kolejności modułu),
// na końcu pozostałe – od najsłabiej opanowanych.
export function pickItems(items, stats, n, now = Date.now()) {
  const st = id => stats[id];
  const due = items.filter(i => isDue(st(i.id), now)).sort((a, b) => st(a.id).due - st(b.id).due);
  const fresh = items.filter(i => !st(i.id)?.seen);
  const rest = items
    .filter(i => st(i.id)?.seen && !isDue(st(i.id), now))
    .sort((a, b) => st(a.id).box - st(b.id).box || st(a.id).due - st(b.id).due);
  return shuffle([...due, ...fresh, ...rest].slice(0, n));
}

export function summarize(items, stats, now = Date.now()) {
  const sum = { total: items.length, new: 0, learning: 0, mastered: 0, due: 0, hard: 0 };
  for (const item of items) {
    const s = stats[item.id];
    sum[status(s)] += 1;
    if (isDue(s, now)) sum.due += 1;
    if (isHard(s)) sum.hard += 1;
  }
  return sum;
}
