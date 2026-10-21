import { h, append } from '../core/dom.js';
import { chunk, shuffle } from '../core/utils.js';
import { fieldEl, speakText } from '../ui/components.js';

const PAIRS = 5;

export default {
  type: 'matching',
  category: 'vocab',
  icon: '🧩',
  title: () => 'Dopasuj pary',
  description: () => 'Połącz słowa z ich znaczeniami – po 5 par na planszy.',
  available: m => m.items.length >= 3,
  build(m, ctx) {
    const left = ctx.cfg.left || 'term';
    const right = ctx.cfg.right || 'meaning';
    const count = Math.max(PAIRS, Math.round(ctx.count / PAIRS) * PAIRS);
    return chunk(ctx.pick(count), PAIRS)
      .filter(items => items.length >= 3)
      .map(items => ({ kind: 'matching', items, left, right, itemIds: items.map(i => i.id), label: items.map(i => i.term).join(' · ') }));
  },
  render(q, ui, body) {
    const m = ui.module;
    const errors = new Set();
    let mistakes = 0;
    let matched = 0;
    let selected = null;

    const makeTile = (item, side) => {
      const field = side === 'L' ? q.left : q.right;
      const tile = h('button', { class: 'tile', type: 'button', onclick: () => choose(tile, item, side) }, fieldEl(m, item, field));
      return tile;
    };
    const leftCol = h('div', { class: 'match-col' }, shuffle(q.items).map(i => makeTile(i, 'L')));
    const rightCol = h('div', { class: 'match-col' }, shuffle(q.items).map(i => makeTile(i, 'R')));

    function choose(tile, item, side) {
      if (tile.disabled) return;
      if (side === 'L' && q.left === 'term') speakText(m, item.term);
      if (!selected || selected.side === side) {
        selected?.tile.classList.remove('selected');
        selected = { tile, item, side };
        tile.classList.add('selected');
        return;
      }
      const other = selected;
      selected = null;
      other.tile.classList.remove('selected');
      if (other.item === item) {
        for (const t of [tile, other.tile]) { t.classList.add('matched'); t.disabled = true; }
        matched += 1;
        if (matched === q.items.length) done();
      } else {
        mistakes += 1;
        errors.add(item.id);
        errors.add(other.item.id);
        for (const t of [tile, other.tile]) {
          t.classList.add('shake');
          setTimeout(() => t.classList.remove('shake'), 450);
        }
      }
    }

    function done() {
      ui.answer(mistakes === 0, {
        results: q.items.map(i => ({ id: i.id, correct: !errors.has(i.id) })),
        note: mistakes === 0 ? 'Bez pomyłek!' : `Pomyłki: ${mistakes}`,
        reveal: h('div', { class: 'pair-list' }, q.items.map(i => h('div', { class: errors.has(i.id) ? 'pair bad' : 'pair' },
          fieldEl(m, i, 'term'), i.reading && h('span', { class: 'field-reading' }, i.reading), h('span', {}, '—'), h('span', {}, i.meaning)))),
      });
    }

    append(body,
      h('div', { class: 'question-label' }, 'Kliknij element z lewej i pasujący z prawej'),
      h('div', { class: 'match-board' }, leftCol, rightCol),
    );
  },
};
