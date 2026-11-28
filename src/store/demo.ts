// Демо-персонаж для прототипа, пока нет создания персонажа (П7). Значения — как на макете листа.
import type { Character, AspectId } from '../data/types';
import { SKILLS } from '../data/skills';
import { SCHEMA_VERSION } from '../data/types';

const aspects = (vals: Record<AspectId, number>) =>
  Object.fromEntries(Object.entries(vals).map(([k, v]) => [k, { base: v, cur: v }])) as Character['aspects'];

/** Оружие демо-персонажа. */
export const DEMO_ITEMS = [{ id: 'i-knife', refId: 'combat-knife' }, { id: 'i-revolver', refId: 'revolver' }];

export function demoCharacter(): Character {
  const skills: Record<string, number> = {};
  for (const s of SKILLS) skills[s.id] = 10;
  Object.assign(skills, { melee: 20, medicine: 50, 'first-aid': 40, chemistry: 30, analysis: 40, insight: 30, encyclopedia: 30, mechanics: 35, science: 40 });
  return {
    id: 'demo', ownerId: 'local', schemaVersion: SCHEMA_VERSION, updatedAt: new Date().toISOString(), draft: false,
    name: 'Джастин Мэннеринг', profession: 'Хирург', temptation: 'Истина', level: 'novice',
    stats: { 'СИЛ': 10, 'ТЕЛ': 11, 'ЛОВ': 12, 'ИНТ': 15, 'ВОЛ': 14, 'ХАР': 10 },
    hp: { cur: 11, max: 11 }, wp: { cur: 14, max: 14 },
    aspects: aspects({ edge: 4, heart: 0, forge: 3, scale: 2, lantern: 5, nectar: 4, moth: 2, rose: 1, grail: 0, winter: 3, sky: 3, moon: 0, knock: 3 }),
    skills, marks: {}, arts: {}, occult: [], languages: [], bonds: [],
    soul: { whole: 9, cracks: 0, lostParts: [] }, disorders: [], taints: [], effects: [], items: DEMO_ITEMS.map(i => ({ ...i })), memories: [], notes: '',
  };
}
