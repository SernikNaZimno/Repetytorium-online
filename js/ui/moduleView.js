import { h, append, download } from '../core/dom.js';
import { store } from '../core/storage.js';
import { summarize } from '../core/srs.js';
import { listPools } from '../core/pools.js';
import { exercises, isAvailable, exerciseTitle, exerciseDescription } from '../exercises/index.js';

const CATEGORIES = [
  { key: 'vocab', title: 'Słownictwo', hint: 'Ćwiczenia korzystają z wybranego zakresu i systemu powtórek.' },
  { key: 'exam', title: 'Zdania i zadania egzaminacyjne', hint: '' },
];

export function renderModule(root, m, query) {
  const stats = store.stats(m.id);
  const sum = summarize(m.items, stats);
  const pools = listPools(m, stats);
  const poolKey = pools.some(p => p.key === query.get('pool') && p.items.length) ? query.get('pool') : 'all';
  const base = `#/m/${encodeURIComponent(m.id)}`;
  const playHref = (cfg, pool = poolKey) => `${base}/play/${cfg.index}?pool=${pool}`;

  const available = m.exercises.filter(cfg => isAvailable(m, cfg));
  const first = available[0];
  const pct = n => `${(n / Math.max(1, sum.total)) * 100}%`;

  append(root,
    h('a', { class: 'back', href: '#/' }, '← Wszystkie moduły'),
    h('section', { class: 'card module-head', style: { '--accent': m.color } },
      h('div', { class: 'module-icon big' }, m.icon),
      h('div', { class: 'grow' },
        h('h1', {}, m.title),
        m.description && h('p', { class: 'muted' }, m.description),
        h('div', { class: 'stack-bar', title: 'opanowane / w nauce / nowe' },
          h('div', { class: 'seg mastered', style: { width: pct(sum.mastered) } }),
          h('div', { class: 'seg learning', style: { width: pct(sum.learning) } }),
        ),
        h('div', { class: 'legend small' },
          h('span', {}, h('i', { class: 'dot mastered' }), `opanowane ${sum.mastered}`),
          h('span', {}, h('i', { class: 'dot learning' }), `w nauce ${sum.learning}`),
          h('span', {}, h('i', { class: 'dot new' }), `nowe ${sum.new}`),
          sum.due > 0 && h('span', { class: 'badge due' }, `${sum.due} do powtórki`),
        ),
        h('div', { class: 'row wrap' },
          first && h('a', { class: 'btn primary', href: playHref(first, sum.due ? 'due' : poolKey) }, sum.due ? '▶ Powtórz zaległe' : '▶ Ucz się'),
          h('a', { class: 'btn', href: `${base}/words` }, `📋 Lista (${m.items.length})`),
          m.custom && h('a', { class: 'btn ghost', href: `#/create/${encodeURIComponent(m.id)}` }, '✏️ Edytuj'),
          m.custom && h('button', { class: 'btn ghost', onclick: () => exportModule(m) }, '⬇ Eksportuj'),
        ),
      ),
    ),

    h('section', { class: 'card' },
      h('h3', {}, 'Zakres materiału'),
      h('div', { class: 'chips' }, pools.map(p => {
        const disabled = !p.items.length;
        const cls = `chip ${p.key === poolKey ? 'active' : ''} ${disabled ? 'disabled' : ''}`;
        const content = [p.label, p.hint && h('small', {}, ` ${p.hint}`), h('span', { class: 'chip-count' }, p.items.length)];
        return disabled ? h('span', { class: cls }, content) : h('a', { class: cls, href: `${base}?pool=${p.key}` }, content);
      })),
    ),

    CATEGORIES.map(cat => {
      const list = available.filter(cfg => exercises[cfg.type].category === cat.key);
      if (!list.length) return null;
      return h('section', {},
        h('h2', { class: 'section-title' }, cat.title),
        cat.hint && h('p', { class: 'muted small' }, cat.hint),
        h('div', { class: 'exercise-grid' }, list.map(cfg => h('a', { class: 'exercise-card', href: playHref(cfg) },
          h('div', { class: 'exercise-icon' }, exercises[cfg.type].icon),
          h('div', {},
            h('h3', {}, exerciseTitle(m, cfg)),
            h('p', { class: 'muted small' }, exerciseDescription(m, cfg)),
          ),
        ))),
      );
    }),

    h('section', { class: 'danger-zone' },
      h('button', {
        class: 'btn ghost small',
        onclick: () => {
          if (confirm(`Zresetować postęp w module „${m.title}”?`)) { store.resetModule(m.id); location.reload(); }
        },
      }, '↺ Resetuj postęp modułu'),
      m.custom && h('button', {
        class: 'btn ghost small danger',
        onclick: () => {
          if (confirm(`Usunąć moduł „${m.title}” razem z postępem?`)) { store.deleteCustomModule(m.id); location.hash = '#/'; }
        },
      }, '🗑 Usuń moduł'),
    ),
  );
}

function exportModule(m) {
  const def = store.customModules().find(c => c.id === m.id);
  download(`${m.id}.json`, JSON.stringify(def, null, 2));
}
