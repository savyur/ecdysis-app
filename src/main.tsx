import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './ui/base.css';
import { EngineCheck } from './screens/EngineCheck';

createRoot(document.getElementById('root')!).render(<StrictMode><EngineCheck /></StrictMode>);
