import { ArrowDownUp, AudioWaveform, GraduationCap, Headphones, Keyboard, Layers, ListChecks, MessagesSquare, Mic, Puzzle, Scale, TextCursorInput, type LucideIcon } from "lucide-react";
import type { ExerciseType } from "@/lib/types";

export const EXERCISE_ICONS: Record<ExerciseType, LucideIcon> = {
  flashcards: Layers,
  choice: ListChecks,
  typing: Keyboard,
  matching: Puzzle,
  listening: Headphones,
  tones: AudioWaveform,
  fill: TextCursorInput,
  order: ArrowDownUp,
  judge: Scale,
  reply: MessagesSquare,
  dialog: Mic,
  exam: GraduationCap,
};
