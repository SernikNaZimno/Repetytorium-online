// Porównywanie pinyinu niezależnie od zapisu: „nǐhǎo”, „ni3 hao3”, „ni3hao3” są równoważne.
// Ton neutralny (5 lub 0) jest pomijany, „ü” można wpisać jako „v” lub „u:”.
const MARKS = {
  ā: ['a', 1], á: ['a', 2], ǎ: ['a', 3], à: ['a', 4],
  ē: ['e', 1], é: ['e', 2], ě: ['e', 3], è: ['e', 4],
  ī: ['i', 1], í: ['i', 2], ǐ: ['i', 3], ì: ['i', 4],
  ō: ['o', 1], ó: ['o', 2], ǒ: ['o', 3], ò: ['o', 4],
  ū: ['u', 1], ú: ['u', 2], ǔ: ['u', 3], ù: ['u', 4],
  ǖ: ['v', 1], ǘ: ['v', 2], ǚ: ['v', 3], ǜ: ['v', 4], ü: ['v', 0],
};

export function analyzePinyin(str) {
  const s = String(str ?? '').toLowerCase().normalize('NFC').replace(/u:/g, 'v');
  let base = '';
  const tones = [];
  for (const ch of s) {
    if (MARKS[ch]) {
      const [letter, tone] = MARKS[ch];
      base += letter;
      if (tone) tones.push(tone);
    } else if (ch >= '1' && ch <= '4') {
      tones.push(Number(ch));
    } else if (ch >= 'a' && ch <= 'z') {
      base += ch;
    }
    // spacje, apostrofy, myślniki, „…”, cyfry 0/5 są pomijane
  }
  return { base, tones: tones.join('') };
}

export function pinyinMatches(input, expected, { ignoreTones = false } = {}) {
  const a = analyzePinyin(input);
  const b = analyzePinyin(expected);
  if (!a.base || a.base !== b.base) return false;
  return ignoreTones || a.tones === b.tones;
}
