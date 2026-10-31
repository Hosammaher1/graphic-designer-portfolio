import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import App from './app/App.jsx';
import { resolvePageMetadata } from './utils/seo.js';

export function render(url, options = {}) {
  const metadata = resolvePageMetadata(url, options);
  const lang = metadata.locale;
  const dir = metadata.direction;
  const title = metadata.title;

  const html = renderToString(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>
  );

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
