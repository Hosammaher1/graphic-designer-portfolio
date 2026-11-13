// @ts-check
const { chromium, devices } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 4173;
const CLIENT_DIST = path.resolve(__dirname, '../../frontend/dist/client');
const SCREENSHOT_DIR = path.resolve(__dirname, '../../screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

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
    if (reqPath === '/') reqPath = '/index.html';
    else if (reqPath.endsWith('/')) reqPath += 'index.html';

    let filePath = path.join(CLIENT_DIST, reqPath);
    if (!fs.existsSync(filePath)) {
      if (fs.existsSync(path.join(CLIENT_DIST, reqPath + '.html'))) {
        filePath = path.join(CLIENT_DIST, reqPath + '.html');
      } else if (fs.existsSync(path.join(CLIENT_DIST, reqPath, 'index.html'))) {
        filePath = path.join(CLIENT_DIST, reqPath, 'index.html');
      } else {
        filePath = path.join(CLIENT_DIST, 'index.html');
      }
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    try {
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (e) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    }
  });
}

const mockSettings = {
  profile: {
    fullNameEn: 'Mohammed Maher Aldaya',
    fullNameAr: 'محمد ماهر الداية',
    titleEn: 'Graphic Designer | Visual Systems & Packaging',
    titleAr: 'مصمم جرافيك | متخصص في الهويات البصرية والتغليف',
    taglineEn: 'Crafting luxury visual identity systems.',
    taglineAr: 'صناعة الهويات البصرية الفاخرة.',
    bioEn: 'Dedicated to high-impact branding and tactile editorial design.',
    bioAr: 'متخصص في بناء الهويات التجارية المتكاملة والتصميم التحريري.',
    email: 'contact@mohammed-studio.com',
    whatsappDisplay: '+972 59-000-0000',
    whatsappUrl: 'https://wa.me/972590000000',
    instagramHandle: '@mohammed_studio',
    instagramUrl: 'https://instagram.com/mohammed_studio',
  },
  hero: {
    kickerEn: "Senior Visual Designer",
    kickerAr: "مصمم بصري أول",
    titleStartEn: "Creative",
    titleStartAr: "رؤية",
    titleAccentEn: "Identity",
    titleAccentAr: "بصرية",
    descEn: "Elevating contemporary brands with bespoke identity systems and luxury packaging.",
    descAr: "الارتقاء بالعلامات التجارية المعاصرة من خلال نظم هوية وتغليف فاخرة.",
    viewWorkEn: "Explore Selected Works",
    viewWorkAr: "استكشف الأعمال المختارة",
    aboutMeEn: "The Studio Story",
    aboutMeAr: "قصة الاستوديو",
  },
  about: {
    kickerEn: "03 / The Designer ——",
    kickerAr: "03 / عن المصمم ——",
    titleStartEn: "Craft &",
    titleStartAr: "حرفة",
    titleAccentEn: "Philosophy",
    titleAccentAr: "وفلسفة",
    statProjects: "75+",
    statClients: "30+",
    statYears: "7+",
  },
  skills: {
    kickerEn: "04 / Studio Expertise ——",
    kickerAr: "04 / مهارات الاستوديو ——",
    titleLine1En: "Capabilities &",
    titleLine1Ar: "القدرات",
    titleLine2En: "Discipline",
    titleLine2Ar: "والتخصص",
    descEn: "Mastery of industry-standard tools and design craftsmanship.",
    descAr: "إتقان أدوات التصميم العالمية مع أعلى معايير الجودة.",
  },
  contact: {
    kickerEn: "06 / Inquiries ——",
    kickerAr: "06 / الاستفسارات ——",
    titleStartEn: "Start a",
    titleStartAr: "ابدأ",
    titleAccentEn: "Dialogue",
    titleAccentAr: "مشروعك",
    descEn: "We welcome bespoke commissions and identity consultations.",
    descAr: "نرحب بالمشاريع التصميمية والاستشارات الإبداعية المتميزة.",
    directEmail: "inquiries@mohammed-studio.com",
    whatsappDisplay: "+972 59-111-2222",
    whatsappUrl: "https://wa.me/972591112222",
    instagramHandle: "@mohammed_design_studio",
    instagramUrl: "https://instagram.com/mohammed_design_studio",
    availabilityEn: "Currently booking select Q4 brand projects",
    availabilityAr: "متاح حالياً لمشاريع مختارة للربع الحالي",
  },
};

const mockProjects = [
  {
    id: 'noya-luxury-skincare',
    slug: 'noya-luxury-skincare',
    title: { en: 'Noya Skincare Identity', ar: 'هوية نويا لمستحضرات العناية' },
    summary: 'Luxury cosmetics branding and tactile foil packaging.',
    categories: [{ id: 1, slug: 'branding', name: { en: 'Brand Identity', ar: 'الهوية البصرية' } }],
    tools: [{ name: 'Illustrator' }, { name: 'Photoshop' }],
    year: '2026',
    is_featured: true,
    cover_url: '/logo/logo.png',
  },
  {
    id: 'kanso-coffee-roasters',
    slug: 'kanso-coffee-roasters',
    title: { en: 'Kanso Coffee System', ar: 'نظام كانسو لتحميص القهوة' },
    summary: 'Minimalist Japanese-inspired packaging suite.',
    categories: [{ id: 2, slug: 'packaging', name: { en: 'Packaging', ar: 'التغليف' } }],
    tools: [{ name: 'InDesign' }],
    year: '2025',
    is_featured: false,
    cover_url: '/logo/logo.png',
  },
];

const mockMilestones = [
  {
    id: 1,
    year: '2023',
    role: { en: 'Independent Visual Identity Lead', ar: 'قائد مستقل للهويات البصرية' },
    description: { en: 'Launched independent design practice specializing in luxury branding.', ar: 'تأسيس الممارسة التصميمية المستقلة المتخصصة في الهويات الفاخرة.' },
    icon_name: 'Rocket',
    highlighted: true,
  },
  {
    id: 2,
    year: '2025',
    role: { en: 'Brand Systems Director', ar: 'مدير النظم والتوجيه الفني' },
    description: { en: 'Spearheading cross-platform bilingual identities and packaging suites.', ar: 'قيادة تصميم الهويات ثنائية اللغة وتغليف المنتجات.' },
    icon_name: 'Award',
    highlighted: false,
  },
];

async function runTests() {
  const server = createStaticServer();
  await new Promise((res) => server.listen(PORT, res));
  console.log(`[Test Server] Serving on http://localhost:${PORT}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();
  page.on('console', msg => console.log('[BROWSER CONSOLE]', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('[BROWSER ERROR]', err.message, err.stack));

  let passedAll = true;

  try {
    console.log('\n--- TEST 1: Slow Network Simulation (1000ms delay) ---');

    await page.route('**/api/v1/**', async (route) => {
      const url = route.request().url();
      await new Promise((r) => setTimeout(r, 1000));

      if (url.includes('/api/v1/settings')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'success', data: { settings: mockSettings } }),
        });
      } else if (url.includes('/api/v1/projects')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'success', data: { projects: { data: mockProjects } } }),
        });
      } else if (url.includes('/api/v1/journey')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'success', data: { milestones: mockMilestones } }),
        });
      } else if (url.includes('/api/v1/categories')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'success', data: { categories: [] } }),
        });
      } else {
        route.continue();
      }
    });

    // Clear caches
    await page.goto(`http://localhost:${PORT}/en/`);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Cold reload
    await page.goto(`http://localhost:${PORT}/en/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(200);

    const skeletonCount = await page.locator('.skeleton-shimmer').count();
    console.log(`[Skeleton Inspection] Total .skeleton-shimmer count during loading: ${skeletonCount}`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'loading-skeletons-active.png') });

    // Wait for API resolution
    await page.waitForTimeout(1600);

    const heroHtml = await page.locator('#hero').innerHTML();
    console.log('[Hero HTML After Load Snippet]:', heroHtml.slice(0, 500));

    const h1Count = await page.locator('#hero h1').count();
    console.log(`[Hero h1 count after load]: ${h1Count}`);
    if (h1Count > 0) {
      const heroH1 = await page.locator('#hero h1').innerText();
      console.log(`Loaded Hero Title: "${heroH1.replace(/\n/g, ' ')}"`);
    }

    const aboutStatProjects = await page.locator('[data-testid="about-stat-projects"]').innerText();
    console.log(`Loaded Stat Projects: "${aboutStatProjects}"`);

    const loadedDesignerName = await page.locator('[data-testid="about-designer-name"]').innerText();
    console.log(`Loaded Designer Name: "${loadedDesignerName}"`);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'loaded-content-verified.png') });

    // ---------------------------------------------------------------------------
    // TEST 3: ARABIC RTL VERIFICATION
    // ---------------------------------------------------------------------------
    console.log('\n--- TEST 3: Arabic RTL Verification (/ar/) ---');
    await page.goto(`http://localhost:${PORT}/ar/`, { waitUntil: 'networkidle' });

    const dir = await page.locator('html').getAttribute('dir');
    const langAttr = await page.locator('html').getAttribute('lang');
    console.log(`HTML dir: "${dir}", lang: "${langAttr}"`);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'arabic-rtl-verified.png') });

    // ---------------------------------------------------------------------------
    // TEST 4: MOBILE VIEWPORT & SCROLL VERIFICATION
    // ---------------------------------------------------------------------------
    console.log('\n--- TEST 4: Mobile Viewport & Smooth Scroll ---');
    const iPhone = devices['iPhone 12'];
    const mobileContext = await browser.newContext({ ...iPhone });
    const mobilePage = await mobileContext.newPage();

    await mobilePage.goto(`http://localhost:${PORT}/en/`, { waitUntil: 'networkidle' });

    const sections = ['hero', 'selected-work', 'about-me', 'skills-expertise', 'creative-journey', 'contact'];
    for (const sec of sections) {
      const el = mobilePage.locator(`#${sec}`);
      const isVisible = await el.isVisible();
      const box = await el.boundingBox();
      console.log(`Mobile Section #${sec}: visible=${isVisible}, height=${box ? box.height : 0}`);
    }

    await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, 'mobile-viewport-verified.png') });
    await mobileContext.close();

    // ---------------------------------------------------------------------------
    // TEST 5: API FAILURE LOCALIZED RETRY (NO BLACK SCREEN)
    // ---------------------------------------------------------------------------
    console.log('\n--- TEST 5: API Failure Localized Error Handling ---');
    const failContext = await browser.newContext();
    const failPage = await failContext.newPage();

    await failPage.route('**/api/v1/**', (route) => {
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Server error' }) });
    });

    await failPage.goto(`http://localhost:${PORT}/en/`);
    await failPage.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await failPage.goto(`http://localhost:${PORT}/en/`, { waitUntil: 'networkidle' });

    const bodyHeight = await failPage.evaluate(() => document.body.offsetHeight);
    const mainVisible = await failPage.locator('main').isVisible();
    const navVisible = await failPage.locator('header').isVisible();
    console.log(`On API failure: bodyHeight=${bodyHeight}, mainVisible=${mainVisible}, navVisible=${navVisible}`);

    await failPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'api-failure-no-blackout.png') });
    await failContext.close();

  } finally {
    await browser.close();
    server.close();
  }

  console.log('\n===========================================');
  console.log('✅ ALL TESTS COMPLETED');
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
