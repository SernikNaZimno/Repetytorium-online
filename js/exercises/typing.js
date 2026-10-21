import { h, append } from '../core/dom.js';
import { answerMatches } from '../core/utils.js';
import { pinyinMatches } from '../core/pinyin.js';
import { fieldEl, itemCard, speakButton, speakText } from '../ui/components.js';

export default {
  type: 'typing',
  category: 'vocab',
  icon: '⌨️',
  title: (cfg, m) => `Wpisz: ${m.labels[cfg.to].toLowerCase()}`,
  description: (cfg, m) => cfg.to === 'reading' && m.readingType === 'pinyin'
    ? 'Wpisz pinyin z tonami – cyframi (ni3hao3) lub znakami (nǐhǎo).'
    : 'Wpisz odpowiedź z klawiatury.',
  available: (m, cfg) => m.items.some(i => i[cfg.from] && i[cfg.to]),
  build(m, ctx) {
    const { from, to } = ctx.cfg;
    return ctx.pick(ctx.count).filter(i => i[from] && i[to]).map(item => ({ kind: 'typing', item, from, to, itemIds: [item.id], label: item.term }));
  },
  render(q, ui, body) {
    const m = ui.module;
    const { item, from, to } = q;
    const isPinyin = to === 'reading' && m.readingType === 'pinyin';
    const ignoreTones = ui.settings.ignoreTones;

    const input = h('input', {
      class: 'answer-input', type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false',
      placeholder: isPinyin ? (ignoreTones ? 'np. nihao' : 'np. ni3hao3 lub nǐhǎo') : `${m.labels[to]}…`,
      'aria-label': m.labels[to],
    });

    const check = () => {
      const value = input.value.trim();
      if (!value) { input.focus(); return; }
      const ok = isPinyin ? pinyinMatches(value, item.reading, { ignoreTones }) : answerMatches(value, item[to]);
      finish(ok, value);
    };
    const finish = (ok, value) => {
      input.disabled = true;
      input.classList.add(ok ? 'ok' : 'bad');
      checkBtn.disabled = skipBtn.disabled = true;
      ui.answer(ok, {
        reveal: itemCard(m, item),
        note: !ok && value ? `Twoja odpowiedź: ${value}` : null,
      });
      if (isPinyin && ui.settings.autoSpeak) speakText(m, item.term);
    };

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); check(); }
    });
    const checkBtn = h('button', { class: 'btn primary', onclick: check }, 'Sprawdź');
    const skipBtn = h('button', { class: 'btn ghost', onclick: () => finish(false, '') }, 'Nie wiem');

    append(body,
      h('div', { class: 'question-label' }, `Wpisz: ${m.labels[to].toLowerCase()}`),
      h('div', { class: 'prompt' },
        fieldEl(m, item, from, from === 'term' ? 'huge' : 'large'),
        from === 'term' && !isPinyin && speakButton(m, item.term),
      ),
      h('div', { class: 'typing-row' }, input, checkBtn, skipBtn),
      isPinyin && h('div', { class: 'muted small' }, ignoreTones
        ? 'Tony są ignorowane (zmienisz to w Ustawieniach).'
        : 'Ton neutralny można pominąć. „ü” wpisz jako „v”.'),
    );
    setTimeout(() => input.focus(), 30);
  },
};
