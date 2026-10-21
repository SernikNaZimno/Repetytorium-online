import { h, append } from '../core/dom.js';
import { distractors, shuffle } from '../core/utils.js';
import { choiceButtons, fieldEl, itemCard, speakButton, speakText } from '../ui/components.js';

export default {
  type: 'choice',
  category: 'vocab',
  icon: '🔘',
  title: (cfg, m) => `${m.labels[cfg.from]} → ${m.labels[cfg.to]}`.toLowerCase().replace(/^./, c => c.toUpperCase()),
  description: () => 'Wybierz poprawną odpowiedź spośród czterech.',
  available: (m, cfg) => m.items.filter(i => i[cfg.from] && i[cfg.to]).length >= 4,
  build(m, ctx) {
    const { from, to } = ctx.cfg;
    const usable = m.items.filter(i => i[from] && i[to]);
    return ctx.pick(ctx.count).filter(i => i[from] && i[to]).map(item => {
      const options = shuffle([item, ...distractors(usable, item, 3, i => i[to])]);
      return { kind: 'choice', item, from, to, options, itemIds: [item.id], label: item.term };
    });
  },
  render(q, ui, body) {
    const m = ui.module;
    const { item, from, to, options } = q;
    const prompt = h('div', { class: 'prompt' },
      fieldEl(m, item, from, from === 'term' ? 'huge' : 'large'),
      from === 'term' && speakButton(m, item.term),
    );
    const labels = options.map(o => fieldEl(m, o, to));
    const grid = choiceButtons(ui, labels, options.indexOf(item), correct => {
      ui.answer(correct, { reveal: itemCard(m, item) });
    }, { cls: to === 'term' && m.script ? 'big-option' : '' });
    append(body, h('div', { class: 'question-label' }, `Wybierz: ${m.labels[to].toLowerCase()}`), prompt, grid);
    if (from === 'term' && ui.settings.autoSpeak) speakText(m, item.term);
  },
};
