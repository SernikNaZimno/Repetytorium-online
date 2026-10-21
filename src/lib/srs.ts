// System powtórek oparty na FSRS (Free Spaced Repetition Scheduler, biblioteka ts-fsrs).
// FSRS modeluje dla każdej karty stabilność (ile dni pamięć „wytrzyma”) i trudność,
// a następną powtórkę planuje tak, by w chwili pytania szansa przypomnienia wynosiła np. 90%.
import { createEmptyCard, fsrs, generatorParameters, Rating, State, type Card, type FSRS, type Grade } from "ts-fsrs";
import type { Skill } from "./types";

export { Rating, State };
export type { Grade };

/** Karta w formie gotowej do zapisu w localStorage (daty jako liczby). */
export interface StoredCard {
  due: number;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: State;
  last_review?: number;
}

export const SKILL_LABELS: Record<Skill, string> = {
  recognition: "Rozpoznawanie",
  recall: "Przypominanie",
  reading: "Wymowa / pinyin",
  listening: "Słuch",
  context: "Użycie w zdaniu",
};

export const SKILL_HINTS: Record<Skill, string> = {
  recognition: "widzisz słowo – znasz znaczenie",
  recall: "znasz znaczenie – przypominasz sobie słowo",
  reading: "wiesz, jak się czyta (z tonami)",
  listening: "rozpoznajesz słowo ze słuchu",
  context: "umiesz użyć słowa w zdaniu",
};

export const cardKey = (itemId: string, skill: Skill) => `${itemId}|${skill}`;
export const parseCardKey = (key: string) => {
  const i = key.lastIndexOf("|");
  return { itemId: key.slice(0, i), skill: key.slice(i + 1) as Skill };
};

const schedulers = new Map<number, FSRS>();
export function scheduler(retention = 0.9): FSRS {
  const r = Math.round(Math.min(0.97, Math.max(0.7, retention)) * 100) / 100;
  if (!schedulers.has(r)) {
    schedulers.set(
      r,
      fsrs(generatorParameters({ request_retention: r, enable_fuzz: true, enable_short_term: true, learning_steps: ["1m", "10m"], relearning_steps: ["10m"] })),
    );
  }
  return schedulers.get(r)!;
}

export function toCard(s: StoredCard): Card {
  return { ...s, due: new Date(s.due), last_review: s.last_review ? new Date(s.last_review) : undefined };
}

export function fromCard(c: Card): StoredCard {
  return {
    due: c.due.getTime(),
    stability: c.stability,
    difficulty: c.difficulty,
    elapsed_days: c.elapsed_days,
    scheduled_days: c.scheduled_days,
    learning_steps: c.learning_steps,
    reps: c.reps,
    lapses: c.lapses,
    state: c.state,
    last_review: c.last_review?.getTime(),
  };
}

export function newCard(now = Date.now()): StoredCard {
  return fromCard(createEmptyCard(new Date(now)));
}

export function review(card: StoredCard | undefined, grade: Grade, retention: number, now = Date.now()): StoredCard {
  const base = card ? toCard(card) : createEmptyCard(new Date(now));
  return fromCard(scheduler(retention).next(base, new Date(now), grade).card);
}

/** Przewidywane odstępy dla każdej oceny – pokazywane na przyciskach fiszek. */
export function previewIntervals(card: StoredCard | undefined, retention: number, now = Date.now()): Record<Grade, number> {
  const base = card ? toCard(card) : createEmptyCard(new Date(now));
  const preview = scheduler(retention).repeat(base, new Date(now));
  const out = {} as Record<Grade, number>;
  for (const g of [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy] as Grade[]) out[g] = preview[g].card.due.getTime() - now;
  return out;
}

/** Prawdopodobieństwo przypomnienia sobie teraz (0–1). Nowa karta → 0. */
export function retrievability(card: StoredCard | undefined, retention = 0.9, now = Date.now()): number {
  if (!card || card.state === State.New) return 0;
  return scheduler(retention).get_retrievability(toCard(card), new Date(now), false);
}

export const isDue = (card: StoredCard | undefined, now = Date.now()) => !!card && card.state !== State.New && card.due <= now;
export const isLeech = (card: StoredCard | undefined) => !!card && card.lapses >= 4;

/** Ile czasu (ms) na odpowiedź uznajemy za „płynne” przypomnienie w danym ćwiczeniu. */
export const FLUENT_MS: Record<string, number> = {
  choice: 6000,
  listening: 7000,
  tones: 8000,
  typing: 12000,
  fill: 12000,
  order: 25000,
  matching: 30000,
};

/**
 * Automatyczna ocena odpowiedzi: zła → Again, poprawna, ale z podpowiedzią lub po długim namyśle → Hard,
 * poprawna i płynna → Good. „Easy” zostawiamy na świadomą decyzję w fiszkach.
 */
export function autoGrade({ correct, ms, kind, hint }: { correct: boolean; ms: number; kind: string; hint?: boolean }): Grade {
  if (!correct) return Rating.Again;
  if (hint) return Rating.Hard;
  const limit = FLUENT_MS[kind];
  if (limit && ms > limit) return Rating.Hard;
  return Rating.Good;
}

export type ItemStatus = "new" | "learning" | "young" | "mastered";

export const STATUS_LABELS: Record<ItemStatus, string> = {
  new: "nowe",
  learning: "w nauce",
  young: "utrwalane",
  mastered: "opanowane",
};

/** Ile dni stabilności uznajemy za „opanowane” (pamięć przetrwa ok. 3 tygodnie). */
export const MASTERED_STABILITY = 21;

/**
 * Status słowa na podstawie kart jego podstawowych umiejętności (rozpoznawanie i przypominanie):
 * opanowane, gdy obie karty mają stabilność ≥ 21 dni.
 */
export function itemStatus(cards: Partial<Record<Skill, StoredCard>>): ItemStatus {
  const reviewed = Object.values(cards).filter(c => c && c.state !== State.New) as StoredCard[];
  if (!reviewed.length) return "new";
  const rec = cards.recognition;
  const recall = cards.recall;
  if (rec && recall && rec.stability >= MASTERED_STABILITY && recall.stability >= MASTERED_STABILITY) return "mastered";
  if (reviewed.some(c => c.state === State.Review)) return "young";
  return "learning";
}
