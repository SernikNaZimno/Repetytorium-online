export function shuffle<T>(arr: readonly T[]): T[] {
  const r = [...arr];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export function sample<T>(arr: readonly T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

export function chunk<T>(arr: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Wybiera n elementów różnych od `correct` (i od siebie nawzajem) według klucza.
 * `prefer` pozwala najpierw sięgać po „podobne” kandydatury (np. słowa tej samej długości) – trudniejsze dystraktory.
 */
export function distractors<T>(pool: readonly T[], correct: T, n: number, key: (x: T) => string, prefer?: (x: T) => boolean): T[] {
  const norm = (v: string) => String(v ?? "").trim().toLowerCase();
  const used = new Set([norm(key(correct))]);
  const candidates = shuffle(pool.filter(x => x !== correct && norm(key(x))));
  if (prefer) candidates.sort((a, b) => Number(prefer(b)) - Number(prefer(a)));
  const out: T[] = [];
  for (const c of candidates) {
    const k = norm(key(c));
    if (used.has(k)) continue;
    used.add(k);
    out.push(c);
    if (out.length >= n) break;
  }
  return out;
}

/** Usuwa wielkość liter, polskie znaki diakrytyczne, interpunkcję i nadmiarowe spacje. */
export function normalizeText(s: string): string {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .replace(/[.,!?;:"'„”«»()[\]…\-–—/\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Akceptuje dowolny wariant oddzielony przecinkiem, średnikiem lub ukośnikiem; ignoruje dopiski w nawiasach. */
export function answerMatches(input: string, expected: string): boolean {
  const given = normalizeText(input);
  if (!given) return false;
  const stripParens = (s: string) => s.replace(/\([^)]*\)/g, "");
  const variants = new Set([normalizeText(expected), normalizeText(stripParens(expected))]);
  for (const part of String(expected).split(/[,;/]/)) {
    variants.add(normalizeText(part));
    variants.add(normalizeText(stripParens(part)));
  }
  variants.delete("");
  return variants.has(given);
}

export function dayKey(date: Date | number = new Date()): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function startOfDay(date: Date | number = new Date()): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  const d = n % 10;
  const t = n % 100;
  if (d >= 2 && d <= 4 && (t < 12 || t > 14)) return few;
  return many;
}

/** Czytelny opis odstępu czasu, np. „10 min”, „3 dni”, „2 mies.” */
export function formatInterval(ms: number): string {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${Math.max(1, min)} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} godz.`;
  const d = Math.round(h / 24);
  if (d < 31) return `${d} ${plural(d, "dzień", "dni", "dni")}`;
  const mo = Math.round(d / 30);
  if (mo < 12) return `${mo} mies.`;
  return `${(d / 365).toFixed(1)} roku`;
}
