// Router oparty na hashu (#/…) – działa na zwykłym hostingu statycznym, np. GitHub Pages.
import { h, clear } from './core/dom.js';
import { getModule } from './core/registry.js';
import { store } from './core/storage.js';
import { pickItems } from './core/srs.js';
import { resolvePool } from './core/pools.js';
import { exercises, getExercise, exerciseTitle, isAvailable } from './exercises/index.js';
import { renderHome } from './ui/home.js';
import { renderModule } from './ui/moduleView.js';
import { renderWords } from './ui/words.js';
import { renderCreate } from './ui/create.js';
import { renderSettings } from './ui/settings.js';
import { runSession, stopSession } from './ui/session.js';

const app = document.getElementById('app');

function notFound(root) {
  root.append(h('div', { class: 'card center' }, h('p', {}, 'Nie znaleziono strony.'), h('a', { class: 'btn', href: '#/' }, 'Strona główna')));
}

function startExercise(root, m, index, poolKey) {
  const cfg = m.exercises[index];
  const backHref = `#/m/${encodeURIComponent(m.id)}?pool=${poolKey}`;
  if (!cfg || !isAvailable(m, cfg)) return notFound(root);
  const ex = getExercise(cfg.type);

  const start = () => {
    const stats = store.stats(m.id);
    const pool = resolvePool(m, stats, poolKey);
    const ctx = {
      cfg,
      count: cfg.count || store.settings().sessionSize,
      pool: pool.items,
      stats,
      pick: n => pickItems(pool.items, stats, n),
      pickFrom: (list, n) => pickItems(list, stats, n),
    };
    const scope = ex.category === 'vocab' && pool.key !== 'all' ? ` · ${pool.label}` : '';
    runSession(root, {
      module: m,
      title: `${exerciseTitle(m, cfg)}${scope}`,
      questions: ex.build(m, ctx, exercises),
      exercise: cfg.type,
      backHref,
      onRestart: start,
    });
  };
  start();
}

function route() {
  stopSession();
  const [path, queryString = ''] = location.hash.replace(/^#/, '').split('?');
  const query = new URLSearchParams(queryString);
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  const root = clear(app);
  document.body.classList.toggle('in-session', parts[2] === 'play');

  if (parts.length === 0) return renderHome(root);
  if (parts[0] === 'settings') return renderSettings(root);
  if (parts[0] === 'create') return renderCreate(root, parts[1]);
  if (parts[0] === 'm') {
    const m = getModule(parts[1]);
    if (!m) return notFound(root);
    document.title = `${m.title} · Repetytorium`;
    if (parts[2] === 'words') return renderWords(root, m);
    if (parts[2] === 'play') return startExercise(root, m, Number(parts[3]), query.get('pool') || 'all');
    return renderModule(root, m, query);
  }
  notFound(root);
}

window.addEventListener('hashchange', () => { document.title = 'Repetytorium'; route(); });
route();
