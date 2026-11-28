// Производные значения и отдых. Источник: Данные → «Что считает приложение», глава «Создание персонажа».
import type { Character, Stat, Effect } from '../data/types';
import { SKILL_BY_ID } from '../data/skills';
import { aspectMod } from './aspects';
import { target, type Mod } from './roll';
import { burnoutMod } from './will';

export const STATS: Stat[] = ['СИЛ', 'ТЕЛ', 'ЛОВ', 'ИНТ', 'ВОЛ', 'ХАР'];

/** ОЗ = (СИЛ + ТЕЛ) / 2 вверх; ОВ = ВОЛ. */
export const hpMax = (c: Pick<Character, 'stats'>) => Math.ceil((c.stats['СИЛ'] + c.stats['ТЕЛ']) / 2);
export const wpMax = (c: Pick<Character, 'stats'>) => c.stats['ВОЛ'];

/** Сдвиги Аспектов от воздействий «До снятия»: держатся после сна. */
function lastingAspectShift(effects: Effect[]) {
  const shift: Record<string, number> = {};
  for (const e of effects) if (e.kind === 'aspect' && e.duration === 'until-removed' && e.target) shift[e.target] = (shift[e.target] ?? 0) + (e.value ?? 0);
  return shift;
}

/**
 * Сон: Аспекты к базе (кроме сдвигов «до снятия»), ОВ полностью, ОЗ +1 не выше максимума,
 * снятие воздействий «до сна» (и короче).
 */
export function sleep(c: Character): Character {
  const shift = lastingAspectShift(c.effects);
  const aspects = structuredClone(c.aspects);
  for (const id of Object.keys(aspects) as (keyof typeof aspects)[]) aspects[id].cur = Math.max(0, aspects[id].base + (shift[id] ?? 0));
  return {
    ...c,
    aspects,
    hp: { ...c.hp, cur: Math.min(c.hp.max, c.hp.cur + 1) },
    wp: { ...c.wp, cur: c.wp.max },
    effects: c.effects.filter(e => !['next-roll', 'turn', 'scene', 'until-sleep'].includes(e.duration)),
  };
}

/** Конец вылазки: рост умений по отметкам (+5, не выше 95), отметки стёрты, снятие «до сна» и «вылазка». */
export function endSortie(c: Character): Character {
  const skills = { ...c.skills };
  const languages = c.languages.map(l => ({ ...l }));
  for (const [id, marked] of Object.entries(c.marks)) {
    if (!marked) continue;
    if (id in skills) skills[id] = Math.min(95, skills[id] + 5);
    const lang = languages.find(l => l.id === id);
    if (lang) lang.pct = Math.min(95, lang.pct + 5);
  }
  return {
    ...c, skills, languages, marks: {},
    effects: c.effects.filter(e => !['next-roll', 'turn', 'scene', 'until-sleep', 'sortie'].includes(e.duration)),
  };
}

/** Модификаторы к умению: Аспект + воздействия-модификаторы на это умение или его Аспект + выгорание. */
export function skillMods(c: Character, skillId: string, extra: Mod[] = []): Mod[] {
  const ref = SKILL_BY_ID[skillId];
  const mods: Mod[] = [...extra];
  if (ref) { const v = aspectMod(c.aspects, ref.aspect); if (v) mods.push({ source: 'aspect', value: v }); }
  for (const e of c.effects) if (e.kind === 'modifier' && e.value && (e.target === skillId || (ref && e.target === ref.aspect))) mods.push({ source: e.source, value: e.value });
  const b = burnoutMod(c); if (b) mods.push(b);
  return mods;
}

/** Цель броска умения или null, если бросать нельзя. */
export function skillTarget(c: Character, skillId: string, extra: Mod[] = []): number | null {
  const ref = SKILL_BY_ID[skillId];
  const unlocked = !!ref && c.aspects[ref.aspect].cur > c.aspects[ref.aspect].base;
  return target(c.skills[skillId] ?? 0, skillMods(c, skillId, extra), unlocked);
}

/** Провал умения или языка ставит отметку. */
export function markOnFail(c: Character, id: string, success: boolean): Character {
  if (success) return c;
  return { ...c, marks: { ...c.marks, [id]: true } };
}
