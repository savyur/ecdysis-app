// Оружие из таблицы «Урон» (20. rules, 26. Бой). Умения — по главе «Атака»: метательное — Дальний бой или Ловкость рук.
import type { Dice } from '../engine/damage';

export interface Weapon { id: string; name: string; damage: Dice; skills: string[] }

const MELEE = ['melee'], THROWN = ['melee', 'ranged', 'sleight'], RANGED = ['ranged'];

export const UNARMED: Weapon = { id: 'unarmed', name: 'Без оружия', damage: { count: 1, sides: 4, mod: -1 }, skills: MELEE };

export const WEAPONS: Weapon[] = [
  { id: 'knuckles', name: 'Кастет', damage: { count: 1, sides: 4, mod: 0 }, skills: MELEE },
  { id: 'knife', name: 'Нож', damage: { count: 1, sides: 4, mod: 0 }, skills: THROWN },
  { id: 'axe', name: 'Топор', damage: { count: 1, sides: 4, mod: 0 }, skills: THROWN },
  { id: 'combat-knife', name: 'Боевой нож', damage: { count: 1, sides: 6, mod: 0 }, skills: THROWN },
  { id: 'club', name: 'Дубинка', damage: { count: 1, sides: 6, mod: 0 }, skills: MELEE },
  { id: 'tomahawk', name: 'Томагавк', damage: { count: 1, sides: 8, mod: 0 }, skills: THROWN },
  { id: 'machete', name: 'Мачете', damage: { count: 1, sides: 8, mod: 0 }, skills: MELEE },
  { id: 'bat', name: 'Бейсбольная бита', damage: { count: 1, sides: 8, mod: 0 }, skills: MELEE },
  { id: 'pistol', name: 'Пистолет', damage: { count: 1, sides: 8, mod: 0 }, skills: RANGED },
  { id: 'revolver', name: 'Револьвер', damage: { count: 1, sides: 10, mod: 0 }, skills: RANGED },
  { id: 'carbine', name: 'Карабин', damage: { count: 1, sides: 12, mod: 0 }, skills: RANGED },
  { id: 'rifle', name: 'Винтовка', damage: { count: 1, sides: 12, mod: 2 }, skills: RANGED },
  { id: 'shotgun', name: 'Дробовик', damage: { count: 2, sides: 10, mod: 0 }, skills: RANGED },
  { id: 'smg', name: 'Пистолет-пулемёт', damage: { count: 1, sides: 10, mod: 0 }, skills: RANGED },
  { id: 'bar', name: 'Автоматическая винтовка', damage: { count: 1, sides: 12, mod: 2 }, skills: RANGED },
  { id: 'lmg', name: 'Ручной пулемёт', damage: { count: 1, sides: 12, mod: 2 }, skills: RANGED },
];
export const WEAPON_BY_ID: Record<string, Weapon> = Object.fromEntries([UNARMED, ...WEAPONS].map(w => [w.id, w]));

/** Боевые умения: открывают бросок атаки. */
export const ATTACK_SKILLS = ['melee', 'ranged', 'sleight'];
