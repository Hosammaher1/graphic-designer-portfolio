import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

async function createServer() {
  let template = '';
  let render = null;

  if (fs.existsSync(path.resolve(clientDist, 'index.html'))) {
    template = fs.readFileSync(path.resolve(clientDist, 'index.html'), 'utf-8');
  }

  const serverEntryPath = path.resolve(serverDist, 'entry-server.js');
  if (fs.existsSync(serverEntryPath)) {
    const entry = await import(`file://${serverEntryPath}`);
    render = entry.render;
  }

  const server = http.createServer(async (req, res) => {
    try {
      const url = req.url || '/';
      const cleanUrl = url.split('?')[0];

      // Serve static assets from dist/client if file exists
      const staticFilePath = path.join(clientDist, cleanUrl);
      if (cleanUrl !== '/' && cleanUrl !== '/ar/' && cleanUrl !== '/en/' && !cleanUrl.startsWith('/admin') && fs.existsSync(staticFilePath) && fs.statSync(staticFilePath).isFile()) {
        const ext = path.extname(staticFilePath);
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': cleanUrl.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
        });
        fs.createReadStream(staticFilePath).pipe(res);
        return;
      }

      // Root redirect to default locale /ar/
      if (cleanUrl === '/' || cleanUrl === '') {
        res.writeHead(302, { Location: '/ar/' });
        res.end();
        return;
      }

      // If render is not yet loaded, try loading it
      if (!render && fs.existsSync(serverEntryPath)) {
        const entry = await import(`file://${serverEntryPath}`);
        render = entry.render;
      }

      if (!render) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('SSR render bundle not found. Please build the application first.');
        return;
      }

      const { html: appHtml, title, lang, dir } = render(cleanUrl);

      let responseHtml = template
        .replace(/<html[^>]*>/, `<html lang="${lang}" dir="${dir}">`)
        .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
        .replace('<!--ssr-outlet-->', appHtml);

      // Inject initial bootstrap state for client hydration
      const initialDataScript = `<script id="__INITIAL_DATA__" type="application/json">${JSON.stringify({ locale: lang, dir })}</script>`;
      responseHtml = responseHtml.replace('</body>', `${initialDataScript}\n</body>`);

      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
      });
      res.end(responseHtml);
    } catch (err) {
      console.error('SSR render error:', err);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Internal Server Error: ${err.message}`);
    }
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`SSR server listening on http://localhost:${port}`);
  });

  return server;
}

createServer().catch((err) => {
  console.error('Failed to start SSR server:', err);
  process.exit(1);
});
