// Synteza mowy przeglądarki (Web Speech API) – używana do wymowy słówek i nagrań w ćwiczeniach ze słuchu.
const synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
let voices = [];

function loadVoices() {
  if (synth) voices = synth.getVoices();
}
if (synth) {
  loadVoices();
  synth.addEventListener?.('voiceschanged', loadVoices);
}

export const ttsSupported = () => !!synth;

export function findVoice(lang) {
  if (!synth || !lang) return null;
  loadVoices();
  const want = lang.toLowerCase();
  const base = want.split('-')[0];
  const norm = v => v.lang.toLowerCase().replace('_', '-');
  return voices.find(v => norm(v) === want) || voices.find(v => norm(v).startsWith(base)) || null;
}

// null = nie wiadomo (lista głosów jeszcze się nie wczytała), true/false = wiadomo
export function voiceAvailable(lang) {
  if (!synth) return false;
  loadVoices();
  if (!voices.length) return null;
  return !!findVoice(lang);
}

export function speak(text, { lang, rate = 1, pitch = 1, queue = false, onend } = {}) {
  if (!synth || !text) return;
  if (!queue) synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  if (lang) u.lang = lang;
  const voice = findVoice(lang);
  if (voice) u.voice = voice;
  u.rate = rate;
  u.pitch = pitch;
  if (onend) u.onend = onend;
  synth.speak(u);
}

export function stop() {
  synth?.cancel();
}
