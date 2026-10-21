"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PageLoading } from "@/components/layout/page-loading";
import { FieldText } from "@/components/study/term";
import { SpeakButton } from "@/components/study/speak-button";
import { SentenceView } from "@/components/study/item-card";
import { useHydrated, useStore } from "@/lib/store";
import { useModule } from "@/lib/registry";
import { isItemHard, itemCards } from "@/lib/pools";
import { itemStatus, retrievability, SKILL_LABELS, State, STATUS_LABELS, type ItemStatus } from "@/lib/srs";
import { analyzePinyin } from "@/lib/pinyin";
import { formatInterval, normalizeText } from "@/lib/utils";
import { cn } from "@/lib/cn";
import { NotFound } from "./not-found";

const STATUS_VARIANT: Record<ItemStatus, "secondary" | "warning" | "default" | "success"> = {
  new: "secondary",
  learning: "warning",
  young: "default",
  mastered: "success",
};

export function WordsView() {
  const params = useSearchParams();
  const hydrated = useHydrated();
  const m = useModule(params.get("id"));
  const cards = useStore(s => (m ? s.cards[m.id] : undefined));
  const retention = useStore(s => s.settings.retention);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(params.get("filter") ?? "all");
  const [open, setOpen] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  const rows = useMemo(() => {
    if (!m) return [];
    const c = cards ?? {};
    return m.items.map(item => {
      const ic = itemCards(m, c, item);
      const reviewed = Object.values(ic).filter(x => x && x.state !== State.New);
      const nextDue = reviewed.length ? Math.min(...reviewed.map(x => x!.due)) : null;
      return {
        item,
        status: itemStatus(ic),
        hard: isItemHard(m, c, item),
        skills: m.skills.map(s => ({ skill: s, card: ic[s], r: retrievability(ic[s], retention, now) })),
        nextDue,
        haystack: [normalizeText(item.term), normalizeText(item.meaning), normalizeText(item.reading), analyzePinyin(item.reading).base].join(" "),
      };
    });
  }, [m, cards, retention, now]);

  if (!hydrated) return <PageLoading />;
  if (!m) return <NotFound />;

  const q = normalizeText(query);
  const shown = rows.filter(
    r => (filter === "all" || (filter === "hard" ? r.hard : r.status === filter)) && (!q || r.haystack.includes(q) || (query.trim() && r.item.term.includes(query.trim()))),
  );

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={`/module/?id=${encodeURIComponent(m.id)}`}>
          <ArrowLeft /> {m.title}
        </Link>
      </Button>
      <h1 className="text-2xl font-bold tracking-tight">Lista: {m.title}</h1>
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-60 flex-1">
          <Search className="absolute top-3 left-3 size-4 text-muted-foreground" />
          <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Szukaj (znak, wymowa lub znaczenie)…" className="pl-9" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie</SelectItem>
            {(Object.keys(STATUS_LABELS) as ItemStatus[]).map(s => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
            <SelectItem value="hard">trudne</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <p className="text-sm text-muted-foreground">
        {shown.length} z {rows.length}. Kropki pokazują szansę przypomnienia dla każdej umiejętności. Kliknij wiersz, aby zobaczyć szczegóły.
      </p>
      <div className="divide-y overflow-hidden rounded-xl border bg-card">
        {shown.map(r => (
          <Fragment key={r.item.id}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => setOpen(open === r.item.id ? null : r.item.id)}
              onKeyDown={e => e.key === "Enter" && setOpen(open === r.item.id ? null : r.item.id)}
              className="grid cursor-pointer grid-cols-[minmax(4.5rem,auto)_1fr_auto] items-center gap-x-3 gap-y-1 px-4 py-2.5 hover:bg-accent/40 sm:grid-cols-[2rem_minmax(6rem,auto)_minmax(7rem,1fr)_2fr_auto_auto]"
            >
              <span className="hidden text-xs text-muted-foreground sm:block">{r.item.index + 1}</span>
              <span className="flex items-center gap-1.5">
                <FieldText m={m} item={r.item} field="term" className={m.script === "zh" ? "text-2xl" : "font-semibold"} />
                <SpeakButton text={r.item.term} lang={m.lang} size="sm" />
              </span>
              <span className="truncate">{r.item.reading && <FieldText m={m} item={r.item} field="reading" />}</span>
              <span className="col-span-3 text-sm text-muted-foreground sm:col-span-1 sm:text-foreground">{r.item.meaning}</span>
              <span className="hidden gap-1 sm:flex">
                {r.skills.map(s => (
                  <Tooltip key={s.skill}>
                    <TooltipTrigger asChild>
                      <i
                        className={cn(
                          "size-2.5 rounded-full",
                          !s.card || s.card.state === State.New ? "bg-muted-foreground/20" : s.r >= 0.85 ? "bg-success" : s.r >= 0.7 ? "bg-chart-1" : "bg-warning",
                        )}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      {SKILL_LABELS[s.skill]}: {s.card && s.card.state !== State.New ? `${Math.round(s.r * 100)}%, stabilność ${s.card.stability.toFixed(1)} dni` : "nie ćwiczone"}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </span>
              <span className="col-start-3 row-start-1 flex items-center gap-1 sm:col-start-auto sm:row-start-auto">
                {r.hard && <Badge variant="destructive">trudne</Badge>}
                <Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABELS[r.status]}</Badge>
                <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open === r.item.id && "rotate-180")} />
              </span>
            </div>
            {open === r.item.id && (
              <div className="space-y-3 bg-muted/30 px-4 py-3 sm:pl-14">
                {(m.sentencesByItem.get(r.item.id) ?? []).map((s, i) => (
                  <SentenceView key={i} m={m} s={s} />
                ))}
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {r.skills.map(s => (
                    <span key={s.skill} className="rounded-md border bg-card px-2 py-1">
                      {SKILL_LABELS[s.skill]}:{" "}
                      {s.card && s.card.state !== State.New
                        ? `${Math.round(s.r * 100)}% · powtórka ${s.card.due <= now ? "teraz" : `za ${formatInterval(s.card.due - now)}`} · pomyłek ${s.card.lapses}`
                        : "nie ćwiczone"}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Fragment>
        ))}
        {!shown.length && <p className="p-6 text-center text-muted-foreground">Nic nie znaleziono.</p>}
      </div>
    </div>
  );
}
