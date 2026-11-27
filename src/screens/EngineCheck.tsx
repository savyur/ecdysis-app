// Временный экран «Расчёт»: проверка движка на телефоне до сборки экранов из Figma.
import { useEffect, useState } from 'react';
import seed from '../data/seed.json';
import type { AspectId } from '../data/types';
import { target, step, d100, opposed, opposedChance, type Mod, type Step } from '../engine/roll';
import { ASPECT_IDS, aspectMod, effectiveDeviation, raise, spend, knockSoulMod, oversaturated, type Aspects } from '../engine/aspects';

const STEP_TEXT: Record<Step, string> = { 'crit-success': 'Критический успех', success: 'Успех', fail: 'Провал', 'crit-fail': 'Критический провал' };
const aspectInfo = Object.fromEntries(seed.aspects.map(a => [a.id, a])) as unknown as Record<AspectId, { name: string; symbol: string }>;
const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0');

const MOD_PRESETS: { label: string; mod: Mod }[] = [
  { label: 'Бонус +10', mod: { source: 'Бонус', value: 10 } },
  { label: 'Преимущество +20', mod: { source: 'Преимущество', value: 20 } },
  { label: 'Штраф −10', mod: { source: 'Штраф', value: -10 } },
  { label: 'Помеха −20', mod: { source: 'Помеха', value: -20 } },
  { label: 'Прицеливание +20', mod: { source: 'Прицеливание', value: 20 } },
  { label: 'Укрытие −20', mod: { source: 'Укрытие', value: -20 } },
];

function load<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function usePersist<T>(key: string, init: T) {
  const [v, setV] = useState<T>(() => load(key, init));
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* без хранилища */ } }, [key, v]);
  return [v, setV] as const;
}

const startAspects = () => Object.fromEntries(ASPECT_IDS.map(id => [id, { base: 3, cur: 3 }])) as Aspects;

export function EngineCheck() {
  const [theme, setTheme] = usePersist<'day' | 'night'>('theme', 'day');
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);

  const [aspects, setAspects] = usePersist<Aspects>('aspects', startAspects());
  const [skillAspect, setSkillAspect] = usePersist<AspectId | ''>('skillAspect', '');
  const [skill, setSkill] = usePersist('skill', 50);
  const [picked, setPicked] = useState<number[]>([]);
  const [roll, setRoll] = useState<number | null>(null);
  const [delta, setDelta] = useState(1);
  const [sel, setSel] = useState<AspectId>('edge');
  const [att, setAtt] = useState(50), [def, setDef] = useState(50);
  const [duel, setDuel] = useState<{ a: number; d: number } | null>(null);

  const mods: Mod[] = picked.map(i => MOD_PRESETS[i].mod);
  if (skillAspect) { const v = aspectMod(aspects, skillAspect); if (v) mods.push({ source: 'Аспект', value: v }); }
  const unlocked = !!skillAspect && aspects[skillAspect].cur > aspects[skillAspect].base;
  const tgt = target(skill, mods, unlocked);
  const res = roll != null && tgt != null ? step(roll, tgt) : null;
  const chance = opposedChance(att, def);
  const duelRes = duel ? opposed(duel.a, att, duel.d, def) : null;

  const setAsp = (id: AspectId, f: 'base' | 'cur', d: number) =>
    setAspects(a => ({ ...a, [id]: { ...a[id], [f]: Math.max(0, f === 'base' ? Math.min(11, a[id][f] + d) : a[id][f] + d) } }));

  return (
    <main className="page">
      <header className="group">
        <div className="sans-title">Расчёт</div>
        <div className="sans-caption secondary">Временный экран: проверка движка правил. Экраны из Figma заменят его.</div>
        <div className="chips">
          <button className={`chip sans-badge ${theme === 'day' ? 'selected' : ''}`} onClick={() => setTheme('day')}>День</button>
          <button className={`chip sans-badge ${theme === 'night' ? 'selected' : ''}`} onClick={() => setTheme('night')}>Ночь</button>
        </div>
      </header>

      <section className="group">
        <div className="section-head sans-section">Бросок умения</div>
        <div className="two">
          <label className="field"><span className="sans-caption secondary">Умение, %</span>
            <input className="input sans-value" type="number" inputMode="numeric" min={0} max={95} step={5} value={skill}
              onChange={e => { setSkill(Math.max(0, Math.min(95, +e.target.value || 0))); setRoll(null); }} /></label>
          <label className="field"><span className="sans-caption secondary">Аспект умения</span>
            <select className="input sans-label" value={skillAspect} onChange={e => { setSkillAspect(e.target.value as AspectId | ''); setRoll(null); }}>
              <option value="">— нет —</option>
              {ASPECT_IDS.map(id => <option key={id} value={id}>{aspectInfo[id].symbol} {aspectInfo[id].name}</option>)}
            </select></label>
        </div>
        <div className="chips">
          {MOD_PRESETS.map((p, i) => (
            <button key={p.label} className={`chip sans-badge ${picked.includes(i) ? 'selected' : ''}`}
              onClick={() => { setPicked(s => s.includes(i) ? s.filter(x => x !== i) : [...s, i]); setRoll(null); }}>{p.label}</button>
          ))}
        </div>
        <div className="card">
          {mods.map((m, i) => <div className="row" key={i}><span className="grow sans-label">{m.source}</span><span className={`badge sans-badge ${m.value < 0 ? 'minus' : ''}`}>{signed(m.value)}</span></div>)}
          <div className="row"><span className="grow sans-label">Цель</span><span className="sans-stat">{tgt == null ? '—' : tgt}</span></div>
        </div>
        {tgt == null && <div className="sans-caption signal">Умение 0%: бросок только с преимуществом или при Аспекте выше базы.</div>}
        <div className="actions">
          <button className="btn primary sans-button" disabled={tgt == null} onClick={() => setRoll(d100())}>Бросить d100</button>
        </div>
        {res && <div className={`card result ${res}`}><span className="sans-stat">{roll}</span><span className="sans-label">{STEP_TEXT[res]}</span></div>}
      </section>

      <section className="group">
        <div className="section-head sans-section">Аспекты</div>
        <div className="card">
          {ASPECT_IDS.map(id => {
            const dev = effectiveDeviation(aspects, id), m = aspectMod(aspects, id);
            return (
              <div className="row" key={id} onClick={() => setSel(id)} style={sel === id ? { background: 'var(--fill-band)' } : undefined}>
                <span className="pip" style={{ background: `var(--aspect-${id})` }} />
                <span className="grow sans-label">{aspectInfo[id].symbol} {aspectInfo[id].name}</span>
                <span className="sans-value secondary">{aspects[id].base}</span>
                <span className="sans-value num">{aspects[id].cur}</span>
                <span className={`badge sans-badge ${m < 0 ? 'minus' : ''}`} title={`отклонение ${dev}`}>{signed(m)}</span>
              </div>
            );
          })}
        </div>
        <div className="sans-caption secondary">Колонки: база, текущее, модификатор умений. Нажмите строку, чтобы выбрать Аспект.</div>
        <div className="card">
          <div className="row"><span className="grow sans-label">Выбран</span><span className="sans-label">{aspectInfo[sel].symbol} {aspectInfo[sel].name}</span></div>
          <div className="row"><span className="grow sans-label">База</span>
            <button className="icon-btn" onClick={() => setAsp(sel, 'base', -1)}>−</button>
            <span className="sans-value num">{aspects[sel].base}</span>
            <button className="icon-btn" onClick={() => setAsp(sel, 'base', 1)}>+</button></div>
          <div className="row"><span className="grow sans-label">На сколько</span>
            <button className="icon-btn" onClick={() => setDelta(d => Math.max(1, d - 1))}>−</button>
            <span className="sans-value num">{delta}</span>
            <button className="icon-btn" onClick={() => setDelta(d => d + 1)}>+</button></div>
        </div>
        <div className="actions">
          <button className="btn sans-button" onClick={() => setAspects(a => spend(a, { [sel]: delta }))}>Потратить</button>
          <button className="btn primary sans-button" onClick={() => setAspects(a => raise(a, { [sel]: delta }))}>Поднять</button>
        </div>
        <div className="actions">
          <button className="btn sans-button" onClick={() => setAspects(a => Object.fromEntries(ASPECT_IDS.map(id => [id, { ...a[id], cur: a[id].base }])) as Aspects)}>Сон: к базе</button>
        </div>
        <div className="card">
          <div className="row"><span className="grow sans-label">Проверки Души (Стук)</span><span className={`badge sans-badge ${knockSoulMod(aspects) < 0 ? 'minus' : ''}`}>{signed(knockSoulMod(aspects))}</span></div>
          <div className="row"><span className="grow sans-label">Перенасыщение (12+)</span><span className="sans-label">{oversaturated(aspects).map(id => aspectInfo[id].name).join(', ') || 'нет'}</span></div>
        </div>
      </section>

      <section className="group">
        <div className="section-head sans-section">Противостояние</div>
        <div className="two">
          <label className="field"><span className="sans-caption secondary">Нападающий, %</span>
            <input className="input sans-value" type="number" inputMode="numeric" value={att} onChange={e => { setAtt(Math.max(10, Math.min(95, +e.target.value || 10))); setDuel(null); }} /></label>
          <label className="field"><span className="sans-caption secondary">Защитник, %</span>
            <input className="input sans-value" type="number" inputMode="numeric" value={def} onChange={e => { setDef(Math.max(10, Math.min(95, +e.target.value || 10))); setDuel(null); }} /></label>
        </div>
        <div className="card">
          <div className="row"><span className="grow sans-label">Шанс нападающего</span><span className="sans-value">{(chance.win * 100).toFixed(2)}%</span></div>
          <div className="row"><span className="grow sans-label">Переброс (равные броски)</span><span className="sans-value">{(chance.tie * 100).toFixed(2)}%</span></div>
        </div>
        <div className="actions"><button className="btn primary sans-button" onClick={() => setDuel({ a: d100(), d: d100() })}>Бросить оба</button></div>
        {duel && duelRes && <div className="card result">
          <span className="sans-label">Нападающий {duel.a}: {STEP_TEXT[step(duel.a, att)]}</span>
          <span className="sans-label">Защитник {duel.d}: {STEP_TEXT[step(duel.d, def)]}</span>
          <span className="sans-stat">{{ attacker: 'Нападающий побеждает', defender: 'Защитник побеждает', none: 'Оба провалились: атака не проходит', reroll: 'Ничья: переброс' }[duelRes]}</span>
        </div>}
      </section>
    </main>
  );
}
