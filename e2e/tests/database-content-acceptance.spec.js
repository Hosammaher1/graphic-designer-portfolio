// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('node:path');
const { execSync } = require('node:child_process');

const ARTIFACTS_DIR = 'C:\\Users\\HP\\.gemini\\antigravity-cli\\brain\\58d5817b-703f-47a7-a1de-bbe67f4c393f\\screenshots';

async function loginAdmin(page) {
  await page.goto('/admin/login');
  await page.waitForLoadState('domcontentloaded');
  const emailInput = page.locator('input[type="email"]');
  if (await emailInput.count() > 0) {
    await emailInput.fill('admin@portfolio.test');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Studio Overview').or(page.locator('text=Portfolio Catalogue')).or(page.locator('text=Overview')).first()).toBeVisible({ timeout: 20000 });
  }
}

test.describe('Real Database-Driven Content & Acceptance Verification', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.text().includes('error') || msg.text().includes('fail')) {
        console.log('BROWSER LOG:', msg.text());
      }
    });
    page.on('pageerror', (err) => console.log('BROWSER UNCAUGHT ERROR:', err.message));
  });

  test.beforeAll(async () => {
    try {
      execSync('php -r "require \'backend/vendor/autoload.php\'; $app = require_once \'backend/bootstrap/app.php\'; $kernel = $app->make(Illuminate\\Contracts\\Console\\Kernel::class); $kernel->bootstrap(); App\\Models\\Project::withTrashed()->forceDelete();"', {
        cwd: path.resolve(__dirname, '../..'),
      });
    } catch (e) {
      console.warn('Database reset beforeAll warning:', e.message);
    }
  });

  test('1. Empty database renders luxury empty state without demo/fake projects', async ({ page }) => {
    // 1. Visit homepage
    await page.goto('/en/');
    await page.waitForLoadState('domcontentloaded');

    // 2. Selected Work section check
    const selectedWork = page.locator('#selected-work');
    await expect(selectedWork).toBeVisible({ timeout: 15000 });

    // Verify luxury empty state headline and emblem
    const emptyHeading = selectedWork.locator('h3');
    await expect(emptyHeading).toContainText(/Curating New Works|Portfolio Showcase/i, { timeout: 15000 });

    // Verify NO demo project titles are visible
    const pageText = await page.textContent('body');
    expect(pageText).not.toContain('Noya Skincare Suite');
    expect(pageText).not.toContain('Kinetic Type Posters');

    // Capture screenshot of empty homepage
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'acceptance-empty-database-home.png'),
      fullPage: false,
    });

    // 3. Visit /en/work
    await page.goto('/en/work');
    await page.waitForLoadState('domcontentloaded');

    const workEmpty = page.locator('text=No Projects Found').or(page.locator('h3:has-text("No Projects Found")'));
    await expect(workEmpty).toBeVisible({ timeout: 15000 });

    // Capture screenshot of empty work screen
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'acceptance-empty-database-work.png'),
      fullPage: false,
    });
  });

  test('2. Admin logs in, creates a database project, and saves it', async ({ page }) => {
    // 1. Visit Admin Login
    await page.goto('/admin/login');
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });

    // Fill credentials
    await page.fill('input[type="email"]', 'admin@portfolio.test');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // Wait until login completes and dashboard UI is displayed
    await expect(page.locator('text=Studio Overview').or(page.locator('text=Portfolio Catalogue')).or(page.locator('text=Overview')).first()).toBeVisible({ timeout: 20000 });

    // 2. Navigate to Project Editor New
    await page.goto('/admin/projects/new');
    await page.waitForSelector('input[placeholder="e.g. Noya Skincare"]', { timeout: 20000 });

    // Fill Project Information
    await page.locator('input[placeholder="e.g. Noya Skincare"]').fill('Aura Minimalist Identity');
    await page.locator('input[placeholder="مثال: نويا سكينكير"]').fill('مشروع أورا للهوية المرئية');

    const slugInput = page.locator('div:has(> label:has-text("Slug")) input').first();
    if (await slugInput.count() > 0) {
      await slugInput.fill('aura-minimalist');
    }

    const clientInput = page.locator('div:has(> label:has-text("Client")) input').first();
    if (await clientInput.count() > 0) {
      await clientInput.fill('Aura Luxury Studio');
    }

    const yearInput = page.locator('div:has(> label:has-text("Year")) input').first();
    if (await yearInput.count() > 0) {
      await yearInput.fill('2026');
    }

    // Description
    const descEnInput = page.locator('textarea[placeholder*="Elaborate"]').first();
    if (await descEnInput.count() > 0) {
      await descEnInput.fill('Strategic brand identity and spatial visual system for an avant-garde lifestyle studio.');
    }

    const descArInput = page.locator('textarea[placeholder*="اشرح"]').first();
    if (await descArInput.count() > 0) {
      await descArInput.fill('هوية بصرية استراتيجية وتصميم مكاني فاخر.');
    }

    // Save & Publish project and wait for 201 Created response
    const publishButton = page.locator('button:has-text("Publish Project"), button:has-text("نشر المشروع")').first();
    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/v1/admin/projects') && resp.status() === 201, { timeout: 20000 }),
      publishButton.click(),
    ]);

    await page.waitForTimeout(500);

    // Navigate to projects list
    await page.goto('/admin/projects');
    await page.waitForSelector('text=Aura Minimalist Identity', { timeout: 20000 });

    // Capture screenshot of admin projects list
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'acceptance-admin-project-list.png'),
      fullPage: false,
    });
  });

  test('3. Created project appears dynamically on public website and opens modal', async ({ page }) => {
    // Visit public homepage
    await page.goto('/en/');
    await page.waitForSelector('#selected-work', { timeout: 20000 });

    // Project should now appear in Selected Work
    const selectedWork = page.locator('#selected-work');
    await expect(selectedWork).toBeVisible();

    const projectCard = selectedWork.locator('text=Aura Minimalist Identity').first();
    await expect(projectCard).toBeVisible({ timeout: 15000 });

    // Click project or arrow button to open details modal
    const openBtn = selectedWork.locator('button[aria-label="Open project case study"]').first();
    if (await openBtn.count() > 0) {
      await openBtn.click();
    } else {
      await projectCard.click({ force: true });
    }
    await page.waitForTimeout(1000);

    // Verify modal is open and has project title
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 15000 });
    await expect(modal.locator('h1#modal-project-title')).toContainText('Aura Minimalist Identity', { timeout: 15000 });

    // Capture screenshot of modal with real database content
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'acceptance-public-project-modal.png'),
      fullPage: false,
    });

    // Close modal
    const closeBtn = modal.locator('button[aria-label="Close"], button[aria-label="إغلاق"]').or(modal.locator('button:has(svg.lucide-x)'));
    await closeBtn.first().click();
    await expect(modal).not.toBeVisible({ timeout: 5000 });
  });

  test('4. Admin edits homepage settings and public site reflects changes', async ({ page }) => {
    // 1. Visit admin settings (log in if session not persisted)
    await loginAdmin(page);
    await page.goto('/admin/settings');
    await page.waitForSelector('button:has-text("Homepage Content"), button:has-text("محتوى الرئيسية")', { timeout: 20000 });

    // Click "Homepage Content" tab
    const contentTab = page.locator('button:has-text("Homepage Content"), button:has-text("محتوى الرئيسية")');
    if (await contentTab.count() > 0) {
      await contentTab.click();
      await page.waitForTimeout(500);
    }

    // Update Hero Kicker
    const kickerInput = page.locator('div:has(> label:has-text("Hero Kicker (English)")) input').or(page.locator('input').first());
    await kickerInput.fill('Master of Visual Systems');

    // Click Save Studio Settings and wait for 200 OK response
    const saveSettingsBtn = page.locator('button:has-text("Save Settings"), button:has-text("حفظ الإعدادات"), button:has-text("Save")').first();
    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/v1/admin/settings') && resp.status() === 200, { timeout: 20000 }),
      saveSettingsBtn.click(),
    ]);
    await page.waitForTimeout(500);

    // 2. Visit public website
    await page.goto('/en/');
    await page.waitForSelector('#hero p', { timeout: 20000 });

    // Verify updated Hero kicker
    const heroKicker = page.locator('#hero p').first();
    await expect(heroKicker).toContainText('Master of Visual Systems', { timeout: 15000 });

    // Capture screenshot of public homepage reflecting dynamic settings
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'acceptance-settings-reflection.png'),
      fullPage: false,
    });
  });

  test('5. Unpublishing or deleting project returns public site to luxury empty state', async ({ page }) => {
    // 1. Visit admin projects (log in if session not persisted)
    await loginAdmin(page);
    await page.goto('/admin/projects');
    await page.waitForSelector('button[title*="Trash"], button[title*="السلة"], button[title*="Delete"], button[title*="حذف"]', { timeout: 20000 });

    // Find and delete the project
    const deleteBtn = page.locator('button[title*="Trash"], button[title*="السلة"], button[title*="Delete"], button[title*="حذف"]').first();
    await deleteBtn.click();
    await page.waitForTimeout(500);

    // Confirm deletion in modal and wait for DELETE response
    const confirmBtn = page.locator('button:has-text("Move to Trash"), button:has-text("نقل إلى السلة")').last();
    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/v1/admin/projects/') && resp.request().method() === 'DELETE', { timeout: 20000 }),
      confirmBtn.click(),
    ]);
    await page.waitForTimeout(1000);

    // 2. Visit public homepage
    await page.goto('/en/');
    await page.waitForSelector('#selected-work', { timeout: 20000 });

    // Verify Selected Work is back to luxury empty state
    const selectedWork = page.locator('#selected-work');
    await expect(selectedWork).toBeVisible();
    const emptyHeading = selectedWork.locator('h3');
    await expect(emptyHeading).toContainText(/Curating New Works|Portfolio Showcase/i, { timeout: 15000 });

    // Capture screenshot of empty state returned
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'acceptance-unpublish-empty-state.png'),
      fullPage: false,
    });
  });
});
