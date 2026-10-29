import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import App from './app/App.jsx';

export function render(url) {
  const isArabic = url.startsWith('/ar') || url === '/' || url === '';
  const lang = isArabic ? 'ar' : 'en';
  const dir = isArabic ? 'rtl' : 'ltr';
  const title = isArabic
    ? 'محمد — مصمم جرافيك'
    : 'Mohammed — Graphic Designer';

  const html = renderToString(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>
  );

  return {
    html,
    title,
    lang,
    dir,
    head: `<title>${title}</title>`,
  };
}
