// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs');

const auditDir = 'C:/Users/HP/.gemini/antigravity-cli/brain/58d5817b-703f-47a7-a1de-bbe67f4c393f/audit_screenshots';
if (!fs.existsSync(auditDir)) {
  fs.mkdirSync(auditDir, { recursive: true });
}

test.describe('Public Website Complete Light Mode Visual Audit', () => {
  test('Audit all sections in Light Mode across viewports and RTL', async ({ page }) => {
    test.setTimeout(90000);

    // 1. Desktop 1440px Light Mode Audit
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/');
    await page.waitForLoadState('networkidle');

    // Force light mode
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('portfolio-theme', 'light');
    });
    await page.waitForTimeout(500);

    // Section 1: Header / Navbar
    const header = page.locator('header').first();
    await header.screenshot({ path: path.join(auditDir, 'desktop-1440-light-01-navbar.png') });

    // Section 2: Hero Section
    const hero = page.locator('#hero');
    await hero.screenshot({ path: path.join(auditDir, 'desktop-1440-light-02-hero.png') });

    // Section 3: Selected Work Carousel
    const selectedWork = page.locator('#selected-work');
    await selectedWork.screenshot({ path: path.join(auditDir, 'desktop-1440-light-03-selected-work.png') });

    // Section 4: About Section
    const about = page.locator('#about-me');
    await about.screenshot({ path: path.join(auditDir, 'desktop-1440-light-04-about.png') });

    // Section 5: Skills Section
    const skills = page.locator('#skills-expertise');
    await skills.screenshot({ path: path.join(auditDir, 'desktop-1440-light-05-skills.png') });

    // Section 6: Journey Section
    const journey = page.locator('#creative-journey');
    await journey.screenshot({ path: path.join(auditDir, 'desktop-1440-light-06-journey.png') });

    // Section 7: Contact Section
    const contact = page.locator('#contact');
    await contact.screenshot({ path: path.join(auditDir, 'desktop-1440-light-07-contact.png') });

    // Section 8: Footer
    const footer = page.locator('footer');
    await footer.screenshot({ path: path.join(auditDir, 'desktop-1440-light-08-footer.png') });

    // Section 9: All Projects Screen
    await page.goto('/en/work');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(auditDir, 'desktop-1440-light-09-all-projects.png'), fullPage: true });

    // Section 10: Project Details Modal
    const firstProjectCard = page.locator('.project-card-body').first();
    if (await firstProjectCard.isVisible()) {
      await firstProjectCard.click();
      await page.waitForTimeout(800);
      const modal = page.locator('.public-modal-panel').first();
      if (await modal.isVisible()) {
        await modal.screenshot({ path: path.join(auditDir, 'desktop-1440-light-10-project-modal.png') });
        // Close modal
        const closeBtn = page.locator('button[aria-label*="Close"], button[aria-label*="إغلاق"]').first();
        if (await closeBtn.isVisible()) await closeBtn.click();
      }
    }

    // 2. Mobile 390px Light Mode Audit
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/en/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    });
    await page.waitForTimeout(500);

    // Mobile Navbar & Drawer
    const mobileMenuBtn = page.locator('button[aria-label*="Menu"], button[aria-label*="menu"], header button').last();
    if (await mobileMenuBtn.isVisible()) {
      await mobileMenuBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(auditDir, 'mobile-390-light-drawer.png') });
      await mobileMenuBtn.click(); // Close
      await page.waitForTimeout(300);
    }
    await page.screenshot({ path: path.join(auditDir, 'mobile-390-light-hero.png') });

    // 3. Arabic RTL Light Mode Audit
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/ar/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(auditDir, 'desktop-1440-light-arabic-home.png'), fullPage: false });

    // Log complete
    console.log('AUDIT_SCREENSHOTS_CAPTURED_SUCCESSFULLY');
  });
});
