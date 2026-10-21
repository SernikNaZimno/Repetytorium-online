"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, FileUp } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageLoading } from "@/components/layout/page-loading";
import { useHydrated, useStore } from "@/lib/store";
import type { ModuleDef, RawItem } from "@/lib/types";

const LANGS = [
  ["none", "brak (bez wymowy)"],
  ["en-US", "angielski"],
  ["de-DE", "niemiecki"],
  ["es-ES", "hiszpański"],
  ["fr-FR", "francuski"],
  ["it-IT", "włoski"],
  ["ru-RU", "rosyjski"],
  ["uk-UA", "ukraiński"],
  ["zh-CN", "chiński"],
  ["ja-JP", "japoński"],
  ["ko-KR", "koreański"],
  ["pl-PL", "polski"],
];

const EXAMPLE = `apple ; ˈæpəl ; jabłko
house ; haʊs ; dom
to borrow ; ˈbɒrəʊ ; pożyczać (od kogoś)
weather ; ˈweðə ; pogoda`;

export function parseItems(text: string): RawItem[] {
  return text
    .split("\n")
    .map(line => line.trim())
    .filter(line => line && !line.startsWith("#"))
    .map(line => line.split(line.includes("\t") ? "\t" : /\s*[;|]\s*/).map(p => p.trim()))
    .filter(parts => parts.length >= 2 && parts[0])
    .map(parts => (parts.length >= 3 ? [parts[0], parts[1], parts.slice(2).join("; ")] : [parts[0], parts[1]]) as RawItem);
}

const itemsToText = (items: RawItem[]) =>
  items.map(it => (Array.isArray(it) ? it : [it.term, it.reading, it.meaning].filter(x => x != null)).join(" ; ")).join("\n");

export function CreateView() {
  const params = useSearchParams();
  const hydrated = useHydrated();
  const custom = useStore(s => s.custom);
  if (!hydrated) return <PageLoading />;
  const existing = custom.find(m => m.id === params.get("id"));
  return <CreateForm key={existing?.id ?? "new"} existing={existing} />;
}

function CreateForm({ existing }: { existing?: ModuleDef }) {
  const router = useRouter();
  const save = useStore(s => s.saveCustomModule);
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [icon, setIcon] = useState(existing?.icon ?? "📗");
  const [lang, setLang] = useState(existing?.lang || "none");
  const [labels, setLabels] = useState({ term: "Słowo", reading: "Wymowa", meaning: "Znaczenie", ...(existing?.labels ?? {}) });
  const [pinyin, setPinyin] = useState(existing?.readingType === "pinyin");
  const [text, setText] = useState(existing ? itemsToText(existing.items) : "");
  const [error, setError] = useState("");
  const parsed = parseItems(text);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError("Podaj nazwę modułu.");
    if (parsed.length < 4) return setError("Dodaj co najmniej 4 pozycje (jedna na linię).");
    const id = existing?.id ?? `custom-${Date.now().toString(36)}`;
    const l = lang === "none" ? "" : lang;
    save({
      ...(existing ?? {}),
      id,
      title: title.trim(),
      description: description.trim(),
      subtitle: `${parsed.length} pozycji · moduł własny`,
      icon: icon.trim() || "📗",
      color: existing?.color ?? "#7c5cd6",
      lang: l,
      script: l.startsWith("zh") ? "zh" : "",
      readingType: pinyin ? "pinyin" : "",
      labels,
      items: parsed,
    });
    toast.success(existing ? "Zapisano zmiany" : "Moduł utworzony");
    router.push(`/module/?id=${encodeURIComponent(id)}`);
  };

  const importFile = async (file: File) => {
    try {
      const def = JSON.parse(await file.text()) as ModuleDef;
      if (!def.title || !Array.isArray(def.items) || def.items.length < 4) throw new Error("plik musi zawierać pola „title” i „items” (co najmniej 4 pozycje)");
      const id = def.id?.startsWith("custom-") ? def.id : `custom-${Date.now().toString(36)}`;
      save({ ...def, id });
      toast.success(`Zaimportowano „${def.title}”`);
      router.push(`/module/?id=${encodeURIComponent(id)}`);
    } catch (err) {
      setError(`Nie udało się wczytać pliku: ${(err as Error).message}`);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={existing ? `/module/?id=${encodeURIComponent(existing.id)}` : "/"}>
          <ArrowLeft /> Wróć
        </Link>
      </Button>
      <h1 className="text-2xl font-bold tracking-tight">{existing ? "Edytuj moduł" : "Nowy moduł"}</h1>
      <Card>
        <form className="space-y-5" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-[1fr_6rem]">
            <div className="space-y-2">
              <Label htmlFor="title">Nazwa</Label>
              <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="np. Angielski – rozdział 3" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon">Ikona</Label>
              <Input id="icon" value={icon} maxLength={4} onChange={e => setIcon(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Opis</Label>
            <Input id="desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="krótki opis (opcjonalnie)" />
          </div>
          <div className="space-y-2">
            <Label>Język wymowy (synteza mowy)</Label>
            <Select value={lang} onValueChange={setLang}>
              <SelectTrigger className="sm:w-72">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGS.map(([code, name]) => (
                  <SelectItem key={code} value={code}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {(["term", "reading", "meaning"] as const).map((f, i) => (
              <div key={f} className="space-y-2">
                <Label htmlFor={`l-${f}`}>Kolumna {i + 1}{f === "reading" ? " (opcjonalna)" : ""}</Label>
                <Input id={`l-${f}`} value={labels[f]} onChange={e => setLabels({ ...labels, [f]: e.target.value })} />
              </div>
            ))}
          </div>
          <Label className="font-normal">
            <Switch checked={pinyin} onCheckedChange={setPinyin} /> Kolumna 2 to pinyin (sprawdzanie tonów, kolorowanie, trening tonów)
          </Label>
          <div className="space-y-2">
            <Label htmlFor="items">Pozycje – jedna na linię</Label>
            <p className="text-xs text-muted-foreground">
              Format „słowo ; wymowa ; znaczenie” albo „słowo ; znaczenie”. Kolumny oddziel średnikiem, | lub tabulatorem – możesz wkleić dane prosto z arkusza.
            </p>
            <Textarea id="items" rows={12} value={text} onChange={e => setText(e.target.value)} placeholder={EXAMPLE} spellCheck={false} className="font-mono" />
            <p className="text-xs text-muted-foreground">
              Rozpoznano pozycji: {parsed.length}
              {parsed.length > 0 && parsed.length < 4 && " (potrzeba co najmniej 4)"}
            </p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2">
            {!existing && (
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                <FileUp /> Importuj plik JSON
              </Button>
            )}
            <Button type="submit">{existing ? "Zapisz zmiany" : "Utwórz moduł"}</Button>
          </div>
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={e => e.target.files?.[0] && importFile(e.target.files[0])} />
        </form>
      </Card>
    </div>
  );
}
