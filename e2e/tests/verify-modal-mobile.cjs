// @ts-check
const { chromium, devices } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ ...devices['iPhone 12'] });
  
  await page.goto('https://mohammed-design.vercel.app/', { waitUntil: 'networkidle' });
  
  // Click open project case study button
  const openBtn = await page.waitForSelector('button[aria-label="Open project case study"]');
  console.log('Found open button:', !!openBtn);
  await openBtn.click();
  
  // Wait for modal or details overlay to appear
  await page.waitForTimeout(1000);
  const modalInfo = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]') || document.querySelector('.fixed.inset-0.z-50') || document.querySelector('.fixed.inset-0');
    if (!dialog) return { found: false };
    const imgs = Array.from(dialog.querySelectorAll('img')).map(img => ({
      src: img.src,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      renderedWidth: img.clientWidth,
      renderedHeight: img.clientHeight,
      objectFit: window.getComputedStyle(img).objectFit
    }));
    return {
      found: true,
      imagesCount: imgs.length,
      images: imgs.slice(0, 3)
    };
  });

  console.log('Modal inspection:', JSON.stringify(modalInfo, null, 2));

  // Save screenshot of opened modal on mobile
  const screenshotPath = path.resolve(__dirname, '../../screenshots/mobile-modal-verified.png');
  await page.screenshot({ path: screenshotPath });
  console.log('Saved screenshot to:', screenshotPath);

  await browser.close();
})();
