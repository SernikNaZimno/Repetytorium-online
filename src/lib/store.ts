"use client";

// Cały stan aplikacji (karty FSRS, historia odpowiedzi, ustawienia, moduły własne) – zapisywany w localStorage.
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useSyncExternalStore } from "react";
import type { ModuleDef, Skill } from "./types";
import { cardKey, review, State, type Grade, type StoredCard } from "./srs";

export interface ReviewLog {
  /** czas odpowiedzi */
  t: number;
  /** moduł */
  m: string;
  /** słowo */
  i: string;
  s: Skill;
  /** ocena 1–4 (Again, Hard, Good, Easy) */
  g: Grade;
  /** stan karty przed odpowiedzią (0 = nowa) */
  st: State;
  /** czas namysłu w ms */
  ms?: number;
}

export interface Settings {
  /** docelowe prawdopodobieństwo przypomnienia w chwili powtórki */
  retention: number;
  /** limit nowych słów dziennie (na moduł) */
  newPerDay: number;
  /** liczba zadań w sesji */
  sessionSize: number;
  /** dzienny cel – liczba odpowiedzi */
  dailyGoal: number;
  speechRate: number;
  autoSpeak: boolean;
  ignoreTones: boolean;
  toneColors: boolean;
  showSentencePinyin: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  retention: 0.9,
  newPerDay: 10,
  sessionSize: 20,
  dailyGoal: 60,
  speechRate: 0.85,
  autoSpeak: true,
  ignoreTones: false,
  toneColors: true,
  showSentencePinyin: true,
};

interface ExamStat {
  ok: number;
  bad: number;
  last: number;
}

interface AppState {
  cards: Record<string, Record<string, StoredCard>>;
  logs: ReviewLog[];
  exam: Record<string, Record<string, ExamStat>>;
  settings: Settings;
  custom: ModuleDef[];

  recordReview: (moduleId: string, itemId: string, skill: Skill, grade: Grade, ms?: number) => void;
  recordExam: (moduleId: string, taskId: string, correct: boolean) => void;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  resetModule: (moduleId: string) => void;
  saveCustomModule: (def: ModuleDef) => void;
  deleteCustomModule: (id: string) => void;
  importState: (json: string) => void;
  resetAll: () => void;
}

// ok. 70 B na wpis – 20 tys. wpisów mieści się bezpiecznie w limicie localStorage (~5 MB)
const MAX_LOGS = 20000;

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      cards: {},
      logs: [],
      exam: {},
      settings: DEFAULT_SETTINGS,
      custom: [],

      recordReview(moduleId, itemId, skill, grade, ms) {
        const now = Date.now();
        const { cards, logs, settings } = get();
        const moduleCards = cards[moduleId] || {};
        const key = cardKey(itemId, skill);
        const prev = moduleCards[key];
        const next = review(prev, grade, settings.retention, now);
        const log: ReviewLog = { t: now, m: moduleId, i: itemId, s: skill, g: grade, st: prev?.state ?? State.New, ms };
        set({
          cards: { ...cards, [moduleId]: { ...moduleCards, [key]: next } },
          logs: logs.length >= MAX_LOGS ? [...logs.slice(-MAX_LOGS + 1), log] : [...logs, log],
        });
      },

      recordExam(moduleId, taskId, correct) {
        const { exam } = get();
        const mod = exam[moduleId] || {};
        const prev = mod[taskId] || { ok: 0, bad: 0, last: 0 };
        set({
          exam: { ...exam, [moduleId]: { ...mod, [taskId]: { ok: prev.ok + Number(correct), bad: prev.bad + Number(!correct), last: Date.now() } } },
        });
      },

      setSetting(key, value) {
        set({ settings: { ...get().settings, [key]: value } });
      },

      resetModule(moduleId) {
        const { cards, logs, exam } = get();
        const nextCards = { ...cards };
        delete nextCards[moduleId];
        const nextExam = { ...exam };
        delete nextExam[moduleId];
        set({ cards: nextCards, exam: nextExam, logs: logs.filter(l => l.m !== moduleId) });
      },

      saveCustomModule(def) {
        const custom = get().custom;
        const i = custom.findIndex(m => m.id === def.id);
        set({ custom: i >= 0 ? custom.map(m => (m.id === def.id ? def : m)) : [...custom, def] });
      },

      deleteCustomModule(id) {
        get().resetModule(id);
        set({ custom: get().custom.filter(m => m.id !== id) });
      },

      importState(json) {
        const data = JSON.parse(json);
        const s = data?.state ?? data;
        if (!s || typeof s !== "object" || !("cards" in s)) throw new Error("To nie jest plik z postępami Repetytorium.");
        set({
          cards: s.cards || {},
          logs: s.logs || [],
          exam: s.exam || {},
          custom: s.custom || [],
          settings: { ...DEFAULT_SETTINGS, ...(s.settings || {}) },
        });
      },

      resetAll() {
        set({ cards: {}, logs: [], exam: {}, custom: [], settings: DEFAULT_SETTINGS });
      },
    }),
    {
      name: "repetytorium.v2",
      version: 1,
      partialize: s => ({ cards: s.cards, logs: s.logs, exam: s.exam, settings: s.settings, custom: s.custom }),
      merge: (persisted, current) => {
        const p = (persisted || {}) as Partial<AppState>;
        return { ...current, ...p, settings: { ...DEFAULT_SETTINGS, ...(p.settings || {}) } };
      },
    },
  ),
);

/** Strony są generowane statycznie – stan z localStorage jest dostępny dopiero po stronie przeglądarki. */
export function useHydrated() {
  return useSyncExternalStore(
    cb => useStore.persist.onFinishHydration(cb),
    () => useStore.persist.hasHydrated(),
    () => false,
  );
}

export function exportState(): string {
  const { cards, logs, exam, settings, custom } = useStore.getState();
  return JSON.stringify({ app: "repetytorium", version: 2, state: { cards, logs, exam, settings, custom } });
}
