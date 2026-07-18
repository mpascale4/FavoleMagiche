import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import AccessibleApp from './accessibility/AccessibleApp';
import './index.css';
import './accessibility/accessibility.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AccessibleApp />
  </StrictMode>,
);
