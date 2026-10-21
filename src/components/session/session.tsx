"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Check, RotateCcw, Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ExerciseView, type Answer } from "@/components/exercises";
import { useHotkeys } from "@/components/study/hooks";
import { useStore } from "@/lib/store";
import { autoGrade, Rating } from "@/lib/srs";
import { stopSpeech } from "@/lib/tts";
import type { Question } from "@/lib/exercises";
import type { StudyModule } from "@/lib/types";
import { plural, shuffle } from "@/lib/utils";
import { cn } from "@/lib/cn";

interface Result {
  q: Question;
  correct: boolean;
}

/** Ile pytań później wraca słowo, na którym był błąd (ponowne odpytanie w tej samej sesji). */
const RETRY_GAP = 4;
const MAX_RETRIES = 2;

function retryCopy(q: Question): Question {
  const copy = { ...q, uid: `${q.uid}-r${(q.attempt ?? 0) + 1}`, attempt: (q.attempt ?? 0) + 1 } as Question;
  if ("options" in copy) (copy as { options: unknown[] }).options = shuffle(copy.options as unknown[]);
  return copy;
}

export function Session({
  m,
  title,
  initial,
  backHref,
  onRestart,
  passThreshold,
}: {
  m: StudyModule;
  title: string;
  initial: Question[];
  backHref: string;
  onRestart: () => Question[];
  passThreshold?: number;
}) {
  const [queue, setQueue] = useState(initial);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [fixed, setFixed] = useState(0);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const shownAt = useRef(0);
  const nextRef = useRef<HTMLButtonElement>(null);
  const recordReview = useStore(s => s.recordReview);
  const recordExam = useStore(s => s.recordExam);

  const q = queue[index];
  const finished = index >= queue.length;

  useEffect(() => {
    shownAt.current = Date.now();
    return () => stopSpeech();
  }, [index, queue]);

  useEffect(() => {
    if (answer) nextRef.current?.focus({ preventScroll: true });
  }, [answer]);

  const advance = () => {
    stopSpeech();
    setAnswer(null);
    setIndex(i => i + 1);
  };

  const handleAnswer = (a: Answer) => {
    if (!q || answer) return;
    if (a.skipRecord) return advance();
    const ms = Date.now() - shownAt.current;

    if (q.kind === "judge" || q.kind === "reply" || q.kind === "dialog") {
      recordExam(m.id, q.taskId, a.correct);
    } else if (q.skill) {
      if (a.grade) {
        recordReview(m.id, q.itemIds[0], q.skill, a.grade, ms);
      } else {
        const perItem = a.results ?? q.itemIds.map(id => ({ id, correct: a.correct }));
        const each = ms / Math.max(1, perItem.length);
        for (const r of perItem) recordReview(m.id, r.id, q.skill, autoGrade({ correct: r.correct, ms: each, kind: q.kind, hint: a.hint }), each);
      }
    }

    // Błąd → to samo słowo wraca za kilka pytań, aż do poprawnej odpowiedzi (najwyżej 2 razy).
    const failed = a.grade ? a.grade === Rating.Again : !a.correct;
    if (failed && q.skill && q.kind !== "matching" && (q.attempt ?? 0) < MAX_RETRIES) {
      setQueue(prev => {
        const copy = [...prev];
        copy.splice(Math.min(index + 1 + RETRY_GAP, copy.length), 0, retryCopy(q));
        return copy;
      });
    }
    if (!q.attempt) setResults(r => [...r, { q, correct: a.correct }]);
    else if (a.correct) setFixed(f => f + 1);

    if (a.grade) advance();
    else setAnswer(a);
  };

  useHotkeys(e => {
    if (e.key === "Enter") {
      e.preventDefault();
      advance();
    }
  }, !!answer);

  if (finished) {
    return (
      <Summary
        m={m}
        title={title}
        results={results}
        fixed={fixed}
        startedAt={startedAt}
        backHref={backHref}
        passThreshold={passThreshold}
        onRetryWrong={() => {
          const wrong = results.filter(r => !r.correct).map(r => retryCopy(r.q));
          setQueue(wrong.map(w => ({ ...w, attempt: 0 })));
          setResults([]);
          setFixed(0);
          setIndex(0);
          setStartedAt(Date.now());
        }}
        onRestart={() => {
          setQueue(onRestart());
          setResults([]);
          setFixed(0);
          setIndex(0);
          setStartedAt(Date.now());
        }}
      />
    );
  }

  const done = results.length;
  const ok = results.filter(r => r.correct).length;

  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" aria-label="Zakończ sesję">
          <Link href={backHref}>
            <X />
          </Link>
        </Button>
        <div className="min-w-0 flex-1 truncate font-semibold">{title}</div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground tabular-nums">
          {done > 0 && (
            <span className="hidden sm:inline">
              <span className="text-success">✓ {ok}</span> <span className="text-destructive">✗ {done - ok}</span>
            </span>
          )}
          <span>
            {Math.min(index + 1, queue.length)} / {queue.length}
          </span>
        </div>
      </div>
      <Progress value={(index / queue.length) * 100} />

      {/* bez animacji wyjścia – stara karta znika od razu, więc nie da się jej przypadkiem kliknąć */}
      <motion.div key={q.uid} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
          <Card className="gap-5 p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-center gap-2 empty:hidden">
              {q.section && <Badge variant="secondary">{q.section}</Badge>}
              {q.attempt ? <Badge variant="warning">Powtórka błędu</Badge> : null}
            </div>
            <ExerciseView q={q} m={m} answered={!!answer} onAnswer={handleAnswer} />

            {answer && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("space-y-3 rounded-xl p-4", answer.correct ? "bg-success/10" : "bg-destructive/10")}
              >
                <div className={cn("flex items-center gap-2 text-lg font-bold", answer.correct ? "text-success" : "text-destructive")}>
                  {answer.correct ? <Check className="size-5" /> : <X className="size-5" />}
                  {answer.correct ? (answer.hint ? "Dobrze (z podpowiedzią)" : "Dobrze!") : "Niestety, źle"}
                </div>
                {answer.note && <div className="text-sm">{answer.note}</div>}
                {answer.reveal}
                {!answer.correct && q.skill && q.kind !== "matching" && (q.attempt ?? 0) < MAX_RETRIES && (
                  <p className="text-xs text-muted-foreground">To słowo wróci za kilka pytań.</p>
                )}
                <div className="flex justify-end">
                  <Button ref={nextRef} data-next onClick={advance}>
                    Dalej <ArrowRight />
                  </Button>
                </div>
              </motion.div>
            )}
          </Card>
      </motion.div>
      <p className="hidden text-center text-xs text-muted-foreground sm:block">Skróty: 1–4 wybór odpowiedzi · Enter dalej · spacja odtwórz / odkryj</p>
    </div>
  );
}

function Summary({
  m,
  title,
  results,
  fixed,
  startedAt,
  backHref,
  passThreshold,
  onRetryWrong,
  onRestart,
}: {
  m: StudyModule;
  title: string;
  results: Result[];
  fixed: number;
  startedAt: number;
  backHref: string;
  passThreshold?: number;
  onRetryWrong: () => void;
  onRestart: () => void;
}) {
  const [minutes] = useState(() => Math.max(1, Math.round((Date.now() - startedAt) / 60000)));
  const graded = results.filter(r => r.q.kind !== "intro");
  const ok = graded.filter(r => r.correct).length;
  const pct = graded.length ? Math.round((ok / graded.length) * 100) : 100;
  const wrong = graded.filter(r => !r.correct);
  const sections = new Map<string, { ok: number; total: number }>();
  for (const r of graded) {
    if (!r.q.section) continue;
    const s = sections.get(r.q.section) ?? { ok: 0, total: 0 };
    s.total += 1;
    s.ok += Number(r.correct);
    sections.set(r.q.section, s);
  }
  const passed = passThreshold != null ? pct >= passThreshold * 100 : null;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card data-summary className="items-center gap-3 p-8 text-center">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="grid size-16 place-items-center rounded-full bg-primary/10 text-primary">
          <Trophy className="size-8" />
        </motion.div>
        <h2 className="text-xl font-bold">{passed == null ? "Koniec sesji" : passed ? "Zdane!" : "Jeszcze nie tym razem"}</h2>
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="text-5xl font-extrabold text-primary tabular-nums">{pct}%</div>
        <p className="text-sm text-muted-foreground">
          {ok} z {graded.length} poprawnie za pierwszym razem · ok. {minutes} {plural(minutes, "minuta", "minuty", "minut")}
          {fixed > 0 && ` · poprawione błędy: ${fixed}`}
        </p>
        {passThreshold != null && <p className="text-xs text-muted-foreground">Próg zaliczenia: {Math.round(passThreshold * 100)}%</p>}
        <Progress value={pct} className="max-w-xs" indicatorClassName={pct >= 60 ? "bg-success" : "bg-warning"} />
        {sections.size > 0 && (
          <div className="w-full max-w-sm divide-y text-sm">
            {[...sections].map(([name, s]) => (
              <div key={name} className="flex justify-between py-1.5">
                <span>{name}</span>
                <span className="tabular-nums">
                  {s.ok}/{s.total} · {Math.round((s.ok / s.total) * 100)}%
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {wrong.length > 0 && (
            <Button onClick={onRetryWrong}>
              <RotateCcw /> Powtórz błędne ({wrong.length})
            </Button>
          )}
          <Button variant={wrong.length ? "outline" : "default"} onClick={onRestart}>
            Następna sesja
          </Button>
          <Button asChild variant="ghost">
            <Link href={backHref}>Wróć do modułu</Link>
          </Button>
        </div>
      </Card>
      {wrong.length > 0 && (
        <Card>
          <h3 className="font-semibold">Do poprawy</h3>
          <ul className="list-disc space-y-1 pl-5">
            {wrong.map(r => (
              <li key={r.q.uid} className={cn(m.script === "zh" && "font-zh text-lg")}>
                {r.q.label}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
