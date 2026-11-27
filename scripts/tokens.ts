// Генерация CSS-переменных из src/data/tokens.json (копия блока «Токены для кода» Дизайн-системы).
// Запуск: npm run tokens. Результат: src/ui/tokens.css. Руками не править.
import { readFileSync, writeFileSync } from 'node:fs';

const t = JSON.parse(readFileSync('src/data/tokens.json', 'utf8'));
const prim: Record<string, string> = t.color.primitives;
const varName = (k: string) => '--' + k.replace(/\//g, '-');

function hexA(hex: string, pct: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255} / ${pct}%)`;
}
// Запись роли: «ink/800», «ink/800` 40%», «→ `aspect/edge». Обратные кавычки — след разметки в документе.
function resolve(v: string): string {
  const s = v.replace(/`/g, '').trim();
  if (s.startsWith('→')) return `var(${varName(s.slice(1).trim())})`;
  const m = s.match(/^(\S+)\s+(\d+)%$/);
  if (m) { if (!prim[m[1]]) throw new Error('Нет примитива ' + m[1]); return hexA(prim[m[1]], +m[2]); }
  if (!prim[s]) throw new Error('Нет примитива ' + s);
  return `var(${varName(s)})`;
}

const root: string[] = [], day: string[] = [], night: string[] = [];
for (const [k, v] of Object.entries(prim)) root.push(`${varName(k)}: ${v};`);
for (const [id, a] of Object.entries<any>(t.color.aspects)) root.push(`--aspect-${id}: ${a.fill};`);
for (const [k, v] of Object.entries<number>(t.space)) root.push(`${varName(k)}: ${v}px;`);
for (const [k, v] of Object.entries<any>(t.radius)) root.push(`${varName(k)}: ${v === 'circle' ? '9999px' : v + 'px'};`);
root.push(`--safe-top: env(safe-area-inset-top, 0px);`, `--safe-bottom: env(safe-area-inset-bottom, 0px);`);
for (const [k, v] of Object.entries<string>(t.motion)) {
  const ms = v.match(/(\d+)\s*мс/); if (ms) root.push(`${varName(k)}: ${ms[1]}ms;`);
}
for (const [k, v] of Object.entries<any>(t.color.roles)) {
  day.push(`${varName(k)}: ${resolve(v.day)};`);
  night.push(`${varName(k)}: ${resolve(v.night)};`);
}
const css = `/* Сгенерировано scripts/tokens.ts из src/data/tokens.json. Не править руками. */
:root {\n  ${root.join('\n  ')}\n}
:root, [data-theme="day"] {\n  ${day.join('\n  ')}\n}
[data-theme="night"] {\n  ${night.join('\n  ')}\n}
@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="day"]) {\n    ${night.join('\n    ')}\n  }\n}
`;
writeFileSync('src/ui/tokens.css', css);
console.log('tokens.css:', root.length + day.length, 'переменных');
