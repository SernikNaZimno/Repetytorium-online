import type { ReactNode } from "react";
import type { Grade } from "@/lib/srs";
import type { StudyModule } from "@/lib/types";
import type { Question } from "@/lib/exercises";

export interface Answer {
  correct: boolean;
  /** odpowiedź z podpowiedzią – ocena „Hard” zamiast „Good” */
  hint?: boolean;
  /** ocena wybrana świadomie (fiszki) */
  grade?: Grade;
  /** wyniki dla poszczególnych słów (np. w dopasowywaniu par) */
  results?: { id: string; correct: boolean }[];
  reveal?: ReactNode;
  note?: ReactNode;
  /** nie zapisuj w systemie powtórek (prezentacja nowego słowa) */
  skipRecord?: boolean;
}

export interface ExerciseProps<K extends Question["kind"]> {
  q: Extract<Question, { kind: K }>;
  m: StudyModule;
  answered: boolean;
  onAnswer: (a: Answer) => void;
}
