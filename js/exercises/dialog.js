import { h, append } from '../core/dom.js';
import { sample, shuffle } from '../core/utils.js';
import * as tts from '../core/tts.js';
import { choiceButtons, voiceWarning } from '../ui/components.js';

// 听力 – posłuchaj krótkiego dialogu i odpowiedz na pytanie.
// Głosy rozmówców różnią się wysokością (男 – niżej, 女 – wyżej).
const PITCH = { 男: 0.75, 女: 1.3 };

export default {
  type: 'dialog',
  category: 'exam',
  icon: '🎙️',
  title: () => 'Słuchanie dialogów',
  description: () => 'Posłuchaj krótkiej rozmowy i pytania, a potem wybierz odpowiedź (听力).',
  available: m => !!m.lang && (m.exam.dialogs || []).length > 0,
  build(m, ctx) {
    return sample(m.exam.dialogs, ctx.count).map(d => ({
      kind: 'dialog', dialog: d, options: shuffle(d.options), itemIds: [], label: `${d.question} → ${d.options[0]}`,
    }));
  },
  render(q, ui, body) {
    const m = ui.module;
    const d = q.dialog;
    const zh = m.script || '';
    const rate = ui.settings.speechRate;

    const play = () => {
      tts.stop();
      for (const [who, line] of d.lines) tts.speak(line, { lang: m.lang, rate, pitch: PITCH[who] ?? 1, queue: true });
      tts.speak(`问：${d.question}`, { lang: m.lang, rate, queue: true });
    };
    const transcript = () => h('div', { class: `transcript ${zh}`, lang: m.lang || null },
      d.lines.map(([who, line]) => h('div', {}, h('strong', {}, `${who}：`), line)),
      h('div', {}, h('strong', {}, '问：'), d.question),
    );
    const peek = h('button', { class: 'btn ghost small', onclick: () => peek.replaceWith(transcript()) }, 'Pokaż tekst nagrania');

    append(body,
      voiceWarning(m),
      h('div', { class: 'question-label' }, 'Posłuchaj nagrania i wybierz odpowiedź na pytanie'),
      h('div', { class: 'player' }, h('button', { class: 'btn play', onclick: play }, '▶ Odtwórz nagranie')),
      h('div', { class: 'center' }, peek),
      choiceButtons(ui, q.options.map(o => h('span', { class: zh, lang: m.lang || null }, o)), q.options.indexOf(d.options[0]), correct => {
        peek.remove();
        ui.answer(correct, { reveal: h('div', {}, transcript(), h('div', { class: 'translation' }, d.meaning)) });
      }, { cls: zh ? 'big-option' : '' }),
    );
    ui.onKey(e => {
      if (e.key === ' ') { e.preventDefault(); play(); }
    });
    setTimeout(play, 300);
  },
};
