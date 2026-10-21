import { h, append } from '../core/dom.js';
import { fieldEl, itemCard, speakButton, speakText } from '../ui/components.js';

export default {
  type: 'flashcards',
  category: 'vocab',
  icon: '🃏',
  title: () => 'Fiszki',
  description: cfg => cfg.front === 'meaning'
    ? 'Widzisz znaczenie – przypomnij sobie słowo, odkryj kartę i oceń się.'
    : 'Przypomnij sobie znaczenie, odkryj kartę i oceń, czy pamiętałeś.',
  available: m => m.items.length > 0,
  build(m, ctx) {
    const front = ctx.cfg.front || 'term';
    return ctx.pick(ctx.count).map(item => ({ kind: 'flashcards', item, front, itemIds: [item.id], label: item.term }));
  },
  render(q, ui, body) {
    const m = ui.module;
    const { item, front } = q;
    let flipped = false;

    const back = h('div', { class: 'flashcard-back hidden' }, itemCard(m, item));
    const hint = h('div', { class: 'muted small' }, 'Kliknij kartę lub naciśnij spację, aby ją odwrócić');
    const card = h('div', { class: 'flashcard', tabindex: 0, onclick: flip },
      h('div', { class: 'flashcard-front' },
        fieldEl(m, item, front, front === 'term' ? 'huge' : 'large'),
        front === 'term' && speakButton(m, item.term),
      ),
      hint,
      back,
    );

    const grades = h('div', { class: 'grade-row hidden' },
      h('button', { class: 'btn bad', onclick: () => ui.grade(item.id, 0) }, '1 · Nie pamiętam'),
      h('button', { class: 'btn ok', onclick: () => ui.grade(item.id, 1) }, '2 · Pamiętam'),
      h('button', { class: 'btn easy', onclick: () => ui.grade(item.id, 2) }, '3 · Łatwe'),
    );

    function flip() {
      if (flipped) return;
      flipped = true;
      card.classList.add('flipped');
      back.classList.remove('hidden');
      hint.remove();
      grades.classList.remove('hidden');
      if (front !== 'term' && ui.settings.autoSpeak) speakText(m, item.term);
    }

    ui.onKey(e => {
      if (!flipped && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); flip(); }
      else if (flipped && ['1', '2', '3'].includes(e.key)) { e.preventDefault(); ui.grade(item.id, Number(e.key) - 1); }
    });

    append(body, card, grades);
    if (front === 'term' && ui.settings.autoSpeak) speakText(m, item.term);
  },
};
