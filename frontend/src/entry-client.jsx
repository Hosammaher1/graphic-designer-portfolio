import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './app/App.jsx';
import { initWebVitals } from './utils/webVitals.js';
import './styles/global.css';
import './index.css';

hydrateRoot(
  document.getElementById('root'),
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// Initialize Core Web Vitals RUM monitoring in idle frame (Task 07.09)
if (typeof window !== 'undefined') {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => initWebVitals());
  } else {
    setTimeout(() => initWebVitals(), 1000);
  }
}
