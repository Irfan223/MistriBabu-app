import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (import.meta.env.PROD) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      immediate: true,
      onRegisteredSW(_url, registration) {
        // index.html itself is precached, so poll for a fresh sw.js every
        // few minutes to catch deployments while the app stays open.
        if (!registration) return;
        setInterval(() => {
          registration.update();
        }, 5 * 60 * 1000);
      },
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
