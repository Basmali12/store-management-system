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
