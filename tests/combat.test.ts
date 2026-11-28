import { describe, it, expect } from 'vitest';
import { weaponModes, modeAvailable, ammoCost, maxShots, spendAmmo, reload, canReload, volley, rollVolley, suppression, armorAgainst, gearPenalty, defenseCritFail, wearArmor, armorTakesHit, type ArmorPiece } from '../src/engine/combat';
import { ARMOR_BY_ID } from '../src/data/armor';
import { WEAPON_BY_ID } from '../src/data/weapons';

const W = WEAPON_BY_ID;

describe('Режимы огня', () => {
  it('Очередь — только у оружия с пометкой', () => {
    expect(weaponModes(W.revolver)).toEqual(['single']);
    expect(weaponModes(W.smg)).toEqual(['single', 'burst', 'suppress']);
    expect(weaponModes(W.lmg)).toEqual(['burst', 'suppress']);
  });
  it('Пистолет, револьвер, карабин, винтовка очередью не стреляют', () => {
    for (const id of ['pistol', 'revolver', 'carbine', 'rifle']) expect(modeAvailable(W[id], 'burst')).toBe(false);
  });
  it('Патронов меньше минимума режима — режим недоступен', () => {
    expect(modeAvailable(W.smg, 'burst', 2)).toBe(false);
    expect(modeAvailable(W.smg, 'burst', 3)).toBe(true);
    expect(modeAvailable(W.smg, 'suppress', 7)).toBe(false);
    expect(modeAvailable(W.smg, 'single', 0)).toBe(false);
  });
  it('Патроны: очередь 3–5, подавление 8–12, выстрел — по числу выстрелов', () => {
    expect(ammoCost('burst', 1)).toBe(3); expect(ammoCost('burst', 9)).toBe(5);
    expect(ammoCost('suppress', 5)).toBe(8); expect(ammoCost('suppress', 20)).toBe(12);
    expect(ammoCost('single', 2)).toBe(2);
  });
  it('Выстрелов не больше максимума оружия и патронов', () => {
    expect(maxShots(W.pistol)).toBe(3); expect(maxShots(W.pistol, 2)).toBe(2); expect(maxShots(W.rifle)).toBe(1);
  });
  it('Списание из оружия, запас не тронут', () => {
    expect(spendAmmo({ cur: 4, max: 20, reserve: 10 }, 5)).toEqual({ cur: 0, max: 20, reserve: 10 });
  });
  it('Перезарядка: из запаса до размера магазина', () => {
    expect(reload({ cur: 2, max: 6, reserve: 10 })).toEqual({ cur: 6, max: 6, reserve: 6 });
    expect(reload({ cur: 0, max: 6, reserve: 3 })).toEqual({ cur: 3, max: 6, reserve: 0 });
  });
  it('Перезарядка недоступна: запас 0 или магазин полон', () => {
    expect(canReload({ cur: 2, max: 6, reserve: 0 })).toBe(false);
    expect(canReload({ cur: 6, max: 6, reserve: 5 })).toBe(false);
    expect(canReload({ cur: 5, max: 6, reserve: 1 })).toBe(true);
  });
});

describe('Урон по выстрелам', () => {
  it('Каждый выстрел — свой куб, броня из каждого попадания', () => {
    const v = volley(W.pistol, 'single', [[5], [2]], 2, 'success');
    expect(v.hits.map(h => h.total)).toEqual([3, 1]); expect(v.total).toBe(4);
  });
  it('Очередь — 2 куба оружия, одно попадание, броня из суммы', () => {
    const v = volley(W.smg, 'burst', [[6, 7]], 3, 'success');
    expect(v.hits).toHaveLength(1); expect(v.total).toBe(10);
  });
  it('Крит. успех — максимум кубов', () => {
    expect(volley(W.smg, 'burst', [[1, 1]], 0, 'crit-success').total).toBe(20);
    expect(volley(W.rifle, 'single', [[1]], 0, 'crit-success').total).toBe(14);
  });
  it('Подавление урона не наносит', () => {
    expect(volley(W.lmg, 'suppress', [], 0, 'success').total).toBe(0);
  });
  it('Кубы: выстрелы × куб, очередь — 2 куба', () => {
    expect(rollVolley(W.pistol, 'single', 3).map(r => r.length)).toEqual([1, 1, 1]);
    expect(rollVolley(W.smg, 'burst', 1).map(r => r.length)).toEqual([2]);
    expect(rollVolley(W.shotgun, 'single', 2).map(r => r.length)).toEqual([2, 2]);
  });
  it('Исход подавления', () => {
    expect(suppression('success')).toBe('zone-penalty');
    expect(suppression('crit-success')).toBe('zone-closed');
    expect(suppression('crit-fail')).toBe('jam');
    expect(suppression('fail')).toBe('none');
  });
});

describe('Броня и защита', () => {
  const vest: ArmorPiece = { value: 2, covers: 'body' };
  const helmet: ArmorPiece = { value: 1, covers: 'head' };
  const coat: ArmorPiece = { value: 1, covers: 'melee' };
  const plate: ArmorPiece = { value: 3, covers: 'body', penalty: { skills: ['dodge'], value: -10 } };
  const knight: ArmorPiece = { value: 4, covers: 'body', penalty: { skills: ['dodge', 'stealth'], value: -20 } };
  it('Действует сильнейшая надетая', () => {
    expect(armorAgainst([vest, plate])).toBe(3);
  });
  it('Каска — только голова, куртка — только нож и удар', () => {
    expect(armorAgainst([helmet])).toBe(0);
    expect(armorAgainst([helmet], { head: true })).toBe(1);
    expect(armorAgainst([coat])).toBe(0);
    expect(armorAgainst([coat], { melee: true })).toBe(1);
  });
  it('Штраф снаряжения — источник «снаряжение», сильнейший', () => {
    expect(gearPenalty([plate], 'dodge')).toEqual({ source: 'снаряжение', value: -10 });
    expect(gearPenalty([plate, knight], 'dodge')).toEqual({ source: 'снаряжение', value: -20 });
    expect(gearPenalty([plate], 'stealth')).toBeNull();
  });
  it('Крит. провал защиты — атака попадает с максимумом', () => {
    expect(defenseCritFail('crit-fail')).toBe(true);
    expect(defenseCritFail('crit-success')).toBe(false);
  });
});

describe('Износ брони', () => {
  const vest = { value: 2, covers: 'body' as const, usesLeft: 4 };
  const plate = { value: 3, covers: 'body' as const, usesLeft: 1, penalty: { skills: ['dodge'], value: -10 as const } };
  const helmet = { value: 1, covers: 'head' as const, usesLeft: 3 };
  it('Попадание снимает 1 прочности с сильнейшего', () => {
    const r = wearArmor([vest, plate]);
    expect(r.index).toBe(1); expect(r.worn[1].usesLeft).toBe(0); expect(r.worn[0].usesLeft).toBe(4);
  });
  it('Прочность 0 — разрушен: значение 0, урон принимает следующий', () => {
    const broken = wearArmor([vest, plate]).worn;
    expect(armorAgainst(broken)).toBe(2);
    const next = wearArmor(broken);
    expect(next.index).toBe(0); expect(next.worn[0].usesLeft).toBe(3);
  });
  it('Штраф снаряжения остаётся у разрушенной брони', () => {
    const broken = wearArmor([plate]).worn;
    expect(gearPenalty(broken, 'dodge')).toEqual({ source: 'снаряжение', value: -10 });
  });
  it('Каска изнашивается только при попадании в голову', () => {
    expect(wearArmor([helmet]).index).toBe(-1);
    expect(wearArmor([helmet], { head: true }).worn[0].usesLeft).toBe(2);
  });
  it('Всё разрушено — нечем принять', () => {
    expect(wearArmor([{ ...vest, usesLeft: 0 }]).index).toBe(-1);
    expect(armorAgainst([{ ...vest, usesLeft: 0 }])).toBe(0);
  });
  it('Точное попадание прочность не снимает', () => {
    expect(armorTakesHit('precise')).toBe(false);
    expect(armorTakesHit('normal')).toBe(true);
  });
  it('Прочность из таблицы', () => {
    expect(ARMOR_BY_ID['armor-knight'].uses).toBe(8);
    expect(ARMOR_BY_ID['armor-police-vest'].uses).toBe(4);
  });
});
