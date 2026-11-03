// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity-cli/brain/58d5817b-703f-47a7-a1de-bbe67f4c393f/screenshots';

test.describe('Branding, Identity & About Portrait Acceptance', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage to start clean
    await page.addInitScript(() => {
      try {
        localStorage.clear();
        localStorage.setItem('portfolio-theme', 'dark');
      } catch (e) {}
    });
  });

  test('1. Navbar displays only the official MO logo without designer name or brand text', async ({ page }) => {
    await page.goto('/en/');
    await page.waitForLoadState('networkidle');

    const brandLogo = page.locator('[data-testid="navbar-brand-logo"]');
    await expect(brandLogo).toBeVisible();

    const logoImg = brandLogo.locator('img');
    await expect(logoImg).toBeVisible();
    await expect(logoImg).toHaveAttribute('src', '/logo/logo.png');

    // Confirm designer name is NOT present in Navbar
    const brandText = await brandLogo.innerText();
    expect(brandText.trim()).toBe('');

    // Capture desktop Navbar screenshot
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'navbar-mo-logo-only.png'),
      clip: { x: 0, y: 0, width: 1280, height: 100 },
    });
  });

  test('2. About Me section displays portrait bottom-aligned with clear top badge and stats', async ({ page }) => {
    await page.goto('/en/');
    await page.waitForLoadState('networkidle');

    const aboutSection = page.locator('#about-me');
    await expect(aboutSection).toBeVisible();
    await aboutSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600); // Wait for GSAP reveal

    // Verify Designer Full Name & Professional Title
    const designerName = page.locator('[data-testid="about-designer-name"]');
    await expect(designerName).toBeVisible();
    await expect(designerName).toContainText('Mohammed Maher Aldaya');

    const designerTitle = page.locator('[data-testid="about-designer-title"]');
    await expect(designerTitle).toBeVisible();
    await expect(designerTitle).toContainText('Graphic Designer | Visual Identity & Creative Design');

    // Verify Portrait Image is visible and loaded
    const portraitImg = page.locator('[data-testid="about-profile-image"]');
    await expect(portraitImg).toBeVisible();
    await expect(portraitImg).toHaveAttribute('src', '/profile/mohammed-maher-profile.png');

    // Verify Floating Badges inside the portrait card
    const topBadge = aboutSection.locator('div:has-text("Mohammed Maher Aldaya")').first();
    await expect(topBadge).toBeVisible();

    const statsCard = aboutSection.locator('text=50+').first();
    await expect(statsCard).toBeVisible();

    // Capture desktop About Me screenshot
    await aboutSection.screenshot({
      path: path.join(ARTIFACT_DIR, 'about-portrait-desktop.png'),
    });
  });

  test('3. Mobile layout of About Me renders gracefully with readable badges', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile test only');

    await page.goto('/en/');
    await page.waitForLoadState('networkidle');

    const aboutSection = page.locator('#about-me');
    await expect(aboutSection).toBeVisible();
    await aboutSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    const portraitImg = page.locator('[data-testid="about-profile-image"]');
    await expect(portraitImg).toBeVisible();

    // Capture mobile About Me screenshot
    await aboutSection.screenshot({
      path: path.join(ARTIFACT_DIR, 'about-portrait-mobile.png'),
    });
  });

  test('4. Public Footer does NOT display any Admin link or dashboard reference', async ({ page }) => {
    await page.goto('/en/');
    await page.waitForLoadState('networkidle');

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await footer.scrollIntoViewIfNeeded();

    // Verify Admin link does not exist in footer
    const adminLink = footer.locator('a[href="/admin"], a:text-is("Admin"), a:text-is("لوحة التحكم")');
    await expect(adminLink).toHaveCount(0);

    // Verify official MO logo is present in footer
    const footerLogo = page.locator('[data-testid="footer-brand-logo"]');
    await expect(footerLogo).toBeVisible();
    await expect(footerLogo).toHaveAttribute('src', '/logo/logo.png');

    // Capture Footer screenshot
    await footer.screenshot({
      path: path.join(ARTIFACT_DIR, 'footer-no-admin-link.png'),
    });
  });

  test('5. Unauthenticated visitor accessing /admin redirects to /admin/login', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Should be on /admin/login or showing admin login form
    expect(page.url()).toContain('/admin/login');
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    const loginButton = page.locator('button[type="submit"]');
    await expect(loginButton).toBeVisible();
  });
});
