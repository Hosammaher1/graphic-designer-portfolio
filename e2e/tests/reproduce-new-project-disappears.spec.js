// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs');
const { execSync } = require('node:child_process');

const projectRoot = path.resolve(__dirname, '../..');
const setupScript = path.join(projectRoot, 'backend', 'scripts', 'setup-e2e-user.php');

test.describe('Reproduction: New Project Disappears After Publishing', () => {
  test.beforeAll(async () => {
    execSync(`php "${setupScript}"`, { stdio: 'inherit' });
  });

  test('Trace Create and Publish New Project lifecycle', async ({ page }) => {
    test.setTimeout(60000);

    const networkLogs = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/v1/admin/projects')) {
        networkLogs.push({
          type: 'REQUEST',
          method: req.method(),
          url: req.url(),
          postData: req.postData(),
        });
      }
    });

    page.on('response', async (res) => {
      if (res.url().includes('/api/v1/admin/projects')) {
        let body = '';
        try {
          body = await res.text();
        } catch (e) {
          body = '<unreadable>';
        }
        networkLogs.push({
          type: 'RESPONSE',
          method: res.request().method(),
          url: res.url(),
          status: res.status(),
          body: body.slice(0, 500),
        });
      }
    });

    // 1. Login
    await page.goto('/admin/login');
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 15000 });
    await emailInput.fill('e2e-runner@portfolio.test');
    await page.locator('input[type="password"]').fill('SuperE2ETestPass123!');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 20000 });

    // 2. Navigate to Create New Project
    await page.goto('/admin/projects/new');
    await expect(page.locator('input[type="text"]').first()).toBeVisible({ timeout: 10000 });

    // 3. Fill in Project Information
    // Find Title EN input
    const inputs = await page.locator('input[type="text"]').all();
    console.log(`Found ${inputs.length} text inputs in editor`);

    // Let's fill English title and Arabic title
    // Let's find inputs by placeholder or labels
    const titleEnInput = page.locator('input').filter({ hasText: '' }).nth(0);
    await titleEnInput.fill('Reproduction Brand Identity');

    // Select category if available
    const categoryCheckbox = page.locator('input[type="checkbox"]').first();
    if (await categoryCheckbox.isVisible()) {
      await categoryCheckbox.check();
    }

    // 4. Click Publish Button
    const publishBtn = page.getByRole('button', { name: /Publish Project|نشر المشروع/i });
    console.log('Clicking Publish button and awaiting response...');
    
    const [postResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/v1/admin/projects') && res.request().method() === 'POST', { timeout: 15000 }).catch((e) => null),
      publishBtn.click(),
    ]);

    if (postResponse) {
      console.log('POST Response status:', postResponse.status());
      console.log('POST Response text:', await postResponse.text());
    } else {
      console.log('NO POST RESPONSE RECEIVED within 15 seconds!');
    }

    await page.waitForTimeout(3000);

    console.log('Network logs captured:');
    console.log(JSON.stringify(networkLogs, null, 2));

    // 5. Navigate to /admin/projects
    await page.goto('/admin/projects');
    await page.waitForTimeout(2000);

    // Check project list
    const pageContent = await page.textContent('body');
    const hasProject = pageContent.includes('Reproduction Brand Identity');
    console.log(`Project visible in list after create: ${hasProject}`);

    // 6. Hard reload
    await page.reload();
    await page.waitForTimeout(2000);
    const pageContentAfterReload = await page.textContent('body');
    const hasProjectAfterReload = pageContentAfterReload.includes('Reproduction Brand Identity');
    console.log(`Project visible in list after reload: ${hasProjectAfterReload}`);
  });
});
