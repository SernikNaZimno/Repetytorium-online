"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from "recharts";
import { Activity, CalendarClock, Flame, Gauge, Timer } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { PageLoading } from "@/components/layout/page-loading";
import { useHydrated, useStore } from "@/lib/store";
import { useModules } from "@/lib/registry";
import { dailyActivity, streak, summarizeModule, todayCount, trueRetention } from "@/lib/stats";
import { forecast } from "@/lib/planner";
import { plural } from "@/lib/utils";
import { StatusBar, StatusLegend } from "./module-progress";

function Stat({ icon: Icon, label, value, hint }: { icon: typeof Flame; label: string; value: string; hint?: string }) {
  return (
    <Card className="gap-1 p-4">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4" /> {label}
      </span>
      <span className="text-2xl font-bold tabular-nums">{value}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </Card>
  );
}

const tooltipStyle = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--popover-foreground)" };

export function StatsView() {
  const hydrated = useHydrated();
  const modules = useModules();
  const logs = useStore(s => s.logs);
  const cards = useStore(s => s.cards);
  const settings = useStore(s => s.settings);
  const [now] = useState(() => Date.now());
  if (!hydrated) return <PageLoading />;

  const activity = dailyActivity(logs, 30, now);
  const allCards = Object.assign({}, ...Object.values(cards));
  const fc = forecast(allCards, 14, now).map((count, i) => ({ label: i === 0 ? "dziś" : i === 1 ? "jutro" : `+${i}`, count }));
  const ret = trueRetention(logs, 30, now);
  const recent = logs.filter(l => l.ms && l.t >= now - 30 * 864e5);
  const avgMs = recent.length ? recent.reduce((a, l) => a + (l.ms ?? 0), 0) / recent.length : 0;
  const days = streak(logs, now);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Statystyki</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Activity} label="Dzisiaj" value={String(todayCount(logs, now))} hint={`cel: ${settings.dailyGoal}`} />
        <Stat icon={Flame} label="Seria" value={`${days} ${plural(days, "dzień", "dni", "dni")}`} />
        <Stat
          icon={Gauge}
          label="Retencja (30 dni)"
          value={ret.value == null ? "–" : `${Math.round(ret.value * 100)}%`}
          hint={ret.value == null ? "brak powtórek nauczonych słów" : `cel ${Math.round(settings.retention * 100)}% · ${ret.n} powtórek`}
        />
        <Stat icon={Timer} label="Średni czas odpowiedzi" value={avgMs ? `${(avgMs / 1000).toFixed(1)} s` : "–"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div>
            <CardTitle>Aktywność</CardTitle>
            <CardDescription>Odpowiedzi w ostatnich 30 dniach (zielone – poprawne)</CardDescription>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activity} margin={{ left: -24, right: 4 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} interval={4} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                <ChartTooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="correct" name="poprawne" stackId="a" fill="var(--success)" radius={[0, 0, 0, 0]} />
                <Bar dataKey={d => d.count - d.correct} name="błędne" stackId="a" fill="var(--destructive)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="size-4" /> Prognoza powtórek
            </CardTitle>
            <CardDescription>Ile kart FSRS zaplanował na kolejne 14 dni (wszystkie moduły i umiejętności)</CardDescription>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fc} margin={{ left: -24, right: 4 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                <ChartTooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="count" name="karty" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Postęp w modułach</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {modules.map(m => {
            const sum = summarizeModule(m, cards[m.id] ?? {}, settings.retention, now);
            return (
              <Card key={m.id} className="gap-3">
                <CardTitle className="flex items-center justify-between gap-2">
                  {m.title}
                  <span className="text-sm font-normal text-muted-foreground">
                    {sum.status.mastered}/{sum.total} opanowane
                  </span>
                </CardTitle>
                <StatusBar sum={sum} />
                <StatusLegend sum={sum} />
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
