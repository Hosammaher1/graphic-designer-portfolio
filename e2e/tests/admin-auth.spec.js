// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * E2E Authentication & Admin Shell Tests — Task 02.08.
 *
 * Verifies:
 * - Unauthenticated visitor visiting /admin/login sees login form
 * - Failed login shows accessible error banner
 * - Successful login redirects to /admin/ and displays administrator shell
 * - Authenticated admin sees sidebar links and sign out button
 * - Sign out clears session and redirects to /admin/login
 * - Mobile viewport responsive drawer toggle
 */

test.describe('Admin Authentication Flow', () => {
  test('login page renders email and password fields and submit button', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Portfolio Administration');
    await expect(page.getByLabel('Email Address')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('login with incorrect password displays error message without crashing', async ({ page }) => {
    await page.route('**/api/v1/auth/login', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'error', message: 'Invalid credentials.' }),
      });
    });

    await page.goto('/admin/login');
    await page.getByLabel('Email Address').fill('admin@mohammed-portfolio.test');
    await page.getByLabel('Password').fill('IncorrectSecretPass!');
    await page.getByRole('button', { name: 'Sign In' }).click();

    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('Invalid credentials.');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('admin login with correct credentials authenticates and shows admin shell', async ({ page }) => {
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

    await page.goto('/admin/login');
    await page.getByLabel('Email Address').fill('admin@mohammed-portfolio.test');
    await page.getByLabel('Password').fill('CorrectAdminPass123!');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // After login, client navigates to /admin/
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Admin Dashboard');
    await expect(page.getByText('admin@mohammed-portfolio.test', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Projects' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Categories' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Page Builder' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible();
  });

  test('logging out clears session and redirects back to login', async ({ page }) => {
    await page.route('**/api/v1/auth/login', (route) => {
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

    await page.route('**/api/v1/auth/logout', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success', message: 'Successfully logged out.' }),
      });
    });

    // Login first
    await page.goto('/admin/login');
    await page.getByLabel('Email Address').fill('admin@mohammed-portfolio.test');
    await page.getByLabel('Password').fill('CorrectAdminPass123!');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible();

    // Click Sign Out
    await page.getByRole('button', { name: 'Sign Out' }).click();

    // Should redirect to /admin/login
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Portfolio Administration');
  });
});

test.describe('Mobile Viewport — Admin Shell', () => {
  test.use({ viewport: { width: 393, height: 851 } }); // Pixel 5 viewport

  test('renders mobile drawer toggle and expands navigation menu', async ({ page }) => {
    await page.route('**/api/v1/auth/login', (route) => {
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

    // Login first
    await page.goto('/admin/login');
    await page.getByLabel('Email Address').fill('admin@mohammed-portfolio.test');
    await page.getByLabel('Password').fill('CorrectAdminPass123!');
    await page.getByRole('button', { name: 'Sign In' }).click();

    const toggle = page.getByRole('button', { name: 'Toggle navigation menu' });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    // Click toggle to expand
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    // Verify nav links visible in open drawer
    await expect(page.getByRole('link', { name: 'Projects' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  });
});
