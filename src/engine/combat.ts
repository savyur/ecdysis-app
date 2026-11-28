// Бой: режимы огня, патроны, урон по выстрелам, броня. Источник: Ядро правил → «Бой» (28 ноября).
import type { Step } from './roll';
import { damage, type Damage, type Dice } from './damage';

export type FireMode = 'single' | 'burst' | 'suppress';
export interface FireWeapon { damage: Dice; shots: [number, number]; fire: 'none' | 'burst' | 'burst-only' }

/** Патроны на режим: [мин, макс]. Выстрел — 1 за выстрел. */
export const AMMO: Record<FireMode, [number, number]> = { single: [1, 1], burst: [3, 5], suppress: [8, 12] };
/** Кубов урона у очереди: 2 куба оружия. */
export const BURST_DICE = 2;

/** Режимы оружия. Очередь и подавление — только у оружия с пометкой «очередь». */
export function weaponModes(w: FireWeapon): FireMode[] {
  if (w.fire === 'burst-only') return ['burst', 'suppress'];
  if (w.fire === 'burst') return ['single', 'burst', 'suppress'];
  return ['single'];
}

/** Режим доступен, если патронов хватает на минимум режима. ammo undefined — патроны не считаются. */
export function modeAvailable(w: FireWeapon, mode: FireMode, ammo?: number): boolean {
  if (!weaponModes(w).includes(mode)) return false;
  return ammo === undefined || ammo >= AMMO[mode][0];
}

/** Сколько патронов уйдёт: выстрел — по числу выстрелов, очередь и подавление — выбранное число. */
export function ammoCost(mode: FireMode, n: number): number {
  const [lo, hi] = mode === 'single' ? [1, Infinity] : AMMO[mode];
  return Math.min(hi, Math.max(lo, n));
}

/** Число выстрелов в режиме «Выстрел»: от 1 до максимума оружия и не больше патронов. */
export function maxShots(w: FireWeapon, ammo?: number): number {
  return Math.max(1, Math.min(w.shots[1], ammo ?? Infinity));
}

/** Патроны оружия: в оружии (cur), магазин (max), запас (reserve). Калибров нет (Пётр, 28 ноября). */
export interface Ammo { cur: number; max: number; reserve: number }

/** Патроны списываются из оружия при любом результате атаки. */
export const spendAmmo = (ammo: Ammo, cost: number): Ammo => ({ ...ammo, cur: Math.max(0, ammo.cur - cost) });

/** «Перезарядить» доступно, если есть запас и магазин не полон. */
export const canReload = (ammo: Ammo) => ammo.reserve > 0 && ammo.cur < ammo.max;

/** Перезарядка — одно действие: из запаса в оружие, до размера магазина. */
export function reload(ammo: Ammo): Ammo {
  const take = Math.min(ammo.max - ammo.cur, ammo.reserve);
  return { ...ammo, cur: ammo.cur + Math.max(0, take), reserve: ammo.reserve - Math.max(0, take) };
}

export interface Volley { hits: Damage[]; total: number }

/**
 * Урон атаки. Выстрел: каждый выстрел — свой куб оружия, броня вычитается из каждого попадания.
 * Очередь: 2 куба оружия, одно попадание, броня из суммы (предложение в «Не определено»).
 * Подавление: урона нет. Крит. успех — максимум кубов.
 * rolls — значения кубов по попаданиям: [[выстрел 1], [выстрел 2], …] или [[куб 1, куб 2]] для очереди.
 */
export function volley(w: FireWeapon, mode: FireMode, rolls: number[][], armor: number, s: Step): Volley {
  if (mode === 'suppress') return { hits: [], total: 0 };
  const max = s === 'crit-success';
  const dice: Dice = mode === 'burst' ? { ...w.damage, count: w.damage.count * BURST_DICE } : w.damage;
  const hits = rolls.map(r => damage(dice, r, armor, max));
  return { hits, total: hits.reduce((a, h) => a + h.total, 0) };
}

/** Кубы для volley: число попаданий × кубов на попадание. */
export function rollVolley(w: FireWeapon, mode: FireMode, shots: number, rnd: () => number = Math.random): number[][] {
  if (mode === 'suppress') return [];
  const per = mode === 'burst' ? w.damage.count * BURST_DICE : w.damage.count;
  const n = mode === 'burst' ? 1 : shots;
  return Array.from({ length: n }, () => Array.from({ length: per }, () => Math.floor(rnd() * w.damage.sides) + 1));
}

/** Подавление: исход по ступени. */
export function suppression(s: Step): 'zone-penalty' | 'zone-closed' | 'none' | 'jam' {
  if (s === 'crit-success') return 'zone-closed';
  if (s === 'success') return 'zone-penalty';
  if (s === 'crit-fail') return 'jam';
  return 'none';
}

// Броня
export interface ArmorPiece { value: number; covers: 'body' | 'head' | 'melee'; penalty?: { skills: string[]; value: -10 | -20 } }

/**
 * Броня персонажа против попадания. Несколько надетых — действует сильнейшая (правило одного источника, предложение);
 * каска — только голова, куртка — только нож и удар.
 */
export function armorAgainst(worn: ArmorPiece[], hit: { head?: boolean; melee?: boolean } = {}): number {
  const fits = worn.filter(a => a.covers === 'body' || (a.covers === 'head' && hit.head) || (a.covers === 'melee' && hit.melee));
  return fits.reduce((m, a) => Math.max(m, a.value), 0);
}

/** Штраф снаряжения к умению: модификатор источника «снаряжение», действует сильнейший. */
export function gearPenalty(worn: ArmorPiece[], skill: string): { source: string; value: number } | null {
  const v = worn.filter(a => a.penalty?.skills.includes(skill)).reduce((m, a) => Math.min(m, a.penalty!.value), 0);
  return v ? { source: 'снаряжение', value: v } : null;
}

// Защита
/** Крит. провал защиты: атака попадает с максимальным уроном. Крит. успех защиты бонуса не даёт. */
export const defenseCritFail = (defense: Step) => defense === 'crit-fail';
