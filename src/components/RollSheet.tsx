// Шторка броска: подготовка → (ввод вручную) → результат → (урон у атаки). Имена — как в Figma (RollSheet).
import { useEffect, useState } from 'react';
import { damage, diceText, rollDiceOf, hits, effectiveArmor, ATTACK_KIND, type AttackKind } from '../engine/damage';
import { ATTACK_SKILLS, UNARMED, WEAPON_BY_ID, type Weapon } from '../data/weapons';
import { Stepper, Chip } from './FreeRollSheet';
import type { Character } from '../data/types';
import { d100, step, isSuccess, target, modSum, type Mod, type Step } from '../engine/roll';
import { skillMods } from '../engine/character';
import { Icon } from '../ui/icons';
import { signed, aspectName } from './sheet';
import { SKILL_BY_ID } from '../data/skills';

export type RollSubject = { kind: 'skill'; id: string; name: string; value: number } | { kind: 'stat'; id: string; name: string; value: number };

const SITUATION = [-20, -10, 0, 10, 20];
const STEP_LABEL: Record<Step, string> = { 'crit-success': 'Крит. успех', success: 'Успех', fail: 'Провал', 'crit-fail': 'Крит. провал' };
const pad = (n: number) => (n === 100 ? '100' : String(n).padStart(2, '0'));

export function Tag({ s }: { s: Step }) {
  return <span className={`tag sans-badge ${s}`}>{STEP_LABEL[s]}</span>;
}

export function Segment({ value, onChange, isDisabled }: { value: number; onChange: (v: number) => void; isDisabled?: (v: number) => boolean }) {
  return (
    <div className="segment" role="radiogroup" aria-label="Ситуация">
      {SITUATION.map(v => (
        <button key={v} role="radio" aria-checked={v === value} disabled={v !== value && isDisabled?.(v)} className={`option sans-value tnum${v === value ? ' selected' : ''}`} onClick={() => onChange(v)}>{signed(v)}</button>
      ))}
    </div>
  );
}

function Formula({ base, mods, label, situation, kind }: { base: number; mods: Mod[]; label: string; situation: number; kind?: Mod }) {
  return (
    <div className="formula sans-label">
      <span className="group">{label} <span className="tnum">{base}</span></span>
      {kind && <span className="group">· {kind.source} <span className="tnum">{signed(kind.value)}</span></span>}
      {mods.map(m => (
        <span className="group" key={m.source}>· {m.source} <span className={`badge sans-badge tnum${m.value < 0 ? ' minus' : ''}`}>{signed(m.value)}</span></span>
      ))}
      <span className="group">· Ситуация <span className="tnum">{signed(situation)}</span></span>
    </div>
  );
}

const sourceName = (s: string) => (s === 'aspect' ? '' : s);
const ARMOR_MAX = 20;

const lastWeaponKey = (skill: string) => `ecdysis.lastWeapon.${skill}`;
function readLast(skill: string) { try { return localStorage.getItem(lastWeaponKey(skill)); } catch { return null; } }
function saveLast(skill: string, id: string) { try { localStorage.setItem(lastWeaponKey(skill), id); } catch { /* нет хранилища */ } }

/** Оружие из Инвентаря под это умение; для Ближнего боя ещё «Без оружия». */
export function weaponsFor(c: Character, skill: string): Weapon[] {
  const own = c.items.map(i => (i.refId ? WEAPON_BY_ID[i.refId] : undefined)).filter((w): w is Weapon => !!w && w.skills.includes(skill));
  const uniq = [...new Map(own.map(w => [w.id, w])).values()];
  return skill === 'melee' ? [...uniq, UNARMED] : uniq;
}

function Illustration() {
  return <svg className="illustration" viewBox="0 0 120 160" aria-hidden="true"><rect x="0.5" y="0.5" width="119" height="159" fill="none" stroke="currentColor" /><path d="M0 0L120 160M120 0L0 160" stroke="currentColor" /></svg>;
}

export function RollSheet({ c, subject, onClose, onResult }: {
  c: Character; subject: RollSubject; onClose: () => void; onResult: (success: boolean) => void;
}) {
  const [mode, setMode] = useState<'setup' | 'manual' | 'result' | 'damage'>('setup');
  const [situation, setSituation] = useState(0);
  const attack = subject.kind === 'skill' && ATTACK_SKILLS.includes(subject.id);
  const [kind, setKind] = useState<AttackKind>('normal');
  const weapons = attack ? weaponsFor(c, subject.id) : [];
  const [weaponId, setWeaponId] = useState<string | null>(() => {
    const last = attack ? readLast(subject.id) : null;
    return last && weapons.some(w => w.id === last) ? last : null;
  });
  const weapon = weapons.find(w => w.id === weaponId) ?? null;
  const [dmgDice, setDmgDice] = useState<number[]>([]);
  const [armor, setArmor] = useState(0);
  const [text, setText] = useState('');
  const [roll, setRoll] = useState<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const ref = subject.kind === 'skill' ? SKILL_BY_ID[subject.id] : undefined;
  const k = ATTACK_KIND[kind];
  const kindMod: Mod | undefined = attack && k.source ? { source: k.source, value: k.value } : undefined;
  const situational: Mod[] = [...(kindMod ? [kindMod] : []), ...(situation ? [{ source: 'Ситуация', value: situation }] : [])];
  const baseMods = subject.kind === 'skill' ? skillMods(c, subject.id) : [];
  const sourceMods: Mod[] = baseMods.map(m => ({ source: m.source === 'aspect' && ref ? aspectName(ref.aspect) : sourceName(m.source), value: m.value }));
  const shown: Mod[] = [...sourceMods, ...situational];
  const unlocked = !!ref && c.aspects[ref.aspect].cur > c.aspects[ref.aspect].base;
  const tgt = target(subject.value, [...baseMods, ...situational], unlocked);
  // Сумма умения и модификаторов 0 или ниже — бросок невозможен (Ядро → «Цель»).
  const blocks = (sit: number, kd: AttackKind = kind) => {
    const km = attack && ATTACK_KIND[kd].source ? [{ source: ATTACK_KIND[kd].source!, value: ATTACK_KIND[kd].value }] : [];
    const all = [...baseMods, ...km, ...(sit ? [{ source: 'Ситуация', value: sit }] : [])];
    return subject.value + modSum(all) <= 0;
  };
  const floorHit = subject.value > 0 && blocks(situation);
  const label = attack ? subject.name : subject.kind === 'skill' ? 'Умение' : subject.id;

  const finish = (r: number) => {
    setRoll(r); setMode('result');
    if (tgt !== null && subject.kind === 'skill') onResult(isSuccess(step(r, tgt)));
  };

  const parsed = text === '' ? null : Number(text) === 0 ? 100 : Number(text);
  const manualOk = parsed !== null && parsed >= 1 && parsed <= 100 && text.length <= 3;
  const s = roll !== null && tgt !== null ? step(roll, tgt) : null;
  const hit = attack && s !== null && hits(s);
  const toDamage = () => {
    if (!weapon) return;
    saveLast(subject.id, weapon.id);
    setDmgDice(rollDiceOf(weapon.damage)); setArmor(0); setMode('damage');
  };
  // Точное попадание при успехе: броня цели не действует (26. Бой).
  const ignoreArmor = kind === 'precise';
  const dmg = weapon && mode === 'damage' ? damage(weapon.damage, dmgDice, effectiveArmor(kind, armor), s === 'crit-success') : null;
  const markNote = s === 'crit-fail' && attack ? 'Осечка или оружие выпало — решает мастер. Отметка поставлена: +5% между вылазками' : 'Отметка поставлена: +5% между вылазками';

  return (
    <div className="overlay" onClick={onClose}>
      <div className={`sheet roll-sheet${attack ? ' attack' : ''}`} role="dialog" aria-modal="true" aria-label={subject.name} onClick={e => e.stopPropagation()}>
        <div className="grip-row"><div className="grip" /></div>
        <div className="sheet-title-row">
          <span className="sheet-title sans-title">{subject.name}</span>
          <button className="icon-button" aria-label="Закрыть" onClick={onClose}><Icon name="ui/close" /></button>
        </div>

        {mode === 'setup' && <>
          <div className="calc">
            <div className="card-row">
              <Illustration />
              <div className="target">
                <div className="target-number tnum">
                  {tgt === null ? <span className="sans-title">Нельзя</span> : <><span className="sans-display">{tgt}</span><span className="sans-title">%</span></>}
                </div>
                <Formula base={subject.value} mods={sourceMods} label={label} situation={situation} kind={kindMod} />
                {tgt === null && (floorHit
                  ? <span className="warning sans-caption">Цель 0 или ниже — бросок невозможен</span>
                  : <span className="sans-label against">Нужно преимущество +20 или Аспект выше базы</span>)}
              </div>
            </div>
            {attack && (
              <div className="segment" role="radiogroup" aria-label="Вид атаки">
                {(Object.keys(ATTACK_KIND) as AttackKind[]).map(id => {
                  const a = ATTACK_KIND[id];
                  return <button key={id} role="radio" aria-checked={id === kind} disabled={id !== kind && blocks(situation, id)} className={`option sans-value${id === kind ? ' selected' : ''}`} onClick={() => setKind(id)}>{a.label}{a.value ? ` ${signed(a.value)}` : ''}</button>;
                })}
              </div>
            )}
            <Segment value={situation} onChange={setSituation} isDisabled={v => blocks(v)} />
          </div>
          <div className="actions">
            <button className="button sans-button" disabled={tgt === null} onClick={() => { setText(''); setMode('manual'); }}><Icon name="ui/edit" size={20} />Ввести вручную</button>
            <button className="button primary sans-button" disabled={tgt === null} onClick={() => finish(d100())}><Icon name="ui/die" size={20} />Бросить</button>
          </div>
        </>}

        {mode === 'manual' && <>
          <div className="calc">
            <label className={`input-field${text && !manualOk ? ' error' : ''}`}>
              <span className="sans-section">Результат броска</span>
              <input className="sans-stat tnum" inputMode="numeric" autoFocus value={text}
                onChange={e => setText(e.target.value.replace(/\D/g, '').slice(0, 3))}
                onKeyDown={e => { if (e.key === 'Enter' && manualOk) finish(parsed!); }} />
              <span className="helper sans-caption">Результат от 01 до 100 (00 = 100)</span>
            </label>
          </div>
          <div className="actions">
            <button className="button sans-button" onClick={() => setMode('setup')}><Icon name="ui/arrow-back" size={20} />Назад</button>
            <button className="button primary sans-button" disabled={!manualOk} onClick={() => finish(parsed!)}><Icon name="ui/check" size={20} />Принять</button>
          </div>
        </>}

        {mode === 'result' && roll !== null && s && tgt !== null && <>
          <div className="calc">
            <div className={`card-row${hit ? '' : ' fill'}`}>
              <Illustration />
              <div className="result">
                <div className="result-line"><span className="sans-display tnum">{pad(roll)}</span><Tag s={s} /></div>
                <span className="against sans-label tnum">Против цели {tgt} · {label} {subject.value}{shown.length ? ` · ${shown.map(m => `${m.source} ${signed(m.value)}`).join(' · ')}` : ''}{modSum([...baseMods, ...situational]) !== shown.reduce((a, m) => a + m.value, 0) ? ' (предел ±40)' : ''}</span>
                {subject.kind === 'skill' && !isSuccess(s) && <span className="mark-note sans-caption">{markNote}</span>}
              </div>
            </div>
            {hit && (
              <div className="weapon-pick">
                <span className="sans-label label">Оружие</span>
                {weapons.length ? (
                  <div className="weapons" role="radiogroup" aria-label="Оружие">
                    {weapons.map(w => (
                      <button key={w.id} role="radio" aria-checked={w.id === weaponId} className={`item-row${w.id === weaponId ? ' selected' : ''}`} onClick={() => setWeaponId(w.id)}>
                        <span className="name sans-label">{w.name}</span>
                        <span className="stat sans-value tnum">{diceText(w.damage)}</span>
                      </button>
                    ))}
                  </div>
                ) : <span className="sans-label empty">Нет оружия для этого умения в Инвентаре</span>}
              </div>
            )}
          </div>
          <div className="actions">
            {hit ? <>
              <button className="button sans-button" onClick={onClose}>Готово</button>
              <button className="button primary sans-button" disabled={!weapon} onClick={toDamage}>Урон</button>
            </> : <button className="button primary sans-button" onClick={onClose}>Готово</button>}
          </div>
        </>}

        {mode === 'damage' && dmg && weapon && <>
          <div className="calc damage">
            <div className="damage-result">
              <span className="sans-display tnum total">{dmg.total}</span>
              <span className="sans-label against tnum">{diceText(weapon.damage)} = {dmg.raw}{dmg.max ? ' (максимум)' : ''}{dmg.armor ? ` · броня −${dmg.armor}` : ''}{ignoreArmor ? ' · точное: броня не действует' : ''}{dmg.raw - dmg.armor < 1 ? ' · не меньше 1' : ''}</span>
              <div className="dice">{dmg.dice.map((d, i) => <Chip key={i} value={d} />)}</div>
            </div>
            <div className="armor-row">
              <span className="sans-label">Броня цели</span>
              <Stepper label="Броня цели" value={ignoreArmor ? 0 : armor} min={0} max={ignoreArmor ? 0 : ARMOR_MAX} onChange={setArmor} />
            </div>
          </div>
          <div className="actions">
            <button className="button primary sans-button" onClick={onClose}>Готово</button>
          </div>
        </>}
      </div>
    </div>
  );
}
