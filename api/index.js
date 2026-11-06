import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const clientDist = path.resolve(rootDir, 'frontend/dist/client');
const serverDist = path.resolve(rootDir, 'frontend/dist/server');

let template = '';
let render = null;

try {
  const templatePath = path.resolve(clientDist, 'index.html');
  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8');
  }
} catch (e) {
  console.warn('[Vercel SSR] Template read deferred:', e.message);
}

try {
  const serverEntryPath = path.resolve(serverDist, 'entry-server.js');
  if (fs.existsSync(serverEntryPath)) {
    const entry = await import(pathToFileURL(serverEntryPath).href);
    render = entry.render;
  }
} catch (e) {
  console.warn('[Vercel SSR] Server entry import deferred:', e.message);
}

export function getSecurityHeaders() {
  const backendUrl = process.env.BACKEND_URL || process.env.VITE_BACKEND_URL || '';
  const extraConnect = backendUrl ? ` ${backendUrl}` : '';
  const extraImg = backendUrl ? ` ${backendUrl}` : '';

  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    `img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com${extraImg}`,
    "font-src 'self' https://fonts.gstatic.com data:",
    `connect-src 'self' https://*.iconify.design${extraConnect}`,
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ];

  return {
    'Content-Security-Policy': cspDirectives.join('; '),
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
  };
}

export default async function handler(req, res) {
  try {
    const url = req.url || '/';
    const cleanUrl = url.split('?')[0];
    const headers = getSecurityHeaders();

    // Root alias or locale target (Default is strictly ENGLISH on root / and /en/)
    const isRoot = cleanUrl === '/' || cleanUrl === '';
    const effectiveUrl = isRoot ? '/en/' : cleanUrl;
    const isAr = effectiveUrl.startsWith('/ar');
    const lang = isAr ? 'ar' : 'en';
    const dir = isAr ? 'rtl' : 'ltr';

    // Instant Pre-rendered static delivery (0ms serverless response)
    if (isRoot || effectiveUrl === '/en/' || effectiveUrl === '/ar/') {
      const targetPath = isAr
        ? path.resolve(clientDist, 'ar/index.html')
        : (isRoot ? path.resolve(clientDist, 'index.html') : path.resolve(clientDist, 'en/index.html'));
      const fallbackPath = path.resolve(clientDist, 'index.html');
      const chosenPath = fs.existsSync(targetPath) ? targetPath : fallbackPath;

      if (fs.existsSync(chosenPath)) {
        try {
          const staticHtml = fs.readFileSync(chosenPath, 'utf-8');
          if (staticHtml.length > 5000 && !staticHtml.includes('<!--ssr-outlet-->')) {
            res.writeHead(200, {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=86400',
              ...headers,
            });
            res.end(staticHtml);
            return;
          }
        } catch (readErr) {
          console.warn('[Vercel SSR] Static read failed, falling back to dynamic render:', readErr.message);
        }
      }
    }

    // SSR rendering for public or admin routes
    if (!render) {
      const serverEntryPath = path.resolve(serverDist, 'entry-server.js');
      if (fs.existsSync(serverEntryPath)) {
        const entry = await import(pathToFileURL(serverEntryPath).href);
        render = entry.render;
      }
    }

    if (!template) {
      const templatePath = path.resolve(clientDist, 'index.html');
      if (fs.existsSync(templatePath)) {
        template = fs.readFileSync(templatePath, 'utf-8');
      }
    }

    let appHtml = '';
    let title = 'Mohammed Maher | Creative Visual Designer';
    let headTags = '';
    
    if (render) {
      try {
        const rendered = await render(effectiveUrl);
        appHtml = rendered.html || '';
        lang = rendered.lang || lang;
        dir = rendered.dir || dir;
        title = rendered.title || title;
        if (rendered.metadata && typeof rendered.metadata.renderHeadTags === 'function') {
          headTags = rendered.metadata.renderHeadTags();
        } else if (rendered.head) {
          headTags = rendered.head;
        }
      } catch (renderError) {
        console.error('[Vercel SSR Render Failure]:', renderError.message);
      }
    }

    let responseHtml = template || '<!DOCTYPE html><html><head></head><body><div id="root"><!--ssr-outlet--></div></body></html>';

    // Inject lang, dir, head and appHtml
    responseHtml = responseHtml.replace(/<html[^>]*>/, `<html lang="${lang}" dir="${dir}">`);
    responseHtml = responseHtml.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
    responseHtml = responseHtml.replace(/<meta\s+name=["']description["'][^>]*>\s*/i, '');

    if (responseHtml.includes('<!--ssr-outlet-->')) {
      responseHtml = responseHtml.replace('<!--ssr-outlet-->', appHtml);
    } else if (responseHtml.includes('<div id="root"></div>')) {
      responseHtml = responseHtml.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
    }

    if (responseHtml.includes('<!--ssr-head-tags-->')) {
      responseHtml = responseHtml.replace('<!--ssr-head-tags-->', headTags);
    } else if (headTags && responseHtml.includes('</head>')) {
      responseHtml = responseHtml.replace('</head>', `    ${headTags}\n  </head>`);
    }

    // Inject initial bootstrap state for client hydration
    const initialDataScript = `<script id="__INITIAL_DATA__" type="application/json">${JSON.stringify({ locale: lang, dir })}</script>`;
    responseHtml = responseHtml.replace('</body>', `${initialDataScript}\n</body>`);

    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=86400',
      ...headers,
    });
    res.end(responseHtml);
  } catch (err) {
    console.error('[Vercel Handler Error]:', err);
    res.writeHead(500, {
      'Content-Type': 'text/plain; charset=utf-8',
    });
    res.end('500 - Internal Server Error');
  }
}
