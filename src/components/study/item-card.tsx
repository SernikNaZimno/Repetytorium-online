"use client";

import type { Item, Sentence, StudyModule } from "@/lib/types";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/cn";
import { SpeakButton } from "./speak-button";
import { FieldText } from "./term";
import { Pinyin } from "./pinyin";

export function SentenceView({ m, s, highlight = true, className }: { m: StudyModule; s: Sentence; highlight?: boolean; className?: string }) {
  const showPinyin = useStore(st => st.settings.showSentencePinyin);
  const sep = m.wordSeparator;
  return (
    <div className={cn("space-y-0.5", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <span lang={m.lang || undefined} className={cn("text-lg", m.script === "zh" && "font-zh text-xl")}>
          {s.tokens.map((t, i) => (
            <span key={i}>
              {i > 0 && sep && !/^[，。？！、：；,.?!:;]/.test(t) ? sep : ""}
              {highlight && i === s.blankIndex ? <mark className="rounded bg-warning/35 px-0.5 text-inherit">{t}</mark> : t}
            </span>
          ))}
        </span>
        <SpeakButton text={s.text} lang={m.lang} size="sm" />
      </div>
      {showPinyin && s.reading && (m.isPinyin ? <Pinyin text={s.reading} className="text-sm" /> : <div className="text-sm text-primary">{s.reading}</div>)}
      {s.meaning && <div className="text-sm text-muted-foreground">{s.meaning}</div>}
    </div>
  );
}

/** Pełna informacja o słowie – pokazywana po odpowiedzi i przy prezentacji nowego słowa. */
export function ItemCard({ m, item, className, big = false }: { m: StudyModule; item: Item; className?: string; big?: boolean }) {
  const example = m.sentencesByItem.get(item.id)?.[0];
  return (
    <div className={cn("rounded-xl border bg-card p-4 text-left", className)}>
      <div className="flex items-center gap-3">
        <FieldText m={m} item={item} field="term" className={big ? "text-5xl" : "text-3xl"} />
        <SpeakButton text={item.term} lang={m.lang} />
      </div>
      {item.reading && <FieldText m={m} item={item} field="reading" className={cn("mt-1 block", big ? "text-2xl" : "text-lg")} />}
      <div className={cn("mt-1 font-semibold", big && "text-lg")}>{item.meaning}</div>
      {example && <SentenceView m={m} s={example} className="mt-3 border-t border-dashed pt-3" />}
    </div>
  );
}
