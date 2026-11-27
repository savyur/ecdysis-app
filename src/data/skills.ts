// Прикладные умения: по два на Аспект. Источник: глава «Прикладные умения», «Распределение по Аспектам».
import type { AspectId } from './types';

export interface SkillRef { id: string; name: string; aspect: AspectId; typed?: boolean }

export const SKILLS: SkillRef[] = [
  { id: 'melee', name: 'Ближний бой', aspect: 'edge' },
  { id: 'ranged', name: 'Дальний бой', aspect: 'edge' },
  { id: 'survival', name: 'Выживание', aspect: 'heart' },
  { id: 'medicine', name: 'Медицина', aspect: 'heart' },
  { id: 'mechanics', name: 'Механика', aspect: 'forge', typed: true },
  { id: 'sabotage', name: 'Саботаж', aspect: 'forge' },
  { id: 'psychotherapy', name: 'Психотерапия', aspect: 'scale' },
  { id: 'encyclopedia', name: 'Энциклопедия', aspect: 'scale' },
  { id: 'analysis', name: 'Анализ', aspect: 'lantern' },
  { id: 'insight', name: 'Проницательность', aspect: 'lantern' },
  { id: 'first-aid', name: 'Первая помощь', aspect: 'nectar' },
  { id: 'chemistry', name: 'Химия', aspect: 'nectar' },
  { id: 'alertness', name: 'Бдительность', aspect: 'moth' },
  { id: 'dodge', name: 'Уклонение', aspect: 'moth' },
  { id: 'navigation', name: 'Навигация', aspect: 'rose' },
  { id: 'refinement', name: 'Утончённость', aspect: 'rose', typed: true },
  { id: 'deception', name: 'Притворство', aspect: 'grail' },
  { id: 'persuasion', name: 'Убеждение', aspect: 'grail' },
  { id: 'intimidation', name: 'Давление', aspect: 'winter' },
  { id: 'composure', name: 'Хладнокровие', aspect: 'winter' },
  { id: 'law', name: 'Законы', aspect: 'sky' },
  { id: 'science', name: 'Наука', aspect: 'sky', typed: true },
  { id: 'signs', name: 'Знаки и жесты', aspect: 'moon' },
  { id: 'stealth', name: 'Скрытность', aspect: 'moon' },
  { id: 'improvisation', name: 'Импровизация', aspect: 'knock' },
  { id: 'sleight', name: 'Ловкость рук', aspect: 'knock' },
];
export const SKILL_BY_ID = Object.fromEntries(SKILLS.map(s => [s.id, s])) as Record<string, SkillRef>;
