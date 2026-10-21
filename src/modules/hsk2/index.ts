import type { ModuleDef } from "@/lib/types";
import items from "./vocab";
import sentences from "./sentences";
import { judge, replies, dialogs } from "./exam";

const hsk2: ModuleDef = {
  id: 'hsk2',
  title: 'Chiński HSK 2',
  subtitle: 'Słownictwo HSK 2 + zadania egzaminacyjne',
  description:
    'Około 150 słów poziomu HSK 2 (wersja 2.0) z pinyinem i polskim tłumaczeniem, zdania przykładowe ' +
    'oraz zadania wzorowane na egzaminie: słuchanie dialogów, uzupełnianie zdań (选词填空), prawda/fałsz (判断对错) i dopasowywanie odpowiedzi.',
  icon: '二',
  color: '#d64545',
  lang: 'zh-CN',
  script: 'zh',
  readingType: 'pinyin',
  labels: { term: 'Znak', reading: 'Pinyin', meaning: 'Znaczenie' },
  groupSize: 15,
  items,
  sentences,
  exam: { judge, replies, dialogs },
  exercises: [
    { type: 'flashcards', front: 'term', title: 'Fiszki' },
    { type: 'flashcards', front: 'meaning', title: 'Fiszki odwrotne' },
    { type: 'choice', from: 'term', to: 'meaning', title: 'Znak → znaczenie' },
    { type: 'choice', from: 'meaning', to: 'term', title: 'Znaczenie → znak' },
    { type: 'choice', from: 'term', to: 'reading', title: 'Znak → pinyin' },
    { type: 'typing', from: 'term', to: 'reading', title: 'Wpisz pinyin' },
    { type: 'matching', title: 'Dopasuj pary' },
    { type: 'listening', title: 'Rozpoznaj ze słuchu' },
    { type: 'tones', title: 'Rozpoznaj tony ze słuchu' },
    { type: 'fill', title: 'Uzupełnij zdanie (选词填空)' },
    { type: 'order', title: 'Ułóż zdanie' },
    { type: 'dialog', title: 'Słuchanie dialogów (听力)' },
    { type: 'judge', title: 'Prawda czy fałsz (判断对错)' },
    { type: 'reply', title: 'Dopasuj odpowiedź' },
    {
      type: 'exam',
      title: 'Egzamin próbny HSK 2',
      sections: [
        { type: 'dialog', count: 10, title: '听力 · Słuchanie' },
        { type: 'fill', count: 10, title: '阅读 · Uzupełnij zdanie' },
        { type: 'judge', count: 10, title: '阅读 · Prawda czy fałsz' },
        { type: 'reply', count: 10, title: '阅读 · Dopasuj odpowiedź' },
      ],
    },
  ],
};

export default hsk2;
