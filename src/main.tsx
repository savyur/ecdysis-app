import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './ui/base.css';
import './ui/components.css';
import { App } from './App';
import { EngineCheck } from './screens/EngineCheck';

// Временный экран «Расчёт» — по адресу #calc.
const Root = location.hash === '#calc' ? EngineCheck : App;
createRoot(document.getElementById('root')!).render(<StrictMode><Root /></StrictMode>);
