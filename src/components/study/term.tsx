import type { Field, Item, StudyModule } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Pinyin } from "./pinyin";

/** Wyświetla wybrane pole słowa z właściwą czcionką (chińską dla znaków, kolorami tonów dla pinyinu). */
export function FieldText({ m, item, field, className }: { m: StudyModule; item: Item; field: Field; className?: string }) {
  if (field === "term") {
    return (
      <span lang={m.lang || undefined} className={cn(m.script === "zh" && "font-zh", className)}>
        {item.term}
      </span>
    );
  }
  if (field === "reading") {
    return m.isPinyin ? <Pinyin text={item.reading} term={item.term} className={className} /> : <span className={cn("text-primary", className)}>{item.reading}</span>;
  }
  return <span className={className}>{item.meaning}</span>;
}
