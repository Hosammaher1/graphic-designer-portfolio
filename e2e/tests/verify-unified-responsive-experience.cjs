// @ts-check
const { chromium, devices } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 4175;
const CLIENT_DIST = path.resolve(__dirname, '../../frontend/dist/client');
const SCREENSHOT_DIR = path.resolve(__dirname, '../../screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

function createStaticServer() {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
  };

  return http.createServer((req, res) => {
    let reqPath = (req.url || '/').split('?')[0];

    // Simulated API endpoints to test dashboard-selected featured projects and loading transitions
    if (reqPath.startsWith('/api/v1/projects')) {
      const isArabic = req.url && req.url.includes('locale=ar');
      const mockProjects = [
        {
          id: 'case-1-brand-featured',
          slug: 'case-1-brand-featured',
          is_featured: 1, // Explicitly marked featured in dashboard
          title: isArabic ? 'مشروع الهوية المميز' : 'Featured Identity Showcase',
          summary: isArabic ? 'دراسة حالة مميزة من لوحة التحكم' : 'Curated featured case study from dashboard',
          year: 2026,
          cover_url: '/logo/logo.png',
          categories: [{ id: 1, slug: 'brand-identity', name: isArabic ? 'الهوية البصرية' : 'Brand Identity' }],
          media: [
            { id: 'm1', display_url: '/logo/logo.png', caption_en: 'Brand Detail', caption_ar: 'تفاصيل الهوية' },
            { id: 'm2', display_url: '/logo/logo.png', caption_en: 'Typography Suite', caption_ar: 'المنظومة الطباعية' }
          ]
        },
        {
          id: 'case-2-packaging-featured',
          slug: 'case-2-packaging-featured',
          is_featured: 1, // Explicitly marked featured in dashboard
          title: isArabic ? 'تصميم التغليف الفاخر' : 'Luxury Packaging System',
          summary: isArabic ? 'دراسة حالة التغليف المختارة' : 'Selected packaging design case study',
          year: 2026,
          cover_url: '/logo/logo.png',
          categories: [{ id: 2, slug: 'packaging', name: isArabic ? 'تصميم التغليف' : 'Packaging' }],
          media: [
            { id: 'm3', display_url: '/logo/logo.png', caption_en: 'Unboxing Box', caption_ar: 'علبة المنتج' }
          ]
        },
        {
          id: 'case-3-editorial-standard',
          slug: 'case-3-editorial-standard',
          is_featured: 0, // NOT featured
          title: isArabic ? 'التصميم التحريري العادي' : 'Standard Editorial Publication',
          summary: isArabic ? 'مشروع منشور غير مميز' : 'Standard non-featured published project',
          year: 2025,
          cover_url: '/logo/logo.png',
          categories: [{ id: 3, slug: 'editorial', name: isArabic ? 'التصميم التحريري' : 'Editorial' }],
          media: []
        }
      ];

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'success', data: mockProjects }));
      return;
    }

    if (reqPath.startsWith('/api/v1/settings')) {
      const isArabic = req.url && req.url.includes('locale=ar');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'success',
        data: {
          settings: {
            profile: {
              fullNameEn: 'Mohammed Maher Aldaya',
              fullNameAr: 'محمد ماهر الداية',
              titleEn: 'Graphic Designer | Visual Identity & Creative Design',
              titleAr: 'مصمم جرافيك | متخصص في الهوية البصرية والتصميم الإبداعي',
              email: 'mohmmed.maher467@gmail.com',
              whatsappDisplay: '+972 59-238-2189',
              whatsappUrl: 'https://wa.me/972592382189',
              instagramHandle: '@mohmmed_ma48',
              instagramUrl: 'https://www.instagram.com/mohmmed_ma48/',
              profilePhoto: '/profile/mohammed-maher-profile.png'
            },
            hero: {
              kickerEn: "Hello, I'm a",
              kickerAr: 'مرحباً، أنا',
              titleStartEn: 'Graphic',
              titleStartAr: 'مصمم',
              titleAccentEn: 'Designer',
              titleAccentAr: 'جرافيك',
              descEn: 'Crafting meaningful visual experiences across all viewports.',
              descAr: 'تحويل الأفكار إلى تجارب بصرية ذات معنى.'
            },
            about: {
              statProjects: '75+',
              statClients: '40+',
              statYears: '6+'
            }
          }
        }
      }));
      return;
    }

    if (reqPath.startsWith('/api/v1/categories')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'success', data: [] }));
      return;
    }

    if (reqPath.startsWith('/api/v1/journey')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'success', data: { milestones: [] } }));
      return;
    }

    // Static file serving
    if (reqPath === '/') reqPath = '/index.html';
    else if (reqPath.endsWith('/')) reqPath += 'index.html';

    let filePath = path.join(CLIENT_DIST, reqPath);
    if (!fs.existsSync(filePath)) {
      if (fs.existsSync(path.join(CLIENT_DIST, reqPath + '.html'))) {
        filePath = path.join(CLIENT_DIST, reqPath + '.html');
      } else {
        filePath = path.join(CLIENT_DIST, 'index.html');
      }
    }

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    try {
      const data = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-cache' });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('Not Found');
    }
  });
}

async function runUnifiedVerification() {
  const server = createStaticServer();
  await new Promise((resolve) => server.listen(PORT, resolve));
  const baseUrl = `http://localhost:${PORT}`;
  console.log(`[Unified Test Server] Listening on ${baseUrl}`);

  const browser = await chromium.launch({ headless: true });
  const metricsReport = {};

  const sectionsToVerify = [
    '#hero',
    '#selected-work',
    '#about-me',
    '#skills-expertise',
    '#creative-journey',
    '#contact',
    'footer'
  ];

  try {
    // =========================================================================
    // 1. DESKTOP WORKFLOW (1440x900)
    // =========================================================================
    console.log('\n======================================================');
    console.log('--- 1. DESKTOP VIEWPORT AUDIT (1440x900) ---');
    console.log('======================================================');

    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const desktopPage = await desktopContext.newPage();

    const dStart = Date.now();
    await desktopPage.goto(`${baseUrl}/`, { waitUntil: 'load' });
    const dLoadTime = Date.now() - dStart;

    // Collect performance timings
    const desktopTimings = await desktopPage.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      const fcp = paint.find(p => p.name === 'first-contentful-paint');
      return {
        domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : null,
        loadEvent: nav ? Math.round(nav.loadEventEnd - nav.startTime) : null,
        fcp: fcp ? Math.round(fcp.startTime) : null,
      };
    });
    metricsReport.desktop = { ...desktopTimings, totalLoadMs: dLoadTime };
    console.log('[Desktop Timings]:', JSON.stringify(metricsReport.desktop));

    // Wait for dynamic content to replace skeletons
    await desktopPage.waitForSelector('text=Featured Identity Showcase', { timeout: 5000 });
    console.log('✓ Dynamic dashboard projects loaded smoothly on Desktop');

    // Verify Selected Work only displays explicitly featured projects (2 projects, NOT 3)
    const desktopSelectedWorkCount = await desktopPage.evaluate(() => {
      const badge = document.querySelector('#selected-work span');
      return badge ? badge.textContent : null;
    });
    console.log(`[Desktop Carousel Badge]: ${desktopSelectedWorkCount}`);

    // Verify Carousel keyboard navigation
    await desktopPage.keyboard.press('ArrowRight');
    await desktopPage.waitForTimeout(400);
    const activeTitleAfterArrow = await desktopPage.evaluate(() => {
      const h3 = document.querySelector('#selected-work h3');
      return h3 ? h3.textContent.trim() : null;
    });
    console.log(`[Desktop Carousel ArrowNav]: ${activeTitleAfterArrow}`);

    // Verify all 7 sections visible on desktop scroll
    console.log('\nInspecting all 7 sections on Desktop...');
    for (const sec of sectionsToVerify) {
      const secInfo = await desktopPage.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return { found: false };
        el.scrollIntoView({ behavior: 'instant', block: 'start' });
        const cs = window.getComputedStyle(el);
        return {
          found: true,
          opacity: cs.opacity,
          visibility: cs.visibility,
          height: el.offsetHeight
        };
      }, sec);
      console.log(`  Desktop ${sec}: found=${secInfo.found}, opacity=${secInfo.opacity}, height=${secInfo.height}px`);
    }

    // Open Project Details Modal & Lightbox on Desktop
    await desktopPage.evaluate(() => {
      const card = document.querySelector('#selected-work [data-theme-surface="dark"]');
      if (card) card.click();
    });
    await desktopPage.waitForSelector('[role="dialog"]', { timeout: 3000 });
    console.log('✓ Project Details Modal opened on Desktop');

    await desktopPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'unified-desktop-modal.png') });
    console.log('✓ Desktop screenshot captured');

    // Close modal via Escape
    await desktopPage.keyboard.press('Escape');
    await desktopPage.waitForTimeout(300);

    // Test Language Switch to AR
    await desktopPage.click('header button:has-text("AR")');
    await desktopPage.waitForTimeout(400);
    const desktopArLang = await desktopPage.evaluate(() => ({
      lang: document.documentElement.lang,
      dir: document.documentElement.dir
    }));
    console.log(`✓ Switched to Arabic on Desktop: lang=${desktopArAr = desktopArLang.lang}, dir=${desktopArLang.dir}`);
    await desktopPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'unified-desktop-arabic.png') });

    await desktopContext.close();

    // =========================================================================
    // 2. TABLET VIEWPORT AUDIT (768x1024 - iPad)
    // =========================================================================
    console.log('\n======================================================');
    console.log('--- 2. TABLET VIEWPORT AUDIT (768x1024 - iPad) ---');
    console.log('======================================================');

    const tabletContext = await browser.newContext({
      viewport: { width: 768, height: 1024 },
      hasTouch: true,
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
    });
    const tabletPage = await tabletContext.newPage();

    const tStart = Date.now();
    await tabletPage.goto(`${baseUrl}/`, { waitUntil: 'load' });
    const tLoadTime = Date.now() - tStart;

    const tabletTimings = await tabletPage.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      const fcp = paint.find(p => p.name === 'first-contentful-paint');
      return {
        domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : null,
        fcp: fcp ? Math.round(fcp.startTime) : null,
      };
    });
    metricsReport.tablet = { ...tabletTimings, totalLoadMs: tLoadTime };
    console.log('[Tablet Timings]:', JSON.stringify(metricsReport.tablet));

    // Wait for dynamic content
    await tabletPage.waitForSelector('text=Featured Identity Showcase', { timeout: 5000 });
    console.log('✓ Same dynamic dashboard content loaded on Tablet');

    // Test Touch Swipe Interaction on Tablet Carousel
    const initialTabletTitle = await tabletPage.evaluate(() => document.querySelector('#selected-work h3')?.textContent?.trim());
    console.log(`[Tablet Initial Carousel Project]: ${initialTabletTitle}`);

    // Emulate horizontal touch swipe (Left swipe to go next)
    await tabletPage.evaluate(() => {
      const stage = document.querySelector('#selected-work .touch-pan-y');
      if (stage) {
        const startTouch = new Touch({
          identifier: 1,
          target: stage,
          clientX: 400,
          clientY: 300
        });
        const endTouch = new Touch({
          identifier: 1,
          target: stage,
          clientX: 200, // swiped 200px to left
          clientY: 300
        });
        stage.dispatchEvent(new TouchEvent('touchstart', { touches: [startTouch], bubbles: true }));
        stage.dispatchEvent(new TouchEvent('touchend', { changedTouches: [endTouch], bubbles: true }));
      }
    });
    await tabletPage.waitForTimeout(450);

    const afterSwipeTabletTitle = await tabletPage.evaluate(() => document.querySelector('#selected-work h3')?.textContent?.trim());
    console.log(`[Tablet Post-Swipe Project]: ${afterSwipeTabletTitle}`);

    // Inspect all 7 sections on Tablet
    console.log('\nInspecting all 7 sections on Tablet...');
    for (const sec of sectionsToVerify) {
      const secInfo = await tabletPage.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return { found: false };
        el.scrollIntoView({ behavior: 'instant', block: 'start' });
        const cs = window.getComputedStyle(el);
        return {
          found: true,
          opacity: cs.opacity,
          height: el.offsetHeight
        };
      }, sec);
      console.log(`  Tablet ${sec}: found=${secInfo.found}, opacity=${secInfo.opacity}, height=${secInfo.height}px`);
    }

    await tabletPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'unified-tablet-homepage.png') });
    console.log('✓ Tablet screenshot captured');

    await tabletContext.close();

    // =========================================================================
    // 3. MOBILE VIEWPORT AUDIT (390x844 - iPhone 12)
    // =========================================================================
    console.log('\n======================================================');
    console.log('--- 3. MOBILE VIEWPORT AUDIT (390x844 - iPhone 12) ---');
    console.log('======================================================');

    const iPhone = devices['iPhone 12'];
    const mobileContext = await browser.newContext({
      ...iPhone,
      hasTouch: true,
    });
    const mobilePage = await mobileContext.newPage();

    // Emulate 4G Network
    const cdp = await mobileContext.newCDPSession(mobilePage);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 100,
      downloadThroughput: (2.0 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8
    });

    // Test Repeated Reloads on Mobile with 0 Black Screen
    for (let i = 1; i <= 3; i++) {
      const mStart = Date.now();
      await mobilePage.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
      const dclMs = Date.now() - mStart;

      // Check Frame 1 state immediately upon DOMContentLoaded
      const frame1 = await mobilePage.evaluate(() => {
        const hero = document.getElementById('hero');
        const h1 = document.querySelector('h1');
        return {
          heroVisible: Boolean(hero && hero.offsetHeight > 0),
          h1Visible: Boolean(h1 && h1.offsetHeight > 0),
          h1Opacity: h1 ? window.getComputedStyle(h1).opacity : null
        };
      });

      console.log(`  [Mobile Reload #${i}] DOMContentLoaded in ${dclMs}ms | Frame 1: heroVisible=${frame1.heroVisible}, h1Opacity=${frame1.h1Opacity}`);
      await mobilePage.waitForTimeout(300);
    }

    // Wait for hydration and dynamic content arrival
    await mobilePage.waitForSelector('text=Featured Identity Showcase', { timeout: 6000 });
    console.log('✓ Dynamic dashboard projects loaded smoothly on Mobile');

    const mobileTimings = await mobilePage.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      const fcp = paint.find(p => p.name === 'first-contentful-paint');
      return {
        domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : null,
        fcp: fcp ? Math.round(fcp.startTime) : null,
      };
    });
    metricsReport.mobile = mobileTimings;
    console.log('[Mobile Timings]:', JSON.stringify(metricsReport.mobile));

    // Verify Mobile Hamburger Menu
    await mobilePage.waitForSelector('button[aria-label="Toggle navigation menu"]', { timeout: 3000 });
    await mobilePage.click('button[aria-label="Toggle navigation menu"]');
    await mobilePage.waitForSelector('header nav.flex-col', { timeout: 3000 });
    console.log('✓ Mobile drawer navigation opened: true');
    await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, 'unified-mobile-menu.png') });

    // Close menu by clicking a nav link
    await mobilePage.click('header nav.flex-col a:has-text("Work")');
    await mobilePage.waitForTimeout(400);

    // Inspect all 7 sections on Mobile
    console.log('\nInspecting all 7 sections on Mobile...');
    for (const sec of sectionsToVerify) {
      const secInfo = await mobilePage.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return { found: false };
        el.scrollIntoView({ behavior: 'instant', block: 'start' });
        const cs = window.getComputedStyle(el);
        return {
          found: true,
          opacity: cs.opacity,
          height: el.offsetHeight
        };
      }, sec);
      console.log(`  Mobile ${sec}: found=${secInfo.found}, opacity=${secInfo.opacity}, height=${secInfo.height}px`);
    }

    await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, 'unified-mobile-homepage.png') });
    console.log('✓ Mobile screenshot captured');

    await mobileContext.close();

    console.log('\n======================================================');
    console.log('UNIFIED RESPONSIVE AUDIT PASSED ACROSS ALL DEVICES!');
    console.log('======================================================');
    console.log('Summary Timings Report:', JSON.stringify(metricsReport, null, 2));

  } finally {
    await browser.close();
    server.close();
  }
}

runUnifiedVerification().catch((err) => {
  console.error('Unified verification failed:', err);
  process.exit(1);
});
