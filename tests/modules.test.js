// Sprawdza poprawność danych we wszystkich wbudowanych modułach.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import builtIn from '../modules/index.js';
import { normalizeModule } from '../js/core/module.js';
import { analyzePinyin } from '../js/core/pinyin.js';

const TONE_MARK = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/;

for (const def of builtIn) {
  const m = normalizeModule(def);

  test(`${m.id}: podstawowe pola`, () => {
    assert.ok(m.id && m.title, 'brak id lub tytułu');
    assert.ok(m.items.length >= 4, 'za mało pozycji');
    assert.equal(new Set(builtIn.map(d => d.id)).size, builtIn.length, 'powtórzone id modułów');
  });

  test(`${m.id}: pozycje mają unikalne id i komplet danych`, () => {
    const ids = def.items.map(i => (Array.isArray(i) ? i[0] : i.id ?? i.term));
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    assert.deepEqual(dupes, [], `powtórzone pozycje: ${dupes.join(', ')}`);
    for (const item of m.items) {
      assert.ok(item.meaning, `brak znaczenia: ${item.term}`);
      if (m.readingType === 'pinyin') {
        assert.ok(item.reading, `brak pinyinu: ${item.term}`);
        assert.ok(analyzePinyin(item.reading).base.length > 0, `niepoprawny pinyin: ${item.term}`);
      }
    }
  });

  if (m.readingType === 'pinyin') {
    test(`${m.id}: liczba tonów w pinyinie nie przekracza liczby znaków`, () => {
      for (const item of m.items) {
        const hanzi = [...item.term].filter(c => /\p{Script=Han}/u.test(c)).length;
        const tones = analyzePinyin(item.reading).tones.length;
        assert.ok(tones <= hanzi, `${item.term} (${item.reading}): ${tones} tonów na ${hanzi} znaków`);
        assert.ok(tones > 0 || !TONE_MARK.test(item.reading), item.term);
      }
    });
  }

  if (def.sentences) {
    test(`${m.id}: każde zdanie ma lukę wskazującą istniejące słowo`, () => {
      assert.equal(m.sentences.length, def.sentences.length, 'część zdań wskazuje nieistniejące słowa');
      for (const s of m.sentences) {
        assert.ok(s.blankIndex >= 0, `brak luki: ${s.text}`);
        assert.ok(s.reading && s.meaning, `brak pinyinu lub tłumaczenia: ${s.text}`);
        const item = m.byId.get(s.itemId);
        assert.ok(item.term.includes(s.blank), `luka „${s.blank}” nie pasuje do słowa „${item.term}”`);
      }
    });

    test(`${m.id}: każde słowo ma zdanie przykładowe`, () => {
      const missing = m.items.filter(i => !m.sentencesByItem.has(i.id)).map(i => i.term);
      assert.deepEqual(missing, []);
    });
  }

  if (def.exam) {
    test(`${m.id}: zadania egzaminacyjne są kompletne`, () => {
      for (const j of def.exam.judge || []) {
        assert.equal(j.length, 5, `niekompletne zadanie prawda/fałsz: ${j[0]}`);
        assert.equal(typeof j[2], 'boolean');
      }
      const answers = (def.exam.replies || []).map(r => r[1]);
      assert.equal(new Set(answers).size, answers.length, 'powtórzone odpowiedzi w dopasowywaniu');
      for (const r of def.exam.replies || []) assert.equal(r.length, 4, `niekompletna para: ${r[0]}`);
      for (const d of def.exam.dialogs || []) {
        assert.ok(d.lines.length >= 2 && d.question && d.meaning, `niekompletny dialog: ${d.question}`);
        assert.equal(new Set(d.options).size, d.options.length, `powtórzone opcje: ${d.question}`);
        for (const [who] of d.lines) assert.ok(['男', '女'].includes(who));
      }
    });
  }

  test(`${m.id}: konfiguracja ćwiczeń`, () => {
    const known = ['flashcards', 'choice', 'typing', 'matching', 'listening', 'fill', 'order', 'judge', 'reply', 'dialog', 'exam'];
    for (const cfg of m.exercises) {
      assert.ok(known.includes(cfg.type), `nieznany typ ćwiczenia: ${cfg.type}`);
      for (const s of cfg.sections || []) assert.ok(known.includes(s.type));
    }
  });
}
