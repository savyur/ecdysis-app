import { describe, it, expect } from 'vitest';
import { notation, rollDice } from '../src/engine/dice';

describe('Свободный бросок', () => {
  it('Запись', () => {
    expect(notation(2, 6, 1)).toBe('2d6+1');
    expect(notation(1, 100, 0)).toBe('1d100');
    expect(notation(3, 8, -2)).toBe('3d8−2');
  });
  it('Сумма кубов и модификатора', () => {
    const seq = [0, 0.999];
    let i = 0;
    const r = rollDice(2, 6, 1, () => seq[i++]);
    expect(r.dice).toEqual([1, 6]);
    expect(r.total).toBe(8);
  });
  it('Кубы в пределах граней', () => {
    for (let k = 0; k < 500; k++) for (const d of rollDice(3, 10, 0).dice) { expect(d).toBeGreaterThanOrEqual(1); expect(d).toBeLessThanOrEqual(10); }
  });
});
