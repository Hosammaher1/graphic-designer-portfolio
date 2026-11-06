import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const clientDist = path.resolve(root, 'dist/client');
const serverDist = path.resolve(root, 'dist/server');

async function prerender() {
  const templatePath = path.resolve(clientDist, 'index.html');
  if (!fs.existsSync(templatePath)) {
    console.error('Template not found at:', templatePath);
    return;
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  const serverEntryPath = path.resolve(serverDist, 'entry-server.js');
  if (!fs.existsSync(serverEntryPath)) {
    console.error('Server entry not found at:', serverEntryPath);
    return;
  }

  const { render } = await import(pathToFileURL(serverEntryPath).href);

  // 1. Pre-render Arabic homepage (default for root / and /ar/)
  console.log('[Prerender] Rendering /ar/...');
  const arRender = await render('/ar/');
  let arHtml = template;
  arHtml = arHtml.replace(/<html[^>]*>/, `<html lang="ar" dir="rtl" class="dark scroll-smooth">`);
  arHtml = arHtml.replace(/<title>.*?<\/title>/, `<title>${arRender.title}</title>`);
  if (arRender.html) {
    arHtml = arHtml.replace('<!--ssr-outlet-->', arRender.html);
  }
  if (arRender.head) {
    arHtml = arHtml.replace('<!--ssr-head-tags-->', arRender.head);
  }
  const arBootstrap = `<script id="__INITIAL_DATA__" type="application/json">${JSON.stringify({ locale: 'ar', dir: 'rtl' })}</script>`;
  arHtml = arHtml.replace('</body>', `  ${arBootstrap}\n  </body>`);

  // Overwrite dist/client/index.html so Vercel static root / serves the full rendered HTML
  fs.writeFileSync(templatePath, arHtml, 'utf-8');
  console.log('[Prerender] Successfully generated dist/client/index.html (Length:', arHtml.length, 'bytes)');

  // Also write dist/client/ar/index.html
  const arDir = path.resolve(clientDist, 'ar');
  if (!fs.existsSync(arDir)) fs.mkdirSync(arDir, { recursive: true });
  fs.writeFileSync(path.resolve(arDir, 'index.html'), arHtml, 'utf-8');
  console.log('[Prerender] Successfully generated dist/client/ar/index.html');

  // 2. Pre-render English homepage (/en/)
  console.log('[Prerender] Rendering /en/...');
  const enRender = await render('/en/');
  let enHtml = template;
  enHtml = enHtml.replace(/<html[^>]*>/, `<html lang="en" dir="ltr" class="dark scroll-smooth">`);
  enHtml = enHtml.replace(/<title>.*?<\/title>/, `<title>${enRender.title}</title>`);
  if (enRender.html) {
    enHtml = enHtml.replace('<!--ssr-outlet-->', enRender.html);
  }
  if (enRender.head) {
    enHtml = enHtml.replace('<!--ssr-head-tags-->', enRender.head);
  }
  const enBootstrap = `<script id="__INITIAL_DATA__" type="application/json">${JSON.stringify({ locale: 'en', dir: 'ltr' })}</script>`;
  enHtml = enHtml.replace('</body>', `  ${enBootstrap}\n  </body>`);

  const enDir = path.resolve(clientDist, 'en');
  if (!fs.existsSync(enDir)) fs.mkdirSync(enDir, { recursive: true });
  fs.writeFileSync(path.resolve(enDir, 'index.html'), enHtml, 'utf-8');
  console.log('[Prerender] Successfully generated dist/client/en/index.html (Length:', enHtml.length, 'bytes)');
}

prerender().catch(err => {
  console.error('[Prerender Error]:', err);
  process.exit(1);
});
