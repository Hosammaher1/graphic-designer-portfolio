import React from 'react';
import { hydrateRoot, createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { initWebVitals } from './utils/webVitals.js';

const container = document.getElementById('root');
if (container) {
  if (container.hasChildNodes() && container.innerHTML.trim().length > 0) {
    hydrateRoot(container, <App />);
  } else {
    createRoot(container).render(<App />);
  }
}

// Initialize Core Web Vitals RUM monitoring in idle frame (Task 07.09)
if (typeof window !== 'undefined') {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => initWebVitals());
  } else {
    setTimeout(() => initWebVitals(), 1000);
  }
}
