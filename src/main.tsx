import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {ConvexRoot} from './shared/convex/ConvexRoot';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConvexRoot>
      <App />
    </ConvexRoot>
  </StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).then(async () => {
      const registration = await navigator.serviceWorker.ready;
      const urls = performance.getEntriesByType('resource')
        .map(entry => entry.name)
        .filter(url => url.startsWith(window.location.origin));
      registration.active?.postMessage({ type: 'CACHE_URLS', urls });
    });
  });
}
