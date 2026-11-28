// Урон. Источник: 26. Бой («Урон», «Броня», «Критические результаты»); Компоненты → RollSheet `attack`, «Для кода».
import type { Step } from './roll';

export interface Dice { count: number; sides: number; mod: number }

const sign = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '');
/** «1d4−1», «2d10». */
export const diceText = (d: Dice) => `${d.count}d${d.sides}${sign(d.mod)}`;

export interface Damage { dice: number[]; raw: number; armor: number; total: number; max: boolean }

/** Урон = кубы + модификатор − броня, не меньше 1. Крит. успех — максимум кубов. */
export function damage(d: Dice, dice: number[], armor: number, max = false): Damage {
  const vals = max ? Array(d.count).fill(d.sides) : dice;
  const raw = vals.reduce((a, v) => a + v, 0) + d.mod;
  return { dice: vals, raw, armor, total: Math.max(1, raw - armor), max };
}

export const rollDiceOf = (d: Dice, rnd: () => number = Math.random) =>
  Array.from({ length: d.count }, () => Math.floor(rnd() * d.sides) + 1);

/** Попала ли атака: успех или крит. успех. Крит. успех — максимальный урон. */
export const hits = (s: Step) => s === 'success' || s === 'crit-success';

/** Вид атаки: модификатор и его источник. Прицел +20, Точное попадание −20. */
export type AttackKind = 'normal' | 'aim' | 'precise';
export const ATTACK_KIND: Record<AttackKind, { label: string; source?: string; value: number }> = {
  normal: { label: 'Обычная', value: 0 },
  aim: { label: 'Прицел', source: 'Прицел', value: 20 },
  precise: { label: 'Точное', source: 'Точное', value: -20 },
};
