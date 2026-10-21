"use client";

import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { speak, ttsSupported } from "@/lib/tts";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/cn";

export function useSpeak(lang?: string) {
  const rate = useStore(s => s.settings.speechRate);
  return (text: string, opts: { rate?: number; pitch?: number; queue?: boolean } = {}) =>
    lang && speak(text, { lang, rate: (opts.rate ?? 1) * rate, pitch: opts.pitch, queue: opts.queue });
}

export function SpeakButton({ text, lang, className, size = "icon" }: { text: string; lang?: string; className?: string; size?: "icon" | "sm" }) {
  const say = useSpeak(lang);
  if (!lang || (typeof window !== "undefined" && !ttsSupported())) return null;
  return (
    <Button
      type="button"
      variant="outline"
      size={size === "sm" ? "sm" : "icon"}
      className={cn("rounded-full", size === "sm" && "size-7 p-0", className)}
      title="Odtwórz wymowę"
      aria-label="Odtwórz wymowę"
      onClick={e => {
        e.stopPropagation();
        say(text);
      }}
    >
      <Volume2 />
    </Button>
  );
}
