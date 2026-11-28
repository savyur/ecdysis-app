// Броня из «Ядро правил → Бой → Броня» (28 ноября). Пока каталога нет (сбор данных — неделя с 30 ноября), броня — здесь.
import type { ArmorRef } from './types';

const a = (id: string, name: string, value: number, covers: ArmorRef['covers'], uses: number, penalty?: ArmorRef['penalty']): ArmorRef =>
  ({ id, name, description: '', value, covers, uses, ...(penalty ? { penalty } : {}) });

export const ARMOR: ArmorRef[] = [
  a('armor-leather', 'Кожаная куртка, шинель', 1, 'melee', 3),
  a('armor-helmet', 'Стальная каска', 1, 'head', 3),
  a('armor-police-vest', 'Полицейский жилет 1930-х', 2, 'body', 4),
  a('armor-trench-plate', 'Окопный нагрудник', 3, 'body', 6, { skills: ['dodge'], value: -10 }),
  a('armor-knight', 'Рыцарский доспех', 4, 'body', 8, { skills: ['dodge', 'stealth'], value: -20 }),
  a('armor-cuirass', 'Кираса пулемётчика', 5, 'body', 6, { skills: ['dodge'], value: -20 }),
];
export const ARMOR_BY_ID: Record<string, ArmorRef> = Object.fromEntries(ARMOR.map(x => [x.id, x]));
