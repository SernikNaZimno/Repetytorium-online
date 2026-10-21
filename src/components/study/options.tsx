"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { useHotkeys } from "./hooks";

/** Siatka odpowiedzi z obsługą klawiszy 1–9. */
export function OptionGrid({
  options,
  correctIndex,
  onPick,
  disabled,
  layout = "grid",
  optionClassName,
}: {
  options: React.ReactNode[];
  correctIndex: number;
  onPick: (correct: boolean, index: number) => void;
  disabled?: boolean;
  layout?: "grid" | "list" | "two";
  optionClassName?: string;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const done = disabled || picked !== null;

  const pick = (i: number) => {
    if (done) return;
    setPicked(i);
    onPick(i === correctIndex, i);
  };

  useHotkeys(e => {
    const n = Number(e.key);
    if (n >= 1 && n <= options.length) {
      e.preventDefault();
      pick(n - 1);
    }
  }, !done);

  return (
    <div className={cn("grid gap-2.5", layout === "grid" && "sm:grid-cols-2", layout === "two" && "grid-cols-2", layout === "list" && "grid-cols-1")}>
      {options.map((opt, i) => {
        const state = !done ? "idle" : i === correctIndex ? "correct" : i === picked ? "wrong" : "dim";
        return (
          <motion.button
            key={i}
            type="button"
            data-option={i}
            disabled={done}
            onClick={() => pick(i)}
            animate={state === "wrong" ? { x: [0, -6, 6, -4, 4, 0] } : state === "correct" ? { scale: [1, 1.03, 1] } : {}}
            transition={{ duration: 0.35 }}
            className={cn(
              "flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border-2 bg-card px-4 py-2.5 text-left text-base transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
              state === "idle" && "hover:border-primary/60 hover:bg-accent/40",
              state === "correct" && "border-success bg-success/10",
              state === "wrong" && "border-destructive bg-destructive/10",
              state === "dim" && "opacity-55",
              optionClassName,
            )}
          >
            <kbd className="grid size-6 shrink-0 place-items-center rounded-md bg-muted font-sans text-xs font-bold text-muted-foreground">{i + 1}</kbd>
            <span className="min-w-0 flex-1">{opt}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
