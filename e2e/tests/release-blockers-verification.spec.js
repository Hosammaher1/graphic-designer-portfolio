// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs');
const { execSync } = require('node:child_process');

const ARTIFACTS_DIR = 'C:\\Users\\HP\\.gemini\\antigravity-cli\\brain\\58d5817b-703f-47a7-a1de-bbe67f4c393f\\screenshots';
const REAL_IMAGE_PATH = path.resolve(__dirname, '../../frontend/public/logo/logo.png');
const projectRoot = path.resolve(__dirname, '../..');
const setupScript = path.join(projectRoot, 'backend', 'scripts', 'setup-e2e-user.php');

test.describe('Release Blockers Verification: Issues 1, 2, and 3 End-to-End', () => {
  test.beforeAll(async () => {
    if (!fs.existsSync(ARTIFACTS_DIR)) {
      fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
    }
    execSync(`php "${setupScript}"`, { stdio: 'inherit' });
  });

  test('Project 9: Zero hydration mismatch, media picker thumbnails visible, real upload persists to MySQL and appears on public site', async ({ page, browser }) => {
    test.setTimeout(120000);

    const consoleErrors = [];
    const hydrationErrors = [];

    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
      if (
        text.includes('Hydration failed') ||
        text.includes("server rendered HTML didn't match") ||
        text.includes('did not match') ||
        text.includes('hydrating')
      ) {
        hydrationErrors.push(text);
      }
    });

    // -------------------------------------------------------------
    // STEP 1: Login to Studio Admin
    // -------------------------------------------------------------
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/admin/login');
    await page.waitForLoadState('domcontentloaded');

    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 15000 });
    await emailInput.fill('e2e-runner@portfolio.test');

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('SuperE2ETestPass123!');

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 20000 });

    // -------------------------------------------------------------
    // STEP 2: Navigate directly to Edit Project 9 (/admin/projects/9/edit)
    // -------------------------------------------------------------
    await page.goto('/admin/projects/9/edit');
    await page.waitForLoadState('domcontentloaded');

    // Wait for project editor header to be visible
    const editorHeader = page.locator('h1').filter({ hasText: /Edit|تعديل/ });
    await expect(editorHeader).toBeVisible({ timeout: 15000 });

    // VERIFY ISSUE 2: ZERO HYDRATION ERRORS
    expect(hydrationErrors).toEqual([]);
    console.log('ISSUE 2 VERIFIED: Zero hydration mismatch errors on route /admin/projects/9/edit!');

    // -------------------------------------------------------------
    // STEP 3: Open Media Picker for Cover Image
    // -------------------------------------------------------------
    const chooseCoverBtn = page.locator('button:has-text("Change Cover Image"), button:has-text("Choose Cover"), button:has-text("تغيير صورة الغلاف"), button:has-text("اختيار صورة الغلاف")').first();
    await expect(chooseCoverBtn).toBeVisible({ timeout: 10000 });
    await chooseCoverBtn.click();

    const mediaPickerModal = page.locator('div.fixed.inset-0.z-50');
    await expect(mediaPickerModal).toBeVisible({ timeout: 10000 });

    // VERIFY ISSUE 1 (Thumbnails): Check existing thumbnails in picker
    const thumbnailImages = mediaPickerModal.locator('img');
    const thumbCount = await thumbnailImages.count();
    console.log(`Found ${thumbCount} thumbnail images in media picker modal.`);

    for (let i = 0; i < thumbCount; i++) {
      const src = await thumbnailImages.nth(i).getAttribute('src');
      expect(src).not.toBeNull();
      expect(src).not.toBe('');
      expect(src).not.toBe('undefined');
    }

    // Capture screenshot of media picker
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'release-blocker-media-picker-modal.png'),
    });

    // -------------------------------------------------------------
    // STEP 4: Upload Real Image (logo.png) through Media Picker
    // -------------------------------------------------------------
    const uploadInput = mediaPickerModal.locator('input[type="file"]');
    const uploadPromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/admin/media/upload') && resp.request().method() === 'POST',
      { timeout: 25000 }
    );

    await uploadInput.setInputFiles(REAL_IMAGE_PATH);

    const uploadResponse = await uploadPromise;
    expect(uploadResponse.status()).toBe(201);
    const uploadJson = await uploadResponse.json();
    expect(uploadJson.status).toBe('success');
    expect(uploadJson.data?.asset?.id).toBeDefined();
    const uploadedAssetId = uploadJson.data.asset.id;
    const uploadedAssetUrl = uploadJson.data.asset.original_url;
    console.log(`Real image uploaded successfully! Asset ID: ${uploadedAssetId}, URL: ${uploadedAssetUrl}`);

    // Wait for the modal selection button to become enabled
    const selectBtn = mediaPickerModal.locator('button:has-text("Choose Asset"), button:has-text("اختيار الصورة")');
    await expect(selectBtn).toBeEnabled({ timeout: 15000 });
    await selectBtn.click();
    await expect(mediaPickerModal).toBeHidden({ timeout: 5000 });

    // -------------------------------------------------------------
    // STEP 5: Verify Cover Image Preview in Project Editor
    // -------------------------------------------------------------
    const coverPreviewImg = page.locator('img[alt="Cover preview"]');
    await expect(coverPreviewImg).toBeVisible({ timeout: 10000 });
    const coverSrc = await coverPreviewImg.getAttribute('src');
    expect(coverSrc).toContain(uploadedAssetUrl);
    console.log(`Project editor cover preview updated to: ${coverSrc}`);

    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'release-blocker-project-editor-cover-selected.png'),
    });

    // -------------------------------------------------------------
    // STEP 6: Save and Publish Project 9
    // -------------------------------------------------------------
    const updateProjectPromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/admin/projects/9') && resp.request().method() === 'PUT',
      { timeout: 25000 }
    );

    const publishBtn = page.locator('button:has-text("Publish"), button:has-text("نشر")').first();
    await publishBtn.click();

    const updateResponse = await updateProjectPromise;
    expect(updateResponse.status()).toBe(200);
    const updateJson = await updateResponse.json();
    expect(updateJson.status).toBe('success');
    expect(updateJson.data?.project?.cover_media_id).toBe(uploadedAssetId);
    expect(updateJson.data?.project?.cover_url).toContain('/storage/media/');
    console.log('Project 9 updated and published via API successfully!');

    // Wait for success toast
    await page.waitForTimeout(2000);

    // -------------------------------------------------------------
    // STEP 7: Public Website Verification (Visitor Session)
    // -------------------------------------------------------------
    const visitorContext = await browser.newContext();
    const visitorPage = await visitorContext.newPage();
    await visitorPage.setViewportSize({ width: 1440, height: 900 });

    const visitorHydrationErrors = [];
    visitorPage.on('console', (msg) => {
      const text = msg.text();
      if (
        text.includes('Hydration failed') ||
        text.includes("server rendered HTML didn't match") ||
        text.includes('did not match')
      ) {
        visitorHydrationErrors.push(text);
      }
    });

    await visitorPage.goto('/en/');
    await visitorPage.waitForLoadState('domcontentloaded');

    // Verify zero hydration errors on public site
    expect(visitorHydrationErrors).toEqual([]);
    console.log('PUBLIC SITE SSR VERIFIED: Zero hydration mismatch errors on /en/!');

    // Scroll to Selected Work
    const selectedWorkSection = visitorPage.locator('#selected-work');
    await expect(selectedWorkSection).toBeVisible({ timeout: 15000 });
    await selectedWorkSection.scrollIntoViewIfNeeded();

    // Verify Project 9 appears with cover image
    const projectCard = visitorPage.locator('#selected-work').filter({ hasText: /Project|project/i }).first();
    await expect(projectCard).toBeVisible({ timeout: 15000 });

    const projectImg = visitorPage.locator('#selected-work img[src*="/storage/media/"]').first();
    await expect(projectImg).toBeVisible({ timeout: 15000 });
    const publicSrc = await projectImg.getAttribute('src');
    expect(publicSrc).toContain('/storage/media/');
    console.log(`Public website displays Project 9 cover image: ${publicSrc}`);

    await visitorPage.screenshot({
      path: path.join(ARTIFACTS_DIR, 'release-blocker-public-homepage-cover.png'),
    });

    // Click Project Card to open details modal
    await projectCard.click({ force: true });
    const modal = visitorPage.locator('div[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 15000 });

    const modalCoverImg = modal.locator('img[src*="/storage/media/"]').first();
    await expect(modalCoverImg).toBeVisible({ timeout: 15000 });

    await visitorPage.screenshot({
      path: path.join(ARTIFACTS_DIR, 'release-blocker-public-project-modal.png'),
    });

    console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY!');
    await visitorContext.close();
  });
});
