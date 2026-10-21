// Zakresy materiału, z których można zbudować sesję („wszystko”, „do powtórki”, „zestaw 3”…).
import { isDue, isHard } from './srs.js';

export function listPools(m, stats, now = Date.now()) {
  const pools = [
    { key: 'all', label: 'Wszystkie', items: m.items },
    { key: 'due', label: 'Do powtórki', items: m.items.filter(i => isDue(stats[i.id], now)) },
    { key: 'new', label: 'Nowe', items: m.items.filter(i => !stats[i.id]?.seen) },
    { key: 'hard', label: 'Trudne', items: m.items.filter(i => isHard(stats[i.id])) },
  ];
  if (m.groups.length > 1) {
    for (const g of m.groups) pools.push({ key: g.key, label: g.label, hint: g.range, items: g.items, group: true });
  }
  return pools;
}

export function resolvePool(m, stats, key) {
  const pool = listPools(m, stats).find(p => p.key === key);
  return pool && pool.items.length ? pool : listPools(m, stats)[0];
}
