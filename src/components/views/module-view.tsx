"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Download, List, Pencil, Play, RotateCcw, Trash2, TriangleAlert } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ConfirmButton } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PageLoading } from "@/components/layout/page-loading";
import { useHydrated, useStore } from "@/lib/store";
import { useModule } from "@/lib/registry";
import { summarizeModule } from "@/lib/stats";
import { listPools } from "@/lib/pools";
import { introducedToday } from "@/lib/planner";
import { EXERCISES, exerciseDescription, exerciseTitle, isAvailable } from "@/lib/exercises";
import { SKILL_HINTS, SKILL_LABELS } from "@/lib/srs";
import { cn } from "@/lib/cn";
import { EXERCISE_ICONS } from "./exercise-icons";
import { StatusBar, StatusLegend } from "./module-progress";
import { NotFound } from "./not-found";

export function ModuleView() {
  const params = useSearchParams();
  const router = useRouter();
  const hydrated = useHydrated();
  const m = useModule(params.get("id"));
  const cards = useStore(s => (m ? s.cards[m.id] : undefined));
  const logs = useStore(s => s.logs);
  const settings = useStore(s => s.settings);
  const custom = useStore(s => s.custom);
  const resetModule = useStore(s => s.resetModule);
  const deleteCustomModule = useStore(s => s.deleteCustomModule);

  if (!hydrated) return <PageLoading />;
  if (!m) return <NotFound />;

  const c = cards ?? {};
  const sum = summarizeModule(m, c, settings.retention);
  const pools = listPools(m, c);
  const poolKey = pools.some(p => p.key === params.get("pool") && p.items.length) ? params.get("pool")! : "all";
  const newLeft = Math.max(0, settings.newPerDay - introducedToday(logs, m.id));
  const available = m.exercises.filter(cfg => isAvailable(m, cfg));
  const base = `/module/?id=${encodeURIComponent(m.id)}`;
  const playHref = (index: number) => `/play/?id=${encodeURIComponent(m.id)}&mode=practice&ex=${index}&pool=${poolKey}`;

  const exportModule = () => {
    const def = custom.find(d => d.id === m.id);
    const blob = new Blob([JSON.stringify(def, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${m.id}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/">
          <ArrowLeft /> Wszystkie moduły
        </Link>
      </Button>

      <Card className="gap-5 sm:flex-row" style={{ borderTop: `4px solid ${m.color}` }}>
        <span className="grid size-16 shrink-0 place-items-center rounded-2xl font-zh text-3xl font-bold" style={{ background: `${m.color}22`, color: m.color }}>
          {m.icon}
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{m.title}</h1>
            {m.description && <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>}
          </div>
          <StatusBar sum={sum} />
          <StatusLegend sum={sum} />
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="lg">
              <Link href={`/play/?id=${encodeURIComponent(m.id)}&mode=smart`}>
                <Play /> Ucz się
              </Link>
            </Button>
            <span className="text-sm text-muted-foreground">
              {sum.due} do powtórki · {newLeft > 0 ? `${Math.min(newLeft, sum.status.new)} nowych na dziś` : "dzienny limit nowych słów wyczerpany"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/module/words/?id=${encodeURIComponent(m.id)}`}>
                <List /> Lista ({m.items.length})
              </Link>
            </Button>
            {sum.leeches > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="outline" size="sm" className="border-warning/50">
                    <Link href={`/module/words/?id=${encodeURIComponent(m.id)}&filter=hard`}>
                      <TriangleAlert className="text-warning" /> Trudne słowa: {sum.leeches}
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Słowa zapomniane co najmniej 4 razy. Warto dla nich wymyślić skojarzenie albo rozbić znak na części.</TooltipContent>
              </Tooltip>
            )}
            {m.custom && (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/create/?id=${encodeURIComponent(m.id)}`}>
                    <Pencil /> Edytuj
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={exportModule}>
                  <Download /> Eksportuj
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sum.skills.map(s => (
          <div key={s.skill} className="space-y-2 rounded-xl border bg-card p-4">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-semibold">{SKILL_LABELS[s.skill]}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {s.reviewed}/{m.items.length}
              </span>
            </div>
            <Progress value={s.avgR * 100} indicatorClassName={s.avgR >= 0.85 ? "bg-success" : s.avgR >= 0.7 ? "bg-chart-1" : "bg-warning"} />
            <p className="text-xs text-muted-foreground">
              {s.reviewed ? `Średnio ${Math.round(s.avgR * 100)}% szans na przypomnienie teraz` : "Jeszcze nie ćwiczone"} · {SKILL_HINTS[s.skill]}
            </p>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Ćwiczenia</h2>
          <p className="text-sm text-muted-foreground">„Ucz się” sam dobiera zadania. Tu możesz poćwiczyć wybraną formę – wyniki też trafiają do powtórek.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {pools.map(p => {
            const disabled = !p.items.length;
            const active = p.key === poolKey;
            return (
              <button
                key={p.key}
                type="button"
                disabled={disabled}
                onClick={() => router.replace(`${base}&pool=${p.key}`, { scroll: false })}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent",
                  disabled && "cursor-default opacity-40",
                )}
              >
                {p.label}
                {p.hint && <small className={active ? "opacity-80" : "text-muted-foreground"}>{p.hint}</small>}
                <span className={cn("rounded-full px-1.5 text-xs", active ? "bg-primary-foreground/20" : "bg-muted")}>{p.items.length}</span>
              </button>
            );
          })}
        </div>
        {(["vocab", "exam"] as const).map(cat => {
          const list = available.filter(cfg => EXERCISES[cfg.type].category === cat);
          if (!list.length) return null;
          return (
            <div key={cat} className="space-y-2 pt-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase">{cat === "vocab" ? "Słownictwo" : "Zdania i zadania egzaminacyjne"}</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.map(cfg => {
                  const Icon = EXERCISE_ICONS[cfg.type];
                  return (
                    <Link key={cfg.index} href={playHref(cfg.index)} className="group">
                      <Card className="h-full flex-row gap-3 p-4 transition-all group-hover:-translate-y-0.5 group-hover:border-primary/50 group-hover:shadow-md">
                        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="size-5" />
                        </span>
                        <span className="min-w-0">
                          <CardTitle className="text-sm">{exerciseTitle(m, cfg)}</CardTitle>
                          <CardDescription className="mt-0.5 text-xs">{exerciseDescription(m, cfg)}</CardDescription>
                        </span>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      <section className="flex flex-wrap gap-2 border-t pt-6">
        <ConfirmButton
          title={`Zresetować postęp w module „${m.title}”?`}
          description="Wszystkie karty powtórek i historia odpowiedzi z tego modułu zostaną usunięte."
          confirmLabel="Resetuj"
          onConfirm={() => resetModule(m.id)}
        >
          <Button variant="ghost" size="sm">
            <RotateCcw /> Resetuj postęp
          </Button>
        </ConfirmButton>
        {m.custom && (
          <ConfirmButton
            title={`Usunąć moduł „${m.title}”?`}
            description="Moduł zostanie usunięty razem z postępem. Tej operacji nie można cofnąć."
            confirmLabel="Usuń"
            onConfirm={() => {
              deleteCustomModule(m.id);
              router.push("/");
            }}
          >
            <Button variant="ghost" size="sm" className="text-destructive">
              <Trash2 /> Usuń moduł
            </Button>
          </ConfirmButton>
        )}
        {sum.status.new < sum.total && <Badge variant="outline" className="ml-auto self-center">Retencja docelowa: {Math.round(settings.retention * 100)}%</Badge>}
      </section>
    </div>
  );
}
