import { describe, it, expect } from 'vitest';
import { demoCharacter } from '../src/store/demo';
import { hpMax, wpMax, sleep, endSortie, skillTarget, markOnFail } from '../src/engine/character';
import type { Effect } from '../src/data/types';

const c0 = () => structuredClone(demoCharacter());

describe('Персонаж', () => {
  it('ОЗ = (СИЛ + ТЕЛ) / 2 вверх, ОВ = ВОЛ', () => {
    const c = c0(); c.stats['СИЛ'] = 10; c.stats['ТЕЛ'] = 11; c.stats['ВОЛ'] = 14;
    expect(hpMax(c)).toBe(11); expect(wpMax(c)).toBe(14);
  });

  it('Сон: Аспекты к базе, ОВ полностью, ОЗ +1 не выше максимума', () => {
    const c = c0();
    c.aspects.edge.cur = c.aspects.edge.base + 3;
    c.wp.cur = 2; c.hp.cur = c.hp.max - 2;
    const s = sleep(c);
    expect(s.aspects.edge.cur).toBe(c.aspects.edge.base);
    expect(s.wp.cur).toBe(c.wp.max);
    expect(s.hp.cur).toBe(c.hp.max - 1);
    expect(sleep({ ...c, hp: { ...c.hp, cur: c.hp.max } }).hp.cur).toBe(c.hp.max);
  });

  it('Сон: сдвиг «до снятия» держится, воздействия «до сна» сняты', () => {
    const c = c0();
    const lasting: Effect = { id: 'a', kind: 'aspect', target: 'edge', value: 2, duration: 'until-removed', source: 'x' };
    const short: Effect = { id: 'b', kind: 'modifier', target: 'melee', value: 10, duration: 'until-sleep', source: 'y' };
    c.effects = [lasting, short];
    const s = sleep(c);
    expect(s.aspects.edge.cur).toBe(c.aspects.edge.base + 2);
    expect(s.effects.map(e => e.id)).toEqual(['a']);
  });

  it('Конец вылазки: +5 по отметке, не выше 95, отметки стёрты', () => {
    const c = c0(); c.skills.melee = 20; c.skills.ranged = 93;
    c.marks = { melee: true, ranged: true };
    const e = endSortie(c);
    expect(e.skills.melee).toBe(25); expect(e.skills.ranged).toBe(95); expect(e.marks).toEqual({});
  });

  it('Цель умения учитывает Аспект и ситуацию', () => {
    const c = c0(); c.skills.melee = 35;
    for (const id of Object.keys(c.aspects) as (keyof typeof c.aspects)[]) c.aspects[id].cur = c.aspects[id].base;
    c.effects = [];
    expect(skillTarget(c, 'melee')).toBe(35);
    expect(skillTarget(c, 'melee', [{ source: 'Ситуация', value: 10 }])).toBe(45);
  });

  it('Умение 0%: нельзя без +20, можно с +20', () => {
    const c = c0(); c.skills.sleight = 0; c.effects = [];
    for (const id of Object.keys(c.aspects) as (keyof typeof c.aspects)[]) c.aspects[id].cur = c.aspects[id].base;
    expect(skillTarget(c, 'sleight')).toBeNull();
    expect(skillTarget(c, 'sleight', [{ source: 'Ситуация', value: 20 }])).toBe(20);
  });

  it('Провал ставит отметку, успех — нет', () => {
    const c = c0(); c.marks = {};
    expect(markOnFail(c, 'melee', true).marks).toEqual({});
    expect(markOnFail(c, 'melee', false).marks).toEqual({ melee: true });
  });
});
