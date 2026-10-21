// Rejestr typów ćwiczeń. Każdy typ eksportuje:
//   type, category ('vocab' | 'exam'), icon, title(cfg, m), description(cfg, m),
//   available(m, cfg) – czy moduł ma dane potrzebne do ćwiczenia,
//   build(m, ctx) – tworzy listę pytań,
//   render(question, ui, body) – rysuje pojedyncze pytanie.
import flashcards from './flashcards.js';
import choice from './choice.js';
import typing from './typing.js';
import matching from './matching.js';
import listening from './listening.js';
import fill from './fill.js';
import order from './order.js';
import judge from './judge.js';
import reply from './reply.js';
import dialog from './dialog.js';
import exam from './exam.js';

export const exercises = Object.fromEntries(
  [flashcards, choice, typing, matching, listening, fill, order, judge, reply, dialog, exam].map(e => [e.type, e]),
);

export function getExercise(type) {
  return exercises[type] || null;
}

export function isAvailable(m, cfg) {
  const ex = exercises[cfg.type];
  return !!ex && ex.available(m, cfg, exercises);
}

export function exerciseTitle(m, cfg) {
  return cfg.title || exercises[cfg.type]?.title(cfg, m) || cfg.type;
}

export function exerciseDescription(m, cfg) {
  return cfg.description || exercises[cfg.type]?.description(cfg, m) || '';
}
