"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Eye, Lightbulb, Snail, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ItemCard } from "@/components/study/item-card";
import { FieldText } from "@/components/study/term";
import { OptionGrid } from "@/components/study/options";
import { SpeakButton, useSpeak } from "@/components/study/speak-button";
import { useHotkeys } from "@/components/study/hooks";
import { Pinyin, ToneContour, TONE_CLASS } from "@/components/study/pinyin";
import { useStore } from "@/lib/store";
import { cardKey, previewIntervals, Rating, type Grade } from "@/lib/srs";
import { compareSyllables, pinyinMatches, splitSyllables, syllableTarget } from "@/lib/pinyin";
import { answerMatches, formatInterval, shuffle } from "@/lib/utils";
import { skillFor } from "@/lib/exercises";
import { cn } from "@/lib/cn";
import type { ExerciseProps } from "./types";
import { Prompt, VoiceWarning } from "./common";

/** Prezentacja nowego słowa przed pierwszym pytaniem o nie. */
export function IntroExercise({ q, m, onAnswer, answered }: ExerciseProps<"intro">) {
  const autoSpeak = useStore(s => s.settings.autoSpeak);
  const say = useSpeak(m.lang);
  useEffect(() => {
    if (autoSpeak) say(q.item.term);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const next = () => !answered && onAnswer({ correct: true, skipRecord: true });
  useHotkeys(e => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      next();
    }
  });
  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <Badge variant="warning">Nowe słowo</Badge>
      </div>
      <ItemCard m={m} item={q.item} big className="border-dashed" />
      <p className="text-center text-sm text-muted-foreground">Przyjrzyj się, posłuchaj i powiedz na głos. Za chwilę o nie zapytam.</p>
      <div className="flex justify-center">
        <Button size="lg" onClick={next}>
          Zapamiętane <ArrowRight />
        </Button>
      </div>
    </div>
  );
}

const GRADES: { grade: Grade; label: string; className: string }[] = [
  { grade: Rating.Again, label: "Nie pamiętam", className: "border-destructive/50 text-destructive hover:bg-destructive/10" },
  { grade: Rating.Hard, label: "Trudne", className: "border-warning/60 text-amber-700 hover:bg-warning/15 dark:text-warning" },
  { grade: Rating.Good, label: "Dobrze", className: "border-success/50 text-success hover:bg-success/10" },
  { grade: Rating.Easy, label: "Łatwe", className: "border-primary/50 text-primary hover:bg-primary/10" },
];

export function FlashcardExercise({ q, m, onAnswer, answered }: ExerciseProps<"flashcards">) {
  const [flipped, setFlipped] = useState(false);
  const skill = skillFor({ type: "flashcards", front: q.front })!;
  const card = useStore(s => s.cards[m.id]?.[cardKey(q.item.id, skill)]);
  const retention = useStore(s => s.settings.retention);
  const autoSpeak = useStore(s => s.settings.autoSpeak);
  const say = useSpeak(m.lang);
  const [now] = useState(() => Date.now());
  const intervals = useMemo(() => previewIntervals(card, retention, now), [card, retention, now]);

  useEffect(() => {
    if (q.front === "term" && autoSpeak) say(q.item.term);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flip = () => {
    if (flipped) return;
    setFlipped(true);
    if (q.front !== "term" && autoSpeak) say(q.item.term);
  };
  const grade = (g: Grade) => !answered && onAnswer({ correct: g > Rating.Again, grade: g });

  useHotkeys(e => {
    if (!flipped && (e.key === " " || e.key === "Enter")) {
      e.preventDefault();
      flip();
    } else if (flipped && ["1", "2", "3", "4"].includes(e.key)) {
      e.preventDefault();
      grade(Number(e.key) as Grade);
    }
  });

  return (
    <div className="space-y-4">
      <motion.button
        type="button"
        data-flashcard
        onClick={flip}
        className={cn(
          "flex min-h-56 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 bg-card p-6 text-center outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
          !flipped && "cursor-pointer hover:border-primary/50",
        )}
        animate={{ rotateX: flipped ? [0, 8, 0] : 0 }}
      >
        <div className="flex flex-wrap items-center justify-center gap-3">
          <FieldText m={m} item={q.item} field={q.front} className={q.front === "term" ? "text-6xl" : "text-2xl font-semibold"} />
          {q.front === "term" && <SpeakButton text={q.item.term} lang={m.lang} />}
        </div>
        {!flipped ? (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Eye className="size-4" /> Przypomnij sobie {q.front === "term" ? "znaczenie" : "słowo"} i odkryj kartę (spacja)
          </span>
        ) : (
          <ItemCard m={m} item={q.item} className="w-full border-0 bg-muted/40" />
        )}
      </motion.button>
      {flipped && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {GRADES.map((g, i) => (
            <Button key={g.grade} data-grade={g.grade} variant="outline" className={cn("h-auto flex-col gap-0.5 py-2.5", g.className)} onClick={() => grade(g.grade)}>
              <span>
                {i + 1} · {g.label}
              </span>
              <span className="text-xs font-normal opacity-75">{formatInterval(intervals[g.grade])}</span>
            </Button>
          ))}
        </motion.div>
      )}
    </div>
  );
}

export function ChoiceExercise({ q, m, onAnswer, answered }: ExerciseProps<"choice">) {
  const autoSpeak = useStore(s => s.settings.autoSpeak);
  const say = useSpeak(m.lang);
  useEffect(() => {
    if (q.from === "term" && autoSpeak) say(q.item.term);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const bigOption = q.to === "term" && m.script === "zh";
  return (
    <div className="space-y-5">
      <Prompt label={`Wybierz: ${m.labels[q.to].toLowerCase()}`}>
        <FieldText m={m} item={q.item} field={q.from} className={q.from === "term" ? "text-6xl" : "text-2xl font-semibold"} />
        {q.from === "term" && <SpeakButton text={q.item.term} lang={m.lang} />}
      </Prompt>
      <OptionGrid
        options={q.options.map(o => <FieldText key={o.id} m={m} item={o} field={q.to} className={bigOption ? "text-2xl" : ""} />)}
        correctIndex={q.options.indexOf(q.item)}
        disabled={answered}
        onPick={correct => {
          if (q.from !== "term" && autoSpeak) say(q.item.term);
          onAnswer({ correct, reveal: <ItemCard m={m} item={q.item} /> });
        }}
      />
    </div>
  );
}

function SyllableFeedback({ input, expected, term }: { input: string; expected: string; term: string }) {
  const verdicts = compareSyllables(input, expected, term);
  if (!verdicts) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {verdicts.map((v, i) => (
        <span
          key={i}
          className={cn(
            "rounded-md border px-2 py-1 text-sm",
            v.status === "ok" && "border-success/40 bg-success/10",
            v.status === "tone" && "border-warning/60 bg-warning/15",
            v.status === "wrong" && "border-destructive/40 bg-destructive/10",
          )}
        >
          <span className={TONE_CLASS[v.expected.tone]}>{v.expected.text}</span>
          {v.status === "tone" && (
            <span className="ml-1 text-xs text-muted-foreground">
              (wpisano ton {v.given?.tone || "neutralny"}, jest {v.expected.tone || "neutralny"})
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

export function TypingExercise({ q, m, onAnswer, answered }: ExerciseProps<"typing">) {
  const [value, setValue] = useState("");
  const [hint, setHint] = useState(false);
  const [result, setResult] = useState<boolean | null>(null);
  const ignoreTones = useStore(s => s.settings.ignoreTones);
  const autoSpeak = useStore(s => s.settings.autoSpeak);
  const say = useSpeak(m.lang);
  const inputRef = useRef<HTMLInputElement>(null);
  const isPinyin = q.to === "reading" && m.isPinyin;
  const expected = q.item[q.to];

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  const hintText = useMemo(() => {
    if (isPinyin) {
      const syl = splitSyllables(expected, syllableTarget(q.item.term, expected));
      return syl ? `${syl.map(s => s.base.replace("v", "ü")).join(" ")} – brakuje tylko tonów` : expected[0] + "…";
    }
    return `${expected.slice(0, 1)}${"·".repeat(Math.max(0, Math.min(expected.length, 12) - 1))}`;
  }, [isPinyin, expected, q.item.term]);

  const finish = (ok: boolean, given: string) => {
    setResult(ok);
    if (isPinyin && autoSpeak) say(q.item.term);
    onAnswer({
      correct: ok,
      hint,
      note:
        isPinyin && given ? (
          <SyllableFeedback input={given} expected={expected} term={q.item.term} />
        ) : !ok && given ? (
          `Twoja odpowiedź: ${given}`
        ) : null,
      reveal: <ItemCard m={m} item={q.item} />,
    });
  };

  const check = () => {
    const v = value.trim();
    if (!v || answered) return;
    finish(isPinyin ? pinyinMatches(v, expected, { ignoreTones }) : answerMatches(v, expected), v);
  };

  return (
    <div className="space-y-5">
      <Prompt label={`Wpisz: ${m.labels[q.to].toLowerCase()}`}>
        <FieldText m={m} item={q.item} field={q.from} className={q.from === "term" ? "text-6xl" : "text-2xl font-semibold"} />
        {q.from === "term" && !isPinyin && <SpeakButton text={q.item.term} lang={m.lang} />}
      </Prompt>
      <form
        className="mx-auto flex max-w-lg flex-wrap justify-center gap-2"
        onSubmit={e => {
          e.preventDefault();
          check();
        }}
      >
        <Input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          disabled={answered}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder={isPinyin ? (ignoreTones ? "np. nihao" : "np. ni3hao3 lub nǐhǎo") : `${m.labels[q.to]}…`}
          aria-label={m.labels[q.to]}
          className={cn("h-12 flex-1 text-lg", result === true && "border-success bg-success/10", result === false && "border-destructive bg-destructive/10")}
        />
        <Button type="submit" size="lg" disabled={answered}>
          Sprawdź
        </Button>
      </form>
      <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
        {!answered &&
          (hint ? (
            <span className="rounded-md bg-muted px-2 py-1 font-mono">{hintText}</span>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setHint(true)}>
              <Lightbulb /> Podpowiedź
            </Button>
          ))}
        {!answered && (
          <Button variant="ghost" size="sm" onClick={() => finish(false, "")}>
            Nie wiem
          </Button>
        )}
      </div>
      {isPinyin && !answered && (
        <p className="text-center text-xs text-muted-foreground">
          {ignoreTones ? "Tony są ignorowane (zmienisz to w ustawieniach)." : "Podawaj tony słownikowe (你好 = ni3hao3). Ton neutralny można pominąć, „ü” wpisz jako „v”."}
        </p>
      )}
    </div>
  );
}

export function MatchingExercise({ q, m, onAnswer, answered }: ExerciseProps<"matching">) {
  const [left] = useState(() => shuffle(q.items));
  const [right] = useState(() => shuffle(q.items));
  const [selected, setSelected] = useState<{ id: string; side: "L" | "R" } | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [shake, setShake] = useState<string[]>([]);
  const say = useSpeak(m.lang);

  const choose = (id: string, side: "L" | "R") => {
    if (answered || matched.has(id)) return;
    if (side === "L") say(q.items.find(i => i.id === id)!.term);
    if (!selected || selected.side === side) {
      setSelected({ id, side });
      return;
    }
    setSelected(null);
    if (selected.id === id) {
      const next = new Set(matched).add(id);
      setMatched(next);
      if (next.size === q.items.length) {
        const mistakes = errors.size;
        onAnswer({
          correct: mistakes === 0,
          results: q.items.map(i => ({ id: i.id, correct: !errors.has(i.id) })),
          note: mistakes === 0 ? "Bez pomyłek!" : `Pomyłki przy ${mistakes} słowach`,
          reveal: (
            <div className="grid gap-1 text-sm">
              {q.items.map(i => (
                <div key={i.id} className={cn("flex flex-wrap items-baseline gap-2", errors.has(i.id) && "text-destructive")}>
                  <FieldText m={m} item={i} field="term" className="text-lg" />
                  {i.reading && <FieldText m={m} item={i} field="reading" />}
                  <span>— {i.meaning}</span>
                </div>
              ))}
            </div>
          ),
        });
      }
    } else {
      setErrors(new Set(errors).add(id).add(selected.id));
      setShake([`${side}${id}`, `${selected.side}${selected.id}`]);
      setTimeout(() => setShake([]), 450);
    }
  };

  const tile = (id: string, side: "L" | "R", content: React.ReactNode) => (
    <button
      key={id}
      type="button"
      data-tile={side}
      onClick={() => choose(id, side)}
      disabled={matched.has(id) || answered}
      className={cn(
        "min-h-14 cursor-pointer rounded-xl border-2 bg-card px-3 py-2 text-sm transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        selected?.id === id && selected.side === side && "border-primary bg-primary/10",
        matched.has(id) && "cursor-default border-success/50 bg-success/10 opacity-50",
        shake.includes(`${side}${id}`) && "animate-shake border-destructive",
      )}
    >
      {content}
    </button>
  );

  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-muted-foreground">Kliknij słowo z lewej i pasujące znaczenie z prawej</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">{left.map(i => tile(i.id, "L", <FieldText m={m} item={i} field="term" className={m.script === "zh" ? "text-2xl" : ""} />))}</div>
        <div className="flex flex-col gap-2">{right.map(i => tile(i.id, "R", i.meaning))}</div>
      </div>
    </div>
  );
}

function Player({ onPlay, onSlow }: { onPlay: () => void; onSlow?: () => void }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Button size="lg" onClick={onPlay}>
        <Volume2 /> Odtwórz
      </Button>
      {onSlow && (
        <Button size="lg" variant="outline" onClick={onSlow}>
          <Snail /> Wolniej
        </Button>
      )}
    </div>
  );
}

export function ListeningExercise({ q, m, onAnswer, answered }: ExerciseProps<"listening">) {
  const say = useSpeak(m.lang);
  const [peek, setPeek] = useState(false);
  const play = (slow = false) => say(q.item.term, slow ? { rate: 0.6 } : {});
  useEffect(() => {
    const t = setTimeout(() => play(), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useHotkeys(e => {
    if (e.key === " ") {
      e.preventDefault();
      play();
    }
  }, !answered);
  return (
    <div className="space-y-5">
      <VoiceWarning lang={m.lang} />
      <Prompt label="Co słyszysz?">
        <Player onPlay={() => play()} onSlow={() => play(true)} />
      </Prompt>
      <div className="flex justify-center">
        {peek ? (
          <span className="text-muted-foreground">{q.item.reading || q.item.term}</span>
        ) : (
          !answered && (
            <Button variant="ghost" size="sm" onClick={() => setPeek(true)}>
              Nie słyszę – pokaż zapis
            </Button>
          )
        )}
      </div>
      <OptionGrid
        options={q.options.map(o => <FieldText key={o.id} m={m} item={o} field="term" className={m.script === "zh" ? "text-2xl" : ""} />)}
        correctIndex={q.options.indexOf(q.item)}
        disabled={answered}
        onPick={correct => onAnswer({ correct, hint: peek, reveal: <ItemCard m={m} item={q.item} /> })}
      />
    </div>
  );
}

function PatternLabel({ pattern }: { pattern: number[] }) {
  return (
    <span className="flex items-center gap-1">
      {pattern.map((t, i) => (
        <span key={i} className="flex flex-col items-center">
          <ToneContour tone={t} />
          <span className={cn("text-xs font-bold", TONE_CLASS[t])}>{t || "·"}</span>
        </span>
      ))}
    </span>
  );
}

/** Trening percepcji tonów: słuchasz słowa i wybierasz jego wzór tonów (z wizualizacją konturu). */
export function TonesExercise({ q, m, onAnswer, answered }: ExerciseProps<"tones">) {
  const say = useSpeak(m.lang);
  const play = (slow = false) => say(q.item.term, slow ? { rate: 0.6 } : {});
  useEffect(() => {
    const t = setTimeout(() => play(), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useHotkeys(e => {
    if (e.key === " ") {
      e.preventDefault();
      play();
    }
  }, !answered);
  const sandhi = q.pattern.some((t, i) => t === 3 && q.pattern[i + 1] === 3);
  return (
    <div className="space-y-5">
      <VoiceWarning lang={m.lang} />
      <Prompt label="Jakie tony słyszysz? (podaj tony słownikowe)">
        <Player onPlay={() => play()} onSlow={() => play(true)} />
      </Prompt>
      <OptionGrid
        options={q.options.map((p, i) => <PatternLabel key={i} pattern={p} />)}
        correctIndex={q.options.findIndex(p => p.join() === q.pattern.join())}
        disabled={answered}
        onPick={correct =>
          onAnswer({
            correct,
            note: sandhi ? "Uwaga: dwa trzecie tony obok siebie – w mowie pierwszy brzmi jak drugi (sandhi), ale zapisuje się 3-3." : null,
            reveal: (
              <div className="space-y-2">
                <ItemCard m={m} item={q.item} />
                {m.isPinyin && (
                  <p className="text-sm text-muted-foreground">
                    Tony: <Pinyin text={q.item.reading} term={q.item.term} /> → {q.pattern.map(t => t || "·").join(" – ")}
                  </p>
                )}
              </div>
            ),
          })
        }
      />
    </div>
  );
}
