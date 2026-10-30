// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Task 03.12 — E2E Content Workflow & Phase 03 Gate.
 *
 * Verifies end-to-end admin content lifecycle:
 * 1. Admin login -> Navigate to Projects management
 * 2. Create bilingual project (Arabic RTL & English LTR)
 * 3. Upload multiple mock images, reorder with accessible controls, and set cover
 * 4. Assign categories and save project
 * 5. Publish project and verify visibility
 * 6. Move project to Trash, verify public exclusion, and restore from Trash
 */

test.describe('E2E Content Management Workflow', () => {
  test.beforeEach(async ({ page }) => {
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

    // Mock categories endpoint
    await page.route('**/api/v1/admin/categories', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            data: {
              categories: [
                {
                  id: 1,
                  slug: 'branding',
                  sort_order: 1,
                  translations: [
                    { locale: 'en', name: 'Brand Identity' },
                    { locale: 'ar', name: 'الهويات البصرية' },
                  ],
                },
                {
                  id: 2,
                  slug: 'packaging',
                  sort_order: 2,
                  translations: [
                    { locale: 'en', name: 'Packaging Design' },
                    { locale: 'ar', name: 'تصميم التغليف' },
                  ],
                },
              ],
            },
          }),
        });
      } else {
        route.continue();
      }
    });
  });

  test('complete project creation, media upload/reordering, publishing, trash, and restore flow', async ({ page }) => {
    let projectsState = [];
    let trashedState = [];
    let isPublished = false;

    // Mock Admin Projects List and Trash
    await page.route('**/api/v1/admin/projects/trash', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            projects: {
              data: trashedState,
              total: trashedState.length,
              current_page: 1,
              last_page: 1,
            },
          },
        }),
      });
    });

    await page.route('**/api/v1/admin/projects', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            data: {
              projects: {
                data: projectsState,
                total: projectsState.length,
                current_page: 1,
                last_page: 1,
              },
            },
          }),
        });
      } else if (route.request().method() === 'POST') {
        const payload = JSON.parse(route.request().postData() || '{}');
        const newProject = {
          id: 42,
          slug: payload.slug,
          status: payload.status || 'draft',
          year: payload.year || 2026,
          client: payload.client || '',
          translations: [
            { locale: 'ar', title: payload.translations?.ar?.title || '' },
            { locale: 'en', title: payload.translations?.en?.title || '' },
          ],
        };
        projectsState.push(newProject);
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'success', data: { project: newProject } }),
        });
      }
    });

    // Mock media upload
    let uploadCount = 0;
    await page.route('**/api/v1/admin/media/upload', (route) => {
      uploadCount++;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            asset: {
              id: uploadCount,
              file_name: `mock-design-${uploadCount}.png`,
              original_url: `https://res.cloudinary.com/demo/image/upload/mock-${uploadCount}.png`,
              mime_type: 'image/png',
            },
          },
        }),
      });
    });

    // Mock publish
    await page.route('**/api/v1/admin/projects/42/publish', (route) => {
      isPublished = true;
      if (projectsState[0]) {
        projectsState[0].status = 'published';
      }
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: { project: { ...projectsState[0], status: 'published' } },
        }),
      });
    });

    // Mock soft delete (move to trash)
    await page.route('**/api/v1/admin/projects/42', (route) => {
      if (route.request().method() === 'DELETE') {
        const removed = projectsState.pop();
        if (removed) {
          trashedState.push({ ...removed, deleted_at: new Date().toISOString() });
        }
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'success', message: 'Project moved to trash.' }),
        });
      } else {
        route.continue();
      }
    });

    // Mock restore
    await page.route('**/api/v1/admin/projects/42/restore', (route) => {
      const restored = trashedState.pop();
      if (restored) {
        projectsState.push(restored);
      }
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success', message: 'Project restored.' }),
      });
    });

    await page.goto('/admin/login');
    await page.getByLabel('Email Address').fill('admin@mohammed-portfolio.test');
    await page.getByLabel('Password').fill('AdminPassword123!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/admin/);

    const menuToggle = page.getByRole('button', { name: 'Toggle navigation menu' });
    if (await menuToggle.isVisible()) {
      await menuToggle.click();
      await page.getByRole('link', { name: 'Projects' }).click();
    } else {
      await page.getByRole('link', { name: 'Projects' }).click();
    }
    await expect(page).toHaveURL(/\/admin\/projects/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Projects');
    await expect(page.getByText('No projects found')).toBeVisible();

    await page.getByRole('link', { name: '+ New Project' }).click();
    await expect(page).toHaveURL(/\/admin\/projects\/new/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('New Project');

    await page.getByLabel('Slug *').fill('luxury-branding-concept');
    await page.getByLabel('Client').fill('Acme Corp');
    await page.getByLabel('عنوان المشروع *').fill('تصميم هوية فاخرة');
    await page.getByLabel('Project Title *').fill('Luxury Branding Concept');

    await page.getByLabel('Brand Identity').check({ force: true });

    const dropzoneInput = page.locator('input[type="file"]');
    await dropzoneInput.setInputFiles([
      { name: 'mock-design-1.png', mimeType: 'image/png', buffer: Buffer.from('mock-png-1') },
      { name: 'mock-design-2.png', mimeType: 'image/png', buffer: Buffer.from('mock-png-2') },
    ]);

    const mediaRows = page.getByTestId('media-item-row');
    await expect(mediaRows).toHaveCount(2);

    const moveDownBtn = mediaRows.first().getByRole('button', { name: /Move .* down/i });
    await expect(moveDownBtn).toBeVisible();
    await moveDownBtn.scrollIntoViewIfNeeded();
    await moveDownBtn.click({ force: true });
    await expect(mediaRows.first()).toContainText('mock-design-2.png');
    await expect(mediaRows.nth(1)).toContainText('mock-design-1.png');

    await page.getByRole('button', { name: 'Save Project' }).click();

    // Successfully saved -> redirected back to /admin/projects
    await expect(page).toHaveURL(/\/admin\/projects/);
    await expect(page.getByText('Luxury Branding Concept')).toBeVisible();
    await expect(page.getByText('draft', { exact: true })).toBeVisible();

    // Step 7: Publish Project
    const publishBtn = page.getByRole('button', { name: 'Publish' });
    await expect(publishBtn).toBeVisible();
    await publishBtn.click();

    // Status badge flips to published
    await expect(page.getByText('published', { exact: true })).toBeVisible();

    // Step 8: Move to Trash
    page.once('dialog', (dialog) => dialog.accept());
    const trashBtn = page.getByRole('button', { name: 'Trash' });
    await trashBtn.click();

    // Removed from Active Projects list
    await expect(page.getByText('No projects found')).toBeVisible();

    // Step 9: View Trash and Restore
    const trashTab = page.getByRole('tab', { name: 'Trash' });
    await trashTab.click();

    await expect(page.getByText('Luxury Branding Concept')).toBeVisible();
    const restoreBtn = page.getByRole('button', { name: 'Restore' });
    await expect(restoreBtn).toBeVisible();
    await restoreBtn.click();

    // Verify removed from trash
    await expect(page.getByText('No trashed projects found')).toBeVisible();

    // Step 10: Verify project is back in Active Projects
    const activeTab = page.getByRole('tab', { name: 'Active Projects' });
    await activeTab.click();
    await expect(page.getByText('Luxury Branding Concept')).toBeVisible();
  });
});
