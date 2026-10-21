// Cały stan aplikacji trzymany w localStorage przeglądarki.
import { review } from './srs.js';
import { todayKey } from './utils.js';

const KEY = 'repetytorium.v1';

const DEFAULT_SETTINGS = {
  sessionSize: 15,
  speechRate: 0.85,
  autoSpeak: true,
  ignoreTones: false,
  showReading: true,
};

function fresh() {
  return { progress: {}, settings: { ...DEFAULT_SETTINGS }, custom: [], activity: {} };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const data = JSON.parse(raw);
    return { ...fresh(), ...data, settings: { ...DEFAULT_SETTINGS, ...(data.settings || {}) } };
  } catch (e) {
    console.warn('Nie udało się wczytać postępów', e);
    return fresh();
  }
}

let state = load();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Nie udało się zapisać postępów', e);
  }
}

export const store = {
  settings: () => state.settings,
  setSetting(key, value) {
    state.settings[key] = value;
    save();
  },

  stats(moduleId) {
    return (state.progress[moduleId] ||= {});
  },
  record(moduleId, itemId, grade) {
    const stats = this.stats(moduleId);
    stats[itemId] = review(stats[itemId], grade);
    save();
  },
  resetModule(moduleId) {
    delete state.progress[moduleId];
    save();
  },

  customModules: () => state.custom,
  saveCustomModule(def) {
    const i = state.custom.findIndex(m => m.id === def.id);
    if (i >= 0) state.custom[i] = def;
    else state.custom.push(def);
    save();
  },
  deleteCustomModule(id) {
    state.custom = state.custom.filter(m => m.id !== id);
    delete state.progress[id];
    save();
  },

  bumpActivity() {
    const k = todayKey();
    state.activity[k] = (state.activity[k] || 0) + 1;
    save();
  },
  todayCount: () => state.activity[todayKey()] || 0,
  streak() {
    let days = 0;
    const d = new Date();
    if (!state.activity[todayKey(d)]) d.setDate(d.getDate() - 1); // seria trwa, dopóki nie minie dzisiejszy dzień
    while (state.activity[todayKey(d)]) {
      days += 1;
      d.setDate(d.getDate() - 1);
    }
    return days;
  },

  exportJSON: () => JSON.stringify(state, null, 2),
  importJSON(text) {
    const data = JSON.parse(text);
    if (!data || typeof data !== 'object' || !data.progress) throw new Error('To nie jest plik z postępami Repetytorium.');
    state = { ...fresh(), ...data, settings: { ...DEFAULT_SETTINGS, ...(data.settings || {}) } };
    save();
  },
  resetAll() {
    state = fresh();
    save();
  },
};
