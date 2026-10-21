// Pinyin: porównywanie niezależne od zapisu („nǐhǎo” = „ni3 hao3” = „ni3hao3”),
// podział na sylaby (do kolorowania tonów) i szczegółowa informacja, która sylaba ma zły ton.

const MARKS: Record<string, [string, number]> = {
  ā: ["a", 1], á: ["a", 2], ǎ: ["a", 3], à: ["a", 4],
  ē: ["e", 1], é: ["e", 2], ě: ["e", 3], è: ["e", 4],
  ī: ["i", 1], í: ["i", 2], ǐ: ["i", 3], ì: ["i", 4],
  ō: ["o", 1], ó: ["o", 2], ǒ: ["o", 3], ò: ["o", 4],
  ū: ["u", 1], ú: ["u", 2], ǔ: ["u", 3], ù: ["u", 4],
  ǖ: ["v", 1], ǘ: ["v", 2], ǚ: ["v", 3], ǜ: ["v", 4], ü: ["v", 0],
};

const FINALS = [
  "iang", "iong", "uang", "ueng", "ang", "eng", "ing", "ong", "ian", "iao", "uai", "uan", "van",
  "ai", "ei", "ao", "ou", "an", "en", "er", "in", "un", "vn", "ia", "ie", "iu", "ua", "uo", "ui", "ve", "ue",
  "a", "o", "e", "i", "u", "v",
];
const SYLLABLE = new RegExp(`^(?:zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])?(?:${FINALS.join("|")})r?$`);

export function analyzePinyin(str: string): { base: string; tones: string } {
  const s = String(str ?? "").toLowerCase().normalize("NFC").replace(/u:/g, "v");
  let base = "";
  const tones: number[] = [];
  for (const ch of s) {
    if (MARKS[ch]) {
      const [letter, tone] = MARKS[ch];
      base += letter;
      if (tone) tones.push(tone);
    } else if (ch >= "1" && ch <= "4") {
      tones.push(Number(ch));
    } else if (ch >= "a" && ch <= "z") {
      base += ch;
    }
    // spacje, apostrofy, myślniki, „…”, cyfry 0/5 są pomijane
  }
  return { base, tones: tones.join("") };
}

export function pinyinMatches(input: string, expected: string, { ignoreTones = false } = {}): boolean {
  const a = analyzePinyin(input);
  const b = analyzePinyin(expected);
  if (!a.base || a.base !== b.base) return false;
  return ignoreTones || a.tones === b.tones;
}

export interface Syllable {
  /** zapis oryginalny (np. „hǎo”) */
  text: string;
  /** litery bez tonu (np. „hao”) */
  base: string;
  /** 1–4, 0 = ton neutralny */
  tone: number;
}

interface Letter {
  orig: string;
  base: string;
  tone: number;
}

/** Wszystkie możliwe podziały ciągu liter na poprawne sylaby (ograniczone do kilkunastu wariantów). */
function segmentations(base: string, limit = 16): string[][] {
  const out: string[][] = [];
  const walk = (pos: number, acc: string[]) => {
    if (out.length >= limit) return;
    if (pos === base.length) {
      out.push([...acc]);
      return;
    }
    for (let len = Math.min(7, base.length - pos); len >= 1; len--) {
      const part = base.slice(pos, pos + len);
      if (SYLLABLE.test(part)) walk(pos + len, [...acc, part]);
    }
  };
  walk(0, []);
  return out;
}

/**
 * Dzieli pinyin na sylaby. `target` (np. liczba znaków chińskich) pomaga wybrać właściwy podział,
 * gdy jest niejednoznaczny. Zwraca null, jeśli tekstu nie da się podzielić.
 */
export function splitSyllables(pinyin: string, target?: number): Syllable[] | null {
  const s = String(pinyin ?? "").normalize("NFC");
  const chunks: { letters: Letter[]; tone: number }[] = [];
  let current: Letter[] = [];
  const close = (tone = 0) => {
    if (current.length) chunks.push({ letters: current, tone });
    current = [];
  };
  for (const raw of s) {
    const lower = raw.toLowerCase();
    if (MARKS[lower]) current.push({ orig: raw, base: MARKS[lower][0], tone: MARKS[lower][1] });
    else if (lower >= "a" && lower <= "z") current.push({ orig: raw, base: lower, tone: 0 });
    else if (lower >= "0" && lower <= "5") close(Number(lower) % 5);
    else if (raw === ":" && current.length && current[current.length - 1].base === "u") current[current.length - 1].base = "v";
    else close();
  }
  close();
  if (!chunks.length) return null;

  // Dla każdego fragmentu znajdź możliwe podziały, a potem wybierz kombinację dającą `target` sylab.
  const options = chunks.map(c => segmentations(c.letters.map(l => l.base).join("")));
  if (options.some(o => !o.length)) return null;
  let choice: number[] | null = null;
  const pick = (i: number, count: number, acc: number[]) => {
    if (choice) return;
    if (i === options.length) {
      if (target == null || count === target) choice = acc;
      return;
    }
    options[i].forEach((opt, k) => pick(i + 1, count + opt.length, [...acc, k]));
  };
  pick(0, 0, []);
  const picked: number[] = choice ?? options.map(() => 0);

  const result: Syllable[] = [];
  chunks.forEach((c, ci) => {
    const parts = options[ci][picked[ci]];
    let pos = 0;
    parts.forEach((part, pi) => {
      const letters = c.letters.slice(pos, pos + part.length);
      pos += part.length;
      let tone = letters.reduce((t, l) => t || l.tone, 0);
      if (!tone && pi === parts.length - 1) tone = c.tone;
      result.push({ text: letters.map(l => l.orig).join(""), base: part, tone });
    });
  });
  return result;
}

export function countHanzi(text: string): number {
  return [...String(text)].filter(c => /\p{Script=Han}/u.test(c)).length;
}

/** Oczekiwana liczba sylab słowa: liczba znaków, ale „儿” w erhua (哪儿 = nǎr) nie tworzy osobnej sylaby. */
export function syllableTarget(term: string, reading: string): number | undefined {
  let n = countHanzi(term);
  const erhua = (term.match(/(?<=\p{Script=Han})儿/gu) || []).length;
  if (erhua && !/[eēéěè]r/i.test(reading.normalize("NFC"))) n -= erhua;
  return n || undefined;
}

/** Wzór tonów słowa, np. [3, 3] dla 你好 (tony słownikowe, bez sandhi). */
export function tonePattern(pinyin: string, term?: string): number[] | null {
  const syl = splitSyllables(pinyin, term ? syllableTarget(term, pinyin) : undefined);
  return syl ? syl.map(s => s.tone) : null;
}

export type SyllableVerdict = { expected: Syllable; given?: Syllable; status: "ok" | "tone" | "wrong" };

/** Porównanie sylaba po sylabie – do pokazania, który ton był błędny. */
export function compareSyllables(input: string, expected: string, term?: string): SyllableVerdict[] | null {
  const exp = splitSyllables(expected, term ? syllableTarget(term, expected) : undefined);
  const got = splitSyllables(input, exp?.length);
  if (!exp) return null;
  return exp.map((e, i) => {
    const g = got?.[i];
    if (!g || g.base !== e.base) return { expected: e, given: g, status: "wrong" };
    return { expected: e, given: g, status: g.tone === e.tone ? "ok" : "tone" };
  });
}

export const TONE_NAMES = ["neutralny", "1. (wysoki, równy)", "2. (wznoszący)", "3. (opadająco-wznoszący)", "4. (opadający)"];
