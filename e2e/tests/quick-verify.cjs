// @ts-check
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000/en/');
  await page.waitForLoadState('networkidle');

  // Activate Light Mode
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
  });
  await page.waitForTimeout(400);

  // 1. Check Hero Description color
  const heroDescColor = await page.evaluate(() => {
    const p = document.querySelector('#hero .text-neutral-300\\/90') || document.querySelector('#hero p.hero-stagger:nth-of-type(2)');
    return p ? window.getComputedStyle(p).color : null;
  });
  console.log('1. Hero description color:', heroDescColor);

  // 2. Check Active Section Indicator Underline color
  const indicatorColor = await page.evaluate(() => {
    const indicator = document.querySelector('header nav a span.absolute') || document.querySelector('header nav a span[class*="bg-gradient"]');
    if (!indicator) return null;
    const style = window.getComputedStyle(indicator);
    return { bg: style.backgroundColor, bgImage: style.backgroundImage };
  });
  console.log('2. Active section indicator:', JSON.stringify(indicatorColor));

  // 3. Scroll down and check Navbar background & link contrast
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(400);

  const scrolledNavbar = await page.evaluate(() => {
    const header = document.querySelector('header');
    const activeLink = header ? header.querySelector('nav a.font-semibold') || header.querySelector('nav a') : null;
    const inactiveLink = header ? header.querySelector('nav a:not(.font-semibold)') : null;
    return {
      headerBg: header ? window.getComputedStyle(header).backgroundColor : null,
      activeColor: activeLink ? window.getComputedStyle(activeLink).color : null,
      inactiveColor: inactiveLink ? window.getComputedStyle(inactiveLink).color : null
    };
  });
  console.log('3. Scrolled navbar:', JSON.stringify(scrolledNavbar));

  // Quick screenshot of hero and scrolled navbar
  await page.screenshot({ path: 'docs/screenshots/light-mode/quick-fix-scrolled-navbar.png' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'docs/screenshots/light-mode/quick-fix-hero.png' });
  console.log('Saved verification screenshots.');

  await browser.close();
})();
