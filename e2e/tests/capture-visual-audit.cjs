// @ts-check
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity-cli/brain/58d5817b-703f-47a7-a1de-bbe67f4c393f/audit_screenshots';
const DOCS_DIR = path.join(__dirname, '../../docs/screenshots/light-mode');

if (!fs.existsSync(ARTIFACT_DIR)) fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });

function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(rgb1, rgb2) {
  const lum1 = getLuminance(rgb1[0], rgb1[1], rgb1[2]);
  const lum2 = getLuminance(rgb2[0], rgb2[1], rgb2[2]);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

function parseRgb(colorStr) {
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return [0, 0, 0];
  return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
}

async function captureScreenshot(page, filename, options = {}) {
  const p1 = path.join(ARTIFACT_DIR, filename);
  const p2 = path.join(DOCS_DIR, filename);
  await page.screenshot({ path: p1, ...options });
  fs.copyFileSync(p1, p2);
  console.log(`Saved screenshot: ${filename}`);
}

async function setLightMode(page) {
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
    localStorage.setItem('portfolio-theme', 'light');
  });
  await page.waitForTimeout(500);
}

async function run() {
  const browser = await chromium.launch();
  console.log('=== STARTING COMPLETE LIGHT MODE VISUAL VERIFICATION ===');

  // 1. DESKTOP 1440x900 - ENGLISH (LTR)
  console.log('Testing Desktop 1440px LTR...');
  const pageDesktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await pageDesktop.goto('http://localhost:3000/en/');
  await pageDesktop.waitForLoadState('networkidle');
  await setLightMode(pageDesktop);

  // Full page screenshot
  await captureScreenshot(pageDesktop, 'desktop-1440-light-fullpage.png', { fullPage: true });

  // Section captures with scrolling into view
  const sections = [
    { sel: 'header', file: 'desktop-1440-light-01-navbar.png' },
    { sel: '#hero', file: 'desktop-1440-light-02-hero.png' },
    { sel: '#selected-work', file: 'desktop-1440-light-03-selected-work.png' },
    { sel: '#about-me', file: 'desktop-1440-light-04-about.png' },
    { sel: '#skills-expertise', file: 'desktop-1440-light-05-skills.png' },
    { sel: '#creative-journey', file: 'desktop-1440-light-06-journey.png' },
    { sel: '#contact', file: 'desktop-1440-light-07-contact.png' },
    { sel: 'footer', file: 'desktop-1440-light-08-footer.png' },
  ];

  for (const sec of sections) {
    try {
      const el = pageDesktop.locator(sec.sel);
      if (await el.count()) {
        await el.scrollIntoViewIfNeeded();
        await pageDesktop.waitForTimeout(300);
        await el.screenshot({ path: path.join(ARTIFACT_DIR, sec.file) });
        fs.copyFileSync(path.join(ARTIFACT_DIR, sec.file), path.join(DOCS_DIR, sec.file));
        console.log(`Saved section screenshot: ${sec.file}`);
      }
    } catch (err) {
      console.warn(`Could not screenshot ${sec.sel}:`, err.message);
    }
  }

  // 2. ALL PROJECTS SCREEN (/en/work)
  console.log('Testing All Projects Screen /en/work...');
  await pageDesktop.goto('http://localhost:3000/en/work');
  await pageDesktop.waitForLoadState('networkidle');
  await setLightMode(pageDesktop);
  await captureScreenshot(pageDesktop, 'desktop-1440-light-09-all-projects.png');

  // Open modal from AllProjectsScreen
  try {
    const firstProjectCard = pageDesktop.locator('.project-card-body').first();
    if (await firstProjectCard.count()) {
      await firstProjectCard.click();
      await pageDesktop.waitForTimeout(600);
      await captureScreenshot(pageDesktop, 'desktop-1440-light-10-project-modal.png');

      // Click cover image inside modal to open fullscreen Lightbox
      const modalCover = pageDesktop.locator('.public-modal-panel [data-theme-surface="dark"]').first();
      if (await modalCover.count()) {
        await modalCover.click();
        await pageDesktop.waitForTimeout(500);
        await captureScreenshot(pageDesktop, 'desktop-1440-light-11-lightbox.png');

        // Close lightbox
        const closeBtn = pageDesktop.locator('button[aria-label*="Lightbox"]').or(pageDesktop.locator('button[aria-label*="عارض"]')).first();
        if (await closeBtn.count()) {
          await closeBtn.click();
          await pageDesktop.waitForTimeout(300);
        }
      }
    }
  } catch (err) {
    console.warn('Modal/lightbox interaction warning:', err.message);
  }

  // 3. DESKTOP 1440x900 - ARABIC (RTL)
  console.log('Testing Desktop Arabic RTL...');
  const pageArabic = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await pageArabic.goto('http://localhost:3000/ar/');
  await pageArabic.waitForLoadState('networkidle');
  await setLightMode(pageArabic);
  await captureScreenshot(pageArabic, 'desktop-1440-light-arabic-home.png');
  await captureScreenshot(pageArabic, 'desktop-1440-light-arabic-fullpage.png', { fullPage: true });

  // 4. TABLET 768x1024
  console.log('Testing Tablet 768px...');
  const pageTablet = await browser.newPage({ viewport: { width: 768, height: 1024 } });
  await pageTablet.goto('http://localhost:3000/en/');
  await pageTablet.waitForLoadState('networkidle');
  await setLightMode(pageTablet);
  await captureScreenshot(pageTablet, 'tablet-768-light-home.png');

  // 5. MOBILE 390x844
  console.log('Testing Mobile 390px...');
  const pageMobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await pageMobile.goto('http://localhost:3000/en/');
  await pageMobile.waitForLoadState('networkidle');
  await setLightMode(pageMobile);
  await captureScreenshot(pageMobile, 'mobile-390-light-hero.png');

  // Open mobile drawer menu
  try {
    const hamburgerBtn = pageMobile.locator('button[aria-label="Toggle navigation menu"]');
    if (await hamburgerBtn.count()) {
      await hamburgerBtn.click();
      await pageMobile.waitForTimeout(400);
      await captureScreenshot(pageMobile, 'mobile-390-light-drawer.png');
    }
  } catch (err) {
    console.warn('Mobile drawer error:', err.message);
  }

  // 6. SMALL MOBILE 320x568
  console.log('Testing Small Mobile 320px...');
  const pageSmallMobile = await browser.newPage({ viewport: { width: 320, height: 568 } });
  await pageSmallMobile.goto('http://localhost:3000/en/');
  await pageSmallMobile.waitForLoadState('networkidle');
  await setLightMode(pageSmallMobile);
  await captureScreenshot(pageSmallMobile, 'mobile-320-light-hero.png');

  // 7. ADMIN DASHBOARD ISOLATION CHECK
  console.log('Testing Admin Isolation...');
  const pageAdmin = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await pageAdmin.goto('http://localhost:3000/admin/projects');
  await pageAdmin.waitForLoadState('networkidle');
  await pageAdmin.waitForTimeout(600);

  const adminBg = await pageAdmin.evaluate(() => {
    const root = document.querySelector('#admin-root') || document.body;
    return window.getComputedStyle(root).backgroundColor;
  });
  console.log(`Admin root computed background color: ${adminBg}`);
  await captureScreenshot(pageAdmin, 'admin-dashboard-isolated-dark-desktop.png');

  // 8. CONTRAST METRICS AUDIT
  console.log('Extracting contrast metrics on public light mode...');
  await pageDesktop.goto('http://localhost:3000/en/');
  await pageDesktop.waitForLoadState('networkidle');
  await setLightMode(pageDesktop);

  const contrastMetrics = await pageDesktop.evaluate(() => {
    function getLuminance(r, g, b) {
      const [rs, gs, bs] = [r, g, b].map((c) => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }
    function parseRgb(colorStr) {
      const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!match) return [0, 0, 0];
      return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
    }
    function getContrast(c1, c2) {
      const l1 = getLuminance(c1[0], c1[1], c1[2]);
      const l2 = getLuminance(c2[0], c2[1], c2[2]);
      return ((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05));
    }
    function getEffectiveBg(el) {
      let cur = el;
      while (cur && cur !== document.documentElement) {
        const bg = window.getComputedStyle(cur).backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
          return bg;
        }
        cur = cur.parentElement;
      }
      return 'rgb(246, 241, 235)';
    }

    const sections = ['header', '#hero', '#selected-work', '#about-me', '#skills-expertise', '#creative-journey', '#contact', 'footer'];
    const results = {};

    sections.forEach((secSel) => {
      const sec = document.querySelector(secSel);
      if (!sec) return;
      const elements = sec.querySelectorAll('h1, h2, h3, h4, p, span, a, button, label, input');
      const items = [];

      elements.forEach((el) => {
        const text = (el.textContent || '').trim();
        if (!text || text.length < 2) return;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const fg = style.color;
        const bg = getEffectiveBg(el);
        const ratio = getContrast(parseRgb(fg), parseRgb(bg));

        items.push({
          tag: el.tagName.toLowerCase(),
          text: text.slice(0, 45),
          fg,
          bg,
          ratio: parseFloat(ratio.toFixed(2)),
          surface: el.closest('[data-theme-surface="dark"]') ? 'dark-surface' : 'light-surface'
        });
      });

      results[secSel] = items;
    });

    return results;
  });

  fs.writeFileSync(
    path.join(__dirname, 'contrast-metrics.json'),
    JSON.stringify(contrastMetrics, null, 2)
  );
  console.log('Contrast metrics saved.');

  await browser.close();
  console.log('=== VISUAL AUDIT & VERIFICATION COMPLETE ===');
}

run().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
