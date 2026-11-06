// @ts-check
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const TARGET_URL = 'https://mohammed-design.vercel.app/ar/';

async function diagnose() {
  const browser = await chromium.launch({ headless: true });
  const iPhone = devices['iPhone 12'];
  
  const context = await browser.newContext({
    ...iPhone,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
  });
  
  const page = await context.newPage();
  
  // Track console logs and errors
  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => consoleLogs.push(`[PAGE ERROR] ${err.message}`));
  
  // Track all network requests
  const networkEvents = [];
  page.on('request', req => {
    networkEvents.push({ type: 'start', url: req.url(), method: req.method(), resourceType: req.resourceType(), time: Date.now() });
  });
  page.on('response', res => {
    networkEvents.push({ type: 'end', url: res.url(), status: res.status(), time: Date.now() });
  });
  page.on('requestfailed', req => {
    networkEvents.push({ type: 'failed', url: req.url(), errorText: req.failure()?.errorText, time: Date.now() });
  });

  // Emulate Typical 4G Network
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8
  });

  console.log('--- NAVIGATING TO ' + TARGET_URL + ' ---');
  const startTime = Date.now();
  
  await page.goto(TARGET_URL, { waitUntil: 'commit' });
  console.log(`Commit received at: ${Date.now() - startTime}ms`);

  const inspectSectionState = async (label) => {
    const elapsed = Date.now() - startTime;
    const state = await page.evaluate(() => {
      const getInfo = (selector) => {
        const el = document.querySelector(selector);
        if (!el) return { exists: false };
        const cs = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          exists: true,
          opacity: cs.opacity,
          visibility: cs.visibility,
          display: cs.display,
          width: rect.width,
          height: rect.height,
          top: rect.top,
          textSample: (el.textContent || '').trim().slice(0, 30)
        };
      };

      const heroStaggers = Array.from(document.querySelectorAll('.hero-stagger')).map(el => ({
        text: (el.textContent || '').trim().slice(0, 20),
        opacity: window.getComputedStyle(el).opacity,
        transform: window.getComputedStyle(el).transform
      }));

      const aboutReveals = Array.from(document.querySelectorAll('.about-reveal')).map(el => ({
        tag: el.tagName,
        cls: el.className.slice(0, 30),
        opacity: window.getComputedStyle(el).opacity,
        transform: window.getComputedStyle(el).transform,
        top: el.getBoundingClientRect().top
      }));

      const skillStaggers = Array.from(document.querySelectorAll('.skill-stagger')).map(el => ({
        opacity: window.getComputedStyle(el).opacity,
        top: el.getBoundingClientRect().top
      }));

      const milestoneCards = Array.from(document.querySelectorAll('.milestone-card')).map(el => ({
        opacity: window.getComputedStyle(el).opacity,
        top: el.getBoundingClientRect().top
      }));

      return {
        bodyBg: window.getComputedStyle(document.body).backgroundColor,
        rootHtmlLength: document.getElementById('root')?.innerHTML.length || 0,
        hero: getInfo('#hero'),
        heroStaggers: heroStaggers.slice(0, 3),
        selectedWork: getInfo('#selected-work'),
        aboutMe: getInfo('#about-me'),
        aboutReveals: aboutReveals.slice(0, 3),
        skills: getInfo('#skills-expertise'),
        skillStaggers: skillStaggers.slice(0, 3),
        journey: getInfo('#creative-journey'),
        milestoneCards: milestoneCards.slice(0, 3),
        contact: getInfo('#contact')
      };
    });
    console.log(`\n=== SNAPSHOT [${label} @ ${elapsed}ms] ===`);
    console.log(`Root HTML Length: ${state.rootHtmlLength}`);
    console.log(`Hero exists: ${state.hero.exists}, opacity: ${state.hero.opacity}, text: "${state.hero.textSample}"`);
    console.log(`Hero staggers:`, JSON.stringify(state.heroStaggers));
    console.log(`About reveals:`, JSON.stringify(state.aboutReveals));
    console.log(`Skill staggers:`, JSON.stringify(state.skillStaggers));
    console.log(`Milestone cards:`, JSON.stringify(state.milestoneCards));
    return state;
  };

  // Inspect at intervals
  await page.waitForTimeout(500);
  await inspectSectionState('500ms');

  await page.waitForTimeout(1500);
  await inspectSectionState('2000ms');

  await page.waitForTimeout(3000);
  await inspectSectionState('5000ms');

  // Now inspect scrolling through all sections!
  console.log('\n--- SCROLLING TESTS ---');
  const sections = ['#hero', '#selected-work', '#about-me', '#skills-expertise', '#creative-journey', '#contact'];
  
  for (const sec of sections) {
    const pos = await page.evaluate((s) => {
      const el = document.querySelector(s);
      if (el) {
        el.scrollIntoView({ behavior: 'instant', block: 'start' });
        return { found: true, top: el.getBoundingClientRect().top };
      }
      return { found: false };
    }, sec);

    await page.waitForTimeout(600); // Wait for scroll / intersection observers
    console.log(`\nScrolled to ${sec}:`, pos);
    await inspectSectionState(`Scrolled to ${sec}`);
    
    // Screenshot
    const sPath = path.resolve(__dirname, `../../screenshots/diag-${sec.replace('#', '')}.png`);
    await page.screenshot({ path: sPath });
    console.log(`Saved screenshot: ${sPath}`);
  }

  // Print network requests summary
  console.log('\n--- NETWORK EVENTS SUMMARY ---');
  networkEvents.forEach(e => {
    if (e.type === 'start') {
      console.log(`REQ START [${e.resourceType}] ${e.url.slice(0, 90)}`);
    } else if (e.type === 'failed') {
      console.log(`REQ FAILED: ${e.url.slice(0, 90)} error: ${e.errorText}`);
    }
  });

  // Print console logs
  console.log('\n--- CONSOLE LOGS ---');
  consoleLogs.forEach(l => console.log(l));

  await browser.close();
}

diagnose().catch(err => {
  console.error('Diagnosis script error:', err);
  process.exit(1);
});
