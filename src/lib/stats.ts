// Statystyki liczone z historii odpowiedzi i kart FSRS.
import type { Skill, StudyModule } from "./types";
import type { ReviewLog } from "./store";
import type { CardMap } from "./exercises";
import { isDue, isLeech, itemStatus, retrievability, State, type ItemStatus } from "./srs";
import { dayKey, startOfDay } from "./utils";

export function todayCount(logs: ReviewLog[], now = Date.now()): number {
  const from = startOfDay(now);
  let n = 0;
  for (let i = logs.length - 1; i >= 0 && logs[i].t >= from; i--) n++;
  return n;
}

/** Liczba kolejnych dni z nauką (dzisiejszy dzień nie przerywa serii, dopóki trwa). */
export function streak(logs: ReviewLog[], now = Date.now()): number {
  const days = new Set(logs.map(l => dayKey(l.t)));
  const d = new Date(now);
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(dayKey(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function dailyActivity(logs: ReviewLog[], days = 30, now = Date.now()): { day: string; label: string; count: number; correct: number }[] {
  const out = [];
  const byDay = new Map<string, { count: number; correct: number }>();
  for (const l of logs) {
    const k = dayKey(l.t);
    const v = byDay.get(k) ?? { count: 0, correct: 0 };
    v.count++;
    if (l.g > 1) v.correct++;
    byDay.set(k, v);
  }
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const k = dayKey(d);
    out.push({ day: k, label: `${d.getDate()}.${d.getMonth() + 1}`, ...(byDay.get(k) ?? { count: 0, correct: 0 }) });
  }
  return out;
}

/**
 * Rzeczywista retencja: odsetek poprawnych odpowiedzi na karty w stanie „powtórka” (już nauczone),
 * czyli jak często naprawdę pamiętasz słowa w dniu powtórki. FSRS celuje w wartość z ustawień (np. 90%).
 */
export function trueRetention(logs: ReviewLog[], days = 30, now = Date.now()): { value: number | null; n: number } {
  const from = now - days * 864e5;
  const relevant = logs.filter(l => l.t >= from && l.st === State.Review);
  if (!relevant.length) return { value: null, n: 0 };
  return { value: relevant.filter(l => l.g > 1).length / relevant.length, n: relevant.length };
}

export interface ModuleSummary {
  total: number;
  status: Record<ItemStatus, number>;
  due: number;
  leeches: number;
  skills: { skill: Skill; reviewed: number; avgR: number }[];
}

export function summarizeModule(m: StudyModule, cards: CardMap, retention: number, now = Date.now()): ModuleSummary {
  const status: Record<ItemStatus, number> = { new: 0, learning: 0, young: 0, mastered: 0 };
  let due = 0;
  let leeches = 0;
  const skillAcc = new Map<Skill, { reviewed: number; sumR: number }>(m.skills.map(s => [s, { reviewed: 0, sumR: 0 }]));
  for (const item of m.items) {
    const byskill: Partial<Record<Skill, (typeof cards)[string]>> = {};
    let itemDue = false;
    let leech = false;
    for (const s of m.skills) {
      const c = cards[`${item.id}|${s}`];
      if (!c) continue;
      byskill[s] = c;
      if (isDue(c, now)) itemDue = true;
      if (isLeech(c)) leech = true;
      if (c.state !== State.New) {
        const acc = skillAcc.get(s)!;
        acc.reviewed++;
        acc.sumR += retrievability(c, retention, now);
      }
    }
    status[itemStatus(byskill)]++;
    if (itemDue) due++;
    if (leech) leeches++;
  }
  return {
    total: m.items.length,
    status,
    due,
    leeches,
    skills: m.skills.map(skill => {
      const a = skillAcc.get(skill)!;
      return { skill, reviewed: a.reviewed, avgR: a.reviewed ? a.sumR / a.reviewed : 0 };
    }),
  };
}
