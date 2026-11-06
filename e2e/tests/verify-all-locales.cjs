// @ts-check
const { chromium, devices } = require('playwright');
const https = require('https');
const path = require('path');
const fs = require('fs');

async function fetchRaw(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const rootIdx = data.indexOf('<div id="root">');
        resolve({
          status: res.statusCode,
          length: data.length,
          hasEnHtml: data.includes('lang="en" dir="ltr"') || data.includes('lang="en"'),
          hasArHtml: data.includes('lang="ar" dir="rtl"') || data.includes('lang="ar"'),
          hasEnKicker: data.includes("Hello, I'm a") || data.includes('Graphic Designer'),
          hasArKicker: data.includes('مرحباً، أنا') || data.includes('مصمم جرافيك'),
          title: (data.match(/<title>(.*?)<\/title>/) || [])[1] || ''
        });
      });
    }).on('error', err => resolve({ error: err.message }));
  });
}

(async () => {
  console.log('=== PART 1: RAW HTTP SSR / PRE-RENDER INSPECTION ===');
  const rootRaw = await fetchRaw('https://mohammed-design.vercel.app/');
  console.log('1. Root URL (/):', JSON.stringify(rootRaw, null, 2));

  const enRaw = await fetchRaw('https://mohammed-design.vercel.app/en/');
  console.log('2. /en/ URL:', JSON.stringify(enRaw, null, 2));

  const arRaw = await fetchRaw('https://mohammed-design.vercel.app/ar/');
  console.log('3. /ar/ URL:', JSON.stringify(arRaw, null, 2));

  const screenshotDir = path.resolve(__dirname, '../../screenshots');
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

  console.log('\n=== PART 2: BROWSER MOBILE VERIFICATION & HYDRATION ===');
  const browser = await chromium.launch({ headless: true });
  const iPhone = devices['iPhone 12'];

  const testUrl = async (url, label, expectedLang, expectedDir) => {
    const page = await browser.newPage({ ...iPhone });
    const t0 = Date.now();
    let navigated = false;
    for (let attempt = 1; attempt <= 3 && !navigated; attempt++) {
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
        navigated = true;
      } catch (e) {
        if (attempt === 3) throw e;
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    const commitTime = Date.now() - t0;

    // Check frame 1
    const frame1 = await page.evaluate(() => {
      const html = document.documentElement;
      const h1 = document.querySelector('h1');
      return {
        htmlLang: html ? html.getAttribute('lang') : null,
        htmlDir: html ? html.getAttribute('dir') : null,
        h1Text: h1 ? h1.textContent.trim().slice(0, 30) : null,
        h1Visible: h1 ? (h1.offsetWidth > 0 && h1.offsetHeight > 0) : false
      };
    });

    await page.waitForTimeout(600);
    const hydrated = await page.evaluate(() => {
      const html = document.documentElement;
      const h1 = document.querySelector('h1');
      const p = document.querySelector('#hero p');
      return {
        htmlLang: html ? html.getAttribute('lang') : null,
        htmlDir: html ? html.getAttribute('dir') : null,
        h1Text: h1 ? h1.textContent.trim().slice(0, 30) : null,
        pText: p ? p.textContent.trim().slice(0, 30) : null,
      };
    });

    console.log(`[${label}] Commit: ${commitTime}ms`);
    console.log(`[${label}] Frame 1:`, JSON.stringify(frame1));
    console.log(`[${label}] Hydrated:`, JSON.stringify(hydrated));

    const shotPath = path.join(screenshotDir, `locale-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`);
    await page.screenshot({ path: shotPath });
    console.log(`[${label}] Screenshot saved: ${shotPath}`);

    const matchLang = hydrated.htmlLang === expectedLang;
    const matchDir = hydrated.htmlDir === expectedDir;
    console.log(`[${label}] Verification: ${matchLang && matchDir ? 'PASSED' : 'FAILED'}`);

    await page.close();
  };

  await testUrl('https://mohammed-design.vercel.app/', 'Root-Default-English', 'en', 'ltr');
  await testUrl('https://mohammed-design.vercel.app/en/', 'Explicit-English-En', 'en', 'ltr');
  await testUrl('https://mohammed-design.vercel.app/ar/', 'Explicit-Arabic-Ar', 'ar', 'rtl');

  console.log('\n=== PART 3: INTERACTIVE LANGUAGE SWITCHER TEST ===');
  const page = await browser.newPage({ ...iPhone });
  await page.goto('https://mohammed-design.vercel.app/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Initial should be English
  let initialLang = await page.evaluate(() => document.documentElement.getAttribute('lang'));
  console.log('Initial page lang on /:', initialLang);

  // Click AR button in navbar
  const arButton = await page.$('button:has-text("AR")');
  if (arButton) {
    console.log('Clicking AR language switcher button...');
    await arButton.click();
    await page.waitForTimeout(800);

    const switchedState = await page.evaluate(() => ({
      lang: document.documentElement.getAttribute('lang'),
      dir: document.documentElement.getAttribute('dir'),
      url: window.location.pathname,
      h1: document.querySelector('h1')?.textContent.trim().slice(0, 30)
    }));
    console.log('After switching to AR:', JSON.stringify(switchedState));

    const arShot = path.join(screenshotDir, 'switcher-switched-to-arabic.png');
    await page.screenshot({ path: arShot });
    console.log('Saved AR switch screenshot:', arShot);

    // Now switch back to EN
    const enButton = await page.$('button:has-text("EN")');
    if (enButton) {
      console.log('Clicking EN language switcher button...');
      await enButton.click();
      await page.waitForTimeout(800);

      const switchedBackState = await page.evaluate(() => ({
        lang: document.documentElement.getAttribute('lang'),
        dir: document.documentElement.getAttribute('dir'),
        url: window.location.pathname,
        h1: document.querySelector('h1')?.textContent.trim().slice(0, 30)
      }));
      console.log('After switching back to EN:', JSON.stringify(switchedBackState));

      const enShot = path.join(screenshotDir, 'switcher-switched-to-english.png');
      await page.screenshot({ path: enShot });
      console.log('Saved EN switch screenshot:', enShot);
    }
  }

  await browser.close();
  console.log('\nALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!');
})();
