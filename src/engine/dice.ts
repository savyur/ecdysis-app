// Свободный бросок кубов. Источник: Компоненты → RollSheet, «Свободный бросок».
export const DICE = [4, 6, 8, 10, 12, 100] as const;
export type Sides = (typeof DICE)[number];

export const COUNT_MIN = 1, COUNT_MAX = 10, MOD_MIN = -10, MOD_MAX = 10;

const sign = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '');

/** Запись броска: «2d6+1», без пробелов, минус — «−». */
export const notation = (count: number, sides: Sides, mod: number) => `${count}d${sides}${sign(mod)}`;

/** Бросок: значения кубов и сумма с модификатором. */
export function rollDice(count: number, sides: Sides, mod: number, rnd: () => number = Math.random) {
  const dice = Array.from({ length: count }, () => Math.floor(rnd() * sides) + 1);
  return { dice, total: dice.reduce((a, d) => a + d, 0) + mod };
}
