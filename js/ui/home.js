import { h, append } from '../core/dom.js';
import { allModules } from '../core/registry.js';
import { store } from '../core/storage.js';
import { summarize } from '../core/srs.js';
import { plural } from '../core/utils.js';
import { progressBar } from './components.js';

export function renderHome(root) {
  const modules = allModules();
  const streak = store.streak();
  const today = store.todayCount();

  append(root,
    h('section', { class: 'hero' },
      h('h1', {}, 'Repetytorium'),
      h('p', { class: 'muted' }, 'Wybierz moduł i ćwicz codziennie. Aplikacja sama podpowie, co warto powtórzyć.'),
      h('div', { class: 'stat-row' },
        h('div', { class: 'stat' }, h('strong', {}, `🔥 ${streak}`), h('span', {}, plural(streak, 'dzień z rzędu', 'dni z rzędu', 'dni z rzędu'))),
        h('div', { class: 'stat' }, h('strong', {}, `✍️ ${today}`), h('span', {}, 'odpowiedzi dzisiaj')),
      ),
    ),
    h('section', { class: 'module-grid' },
      modules.map(m => {
        const sum = summarize(m.items, store.stats(m.id));
        return h('a', { class: 'module-card', href: `#/m/${encodeURIComponent(m.id)}`, style: { '--accent': m.color } },
          h('div', { class: 'module-icon' }, m.icon),
          h('div', { class: 'module-info' },
            h('h2', {}, m.title),
            h('p', { class: 'muted small' }, m.subtitle || `${m.items.length} pozycji`),
            progressBar(sum.mastered, sum.total),
            h('div', { class: 'small muted' },
              `Opanowane ${sum.mastered}/${sum.total}`,
              sum.due > 0 && h('span', { class: 'badge due' }, `${sum.due} do powtórki`),
              m.custom && h('span', { class: 'badge' }, 'własny'),
            ),
          ),
        );
      }),
      h('a', { class: 'module-card add', href: '#/create' },
        h('div', { class: 'module-icon' }, '＋'),
        h('div', { class: 'module-info' },
          h('h2', {}, 'Własny moduł'),
          h('p', { class: 'muted small' }, 'Wklej listę słówek lub pojęć i ćwicz je wszystkimi rodzajami zadań.'),
        ),
      ),
    ),
  );
}
