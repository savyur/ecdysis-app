// Хранение персонажа на телефоне. Пока localStorage; IndexedDB и очередь правок — следующим шагом.
import { useCallback, useEffect, useState } from 'react';
import type { Character } from '../data/types';
import { demoCharacter } from './demo';

const KEY = 'ecdysis.character.v1';

function load(): Character {
  try { const s = localStorage.getItem(KEY); if (s) return JSON.parse(s); } catch { /* нет хранилища */ }
  return demoCharacter();
}

export function useCharacter() {
  const [c, setC] = useState<Character>(load);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch { /* нет хранилища */ } }, [c]);
  const update = useCallback((f: (c: Character) => Character) => setC(prev => ({ ...f(prev), updatedAt: new Date().toISOString() })), []);
  return [c, update] as const;
}
