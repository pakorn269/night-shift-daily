import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SplashView } from './components/SplashView.tsx';

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <SplashView />
    </StrictMode>
  );
}
