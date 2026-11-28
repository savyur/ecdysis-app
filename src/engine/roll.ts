// Проверка d100 и модификаторы. Источник: Ядро правил, «Проверка d100», «Модификаторы».
export type Step = 'crit-success' | 'success' | 'fail' | 'crit-fail';
export interface Mod { source: string; value: number }

export const TARGET_MIN = 10;
export const TARGET_MAX = 95;
export const MOD_CAP = 40;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Из одного источника действует сильнейший (по модулю). */
export function strongestPerSource(mods: Mod[]): Mod[] {
  const best = new Map<string, Mod>();
  for (const m of mods) {
    const cur = best.get(m.source);
    if (!cur || Math.abs(m.value) > Math.abs(cur.value)) best.set(m.source, m);
  }
  return [...best.values()];
}

/** Сумма модификаторов с пределом ±40. */
export function modSum(mods: Mod[]): number {
  const s = strongestPerSource(mods).reduce((a, m) => a + m.value, 0);
  return clamp(s, -MOD_CAP, MOD_CAP);
}

/** Умение 0% бросается только с преимуществом (+20 одним источником) или при открытии Аспектом. */
export function canRoll(skill: number, mods: Mod[], unlocked = false): boolean {
  if (skill > 0 || unlocked) return true;
  return strongestPerSource(mods).some(m => m.value >= 20);
}

/** Итоговая цель или null, если бросать нельзя. Сумма умения и модификаторов 0 или ниже — бросок невозможен. */
export function target(skill: number, mods: Mod[] = [], unlocked = false): number | null {
  if (!canRoll(skill, mods, unlocked)) return null;
  const sum = skill + modSum(mods);
  if (sum <= 0) return null;
  return clamp(sum, TARGET_MIN, TARGET_MAX);
}

const isDouble = (r: number) => r >= 11 && r <= 99 && r % 11 === 0;

/** Ступень успеха. 01 — всегда крит. успех, 100 — всегда крит. провал. */
export function step(roll: number, tgt: number): Step {
  if (roll === 1) return 'crit-success';
  if (roll === 100) return 'crit-fail';
  if (roll <= tgt) return isDouble(roll) ? 'crit-success' : 'success';
  return isDouble(roll) ? 'crit-fail' : 'fail';
}

export const isSuccess = (s: Step) => s === 'crit-success' || s === 'success';
const rank: Record<Step, number> = { 'crit-success': 3, success: 2, fail: 1, 'crit-fail': 0 };

export type Opposed = 'attacker' | 'defender' | 'none' | 'reroll';

/**
 * Противостояние. Лучшая ступень; при равной — больший бросок;
 * оба провалились — атака не проходит ('none');
 * равные броски при равной ступени — переброс обеих сторон.
 */
export function opposed(aRoll: number, aTgt: number, dRoll: number, dTgt: number): Opposed {
  const a = step(aRoll, aTgt), d = step(dRoll, dTgt);
  if (!isSuccess(a) && !isSuccess(d)) return 'none';
  if (rank[a] !== rank[d]) return rank[a] > rank[d] ? 'attacker' : 'defender';
  if (aRoll === dRoll) return 'reroll';
  return aRoll > dRoll ? 'attacker' : 'defender';
}

/** Точная вероятность успеха нападающего с учётом переброса: W / (1 − T). */
export function opposedChance(aTgt: number, dTgt: number): { win: number; tie: number; winNoReroll: number } {
  let w = 0, t = 0;
  for (let x = 1; x <= 100; x++) for (let y = 1; y <= 100; y++) {
    const r = opposed(x, aTgt, y, dTgt);
    if (r === 'attacker') w++; else if (r === 'reroll') t++;
  }
  return { win: w / (10000 - t), tie: t / 10000, winNoReroll: w / 10000 };
}

export const d100 = (rnd: () => number = Math.random) => Math.floor(rnd() * 100) + 1;
