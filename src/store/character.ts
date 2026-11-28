// Хранение персонажа на телефоне. Пока localStorage; IndexedDB и очередь правок — следующим шагом.
import { useCallback, useEffect, useState } from 'react';
import type { Character } from '../data/types';
import { demoCharacter, DEMO_ITEMS } from './demo';

const KEY = 'ecdysis.character.v1';

function load(): Character {
  try {
    const s = localStorage.getItem(KEY);
    if (s) {
      const c: Character = JSON.parse(s);
      // Демо из прежней версии без оружия: добавить оружие.
      if (c.id === 'demo' && c.items.length === 0) c.items = DEMO_ITEMS.map(i => ({ ...i }));
      return c;
    }
  } catch { /* нет хранилища */ }
  return demoCharacter();
}

export function useCharacter() {
  const [c, setC] = useState<Character>(load);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch { /* нет хранилища */ } }, [c]);
  const update = useCallback((f: (c: Character) => Character) => setC(prev => ({ ...f(prev), updatedAt: new Date().toISOString() })), []);
  return [c, update] as const;
}
