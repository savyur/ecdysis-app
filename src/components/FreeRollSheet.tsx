// Шторка «Свободный бросок»: setup → result. В лист ничего не пишется.
import { useEffect, useState } from 'react';
import { DICE, COUNT_MIN, COUNT_MAX, MOD_MIN, MOD_MAX, notation, rollDice, type Sides } from '../engine/dice';
import { Icon } from '../ui/icons';
import { signed } from './sheet';

export function Stepper({ value, min, max, onChange, sign, label }: {
  value: number; min: number; max: number; onChange: (v: number) => void; sign?: boolean; label: string;
}) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button className="icon-button" aria-label="Меньше" disabled={value <= min} onClick={() => onChange(value - 1)}><Icon name="ui/minus" /></button>
      <span className="value sans-title tnum">{sign ? signed(value) : value}</span>
      <button className="icon-button" aria-label="Больше" disabled={value >= max} onClick={() => onChange(value + 1)}><Icon name="ui/plus" /></button>
    </div>
  );
}

export const Chip = ({ value }: { value: number | string }) => <span className="chip sans-value tnum">{value}</span>;

export function FreeRollSheet({ onClose }: { onClose: () => void }) {
  const [sides, setSides] = useState<Sides>(6);
  const [count, setCount] = useState(1);
  const [mod, setMod] = useState(0);
  const [res, setRes] = useState<{ dice: number[]; total: number } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const note = notation(count, sides, mod);
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet roll-sheet free" role="dialog" aria-modal="true" aria-label="Свободный бросок" onClick={e => e.stopPropagation()}>
        <div className="grip-row"><div className="grip" /></div>
        <div className="sheet-title-row">
          <span className="sheet-title sans-title">Свободный бросок</span>
          <button className="icon-button" aria-label="Закрыть" onClick={onClose}><Icon name="ui/close" /></button>
        </div>
        {!res ? <>
          <div className="calc free-calc">
            <span className="sans-display tnum notation">{note}</span>
            <div className="segment" role="radiogroup" aria-label="Куб">
              {DICE.map(d => (
                <button key={d} role="radio" aria-checked={d === sides} className={`option sans-value${d === sides ? ' selected' : ''}`} onClick={() => setSides(d)}>d{d}</button>
              ))}
            </div>
            <div className="params">
              <div className="field"><span className="sans-label">Кубов</span><Stepper label="Кубов" value={count} min={COUNT_MIN} max={COUNT_MAX} onChange={setCount} /></div>
              <div className="field"><span className="sans-label">Модификатор</span><Stepper label="Модификатор" value={mod} min={MOD_MIN} max={MOD_MAX} onChange={setMod} sign /></div>
            </div>
          </div>
          <div className="actions">
            <button className="button primary sans-button" onClick={() => setRes(rollDice(count, sides, mod))}><Icon name="ui/die" size={20} />Бросить</button>
          </div>
        </> : <>
          <div className="calc free-result">
            <span className="sans-display tnum">{res.total}</span>
            <span className="sans-label against tnum">{note}</span>
            <div className="dice">
              {res.dice.map((d, i) => <Chip key={i} value={d} />)}
              {mod !== 0 && <span className="mod sans-value tnum">{signed(mod)}</span>}
            </div>
          </div>
          <div className="actions">
            <button className="button sans-button" onClick={() => setRes(null)}>Ещё раз</button>
            <button className="button primary sans-button" onClick={onClose}>Готово</button>
          </div>
        </>}
      </div>
    </div>
  );
}
