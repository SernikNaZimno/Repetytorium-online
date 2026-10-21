"use client";

import { splitSyllables, syllableTarget } from "@/lib/pinyin";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/cn";

export const TONE_CLASS = ["text-tone-5", "text-tone-1", "text-tone-2", "text-tone-3", "text-tone-4"];

/** Pinyin pokolorowany według tonów (kolory pomagają zapamiętać ton razem ze słowem). */
export function Pinyin({ text, term, className }: { text: string; term?: string; className?: string }) {
  const colors = useStore(s => s.settings.toneColors);
  const syl = colors ? splitSyllables(text, term ? syllableTarget(term, text) : undefined) : null;
  if (!syl) return <span className={cn("text-primary", className)}>{text}</span>;
  // zachowujemy oryginalne odstępy: kolorujemy kolejne sylaby w tekście źródłowym
  const parts: React.ReactNode[] = [];
  let rest = text;
  syl.forEach((s, i) => {
    const at = rest.indexOf(s.text);
    if (at > 0) parts.push(<span key={`g${i}`}>{rest.slice(0, at)}</span>);
    parts.push(
      <span key={i} className={TONE_CLASS[s.tone]}>
        {s.text}
      </span>,
    );
    rest = rest.slice(at + s.text.length);
  });
  if (rest) parts.push(<span key="tail">{rest}</span>);
  return <span className={cn("font-medium", className)}>{parts}</span>;
}

/** Kontur tonu (wysokość głosu w skali 1–5, jak w notacji Chao) – wizualna podpowiedź dla ucha. */
const CONTOURS: Record<number, [number, number][]> = {
  1: [[0, 5], [1, 5]],
  2: [[0, 3], [1, 5]],
  3: [[0, 2], [0.45, 1], [1, 4]],
  4: [[0, 5], [1, 1]],
  0: [[0.4, 3], [0.6, 3]],
};

export function ToneContour({ tone, className }: { tone: number; className?: string }) {
  const pts = CONTOURS[tone] ?? CONTOURS[0];
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${4 + x * 32} ${4 + (5 - y) * 6}`).join(" ");
  return (
    <svg viewBox="0 0 40 32" className={cn("h-7 w-9", TONE_CLASS[tone], className)} aria-hidden>
      <path d={d} fill="none" stroke="currentColor" strokeWidth={tone === 0 ? 5 : 3.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
