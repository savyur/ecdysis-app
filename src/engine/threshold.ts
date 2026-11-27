// Пороги, каст, недобор. Источник: Ядро правил, «Сложение Аспектов и пороги», «Каст».
import type { AspectId, RulesVersion, Tier } from '../data/types';
import { type Aspects, raise, spend } from './aspects';

export type Need = { aspect: AspectId; value: number };
/** Порог: варианты «ИЛИ», внутри каждого — условия «И». */
export type Requirement = Need[][];

export const CRACK_COVER = 4;

export interface Source { id: string; kind: 'consumable' | 'tool' | 'place'; aspects: Partial<Record<AspectId, number>>; usesLeft?: number }

export function sums(a: Aspects, sources: Source[]): Record<AspectId, number> {
  const s = Object.fromEntries(Object.entries(a).map(([k, v]) => [k, v.cur])) as Record<AspectId, number>;
  for (const src of sources) for (const [k, v] of Object.entries(src.aspects) as [AspectId, number][]) s[k] += v;
  return s;
}

export interface Check { met: boolean; option: number; shortfall: number; crack: boolean }

/** Проверка порога. Одна трещина покрывает до 4 недостающих. Берётся лучший вариант «ИЛИ». */
export function checkThreshold(req: Requirement, total: Record<AspectId, number>, allowCrack = true): Check {
  let best: Check = { met: false, option: -1, shortfall: Infinity, crack: false };
  req.forEach((opt, i) => {
    const short = opt.reduce((acc, n) => acc + Math.max(0, n.value - total[n.aspect]), 0);
    if (short < best.shortfall) best = { met: false, option: i, shortfall: short, crack: false };
  });
  if (best.shortfall === 0) best.met = true;
  else if (allowCrack && best.shortfall <= CRACK_COVER) { best.met = true; best.crack = true; }
  return best;
}

export interface PayResult { aspects: Aspects; sources: Source[]; crack: boolean }

/** Поглощение источников: расходники исчезают, инструмент −1 применение, места не тратятся. */
function absorb(a: Aspects, sources: Source[]): { aspects: Aspects; left: Source[] } {
  const gains: Partial<Record<AspectId, number>> = {};
  const left: Source[] = [];
  for (const s of sources) {
    if (s.kind === 'place') { left.push(s); continue; }
    for (const [k, v] of Object.entries(s.aspects) as [AspectId, number][]) gains[k] = (gains[k] ?? 0) + v;
    if (s.kind === 'tool' && (s.usesLeft ?? 1) > 1) left.push({ ...s, usesLeft: (s.usesLeft ?? 1) - 1 });
  }
  return { aspects: raise(a, gains), left };
}

/** Оплата порога (книга, вещество): свой Аспект вместе с полученным платит порог. */
export function payThreshold(a: Aspects, req: Requirement, sources: Source[]): PayResult | null {
  const placeBonus = sums(Object.fromEntries(Object.keys(a).map(k => [k, { base: 0, cur: 0 }])) as Aspects, sources.filter(s => s.kind === 'place'));
  const chk = checkThreshold(req, sums(a, sources));
  if (!chk.met) return null;
  const { aspects, left } = absorb(a, sources);
  const cost: Partial<Record<AspectId, number>> = {};
  for (const n of req[chk.option]) cost[n.aspect] = Math.max(0, n.value - placeBonus[n.aspect]);
  return { aspects: spend(aspects, cost), sources: left, crack: chk.crack };
}

export const castThreshold = (tier: Tier) => tier * 4;
export const castCost = (tier: Tier, rules: RulesVersion) => (rules === 'advanced' ? tier : 1);

/** Каст: порог ступени набирает один открытый Аспект Навыка; списывается 1 (усложнённые — номер ступени). */
export function cast(a: Aspects, aspect: AspectId, tier: Tier, sources: Source[], rules: RulesVersion): PayResult | null {
  const chk = checkThreshold([[{ aspect, value: castThreshold(tier) }]], sums(a, sources));
  if (!chk.met) return null;
  const { aspects, left } = absorb(a, sources);
  return { aspects: spend(aspects, { [aspect]: castCost(tier, rules) }), sources: left, crack: chk.crack };
}
