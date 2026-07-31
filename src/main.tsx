import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Patchtone root element is missing.');
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  void navigator.serviceWorker.register('/sw.js').catch(() => undefined);
}

async function mountSurface(): Promise<void> {
  const kasaneRoute = window.location.pathname === '/kasane' || window.location.pathname.startsWith('/kasane/');
  const Surface = kasaneRoute
    ? (await import('./features/kasane/KasaneCompositionDesk')).KasaneCompositionDesk
    : (await import('./App')).App;
  createRoot(root as HTMLElement).render(
    <StrictMode>
      <Surface />
    </StrictMode>,
  );
}

void mountSurface();
