// Компоненты экрана Player / Sheet. Имена — как в Figma.
import type { ReactNode } from 'react';
import type { AspectId, Character, Stat } from '../data/types';
import seed from '../data/seed.json';
import { SKILLS, type SkillRef } from '../data/skills';
import { Icon, aspectIcon } from '../ui/icons';
import { hpMax, wpMax, STATS } from '../engine/character';
import { aspectMod } from '../engine/aspects';
import { ASPECT_IDS } from '../engine/aspects';

const ASPECT_NAME = Object.fromEntries(seed.aspects.map(a => [a.id, a.name])) as Record<AspectId, string>;
const LEVEL = Object.fromEntries(seed.levels.map(l => [l.id, l])) as Record<string, { name: string; aspectSum: number }>;
const LIGHT_SYMBOL: AspectId[] = ['sky', 'knock'];
export const aspectName = (id: AspectId) => ASPECT_NAME[id];
export const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0');

export function StatusChip({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className={`status-chip${danger ? ' danger' : ''}`}>
      <span className="label sans-section">{label}</span>
      <span className="sans-stat tnum">{value}</span>
    </div>
  );
}

export function StatusBar({ c, onFreeRoll }: { c: Character; onFreeRoll?: () => void }) {
  const soul = c.soul.whole;
  return (
    <div className="status-bar">
      <div className="chips">
        <StatusChip label="ОЗ" value={`${c.hp.cur} / ${hpMax(c)}`} danger={c.hp.cur <= 2} />
        <StatusChip label="ОВ" value={`${c.wp.cur} / ${wpMax(c)}`} />
        <StatusChip label="Душа" value={`${soul} / 9`} danger={soul <= 3} />
        <button className="free-roll" aria-label="Свободный бросок" onClick={onFreeRoll} disabled={!onFreeRoll}><Icon name="ui/die" /></button>
      </div>
    </div>
  );
}

export function Plate({ children, signal }: { children: ReactNode; signal?: boolean }) {
  return <span className={`plate sans-section${signal ? ' signal' : ''}`}>{children}</span>;
}

export function SectionHead({ title, action }: { title: string; action?: ReactNode }) {
  return <div className="section-head"><Plate>{title}</Plate>{action}</div>;
}

export function SheetHeader({ c }: { c: Character }) {
  const level = LEVEL[c.level];
  return (
    <div className="sheet-header">
      <div className="head">
        <Plate>Искатель</Plate>
        <span className="level sans-section tnum">{level ? `${level.name} · ${level.aspectSum}` : ''}</span>
        <div className="tools">
          <button className="icon-button" aria-label="Правка" disabled><Icon name="ui/edit" /></button>
          <button className="icon-button" aria-label="Меню" disabled><Icon name="ui/menu" /></button>
        </div>
      </div>
      <div className="name sans-display">{c.name}</div>
      <div className="profession sans-label trim">{c.profession}</div>
      {c.temptation && <div className="temptation"><span className="sans-section">Соблазн</span><Plate signal>{c.temptation}</Plate></div>}
    </div>
  );
}

export function StatGrid({ c, onStat }: { c: Character; onStat: (s: Stat) => void }) {
  return (
    <section className="stat-grid">
      <SectionHead title="Характеристики" />
      <div className="cells">
        {STATS.map(s => (
          <button key={s} className="stat-cell" onClick={() => onStat(s)}>
            <span className="label sans-section">{s}</span>
            <span className="values sans-stat tnum"><span>{c.stats[s]}</span><span className="pct">{c.stats[s] * 5}%</span></span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function PipRow({ base, current }: { base: number; current: number }) {
  return (
    <div className="pip-row" aria-label={`${current} из ${base}`}>
      <div className="band" style={{ width: `calc(${Math.min(base, 15)} * 16px)` }} />
      {Array.from({ length: 15 }, (_, i) => {
        const n = i + 1;
        const cls = n <= current ? (n >= 12 ? 'over' : 'filled') : '';
        return <div className="pip" key={i}><div className={`dot ${cls}`} style={cls === 'filled' ? { background: 'var(--aspect-current)' } : undefined} /></div>;
      })}
    </div>
  );
}

export function AspectHeader({ c, id }: { c: Character; id: AspectId }) {
  const { base, cur } = c.aspects[id];
  const mod = aspectMod(c.aspects, id);
  return (
    <div className="aspect-header">
      <div className={`aspect-badge${LIGHT_SYMBOL.includes(id) ? ' light' : ''}`} style={{ background: 'var(--aspect-current)' }}><Icon name={aspectIcon(id)} size={20} /></div>
      <div className="info">
        <div className="title-row">
          <span className="sans-section">{ASPECT_NAME[id]}</span>
          <span className="leader" />
          {mod !== 0 && <span className={`badge sans-badge tnum${mod < 0 ? ' minus' : ''}`}>{signed(mod)}</span>}
          <span className={`value sans-value tnum trim${cur >= 12 ? ' over' : ''}`}>{cur} / {base}</span>
        </div>
        <PipRow base={base} current={cur} />
      </div>
    </div>
  );
}

export function SkillRow({ skill, value, marked, onClick }: { skill: SkillRef; value: number; marked?: boolean; onClick: () => void }) {
  return (
    <button className={`skill-row${value === 0 ? ' zero' : ''}`} onClick={onClick}>
      <span className="name sans-label trim">{skill.name}{marked && <span className="mark" aria-label="отметка">·</span>}</span>
      <span className="value sans-value tnum trim">{value}%</span>
    </button>
  );
}

export function AspectBlock({ c, id, onSkill }: { c: Character; id: AspectId; onSkill: (s: SkillRef) => void }) {
  const skills = SKILLS.filter(s => s.aspect === id).sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  return (
    <div className="aspect-block" style={{ ['--aspect-current' as string]: `var(--aspect-${id})` }}>
      <AspectHeader c={c} id={id} />
      <div>{skills.map(s => <SkillRow key={s.id} skill={s} value={c.skills[s.id] ?? 0} marked={c.marks[s.id]} onClick={() => onSkill(s)} />)}</div>
    </div>
  );
}

export function Aspects({ c, onSkill }: { c: Character; onSkill: (s: SkillRef) => void }) {
  return (
    <section className="aspects">
      <SectionHead title="Аспекты" />
      {ASPECT_IDS.map(id => <AspectBlock key={id} c={c} id={id} onSkill={onSkill} />)}
    </section>
  );
}

export type Tab = 'sheet' | 'occult' | 'soul' | 'inventory';
const TABS: { id: Tab; label: string }[] = [
  { id: 'sheet', label: 'Лист' }, { id: 'occult', label: 'Оккультное' }, { id: 'soul', label: 'Душа' }, { id: 'inventory', label: 'Инвентарь' },
];
export function TabBar({ active, onTab }: { active: Tab; onTab: (t: Tab) => void }) {
  return (
    <nav className="tab-bar">
      {TABS.map(t => (
        <button key={t.id} className={`tab${active === t.id ? ' active' : ''}`} onClick={() => onTab(t.id)}>
          <span className="indicator"><Icon name={`ui/${t.id}`} /></span>
          <span className="sans-section">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
