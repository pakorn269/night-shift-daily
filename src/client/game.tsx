import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GameView } from './components/GameView.tsx';

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <GameView />
    </StrictMode>
  );
}
