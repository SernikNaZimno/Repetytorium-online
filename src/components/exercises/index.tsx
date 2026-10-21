"use client";

import type { Question } from "@/lib/exercises";
import type { StudyModule } from "@/lib/types";
import type { Answer } from "./types";
import { ChoiceExercise, FlashcardExercise, IntroExercise, ListeningExercise, MatchingExercise, TonesExercise, TypingExercise } from "./vocab";
import { DialogExercise, FillExercise, JudgeExercise, OrderExercise, ReplyExercise } from "./sentences";

export type { Answer };

export function ExerciseView({ q, m, answered, onAnswer }: { q: Question; m: StudyModule; answered: boolean; onAnswer: (a: Answer) => void }) {
  const p = { m, answered, onAnswer };
  switch (q.kind) {
    case "intro":
      return <IntroExercise q={q} {...p} />;
    case "flashcards":
      return <FlashcardExercise q={q} {...p} />;
    case "choice":
      return <ChoiceExercise q={q} {...p} />;
    case "typing":
      return <TypingExercise q={q} {...p} />;
    case "matching":
      return <MatchingExercise q={q} {...p} />;
    case "listening":
      return <ListeningExercise q={q} {...p} />;
    case "tones":
      return <TonesExercise q={q} {...p} />;
    case "fill":
      return <FillExercise q={q} {...p} />;
    case "order":
      return <OrderExercise q={q} {...p} />;
    case "judge":
      return <JudgeExercise q={q} {...p} />;
    case "reply":
      return <ReplyExercise q={q} {...p} />;
    case "dialog":
      return <DialogExercise q={q} {...p} />;
  }
}
