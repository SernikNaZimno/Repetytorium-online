import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pinyinMatches, analyzePinyin } from '../js/core/pinyin.js';
import { answerMatches, distractors, normalizeText } from '../js/core/utils.js';
import { review, pickItems, status, INTERVALS } from '../js/core/srs.js';
import { normalizeModule, parseSentence } from '../js/core/module.js';

test('pinyin: zapis z cyframi i ze znakami tonów jest równoważny', () => {
  assert.ok(pinyinMatches('ni3hao3', 'nǐhǎo'));
  assert.ok(pinyinMatches('ni3 hao3', 'nǐ hǎo'));
  assert.ok(pinyinMatches('nǐhǎo', 'nǐ hǎo'));
  assert.ok(pinyinMatches('lv3you2', 'lǚyóu'));
  assert.ok(pinyinMatches('lu:3you2', 'lǚyóu'));
  assert.ok(pinyinMatches('di4di', 'dìdi'), 'ton neutralny można pominąć');
  assert.ok(pinyinMatches('di4di5', 'dìdi'));
  assert.ok(pinyinMatches('di4yi1', 'dì-yī'));
  assert.ok(pinyinMatches('sui1ran2dan4shi4', 'suīrán…dànshì'));
});

test('pinyin: błędny ton lub sylaba nie przechodzi', () => {
  assert.ok(!pinyinMatches('ni2hao3', 'nǐhǎo'));
  assert.ok(!pinyinMatches('nihao', 'nǐhǎo'));
  assert.ok(!pinyinMatches('ni3hai3', 'nǐhǎo'));
  assert.ok(!pinyinMatches('', 'nǐhǎo'));
});

test('pinyin: tryb ignorowania tonów', () => {
  assert.ok(pinyinMatches('nihao', 'nǐhǎo', { ignoreTones: true }));
  assert.ok(pinyinMatches('ni4hao4', 'nǐhǎo', { ignoreTones: true }));
  assert.deepEqual(analyzePinyin('Běijīng'), { base: 'beijing', tones: '31' });
});

test('odpowiedzi tekstowe: warianty, wielkość liter i polskie znaki', () => {
  assert.ok(answerMatches('nosić', 'nosić, ubierać (się)'));
  assert.ok(answerMatches('ubierac sie', 'nosić, ubierać (się)'));
  assert.ok(answerMatches('ubierać', 'nosić, ubierać (się)'));
  assert.ok(answerMatches('Warszawa', 'Warszawa'));
  assert.ok(answerMatches('lodz', 'Łódź'));
  assert.ok(!answerMatches('Kraków', 'Warszawa'));
  assert.equal(normalizeText('  Zażółć  GĘŚLĄ! '), 'zazolc gesla');
});

test('dystraktory są unikalne i różne od poprawnej odpowiedzi', () => {
  const items = [{ r: 'jìn' }, { r: 'jìn' }, { r: 'wán' }, { r: 'wán' }, { r: 'a' }, { r: 'b' }];
  for (let i = 0; i < 50; i++) {
    const d = distractors(items, items[0], 3, x => x.r);
    const keys = d.map(x => x.r);
    assert.equal(new Set(keys).size, keys.length);
    assert.ok(!keys.includes('jìn'));
  }
});

test('SRS: poprawne odpowiedzi przesuwają pudełko, błąd cofa', () => {
  let s = review(undefined, 1, 0);
  assert.equal(s.box, 1);
  s = review(s, 1, 0);
  assert.equal(s.box, 2);
  assert.equal(s.due, INTERVALS[2]);
  s = review(s, 2, 0);
  assert.equal(s.box, 4);
  assert.equal(status(s), 'mastered');
  s = review(s, 0, 0);
  assert.equal(s.box, 1);
  assert.equal(s.bad, 1);
  assert.equal(status(s), 'learning');
});

test('SRS: najpierw zaległe, potem nowe', () => {
  const items = ['a', 'b', 'c', 'd'].map(id => ({ id }));
  const stats = {
    a: { seen: 1, box: 2, due: 1000 },
    b: { seen: 1, box: 3, due: 10 ** 12 },
  };
  const picked = pickItems(items, stats, 2, 5000).map(i => i.id).sort();
  assert.deepEqual(picked, ['a', 'c']);
});

test('zdania: luka, kawałki do układania i tekst', () => {
  const s = parseSentence(['我们 一起 去 商店 {吧} 。', 'py', 'pl'], '');
  assert.equal(s.blank, '吧');
  assert.equal(s.itemId, '吧');
  assert.equal(s.text, '我们一起去商店吧。');
  assert.deepEqual(s.chunks, ['我们', '一起', '去', '商店', '吧。']);

  const en = parseSentence(['I {like} tea .', '', ''], ' ');
  assert.equal(en.text, 'I like tea.');
});

test('moduł: domyślne ćwiczenia zależą od dostępnych danych', () => {
  const m = normalizeModule({ id: 'x', title: 'X', items: [['a', 'b'], ['c', 'd'], ['e', 'f'], ['g', 'h']] });
  const types = m.exercises.map(e => e.type);
  assert.ok(types.includes('flashcards'));
  assert.ok(types.includes('typing'));
  assert.ok(!types.includes('listening'));
  assert.ok(!types.includes('fill'));
  assert.equal(m.items[0].meaning, 'b');
  assert.equal(m.hasReading, false);
});
