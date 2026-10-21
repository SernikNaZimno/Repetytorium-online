// Zamienia „surową” definicję modułu (pliki w /modules lub moduł utworzony przez użytkownika)
// na jednolity obiekt, z którego korzystają wszystkie ćwiczenia.
import { chunk } from './utils.js';

const DEFAULT_LABELS = { term: 'Pojęcie', reading: 'Wymowa', meaning: 'Znaczenie' };
const PUNCT = /^[，。？！、：；,.?!:;…“”"'()（）]+$/;

function normalizeItem(raw) {
  if (Array.isArray(raw)) {
    const [term, a, b] = raw;
    // [term, meaning] albo [term, reading, meaning]
    return raw.length >= 3 ? { term, reading: a || '', meaning: b || '' } : { term, reading: '', meaning: a || '' };
  }
  return { reading: '', meaning: '', ...raw };
}

export function parseSentence(raw, sep = ' ') {
  const s = Array.isArray(raw) ? { text: raw[0], reading: raw[1], meaning: raw[2], item: raw[3] } : { ...raw };
  const tokens = String(s.text).trim().split(/\s+/);
  const blankIndex = tokens.findIndex(t => /^\{.+\}$/.test(t));
  const clean = tokens.map(t => t.replace(/^\{(.+)\}$/, '$1'));
  const blank = blankIndex >= 0 ? clean[blankIndex] : null;

  // Części do układania zdania: interpunkcja dokleja się do poprzedniego słowa.
  const chunks = [];
  for (const t of clean) {
    if (PUNCT.test(t) && chunks.length) chunks[chunks.length - 1] += t;
    else chunks.push(t);
  }
  return {
    tokens: clean,
    blankIndex,
    blank,
    chunks,
    text: sep ? clean.join(sep).replace(/ ([，。？！、：；,.?!:;])/g, '$1') : clean.join(''),
    reading: s.reading || '',
    meaning: s.meaning || '',
    itemId: s.item || blank,
  };
}

export function defaultExercises(m) {
  const list = [
    { type: 'flashcards', front: 'term' },
    { type: 'flashcards', front: 'meaning', title: 'Fiszki odwrotne' },
    { type: 'choice', from: 'term', to: 'meaning' },
    { type: 'choice', from: 'meaning', to: 'term' },
  ];
  if (m.hasReading) list.push({ type: 'choice', from: 'term', to: 'reading' });
  if (m.hasReading && m.readingType === 'pinyin') list.push({ type: 'typing', from: 'term', to: 'reading' });
  if (m.script !== 'zh') list.push({ type: 'typing', from: 'meaning', to: 'term' });
  list.push({ type: 'matching' });
  if (m.lang) list.push({ type: 'listening' });
  if (m.sentences.length) list.push({ type: 'fill' }, { type: 'order' });
  return list;
}

export function normalizeModule(def) {
  const m = {
    icon: '📘',
    color: '#4f6bed',
    description: '',
    subtitle: '',
    lang: '',
    script: '',
    readingType: '',
    groupSize: 15,
    exam: {},
    ...def,
  };
  m.labels = { ...DEFAULT_LABELS, ...(def.labels || {}) };
  m.wordSeparator = def.wordSeparator ?? (m.script === 'zh' ? '' : ' ');

  const seen = new Set();
  m.items = (def.items || []).map(normalizeItem).filter(i => i.term).map(item => {
    let id = item.id ?? item.term;
    while (seen.has(id)) id += '′';
    seen.add(id);
    return { ...item, id };
  });
  m.byId = new Map(m.items.map(i => [i.id, i]));
  m.hasReading = m.items.some(i => i.reading);

  m.sentences = (def.sentences || []).map(s => parseSentence(s, m.wordSeparator)).filter(s => m.byId.has(s.itemId));
  m.sentencesByItem = new Map();
  for (const s of m.sentences) {
    if (!m.sentencesByItem.has(s.itemId)) m.sentencesByItem.set(s.itemId, []);
    m.sentencesByItem.get(s.itemId).push(s);
  }

  const groups = chunk(m.items, m.groupSize);
  // Bardzo krótką końcówkę dołączamy do poprzedniego zestawu.
  if (groups.length > 1 && groups[groups.length - 1].length < m.groupSize / 2) groups[groups.length - 2].push(...groups.pop());
  m.groups = groups.map((items, i, all) => {
    const from = i * m.groupSize + 1;
    return { key: `g${i}`, label: all.length > 1 ? `Zestaw ${i + 1}` : 'Zestaw', range: `${from}–${from + items.length - 1}`, items };
  });

  m.exercises = (def.exercises || defaultExercises(m)).map((cfg, index) => ({ ...cfg, index }));
  return m;
}
