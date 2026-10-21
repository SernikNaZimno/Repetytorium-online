// Zamienia „surową” definicję modułu na jednolity obiekt, z którego korzystają ćwiczenia i system powtórek.
import type { ExerciseConfig, Field, Item, ModuleDef, RawItem, RawSentence, Sentence, Skill, StudyModule } from "./types";
import { chunk } from "./utils";

const DEFAULT_LABELS: Record<Field, string> = { term: "Pojęcie", reading: "Wymowa", meaning: "Znaczenie" };
const PUNCT = /^[，。？！、：；,.?!:;…“”"'()（）]+$/;

function normalizeItem(raw: RawItem): Omit<Item, "id" | "index"> & { id?: string } {
  if (Array.isArray(raw)) {
    if (raw.length >= 3) return { term: raw[0], reading: raw[1] || "", meaning: raw[2] || "" };
    return { term: raw[0], reading: "", meaning: raw[1] || "" };
  }
  return { reading: "", ...raw, meaning: raw.meaning || "" };
}

export function parseSentence(raw: RawSentence, sep = " "): Sentence {
  const [text, reading, meaning, item] = raw;
  const tokens = String(text).trim().split(/\s+/);
  const blankIndex = tokens.findIndex(t => /^\{.+\}$/.test(t));
  const clean = tokens.map(t => t.replace(/^\{(.+)\}$/, "$1"));
  const blank = blankIndex >= 0 ? clean[blankIndex] : null;

  // Części do układania zdania: interpunkcja dokleja się do poprzedniego słowa.
  const chunks: string[] = [];
  for (const t of clean) {
    if (PUNCT.test(t) && chunks.length) chunks[chunks.length - 1] += t;
    else chunks.push(t);
  }
  return {
    tokens: clean,
    blankIndex,
    blank,
    chunks,
    text: sep ? clean.join(sep).replace(/ ([，。？！、：；,.?!:;])/g, "$1") : clean.join(""),
    reading: reading || "",
    meaning: meaning || "",
    itemId: item || blank || "",
  };
}

export function moduleSkills(m: Pick<StudyModule, "hasReading" | "lang" | "sentences">): Skill[] {
  const skills: Skill[] = ["recognition", "recall"];
  if (m.hasReading) skills.push("reading");
  if (m.lang) skills.push("listening");
  if (m.sentences.length) skills.push("context");
  return skills;
}

export function defaultExercises(m: Pick<StudyModule, "hasReading" | "isPinyin" | "script" | "lang" | "sentences">): ExerciseConfig[] {
  const list: ExerciseConfig[] = [
    { type: "flashcards", front: "term" },
    { type: "flashcards", front: "meaning", title: "Fiszki odwrotne" },
    { type: "choice", from: "term", to: "meaning" },
    { type: "choice", from: "meaning", to: "term" },
  ];
  if (m.hasReading) list.push({ type: "choice", from: "term", to: "reading" });
  if (m.isPinyin) list.push({ type: "typing", from: "term", to: "reading" });
  if (m.script !== "zh") list.push({ type: "typing", from: "meaning", to: "term" });
  list.push({ type: "matching" });
  if (m.lang) list.push({ type: "listening" });
  if (m.lang && m.isPinyin) list.push({ type: "tones" });
  if (m.sentences.length) list.push({ type: "fill" }, { type: "order" });
  return list;
}

export function normalizeModule(def: ModuleDef): StudyModule {
  const script = def.script || "";
  const wordSeparator = script === "zh" ? "" : " ";

  const seen = new Set<string>();
  const items: Item[] = (def.items || [])
    .map(normalizeItem)
    .filter(i => i.term)
    .map((item, index) => {
      let id = item.id ?? item.term;
      while (seen.has(id)) id += "′";
      seen.add(id);
      return { ...item, id, index };
    });
  const byId = new Map(items.map(i => [i.id, i]));
  const hasReading = items.some(i => i.reading);

  const sentences = (def.sentences || []).map(s => parseSentence(s, wordSeparator)).filter(s => byId.has(s.itemId));
  const sentencesByItem = new Map<string, Sentence[]>();
  for (const s of sentences) {
    if (!sentencesByItem.has(s.itemId)) sentencesByItem.set(s.itemId, []);
    sentencesByItem.get(s.itemId)!.push(s);
  }

  const groupSize = def.groupSize || 15;
  const raw = chunk(items, groupSize);
  // Bardzo krótką końcówkę dołączamy do poprzedniego zestawu.
  if (raw.length > 1 && raw[raw.length - 1].length < groupSize / 2) raw[raw.length - 2].push(...raw.pop()!);
  const groups = raw.map((its, i, all) => ({
    key: `g${i}`,
    label: all.length > 1 ? `Zestaw ${i + 1}` : "Zestaw",
    range: `${its[0].index + 1}–${its[its.length - 1].index + 1}`,
    items: its,
  }));

  const partial = {
    hasReading,
    isPinyin: def.readingType === "pinyin" && hasReading,
    script,
    lang: def.lang || "",
    sentences,
  };

  return {
    id: def.id,
    title: def.title,
    subtitle: def.subtitle || `${items.length} pozycji`,
    description: def.description || "",
    icon: def.icon || "📘",
    color: def.color || "#5b6cf0",
    readingType: def.readingType || "",
    labels: { ...DEFAULT_LABELS, ...(def.labels || {}) },
    groupSize,
    wordSeparator,
    items,
    byId,
    sentencesByItem,
    groups,
    exam: { judge: def.exam?.judge || [], replies: def.exam?.replies || [], dialogs: def.exam?.dialogs || [] },
    exercises: (def.exercises || defaultExercises(partial)).map((cfg, index) => ({ ...cfg, index })),
    skills: moduleSkills(partial),
    custom: !!def.custom,
    ...partial,
  };
}
