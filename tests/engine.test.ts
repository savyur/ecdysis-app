// Тесты = таблицы «Контрольные примеры для тестов» из Ядра правил.
import { describe, it, expect } from 'vitest';
import { target, step, opposed, opposedChance, type Mod } from '../src/engine/roll';
import { deviationMod, raise, spend, aspectMod, knockSoulMod, swingDrop, type Aspects, ASPECT_IDS } from '../src/engine/aspects';
import { checkThreshold, payThreshold, cast, sums, type Source } from '../src/engine/threshold';
import { bookTier, bookLanguageMod, artCeiling, earnedTiers, tiers } from '../src/engine/occult';
import type { AspectId } from '../src/data/types';

const m = (...v: number[]): Mod[] => v.map((value, i) => ({ source: 's' + i, value }));
const base = (over: Partial<Record<AspectId, [number, number]>> = {}): Aspects =>
  Object.fromEntries(ASPECT_IDS.map(id => [id, { base: over[id]?.[0] ?? 5, cur: over[id]?.[1] ?? over[id]?.[0] ?? 5 }])) as Aspects;

describe('Цель броска', () => {
  it.each([
    [60, [20, -10], 70], [60, [20, 20, 20], 95], [60, [-20, -20, -20], 20],
    [15, [-10], 10], [95, [20], 95], [90, [10, 20], 95], [40, [20, -20], 40],
  ])('умение %i, модификаторы %j → %i', (s, mods, t) => expect(target(s, m(...mods))).toBe(t));
  it.each([[10, [-10]], [10, [-20]], [5, [-10]], [20, [-20]]])('умение %i, модификаторы %j → бросок невозможен (сумма ≤ 0)', (sk, mods) => expect(target(sk, m(...mods))).toBeNull());
  it('0% без преимущества не бросается', () => expect(target(0, m(10))).toBeNull());
  it('0% с преимуществом → 20', () => expect(target(0, m(20))).toBe(20));
  it('один источник — сильнейший', () => expect(target(50, [{ source: 'a', value: 10 }, { source: 'a', value: 20 }])).toBe(70));
});

describe('Ступени успеха', () => {
  it.each([[1, 'crit-success'], [11, 'crit-success'], [55, 'crit-success'], [54, 'success'], [56, 'fail'], [66, 'crit-fail'], [99, 'crit-fail'], [100, 'crit-fail']])
    ('цель 55, бросок %i → %s', (r, s) => expect(step(r, 55)).toBe(s));
  it.each([[1, 'crit-success'], [5, 'success'], [10, 'success'], [11, 'crit-fail'], [22, 'crit-fail'], [100, 'crit-fail']])
    ('цель 10, бросок %i → %s', (r, s) => expect(step(r, 10)).toBe(s));
});

describe('Модификатор Аспекта', () => {
  it.each([[4, 20], [3, 20], [2, 10], [1, 10], [0, 0], [-1, -10], [-2, -10], [-3, -20], [-4, -20]])
    ('отклонение %i → %i', (d, v) => expect(deviationMod(d)).toBe(v));
});

describe('Качели', () => {
  it.each([[1, 1, -10, 0], [2, 1, -10, 1], [3, 2, -10, 1], [4, 2, -10, 2], [5, 3, -20, 2], [6, 3, -20, 3]])
    ('подъём +%i: контрарный −%i, %i, прибавка %i', (n, drop, mod, net) => {
      const a = raise(base(), { edge: n });
      expect(swingDrop(n)).toBe(drop);
      expect(a.heart.cur).toBe(5 - drop);
      expect(aspectMod(a, 'heart')).toBe(mod);
      expect(a.edge.cur + a.heart.cur - 10).toBe(net);
    });
  it('Грань +4, Сердце на базе → Сердце −2, штраф −10', () => {
    const a = raise(base(), { edge: 4 });
    expect(a.heart.cur - a.heart.base).toBe(-2); expect(aspectMod(a, 'heart')).toBe(-10);
  });
  it('Грань +2 и Сердце +2 одним воздействием — качели не срабатывают', () => {
    const a = raise(base(), { edge: 2, heart: 2 });
    expect(a.edge.cur).toBe(7); expect(a.heart.cur).toBe(7);
  });
  it('Стук +4 → Душа −10', () => expect(knockSoulMod(raise(base(), { knock: 4 }))).toBe(-10));
  it('Стук +5 → Душа −20', () => expect(knockSoulMod(raise(base(), { knock: 5 }))).toBe(-20));
  it('Трата 3 Грани — Сердце не меняется', () => {
    const a = spend(base(), { edge: 3 }); expect(a.edge.cur).toBe(2); expect(a.heart.cur).toBe(5);
  });
  it('Чуждый 0, контрарный +3 → ниже базы на 2, штраф −10, значение 0', () => {
    const a = raise(base({ heart: [0, 0] }), { edge: 3 });
    expect(a.heart.cur).toBe(0); expect(aspectMod(a, 'heart')).toBe(-10);
  });
});

describe('Пороги и каст', () => {
  const lockpick: Source = { id: 'pick', kind: 'tool', aspects: { knock: 2 }, usesLeft: 1 };
  const powder: Source = { id: 'powder', kind: 'consumable', aspects: { knock: 3 } };
  it('Книга Стук 10: Стук 6 + отмычка 2 + вещество 3 → 11, после траты 1, источники исчезли', () => {
    const a = base({ knock: [6, 6] });
    expect(sums(a, [lockpick, powder]).knock).toBe(11);
    const r = payThreshold(a, [[{ aspect: 'knock', value: 10 }]], [lockpick, powder])!;
    expect(r.aspects.knock.cur).toBe(1); expect(r.sources).toEqual([]);
  });
  it('Каст II (8): Стук 6 + отмычка 2 → основные 7, усложнённые 6', () => {
    const a = base({ knock: [6, 6] });
    expect(cast(a, 'knock', 2, [lockpick], 'basic')!.aspects.knock.cur).toBe(7);
    expect(cast(a, 'knock', 2, [lockpick], 'advanced')!.aspects.knock.cur).toBe(6);
  });
  it('«И»: каждый Аспект отдельно', () => {
    const req = [[{ aspect: 'knock' as const, value: 10 }, { aspect: 'sky' as const, value: 10 }]];
    expect(checkThreshold(req, { ...sums(base(), []), knock: 10, sky: 10 }, false).met).toBe(true);
    expect(checkThreshold(req, { ...sums(base(), []), knock: 20, sky: 5 }, false).met).toBe(false);
  });
  it('«ИЛИ»: достаточно любого', () => {
    const req = [[{ aspect: 'lantern' as const, value: 15 }], [{ aspect: 'sky' as const, value: 15 }]];
    expect(checkThreshold(req, { ...sums(base(), []), sky: 15 }, false).met).toBe(true);
  });
  it('Порог 12, не хватает 3 → трещина, набран', () => {
    const c = checkThreshold([[{ aspect: 'lantern', value: 12 }]], { ...sums(base(), []), lantern: 9 });
    expect(c.met).toBe(true); expect(c.crack).toBe(true);
  });
  it('Порог 12, не хватает 5 → не набран', () => {
    expect(checkThreshold([[{ aspect: 'lantern', value: 12 }]], { ...sums(base(), []), lantern: 7 }).met).toBe(false);
  });
});

describe('Книги и ступени Навыка', () => {
  it.each([[4, 1, 20], [6, 1, 20], [8, 2, 10], [10, 2, 10], [12, 3, 0], [14, 3, 0], [16, 4, -10], [20, 4, -10]])
    ('порог %i → ярус %i, язык %i', (th, t, mod) => { expect(bookTier(th)).toBe(t); expect(bookLanguageMod(bookTier(th))).toBe(mod); });
  it.each([[20, 1], [40, 2], [60, 3], [80, 4], [10, 0]])('Искусство %i → потолок %i', (a, c) => expect(artCeiling(a)).toBe(c));
  it('Барабаны и пляски: 8, 10, 12 → I, II, III', () => {
    expect(earnedTiers([8])).toBe(1); expect(earnedTiers([8, 10])).toBe(2); expect(earnedTiers([8, 10, 12])).toBe(3);
  });
  it('Первая книга всегда I', () => expect(earnedTiers([16])).toBe(1));
  it('Книга ниже следующей ступени не поднимает', () => expect(earnedTiers([4, 4])).toBe(1));
  it('Выше потолка — pending', () => expect(tiers([8, 10, 12], 40)).toEqual({ earned: 3, open: 2, pending: 1 }));
});

describe('Противостояние (ничья — переброс)', () => {
  it('лучшая ступень побеждает', () => expect(opposed(1, 50, 40, 50)).toBe('attacker'));
  it('при равной — больший бросок', () => expect(opposed(30, 50, 40, 50)).toBe('defender'));
  it('оба провалились — атака не проходит', () => expect(opposed(70, 50, 80, 50)).toBe('none'));
  it('равные броски — переброс', () => expect(opposed(40, 50, 40, 50)).toBe('reroll'));
  it.each([[80, 40, 70.76, 70.36], [50, 50, 37.75, 37.25], [60, 60, 42.30, 41.70], [30, 70, 14.73, 14.43], [95, 10, 93.78, 93.68], [10, 95, 1.82, 1.72]])
    ('%i против %i: таблица Ядра (ничья в пользу сторон) сходится', (a, d, att, def) => {
      const { win, tie, winNoReroll } = opposedChance(a, d);
      expect(+(100 * winNoReroll).toFixed(2)).toBe(def);
      expect(+(100 * (winNoReroll + tie)).toFixed(2)).toBe(att);
      expect(win).toBeGreaterThan(winNoReroll); expect(win).toBeLessThan(winNoReroll + tie);
    });
});
