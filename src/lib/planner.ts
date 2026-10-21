// Planer „inteligentnej” sesji: łączy zaległe powtórki, odblokowane umiejętności i nowe słowa,
// dobiera rodzaj ćwiczenia do siły pamięci i przeplata zadania.
import type { ExerciseConfig, Item, Skill, StudyModule } from "./types";
import { buildItemQuestion, type CardMap, type Question } from "./exercises";
import { isDue, retrievability, State, type StoredCard } from "./srs";
import type { ReviewLog, Settings } from "./store";
import { shuffle, startOfDay } from "./utils";

export interface PlanInput {
  pool: Item[];
  cards: CardMap;
  logs: ReviewLog[];
  settings: Pick<Settings, "sessionSize" | "newPerDay" | "retention">;
  now?: number;
  /** dodatkowa powtórka, gdy nic nie jest zaległe – bierze najsłabsze karty */
  extra?: boolean;
}

export interface Plan {
  questions: Question[];
  due: number;
  fresh: number;
  unlocked: number;
}

/** Ile nowych słów z modułu wprowadzono dzisiaj. */
export function introducedToday(logs: ReviewLog[], moduleId: string, now = Date.now()): number {
  const from = startOfDay(now);
  const ids = new Set<string>();
  for (let i = logs.length - 1; i >= 0 && logs[i].t >= from; i--) {
    const l = logs[i];
    if (l.m === moduleId && l.s === "recognition" && l.st === State.New) ids.add(l.i);
  }
  return ids.size;
}

const reviewed = (c?: StoredCard) => !!c && c.state !== State.New;
const graduated = (c?: StoredCard) => !!c && c.state === State.Review;

/**
 * Progresja trudności: umiejętność odblokowuje się, gdy łatwiejsza jest już utrwalona.
 * Rozpoznawanie → przypominanie → wymowa i słuch → użycie w zdaniu.
 */
export function isUnlocked(skill: Skill, cardOf: (s: Skill) => StoredCard | undefined): boolean {
  switch (skill) {
    case "recognition":
      return true;
    case "recall":
      return reviewed(cardOf("recognition"));
    case "reading":
    case "listening":
      return graduated(cardOf("recognition"));
    case "context":
      return graduated(cardOf("recall"));
  }
}

/** Dobór formy ćwiczenia do stabilności karty: słaba pamięć → rozpoznawanie, mocna → przypominanie z pamięci. */
export function chooseExercise(m: StudyModule, skill: Skill, card?: StoredCard): ExerciseConfig {
  const s = card?.stability ?? 0;
  switch (skill) {
    case "recognition":
      return s < 4 ? { type: "choice", from: "term", to: "meaning" } : { type: "flashcards", front: "term" };
    case "recall":
      if (s < 3) return { type: "choice", from: "meaning", to: "term" };
      return m.script === "zh" ? { type: "flashcards", front: "meaning" } : { type: "typing", from: "meaning", to: "term" };
    case "reading":
      if (!m.isPinyin || s < 3) return { type: "choice", from: "term", to: "reading" };
      return { type: "typing", from: "term", to: "reading" };
    case "listening":
      return m.isPinyin && s >= 3 && Math.random() < 0.5 ? { type: "tones" } : { type: "listening" };
    case "context":
      return s < 5 || Math.random() < 0.5 ? { type: "fill" } : { type: "order" };
  }
}

function questionFor(m: StudyModule, skill: Skill, item: Item, card?: StoredCard): Question | null {
  const q = buildItemQuestion(m, chooseExercise(m, skill, card), item);
  if (q) return q;
  // rezerwowe formy, gdy wybrana nie pasuje do słowa (np. brak zdania z ≥3 częściami)
  if (skill === "listening") return buildItemQuestion(m, { type: "listening" }, item);
  if (skill === "context") return buildItemQuestion(m, { type: "fill" }, item);
  return null;
}

interface Task {
  item: Item;
  skill: Skill;
  card?: StoredCard;
  /** zadania nowego słowa: 0 – prezentacja, 1 – rozpoznawanie, 2 – przypominanie */
  step?: number;
}

export function planSession(m: StudyModule, input: PlanInput): Plan {
  const now = input.now ?? Date.now();
  const { cards, settings } = input;
  const size = settings.sessionSize;
  const cardOf = (item: Item) => (skill: Skill) => cards[`${item.id}|${skill}`];
  const R = (c?: StoredCard) => retrievability(c, settings.retention, now);

  const due: Task[] = [];
  const unlocked: Task[] = [];
  const freshItems: Item[] = [];
  const weak: Task[] = [];

  for (const item of input.pool) {
    const get = cardOf(item);
    if (!reviewed(get("recognition"))) {
      freshItems.push(item);
      continue;
    }
    for (const skill of m.skills) {
      const card = get(skill);
      if (isDue(card, now)) due.push({ item, skill, card });
      else if (!reviewed(card) && isUnlocked(skill, get)) unlocked.push({ item, skill, card });
      else if (reviewed(card)) weak.push({ item, skill, card });
    }
  }

  due.sort((a, b) => R(a.card) - R(b.card));
  const reviews: Task[] = due.slice(0, size);
  let room = size - reviews.length;

  // odblokowane umiejętności – najwyżej połowa wolnego miejsca, żeby zostało miejsce na nowe słowa
  const unlockedTake = shuffle(unlocked).slice(0, Math.ceil(room / 2));
  reviews.push(...unlockedTake);
  room -= unlockedTake.length;

  // nowe słowa (każde to 3 zadania: prezentacja, rozpoznawanie, przypominanie) w limicie dziennym
  const allowed = Math.max(0, settings.newPerDay - introducedToday(input.logs, m.id, now));
  const freshTake = freshItems.slice(0, Math.min(allowed, Math.floor(room / 3)));

  if (input.extra && !reviews.length && !freshTake.length) {
    weak.sort((a, b) => R(a.card) - R(b.card));
    reviews.push(...weak.slice(0, size));
  }

  const sequences: Task[][] = freshTake.map(item => [
    { item, skill: "recognition", step: 0 },
    { item, skill: "recognition", step: 1 },
    { item, skill: "recall", step: 2 },
  ]);

  // Przeplatanie: powtórki mieszamy, a kroki nowego słowa rozsuwamy (odstęp ≥ 2 zadania).
  const order = interleave(shuffle(reviews), sequences);
  const questions: Question[] = [];
  for (const t of order) {
    const q: Question | null =
      t.step === 0
        ? { uid: `intro-${t.item.id}-${now}`, kind: "intro", item: t.item, itemIds: [t.item.id], label: t.item.term }
        : t.step === 1
          ? buildItemQuestion(m, { type: "choice", from: "term", to: "meaning" }, t.item)
          : t.step === 2
            ? buildItemQuestion(m, { type: "choice", from: "meaning", to: "term" }, t.item)
            : questionFor(m, t.skill, t.item, t.card);
    if (q) questions.push(q);
  }

  return { questions, due: due.length, fresh: freshTake.length, unlocked: unlockedTake.length };
}

function interleave(reviews: Task[], sequences: Task[][]): Task[] {
  const out: Task[] = [];
  const pending: { task: Task; earliest: number; rest: Task[] }[] = [];
  const seqQueue = [...sequences];
  let ri = 0;
  const lastItem = () => out[out.length - 1]?.item.id;

  while (ri < reviews.length || seqQueue.length || pending.length) {
    const pos = out.length;
    const readyIdx = pending.findIndex(p => p.earliest <= pos && p.task.item.id !== lastItem());
    if (readyIdx >= 0) {
      const p = pending.splice(readyIdx, 1)[0];
      out.push(p.task);
      if (p.rest.length) pending.push({ task: p.rest[0], earliest: pos + 3, rest: p.rest.slice(1) });
      continue;
    }
    const wantNew = seqQueue.length && (ri >= reviews.length || pos % 3 === 0);
    if (wantNew) {
      const seq = seqQueue.shift()!;
      out.push(seq[0]);
      if (seq.length > 1) pending.push({ task: seq[1], earliest: pos + 3, rest: seq.slice(2) });
      continue;
    }
    if (ri < reviews.length) {
      // unikaj dwóch zadań z tym samym słowem pod rząd
      let k = ri;
      while (k < reviews.length - 1 && reviews[k].item.id === lastItem()) k++;
      [reviews[ri], reviews[k]] = [reviews[k], reviews[ri]];
      out.push(reviews[ri++]);
      continue;
    }
    if (seqQueue.length) {
      const seq = seqQueue.shift()!;
      out.push(seq[0]);
      if (seq.length > 1) pending.push({ task: seq[1], earliest: pos + 2, rest: seq.slice(2) });
      continue;
    }
    // zostały tylko zadania czekające na odstęp – bierzemy najwcześniejsze
    pending.sort((a, b) => a.earliest - b.earliest);
    const p = pending.shift()!;
    out.push(p.task);
    if (p.rest.length) pending.push({ task: p.rest[0], earliest: out.length + 2, rest: p.rest.slice(1) });
  }
  return out;
}

/** Liczba kart do powtórki teraz i w kolejnych dniach (prognoza). */
export function forecast(cards: CardMap, days = 14, now = Date.now()): number[] {
  const out = new Array(days).fill(0);
  const today = startOfDay(now);
  for (const c of Object.values(cards)) {
    if (c.state === State.New) continue;
    const d = Math.max(0, Math.floor((startOfDay(c.due) - today) / 864e5));
    if (d < days) out[d] += 1;
  }
  return out;
}
