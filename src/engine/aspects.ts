// Аспекты: модификатор отклонения, качели, Стук. Источник: Ядро правил, «Аспекты».
import type { AspectId } from '../data/types';

export type Aspects = Record<AspectId, { base: number; cur: number }>;

export const CONTRARY: Record<AspectId, AspectId | null> = {
  edge: 'heart', heart: 'edge', forge: 'scale', scale: 'forge',
  lantern: 'nectar', nectar: 'lantern', moth: 'rose', rose: 'moth',
  grail: 'winter', winter: 'grail', sky: 'moon', moon: 'sky', knock: null,
};
export const ASPECT_IDS = Object.keys(CONTRARY) as AspectId[];
export const OVER_SATURATION = 12;

/** Модификатор умений по отклонению текущего от базы. */
export function deviationMod(dev: number): number {
  if (dev >= 3) return 20;
  if (dev >= 1) return 10;
  if (dev <= -3) return -20;
  if (dev <= -1) return -10;
  return 0;
}

/** На сколько падает контрарный при подъёме на N. */
export const swingDrop = (n: number) => Math.ceil(n / 2);

/**
 * Отклонение с учётом чуждого Аспекта: на 0 он считается «ниже базы»
 * на половину подъёма контрарного (вверх), пока контрарный выше базы.
 */
export function effectiveDeviation(a: Aspects, id: AspectId): number {
  const { base, cur } = a[id];
  let dev = cur - base;
  const c = CONTRARY[id];
  if (c && cur === 0) {
    const excess = a[c].cur - a[c].base;
    if (excess > 0) dev = Math.min(dev, -swingDrop(excess));
  }
  return dev;
}

export const aspectMod = (a: Aspects, id: AspectId) => deviationMod(effectiveDeviation(a, id));

/**
 * Подъём Аспектов одним воздействием. Контрарный падает на ceil(N/2), не ниже 0.
 * Если поднимаются оба Аспекта пары — качели между ними не срабатывают. Цепочек нет.
 */
export function raise(a: Aspects, gains: Partial<Record<AspectId, number>>): Aspects {
  const next = structuredClone(a);
  for (const [id, n] of Object.entries(gains) as [AspectId, number][]) {
    if (!n || n <= 0) continue;
    next[id].cur += n;
  }
  for (const [id, n] of Object.entries(gains) as [AspectId, number][]) {
    if (!n || n <= 0) continue;
    const c = CONTRARY[id];
    if (!c || (gains[c] ?? 0) > 0) continue;
    next[c].cur = Math.max(0, next[c].cur - swingDrop(n));
  }
  return next;
}

/** Трата: качелей нет, не ниже 0. */
export function spend(a: Aspects, costs: Partial<Record<AspectId, number>>): Aspects {
  const next = structuredClone(a);
  for (const [id, n] of Object.entries(costs) as [AspectId, number][]) next[id].cur = Math.max(0, next[id].cur - (n ?? 0));
  return next;
}

/** Штраф к проверкам Души за Стук выше базы: 1–4 → −10, 5+ → −20. */
export function knockSoulMod(a: Aspects): number {
  const ex = a.knock.cur - a.knock.base;
  if (ex >= 5) return -20;
  if (ex >= 1) return -10;
  return 0;
}

/** Перенасыщение (усложнённые правила): текущее 12 и выше. */
export const oversaturated = (a: Aspects): AspectId[] => ASPECT_IDS.filter(id => a[id].cur >= OVER_SATURATION);
