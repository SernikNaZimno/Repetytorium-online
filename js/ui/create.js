import { h, append } from '../core/dom.js';
import { store } from '../core/storage.js';

const LANGS = [
  ['', 'brak (bez wymowy)'],
  ['en-US', 'angielski'],
  ['de-DE', 'niemiecki'],
  ['es-ES', 'hiszpański'],
  ['fr-FR', 'francuski'],
  ['it-IT', 'włoski'],
  ['ru-RU', 'rosyjski'],
  ['uk-UA', 'ukraiński'],
  ['zh-CN', 'chiński'],
  ['ja-JP', 'japoński'],
  ['ko-KR', 'koreański'],
  ['pl-PL', 'polski'],
];

const EXAMPLE = `apple ; ˈæpəl ; jabłko
house ; haʊs ; dom
to borrow ; ˈbɒrəʊ ; pożyczać (od kogoś)
weather ; ˈweðə ; pogoda`;

export function parseItems(text) {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => line.split(line.includes('\t') ? '\t' : /\s*[;|]\s*/).map(p => p.trim()))
    .filter(parts => parts.length >= 2 && parts[0])
    .map(parts => (parts.length >= 3 ? [parts[0], parts[1], parts.slice(2).join('; ')] : [parts[0], parts[1]]));
}

function itemsToText(items) {
  return items.map(it => (Array.isArray(it) ? it : [it.term, it.reading, it.meaning].filter(x => x != null)).join(' ; ')).join('\n');
}

export function renderCreate(root, existingId) {
  const existing = existingId ? store.customModules().find(m => m.id === existingId) : null;
  const val = (k, d = '') => existing?.[k] ?? d;

  const title = h('input', { class: 'input', required: true, value: val('title'), placeholder: 'np. Angielski – rozdział 3' });
  const description = h('input', { class: 'input', value: val('description'), placeholder: 'krótki opis (opcjonalnie)' });
  const icon = h('input', { class: 'input short', value: val('icon', '📗'), maxlength: 4 });
  const lang = h('select', { class: 'select' }, LANGS.map(([code, name]) => h('option', { value: code, selected: code === val('lang') }, name)));
  const termLabel = h('input', { class: 'input', value: existing?.labels?.term ?? 'Słowo' });
  const readingLabel = h('input', { class: 'input', value: existing?.labels?.reading ?? 'Wymowa' });
  const meaningLabel = h('input', { class: 'input', value: existing?.labels?.meaning ?? 'Znaczenie' });
  const pinyin = h('input', { type: 'checkbox', checked: val('readingType') === 'pinyin' });
  const items = h('textarea', { class: 'textarea', rows: 14, placeholder: EXAMPLE, spellcheck: 'false' }, existing ? itemsToText(existing.items) : '');
  const info = h('div', { class: 'muted small' });
  const error = h('div', { class: 'error' });

  const refreshInfo = () => {
    const parsed = parseItems(items.value);
    info.textContent = `Rozpoznano pozycji: ${parsed.length}` + (parsed.length && parsed.length < 4 ? ' (potrzeba co najmniej 4)' : '');
  };
  items.addEventListener('input', refreshInfo);
  refreshInfo();

  function save(e) {
    e.preventDefault();
    const parsed = parseItems(items.value);
    if (!title.value.trim()) { error.textContent = 'Podaj nazwę modułu.'; return; }
    if (parsed.length < 4) { error.textContent = 'Dodaj co najmniej 4 pozycje (jedna na linię).'; return; }
    const id = existing?.id || `custom-${Date.now().toString(36)}`;
    const isZh = lang.value.startsWith('zh');
    store.saveCustomModule({
      ...(existing || {}),
      id,
      title: title.value.trim(),
      description: description.value.trim(),
      subtitle: `${parsed.length} pozycji · moduł własny`,
      icon: icon.value.trim() || '📗',
      color: existing?.color || '#6b5bd6',
      lang: lang.value,
      script: isZh ? 'zh' : '',
      readingType: pinyin.checked ? 'pinyin' : '',
      labels: { term: termLabel.value.trim() || 'Słowo', reading: readingLabel.value.trim() || 'Wymowa', meaning: meaningLabel.value.trim() || 'Znaczenie' },
      items: parsed,
    });
    location.hash = `#/m/${encodeURIComponent(id)}`;
  }

  const fileInput = h('input', {
    type: 'file', accept: '.json,application/json', class: 'hidden',
    onchange: async () => {
      const file = fileInput.files[0];
      if (!file) return;
      try {
        const def = JSON.parse(await file.text());
        if (!def.title || !Array.isArray(def.items) || def.items.length < 4) throw new Error('Plik musi zawierać pola „title” i „items” (co najmniej 4 pozycje).');
        def.id = def.id && String(def.id).startsWith('custom-') ? def.id : `custom-${Date.now().toString(36)}`;
        store.saveCustomModule(def);
        location.hash = `#/m/${encodeURIComponent(def.id)}`;
      } catch (err) {
        error.textContent = `Nie udało się wczytać pliku: ${err.message}`;
      }
    },
  });

  append(root,
    h('a', { class: 'back', href: existing ? `#/m/${encodeURIComponent(existing.id)}` : '#/' }, '← Wróć'),
    h('h1', {}, existing ? 'Edytuj moduł' : 'Nowy moduł'),
    h('form', { class: 'card form', onsubmit: save },
      h('div', { class: 'form-row' }, h('label', {}, 'Nazwa', title), h('label', { class: 'short' }, 'Ikona', icon)),
      h('label', {}, 'Opis', description),
      h('label', {}, 'Język wymowy (synteza mowy)', lang),
      h('div', { class: 'form-row three' },
        h('label', {}, 'Kolumna 1', termLabel),
        h('label', {}, 'Kolumna 2 (opcjonalna)', readingLabel),
        h('label', {}, 'Kolumna 3', meaningLabel),
      ),
      h('label', { class: 'check' }, pinyin, ' Kolumna 2 to pinyin (włącza ćwiczenie „wpisz pinyin” z tonami)'),
      h('label', {}, 'Pozycje – jedna na linię, kolumny oddzielone średnikiem, | lub tabulatorem',
        h('div', { class: 'muted small' }, 'Format: „słowo ; wymowa ; znaczenie” albo „słowo ; znaczenie”. Możesz wkleić dane prosto z arkusza kalkulacyjnego.'),
        items),
      info,
      error,
      h('div', { class: 'row end wrap' },
        !existing && h('button', { class: 'btn ghost', type: 'button', onclick: () => fileInput.click() }, '📂 Importuj plik JSON'),
        h('button', { class: 'btn primary', type: 'submit' }, existing ? 'Zapisz zmiany' : 'Utwórz moduł'),
      ),
      fileInput,
    ),
  );
}
