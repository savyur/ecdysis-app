// Воля (ОВ): выгорание, срыв, переброс за ОВ. Источник: Ядро правил → «Бой» → «Раны и Воля» (28 ноября).
import type { Character } from '../data/types';
import type { Mod, Step } from './roll';
import { addCrack } from './soul';

export const BURNOUT_AT = 2;
export const BURNOUT: Mod = { source: 'выгорание', value: -10 };

/** ОВ ≤ 2 — выгорание: −10 ко всем проверкам. */
export const burnoutMod = (c: Pick<Character, 'wp'>): Mod | null => (c.wp.cur <= BURNOUT_AT ? BURNOUT : null);

export type Breakdown = 'flare' | 'crack' | null;

/**
 * Потратить ОВ. Дошли до 0 — срыв: одно расстройство сразу обостряется (выбор — у игрока),
 * расстройств нет — одна трещина. Сознание не теряется.
 */
export function spendWill(c: Character, n: number): { c: Character; breakdown: Breakdown } {
  const cur = Math.max(0, c.wp.cur - n);
  let next: Character = { ...c, wp: { ...c.wp, cur } };
  if (c.wp.cur > 0 && cur === 0) {
    if (c.disorders.length) return { c: next, breakdown: 'flare' };
    next = addCrack(next);
    return { c: next, breakdown: 'crack' };
  }
  return { c: next, breakdown: null };
}

/** Переброс за ОВ: только провал (не критический), один на проверку, нужно ОВ > 0. */
export const canReroll = (s: Step, used: boolean, c: Pick<Character, 'wp'>) => s === 'fail' && !used && c.wp.cur > 0;

/** Цена переброса — 1d4 ОВ, случайно 1–4. */
export const rerollCost = (rnd: () => number = Math.random) => Math.floor(rnd() * 4) + 1;
