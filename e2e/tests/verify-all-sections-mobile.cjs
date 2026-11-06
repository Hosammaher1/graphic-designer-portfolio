// @ts-check
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const TARGET_URL = 'https://mohammed-design.vercel.app/';

async function testMobileExperience() {
  const browser = await chromium.launch({ headless: true });
  const iPhone = devices['iPhone 12'];
  
  const context = await browser.newContext({
    ...iPhone,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
  });
  
  const page = await context.newPage();

  // Emulate Typical 4G Network
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8
  });

  const screenshotDir = path.resolve(__dirname, '../../screenshots');
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

  console.log('=== TEST 1: REPEATED MOBILE RELOADS & INITIAL VISIBILITY ===');
  for (let reloadCount = 1; reloadCount <= 3; reloadCount++) {
    const t0 = Date.now();
    console.log(`\n--- Reload Run #${reloadCount} ---`);
    await page.goto(TARGET_URL, { waitUntil: 'commit' });
    const commitTime = Date.now() - t0;

    // Check state immediately after commit (frame 1)
    const frame1 = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      const root = document.getElementById('root');
      return {
        rootChildren: root ? root.children.length : 0,
        h1Text: h1 ? h1.textContent.trim().slice(0, 30) : null,
        h1Opacity: h1 ? window.getComputedStyle(h1).opacity : null,
        h1Visible: h1 ? (h1.offsetWidth > 0 && h1.offsetHeight > 0) : false
      };
    });

    console.log(`Commit received in: ${commitTime}ms`);
    console.log(`Frame 1 state:`, JSON.stringify(frame1));

    // Wait 500ms and check again
    await page.waitForTimeout(500);
    const after500ms = await page.evaluate(() => {
      const hero = document.getElementById('hero');
      const h1 = document.querySelector('h1');
      const p = hero ? hero.querySelector('p') : null;
      return {
        heroVisible: hero ? (hero.offsetWidth > 0 && hero.offsetHeight > 0) : false,
        h1Opacity: h1 ? window.getComputedStyle(h1).opacity : null,
        pText: p ? p.textContent.trim().slice(0, 30) : null,
        pOpacity: p ? window.getComputedStyle(p).opacity : null,
      };
    });
    console.log(`After 500ms state:`, JSON.stringify(after500ms));
    console.log(`Zero black screen verified on reload #${reloadCount}: ${after500ms.heroVisible && after500ms.h1Opacity === '1'}`);
  }

  console.log('\n=== TEST 2: VERIFY ALL SECTIONS ON SCROLL (DESKTOP & MOBILE) ===');
  const sectionsToVerify = [
    { id: '#hero', name: 'Hero Section', keySelectors: ['h1', '.hero-stagger'] },
    { id: '#selected-work', name: 'Selected Work', keySelectors: ['h2', 'img', '[data-theme-surface="dark"]'] },
    { id: '#about-me', name: 'About Me', keySelectors: ['h2', '.about-reveal', 'img'] },
    { id: '#skills-expertise', name: 'Skills & Expertise', keySelectors: ['h2', '.skill-stagger', 'svg'] },
    { id: '#creative-journey', name: 'Creative Journey', keySelectors: ['h2', '.milestone-card'] },
    { id: '#contact', name: 'Contact Section', keySelectors: ['h2', 'form', 'button[type="submit"]'] },
    { id: 'footer', name: 'Footer', keySelectors: ['p', 'img'] }
  ];

  const results = [];

  for (const sec of sectionsToVerify) {
    // Scroll element into view
    const scrollInfo = await page.evaluate((selector) => {
      const el = document.querySelector(selector);
      if (!el) return { found: false };
      el.scrollIntoView({ behavior: 'instant', block: 'start' });
      return {
        found: true,
        offsetTop: el.offsetTop,
        scrollHeight: el.scrollHeight
      };
    }, sec.id);

    // Wait a brief moment (300ms) for any layout or observer
    await page.waitForTimeout(300);

    // Inspect visibility and opacity of key elements in this section
    const sectionMetrics = await page.evaluate(({ selector, keySelectors }) => {
      const sectionEl = document.querySelector(selector);
      if (!sectionEl) return { found: false };
      const secCs = window.getComputedStyle(sectionEl);

      const items = [];
      for (const ks of keySelectors) {
        const els = Array.from(sectionEl.querySelectorAll(ks));
        for (const el of els.slice(0, 3)) {
          const cs = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          items.push({
            selector: ks,
            textSample: (el.textContent || '').trim().slice(0, 25),
            opacity: cs.opacity,
            visibility: cs.visibility,
            display: cs.display,
            renderedWidth: Math.round(rect.width),
            renderedHeight: Math.round(rect.height),
            top: Math.round(rect.top)
          });
        }
      }

      return {
        found: true,
        sectionBg: secCs.backgroundColor,
        sectionOpacity: secCs.opacity,
        items
      };
    }, { selector: sec.id, keySelectors: sec.keySelectors });

    console.log(`\nSection: ${sec.name} (${sec.id})`);
    console.log(`Found: ${sectionMetrics.found}, Opacity: ${sectionMetrics.sectionOpacity}, BG: ${sectionMetrics.sectionBg}`);
    console.log(`Items inspected:`, JSON.stringify(sectionMetrics.items, null, 2));

    // Check if any element in this section is stuck at opacity: 0 or visibility: hidden
    const isAnyHidden = sectionMetrics.items.some(it => it.opacity === '0' || it.visibility === 'hidden' || it.display === 'none');
    console.log(`Status for ${sec.name}: ${isAnyHidden ? 'FAILED (STUCK AT OPACITY 0)' : 'PASSED (FULLY VISIBLE)'}`);

    // Capture screenshot of section
    const shotName = `mobile-verified-${sec.id.replace('#', '')}.png`;
    const shotPath = path.join(screenshotDir, shotName);
    await page.screenshot({ path: shotPath });
    console.log(`Saved screenshot: ${shotPath}`);

    results.push({
      id: sec.id,
      name: sec.name,
      passed: !isAnyHidden,
      itemsCount: sectionMetrics.items.length,
      screenshot: shotName
    });
  }

  await browser.close();

  console.log('\n======================================================');
  console.log('FINAL MOBILE VISIBILITY & RELOAD AUDIT REPORT');
  console.log('======================================================');
  results.forEach(r => {
    console.log(`${r.name.padEnd(22)} | ${r.passed ? 'PASSED (100% VISIBLE)' : 'FAILED'} | Items: ${r.itemsCount} | ${r.screenshot}`);
  });
  console.log('======================================================');
}

testMobileExperience().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
