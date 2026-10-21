"use client";

import { useRef } from "react";
import { Download, Trash2, Upload, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ConfirmButton } from "@/components/ui/alert-dialog";
import { PageLoading } from "@/components/layout/page-loading";
import { exportState, useHydrated, useStore, type Settings } from "@/lib/store";
import { findVoice, speak, ttsSupported } from "@/lib/tts";
import { dayKey } from "@/lib/utils";

function SliderRow({ label, hint, value, min, max, step, format, onChange }: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <Label>{label}</Label>
        <span className="text-sm font-semibold tabular-nums">{format(value)}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} aria-label={label} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SwitchRow({ k, label, hint }: { k: keyof Settings; label: string; hint?: string }) {
  const value = useStore(s => s.settings[k]) as boolean;
  const set = useStore(s => s.setSetting);
  return (
    <Label className="items-start justify-between gap-4 font-normal">
      <span>
        <span className="font-medium">{label}</span>
        {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
      </span>
      <Switch checked={value} onCheckedChange={v => set(k, v as never)} />
    </Label>
  );
}

export function SettingsView() {
  const hydrated = useHydrated();
  const s = useStore(st => st.settings);
  const set = useStore(st => st.setSetting);
  const importState = useStore(st => st.importState);
  const resetAll = useStore(st => st.resetAll);
  const fileRef = useRef<HTMLInputElement>(null);
  if (!hydrated) return <PageLoading />;

  const zhVoice = typeof window !== "undefined" ? findVoice("zh-CN") : null;

  const exportFile = () => {
    const blob = new Blob([exportState()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `repetytorium-${dayKey()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Ustawienia</h1>

      <Card className="gap-6">
        <div>
          <CardTitle>Powtórki (FSRS)</CardTitle>
          <CardDescription>Jak intensywnie aplikacja ma Cię odpytywać.</CardDescription>
        </div>
        <SliderRow
          label="Docelowa retencja"
          hint="Szansa, że w dniu powtórki będziesz pamiętać słowo. Wyżej = więcej powtórek, ale pewniejsza pamięć. 85–92% to rozsądny zakres; powyżej 95% liczba powtórek gwałtownie rośnie."
          value={s.retention}
          min={0.8}
          max={0.97}
          step={0.01}
          format={v => `${Math.round(v * 100)}%`}
          onChange={v => set("retention", v)}
        />
        <SliderRow
          label="Nowe słowa dziennie (na moduł)"
          hint="Każde nowe słowo to w kolejnych dniach kilka powtórek w każdej umiejętności – lepiej mniej, ale regularnie."
          value={s.newPerDay}
          min={0}
          max={40}
          step={1}
          format={v => String(v)}
          onChange={v => set("newPerDay", v)}
        />
        <SliderRow label="Zadań w sesji" value={s.sessionSize} min={5} max={60} step={5} format={v => String(v)} onChange={v => set("sessionSize", v)} />
        <SliderRow label="Cel dzienny (odpowiedzi)" value={s.dailyGoal} min={10} max={300} step={10} format={v => String(v)} onChange={v => set("dailyGoal", v)} />
      </Card>

      <Card className="gap-5">
        <CardTitle>Chiński i pinyin</CardTitle>
        <SwitchRow k="toneColors" label="Koloruj tony" hint="1. ton czerwony, 2. zielony, 3. niebieski, 4. fioletowy – wizualna wskazówka pomaga zapamiętać ton razem ze słowem." />
        <SwitchRow k="showSentencePinyin" label="Pokazuj pinyin pod zdaniami" />
        <SwitchRow k="ignoreTones" label="Ignoruj tony przy wpisywaniu pinyinu" hint="Np. „nihao” zostanie uznane za poprawne dla „nǐhǎo”. Nie polecamy – tony są częścią słowa." />
      </Card>

      <Card className="gap-5">
        <CardTitle>Wymowa</CardTitle>
        <SwitchRow k="autoSpeak" label="Automatycznie odtwarzaj wymowę" />
        <SliderRow label="Tempo mowy" value={s.speechRate} min={0.5} max={1.3} step={0.05} format={v => `${v.toFixed(2)}×`} onChange={v => set("speechRate", v)} />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => speak("你好，欢迎学习汉语！", { lang: "zh-CN", rate: s.speechRate })}>
            <Volume2 /> Test: chiński
          </Button>
          <Button variant="outline" onClick={() => speak("Dzień dobry!", { lang: "pl-PL", rate: s.speechRate })}>
            <Volume2 /> Test: polski
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {typeof window !== "undefined" && !ttsSupported()
            ? "Ta przeglądarka nie obsługuje syntezy mowy."
            : zhVoice
              ? `Głos chiński: ${zhVoice.name}`
              : "Nie wykryto chińskiego głosu (lista głosów mogła się jeszcze nie wczytać)."}
        </p>
      </Card>

      <Card className="gap-4">
        <div>
          <CardTitle>Dane</CardTitle>
          <CardDescription>Postępy są zapisywane tylko w tej przeglądarce. Zrób kopię, aby przenieść je na inne urządzenie.</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportFile}>
            <Download /> Eksportuj postępy
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload /> Importuj postępy
          </Button>
          <ConfirmButton
            title="Usunąć wszystkie dane?"
            description="Postępy, historia, ustawienia i własne moduły zostaną usunięte."
            confirmLabel="Usuń wszystko"
            onConfirm={() => {
              resetAll();
              toast.success("Dane usunięte");
            }}
          >
            <Button variant="ghost" className="text-destructive">
              <Trash2 /> Wyczyść wszystko
            </Button>
          </ConfirmButton>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={async e => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              importState(await file.text());
              toast.success("Postępy zostały wczytane");
            } catch (err) {
              toast.error(`Nie udało się wczytać pliku: ${(err as Error).message}`);
            }
          }}
        />
      </Card>
    </div>
  );
}
