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

export interface ItemInstance { id: string; refId?: string; custom?: { name: string; type: string; aspects: Partial<Record<AspectId, number>> }; usesLeft?: number;
  ammo?: { cur: number; max: number };                   // оружие с патронами (28 ноября)
  equipped?: boolean; }                                  // броня надета: штраф снаряжения действует

export interface RollLogEntry {
  id: string; characterId: string; at: string; hidden: boolean; // скрытые видит только мастер
  what: string; target: number; modifiers: { source: string; value: number }[];
  result: number; step: 'crit-success'|'success'|'fail'|'crit-fail';
}

/** @deprecated с 28 ноября — см. BookRef */
export interface Book { id: string; aspect: AspectId; threshold: number; language: string; skillId: string; }
export interface OccultSkillRef { id: string; name: string; arts: [string, string]; aspects: [AspectId, AspectId]; starterBook: string; }
export interface Language { id: string; name: string; kind: 'open'|'ancient'|'unseen'; aspects?: [AspectId, AspectId]; }
// Каталоги справочников (28 ноября). Один файл на категорию: data/catalog/<kind>.json
export type CatalogKind = 'aspects'|'soul-parts'|'skills'|'occult'|'languages'|'books'|'substances'|'tools'|'weapons'|'armor'|'memories'|'taints'|'ailments'|'disorders'|'manifestations';
export interface CatalogFile<T> { schemaVersion: number; kind: CatalogKind; entries: T[]; }
export interface CatalogBase { id: string; name: string; description: string; hidden?: boolean; source?: string; } // source — файл хранилища
export type AspectValues = Partial<Record<AspectId, number>>;

export interface AspectRef extends CatalogBase { aspectId: AspectId; symbol: string; contrary?: AspectId; }
export interface SoulPartRef extends CatalogBase { part: SoulPart; aspects: AspectId[]; }
export interface BookRef extends CatalogBase { aspect: AspectId; threshold: number; language?: string; skillId?: string; } // threshold чётный, ≥ 4
export interface SubstanceRef extends CatalogBase { type: 'substance'|'ingredient'|'plant'|'candle'; aspects: AspectValues; craft?: string; silent?: boolean; } // silent — Нигилит
export interface ToolRef extends CatalogBase { aspects: AspectValues; uses: number | 'reusable'; }
export interface WeaponRef extends CatalogBase { skill: string; damage: string; range: string; shots: [number, number]; fire: 'none'|'burst'|'burst-only'; magazine?: number; } // damage «1d10», shots [1,3]
export interface ArmorRef extends CatalogBase { value: number; covers: 'body'|'head'|'melee'; penalty?: { skills: string[]; value: -10|-20 }; }
export interface MemoryRef extends CatalogBase { aspects: AspectValues; }
export interface TaintRef extends CatalogBase { aspects: AspectValues; parts: [SoulPart, SoulPart]; ailments: string[]; cure: number; }
export interface AilmentRef extends CatalogBase { aspect: AspectId; part: SoulPart; mask: string; effect: string; cure: number; } // cure 5–9
export interface DisorderRef extends CatalogBase { category: string; part: SoulPart; flare: string; }
export interface ManifestationRef extends CatalogBase { part: SoulPart; effects: string[]; }
