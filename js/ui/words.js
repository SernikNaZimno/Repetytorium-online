import { h, clear, append } from '../core/dom.js';
import { store } from '../core/storage.js';
import { status } from '../core/srs.js';
import { normalizeText } from '../core/utils.js';
import { analyzePinyin } from '../core/pinyin.js';
import { fieldEl, sentenceBlock, speakButton } from './components.js';

const STATUS_LABEL = { new: 'nowe', learning: 'w nauce', mastered: 'opanowane' };

export function renderWords(root, m) {
  const stats = store.stats(m.id);
  const search = h('input', { class: 'search', type: 'search', placeholder: 'Szukaj (znak, wymowa lub znaczenie)…' });
  const filter = h('select', { class: 'select' },
    h('option', { value: '' }, 'Wszystkie'),
    Object.entries(STATUS_LABEL).map(([k, v]) => h('option', { value: k }, v)),
  );
  const list = h('div', { class: 'word-list' });

  const rows = m.items.map((item, i) => {
    const s = stats[item.id];
    const st = status(s);
    const sentences = m.sentencesByItem.get(item.id) || [];
    const details = h('div', { class: 'word-details hidden' }, sentences.map(sn => sentenceBlock(m, sn, { highlight: true })));
    const row = h('div', { class: 'word-row' },
      h('div', { class: 'word-main', onclick: () => sentences.length && details.classList.toggle('hidden') },
        h('span', { class: 'word-num muted' }, i + 1),
        h('span', { class: 'word-term' }, fieldEl(m, item, 'term'), speakButton(m, item.term, { cls: 'small' })),
        h('span', { class: 'word-reading field-reading' }, item.reading),
        h('span', { class: 'word-meaning' }, item.meaning),
        h('span', { class: `badge status ${st}`, title: s ? `poprawne: ${s.ok}, błędne: ${s.bad}` : 'jeszcze nie ćwiczone' }, STATUS_LABEL[st]),
      ),
      details,
    );
    const haystack = [normalizeText(item.term), normalizeText(item.meaning), normalizeText(item.reading), analyzePinyin(item.reading).base].join(' ');
    return { row, haystack, raw: item.term, st };
  });

  function update() {
    const q = normalizeText(search.value);
    const qRaw = search.value.trim();
    const shown = rows.filter(r => (!filter.value || r.st === filter.value) && (!q || r.haystack.includes(q) || (qRaw && r.raw.includes(qRaw))));
    clear(list).append(...shown.map(r => r.row));
    if (!shown.length) list.append(h('p', { class: 'muted center' }, 'Nic nie znaleziono.'));
  }
  search.addEventListener('input', update);
  filter.addEventListener('change', update);

  append(root,
    h('a', { class: 'back', href: `#/m/${encodeURIComponent(m.id)}` }, `← ${m.title}`),
    h('h1', {}, `Lista: ${m.title}`),
    h('div', { class: 'row wrap' }, search, filter),
    m.sentences.length > 0 && h('p', { class: 'muted small' }, 'Kliknij wiersz, aby zobaczyć zdanie przykładowe.'),
    list,
  );
  update();
}
