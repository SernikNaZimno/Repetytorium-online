import { h, append } from '../core/dom.js';
import { sample } from '../core/utils.js';
import { choiceButtons, speakButton } from '../ui/components.js';

// 判断对错 – przeczytaj tekst i zdecyduj, czy zdanie ze ★ jest zgodne z tekstem.
export default {
  type: 'judge',
  category: 'exam',
  icon: '⚖️',
  title: () => 'Prawda czy fałsz',
  description: () => 'Przeczytaj tekst i oceń, czy zdanie oznaczone ★ jest zgodne z jego treścią (判断对错).',
  available: m => (m.exam.judge || []).length > 0,
  build(m, ctx) {
    return sample(m.exam.judge, ctx.count).map(([text, statement, answer, meaning, statementMeaning]) => ({
      kind: 'judge', text, statement, answer, meaning, statementMeaning, itemIds: [], label: `${text} ★ ${statement}`,
    }));
  },
  render(q, ui, body) {
    const m = ui.module;
    const zh = m.script || '';
    append(body,
      h('div', { class: 'question-label' }, 'Czy zdanie ze ★ jest zgodne z tekstem?'),
      h('div', { class: 'prompt column' },
        h('div', { class: 'sentence-line' }, h('div', { class: `reading-text ${zh}`, lang: m.lang || null }, q.text), speakButton(m, q.text)),
        h('div', { class: `statement ${zh}`, lang: m.lang || null }, `★ ${q.statement}`),
      ),
      choiceButtons(ui, ['✓ 对 · prawda', '✗ 错 · fałsz'], q.answer ? 0 : 1, correct => {
        ui.answer(correct, {
          reveal: h('div', { class: 'translation' },
            h('div', {}, q.meaning),
            h('div', {}, `★ ${q.statementMeaning} — `, h('strong', {}, q.answer ? 'prawda' : 'fałsz')),
          ),
        });
      }, { layout: 'two' }),
    );
  },
};
