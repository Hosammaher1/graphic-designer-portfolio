// @ts-check
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const TARGET_URL = 'https://mohammed-design.vercel.app/';

async function run() {
  const browser = await chromium.launch({ headless: true });
  
  // Mobile device: iPhone 12/13/14 viewport
  const iPhone = devices['iPhone 12'];
  
  console.log('=== TEST 1: COLD MOBILE LOAD WITH NETWORK THROTTLING (Typical 4G) ===');
  const coldContext = await browser.newContext({
    ...iPhone,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
  });
  
  const coldPage = await coldContext.newPage();
  
  // Emulate mobile network throttling via CDP session
  const cdpCold = await coldContext.newCDPSession(coldPage);
  await cdpCold.send('Network.enable');
  await cdpCold.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150, // 150ms round-trip
    downloadThroughput: (1.6 * 1024 * 1024) / 8, // 1.6 Mbps Typical 4G
    uploadThroughput: (750 * 1024) / 8 // 750 Kbps
  });

  const coldRequests = [];
  coldPage.on('request', req => {
    coldRequests.push({ url: req.url(), resourceType: req.resourceType(), start: Date.now() });
  });

  const coldStart = Date.now();
  const coldResponse = await coldPage.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  const coldDclTime = Date.now() - coldStart;
  
  // Wait for featured work card to appear
  await coldPage.waitForSelector('#selected-work img', { timeout: 15000 });
  const coldFeaturedCardTime = Date.now() - coldStart;

  await coldPage.waitForLoadState('load');
  const coldLoadTime = Date.now() - coldStart;

  // Extract navigation metrics
  const coldMetrics = await coldPage.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const paints = performance.getEntriesByType('paint');
    const fcp = paints.find(p => p.name === 'first-contentful-paint');
    return {
      ttfb: nav ? Math.round(nav.responseStart - nav.requestStart) : null,
      domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : null,
      loadEvent: nav ? Math.round(nav.loadEventEnd - nav.startTime) : null,
      fcp: fcp ? Math.round(fcp.startTime) : null
    };
  });

  console.log('Cold Navigation Status:', coldResponse?.status());
  console.log('Cold Metrics:', JSON.stringify(coldMetrics, null, 2));
  console.log(`Cold DCL Wall Time: ${coldDclTime}ms`);
  console.log(`Cold Featured Card Visible Wall Time: ${coldFeaturedCardTime}ms`);
  console.log(`Cold Full Load Wall Time: ${coldLoadTime}ms`);

  console.log('\n=== TEST 2: WARM RELOAD (Simulating mobile user refresh) ===');
  // Refresh the page in the same context (warm cache / localStorage present)
  const warmStart = Date.now();
  await coldPage.reload({ waitUntil: 'domcontentloaded', timeout: 10000 });
  const warmDclTime = Date.now() - warmStart;

  await coldPage.waitForSelector('#selected-work img', { timeout: 5000 });
  const warmFeaturedCardTime = Date.now() - warmStart;

  await coldPage.waitForLoadState('load');
  const warmLoadTime = Date.now() - warmStart;

  const warmMetrics = await coldPage.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const paints = performance.getEntriesByType('paint');
    const fcp = paints.find(p => p.name === 'first-contentful-paint');
    return {
      ttfb: nav ? Math.round(nav.responseStart - nav.requestStart) : null,
      domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : null,
      loadEvent: nav ? Math.round(nav.loadEventEnd - nav.startTime) : null,
      fcp: fcp ? Math.round(fcp.startTime) : null
    };
  });

  console.log('Warm Metrics on Reload:', JSON.stringify(warmMetrics, null, 2));
  console.log(`Warm DCL Wall Time: ${warmDclTime}ms`);
  console.log(`Warm Featured Card Visible Wall Time: ${warmFeaturedCardTime}ms`);
  console.log(`Warm Full Load Wall Time: ${warmLoadTime}ms`);

  // Verify visual integrity of the homepage
  console.log('\n=== TEST 3: VISUAL INTEGRITY INSPECTION ===');
  const cardStyles = await coldPage.evaluate(() => {
    const cardImg = document.querySelector('#selected-work img');
    if (!cardImg) return null;
    const computed = window.getComputedStyle(cardImg);
    return {
      src: cardImg.src,
      objectFit: computed.objectFit,
      objectPosition: computed.objectPosition,
      naturalWidth: cardImg.naturalWidth,
      naturalHeight: cardImg.naturalHeight,
      renderedWidth: cardImg.clientWidth,
      renderedHeight: cardImg.clientHeight
    };
  });
  console.log('Featured Card Image Styles:', JSON.stringify(cardStyles, null, 2));

  // Take screenshot
  const screenshotDir = path.resolve(__dirname, '../../screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  const screenshotPath = path.join(screenshotDir, 'mobile-after-perf-optimization.png');
  await coldPage.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`Screenshot saved to: ${screenshotPath}`);

  // Test opening a project modal to verify functionality remains 100% intact
  console.log('\n=== TEST 4: PROJECT MODAL INTERACTION ===');
  const cardClickable = await coldPage.$('#selected-work button, #selected-work [role="button"], #selected-work a');
  if (cardClickable) {
    await cardClickable.click();
    await coldPage.waitForTimeout(1000);
    const modalVisible = await coldPage.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]') || document.querySelector('.fixed.inset-0');
      return !!modal;
    });
    console.log('Modal opened on click:', modalVisible);
  }

  await browser.close();

  // Print Summary Table
  console.log('\n======================================================');
  console.log('PERFORMANCE MEASUREMENT SUMMARY (Network: 4G Throttled)');
  console.log('======================================================');
  console.log(`Metric                     | Before (User Issue) | Cold Visit (After) | Warm Reload (After)`);
  console.log(`---------------------------|---------------------|--------------------|--------------------`);
  console.log(`TTFB                       | > 15,000ms          | ${coldMetrics.ttfb}ms               | ${warmMetrics.ttfb}ms`);
  console.log(`First Contentful Paint     | > 25,000ms          | ${coldMetrics.fcp}ms               | ${warmMetrics.fcp}ms`);
  console.log(`DOMContentLoaded           | > 50,000ms          | ${coldDclTime}ms              | ${warmDclTime}ms`);
  console.log(`Featured Card Visible      | > 60,000ms          | ${coldFeaturedCardTime}ms              | ${warmFeaturedCardTime}ms`);
  console.log(`Window Load Event          | > 60,000ms (Freeze) | ${coldLoadTime}ms              | ${warmLoadTime}ms`);
  console.log('======================================================');
}

run().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
