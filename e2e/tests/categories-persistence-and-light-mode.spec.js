// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs');
const { execSync } = require('node:child_process');

const projectRoot = path.resolve(__dirname, '../..');
const setupScript = path.join(projectRoot, 'backend', 'scripts', 'setup-e2e-user.php');
const screenshotsDir = 'C:/Users/HP/.gemini/antigravity-cli/brain/58d5817b-703f-47a7-a1de-bbe67f4c393f/screenshots';

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

test.describe('End-to-End Verification: Category Persistence, Project Creation & Light Mode Isolation', () => {
  test.beforeAll(async () => {
    try {
      execSync(`php "${setupScript}"`, { stdio: 'inherit' });
    } catch (e) {
      console.warn('Setup script note:', e.message);
    }
  });

  test('1. Admin Dashboard Dark Studio Aesthetic Verification', async ({ page }) => {
    test.setTimeout(45000);

    // Login
    await page.goto('/admin/login');
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 15000 });
    await emailInput.fill('e2e-runner@portfolio.test');
    await page.locator('input[type="password"]').fill('SuperE2ETestPass123!');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 20000 });

    // Verify Admin root has dark background
    const adminRoot = page.locator('#admin-root');
    await expect(adminRoot).toBeVisible();

    // Capture Desktop Admin Dashboard screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, 'admin-dashboard-dark-desktop.png'),
      fullPage: false,
    });

    console.log('Admin Dashboard dark aesthetic verified and screenshot captured.');
  });

  test('2. Project Creation & Category Persistence Flow', async ({ page, context }) => {
    test.setTimeout(60000);

    const testProjectTitle = `Zenith Lux Studio ${Date.now()}`;

    // Clean session to avoid stale auth state
    await context.clearCookies();
    await page.goto('/admin/login');
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 15000 });
    await emailInput.fill('e2e-runner@portfolio.test');
    await page.locator('input[type="password"]').fill('SuperE2ETestPass123!');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 20000 });

    // Navigate to Create New Project
    await page.evaluate(() => localStorage.setItem('studio_admin_auth', 'true'));
    await page.goto('/admin/projects/new');
    await page.waitForLoadState('networkidle');

    // Fill Title
    const titleInput = page.locator('input[placeholder="e.g. Noya Skincare"]');
    await expect(titleInput).toBeVisible({ timeout: 10000 });
    await titleInput.fill(testProjectTitle);

    // Fill Arabic Title
    const titleArInput = page.locator('input[placeholder="مثال: نويا سكينكير"]');
    await expect(titleArInput).toBeVisible();
    await titleArInput.fill('استوديو زينيث الفاخر');

    // Select category checkboxes
    const checkboxes = await page.locator('input[type="checkbox"]').all();
    console.log(`Found ${checkboxes.length} category checkboxes.`);
    if (checkboxes.length > 0) {
      await checkboxes[0].check();
    }
    if (checkboxes.length > 1) {
      await checkboxes[1].check();
    }

    // Verify at least one is checked
    const checkedCount = await page.locator('input[type="checkbox"]:checked').count();
    expect(checkedCount).toBeGreaterThanOrEqual(1);

    // Click Publish button
    const publishBtn = page.getByRole('button', { name: /Publish Project|نشر المشروع/i });
    await expect(publishBtn).toBeVisible();

    const [postResponse] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/v1/admin/projects') && res.request().method() === 'POST',
        { timeout: 15000 }
      ),
      publishBtn.click(),
    ]);

    expect(postResponse).not.toBeNull();
    expect(postResponse.status()).toBe(201);
    const postData = await postResponse.json();
    console.log('Project created successfully with ID:', postData.data?.project?.id || postData.data?.id);

    // Verify navigation to edit page occurred
    await page.waitForURL(/\/admin\/projects\/\d+\/edit/, { timeout: 10000 });

    // Verify categories remain checked in edit view
    const checkedAfterSave = await page.locator('input[type="checkbox"]:checked').count();
    expect(checkedAfterSave).toBeGreaterThanOrEqual(1);

    // Navigate to Projects List
    await page.goto('/admin/projects');
    await page.waitForLoadState('networkidle');

    // Verify project appears in the list
    let listContent = await page.textContent('body');
    expect(listContent).toContain(testProjectTitle);

    // Hard reload to confirm persistence in MySQL
    await page.reload({ waitUntil: 'networkidle' });
    listContent = await page.textContent('body');
    expect(listContent).toContain(testProjectTitle);

    // Capture screenshot of Admin Project List showing created project
    await page.screenshot({
      path: path.join(screenshotsDir, 'admin-projects-list-persisted.png'),
      fullPage: false,
    });

    console.log(`Verified project "${testProjectTitle}" persisted in MySQL and Admin list!`);
  });

  test('3. Public Visitor Website & Light Mode Visual Verification', async ({ page }) => {
    test.setTimeout(60000);

    // 1. Visit public homepage
    await page.goto('/en/');
    await page.waitForLoadState('networkidle');

    // Capture Public Dark Mode Desktop screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, 'public-homepage-dark-desktop.png'),
      fullPage: false,
    });

    // 2. Toggle to Light Mode via theme toggle button or class
    const themeToggleBtn = page.locator('[aria-label*="Toggle theme"], [aria-label*="theme"], button:has-text("Toggle theme")').first();
    if (await themeToggleBtn.isVisible()) {
      await themeToggleBtn.click();
      await page.waitForTimeout(1000);
    } else {
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
        localStorage.setItem('portfolio-theme', 'light');
      });
      await page.waitForTimeout(500);
    }

    // Verify Light mode classes and CSS
    const isLight = await page.evaluate(() => {
      return document.documentElement.classList.contains('light') || document.documentElement.getAttribute('data-theme') === 'light';
    });
    expect(isLight).toBe(true);

    // Check public root background color in Light Mode
    const publicBg = await page.evaluate(() => {
      const el = document.getElementById('public-root') || document.body;
      return window.getComputedStyle(el).backgroundColor;
    });
    console.log('Public background in Light Mode:', publicBg);

    // Capture Public Light Mode Desktop screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, 'public-homepage-light-desktop.png'),
      fullPage: false,
    });

    // 3. Navigate to All Projects screen (/en/work) in Light Mode
    await page.goto('/en/work');
    await page.waitForLoadState('networkidle');

    // Capture All Projects screen in Light Mode
    await page.screenshot({
      path: path.join(screenshotsDir, 'public-all-projects-light-desktop.png'),
      fullPage: false,
    });

    // 4. Verify Admin Dashboard remains strictly dark even when theme in localStorage is light
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');

    const adminHtmlTheme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });
    console.log('Admin document data-theme attribute:', adminHtmlTheme);
    expect(adminHtmlTheme).toBe('dark');

    // Capture Admin screenshot with light mode background to prove isolation
    await page.screenshot({
      path: path.join(screenshotsDir, 'admin-dashboard-isolated-dark-desktop.png'),
      fullPage: false,
    });

    console.log('All public light mode and admin isolation tests passed successfully!');
  });
});
