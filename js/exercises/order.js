import { h, append } from '../core/dom.js';
import { sample, shuffle } from '../core/utils.js';
import { sentenceBlock, speakText } from '../ui/components.js';

export default {
  type: 'order',
  category: 'exam',
  icon: '🔀',
  title: () => 'Ułóż zdanie',
  description: () => 'Ułóż rozsypane słowa w poprawne zdanie. Podpowiedzią jest tłumaczenie.',
  available: m => m.sentences.some(s => s.chunks.length >= 3),
  build(m, ctx) {
    const ok = id => (m.sentencesByItem.get(id) || []).some(s => s.chunks.length >= 3);
    let pool = ctx.pool.filter(i => ok(i.id));
    if (pool.length < 4) pool = m.items.filter(i => ok(i.id));
    return ctx.pickFrom(pool, ctx.count).map(item => {
      const sentence = sample(m.sentencesByItem.get(item.id).filter(s => s.chunks.length >= 3), 1)[0];
      let chunks = shuffle(sentence.chunks);
      for (let t = 0; t < 5 && chunks.join('|') === sentence.chunks.join('|'); t++) chunks = shuffle(sentence.chunks);
      return { kind: 'order', sentence, chunks, itemIds: [item.id], label: sentence.text };
    });
  },
  render(q, ui, body) {
    const m = ui.module;
    const s = q.sentence;
    const sep = m.wordSeparator;
    const placed = [];
    let finished = false;

    const answerZone = h('div', { class: `order-answer ${m.script || ''}` });
    const bank = h('div', { class: `order-bank ${m.script || ''}` });
    const checkBtn = h('button', { class: 'btn primary', disabled: true, onclick: check }, 'Sprawdź');

    const chips = q.chunks.map(text => {
      const chip = h('button', { class: 'chip', type: 'button', onclick: () => toggle(chip) }, text);
      chip.dataset.text = text;
      return chip;
    });
    bank.append(...chips);

    function toggle(chip) {
      if (finished) return;
      const i = placed.indexOf(chip);
      if (i >= 0) { placed.splice(i, 1); bank.append(chip); }
      else { placed.push(chip); answerZone.append(chip); }
      checkBtn.disabled = placed.length !== chips.length;
    }

    function check() {
      if (finished || placed.length !== chips.length) return;
      finished = true;
      checkBtn.disabled = true;
      const given = placed.map(c => c.dataset.text);
      const correct = given.join(sep) === s.chunks.join(sep);
      answerZone.classList.add(correct ? 'ok' : 'bad');
      ui.answer(correct, {
        note: correct ? null : `Twoja wersja: ${given.join(sep)}`,
        reveal: sentenceBlock(m, s, { highlight: true }),
      });
      if (ui.settings.autoSpeak) speakText(m, s.text);
    }

    ui.onKey(e => {
      if (e.key === 'Enter') { e.preventDefault(); check(); }
      else if (e.key === 'Backspace' && placed.length) { e.preventDefault(); toggle(placed[placed.length - 1]); }
    });

    append(body,
      h('div', { class: 'question-label' }, 'Ułóż zdanie z rozsypanych słów'),
      s.meaning && h('div', { class: 'prompt-meaning' }, `„${s.meaning}”`),
      answerZone,
      bank,
      h('div', { class: 'row end' }, checkBtn),
    );
  },
};
