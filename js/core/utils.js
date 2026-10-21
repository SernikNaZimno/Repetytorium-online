export function shuffle(arr) {
  const r = [...arr];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export function sample(arr, n) {
  return shuffle(arr).slice(0, n);
}

export function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Wybiera n elementów różnych od `correct` (i od siebie nawzajem) według klucza.
// `prefer` pozwala najpierw sięgać po „podobne” kandydatury (np. tej samej długości).
export function distractors(pool, correct, n, key = x => x, prefer = null) {
  const norm = v => String(v ?? '').trim().toLowerCase();
  const used = new Set([norm(key(correct))]);
  const candidates = shuffle(pool.filter(x => x !== correct && norm(key(x))));
  if (prefer) candidates.sort((a, b) => Number(prefer(b)) - Number(prefer(a)));
  const out = [];
  for (const c of candidates) {
    const k = norm(key(c));
    if (used.has(k)) continue;
    used.add(k);
    out.push(c);
    if (out.length >= n) break;
  }
  return out;
}

// Usuwa wielkość liter, polskie znaki diakrytyczne, interpunkcję i nadmiarowe spacje.
export function normalizeText(s) {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ł/g, 'l')
    .replace(/[.,!?;:"'„”«»()[\]…\-–—/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Akceptuje dowolny z wariantów oddzielonych przecinkiem, średnikiem lub ukośnikiem,
// ignorując dopiski w nawiasach, np. „nosić, ubierać (się)”.
export function answerMatches(input, expected) {
  const given = normalizeText(input);
  if (!given) return false;
  const variants = new Set([normalizeText(expected), normalizeText(String(expected).replace(/\([^)]*\)/g, ''))]);
  for (const part of String(expected).split(/[,;/]/)) {
    variants.add(normalizeText(part));
    variants.add(normalizeText(part.replace(/\([^)]*\)/g, '')));
  }
  variants.delete('');
  return variants.has(given);
}

export function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function plural(n, one, few, many) {
  if (n === 1) return one;
  const d = n % 10, t = n % 100;
  if (d >= 2 && d <= 4 && (t < 12 || t > 14)) return few;
  return many;
}
