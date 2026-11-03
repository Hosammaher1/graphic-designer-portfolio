// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('node:path');

const ARTIFACTS_DIR = 'C:\\Users\\HP\\.gemini\\antigravity-cli\\brain\\58d5817b-703f-47a7-a1de-bbe67f4c393f\\screenshots';

test.describe('Eclipse Theme Toggle & Circular Reveal Verification', () => {
  test.use({ colorScheme: 'dark' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/en/');
    await page.evaluate(() => {
      try {
        localStorage.setItem('portfolio-theme', 'dark');
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } catch (e) {}
    });
  });

  test('1. Desktop: Verify Eclipse button, Dark mode aesthetics, and Circular reveal to Light mode', async ({ page }) => {
    // 1. Visit homepage in English
    await page.goto('/en/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('header', { timeout: 15000 });

    // Verify initial Dark mode baseline
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await expect(html).toHaveClass(/dark/);

    // Verify Eclipse button exists in header
    const toggleBtn = page.locator('header [data-testid="theme-toggle"]').first();
    await expect(toggleBtn).toBeVisible({ timeout: 10000 });

    // Verify two overlapping discs exist inside SVG
    const circles = toggleBtn.locator('svg circle');
    await expect(circles).toHaveCount(2);

    // Capture initial Dark Mode Desktop screenshot
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'eclipse-theme-dark-desktop.png'),
      fullPage: false,
    });

    // 2. Click Eclipse toggle to initiate circular reveal
    await toggleBtn.click();
    await page.waitForTimeout(900); // Allow 750ms circular reveal animation to complete

    // Verify Light mode is now active on html
    await expect(html).toHaveAttribute('data-theme', 'light');
    await expect(html).toHaveClass(/light/);

    // Verify light mode background: #F6F1EB is rgb(246, 241, 235)
    const bodyBg = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
    expect(bodyBg).toBe('rgb(246, 241, 235)');

    // Verify localStorage has persisted 'light'
    const persisted = await page.evaluate(() => localStorage.getItem('portfolio-theme'));
    expect(persisted).toBe('light');

    // Capture Light Mode Desktop screenshot
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'eclipse-theme-light-desktop.png'),
      fullPage: false,
    });

    // 3. Click again to return to Dark mode smoothly
    await toggleBtn.click();
    await page.waitForTimeout(900);

    await expect(html).toHaveAttribute('data-theme', 'dark');
    await expect(html).toHaveClass(/dark/);

    const revertedPersisted = await page.evaluate(() => localStorage.getItem('portfolio-theme'));
    expect(revertedPersisted).toBe('dark');
  });

  test('2. Mobile: Verify Eclipse toggle in mobile navigation', async ({ page }) => {
    // Set mobile viewport (Pixel 5 / iPhone style)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/en/');
    await page.waitForLoadState('domcontentloaded');

    const html = page.locator('html');
    const toggleBtn = page.locator('header [data-testid="theme-toggle"]').first();
    await expect(toggleBtn).toBeVisible({ timeout: 10000 });

    // Capture Mobile Dark Mode screenshot
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'eclipse-theme-dark-mobile.png'),
      fullPage: false,
    });

    // Click toggle
    await toggleBtn.click();
    await page.waitForTimeout(900);

    await expect(html).toHaveAttribute('data-theme', 'light');

    // Capture Mobile Light Mode screenshot
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'eclipse-theme-light-mobile.png'),
      fullPage: false,
    });
  });

  test('3. Persistence across page reload without flashing', async ({ page }) => {
    await page.goto('/en/');
    await page.waitForLoadState('domcontentloaded');

    const html = page.locator('html');
    const toggleBtn = page.locator('header [data-testid="theme-toggle"]').first();
    await toggleBtn.click();
    await page.waitForTimeout(900);
    await expect(html).toHaveAttribute('data-theme', 'light');

    // Reload the page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Should immediately be in light mode from anti-flash script
    await expect(html).toHaveAttribute('data-theme', 'light');
    await expect(html).toHaveClass(/light/);

    // Reset back to dark for default testing state
    await toggleBtn.click();
    await page.waitForTimeout(900);
    await expect(html).toHaveAttribute('data-theme', 'dark');
  });

  test('4. Circular Reveal: Capture mid-transition wave expanding from Eclipse button', async ({ page }) => {
    await page.goto('/en/');
    await page.waitForLoadState('domcontentloaded');

    const toggleBtn = page.locator('header [data-testid="theme-toggle"]').first();
    await toggleBtn.click();
    await page.waitForTimeout(350); // 350ms into the 750ms circular wave

    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'eclipse-theme-circular-reveal.png'),
      fullPage: false,
    });
  });
});
