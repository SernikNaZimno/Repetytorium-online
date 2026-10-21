// Wspólny „odtwarzacz” sesji: pasek postępu, informacja zwrotna, przejście dalej i podsumowanie.
import { h, append, clear } from '../core/dom.js';
import { store } from '../core/storage.js';
import * as tts from '../core/tts.js';
import { plural } from '../core/utils.js';
import { exercises, getExercise } from '../exercises/index.js';
import { progressBar } from './components.js';

let activeCleanup = null;

export function stopSession() {
  activeCleanup?.();
  activeCleanup = null;
}

export function runSession(root, { module: m, title, questions, exercise, backHref, onRestart }) {
  stopSession();
  let index = 0;
  let answered = false;
  let keyHandlers = [];
  const results = [];
  const startedAt = Date.now();
  const settings = store.settings();

  const counter = h('span', { class: 'counter' });
  const scoreEl = h('span', { class: 'score' });
  const barFill = h('div', { class: 'bar-fill' });
  const body = h('div', { class: 'q-body' });
  const feedback = h('div', { class: 'feedback' });
  const nextBtn = h('button', { class: 'btn primary', onclick: next }, 'Dalej →');
  const footer = h('div', { class: 'q-footer hidden' }, feedback, h('div', { class: 'row end' }, nextBtn));

  clear(root).append(h('section', { class: 'session' },
    h('div', { class: 'session-head' },
      h('a', { class: 'btn ghost small', href: backHref }, '✕ Zakończ'),
      h('div', { class: 'session-title' }, title),
      h('div', { class: 'session-meta' }, scoreEl, counter),
    ),
    h('div', { class: 'bar' }, barFill),
    h('div', { class: 'card q-card' }, body, footer),
  ));

  const ui = {
    module: m,
    settings,
    onKey(fn) { keyHandlers.push(fn); },
    answer(correct, { results: itemResults, reveal, note } = {}) {
      if (answered) return;
      answered = true;
      const q = questions[index];
      for (const r of itemResults || (q.itemIds || []).map(id => ({ id, correct }))) {
        store.record(m.id, r.id, r.correct ? 1 : 0);
      }
      store.bumpActivity();
      results.push({ q, correct });
      updateMeta();
      append(clear(feedback),
        h('div', { class: `verdict ${correct ? 'ok' : 'bad'}` }, correct ? '✓ Dobrze!' : '✗ Niestety, źle'),
        note && h('div', { class: 'muted' }, note),
        reveal,
      );
      footer.classList.remove('hidden');
      footer.classList.toggle('ok', correct);
      footer.classList.toggle('bad', !correct);
      nextBtn.focus({ preventScroll: true });
      footer.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    },
    grade(itemId, grade) {
      if (answered) return;
      answered = true;
      store.record(m.id, itemId, grade);
      store.bumpActivity();
      results.push({ q: questions[index], correct: grade > 0 });
      next();
    },
  };

  function onKeyDown(e) {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    if (answered) {
      if (e.key === 'Enter') { e.preventDefault(); next(); }
      return;
    }
    if (e.target instanceof HTMLElement && e.target.matches('input, textarea')) return;
    for (const fn of keyHandlers) {
      fn(e);
      if (e.defaultPrevented) break;
    }
  }
  document.addEventListener('keydown', onKeyDown);

  function updateMeta() {
    const ok = results.filter(r => r.correct).length;
    counter.textContent = `${Math.min(index + 1, questions.length)} / ${questions.length}`;
    scoreEl.textContent = results.length ? `✓ ${ok}  ✗ ${results.length - ok}` : '';
    barFill.style.width = `${Math.round((results.length / questions.length) * 100)}%`;
  }

  function show() {
    answered = false;
    keyHandlers = [];
    tts.stop();
    clear(body);
    clear(feedback);
    footer.classList.add('hidden');
    updateMeta();
    const q = questions[index];
    getExercise(q.kind).render(q, ui, body);
    window.scrollTo({ top: 0 });
  }

  function next() {
    index += 1;
    if (index >= questions.length) finish();
    else show();
  }

  function finish() {
    tts.stop();
    keyHandlers = [];
    answered = false;
    document.removeEventListener('keydown', onKeyDown);
    const ok = results.filter(r => r.correct).length;
    const pct = results.length ? Math.round((ok / results.length) * 100) : 0;
    const wrong = results.filter(r => !r.correct);
    const minutes = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
    const threshold = exercises[exercise]?.passThreshold;

    const sections = new Map();
    for (const r of results) {
      if (!r.q.section) continue;
      const s = sections.get(r.q.section) || { ok: 0, total: 0 };
      s.total += 1;
      if (r.correct) s.ok += 1;
      sections.set(r.q.section, s);
    }

    clear(root).append(h('section', { class: 'session summary' },
      h('div', { class: 'card center' },
        h('div', { class: 'summary-emoji' }, pct >= 90 ? '🏆' : pct >= 60 ? '👏' : '💪'),
        h('h2', {}, threshold != null ? (pct >= threshold * 100 ? 'Zdane!' : 'Jeszcze nie tym razem') : 'Koniec sesji'),
        h('div', { class: 'summary-score' }, `${pct}%`),
        h('div', { class: 'muted' }, `${ok} z ${results.length} poprawnie · ok. ${minutes} ${plural(minutes, 'minuta', 'minuty', 'minut')}`),
        threshold != null && h('div', { class: 'muted small' }, `Próg zaliczenia: ${Math.round(threshold * 100)}%`),
        progressBar(ok, results.length, 'summary-bar'),
        sections.size > 0 && h('table', { class: 'table compact' },
          h('tbody', {}, [...sections].map(([name, s]) => h('tr', {},
            h('td', {}, name), h('td', { class: 'num' }, `${s.ok} / ${s.total}`),
            h('td', { class: 'num' }, `${Math.round((s.ok / s.total) * 100)}%`))))),
        h('div', { class: 'row center wrap' },
          wrong.length > 0 && h('button', {
            class: 'btn primary',
            onclick: () => runSession(root, { module: m, title: `${title} – poprawa błędów`, questions: wrong.map(r => r.q), exercise: null, backHref, onRestart }),
          }, `Powtórz błędne (${wrong.length})`),
          h('button', { class: wrong.length ? 'btn' : 'btn primary', onclick: onRestart }, 'Nowa sesja'),
          h('a', { class: 'btn ghost', href: backHref }, 'Wróć do modułu'),
        ),
      ),
      wrong.length > 0 && h('div', { class: 'card' },
        h('h3', {}, 'Do poprawy'),
        h('ul', { class: 'mistakes' }, wrong.map(r => h('li', { class: m.script || '' }, r.q.label))),
      ),
    ));
  }

  activeCleanup = () => {
    tts.stop();
    document.removeEventListener('keydown', onKeyDown);
  };

  if (!questions.length) {
    clear(root).append(h('div', { class: 'card center' },
      h('p', {}, 'Brak materiału do tego ćwiczenia w wybranym zakresie.'),
      h('a', { class: 'btn', href: backHref }, 'Wróć'),
    ));
    return;
  }
  show();
}
