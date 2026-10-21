// Synteza mowy przeglądarki (Web Speech API) – wymowa słówek i nagrania w ćwiczeniach ze słuchu.
let voices: SpeechSynthesisVoice[] = [];

const synth = () => (typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null);

function loadVoices() {
  const s = synth();
  if (s) voices = s.getVoices();
}

if (typeof window !== "undefined" && synth()) {
  loadVoices();
  synth()!.addEventListener?.("voiceschanged", loadVoices);
}

export const ttsSupported = () => !!synth();

export function findVoice(lang?: string): SpeechSynthesisVoice | null {
  if (!synth() || !lang) return null;
  loadVoices();
  const want = lang.toLowerCase();
  const base = want.split("-")[0];
  const norm = (v: SpeechSynthesisVoice) => v.lang.toLowerCase().replace("_", "-");
  return voices.find(v => norm(v) === want) || voices.find(v => norm(v).startsWith(base)) || null;
}

/** null = jeszcze nie wiadomo (lista głosów się nie wczytała) */
export function voiceAvailable(lang?: string): boolean | null {
  if (!synth()) return false;
  loadVoices();
  if (!voices.length) return null;
  return !!findVoice(lang);
}

export interface SpeakOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  queue?: boolean;
}

export function speak(text: string, { lang, rate = 1, pitch = 1, queue = false }: SpeakOptions = {}) {
  const s = synth();
  if (!s || !text) return;
  if (!queue) s.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/…/g, "，"));
  if (lang) u.lang = lang;
  const voice = findVoice(lang);
  if (voice) u.voice = voice;
  u.rate = rate;
  u.pitch = pitch;
  s.speak(u);
}

export function stopSpeech() {
  synth()?.cancel();
}
