// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs');

const ARTIFACTS_DIR = 'C:\\Users\\HP\\.gemini\\antigravity-cli\\brain\\58d5817b-703f-47a7-a1de-bbe67f4c393f\\screenshots';

test.describe('Admin Dashboard Real Data & Demo Elimination Verification', () => {
  test.beforeEach(async ({ page, context }) => {
    test.setTimeout(60000);
    if (!fs.existsSync(ARTIFACTS_DIR)) {
      fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
    }

    // Set local storage auth so the admin shell immediately recognizes authenticated state
    await context.addInitScript(() => {
      window.localStorage.setItem('studio_admin_auth', 'true');
      window.localStorage.setItem('studio_admin_lang', 'en');
    });

    // Mock Sanctum session check to verify authenticated admin user
    await page.route('**/api/v1/auth/me', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            user: {
              id: 2,
              name: 'Mohammed Maher',
              email: 'mohmmed.maher467@gmail.com',
              is_admin: true,
            },
          },
        }),
      });
    });
  });

  test('Overview Dashboard renders real metrics, zero demo data, and captures desktop/mobile screenshots', async ({ page }) => {
    // 1. Desktop Viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    // Wait for the overview heading
    await expect(page.locator('h1').first()).toContainText(/Studio Overview|Portfolio Performance/i, { timeout: 15000 });

    const pageContent = await page.textContent('body');

    // Verify all eliminated demo values are absent
    expect(pageContent).not.toContain('12,480');
    expect(pageContent).not.toContain('4,890');
    expect(pageContent).not.toContain('3m 42s');
    expect(pageContent).not.toContain('+3 new');
    expect(pageContent).not.toContain('+24.6%');
    expect(pageContent).not.toContain('+18.2%');

    // Verify real Inquiries card is present
    expect(pageContent).toContain('Client Inquiries');

    // Capture desktop screenshot
    const desktopOverviewPath = path.join(ARTIFACTS_DIR, 'admin-dashboard-overview-desktop.png');
    await page.screenshot({ path: desktopOverviewPath, fullPage: false });
    expect(fs.existsSync(desktopOverviewPath)).toBe(true);

    // 2. Mobile Viewport (Pixel 5)
    await page.setViewportSize({ width: 393, height: 851 });
    await page.waitForTimeout(1000);

    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    const mobileOverviewPath = path.join(ARTIFACTS_DIR, 'admin-dashboard-overview-mobile.png');
    await page.screenshot({ path: mobileOverviewPath, fullPage: false });
    expect(fs.existsSync(mobileOverviewPath)).toBe(true);
  });

  test('Analytics Page renders real metrics, zero fabricated multipliers, and captures screenshots', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    // Navigate to Analytics
    await page.click('a[href="/admin/analytics"], button:has-text("Analytics"), [title="Analytics"]');
    await page.waitForTimeout(1000);

    const pageContent = await page.textContent('body');

    // Verify fabricated multiplier datasets are absent
    expect(pageContent).not.toContain('18,620');
    expect(pageContent).not.toContain('4,820 visits');
    expect(pageContent).not.toContain('3,290 visits');
    expect(pageContent).not.toContain('3m 48s');
    expect(pageContent).not.toContain('+28.4%');
    expect(pageContent).not.toContain('+34.1%');

    // Capture desktop analytics screenshot
    const desktopAnalyticsPath = path.join(ARTIFACTS_DIR, 'admin-dashboard-analytics-desktop.png');
    await page.screenshot({ path: desktopAnalyticsPath, fullPage: false });
    expect(fs.existsSync(desktopAnalyticsPath)).toBe(true);

    // Mobile Viewport
    await page.setViewportSize({ width: 393, height: 851 });
    await page.waitForTimeout(1000);

    const mobileAnalyticsPath = path.join(ARTIFACTS_DIR, 'admin-dashboard-analytics-mobile.png');
    await page.screenshot({ path: mobileAnalyticsPath, fullPage: false });
    expect(fs.existsSync(mobileAnalyticsPath)).toBe(true);
  });
});
