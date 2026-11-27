// Экран игрока: StatusBar сверху, лист в середине, TabBar снизу.
import { useCallback, useEffect, useState } from 'react';
import { useCharacter } from './store/character';
import { StatusBar, SheetHeader, StatGrid, Aspects, TabBar, type Tab } from './components/sheet';
import { RollSheet, type RollSubject } from './components/RollSheet';
import { FreeRollSheet } from './components/FreeRollSheet';
import { markOnFail } from './engine/character';

export function App() {
  const [c, update] = useCharacter();
  const [tab, setTab] = useState<Tab>('sheet');
  const [roll, setRoll] = useState<RollSubject | null>(null);
  const [free, setFree] = useState(false);
  useEffect(() => {
    const m = matchMedia('(prefers-color-scheme: dark)');
    const set = () => { document.documentElement.dataset.theme = m.matches ? 'night' : 'day'; };
    set(); m.addEventListener('change', set);
    return () => m.removeEventListener('change', set);
  }, []);
  const close = useCallback(() => setRoll(null), []);
  const closeFree = useCallback(() => setFree(false), []);

  return (
    <div className="screen">
      <StatusBar c={c} onFreeRoll={() => setFree(true)} />
      <main className="screen-content">
        {tab === 'sheet' ? <>
          <SheetHeader c={c} />
          <StatGrid c={c} onStat={s => setRoll({ kind: 'stat', id: s, name: s, value: c.stats[s] * 5 })} />
          <Aspects c={c} onSkill={s => setRoll({ kind: 'skill', id: s.id, name: s.name, value: c.skills[s.id] ?? 0 })} />
        </> : <p className="sans-label" style={{ color: 'var(--text-secondary)' }}>Вкладка в работе.</p>}
      </main>
      <TabBar active={tab} onTab={setTab} />
      {free && <FreeRollSheet onClose={closeFree} />}
      {roll && <RollSheet c={c} subject={roll} onClose={close}
        onResult={ok => update(x => markOnFail(x, roll.id, ok))} />}
    </div>
  );
}
