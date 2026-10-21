// Zakresy materiału, z których można zbudować sesję („wszystko”, „do powtórki”, „zestaw 3”…).
import type { Item, Skill, StudyModule } from "./types";
import { isDue, isLeech, State, type StoredCard } from "./srs";
import type { CardMap } from "./exercises";

export interface Pool {
  key: string;
  label: string;
  hint?: string;
  items: Item[];
}

const cardsOf = (m: StudyModule, cards: CardMap, item: Item) =>
  m.skills.map(s => cards[`${item.id}|${s}`]).filter((c): c is StoredCard => !!c);

export function isItemDue(m: StudyModule, cards: CardMap, item: Item, now = Date.now()) {
  return cardsOf(m, cards, item).some(c => isDue(c, now));
}

export function isItemHard(m: StudyModule, cards: CardMap, item: Item) {
  return cardsOf(m, cards, item).some(c => isLeech(c) || (c.lapses > 0 && c.state === State.Relearning) || c.difficulty >= 8);
}

export function itemCards(m: StudyModule, cards: CardMap, item: Item): Partial<Record<Skill, StoredCard>> {
  return Object.fromEntries(m.skills.map(s => [s, cards[`${item.id}|${s}`]]).filter(([, c]) => c));
}

export function listPools(m: StudyModule, cards: CardMap, now = Date.now()): Pool[] {
  const pools: Pool[] = [
    { key: "all", label: "Wszystkie", items: m.items },
    { key: "due", label: "Do powtórki", items: m.items.filter(i => isItemDue(m, cards, i, now)) },
    { key: "new", label: "Nowe", items: m.items.filter(i => !cardsOf(m, cards, i).some(c => c.state !== State.New)) },
    { key: "hard", label: "Trudne", items: m.items.filter(i => isItemHard(m, cards, i)) },
  ];
  if (m.groups.length > 1) for (const g of m.groups) pools.push({ key: g.key, label: g.label, hint: g.range, items: g.items });
  return pools;
}

export function resolvePool(m: StudyModule, cards: CardMap, key: string | null): Pool {
  const pools = listPools(m, cards);
  const pool = pools.find(p => p.key === key);
  return pool && pool.items.length ? pool : pools[0];
}
