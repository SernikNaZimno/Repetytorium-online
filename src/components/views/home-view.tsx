"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Brain, Flame, Layers, Plus, Repeat, Shuffle, Target, Play } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageLoading } from "@/components/layout/page-loading";
import { useHydrated, useStore } from "@/lib/store";
import { useModules } from "@/lib/registry";
import { streak, summarizeModule, todayCount } from "@/lib/stats";
import { plural } from "@/lib/utils";
import { StatusBar } from "./module-progress";

const METHOD = [
  { icon: Brain, title: "Powtórki FSRS", text: "Nowoczesny algorytm planuje powtórkę dokładnie wtedy, gdy zaczynasz zapominać – mniej powtórek przy tej samej skuteczności." },
  { icon: Layers, title: "Osobno każda umiejętność", text: "Rozpoznanie znaku, przypomnienie go, wymowa i słuch to różne umiejętności – każda ma własny harmonogram." },
  { icon: Shuffle, title: "Przeplatanie i progresja", text: "Zadania są mieszane, a gdy słowo się utrwala, quiz wyboru zamienia się w przypominanie z pamięci." },
  { icon: Repeat, title: "Błędy wracają", text: "Pomylone słowo wraca w tej samej sesji, aż odpowiesz poprawnie. Nowe słowa najpierw poznajesz, potem od razu sprawdzasz." },
];

export function HomeView() {
  const hydrated = useHydrated();
  const modules = useModules();
  const cards = useStore(s => s.cards);
  const logs = useStore(s => s.logs);
  const settings = useStore(s => s.settings);
  if (!hydrated) return <PageLoading />;

  const today = todayCount(logs);
  const days = streak(logs);
  const summaries = modules.map(m => ({ m, sum: summarizeModule(m, cards[m.id] ?? {}, settings.retention) }));
  const totalDue = summaries.reduce((n, s) => n + s.sum.due, 0);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <Card className="justify-between bg-gradient-to-br from-primary/10 via-card to-card">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Cześć! Czas na powtórkę?</h1>
            <p className="mt-1 text-muted-foreground">
              {totalDue > 0
                ? `Masz ${totalDue} ${plural(totalDue, "słowo", "słowa", "słów")} do powtórki. Krótka sesja wystarczy.`
                : "Nie masz zaległych powtórek. Możesz poznać nowe słowa."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {summaries.slice(0, 1).map(({ m }) => (
              <Button key={m.id} asChild size="lg">
                <Link href={`/play/?id=${encodeURIComponent(m.id)}&mode=smart`}>
                  <Play /> Ucz się: {m.title}
                </Link>
              </Button>
            ))}
          </div>
        </Card>
        <Card className="gap-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-semibold">
              <Target className="size-4 text-primary" /> Cel dzienny
            </span>
            <span className="text-sm text-muted-foreground tabular-nums">
              {today} / {settings.dailyGoal}
            </span>
          </div>
          <Progress value={Math.min(100, (today / settings.dailyGoal) * 100)} indicatorClassName={today >= settings.dailyGoal ? "bg-success" : undefined} />
          <div className="flex items-center gap-2 text-sm">
            <Flame className={days ? "size-5 text-orange-500" : "size-5 text-muted-foreground"} />
            <span>
              <strong>{days}</strong> {plural(days, "dzień", "dni", "dni")} z rzędu
            </span>
          </div>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Moduły</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {summaries.map(({ m, sum }, i) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="h-full gap-3 transition-shadow hover:shadow-md" style={{ borderTop: `4px solid ${m.color}` }}>
                <Link href={`/module/?id=${encodeURIComponent(m.id)}`} className="flex gap-3">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl font-zh text-2xl font-bold" style={{ background: `${m.color}22`, color: m.color }}>
                    {m.icon}
                  </span>
                  <span className="min-w-0">
                    <CardTitle className="text-base">{m.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{m.subtitle}</CardDescription>
                  </span>
                </Link>
                <StatusBar sum={sum} />
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>
                    Opanowane {sum.status.mastered}/{sum.total}
                  </span>
                  <span className="flex gap-1">
                    {sum.due > 0 && <Badge variant="warning">{sum.due} do powtórki</Badge>}
                    {m.custom && <Badge variant="secondary">własny</Badge>}
                  </span>
                </div>
                <div className="mt-auto flex gap-2">
                  <Button asChild size="sm" className="flex-1">
                    <Link href={`/play/?id=${encodeURIComponent(m.id)}&mode=smart`}>
                      <Play /> Ucz się
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/module/?id=${encodeURIComponent(m.id)}`}>Ćwiczenia</Link>
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
          <Link href="/create/">
            <Card className="h-full items-center justify-center gap-2 border-dashed text-center shadow-none transition-colors hover:border-primary/60 hover:bg-accent/30">
              <span className="grid size-12 place-items-center rounded-xl bg-muted text-muted-foreground">
                <Plus />
              </span>
              <CardTitle className="text-base">Własny moduł</CardTitle>
              <CardDescription>Wklej listę słówek lub pojęć i ćwicz je wszystkimi rodzajami zadań.</CardDescription>
            </Card>
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Jak działa nauka?</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {METHOD.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-3 rounded-xl border bg-card/60 p-4">
              <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <div className="font-semibold">{title}</div>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
