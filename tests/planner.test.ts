import { describe, expect, test } from "vitest";
import builtIn from "@/modules";
import { normalizeModule } from "@/lib/module";
import { buildPractice, type CardMap } from "@/lib/exercises";
import { chooseExercise, forecast, introducedToday, planSession } from "@/lib/planner";
import { Rating, review, State } from "@/lib/srs";
import type { ReviewLog } from "@/lib/store";

const hsk2 = normalizeModule(builtIn.find(d => d.id === "hsk2")!);
const settings = { sessionSize: 20, newPerDay: 10, retention: 0.9 };
const NOW = new Date("2026-10-21T10:00:00").getTime();

describe("planer sesji", () => {
  test("nowy użytkownik: prezentacja → rozpoznawanie → przypominanie, z odstępami", () => {
    const plan = planSession(hsk2, { pool: hsk2.items, cards: {}, logs: [], settings, now: NOW });
    expect(plan.fresh).toBe(6); // 20 miejsc / 3 zadania na słowo
    const qs = plan.questions;
    expect(qs.length).toBe(18);
    for (const item of hsk2.items.slice(0, 6)) {
      const idx = qs.map((q, i) => (q.itemIds.includes(item.id) ? i : -1)).filter(i => i >= 0);
      expect(qs[idx[0]].kind).toBe("intro");
      expect(idx.length).toBe(3);
      expect(idx[1] - idx[0]).toBeGreaterThanOrEqual(2);
      expect(idx[2] - idx[1]).toBeGreaterThanOrEqual(2);
    }
  });

  test("limit nowych słów dziennie", () => {
    const logs: ReviewLog[] = hsk2.items.slice(0, 9).map(i => ({ t: NOW - 1000, m: "hsk2", i: i.id, s: "recognition", g: Rating.Good, st: State.New }));
    expect(introducedToday(logs, "hsk2", NOW)).toBe(9);
    const plan = planSession(hsk2, { pool: hsk2.items, cards: {}, logs, settings, now: NOW });
    expect(plan.fresh).toBe(1);
  });

  test("zaległe powtórki mają pierwszeństwo, umiejętności odblokowują się stopniowo", () => {
    const cards: CardMap = {};
    const item = hsk2.items[0];
    let c = review(undefined, Rating.Good, 0.9, NOW - 30 * 864e5);
    while (c.state !== State.Review) c = review(c, Rating.Good, 0.9, c.due);
    cards[`${item.id}|recognition`] = { ...c, due: NOW - 1000 };
    const plan = planSession(hsk2, { pool: hsk2.items, cards, logs: [], settings, now: NOW });
    expect(plan.due).toBe(1);
    // rozpoznawanie utrwalone → odblokowane przypominanie, wymowa i słuch (ale nie zdania)
    expect(plan.unlocked).toBe(3);
    const skills = plan.questions.filter(q => q.itemIds[0] === item.id).map(q => q.skill);
    expect(skills).toContain("recognition");
    expect(skills).not.toContain("context");
  });

  test("forma ćwiczenia rośnie z siłą pamięci", () => {
    const weak = { ...review(undefined, Rating.Good, 0.9, 0), stability: 1 };
    const strong = { ...weak, stability: 20, state: State.Review };
    expect(chooseExercise(hsk2, "reading", weak).type).toBe("choice");
    expect(chooseExercise(hsk2, "reading", strong).type).toBe("typing");
    expect(chooseExercise(hsk2, "recognition", strong).type).toBe("flashcards");
  });

  test("prognoza powtórek", () => {
    const c = { ...review(undefined, Rating.Good, 0.9, NOW), state: State.Review, due: NOW + 2 * 864e5 };
    expect(forecast({ a: c }, 7, NOW)[2]).toBe(1);
  });
});

describe("budowanie ćwiczeń", () => {
  test("każde dostępne ćwiczenie HSK 2 tworzy pytania", () => {
    const ctx = { pool: hsk2.items, cards: {}, examStats: {}, count: 10, retention: 0.9 };
    for (const cfg of hsk2.exercises) {
      const qs = buildPractice(hsk2, cfg, ctx);
      expect(qs.length, cfg.type).toBeGreaterThan(0);
    }
  });

  test("tony: opcje mają tyle sylab co słowo i zawierają poprawny wzór", () => {
    const qs = buildPractice(hsk2, { type: "tones" }, { pool: hsk2.items, cards: {}, examStats: {}, count: 30, retention: 0.9 });
    for (const q of qs) {
      if (q.kind !== "tones") throw new Error();
      expect(q.options.length).toBe(4);
      expect(q.options.map(o => o.join())).toContain(q.pattern.join());
      for (const o of q.options) expect(o.length).toBe(q.pattern.length);
    }
  });
});
