"use client";

import { useEffect, useState } from "react";
import { Languages, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OptionGrid } from "@/components/study/options";
import { SentenceView } from "@/components/study/item-card";
import { SpeakButton, useSpeak } from "@/components/study/speak-button";
import { useHotkeys } from "@/components/study/hooks";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/cn";
import type { ExerciseProps } from "./types";
import { Prompt, VoiceWarning } from "./common";

const PUNCT_START = /^[，。？！、：；,.?!:;]/;

export function FillExercise({ q, m, onAnswer, answered }: ExerciseProps<"fill">) {
  const [showMeaning, setShowMeaning] = useState(false);
  const [filled, setFilled] = useState<{ text: string; ok: boolean } | null>(null);
  const autoSpeak = useStore(s => s.settings.autoSpeak);
  const say = useSpeak(m.lang);
  const s = q.sentence;
  const zh = m.script === "zh";
  return (
    <div className="space-y-5">
      <Prompt label="Wybierz słowo pasujące do luki">
        <div lang={m.lang || undefined} className={cn("text-2xl leading-loose", zh && "font-zh text-3xl")}>
          {s.tokens.map((t, i) => (
            <span key={i}>
              {i > 0 && m.wordSeparator && !PUNCT_START.test(t) ? m.wordSeparator : ""}
              {i === s.blankIndex ? (
                <span
                  className={cn(
                    "mx-1 inline-block min-w-[2.5em] border-b-4 px-1 text-center",
                    !filled && "border-primary text-primary",
                    filled?.ok && "border-success text-success",
                    filled && !filled.ok && "border-destructive text-destructive",
                  )}
                >
                  {filled ? q.answer : " "}
                </span>
              ) : (
                t
              )}
            </span>
          ))}
        </div>
      </Prompt>
      <div className="flex justify-center">
        {showMeaning ? (
          <span className="text-sm text-muted-foreground">{s.meaning}</span>
        ) : (
          !answered &&
          s.meaning && (
            <Button variant="ghost" size="sm" onClick={() => setShowMeaning(true)}>
              <Languages /> Pokaż tłumaczenie
            </Button>
          )
        )}
      </div>
      <OptionGrid
        options={q.options.map(o => (
          <span key={o} className={cn(zh && "font-zh text-2xl")}>
            {o}
          </span>
        ))}
        correctIndex={q.options.indexOf(q.answer)}
        disabled={answered}
        onPick={correct => {
          setFilled({ text: q.answer, ok: correct });
          if (autoSpeak) say(s.text);
          onAnswer({ correct, hint: showMeaning, reveal: <SentenceView m={m} s={s} /> });
        }}
      />
    </div>
  );
}

export function OrderExercise({ q, m, onAnswer, answered }: ExerciseProps<"order">) {
  const [placed, setPlaced] = useState<number[]>([]);
  const [result, setResult] = useState<boolean | null>(null);
  const autoSpeak = useStore(s => s.settings.autoSpeak);
  const say = useSpeak(m.lang);
  const s = q.sentence;
  const sep = m.wordSeparator;
  const zh = m.script === "zh";

  const toggle = (i: number) => {
    if (answered) return;
    setPlaced(p => (p.includes(i) ? p.filter(x => x !== i) : [...p, i]));
  };
  const check = () => {
    if (answered || placed.length !== q.chunks.length) return;
    const given = placed.map(i => q.chunks[i]).join(sep);
    const ok = given === s.chunks.join(sep);
    setResult(ok);
    if (autoSpeak) say(s.text);
    onAnswer({ correct: ok, note: ok ? null : `Twoja wersja: ${given}`, reveal: <SentenceView m={m} s={s} /> });
  };
  useHotkeys(e => {
    if (e.key === "Enter") {
      e.preventDefault();
      check();
    } else if (e.key === "Backspace" && placed.length) {
      e.preventDefault();
      setPlaced(p => p.slice(0, -1));
    }
  }, !answered);

  const chip = (i: number) => (
    <button
      key={i}
      type="button"
      data-chip
      onClick={() => toggle(i)}
      className={cn("cursor-pointer rounded-lg border-2 bg-card px-3.5 py-2 text-lg shadow-xs transition-colors hover:border-primary/60", zh && "font-zh text-2xl")}
    >
      {q.chunks[i]}
    </button>
  );

  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-muted-foreground">Ułóż zdanie z rozsypanych słów</p>
      {s.meaning && <p className="text-center text-lg">„{s.meaning}”</p>}
      <div
        className={cn(
          "flex min-h-18 flex-wrap justify-center gap-2 rounded-xl border-2 border-dashed p-3",
          result === true && "border-success bg-success/10",
          result === false && "border-destructive bg-destructive/10",
        )}
      >
        {placed.map(chip)}
      </div>
      <div className="flex min-h-14 flex-wrap justify-center gap-2">{q.chunks.map((_, i) => (placed.includes(i) ? null : chip(i)))}</div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => setPlaced([])} disabled={answered || !placed.length}>
          <Undo2 /> Wyczyść
        </Button>
        <Button onClick={check} disabled={answered || placed.length !== q.chunks.length}>
          Sprawdź
        </Button>
      </div>
    </div>
  );
}

export function JudgeExercise({ q, m, onAnswer, answered }: ExerciseProps<"judge">) {
  const [text, statement, answer, meaning, statementMeaning] = q.task;
  const zh = m.script === "zh";
  return (
    <div className="space-y-5">
      <Prompt label="Czy zdanie ze ★ jest zgodne z tekstem?">
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2">
            <p lang={m.lang || undefined} className={cn("text-xl leading-relaxed", zh && "font-zh text-2xl")}>
              {text}
            </p>
            <SpeakButton text={text} lang={m.lang} size="sm" />
          </div>
          <p lang={m.lang || undefined} className={cn("text-lg font-semibold text-primary", zh && "font-zh text-xl")}>
            ★ {statement}
          </p>
        </div>
      </Prompt>
      <OptionGrid
        layout="two"
        options={["✓ 对 · prawda", "✗ 错 · fałsz"]}
        correctIndex={answer ? 0 : 1}
        disabled={answered}
        onPick={correct =>
          onAnswer({
            correct,
            reveal: (
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>{meaning}</p>
                <p>
                  ★ {statementMeaning} — <strong className="text-foreground">{answer ? "prawda" : "fałsz"}</strong>
                </p>
              </div>
            ),
          })
        }
      />
    </div>
  );
}

export function ReplyExercise({ q, m, onAnswer, answered }: ExerciseProps<"reply">) {
  const [question, answer, questionMeaning, answerMeaning] = q.task;
  const zh = m.script === "zh";
  return (
    <div className="space-y-5">
      <Prompt label="Która odpowiedź pasuje?">
        <p lang={m.lang || undefined} className={cn("text-2xl", zh && "font-zh text-3xl")}>
          {question}
        </p>
        <SpeakButton text={question} lang={m.lang} />
      </Prompt>
      <OptionGrid
        layout="list"
        options={q.options.map(p => (
          <span key={p[1]} className={cn(zh && "font-zh text-lg")}>
            {p[1]}
          </span>
        ))}
        correctIndex={q.options.indexOf(q.task)}
        disabled={answered}
        onPick={correct =>
          onAnswer({
            correct,
            reveal: (
              <div className="space-y-1 text-sm">
                <p>
                  <span className={cn(zh && "font-zh")}>{question}</span> <span className="text-muted-foreground">— {questionMeaning}</span>
                </p>
                <p>
                  <span className={cn(zh && "font-zh")}>{answer}</span> <span className="text-muted-foreground">— {answerMeaning}</span>
                </p>
              </div>
            ),
          })
        }
      />
    </div>
  );
}

// Głosy rozmówców różnią się wysokością (男 – niżej, 女 – wyżej).
const PITCH: Record<string, number> = { 男: 0.75, 女: 1.3 };

export function DialogExercise({ q, m, onAnswer, answered }: ExerciseProps<"dialog">) {
  const [peek, setPeek] = useState(false);
  const say = useSpeak(m.lang);
  const d = q.task;
  const zh = m.script === "zh";
  const play = () => {
    d.lines.forEach(([who, line], i) => say(line, { pitch: PITCH[who] ?? 1, queue: i > 0 }));
    say(`问：${d.question}`, { queue: true });
  };
  useHotkeys(e => {
    if (e.key === " ") {
      e.preventDefault();
      play();
    }
  }, !answered);
  useEffect(() => {
    const t = setTimeout(play, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const transcript = (
    <div className={cn("space-y-1 rounded-lg bg-muted/50 p-3 text-lg", zh && "font-zh")} lang={m.lang || undefined}>
      {d.lines.map(([who, line], i) => (
        <p key={i}>
          <strong>{who}：</strong>
          {line}
        </p>
      ))}
      <p>
        <strong>问：</strong>
        {d.question}
      </p>
    </div>
  );
  return (
    <div className="space-y-5">
      <VoiceWarning lang={m.lang} />
      <Prompt label="Posłuchaj nagrania i wybierz odpowiedź na pytanie">
        <Button size="lg" onClick={play}>
          ▶ Odtwórz nagranie
        </Button>
      </Prompt>
      <div className="flex justify-center">
        {peek && !answered ? (
          transcript
        ) : (
          !answered && (
            <Button variant="ghost" size="sm" onClick={() => setPeek(true)}>
              Pokaż tekst nagrania
            </Button>
          )
        )}
      </div>
      <OptionGrid
        options={q.options.map(o => (
          <span key={o} className={cn(zh && "font-zh text-xl")}>
            {o}
          </span>
        ))}
        correctIndex={q.options.indexOf(d.options[0])}
        disabled={answered}
        onPick={correct =>
          onAnswer({
            correct,
            reveal: (
              <div className="space-y-2">
                {transcript}
                <p className="text-sm text-muted-foreground">{d.meaning}</p>
              </div>
            ),
          })
        }
      />
    </div>
  );
}
