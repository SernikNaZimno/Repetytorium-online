import { h, append } from '../core/dom.js';
import { distractors, sample, shuffle } from '../core/utils.js';
import { choiceButtons, sentenceBlock, speakText } from '../ui/components.js';

// 选词填空 – wybierz słowo pasujące do luki w zdaniu.
export default {
  type: 'fill',
  category: 'exam',
  icon: '✏️',
  title: () => 'Uzupełnij zdanie',
  description: () => 'Wybierz słowo, które pasuje do luki w zdaniu (选词填空).',
  available: m => m.sentences.length >= 4,
  build(m, ctx) {
    let pool = ctx.pool.filter(i => m.sentencesByItem.has(i.id));
    if (pool.length < 4) pool = m.items.filter(i => m.sentencesByItem.has(i.id));
    return ctx.pickFrom(pool, ctx.count).map(item => {
      const sentence = sample(m.sentencesByItem.get(item.id), 1)[0];
      const correct = { term: sentence.blank };
      const len = [...sentence.blank].length;
      // Unikamy słów, które już występują w zdaniu, i preferujemy słowa o tej samej długości.
      const candidates = m.items
        .filter(i => !i.term.includes('…') && !sentence.text.includes(i.term))
        .map(i => ({ term: i.term }));
      const wrong = distractors(candidates, correct, 3, o => o.term, o => [...o.term].length === len);
      const options = shuffle([correct, ...wrong]).map(o => o.term);
      return { kind: 'fill', sentence, options, answer: sentence.blank, itemIds: [item.id], label: sentence.text };
    });
  },
  render(q, ui, body) {
    const m = ui.module;
    const s = q.sentence;
    const sep = m.wordSeparator;
    const blank = h('span', { class: 'blank' }, '\u00a0'.repeat(4));
    const line = h('div', { class: `sentence-text big ${m.script || ''}`, lang: m.lang || null });
    s.tokens.forEach((t, i) => {
      if (i > 0 && sep && !/^[，。？！、：；,.?!:;]/.test(t)) line.append(sep);
      line.append(i === s.blankIndex ? blank : t);
    });
    const hint = h('button', { class: 'btn ghost small', onclick: () => hint.replaceWith(h('div', { class: 'muted' }, s.meaning)) }, 'Pokaż tłumaczenie');

    append(body,
      h('div', { class: 'question-label' }, 'Wybierz słowo pasujące do luki'),
      h('div', { class: 'prompt column' }, line, s.meaning && hint),
      choiceButtons(ui, q.options.map(o => h('span', { class: m.script || '' }, o)), q.options.indexOf(q.answer), correct => {
        blank.textContent = q.answer;
        blank.classList.add(correct ? 'ok' : 'bad');
        ui.answer(correct, { reveal: sentenceBlock(m, s, { highlight: true }) });
        if (ui.settings.autoSpeak) speakText(m, s.text);
      }, { cls: m.script ? 'big-option' : '' }),
    );
  },
};
