// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Task 05.12 — Page Builder E2E Workflow & Phase 05 Gate.
 *
 * Master plan flow:
 * Edit hero -> add gallery -> reorder -> preview -> publish -> SSR public updated -> draft edit does not change public.
 */

test.describe('E2E Page Builder & Publishing Lifecycle', () => {
  // In-memory test state representing server database
  let publishedVersion = {
    id: 10,
    version_number: 1,
    status: 'published',
    blocks: [
      {
        id: 'hero-block-1',
        type: 'hero',
        version: '1.0',
        data: {
          title: 'محمد ماهر - مصمم جرافيك وهويات بصرية',
          subtitle: 'تصميم تجارب بصرية استثنائية',
          cta_text: 'تصفح الأعمال',
          cta_url: '/ar/work',
        },
      },
    ],
  };

  let activeDraft = {
    id: 11,
    version_number: 2,
    status: 'draft',
    blocks: JSON.parse(JSON.stringify(publishedVersion.blocks)),
  };

  let lockVersion = 1;

  test.beforeEach(async ({ page }) => {
    // Reset state before each test
    lockVersion = 1;
    publishedVersion = {
      id: 10,
      version_number: 1,
      status: 'published',
      blocks: [
        {
          id: 'hero-block-1',
          type: 'hero',
          version: '1.0',
          data: {
            title: 'محمد ماهر - مصمم جرافيك وهويات بصرية',
            subtitle: 'تصميم تجارب بصرية استثنائية',
            cta_text: 'تصفح الأعمال',
            cta_url: '/ar/work',
          },
        },
      ],
    };
    activeDraft = {
      id: 11,
      version_number: 2,
      status: 'draft',
      blocks: JSON.parse(JSON.stringify(publishedVersion.blocks)),
    };

    // Authenticated admin session mocks
    await page.route('**/api/v1/auth/login', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          message: 'Successfully authenticated.',
          data: {
            user: {
              id: 1,
              name: 'Mohammed Maher',
              email: 'admin@mohammed-portfolio.test',
              is_admin: true,
            },
          },
        }),
      });
    });

    await page.route('**/api/v1/auth/me', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            user: {
              id: 1,
              name: 'Mohammed Maher',
              email: 'admin@mohammed-portfolio.test',
              is_admin: true,
            },
          },
        }),
      });
    });

    // Mock GET /api/v1/admin/pages/home/draft
    await page.route('**/api/v1/admin/pages/home/draft', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            page: {
              id: 1,
              slug: 'home',
              title_ar: 'الصفحة الرئيسية',
              title_en: 'Home Page',
              lock_version: lockVersion,
              published_version_id: publishedVersion.id,
              current_draft_version_id: activeDraft.id,
            },
            draft_version: activeDraft,
            blocks: activeDraft.blocks,
          }),
        });
      } else if (route.request().method() === 'POST') {
        const payload = route.request().postDataJSON();
        if (payload.lock_version !== lockVersion) {
          route.fulfill({
            status: 409,
            contentType: 'application/json',
            body: JSON.stringify({
              message: 'Stale update conflict: this page was modified in another session.',
              conflict: true,
              current_lock_version: lockVersion,
            }),
          });
          return;
        }

        lockVersion += 1;
        activeDraft = {
          id: 12,
          version_number: 3,
          status: 'draft',
          blocks: payload.blocks,
        };

        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Draft saved successfully.',
            page: {
              id: 1,
              slug: 'home',
              title_ar: payload.title_ar || 'الصفحة الرئيسية',
              title_en: payload.title_en || 'Home Page',
              lock_version: lockVersion,
            },
            draft_version: activeDraft,
          }),
        });
      }
    });

    // Mock POST /api/v1/admin/pages/home/preview-url
    await page.route('**/api/v1/admin/pages/home/preview-url', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          preview_url: 'http://localhost:3000/api/v1/pages/home/preview?signature=a8f9c10d&expires=1793444000',
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        }),
      });
    });

    // Mock POST /api/v1/admin/pages/home/publish
    await page.route('**/api/v1/admin/pages/home/publish', (route) => {
      // Atomic publish promotes activeDraft to publishedVersion
      publishedVersion = {
        id: 13,
        version_number: activeDraft.version_number,
        status: 'published',
        blocks: JSON.parse(JSON.stringify(activeDraft.blocks)),
      };

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Page published successfully.',
          page: {
            id: 1,
            slug: 'home',
            title_ar: 'الصفحة الرئيسية',
            title_en: 'Home Page',
            lock_version: lockVersion,
            published_version_id: publishedVersion.id,
          },
          published_version: publishedVersion,
        }),
      });
    });

    // Mock GET /api/v1/pages/home (Public Endpoint serving only publishedVersion)
    await page.route('**/api/v1/pages/home', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          page: {
            slug: 'home',
            title_ar: 'الصفحة الرئيسية',
            title_en: 'Home Page',
            published_at: new Date().toISOString(),
          },
          blocks: publishedVersion.blocks,
        }),
      });
    });
  });

  test('full builder lifecycle: edit hero -> add gallery -> reorder -> preview -> publish -> snapshot isolation', async ({
    page,
  }) => {
    // 1. Authenticate as Admin
    await page.goto('/admin/login');
    await page.getByLabel('Email Address').fill('admin@mohammed-portfolio.test');
    await page.getByLabel('Password').fill('AdminPassword123!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/admin/);

    // 2. Navigate to Page Builder via Admin Navigation
    const menuToggle = page.getByRole('button', { name: 'Toggle navigation menu' });
    if (await menuToggle.isVisible()) {
      await menuToggle.click();
      await page.getByRole('link', { name: 'Page Builder' }).click();
    } else {
      await page.getByRole('link', { name: 'Page Builder' }).click();
    }
    await expect(page).toHaveURL(/\/admin\/pages/);
    await expect(page.locator('.builder-admin-topbar')).toBeVisible();
    await expect(page.getByText('home')).toBeVisible();

    // Verify initial Hero block in outline
    const outlineBlocks = page.locator('[data-testid="canvas-block-item"]');
    await expect(outlineBlocks).toHaveCount(1);
    await expect(outlineBlocks.first()).toContainText('قسم الواجهة الرئيسية');

    // 3. Responsive Device Previews
    const tabletBtn = page.getByTestId('viewport-btn-tablet');
    const mobileBtn = page.getByTestId('viewport-btn-mobile');
    const desktopBtn = page.getByTestId('viewport-btn-desktop');

    await expect(desktopBtn).toBeVisible();
    await tabletBtn.click();
    await expect(page.locator('.device-preview-viewport')).toHaveCSS('max-width', '768px');

    await mobileBtn.click();
    await expect(page.locator('.device-preview-viewport')).toHaveCSS('max-width', '390px');

    await desktopBtn.click();
    await expect(page.locator('.device-preview-viewport')).toHaveCSS('max-width', '100%');

    // 4. Edit Hero Block Title in Inspector
    await outlineBlocks.first().click();
    const titleInput = page.locator('#field-title');
    await expect(titleInput).toBeVisible();
    await titleInput.fill('محمد ماهر - استوديو الهوية البصرية والتصميم');

    // Verify outline reflects updated title immediately
    await expect(outlineBlocks.first()).toContainText('استوديو الهوية البصرية والتصميم');

    // 5. Add Block from Library (Gallery)
    const addBlockBtn = page.getByRole('button', { name: /إضافة كتلة/i });
    await addBlockBtn.click();

    // Verify library modal opened
    const libraryModal = page.locator('.block-library-dialog');
    await expect(libraryModal).toBeVisible();

    // Select Gallery block
    const addGalleryBtn = page.locator('[data-testid="add-block-gallery"]');
    await expect(addGalleryBtn).toBeVisible();
    await addGalleryBtn.click();

    // Verify block added to outline (now 2 blocks: Hero, Gallery)
    await expect(outlineBlocks).toHaveCount(2);
    await expect(outlineBlocks.nth(1)).toContainText('معرض صور');

    // 6. Accessible Block Reordering (Move Gallery Up)
    const galleryBlock = outlineBlocks.nth(1);
    const moveUpBtn = galleryBlock.getByRole('button', { name: /تحريك الكتلة للأعلى/i });
    await moveUpBtn.click();

    // Gallery is now first block (index 0), Hero is second (index 1)
    await expect(outlineBlocks.first()).toContainText('معرض صور');
    await expect(outlineBlocks.nth(1)).toContainText('استوديو الهوية البصرية والتصميم');

    // 7. Save Draft
    const saveDraftBtn = page.getByRole('button', { name: /حفظ المسودة/i });
    await saveDraftBtn.click();

    // Verify save notification
    await expect(page.locator('.save-feedback-banner')).toBeVisible();

    // 8. Secure Preview Modal
    const previewModalBtn = page.getByRole('button', { name: /مشاركة رابط معاينة آمن/i });
    await previewModalBtn.click();

    const previewDialog = page.locator('.secure-preview-dialog');
    await expect(previewDialog).toBeVisible();
    await expect(previewDialog).toContainText('رابط المعاينة الآمنة للمسودة');
    await expect(previewDialog).toContainText('30 دقيقة');
    await expect(previewDialog).toContainText('noindex, nofollow');

    // Verify signed preview URL input contains signature parameter
    const previewUrlInput = previewDialog.locator('input[readonly]');
    await expect(previewUrlInput).toHaveValue(/signature=a8f9c10d/);

    // Close preview dialog
    const closeDialogBtn = previewDialog.getByRole('button', { name: /إلغاء/i });
    await closeDialogBtn.click();
    await expect(previewDialog).toBeHidden();

    // 9. Public Isolation Check Before Publish
    // The public endpoint must still have the initial version 1 (Hero only), NOT Gallery!
    const jsonBeforePublish = await page.evaluate(async () => {
      const res = await fetch('/api/v1/pages/home');
      return res.json();
    });
    expect(jsonBeforePublish.blocks).toHaveLength(1);
    expect(jsonBeforePublish.blocks[0].type).toBe('hero');

    // 10. Atomic Publish
    const publishBtn = page.getByRole('button', { name: /نشر الصفحة/i });
    await publishBtn.click();

    // Verify success banner appears
    const publishSuccessBanner = page.locator('.publish-status-banner');
    await expect(publishSuccessBanner).toBeVisible();
    await expect(publishSuccessBanner).toContainText('تم نشر الصفحة بنجاح');

    // 11. Public Endpoint Updated After Publish
    const jsonAfterPublish = await page.evaluate(async () => {
      const res = await fetch('/api/v1/pages/home');
      return res.json();
    });
    expect(jsonAfterPublish.blocks).toHaveLength(2);
    expect(jsonAfterPublish.blocks[0].type).toBe('gallery');
    expect(jsonAfterPublish.blocks[1].type).toBe('hero');
    expect(jsonAfterPublish.blocks[1].data.title).toBe('محمد ماهر - استوديو الهوية البصرية والتصميم');

    // 12. Draft Edit Does NOT Change Public (Published Snapshot Isolation)
    // Make another draft edit: delete the gallery block
    const updatedGalleryBlock = outlineBlocks.first();
    const deleteBtn = updatedGalleryBlock.getByRole('button', { name: /حذف الكتلة/i });
    await deleteBtn.click();

    // Now outline has only 1 block again in editor draft
    await expect(outlineBlocks).toHaveCount(1);

    // Save draft again
    await saveDraftBtn.click();
    await expect(page.locator('.save-feedback-banner')).toBeVisible();

    // Public endpoint MUST STILL return 2 blocks (published snapshot isolation)
    const jsonAfterDraftEdit = await page.evaluate(async () => {
      const res = await fetch('/api/v1/pages/home');
      return res.json();
    });
    expect(jsonAfterDraftEdit.blocks).toHaveLength(2);
    expect(jsonAfterDraftEdit.blocks[0].type).toBe('gallery');
    expect(jsonAfterDraftEdit.blocks[1].type).toBe('hero');
  });
});
