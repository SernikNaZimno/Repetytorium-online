// Typy wspólne dla modułów, ćwiczeń i systemu powtórek.

/**
 * Umiejętność, którą ćwiczy dane zadanie. Każde słowo ma osobną „kartę” FSRS dla każdej umiejętności,
 * bo rozpoznawanie znaczenia, przypominanie sobie słowa, wymowa i słuch to różne ślady pamięciowe.
 */
export type Skill = "recognition" | "recall" | "reading" | "listening" | "context";

export type Field = "term" | "reading" | "meaning";

/** [termin, znaczenie] albo [termin, wymowa, znaczenie] */
export type RawItem = [string, string] | [string, string, string] | { id?: string; term: string; reading?: string; meaning: string };

/** [zdanie z {luką}, wymowa, tłumaczenie, (opcjonalnie) id słowa] */
export type RawSentence = [string, string, string] | [string, string, string, string];

/** [tekst, ★ zdanie, prawda/fałsz, tłumaczenie tekstu, tłumaczenie zdania] */
export type JudgeTask = [string, string, boolean, string, string];

/** [pytanie, odpowiedź, tłumaczenie pytania, tłumaczenie odpowiedzi] */
export type ReplyTask = [string, string, string, string];

export interface DialogTask {
  lines: [string, string][];
  question: string;
  /** pierwsza opcja jest poprawna */
  options: string[];
  meaning: string;
}

export type ExerciseType =
  | "flashcards"
  | "choice"
  | "typing"
  | "matching"
  | "listening"
  | "tones"
  | "fill"
  | "order"
  | "judge"
  | "reply"
  | "dialog"
  | "exam";

export interface ExerciseConfig {
  type: ExerciseType;
  title?: string;
  description?: string;
  from?: Field;
  to?: Field;
  front?: Field;
  count?: number;
  sections?: { type: ExerciseType; count: number; title: string }[];
}

export interface ModuleDef {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  color?: string;
  /** język syntezy mowy, np. "zh-CN" */
  lang?: string;
  /** "zh" – chińska czcionka, zdania bez spacji */
  script?: string;
  /** "pinyin" – sprawdzanie tonów, kolorowanie tonów */
  readingType?: string;
  labels?: Partial<Record<Field, string>>;
  groupSize?: number;
  items: RawItem[];
  sentences?: RawSentence[];
  exam?: { judge?: JudgeTask[]; replies?: ReplyTask[]; dialogs?: DialogTask[] };
  exercises?: ExerciseConfig[];
  custom?: boolean;
}

export interface Item {
  id: string;
  term: string;
  reading: string;
  meaning: string;
  index: number;
}

export interface Sentence {
  tokens: string[];
  blankIndex: number;
  blank: string | null;
  chunks: string[];
  text: string;
  reading: string;
  meaning: string;
  itemId: string;
}

export interface Group {
  key: string;
  label: string;
  range: string;
  items: Item[];
}

export interface StudyModule {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  lang: string;
  script: string;
  readingType: string;
  labels: Record<Field, string>;
  groupSize: number;
  wordSeparator: string;
  items: Item[];
  byId: Map<string, Item>;
  hasReading: boolean;
  isPinyin: boolean;
  sentences: Sentence[];
  sentencesByItem: Map<string, Sentence[]>;
  groups: Group[];
  exam: { judge: JudgeTask[]; replies: ReplyTask[]; dialogs: DialogTask[] };
  exercises: (ExerciseConfig & { index: number })[];
  skills: Skill[];
  custom: boolean;
}
