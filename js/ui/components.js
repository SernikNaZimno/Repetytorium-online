import { h } from '../core/dom.js';
import * as tts from '../core/tts.js';
import { store } from '../core/storage.js';

export const speakable = text => String(text ?? '').replace(/…/g, '，');

export function speakText(m, text, opts = {}) {
  tts.speak(speakable(text), { lang: m.lang, rate: store.settings().speechRate, ...opts });
}

export function speakButton(m, text, { label = '🔊', title = 'Odtwórz wymowę', cls = '' } = {}) {
  if (!m.lang || !tts.ttsSupported()) return null;
  return h('button', {
    class: `btn icon speak ${cls}`,
    type: 'button',
    title,
    'aria-label': title,
    onclick: e => { e.stopPropagation(); speakText(m, text); },
  }, label);
}

export function fieldEl(m, item, field, cls = '') {
  const value = item[field];
  const extra = field === 'term' && m.script ? ` ${m.script}` : '';
  return h('span', { class: `field-${field}${extra} ${cls}`, lang: field === 'term' && m.lang ? m.lang : null }, value);
}

export function itemCard(m, item) {
  const example = m.sentencesByItem.get(item.id)?.[0];
  return h('div', { class: 'item-card' },
    h('div', { class: 'item-card-head' },
      fieldEl(m, item, 'term', 'big'),
      speakButton(m, item.term),
    ),
    item.reading && h('div', { class: 'field-reading' }, item.reading),
    h('div', { class: 'field-meaning' }, item.meaning),
    example && sentenceBlock(m, example, { highlight: true }),
  );
}

export function sentenceBlock(m, s, { highlight = false, showReading = true, showMeaning = true } = {}) {
  const sep = m.wordSeparator;
  const textEl = h('span', { class: `sentence-text ${m.script || ''}`, lang: m.lang || null });
  s.tokens.forEach((t, i) => {
    if (i > 0 && sep && !/^[，。？！、：；,.?!:;]/.test(t)) textEl.append(sep);
    textEl.append(highlight && i === s.blankIndex ? h('mark', {}, t) : t);
  });
  return h('div', { class: 'sentence' },
    h('div', { class: 'sentence-line' }, textEl, speakButton(m, s.text)),
    showReading && s.reading && h('div', { class: 'sentence-reading' }, s.reading),
    showMeaning && s.meaning && h('div', { class: 'sentence-meaning' }, s.meaning),
  );
}

// Siatka przycisków odpowiedzi z obsługą klawiszy 1–9.
export function choiceButtons(ui, labels, correctIndex, onDone, { cls = '', layout = 'grid' } = {}) {
  let done = false;
  const buttons = labels.map((label, i) =>
    h('button', { class: `option ${cls}`, type: 'button', onclick: () => pick(i) },
      h('span', { class: 'option-key' }, String(i + 1)),
      h('span', { class: 'option-label' }, label),
    ));
  function pick(i) {
    if (done) return;
    done = true;
    buttons.forEach((b, j) => {
      b.disabled = true;
      if (j === correctIndex) b.classList.add('correct');
      else if (j === i) b.classList.add('wrong');
    });
    onDone(i === correctIndex, i);
  }
  ui.onKey(e => {
    const n = Number(e.key);
    if (n >= 1 && n <= buttons.length) { e.preventDefault(); pick(n - 1); }
  });
  return h('div', { class: `options ${layout}` }, buttons);
}

export function progressBar(value, total, cls = '') {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return h('div', { class: `bar ${cls}`, title: `${pct}%` }, h('div', { class: 'bar-fill', style: { width: `${pct}%` } }));
}

export function voiceWarning(m) {
  if (!m.lang) return null;
  if (!tts.ttsSupported()) {
    return h('div', { class: 'notice' }, 'Twoja przeglądarka nie obsługuje syntezy mowy, więc nagrania nie zostaną odtworzone. Możesz podejrzeć tekst nagrania.');
  }
  if (tts.voiceAvailable(m.lang) === false) {
    return h('div', { class: 'notice' },
      `Nie znaleziono głosu dla języka ${m.lang}. Zainstaluj go w ustawieniach systemu (np. „Mowa” / „Zamiana tekstu na mowę”) albo użyj Chrome/Edge.`);
  }
  return null;
}
