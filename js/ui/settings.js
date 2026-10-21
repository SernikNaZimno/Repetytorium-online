import { h, download, append } from '../core/dom.js';
import { store } from '../core/storage.js';
import * as tts from '../core/tts.js';
import { todayKey } from '../core/utils.js';

export function renderSettings(root) {
  const s = store.settings();

  const number = (key, min, max) => h('input', {
    class: 'input short', type: 'number', min, max, value: s[key],
    onchange: e => store.setSetting(key, Math.min(max, Math.max(min, Number(e.target.value) || s[key]))),
  });
  const toggle = (key, label, hint) => h('label', { class: 'check' },
    h('input', { type: 'checkbox', checked: s[key], onchange: e => store.setSetting(key, e.target.checked) }),
    h('span', {}, label, hint && h('div', { class: 'muted small' }, hint)),
  );
  const rateLabel = h('span', { class: 'muted' }, `${s.speechRate.toFixed(2)}×`);
  const rate = h('input', {
    type: 'range', min: 0.5, max: 1.3, step: 0.05, value: s.speechRate,
    oninput: e => { store.setSetting('speechRate', Number(e.target.value)); rateLabel.textContent = `${Number(e.target.value).toFixed(2)}×`; },
  });

  const zhVoice = tts.findVoice('zh-CN');
  const voiceInfo = !tts.ttsSupported()
    ? 'Przeglądarka nie obsługuje syntezy mowy.'
    : zhVoice ? `Głos chiński: ${zhVoice.name}` : 'Nie wykryto chińskiego głosu (lista głosów mogła się jeszcze nie wczytać).';

  const fileInput = h('input', {
    type: 'file', accept: '.json,application/json', class: 'hidden',
    onchange: async () => {
      const file = fileInput.files[0];
      if (!file) return;
      try {
        store.importJSON(await file.text());
        alert('Postępy zostały wczytane.');
        location.reload();
      } catch (e) {
        alert(`Nie udało się wczytać pliku: ${e.message}`);
      }
    },
  });

  append(root,
    h('a', { class: 'back', href: '#/' }, '← Wróć'),
    h('h1', {}, 'Ustawienia'),
    h('section', { class: 'card form' },
      h('h3', {}, 'Sesje'),
      h('label', { class: 'inline' }, 'Liczba pytań w sesji', number('sessionSize', 5, 60)),
      toggle('ignoreTones', 'Ignoruj tony przy wpisywaniu pinyinu', 'Np. „nihao” zostanie uznane za poprawne dla „nǐhǎo”.'),
    ),
    h('section', { class: 'card form' },
      h('h3', {}, 'Wymowa'),
      toggle('autoSpeak', 'Automatycznie odtwarzaj wymowę'),
      h('label', { class: 'inline' }, 'Tempo mowy', rate, rateLabel),
      h('div', { class: 'row wrap' },
        h('button', { class: 'btn', onclick: () => tts.speak('你好，欢迎学习汉语！', { lang: 'zh-CN', rate: store.settings().speechRate }) }, '🔊 Test: chiński'),
        h('button', { class: 'btn', onclick: () => tts.speak('Dzień dobry!', { lang: 'pl-PL', rate: store.settings().speechRate }) }, '🔊 Test: polski'),
      ),
      h('div', { class: 'muted small' }, voiceInfo),
    ),
    h('section', { class: 'card form' },
      h('h3', {}, 'Dane'),
      h('p', { class: 'muted small' }, 'Postępy są zapisywane tylko w tej przeglądarce. Zrób kopię, aby przenieść je na inne urządzenie.'),
      h('div', { class: 'row wrap' },
        h('button', { class: 'btn', onclick: () => download(`repetytorium-${todayKey()}.json`, store.exportJSON()) }, '⬇ Eksportuj postępy'),
        h('button', { class: 'btn', onclick: () => fileInput.click() }, '⬆ Importuj postępy'),
        h('button', {
          class: 'btn ghost danger',
          onclick: () => { if (confirm('Usunąć wszystkie postępy, ustawienia i własne moduły?')) { store.resetAll(); location.hash = '#/'; location.reload(); } },
        }, '🗑 Wyczyść wszystko'),
      ),
      fileInput,
    ),
  );
}
