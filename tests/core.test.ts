import { describe, expect, test } from "vitest";
import { analyzePinyin, compareSyllables, pinyinMatches, splitSyllables, tonePattern } from "@/lib/pinyin";
import { answerMatches, distractors, normalizeText } from "@/lib/utils";
import { autoGrade, itemStatus, previewIntervals, Rating, retrievability, review, State } from "@/lib/srs";
import { normalizeModule, parseSentence } from "@/lib/module";

describe("pinyin", () => {
  test("zapis z cyframi i ze znakami tonów jest równoważny", () => {
    expect(pinyinMatches("ni3hao3", "nǐhǎo")).toBe(true);
    expect(pinyinMatches("ni3 hao3", "nǐ hǎo")).toBe(true);
    expect(pinyinMatches("lv3you2", "lǚyóu")).toBe(true);
    expect(pinyinMatches("lu:3you2", "lǚyóu")).toBe(true);
    expect(pinyinMatches("di4di", "dìdi")).toBe(true);
    expect(pinyinMatches("di4di5", "dìdi")).toBe(true);
    expect(pinyinMatches("di4yi1", "dì-yī")).toBe(true);
    expect(pinyinMatches("sui1ran2dan4shi4", "suīrán…dànshì")).toBe(true);
  });

  test("błędny ton lub sylaba nie przechodzi, chyba że tony są ignorowane", () => {
    expect(pinyinMatches("ni2hao3", "nǐhǎo")).toBe(false);
    expect(pinyinMatches("nihao", "nǐhǎo")).toBe(false);
    expect(pinyinMatches("nihao", "nǐhǎo", { ignoreTones: true })).toBe(true);
    expect(analyzePinyin("Běijīng")).toEqual({ base: "beijing", tones: "31" });
  });

  test("podział na sylaby", () => {
    const t = (p: string, n?: number) => splitSyllables(p, n)?.map(s => `${s.base}${s.tone}`).join(" ");
    expect(t("nǐhǎo")).toBe("ni3 hao3");
    expect(t("fángjiān", 2)).toBe("fang2 jian1");
    expect(t("gōnggòng qìchē", 4)).toBe("gong1 gong4 qi4 che1");
    expect(t("xiǎoshí", 2)).toBe("xiao3 shi2");
    expect(t("yìdiǎnr")).toBe("yi4 dianr3");
    expect(t("ni3hao3")).toBe("ni3 hao3");
    expect(t("dìdi", 2)).toBe("di4 di0");
    expect(tonePattern("zhǔnbèi", "准备")).toEqual([3, 4]);
    expect(tonePattern("suīrán…dànshì", "虽然…但是")).toEqual([1, 2, 4, 4]);
  });

  test("porównanie sylaba po sylabie wskazuje zły ton", () => {
    const r = compareSyllables("ni3hao2", "nǐhǎo", "你好")!;
    expect(r.map(x => x.status)).toEqual(["ok", "tone"]);
    const w = compareSyllables("ni3hai3", "nǐhǎo", "你好")!;
    expect(w.map(x => x.status)).toEqual(["ok", "wrong"]);
  });
});

describe("odpowiedzi tekstowe", () => {
  test("warianty, wielkość liter i polskie znaki", () => {
    expect(answerMatches("nosić", "nosić, ubierać (się)")).toBe(true);
    expect(answerMatches("ubierac sie", "nosić, ubierać (się)")).toBe(true);
    expect(answerMatches("lodz", "Łódź")).toBe(true);
    expect(answerMatches("Kraków", "Warszawa")).toBe(false);
    expect(normalizeText("  Zażółć  GĘŚLĄ! ")).toBe("zazolc gesla");
  });

  test("dystraktory są unikalne i różne od poprawnej odpowiedzi", () => {
    const items = [{ r: "jìn" }, { r: "jìn" }, { r: "wán" }, { r: "wán" }, { r: "a" }, { r: "b" }];
    for (let i = 0; i < 30; i++) {
      const keys = distractors(items, items[0], 3, x => x.r).map(x => x.r);
      expect(new Set(keys).size).toBe(keys.length);
      expect(keys).not.toContain("jìn");
    }
  });
});

describe("FSRS", () => {
  const DAY = 864e5;
  test("dobre odpowiedzi wydłużają odstępy, błąd je skraca", () => {
    let t = 0;
    let c = review(undefined, Rating.Good, 0.9, t);
    expect(c.state).toBe(State.Learning);
    // przejście kroków nauki
    for (let i = 0; i < 3 && c.state !== State.Review; i++) {
      t = c.due;
      c = review(c, Rating.Good, 0.9, t);
    }
    expect(c.state).toBe(State.Review);
    const first = c.due - t;
    t = c.due;
    c = review(c, Rating.Good, 0.9, t);
    expect(c.due - t).toBeGreaterThan(first);
    t = c.due;
    const lapsed = review(c, Rating.Again, 0.9, t);
    expect(lapsed.lapses).toBe(1);
    expect(lapsed.due - t).toBeLessThan(DAY);
  });

  test("wyższa docelowa retencja = krótsze odstępy", () => {
    let c = review(undefined, Rating.Easy, 0.9, 0);
    c = review(c, Rating.Good, 0.9, c.due);
    const lo = previewIntervals(c, 0.8, c.due)[Rating.Good];
    const hi = previewIntervals(c, 0.95, c.due)[Rating.Good];
    expect(hi).toBeLessThan(lo);
  });

  test("retrievability spada z czasem", () => {
    let c = review(undefined, Rating.Easy, 0.9, 0);
    c = review(c, Rating.Good, 0.9, c.due);
    expect(retrievability(c, 0.9, c.due)).toBeGreaterThan(0.8);
    expect(retrievability(c, 0.9, c.due + 365 * DAY)).toBeLessThan(retrievability(c, 0.9, c.due));
    expect(retrievability(undefined)).toBe(0);
  });

  test("automatyczna ocena", () => {
    expect(autoGrade({ correct: false, ms: 1000, kind: "choice" })).toBe(Rating.Again);
    expect(autoGrade({ correct: true, ms: 2000, kind: "choice" })).toBe(Rating.Good);
    expect(autoGrade({ correct: true, ms: 20000, kind: "choice" })).toBe(Rating.Hard);
    expect(autoGrade({ correct: true, ms: 1000, kind: "typing", hint: true })).toBe(Rating.Hard);
  });

  test("status słowa", () => {
    expect(itemStatus({})).toBe("new");
    const c = review(undefined, Rating.Good, 0.9, 0);
    expect(itemStatus({ recognition: c })).toBe("learning");
    const strong = { ...c, state: State.Review, stability: 30 };
    expect(itemStatus({ recognition: strong, recall: strong })).toBe("mastered");
    expect(itemStatus({ recognition: strong })).toBe("young");
  });
});

describe("moduły", () => {
  test("zdania: luka, części do układania i tekst", () => {
    const s = parseSentence(["我们 一起 去 商店 {吧} 。", "py", "pl"], "");
    expect(s.blank).toBe("吧");
    expect(s.text).toBe("我们一起去商店吧。");
    expect(s.chunks).toEqual(["我们", "一起", "去", "商店", "吧。"]);
    expect(parseSentence(["I {like} tea .", "", ""], " ").text).toBe("I like tea.");
  });

  test("domyślne ćwiczenia i umiejętności zależą od danych", () => {
    const m = normalizeModule({ id: "x", title: "X", items: [["a", "b"], ["c", "d"], ["e", "f"], ["g", "h"]] });
    const types = m.exercises.map(e => e.type);
    expect(types).toContain("typing");
    expect(types).not.toContain("listening");
    expect(m.skills).toEqual(["recognition", "recall"]);
  });
});
