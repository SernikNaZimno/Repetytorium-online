// Katalog typów ćwiczeń i budowanie pytań (czysta logika, bez Reacta).
import type { DialogTask, ExerciseConfig, ExerciseType, Field, Item, JudgeTask, ReplyTask, Sentence, Skill, StudyModule } from "./types";
import { chunk, distractors, sample, shuffle } from "./utils";
import { syllableTarget, tonePattern } from "./pinyin";
import { isDue, retrievability, type StoredCard } from "./srs";

interface QBase {
  uid: string;
  itemIds: string[];
  skill?: Skill;
  label: string;
  section?: string;
  /** które to podejście w sesji (ponowne pytanie po błędzie) */
  attempt?: number;
}

export type Question =
  | (QBase & { kind: "intro"; item: Item })
  | (QBase & { kind: "flashcards"; item: Item; front: Field })
  | (QBase & { kind: "choice"; item: Item; from: Field; to: Field; options: Item[] })
  | (QBase & { kind: "typing"; item: Item; from: Field; to: Field })
  | (QBase & { kind: "matching"; items: Item[] })
  | (QBase & { kind: "listening"; item: Item; options: Item[] })
  | (QBase & { kind: "tones"; item: Item; pattern: number[]; options: number[][] })
  | (QBase & { kind: "fill"; item: Item; sentence: Sentence; options: string[]; answer: string })
  | (QBase & { kind: "order"; item: Item; sentence: Sentence; chunks: string[] })
  | (QBase & { kind: "judge"; task: JudgeTask; taskId: string })
  | (QBase & { kind: "reply"; task: ReplyTask; options: ReplyTask[]; taskId: string })
  | (QBase & { kind: "dialog"; task: DialogTask; options: string[]; taskId: string });

export type QuestionKind = Question["kind"];

let counter = 0;
const uid = () => `q${Date.now().toString(36)}${(counter++).toString(36)}`;

/** Którą umiejętność ćwiczy dane ćwiczenie. */
export function skillFor(cfg: Pick<ExerciseConfig, "type" | "from" | "to" | "front">): Skill | undefined {
  switch (cfg.type) {
    case "flashcards":
      return cfg.front === "meaning" ? "recall" : "recognition";
    case "choice":
    case "typing":
      if (cfg.to === "reading") return "reading";
      if (cfg.to === "term") return "recall";
      return "recognition";
    case "matching":
      return "recognition";
    case "listening":
    case "tones":
      return "listening";
    case "fill":
    case "order":
      return "context";
    default:
      return undefined;
  }
}

// ---------- budowanie pojedynczych pytań dla słowa ----------

const has = (i: Item, f: Field) => !!i[f];

export function buildItemQuestion(m: StudyModule, cfg: ExerciseConfig, item: Item): Question | null {
  const skill = skillFor(cfg);
  const base = { uid: uid(), itemIds: [item.id], skill, label: item.term };
  switch (cfg.type) {
    case "flashcards":
      return { ...base, kind: "flashcards", item, front: cfg.front || "term" };
    case "choice": {
      const from = cfg.from || "term";
      const to = cfg.to || "meaning";
      if (!has(item, from) || !has(item, to)) return null;
      const usable = m.items.filter(i => has(i, from) && has(i, to));
      // Trudniejsze dystraktory: słowa o tej samej długości (np. dwuznakowe do dwuznakowych).
      const len = [...item.term].length;
      const options = shuffle([item, ...distractors(usable, item, 3, i => i[to], i => [...i.term].length === len)]);
      return { ...base, kind: "choice", item, from, to, options };
    }
    case "typing": {
      const from = cfg.from || "term";
      const to = cfg.to || "meaning";
      if (!has(item, from) || !has(item, to)) return null;
      return { ...base, kind: "typing", item, from, to };
    }
    case "listening": {
      // Homofony (np. 进 / 近) nie mogą być dystraktorami – nie da się ich odróżnić ze słuchu.
      const options = shuffle([item, ...distractors(m.items, item, 3, i => i.reading || i.term)]);
      return { ...base, kind: "listening", item, options };
    }
    case "tones": {
      const pattern = tonePattern(item.reading, item.term);
      if (!pattern || pattern.length !== syllableTarget(item.term, item.reading)) return null;
      return { ...base, kind: "tones", item, pattern, options: toneOptions(m, pattern) };
    }
    case "fill": {
      const sentence = pickSentence(m, item, () => true);
      if (!sentence || !sentence.blank) return null;
      const correct = sentence.blank;
      const blankLen = [...correct].length;
      const candidates = m.items.filter(i => !i.term.includes("…") && !sentence.text.includes(i.term)).map(i => i.term);
      const wrong = distractors(candidates, correct, 3, t => t, t => [...t].length === blankLen);
      return { ...base, kind: "fill", item, sentence, options: shuffle([correct, ...wrong]), answer: correct, label: sentence.text };
    }
    case "order": {
      const sentence = pickSentence(m, item, s => s.chunks.length >= 3);
      if (!sentence) return null;
      let chunks = shuffle(sentence.chunks);
      for (let t = 0; t < 6 && chunks.join("|") === sentence.chunks.join("|"); t++) chunks = shuffle(sentence.chunks);
      return { ...base, kind: "order", item, sentence, chunks, label: sentence.text };
    }
    default:
      return null;
  }
}

function pickSentence(m: StudyModule, item: Item, ok: (s: Sentence) => boolean): Sentence | undefined {
  const list = (m.sentencesByItem.get(item.id) || []).filter(ok);
  return list.length ? sample(list, 1)[0] : undefined;
}

/** Warianty wzoru tonów: poprawny + 3 inne o tej samej liczbie sylab (najchętniej realne wzory z modułu). */
function toneOptions(m: StudyModule, pattern: number[]): number[][] {
  const key = (p: number[]) => p.join("-");
  const seen = new Set([key(pattern)]);
  const out: number[][] = [pattern];
  const real = shuffle(m.items.map(i => tonePattern(i.reading, i.term)).filter((p): p is number[] => !!p && p.length === pattern.length));
  const tones = [1, 2, 3, 4];
  // najpierw wzory różniące się jedną sylabą (trudniejsze), potem realne wzory, na końcu losowe
  const oneOff = shuffle(pattern.flatMap((t, i) => tones.filter(x => x !== t && t !== 0).map(x => pattern.map((y, j) => (j === i ? x : y)))));
  for (const p of [...oneOff.slice(0, 2), ...real, ...oneOff]) {
    if (out.length >= 4) break;
    if (seen.has(key(p))) continue;
    seen.add(key(p));
    out.push(p);
  }
  for (let guard = 0; out.length < 4 && guard < 100; guard++) {
    const p = pattern.map(t => (t === 0 ? 0 : tones[Math.floor(Math.random() * 4)]));
    if (!seen.has(key(p))) {
      seen.add(key(p));
      out.push(p);
    }
  }
  return shuffle(out);
}

// ---------- katalog ćwiczeń ----------

export interface ExerciseMeta {
  type: ExerciseType;
  category: "vocab" | "exam";
  title: (cfg: ExerciseConfig, m: StudyModule) => string;
  description: (cfg: ExerciseConfig, m: StudyModule) => string;
  available: (m: StudyModule, cfg: ExerciseConfig) => boolean;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const EXERCISES: Record<ExerciseType, ExerciseMeta> = {
  flashcards: {
    type: "flashcards",
    category: "vocab",
    title: cfg => (cfg.front === "meaning" ? "Fiszki odwrotne" : "Fiszki"),
    description: cfg =>
      cfg.front === "meaning"
        ? "Widzisz znaczenie – przypomnij sobie słowo i oceń się w 4-stopniowej skali."
        : "Przypomnij sobie znaczenie, odkryj kartę i oceń się. Przyciski pokazują termin następnej powtórki.",
    available: m => m.items.length > 0,
  },
  choice: {
    type: "choice",
    category: "vocab",
    title: (cfg, m) => cap(`${m.labels[cfg.from || "term"]} → ${m.labels[cfg.to || "meaning"]}`.toLowerCase()),
    description: () => "Wybierz poprawną odpowiedź spośród czterech podobnych.",
    available: (m, cfg) => m.items.filter(i => i[cfg.from || "term"] && i[cfg.to || "meaning"]).length >= 4,
  },
  typing: {
    type: "typing",
    category: "vocab",
    title: (cfg, m) => `Wpisz: ${m.labels[cfg.to || "meaning"].toLowerCase()}`,
    description: (cfg, m) =>
      cfg.to === "reading" && m.isPinyin
        ? "Wpisz pinyin z tonami – cyframi (ni3hao3) lub znakami (nǐhǎo). Zobaczysz, która sylaba ma zły ton."
        : "Wpisz odpowiedź z pamięci – najskuteczniejsza forma powtórki.",
    available: (m, cfg) => m.items.some(i => i[cfg.from || "term"] && i[cfg.to || "meaning"]),
  },
  matching: {
    type: "matching",
    category: "vocab",
    title: () => "Dopasuj pary",
    description: () => "Połącz słowa z ich znaczeniami – po 5 par na planszy.",
    available: m => m.items.length >= 3,
  },
  listening: {
    type: "listening",
    category: "vocab",
    title: () => "Rozpoznaj ze słuchu",
    description: () => "Posłuchaj wymowy i wybierz właściwe słowo.",
    available: m => !!m.lang && m.items.length >= 4,
  },
  tones: {
    type: "tones",
    category: "vocab",
    title: () => "Rozpoznaj tony",
    description: () => "Posłuchaj słowa i wybierz jego wzór tonów. Trening percepcji tonów z wizualizacją konturu.",
    available: m => !!m.lang && m.isPinyin,
  },
  fill: {
    type: "fill",
    category: "exam",
    title: () => "Uzupełnij zdanie",
    description: () => "Wybierz słowo, które pasuje do luki w zdaniu (选词填空).",
    available: m => m.sentences.length >= 4,
  },
  order: {
    type: "order",
    category: "exam",
    title: () => "Ułóż zdanie",
    description: () => "Ułóż rozsypane słowa w poprawne zdanie. Podpowiedzią jest tłumaczenie.",
    available: m => m.sentences.some(s => s.chunks.length >= 3),
  },
  judge: {
    type: "judge",
    category: "exam",
    title: () => "Prawda czy fałsz",
    description: () => "Przeczytaj tekst i oceń, czy zdanie oznaczone ★ jest z nim zgodne (判断对错).",
    available: m => m.exam.judge.length > 0,
  },
  reply: {
    type: "reply",
    category: "exam",
    title: () => "Dopasuj odpowiedź",
    description: () => "Wybierz zdanie, które najlepiej odpowiada na pytanie lub wypowiedź.",
    available: m => m.exam.replies.length >= 5,
  },
  dialog: {
    type: "dialog",
    category: "exam",
    title: () => "Słuchanie dialogów",
    description: () => "Posłuchaj krótkiej rozmowy i pytania, a potem wybierz odpowiedź (听力).",
    available: m => !!m.lang && m.exam.dialogs.length > 0,
  },
  exam: {
    type: "exam",
    category: "exam",
    title: () => "Egzamin próbny",
    description: cfg =>
      `${(cfg.sections || []).reduce((n, s) => n + s.count, 0)} pytań w sekcjach: ${(cfg.sections || []).map(s => s.title).join(", ")}. Próg zaliczenia: 60%.`,
    available: (m, cfg) => (cfg.sections || []).some(s => EXERCISES[s.type]?.available(m, s)),
  },
};

export const exerciseTitle = (m: StudyModule, cfg: ExerciseConfig) => cfg.title || EXERCISES[cfg.type].title(cfg, m);
export const exerciseDescription = (m: StudyModule, cfg: ExerciseConfig) => cfg.description || EXERCISES[cfg.type].description(cfg, m);
export const isAvailable = (m: StudyModule, cfg: ExerciseConfig) => !!EXERCISES[cfg.type]?.available(m, cfg);

// ---------- dobór materiału ----------

export type CardMap = Record<string, StoredCard>;

/**
 * Wybór słów do ćwiczenia danej umiejętności: najpierw zaległe karty (od najbardziej zapomnianych),
 * potem słowa, których ta umiejętność jeszcze nie była ćwiczona, na końcu pozostałe – od najsłabszych.
 */
export function pickForSkill(pool: Item[], skill: Skill | undefined, cards: CardMap, n: number, retention: number, now = Date.now()): Item[] {
  if (!skill) return sample(pool, n);
  const card = (i: Item) => cards[`${i.id}|${skill}`];
  const r = (i: Item) => retrievability(card(i), retention, now);
  const due = pool.filter(i => isDue(card(i), now)).sort((a, b) => r(a) - r(b));
  const fresh = pool.filter(i => !card(i) || card(i).state === 0);
  const rest = pool.filter(i => card(i) && card(i).state !== 0 && !isDue(card(i), now)).sort((a, b) => r(a) - r(b));
  return shuffle([...due, ...fresh, ...rest].slice(0, n));
}

/** Zadania egzaminacyjne: najpierw te, z którymi było najgorzej lub których jeszcze nie było. */
function pickTasks<T>(list: T[], prefix: string, stats: Record<string, { ok: number; bad: number }>, n: number): { task: T; taskId: string }[] {
  const withId = list.map((task, i) => ({ task, taskId: `${prefix}:${i}` }));
  const score = (id: string) => {
    const s = stats[id];
    return s ? s.ok - 2 * s.bad + Math.random() : -10 + Math.random();
  };
  return withId.sort((a, b) => score(a.taskId) - score(b.taskId)).slice(0, n);
}

export interface BuildContext {
  pool: Item[];
  cards: CardMap;
  examStats: Record<string, { ok: number; bad: number }>;
  count: number;
  retention: number;
}

/** Sesja jednego wybranego ćwiczenia (z karty modułu). */
export function buildPractice(m: StudyModule, cfg: ExerciseConfig, ctx: BuildContext): Question[] {
  const skill = skillFor(cfg);
  switch (cfg.type) {
    case "judge":
      return pickTasks(m.exam.judge, "judge", ctx.examStats, ctx.count).map(({ task, taskId }) => ({
        uid: uid(), kind: "judge", task, taskId, itemIds: [], label: `${task[0]} ★ ${task[1]}`,
      }));
    case "reply":
      return pickTasks(m.exam.replies, "reply", ctx.examStats, ctx.count).map(({ task, taskId }) => ({
        uid: uid(), kind: "reply", task, taskId, itemIds: [], label: `${task[0]} → ${task[1]}`,
        options: shuffle([task, ...distractors(m.exam.replies, task, 4, p => p[1])]),
      }));
    case "dialog":
      return pickTasks(m.exam.dialogs, "dialog", ctx.examStats, ctx.count).map(({ task, taskId }) => ({
        uid: uid(), kind: "dialog", task, taskId, itemIds: [], label: `${task.question} → ${task.options[0]}`, options: shuffle(task.options),
      }));
    case "exam":
      return (cfg.sections || []).flatMap(section =>
        EXERCISES[section.type]?.available(m, section)
          ? buildPractice(m, section, { ...ctx, count: section.count }).map(q => ({ ...q, section: section.title }))
          : [],
      );
    case "matching": {
      const PAIRS = 5;
      const count = Math.max(PAIRS, Math.round(ctx.count / PAIRS) * PAIRS);
      return chunk(pickForSkill(ctx.pool, "recognition", ctx.cards, count, ctx.retention), PAIRS)
        .filter(items => items.length >= 3)
        .map(items => ({ uid: uid(), kind: "matching", items, skill: "recognition", itemIds: items.map(i => i.id), label: items.map(i => i.term).join(" · ") }));
    }
    default: {
      // Ćwiczenia zdaniowe potrzebują słów, które mają zdania przykładowe.
      let pool = ctx.pool;
      if (cfg.type === "fill" || cfg.type === "order") {
        pool = pool.filter(i => m.sentencesByItem.has(i.id));
        if (pool.length < 4) pool = m.items.filter(i => m.sentencesByItem.has(i.id));
      }
      if (cfg.type === "tones") pool = pool.filter(i => buildItemQuestion(m, cfg, i));
      return pickForSkill(pool, skill, ctx.cards, ctx.count, ctx.retention)
        .map(item => buildItemQuestion(m, cfg, item))
        .filter((q): q is Question => !!q);
    }
  }
}
