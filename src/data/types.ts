// Схема данных. Версия схемы растёт при любом несовместимом изменении.
// Поля и права — в таблицах выше. Здесь — только форма.
export const SCHEMA_VERSION = 1;

export type AspectId = 'edge'|'heart'|'forge'|'scale'|'lantern'|'nectar'|'moth'|'rose'|'grail'|'winter'|'sky'|'moon'|'knock';
export type Stat = 'СИЛ'|'ТЕЛ'|'ЛОВ'|'ИНТ'|'ВОЛ'|'ХАР';           // порядок как на листе
export type SoulPart = 'Хор'|'Эреб'|'Фет'|'Здоровье'|'Решимость'|'Фост'|'Шапт'|'Трист'|'Вист';
export type RulesVersion = 'basic'|'advanced';                  // основные / усложнённые правила
export type Tier = 1|2|3|4;
export type Duration = 'next-roll'|'turn'|'scene'|'sortie'|'until-sleep'|'until-removed';

export interface Campaign { id: string; masterId: string; playerIds: string[]; rules: RulesVersion; defaultLevel: LevelId; playersMayProgress: boolean; }
export type LevelId = 'novice'|'regular'|'veteran';

export interface Character {
  id: string; campaignId?: string; ownerId: string; schemaVersion: number; updatedAt: string; // ISO; для слияния при синхронизации
  draft: boolean;                                        // черновик создания
  name: string; profession: string; temptation: string; level: LevelId;
  stats: Record<Stat, number>;                           // 3–18
  hp: { cur: number; max: number }; wp: { cur: number; max: number };
  aspects: Record<AspectId, { base: number; cur: number }>;
  skills: Record<string, number>;                        // умения: id → %
  marks: Record<string, boolean>;                        // отметки провала
  arts: Record<string, number>;                          // Искусства: id → %
  occult: OccultSkill[];
  languages: { id: string; pct: number }[];
  bonds: { id: string; name: string; value: number }[];
  soul: { whole: number; cracks: number; lostParts: SoulPart[] };
  disorders: { id: string; part: SoulPart }[];
  taints: { id: string; part: SoulPart }[];
  effects: Effect[];
  items: ItemInstance[];
  memories: string[];
  notes: string;
}

export interface OccultSkill { skillId: string; art: string; tiersOpen: Tier[]; aspectsOpen: AspectId[]; booksRead: string[]; }

export interface Effect {
  id: string; kind: 'modifier'|'aspect'|'damage'|'wp'|'crack'|'bond'|'unlock'|'state'|'condition';
  target?: string;                                       // умение, Аспект, характеристика
  value?: number;                                        // ±10, ±20, подъём Аспекта…
  duration: Duration; source: string; condition?: string;
}

export interface ItemInstance { id: string; refId?: string; custom?: { name: string; type: string; aspects: Partial<Record<AspectId, number>> }; usesLeft?: number; }

export interface RollLogEntry {
  id: string; characterId: string; at: string; hidden: boolean; // скрытые видит только мастер
  what: string; target: number; modifiers: { source: string; value: number }[];
  result: number; step: 'crit-success'|'success'|'fail'|'crit-fail';
}

export interface Book { id: string; aspect: AspectId; threshold: number; language: string; skillId: string; }
export interface OccultSkillRef { id: string; name: string; arts: [string, string]; aspects: [AspectId, AspectId]; starterBook: string; }
export interface Language { id: string; name: string; kind: 'open'|'ancient'|'unseen'; aspects?: [AspectId, AspectId]; }
