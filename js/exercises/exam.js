// Egzamin próbny – łączy pytania z kilku innych typów ćwiczeń w sekcje.
export default {
  type: 'exam',
  category: 'exam',
  icon: '🎓',
  title: () => 'Egzamin próbny',
  description: cfg => `${(cfg.sections || []).reduce((n, s) => n + s.count, 0)} pytań w sekcjach: ${(cfg.sections || []).map(s => s.title).join(', ')}. Próg zaliczenia: 60%.`,
  available: (m, cfg, registry) => (cfg.sections || []).some(s => registry[s.type]?.available(m, s, registry)),
  build(m, ctx, registry) {
    const questions = [];
    for (const section of ctx.cfg.sections || []) {
      const ex = registry[section.type];
      if (!ex || !ex.available(m, section, registry)) continue;
      const qs = ex.build(m, { ...ctx, cfg: section, count: section.count }, registry);
      qs.forEach(q => { q.section = section.title; });
      questions.push(...qs);
    }
    return questions;
  },
  passThreshold: 0.6,
};
