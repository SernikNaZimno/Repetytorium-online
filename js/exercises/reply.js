import { h, append } from '../core/dom.js';
import { distractors, sample, shuffle } from '../core/utils.js';
import { choiceButtons, speakButton } from '../ui/components.js';

// Dopasuj odpowiedź do pytania (część czytania HSK 2).
export default {
  type: 'reply',
  category: 'exam',
  icon: '💬',
  title: () => 'Dopasuj odpowiedź',
  description: () => 'Wybierz zdanie, które najlepiej odpowiada na pytanie lub wypowiedź.',
  available: m => (m.exam.replies || []).length >= 5,
  build(m, ctx) {
    const all = m.exam.replies;
    return sample(all, ctx.count).map(pair => {
      const options = shuffle([pair, ...distractors(all, pair, 4, p => p[1])]);
      return { kind: 'reply', pair, options, itemIds: [], label: `${pair[0]} → ${pair[1]}` };
    });
  },
  render(q, ui, body) {
    const m = ui.module;
    const zh = m.script || '';
    const [question, answer, questionMeaning, answerMeaning] = q.pair;
    append(body,
      h('div', { class: 'question-label' }, 'Która odpowiedź pasuje?'),
      h('div', { class: 'prompt' }, h('div', { class: `reading-text ${zh}`, lang: m.lang || null }, question), speakButton(m, question)),
      choiceButtons(ui, q.options.map(p => h('span', { class: zh, lang: m.lang || null }, p[1])), q.options.indexOf(q.pair), correct => {
        ui.answer(correct, {
          reveal: h('div', { class: 'translation' },
            h('div', {}, h('span', { class: zh }, question), ' — ', questionMeaning),
            h('div', {}, h('span', { class: zh }, answer), ' — ', answerMeaning),
          ),
        });
      }, { layout: 'list' }),
    );
  },
};
