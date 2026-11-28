import { describe, it, expect } from 'vitest';
import { demoCharacter } from '../src/store/demo';
import { burnWillTarget, burnWill, soulCheckTarget, meditate, addCrack, dropPart } from '../src/engine/soul';

const c0 = (cracks = 2) => { const c = structuredClone(demoCharacter()); c.soul = { whole: 7, cracks, lostParts: [] }; c.wp.cur = 10; return c; };

describe('Сжечь Волю', () => {
  it('Цель = N × 5 в границах 10–95', () => {
    expect(burnWillTarget(1)).toBe(10);
    expect(burnWillTarget(6)).toBe(30);
    expect(burnWillTarget(20)).toBe(95);
  });
  it('ОВ тратятся при любом результате; успех снимает одну трещину', () => {
    const ok = burnWill(c0(), 6, 15);
    expect(ok.c.wp.cur).toBe(4); expect(ok.c.soul.cracks).toBe(1);
    const no = burnWill(c0(), 6, 80);
    expect(no.c.wp.cur).toBe(4); expect(no.c.soul.cracks).toBe(2);
  });
  it('N не больше текущих ОВ', () => {
    expect(burnWill(c0(), 50, 99).c.wp.cur).toBe(0);
  });
});

describe('Медитация', () => {
  it('Цель — Душа × 10, Связь рядом +10', () => {
    expect(soulCheckTarget(c0())).toBe(70);
    expect(soulCheckTarget(c0(), true)).toBe(80);
  });
  it('Стук выше базы снижает цель', () => {
    const c = c0(); c.aspects.knock.cur = c.aspects.knock.base + 2;
    expect(soulCheckTarget(c)).toBe(60);
  });
  it('Успех — трещины стираются', () => {
    const r = meditate(c0(), 30);
    expect(r.c.soul).toEqual({ whole: 7, cracks: 0, lostParts: [] });
  });
  it('Провал — часть сброшена, трещины стираются', () => {
    const r = meditate(c0(), 85, false, 'Фет');
    expect(r.c.soul).toEqual({ whole: 6, cracks: 0, lostParts: ['Фет'] });
  });
});

describe('Трещины', () => {
  it('Заполнили все клетки — часть сброшена сразу', () => {
    expect(addCrack(c0(1)).soul.cracks).toBe(2);
    expect(addCrack(c0(2)).soul).toEqual({ whole: 6, cracks: 0, lostParts: [] });
  });
  it('Душа не ниже 0', () => {
    const c = c0(); c.soul.whole = 0;
    expect(dropPart(c).soul.whole).toBe(0);
  });
});
