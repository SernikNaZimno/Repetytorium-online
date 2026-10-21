"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/layout/page-loading";
import { Session } from "@/components/session/session";
import { useHydrated, useStore } from "@/lib/store";
import { useModule } from "@/lib/registry";
import { buildPractice, exerciseTitle, isAvailable, type Question } from "@/lib/exercises";
import { planSession } from "@/lib/planner";
import { resolvePool } from "@/lib/pools";
import type { StudyModule } from "@/lib/types";
import { NotFound } from "./not-found";

export function PlayView() {
  const params = useSearchParams();
  const hydrated = useHydrated();
  const m = useModule(params.get("id"));
  if (!hydrated) return <PageLoading />;
  if (!m) return <NotFound />;
  return (
    <PlaySession
      key={params.toString()}
      m={m}
      mode={params.get("mode") === "practice" ? "practice" : "smart"}
      exIndex={Number(params.get("ex") ?? -1)}
      poolKey={params.get("pool") ?? "all"}
      extra={params.get("extra") === "1"}
    />
  );
}

function PlaySession({ m, mode, exIndex, poolKey, extra }: { m: StudyModule; mode: "smart" | "practice"; exIndex: number; poolKey: string; extra: boolean }) {
  const cfg = mode === "practice" ? m.exercises[exIndex] : undefined;
  const backHref = `/module/?id=${encodeURIComponent(m.id)}${mode === "practice" ? `&pool=${poolKey}` : ""}`;

  const build = (): Question[] => {
    const { cards, logs, settings, exam } = useStore.getState();
    const c = cards[m.id] ?? {};
    const pool = resolvePool(m, c, poolKey);
    if (cfg) {
      return buildPractice(m, cfg, { pool: pool.items, cards: c, examStats: exam[m.id] ?? {}, count: cfg.count ?? settings.sessionSize, retention: settings.retention });
    }
    return planSession(m, { pool: m.items, cards: c, logs, settings, extra }).questions;
  };
  const [initial] = useState(build);

  if (mode === "practice" && (!cfg || !isAvailable(m, cfg))) return <NotFound text="Nie znaleziono ćwiczenia." />;

  if (!initial.length) {
    return (
      <Card className="mx-auto max-w-lg items-center gap-3 p-10 text-center">
        <CheckCircle2 className="size-12 text-success" />
        <h2 className="text-xl font-bold">Wszystko powtórzone!</h2>
        <p className="text-muted-foreground">
          Nie ma zaległych powtórek, a dzienny limit nowych słów jest wyczerpany. Najlepiej wrócić jutro – przerwa wzmacnia pamięć.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline">
            <Link href={`/play/?id=${encodeURIComponent(m.id)}&mode=smart&extra=1`}>Dodatkowa powtórka najsłabszych</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href={backHref}>Wróć</Link>
          </Button>
        </div>
      </Card>
    );
  }

  const title = cfg ? exerciseTitle(m, cfg) : `${m.title} · nauka`;
  return <Session m={m} title={title} initial={initial} backHref={backHref} onRestart={build} passThreshold={cfg?.type === "exam" ? 0.6 : undefined} />;
}
