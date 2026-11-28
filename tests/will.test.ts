import { describe, it, expect } from 'vitest';
import { demoCharacter } from '../src/store/demo';
import { burnoutMod, spendWill, canReroll, rerollCost } from '../src/engine/will';
import { skillTarget } from '../src/engine/character';

const c0 = (wp: number) => { const c = structuredClone(demoCharacter()); c.wp.cur = wp; c.soul = { whole: 9, cracks: 0, lostParts: [] }; c.disorders = []; c.effects = []; for (const id of Object.keys(c.aspects) as (keyof typeof c.aspects)[]) c.aspects[id].cur = c.aspects[id].base; return c; };

describe('Выгорание', () => {
  it('ОВ ≤ 2 — −10 ко всем проверкам', () => {
    expect(burnoutMod(c0(3))).toBeNull();
    expect(burnoutMod(c0(2))).toEqual({ source: 'выгорание', value: -10 });
    expect(burnoutMod(c0(0))).toEqual({ source: 'выгорание', value: -10 });
  });
  it('Входит в цель умения', () => {
    const c = c0(2); c.skills.medicine = 50;
    expect(skillTarget(c, 'medicine')).toBe(40);
  });
});

describe('Срыв при ОВ 0', () => {
  it('Без расстройств — трещина', () => {
    const r = spendWill(c0(2), 3);
    expect(r.c.wp.cur).toBe(0); expect(r.breakdown).toBe('crack'); expect(r.c.soul.cracks).toBe(1);
  });
  it('Есть расстройство — обострение, трещины нет', () => {
    const c = c0(1); c.disorders = [{ id: 'd', part: 'Фет' }];
    const r = spendWill(c, 1);
    expect(r.breakdown).toBe('flare'); expect(r.c.soul.cracks).toBe(0);
  });
  it('Уже 0 — повторного срыва нет', () => {
    expect(spendWill(c0(0), 2).breakdown).toBeNull();
  });
  it('ОВ выше 0 — без срыва', () => {
    expect(spendWill(c0(5), 2)).toMatchObject({ breakdown: null, c: { wp: { cur: 3 } } });
  });
});

describe('Переброс за ОВ', () => {
  it('Только обычный провал, один раз, при ОВ > 0', () => {
    expect(canReroll('fail', false, c0(3))).toBe(true);
    expect(canReroll('crit-fail', false, c0(3))).toBe(false);
    expect(canReroll('success', false, c0(3))).toBe(false);
    expect(canReroll('fail', true, c0(3))).toBe(false);
    expect(canReroll('fail', false, c0(0))).toBe(false);
  });
  it('Цена 1d4: 1–4', () => {
    expect(rerollCost(() => 0)).toBe(1); expect(rerollCost(() => 0.999)).toBe(4);
  });
});
