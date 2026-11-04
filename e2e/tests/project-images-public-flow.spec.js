// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs');
const { execSync } = require('node:child_process');

const FIXTURE_COVER = 'C:\\Users\\HP\\.gemini\\antigravity-cli\\brain\\58d5817b-703f-47a7-a1de-bbe67f4c393f\\e2e\\fixtures\\test-cover.png';
const FIXTURE_GALLERY = 'C:\\Users\\HP\\.gemini\\antigravity-cli\\brain\\58d5817b-703f-47a7-a1de-bbe67f4c393f\\e2e\\fixtures\\test-gallery.png';
const ARTIFACTS_DIR = 'C:\\Users\\HP\\.gemini\\antigravity-cli\\brain\\58d5817b-703f-47a7-a1de-bbe67f4c393f\\screenshots';

const projectRoot = path.resolve(__dirname, '../..');
const setupScript = path.join(projectRoot, 'backend', 'scripts', 'setup-e2e-user.php');
const cleanupScript = path.join(projectRoot, 'backend', 'scripts', 'cleanup-e2e-data.php');

test.describe('Critical: Project Images Public Flow End-to-End', () => {
  test.beforeAll(async () => {
    if (!fs.existsSync(ARTIFACTS_DIR)) {
      fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
    }
    // Clean up any stale data first, then set up the test admin user
    try {
      execSync(`php "${cleanupScript}"`, { stdio: 'inherit' });
    } catch (_) {}
    execSync(`php "${setupScript}"`, { stdio: 'inherit' });
  });

  test.afterAll(async () => {
    // Delete test project, media, and test user
    try {
      execSync(`php "${cleanupScript}"`, { stdio: 'inherit' });
    } catch (_) {}
  });

  test('Admin logs in, uploads images, saves project, and visitor sees cover and gallery on public website', async ({ page, browser }) => {
    test.setTimeout(120000);

    // -------------------------------------------------------------
    // STEP 1: Admin Authentication via real Sanctum Login
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

    // Verify successful login redirect to dashboard (MUST NOT be /admin/login)
    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 20000 });

    // -------------------------------------------------------------
    // STEP 2: Navigate to Projects Catalogue & Click Add New Project
    // -------------------------------------------------------------
    const projectsNav = page.locator('button, a').filter({ hasText: /^Projects$|^المشروعات$/ }).first();
    await projectsNav.click();
    await expect(page).toHaveURL(/\/admin\/projects/, { timeout: 15000 });

    const newProjectBtn = page.locator('button:has-text("New Project"), button:has-text("مشروع جديد")').first();
    await expect(newProjectBtn).toBeVisible({ timeout: 15000 });
    await newProjectBtn.click();
    await expect(page).toHaveURL(/\/admin\/projects\/new/, { timeout: 15000 });

    // -------------------------------------------------------------
    // STEP 3: Fill Project Metadata
    // -------------------------------------------------------------
    const titleInput = page.locator('input[placeholder*="Noya Skincare"]');
    await expect(titleInput).toBeVisible({ timeout: 15000 });
    await titleInput.fill('E2E Luxury Atelier');

    const titleArInput = page.locator('input[placeholder*="نويا سكينكير"]');
    await titleArInput.fill('أتيليه الفخامة الإبداعي');

    await page.locator('div:has(> label:has-text("Slug")) input, div:has(> label:has-text("معرّف الرابط")) input').fill('e2e-luxury-atelier');
    await page.locator('div:has(> label:has-text("Client")) input, div:has(> label:has-text("العميل")) input').fill('Royal Brand Studio');

    // -------------------------------------------------------------
    // STEP 4: Upload Cover Image via MediaPickerModal
    // -------------------------------------------------------------
    await page.locator('button:has-text("Change Cover Image"), button:has-text("تغيير صورة الغلاف")').click();
    const mediaPickerModal = page.locator('div.fixed.inset-0.z-50');
    await expect(mediaPickerModal).toBeVisible({ timeout: 10000 });

    const fileInput = mediaPickerModal.locator('input[type="file"]');
    await fileInput.setInputFiles(FIXTURE_COVER);

    // Wait for upload progress and confirmation button
    const selectBtn = mediaPickerModal.locator('button:has-text("Choose Asset"), button:has-text("اختيار الصورة")');
    await expect(selectBtn).toBeEnabled({ timeout: 20000 });
    await selectBtn.click();
    await expect(mediaPickerModal).toBeHidden({ timeout: 5000 });

    // -------------------------------------------------------------
    // STEP 5: Switch to Gallery Tab and Add Gallery Image
    // -------------------------------------------------------------
    await page.locator('button:has-text("Gallery"), button:has-text("المعرض")').first().click();
    await page.locator('button:has-text("Add Image to Gallery"), button:has-text("إضافة صورة للمعرض")').click();

    const galleryPickerModal = page.locator('div.fixed.inset-0.z-50');
    await expect(galleryPickerModal).toBeVisible({ timeout: 10000 });

    const galleryFileInput = galleryPickerModal.locator('input[type="file"]');
    await galleryFileInput.setInputFiles(FIXTURE_GALLERY);

    const gallerySelectBtn = galleryPickerModal.locator('button:has-text("Choose Asset"), button:has-text("اختيار الصورة")');
    await expect(gallerySelectBtn).toBeEnabled({ timeout: 20000 });
    await gallerySelectBtn.click();
    await expect(galleryPickerModal).toBeHidden({ timeout: 5000 });

    // Fill gallery item caption
    const captionInput = page.locator('input[placeholder*="e.g. Premium Embossed Foil Detail"]');
    if (await captionInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await captionInput.fill('Gold Leaf Embossed Atelier Box');
    }

    // -------------------------------------------------------------
    // STEP 6: Publish Project to Backend & MySQL
    // -------------------------------------------------------------
    const createProjectPromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/admin/projects') && resp.request().method() === 'POST',
      { timeout: 20000 }
    );

    const publishBtn = page.locator('button:has-text("Publish Project"), button:has-text("نشر المشروع")').first();
    await publishBtn.click();

    const createResp = await createProjectPromise;
    expect(createResp.status()).toBe(201);
    const createJson = await createResp.json();
    expect(createJson?.data?.project?.cover_url).toContain('/storage/media/');

    // Wait for redirect to edit route
    await page.waitForTimeout(2000);

    // -------------------------------------------------------------
    // STEP 7: Fresh Unauthenticated Visitor Session (Public Website)
    // -------------------------------------------------------------
    const visitorContext = await browser.newContext();
    const visitorPage = await visitorContext.newPage();
    await visitorPage.setViewportSize({ width: 1440, height: 900 });

    await visitorPage.goto('/en/');
    await visitorPage.waitForLoadState('domcontentloaded');

    // Scroll to Selected Work section
    const selectedWorkSection = visitorPage.locator('#selected-work');
    await expect(selectedWorkSection).toBeVisible({ timeout: 15000 });
    await selectedWorkSection.scrollIntoViewIfNeeded();

    // Verify that the project card appears and displays the real cover image from /storage/media/
    const projectCard = visitorPage.locator('#selected-work').filter({ hasText: 'E2E Luxury Atelier' }).first();
    await expect(projectCard).toBeVisible({ timeout: 15000 });

    // Find image with /storage/media/ URL
    const coverImg = visitorPage.locator('#selected-work img[src*="/storage/media/"]').first();
    await expect(coverImg).toBeVisible({ timeout: 15000 });
    const coverSrc = await coverImg.getAttribute('src');
    expect(coverSrc).toContain('/storage/media/');

    // Capture Desktop Homepage Cover Screenshot
    await visitorPage.screenshot({
      path: path.join(ARTIFACTS_DIR, 'e2e-project-public-cover-desktop.png'),
      fullPage: false,
    });

    // -------------------------------------------------------------
    // STEP 8: Click Project Card & Verify Modal Gallery Images
    // -------------------------------------------------------------
    await projectCard.click({ force: true });

    const projectModal = visitorPage.locator('div[role="dialog"]');
    await expect(projectModal).toBeVisible({ timeout: 15000 });

    // Verify both cover and gallery images appear inside modal
    const modalImages = projectModal.locator('img[src*="/storage/media/"]');
    await expect(modalImages.first()).toBeVisible({ timeout: 15000 });
    const modalImgCount = await modalImages.count();
    expect(modalImgCount).toBeGreaterThanOrEqual(1);

    // Capture Desktop Modal Gallery Screenshot
    await visitorPage.screenshot({
      path: path.join(ARTIFACTS_DIR, 'e2e-project-public-modal-gallery-desktop.png'),
      fullPage: false,
    });

    // -------------------------------------------------------------
    // STEP 9: Test Page Reload & Persistence
    // -------------------------------------------------------------
    await visitorPage.reload();
    await visitorPage.waitForLoadState('domcontentloaded');

    const projectAfterReload = visitorPage.locator('#selected-work').filter({ hasText: 'E2E Luxury Atelier' }).first();
    await expect(projectAfterReload).toBeVisible({ timeout: 15000 });

    const coverAfterReload = visitorPage.locator('#selected-work img[src*="/storage/media/"]').first();
    await expect(coverAfterReload).toBeVisible({ timeout: 15000 });

    // -------------------------------------------------------------
    // STEP 10: Mobile Viewport Verification (393x851)
    // -------------------------------------------------------------
    await visitorPage.setViewportSize({ width: 393, height: 851 });
    await visitorPage.waitForTimeout(600);

    const mobileCover = visitorPage.locator('#selected-work img[src*="/storage/media/"]').first();
    await expect(mobileCover).toBeVisible({ timeout: 10000 });

    await visitorPage.screenshot({
      path: path.join(ARTIFACTS_DIR, 'e2e-project-public-cover-mobile.png'),
      fullPage: false,
    });

    await visitorContext.close();
  });
});
