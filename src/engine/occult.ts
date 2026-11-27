// Книги и ступени Навыка. Источник: Ядро правил, «Ступени и книги».
import type { Tier } from '../data/types';

/** Ярус книги по порогу: 4–6 I, 8–10 II, 12–14 III, 16+ IV. */
export function bookTier(threshold: number): Tier {
  if (threshold < 4) throw new Error('Порог книги не ниже 4');
  if (threshold < 8) return 1;
  if (threshold < 12) return 2;
  if (threshold < 16) return 3;
  return 4;
}

/** Модификатор броска языка при чтении: I +20, II +10, III 0, IV −10. */
export const bookLanguageMod = (tier: Tier) => [20, 10, 0, -10][tier - 1];

/** Потолок ступени по Искусству: 20% — I … 80% — IV; ниже 20% — 0. */
export const artCeiling = (art: number): 0 | Tier => Math.min(4, Math.floor(art / 20)) as 0 | Tier;

/**
 * Заработанные ступени по прочитанным книгам (по порядку).
 * Каждая книга открывает следующую ступень, не выше своего яруса; первая — всегда I.
 */
export function earnedTiers(bookThresholds: number[]): number {
  let earned = 0;
  for (const th of bookThresholds) {
    const next = earned + 1;
    if (next > 4) break;
    if (earned === 0 || bookTier(th) >= next) earned = next;
  }
  return earned;
}

/** Открытые и ожидающие (`pending`) ступени с учётом потолка Искусства. */
export function tiers(bookThresholds: number[], art: number) {
  const earned = earnedTiers(bookThresholds);
  const open = Math.min(earned, artCeiling(art));
  return { earned, open, pending: earned - open };
}
