// @ts-check
const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...devices['iPhone 12'],
  });
  const page = await context.newPage();

  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[PAGE ERROR] ${err.message}\n${err.stack}`));

  console.log('1. Loading page initial...');
  await page.goto('https://mohammed-design.vercel.app/ar/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  console.log('2. Reloading page (warm reload)...');
  const t0 = Date.now();
  await page.reload({ waitUntil: 'commit' });
  console.log(`Commit after reload: ${Date.now() - t0}ms`);

  // Check state at 100ms, 500ms, 1000ms, 2000ms, 5000ms
  for (const ms of [100, 300, 700, 1500, 3000, 6000]) {
    await page.waitForTimeout(ms);
    const visible = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      const root = document.getElementById('root');
      const hero = document.getElementById('hero');
      return {
        h1Text: h1 ? h1.textContent?.slice(0, 30) : null,
        h1Opacity: h1 ? window.getComputedStyle(h1).opacity : null,
        h1Visible: h1 ? (h1.offsetWidth > 0 && h1.offsetHeight > 0) : false,
        rootChildren: root ? root.children.length : 0,
        rootInnerHTML: root ? root.innerHTML.slice(0, 80) : null,
        heroOpacity: hero ? window.getComputedStyle(hero).opacity : null,
      };
    });
    console.log(`At ~${Date.now() - t0}ms:`, JSON.stringify(visible));
  }

  console.log('\n--- CONSOLE LOGS ---');
  logs.forEach(l => console.log(l));

  await browser.close();
})();
