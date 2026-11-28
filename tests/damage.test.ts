import { describe, it, expect } from 'vitest';
import { damage, diceText, rollDiceOf } from '../src/engine/damage';
import { UNARMED, WEAPON_BY_ID } from '../src/data/weapons';

describe('Урон', () => {
  it('Кубы минус броня', () => {
    expect(damage({ count: 1, sides: 10, mod: 0 }, [7], 1).total).toBe(6);
  });
  it('Не меньше 1', () => {
    expect(damage(UNARMED.damage, [1], 0).total).toBe(1);
    expect(damage({ count: 1, sides: 10, mod: 0 }, [3], 5).total).toBe(1);
  });
  it('Модификатор оружия', () => {
    expect(damage(WEAPON_BY_ID.rifle.damage, [5], 0).total).toBe(7);
    expect(damage(UNARMED.damage, [4], 0).total).toBe(3);
  });
  it('Крит. успех — максимум кубов, броня вычитается', () => {
    const d = damage(WEAPON_BY_ID.shotgun.damage, [2, 3], 5, true);
    expect(d.dice).toEqual([10, 10]); expect(d.total).toBe(15);
  });
  it('Запись', () => {
    expect(diceText(UNARMED.damage)).toBe('1d4−1');
    expect(diceText(WEAPON_BY_ID.shotgun.damage)).toBe('2d10');
  });
  it('Кубы в пределах граней', () => {
    for (let i = 0; i < 300; i++) for (const v of rollDiceOf({ count: 2, sides: 10, mod: 0 })) { expect(v).toBeGreaterThanOrEqual(1); expect(v).toBeLessThanOrEqual(10); }
  });
});
