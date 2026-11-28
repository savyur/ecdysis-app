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

/** Патроны списываются при каждом выстреле, и при промахе тоже (предложение в «Не определено»). */
export const spendAmmo = (ammo: { cur: number; max: number }, cost: number) => ({ ...ammo, cur: Math.max(0, ammo.cur - cost) });
export const reload = (ammo: { cur: number; max: number }) => ({ ...ammo, cur: ammo.max });

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
export interface ArmorPiece { value: number; covers: 'body' | 'head' | 'melee'; penalty?: { skills: string[]; value: -10 | -20 }; usesLeft?: number }
export interface HitPlace { head?: boolean; melee?: boolean }

const fits = (a: ArmorPiece, hit: HitPlace) => a.covers === 'body' || (a.covers === 'head' && !!hit.head) || (a.covers === 'melee' && !!hit.melee);
/** Прочность 0 — предмет разрушен: значение 0. */
const live = (a: ArmorPiece) => a.usesLeft === undefined || a.usesLeft > 0;

/**
 * Броня против попадания: сильнейший целый предмет из тех, что закрывают место попадания (Пётр, 28 ноября).
 * Каска — только голова, куртка — только нож и удар.
 */
export function armorAgainst(worn: ArmorPiece[], hit: HitPlace = {}): number {
  return worn.filter(a => fits(a, hit) && live(a)).reduce((m, a) => Math.max(m, a.value), 0);
}

/**
 * Износ: попадание, которое приняла броня, снимает 1 прочности с сильнейшего целого предмета.
 * Прочность 0 — разрушен; дальше урон принимает следующий по силе. Возвращает новый список и индекс задетого (−1 — нечем).
 */
export function wearArmor<T extends ArmorPiece>(worn: T[], hit: HitPlace = {}): { worn: T[]; index: number } {
  let index = -1;
  worn.forEach((a, i) => { if (fits(a, hit) && live(a) && (index < 0 || a.value > worn[index].value)) index = i; });
  if (index < 0) return { worn, index };
  return { worn: worn.map((a, i) => (i === index && a.usesLeft !== undefined ? { ...a, usesLeft: a.usesLeft - 1 } : a)), index };
}

/** Точное попадание при успехе броню не задевает и прочность не снимает. */
export const armorTakesHit = (kind: 'normal' | 'aim' | 'precise') => kind !== 'precise';

/** Штраф снаряжения к умению: источник «снаряжение», действует сильнейший. Остаётся у разрушенной брони, пока она надета. */
export function gearPenalty(worn: ArmorPiece[], skill: string): { source: string; value: number } | null {
  const v = worn.filter(a => a.penalty?.skills.includes(skill)).reduce((m, a) => Math.min(m, a.penalty!.value), 0);
  return v ? { source: 'снаряжение', value: v } : null;
}

// Защита
/** Крит. провал защиты: атака попадает с максимальным уроном. Крит. успех защиты бонуса не даёт. */
export const defenseCritFail = (defense: Step) => defense === 'crit-fail';
