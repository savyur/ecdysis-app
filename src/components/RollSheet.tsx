// Шторка броска: подготовка → (ввод вручную) → результат. Имена — как в Figma (RollSheet).
import { useEffect, useState } from 'react';
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

export function Segment({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="segment" role="radiogroup" aria-label="Ситуация">
      {SITUATION.map(v => (
        <button key={v} role="radio" aria-checked={v === value} className={`option sans-value tnum${v === value ? ' selected' : ''}`} onClick={() => onChange(v)}>{signed(v)}</button>
      ))}
    </div>
  );
}

function Formula({ base, mods, label, situation }: { base: number; mods: Mod[]; label: string; situation: number }) {
  return (
    <div className="formula sans-label">
      <span className="group">{label} <span className="tnum">{base}</span></span>
      {mods.map(m => (
        <span className="group" key={m.source}>· {m.source} <span className={`badge sans-badge tnum${m.value < 0 ? ' minus' : ''}`}>{signed(m.value)}</span></span>
      ))}
      <span className="group">· Ситуация <span className="tnum">{signed(situation)}</span></span>
    </div>
  );
}

const sourceName = (s: string) => (s === 'aspect' ? '' : s);

export function RollSheet({ c, subject, onClose, onResult }: {
  c: Character; subject: RollSubject; onClose: () => void; onResult: (success: boolean) => void;
}) {
  const [mode, setMode] = useState<'setup' | 'manual' | 'result'>('setup');
  const [situation, setSituation] = useState(0);
  const [text, setText] = useState('');
  const [roll, setRoll] = useState<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const ref = subject.kind === 'skill' ? SKILL_BY_ID[subject.id] : undefined;
  const situational: Mod[] = situation ? [{ source: 'Ситуация', value: situation }] : [];
  const baseMods = subject.kind === 'skill' ? skillMods(c, subject.id) : [];
  const sourceMods: Mod[] = baseMods.map(m => ({ source: m.source === 'aspect' && ref ? aspectName(ref.aspect) : sourceName(m.source), value: m.value }));
  const shown: Mod[] = [...sourceMods, ...situational];
  const unlocked = !!ref && c.aspects[ref.aspect].cur > c.aspects[ref.aspect].base;
  const tgt = target(subject.value, [...baseMods, ...situational], unlocked);
  const label = subject.kind === 'skill' ? 'Умение' : subject.id;

  const finish = (r: number) => {
    setRoll(r); setMode('result');
    if (tgt !== null && subject.kind === 'skill') onResult(isSuccess(step(r, tgt)));
  };

  const parsed = text === '' ? null : Number(text) === 0 ? 100 : Number(text);
  const manualOk = parsed !== null && parsed >= 1 && parsed <= 100 && text.length <= 3;
  const s = roll !== null && tgt !== null ? step(roll, tgt) : null;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet roll-sheet" role="dialog" aria-modal="true" aria-label={subject.name} onClick={e => e.stopPropagation()}>
        <div className="grip-row"><div className="grip" /></div>
        <div className="sheet-title-row">
          <span className="sheet-title sans-title">{subject.name}</span>
          <button className="icon-button" aria-label="Закрыть" onClick={onClose}><Icon name="ui/close" /></button>
        </div>

        {mode === 'setup' && <>
          <div className="calc">
            <div className="card-row">
              <svg className="illustration" viewBox="0 0 120 160" aria-hidden="true"><rect x="0.5" y="0.5" width="119" height="159" fill="none" stroke="currentColor" /><path d="M0 0L120 160M120 0L0 160" stroke="currentColor" /></svg>
              <div className="target">
                <div className="target-number tnum">
                  {tgt === null ? <span className="sans-title">Нельзя</span> : <><span className="sans-display">{tgt}</span><span className="sans-title">%</span></>}
                </div>
                <Formula base={subject.value} mods={sourceMods} label={label} situation={situation} />
                {tgt === null && <span className="sans-label against">Нужно преимущество +20 или Аспект выше базы</span>}
              </div>
            </div>
            <Segment value={situation} onChange={setSituation} />
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
            <div className="card-row fill">
              <svg className="illustration" viewBox="0 0 120 160" aria-hidden="true"><rect x="0.5" y="0.5" width="119" height="159" fill="none" stroke="currentColor" /><path d="M0 0L120 160M120 0L0 160" stroke="currentColor" /></svg>
              <div className="result">
                <div className="result-line"><span className="sans-display tnum">{pad(roll)}</span><Tag s={s} /></div>
                <span className="against sans-label tnum">Против цели {tgt} · {label} {subject.value}{shown.length ? ` · ${shown.map(m => `${m.source} ${signed(m.value)}`).join(' · ')}` : ''}{modSum([...baseMods, ...situational]) !== shown.reduce((a, m) => a + m.value, 0) ? ' (предел ±40)' : ''}</span>
                {subject.kind === 'skill' && !isSuccess(s) && <span className="mark-note sans-caption">Отметка поставлена: +5% между вылазками</span>}
              </div>
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
