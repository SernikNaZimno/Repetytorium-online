import { h, append } from '../core/dom.js';
import { distractors, shuffle } from '../core/utils.js';
import { choiceButtons, fieldEl, itemCard, speakText, voiceWarning } from '../ui/components.js';

export default {
  type: 'listening',
  category: 'vocab',
  icon: '🎧',
  title: () => 'Rozpoznaj ze słuchu',
  description: () => 'Posłuchaj wymowy i wybierz właściwe słowo.',
  available: m => !!m.lang && m.items.length >= 4,
  build(m, ctx) {
    // Homofony (np. 进 / 近) nie mogą być dystraktorami – nie da się ich odróżnić ze słuchu.
    const key = i => i.reading || i.term;
    return ctx.pick(ctx.count).map(item => ({
      kind: 'listening', item, itemIds: [item.id], label: item.term,
      options: shuffle([item, ...distractors(m.items, item, 3, key)]),
    }));
  },
  render(q, ui, body) {
    const m = ui.module;
    const { item, options } = q;
    const play = slow => speakText(m, item.term, slow ? { rate: ui.settings.speechRate * 0.6 } : {});
    const showText = h('button', { class: 'btn ghost small', onclick: () => { showText.replaceWith(h('div', { class: 'muted' }, item.reading || item.term)); } }, 'Nie słyszę – pokaż zapis');

    append(body,
      voiceWarning(m),
      h('div', { class: 'question-label' }, 'Co słyszysz?'),
      h('div', { class: 'player' },
        h('button', { class: 'btn play', onclick: () => play(false) }, '▶ Odtwórz'),
        h('button', { class: 'btn ghost', onclick: () => play(true) }, '🐢 Wolniej'),
      ),
      h('div', { class: 'center' }, showText),
      choiceButtons(ui, options.map(o => fieldEl(m, o, 'term')), options.indexOf(item),
        correct => ui.answer(correct, { reveal: itemCard(m, item) }), { cls: m.script ? 'big-option' : '' }),
    );
    ui.onKey(e => {
      if (e.key === ' ') { e.preventDefault(); play(false); }
    });
    setTimeout(() => play(false), 250);
  },
};
