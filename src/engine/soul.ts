// Душа: расчёты. Источник: Ядро правил → «Душа: расчёты» (28 ноября).
import type { Character, SoulPart } from '../data/types';
import { target, step, isSuccess, type Step } from './roll';
import { knockSoulMod } from './aspects';

/** Клеток трещин у части Души. */
export const CRACK_CELLS = 3;
export const BOND_BONUS = 10;

/** Сжечь Волю: N ОВ от 1 до текущих, цель = N × 5 в границах 10–95. */
export function burnWillTarget(n: number): number {
  return target(n * 5)!;
}

/** Сжечь Волю: ОВ тратятся при любом результате, успех снимает одну трещину. */
export function burnWill(c: Character, n: number, roll: number): { c: Character; step: Step } {
  const k = Math.max(1, Math.min(n, c.wp.cur));
  const s = step(roll, burnWillTarget(k));
  const cracks = isSuccess(s) ? Math.max(0, c.soul.cracks - 1) : c.soul.cracks;
  return { c: { ...c, wp: { ...c.wp, cur: c.wp.cur - k }, soul: { ...c.soul, cracks } }, step: s };
}

/** Проверка Души: Душа × 10 с модификатором Стука; Медитация со Связью рядом — +10. */
export function soulCheckTarget(c: Character, bondNear = false): number | null {
  const mods = [];
  const k = knockSoulMod(c.aspects); if (k) mods.push({ source: 'knock', value: k });
  if (bondNear) mods.push({ source: 'bond', value: BOND_BONUS });
  return target(c.soul.whole * 10, mods);
}

/** Сбросить часть Души: целых −1, трещины стираются. */
export function dropPart(c: Character, part?: SoulPart): Character {
  return { ...c, soul: { whole: Math.max(0, c.soul.whole - 1), cracks: 0, lostParts: part ? [...c.soul.lostParts, part] : c.soul.lostParts } };
}

/** Медитация: успех — трещины стираются; провал — одна часть сброшена, трещины стираются. */
export function meditate(c: Character, roll: number, bondNear = false, part?: SoulPart): { c: Character; step: Step } {
  const t = soulCheckTarget(c, bondNear);
  const s = t === null ? 'fail' : step(roll, t);
  return { c: isSuccess(s) ? { ...c, soul: { ...c.soul, cracks: 0 } } : dropPart(c, part), step: s };
}

/** Трещина: заполнили все клетки — часть сброшена сразу, без проверки. */
export function addCrack(c: Character, part?: SoulPart): Character {
  const cracks = c.soul.cracks + 1;
  return cracks >= CRACK_CELLS ? dropPart(c, part) : { ...c, soul: { ...c.soul, cracks } };
}
