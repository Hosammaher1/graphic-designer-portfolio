import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const isProd = process.env.NODE_ENV === 'production' || !process.env.VITE_DEV;
const port = parseInt(process.env.PORT || '3000', 10);

const clientDist = path.resolve(rootDir, 'dist/client');
const serverDist = path.resolve(rootDir, 'dist/server');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

/**
 * Generate environment-aware HTTP security headers.
 * Task 08.01 / 08.03 & SSR Hardening.
 */
export function getSecurityHeaders(isProduction = isProd) {
  const backendUrl = process.env.BACKEND_URL || process.env.VITE_BACKEND_URL || '';
  const extraConnect = backendUrl ? ` ${backendUrl}` : '';
  const extraImg = backendUrl ? ` ${backendUrl}` : '';

  const cspDirectives = [
    "default-src 'self'",
    isProduction
      ? "script-src 'self' 'unsafe-inline' https://fonts.googleapis.com"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    `img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com${extraImg}`,
    "font-src 'self' https://fonts.gstatic.com data:",
    isProduction
      ? `connect-src 'self' https://*.iconify.design${extraConnect}`
      : "connect-src 'self' http://localhost:* http://127.0.0.1:* https://*.iconify.design ws://localhost:* ws://127.0.0.1:*",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ];

  const headers = {
    'Content-Security-Policy': cspDirectives.join('; '),
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
  };

  if (isProduction) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
  }

  return headers;
}

export async function createServer() {
  let template = '';
  let render = null;

  if (fs.existsSync(path.resolve(clientDist, 'index.html'))) {
    template = fs.readFileSync(path.resolve(clientDist, 'index.html'), 'utf-8');
  }

  const serverEntryPath = path.resolve(serverDist, 'entry-server.js');
  if (fs.existsSync(serverEntryPath)) {
    const entry = await import(pathToFileURL(serverEntryPath).href);
    render = entry.render;
  }

  const server = http.createServer(async (req, res) => {
    try {
      const url = req.url || '/';
      const cleanUrl = url.split('?')[0];
      const headers = getSecurityHeaders(isProd);

      // Serve static assets from dist/client if file exists
      const staticFilePath = path.join(clientDist, cleanUrl);
      if (cleanUrl !== '/' && cleanUrl !== '/ar/' && cleanUrl !== '/en/' && !cleanUrl.startsWith('/admin') && fs.existsSync(staticFilePath) && fs.statSync(staticFilePath).isFile()) {
        const ext = path.extname(staticFilePath);
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': cleanUrl.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
          ...headers,
        });
        fs.createReadStream(staticFilePath).pipe(res);
        return;
      }

      // Proxy /api/, /sanctum/, /storage/ requests to Laravel API backend
      if (cleanUrl.startsWith('/api/') || cleanUrl.startsWith('/sanctum/') || cleanUrl.startsWith('/storage/') || cleanUrl === '/sitemap.xml' || cleanUrl === '/robots.txt') {
        const backendOrigin = process.env.BACKEND_URL || 'http://127.0.0.1:8001';
        const targetUrl = new URL(url, backendOrigin);
        const proxyHeaders = { ...req.headers, host: targetUrl.host };
        const proxyReq = http.request(
          targetUrl,
          {
            method: req.method,
            headers: proxyHeaders,
          },
          (proxyRes) => {
            if (proxyRes.headers['set-cookie']) {
              res.setHeader('set-cookie', proxyRes.headers['set-cookie']);
            }
            const proxyHeadersObj = { ...proxyRes.headers };
            delete proxyHeadersObj['set-cookie'];
            res.writeHead(proxyRes.statusCode || 500, {
              ...proxyHeadersObj,
              ...headers,
            });
            proxyRes.pipe(res);
          }
        );

        proxyReq.on('error', () => {
          if (cleanUrl === '/robots.txt') {
            const fallbackRobots = "User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /admin/\nDisallow: /api\nDisallow: /api/\n\nSitemap: http://localhost:3000/sitemap.xml\n";
            res.writeHead(200, {
              'Content-Type': 'text/plain; charset=utf-8',
              ...headers,
            });
            res.end(fallbackRobots);
            return;
          }
          if (cleanUrl === '/sitemap.xml') {
            const fallbackSitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n  <url><loc>http://localhost:3000/ar/</loc><xhtml:link rel="alternate" hreflang="ar" href="http://localhost:3000/ar/"/><xhtml:link rel="alternate" hreflang="en" href="http://localhost:3000/en/"/></url>\n  <url><loc>http://localhost:3000/en/</loc><xhtml:link rel="alternate" hreflang="ar" href="http://localhost:3000/ar/"/><xhtml:link rel="alternate" hreflang="en" href="http://localhost:3000/en/"/></url>\n</urlset>';
            res.writeHead(200, {
              'Content-Type': 'application/xml; charset=utf-8',
              ...headers,
            });
            res.end(fallbackSitemap);
            return;
          }
          res.writeHead(502, {
            'Content-Type': 'application/json',
            ...headers,
          });
          res.end(JSON.stringify({ status: 'error', message: 'API Gateway connection failure.' }));
        });

        req.pipe(proxyReq);
        return;
      }

      // Root redirect to default locale /ar/
      if (cleanUrl === '/' || cleanUrl === '') {
        res.writeHead(302, {
          Location: '/ar/',
          ...headers,
        });
        res.end();
        return;
      }

      // If render is not yet loaded, try loading it
      if (!render && fs.existsSync(serverEntryPath)) {
        const entry = await import(pathToFileURL(serverEntryPath).href);
        render = entry.render;
      }

      if (!render) {
        res.writeHead(500, {
          'Content-Type': 'text/plain; charset=utf-8',
          ...headers,
        });
        res.end(isProd
          ? '500 - Service Unavailable.'
          : 'SSR render bundle not found. Please build the application first.'
        );
        return;
      }

      const { html: appHtml, title, lang, dir, head, metadata } = render(cleanUrl);
      const headTags = metadata ? metadata.renderHeadTags() : '';

      let responseHtml = template
        .replace(/<html[^>]*>/, `<html lang="${lang}" dir="${dir}">`)
        .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
        .replace(/<meta\s+name=["']description["'][^>]*>\s*/i, '')
        .replace('<!--ssr-outlet-->', appHtml);

      if (responseHtml.includes('<!--ssr-head-tags-->')) {
        responseHtml = responseHtml.replace('<!--ssr-head-tags-->', headTags);
      } else {
        responseHtml = responseHtml.replace('</head>', `    ${headTags}\n  </head>`);
      }

      // Inject initial bootstrap state for client hydration
      const initialDataScript = `<script id="__INITIAL_DATA__" type="application/json">${JSON.stringify({ locale: lang, dir })}</script>`;
      responseHtml = responseHtml.replace('</body>', `${initialDataScript}\n</body>`);

      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
        ...headers,
      });
      res.end(responseHtml);
    } catch (err) {
      console.error('[SSR Render Error]', {
        url: req.url,
        message: err.message,
        stack: isProd ? undefined : err.stack,
      });

      const headers = getSecurityHeaders(isProd);
      res.writeHead(500, {
        'Content-Type': 'text/plain; charset=utf-8',
        ...headers,
      });
      res.end(isProd
        ? '500 - Internal Server Error. An unexpected error occurred.'
        : `Internal Server Error: ${err.message}`
      );
    }
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`SSR server listening on http://localhost:${port}`);
  });

  return server;
}

// Start server when executed directly as entrypoint
const isMainModule = !process.env.VITEST && (
  import.meta.url === pathToFileURL(process.argv[1] || '').href ||
  (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('server/index.js'))
);
if (isMainModule) {
  createServer().catch((err) => {
    console.error('Failed to start SSR server:', err);
    process.exit(1);
  });
}
