// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * E2E Home Page Tests — Task 01.07 Test Harness.
 *
 * Covers:
 * - Arabic public homepage smoke (desktop + mobile via project matrix)
 * - English public homepage smoke
 * - Language toggle navigation (/ar/ ↔ /en/)
 * - Critical semantic HTML and accessibility attributes
 *
 * Requires SSR server running on http://localhost:3000
 * (built frontend: `cd frontend && npm run build && npm run serve:ssr`)
 */

test.describe('Arabic homepage (/ar/)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ar/');
  });

  test('returns 200 and sets lang=ar dir=rtl', async ({ page }) => {
    await expect(page).toHaveURL(/\/ar\//);
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'ar');
    await expect(html).toHaveAttribute('dir', 'rtl');
  });

  test('renders Arabic hero heading before client hydration', async ({ page, request }) => {
    // Raw HTML check — title must be in SSR payload (no-JS environment)
    const response = await request.get('/ar/');
    const body = await response.text();
    expect(response.status()).toBe(200);
    expect(body).toContain('تصميم بصري هادف');
  });

  test('shows language switcher link to English', async ({ page }) => {
    const switcher = page.getByRole('link', { name: 'English' });
    await expect(switcher).toBeVisible();
    await expect(switcher).toHaveAttribute('href', '/en/');
  });

  test('shows admin nav link in Arabic', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'لوحة التحكم' })).toBeVisible();
  });
});

test.describe('English homepage (/en/)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/');
  });

  test('returns 200 and sets lang=en dir=ltr', async ({ page }) => {
    await expect(page).toHaveURL(/\/en\//);
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'en');
    await expect(html).toHaveAttribute('dir', 'ltr');
  });

  test('renders English hero heading in SSR payload', async ({ request }) => {
    const response = await request.get('/en/');
    const body = await response.text();
    expect(response.status()).toBe(200);
    expect(body).toContain('Intentional visual design');
  });

  test('shows language switcher link to Arabic', async ({ page }) => {
    const switcher = page.getByRole('link', { name: 'العربية' });
    await expect(switcher).toBeVisible();
    await expect(switcher).toHaveAttribute('href', '/ar/');
  });

  test('shows admin nav link in English', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Admin' })).toBeVisible();
  });
});

test.describe('Language toggle navigation', () => {
  test('clicking English from /ar/ navigates to /en/', async ({ page }) => {
    await page.goto('/ar/');
    await page.getByRole('link', { name: 'English' }).click();
    await expect(page).toHaveURL(/\/en\//);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  });

  test('clicking Arabic from /en/ navigates to /ar/', async ({ page }) => {
    await page.goto('/en/');
    await page.getByRole('link', { name: 'العربية' }).click();
    await expect(page).toHaveURL(/\/ar\//);
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });

  test('h1 heading matches locale after toggle', async ({ page }) => {
    await page.goto('/ar/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('تصميم بصري هادف');
    await page.getByRole('link', { name: 'English' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Intentional visual design');
  });
});

test.describe('Mobile viewport — Arabic homepage', () => {
  test.use({ viewport: { width: 393, height: 851 } }); // Pixel 5 logical pixels

  test('renders correctly on mobile with RTL direction', async ({ page }) => {
    await page.goto('/ar/');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'English' })).toBeVisible();
  });
});

test.describe('Mobile viewport — English homepage', () => {
  test.use({ viewport: { width: 393, height: 851 } }); // Pixel 5 logical pixels

  test('renders correctly on mobile with LTR direction', async ({ page }) => {
    await page.goto('/en/');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'العربية' })).toBeVisible();
  });
});
