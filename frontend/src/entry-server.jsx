import React from 'react';
import { renderToString } from 'react-dom/server';
import App from './App.jsx';
import { resolvePageMetadata } from './utils/seo.js';

export function render(url, options = {}) {
  const metadata = resolvePageMetadata(url, options);
  const lang = metadata.locale || 'en';
  const dir = metadata.direction || (lang === 'ar' ? 'rtl' : 'ltr');
  const title = metadata.title;

  const html = renderToString(<App initialUrl={url} initialLocale={lang} />);

  const headTags = metadata.renderHeadTags();

  return {
    html,
    title,
    lang,
    dir,
    metadata,
    head: `<title>${title}</title>\n    ${headTags}`,
  };
}
