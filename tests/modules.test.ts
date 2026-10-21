// Sprawdza poprawność danych we wszystkich wbudowanych modułach.
import { describe, expect, test } from "vitest";
import builtIn from "@/modules";
import { normalizeModule } from "@/lib/module";
import { analyzePinyin, syllableTarget, tonePattern } from "@/lib/pinyin";
import { EXERCISES } from "@/lib/exercises";

describe.each(builtIn.map(def => [def.id, def] as const))("%s", (_id, def) => {
  const m = normalizeModule(def);

  test("podstawowe pola i unikalne id", () => {
    expect(m.title).toBeTruthy();
    expect(m.items.length).toBeGreaterThanOrEqual(4);
    expect(new Set(builtIn.map(d => d.id)).size).toBe(builtIn.length);
    const terms = def.items.map(i => (Array.isArray(i) ? i[0] : (i.id ?? i.term)));
    expect(terms.filter((t, i) => terms.indexOf(t) !== i)).toEqual([]);
    for (const item of m.items) expect(item.meaning, item.term).toBeTruthy();
  });

  if (m.isPinyin) {
    test("pinyin: liczba sylab zgadza się z liczbą znaków", () => {
      for (const item of m.items) {
        expect(analyzePinyin(item.reading).base.length, item.term).toBeGreaterThan(0);
        const p = tonePattern(item.reading, item.term);
        expect(p?.length, `${item.term} (${item.reading})`).toBe(syllableTarget(item.term, item.reading));
      }
    });
  }

  if (def.sentences) {
    test("każde zdanie wskazuje istniejące słowo, każde słowo ma zdanie", () => {
      expect(m.sentences.length).toBe(def.sentences!.length);
      for (const s of m.sentences) {
        expect(s.blankIndex, s.text).toBeGreaterThanOrEqual(0);
        expect(s.reading && s.meaning, s.text).toBeTruthy();
        expect(m.byId.get(s.itemId)!.term.includes(s.blank!), s.text).toBe(true);
      }
      expect(m.items.filter(i => !m.sentencesByItem.has(i.id)).map(i => i.term)).toEqual([]);
    });
  }

  if (def.exam) {
    test("zadania egzaminacyjne są kompletne", () => {
      for (const j of m.exam.judge) expect(j.length).toBe(5);
      const answers = m.exam.replies.map(r => r[1]);
      expect(new Set(answers).size).toBe(answers.length);
      for (const d of m.exam.dialogs) {
        expect(d.lines.length).toBeGreaterThanOrEqual(2);
        expect(new Set(d.options).size).toBe(d.options.length);
        for (const [who] of d.lines) expect(["男", "女"]).toContain(who);
      }
    });
  }

  test("konfiguracja ćwiczeń", () => {
    for (const cfg of m.exercises) {
      expect(EXERCISES[cfg.type], cfg.type).toBeDefined();
      for (const s of cfg.sections || []) expect(EXERCISES[s.type]).toBeDefined();
    }
  });
});
