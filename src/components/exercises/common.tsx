"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { ttsSupported, voiceAvailable } from "@/lib/tts";

export function Prompt({ children, label }: { children: React.ReactNode; label?: React.ReactNode }) {
  return (
    <div className="space-y-3">
      {label && <p className="text-center text-sm text-muted-foreground">{label}</p>}
      <div className="flex flex-wrap items-center justify-center gap-3 py-2 text-center">{children}</div>
    </div>
  );
}

export function VoiceWarning({ lang }: { lang?: string }) {
  const [state, setState] = useState<"ok" | "unsupported" | "missing">("ok");
  useEffect(() => {
    if (!lang) return;
    const check = () => setState(!ttsSupported() ? "unsupported" : voiceAvailable(lang) === false ? "missing" : "ok");
    const t = setTimeout(check, 400);
    return () => clearTimeout(t);
  }, [lang]);
  if (state === "ok") return null;
  return (
    <div className="flex gap-2 rounded-lg bg-warning/15 p-3 text-sm">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
      {state === "unsupported"
        ? "Ta przeglądarka nie obsługuje syntezy mowy. Możesz podejrzeć zapis nagrania."
        : `Nie znaleziono głosu dla języka ${lang}. Zainstaluj go w ustawieniach systemu („Zamiana tekstu na mowę”) albo użyj Chrome/Edge/Safari.`}
    </div>
  );
}
