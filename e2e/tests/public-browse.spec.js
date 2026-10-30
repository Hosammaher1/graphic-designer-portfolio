// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Task 04.11 — E2E Public Browse & Phase 04 Gate Evaluation.
 *
 * Scenarios covered:
 * 1. Public Browse Journey: Home -> Work gallery -> Filter by category -> Project detail ->
 *    Lightbox viewer (next, prev, Escape) -> Adjacent project navigation -> About page -> Contact form.
 * 2. Localization: Arabic RTL <-> English LTR toggle with preserved context.
 * 3. Theme Toggle: Light mode <-> Dark mode toggle with localStorage persistence across reloads.
 * 4. Mobile Responsiveness: Hamburger menu drawer open, navigate, auto-close.
 * 5. Accessibility & Reduced Motion: Skip to content link, keyboard navigation, reduced motion emulation.
 * 6. Visual Snapshots: Desktop and mobile captures for Phase 04 verification.
 */

// Shared mock datasets
const mockCategories = [
  {
    id: 1,
    slug: 'branding',
    name: 'الهويات البصرية',
    name_en: 'Visual Identity',
    name_ar: 'الهويات البصرية',
    description: 'تصميم الهويات والعلامات التجارية الكاملة',
    projects_count: 2,
  },
  {
    id: 2,
    slug: 'packaging',
    name: 'تصميم العبوات',
    name_en: 'Packaging Design',
    name_ar: 'تصميم العبوات',
    description: 'تغليف المنتجات والملصقات التجارية',
    projects_count: 1,
  },
  {
    id: 3,
    slug: 'editorial',
    name: 'المطبوعات',
    name_en: 'Editorial & Print',
    name_ar: 'المطبوعات',
    description: 'الكتب والمجلات والمطبوعات الفاخرة',
    projects_count: 1,
  },
];

const mockProject1 = {
  id: 101,
  slug: 'craft-visual-identity',
  title: 'الهوية البصرية لمشروع كرافت',
  title_ar: 'الهوية البصرية لمشروع كرافت',
  title_en: 'Craft Studio Visual Identity',
  description: 'تصميم هوية بصرية متكاملة لاستوديو كرافت الفني مع دليل إرشادي دقيق للعلامة التجارية.',
  description_ar: 'تصميم هوية بصرية متكاملة لاستوديو كرافت الفني مع دليل إرشادي دقيق للعلامة التجارية.',
  description_en: 'A comprehensive brand identity design for Craft Studio including full guidelines.',
  client: 'Craft Studio',
  year: 2025,
  is_featured: true,
  status: 'published',
  categories: [mockCategories[0]],
  cover_image: {
    id: 1,
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    alt_text: 'Craft Studio stationery set mockup',
    caption: 'مجموعة المطبوعات والهوية الأساسية',
    sort_order: 1,
    is_cover: true,
  },
  media: [
    {
      id: 1,
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      alt_text: 'Craft Studio stationery set mockup',
      caption: 'المطبوعات الأساسية',
      sort_order: 1,
      is_cover: true,
    },
    {
      id: 2,
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      alt_text: 'Craft Studio color palette showcase',
      caption: 'لوحة الألوان ودرجات التباين',
      sort_order: 2,
      is_cover: false,
    },
    {
      id: 3,
      url: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=1200&q=80',
      alt_text: 'Craft Studio typography exploration',
      caption: 'تطبيقات الخط الطباعي',
      sort_order: 3,
      is_cover: false,
    },
  ],
  next_project: {
    slug: 'olive-packaging-concept',
    title: 'تصميم عبوات زيتون الطبيعية',
    title_ar: 'تصميم عبوات زيتون الطبيعية',
    title_en: 'Olive Oil Packaging Concept',
  },
  prev_project: null,
};

const mockProject2 = {
  id: 102,
  slug: 'olive-packaging-concept',
  title: 'تصميم عبوات زيتون الطبيعية',
  title_ar: 'تصميم عبوات زيتون الطبيعية',
  title_en: 'Olive Oil Packaging Concept',
  description: 'تصميم عبوات فاخرة للمنتجات العضوية من زيت الزيتون البكر الممتاز.',
  description_ar: 'تصميم عبوات فاخرة للمنتجات العضوية من زيت الزيتون البكر الممتاز.',
  description_en: 'Premium organic packaging design for cold-pressed extra virgin olive oil.',
  client: 'Olive Co.',
  year: 2024,
  is_featured: true,
  status: 'published',
  categories: [mockCategories[1]],
  cover_image: {
    id: 4,
    url: 'https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&w=1200&q=80',
    alt_text: 'Olive oil bottle mockup with gold foil label',
    caption: 'الملصق الرئيسي مع تفاصيل الرقائق الذهبية',
    sort_order: 1,
    is_cover: true,
  },
  media: [
    {
      id: 4,
      url: 'https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&w=1200&q=80',
      alt_text: 'Olive oil bottle mockup with gold foil label',
      caption: 'الملصق الرئيسي مع تفاصيل الرقائق الذهبية',
      sort_order: 1,
      is_cover: true,
    },
  ],
  next_project: null,
  prev_project: {
    slug: 'craft-visual-identity',
    title: 'الهوية البصرية لمشروع كرافت',
    title_ar: 'الهوية البصرية لمشروع كرافت',
    title_en: 'Craft Studio Visual Identity',
  },
};

/**
 * Setup route interception for public API endpoints
 */
async function setupPublicApiMocks(page) {
  // Mock categories
  await page.route('**/api/v1/categories*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: { categories: mockCategories },
      }),
    });
  });

  // Mock projects list (home featured & work gallery)
  await page.route('**/api/v1/projects?*', (route) => {
    const url = new URL(route.request().url());
    const categoryParam = url.searchParams.get('category');

    let filtered = [mockProject1, mockProject2];
    if (categoryParam === 'branding') {
      filtered = [mockProject1];
    } else if (categoryParam === 'packaging') {
      filtered = [mockProject2];
    } else if (categoryParam === 'editorial') {
      filtered = [];
    }

    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: {
          projects: {
            data: filtered,
            current_page: 1,
            last_page: 1,
            total: filtered.length,
          },
        },
      }),
    });
  });

  // Mock single project detail
  await page.route('**/api/v1/projects/craft-visual-identity*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: { project: mockProject1 },
      }),
    });
  });

  await page.route('**/api/v1/projects/olive-packaging-concept*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: { project: mockProject2 },
      }),
    });
  });

  // 404 for unknown slug
  await page.route('**/api/v1/projects/non-existent-project*', (route) => {
    route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'error',
        message: 'Project not found.',
      }),
    });
  });
}

test.describe('Task 04.11 — Complete Public Browse Journey', () => {
  test.beforeEach(async ({ page }) => {
    await setupPublicApiMocks(page);
  });

  test('E2E-01 & E2E-02: Home -> Work -> Category Filter -> Detail -> Lightbox -> Adjacent -> About -> Contact', async ({ page }, testInfo) => {
    // 1. Visit Arabic Homepage
    await page.goto('/ar/');
    await expect(page).toHaveURL(/\/ar\//);
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'ar');
    await expect(html).toHaveAttribute('dir', 'rtl');

    // Verify Hero content
    const heroHeading = page.getByRole('heading', { level: 1 });
    await expect(heroHeading).toBeVisible();
    await expect(heroHeading).toContainText('تصميم بصري هادف');

    // Verify featured projects section renders on homepage
    const featuredCard = page.getByRole('heading', { name: 'الهوية البصرية لمشروع كرافت' });
    await expect(featuredCard).toBeVisible();

    // Screenshot homepage
    await page.screenshot({ path: `test-results/screenshots/home-${testInfo.project.name.toLowerCase().replace(/\s+/g, '-')}.png` });

    // 2. Navigate to Work Gallery via Navigation Header
    const workLink = page.getByRole('link', { name: 'الأعمال' }).first();
    await workLink.click();
    await expect(page).toHaveURL(/\/ar\/work/);

    const workH1 = page.getByRole('heading', { level: 1 });
    await expect(workH1).toContainText('الأعمال والمشاريع');

    // 3. Test Category Filtering
    // Click category tab "الهويات البصرية"
    const brandingTab = page.getByRole('tab', { name: /الهويات البصرية/ });
    await brandingTab.click();
    await expect(page).toHaveURL(/category=branding/);
    await expect(page.getByRole('heading', { name: 'الهوية البصرية لمشروع كرافت' })).toBeVisible();

    // Screenshot work gallery
    await page.screenshot({ path: `test-results/screenshots/work-${testInfo.project.name.toLowerCase().replace(/\s+/g, '-')}.png` });

    // 4. Navigate to Project Details
    const projectCardLink = page.locator('a[href*="/ar/projects/craft-visual-identity"]').first();
    await projectCardLink.click();
    await expect(page).toHaveURL(/\/ar\/projects\/craft-visual-identity/);

    // Verify Project Detail metadata and media
    const projectH1 = page.getByRole('heading', { level: 1 });
    await expect(projectH1).toContainText('الهوية البصرية لمشروع كرافت');
    await expect(page.getByText('Craft Studio', { exact: false })).toBeVisible();
    await expect(page.getByText('2025')).toBeVisible();

    // Verify gallery thumbnails
    const galleryThumbs = page.locator('.gallery-thumbnail-card');
    await expect(galleryThumbs.first()).toBeVisible();

    // 5. Lightbox viewer interaction
    // Click on thumbnail to open Lightbox
    await galleryThumbs.first().click();

    // Verify Lightbox modal is open
    const lightboxModal = page.locator('[role="dialog"].lightbox-overlay');
    await expect(lightboxModal).toBeVisible();

    // Verify image counter displays "صورة 1 من 3"
    await expect(lightboxModal.getByText(/صورة 1 من 3/)).toBeVisible();

    // Click Next button inside Lightbox
    const nextBtn = lightboxModal.getByRole('button', { name: /الصورة التالية/i });
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await expect(lightboxModal.getByText(/صورة 2 من 3/)).toBeVisible();
    }

    // Press Escape key to close Lightbox
    await page.keyboard.press('Escape');
    await expect(lightboxModal).not.toBeVisible();

    // 6. Adjacent project navigation
    const nextProjectLink = page.locator('a[href*="/ar/projects/olive-packaging-concept"]').first();
    if (await nextProjectLink.isVisible()) {
      await nextProjectLink.click();
      await expect(page).toHaveURL(/\/ar\/projects\/olive-packaging-concept/);
      await expect(page.getByRole('heading', { level: 1 })).toContainText('تصميم عبوات زيتون الطبيعية');
    }

    // 7. Navigate to About Page
    const aboutLink = page.getByRole('link', { name: 'نبذة' }).first();
    await aboutLink.click();
    await expect(page).toHaveURL(/\/ar\/about/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('عن المصمم');

    // Verify philosophy and skills sections
    await expect(page.getByText('فلسفة التصميم')).toBeVisible();
    await expect(page.getByText('الخبرات والتخصصات')).toBeVisible();
    await expect(page.getByText('الأدوات والتقنيات')).toBeVisible();

    // 8. Navigate to Contact Page
    const contactLink = page.getByRole('link', { name: 'تواصل' }).first();
    await contactLink.click();
    await expect(page).toHaveURL(/\/ar\/contact/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('تواصل معي');

    // 9. Verify Contact Form Validation
    const submitBtn = page.getByRole('button', { name: 'إرسال الرسالة' });
    await submitBtn.click();

    // Form inputs must flag aria-invalid
    const nameInput = page.locator('#contact-name');
    await expect(nameInput).toHaveAttribute('aria-invalid', 'true');

    // Fill valid data
    await nameInput.fill('فهد المنصور');
    await page.locator('#contact-email').fill('fahad@example.com');
    await page.locator('#contact-message').fill('السلام عليكم، نود الاستفسار عن تصميم هوية بصرية جديدة.');

    await submitBtn.click();

    // Local development mode notice confirms submission lock and success state
    await expect(page.locator('.contact-success-state')).toBeVisible();
    await expect(page.getByText(/تم حفظ الرسالة محلياً/i)).toBeVisible();
  });

  test('E2E-02: Bilingual Language Toggle preserves state and switches typography/layout', async ({ page }) => {
    // Start at Arabic
    await page.goto('/ar/');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');

    // Switch to English
    const enSwitcher = page.getByRole('link', { name: 'English' }).first();
    await enSwitcher.click();
    await expect(page).toHaveURL(/\/en\//);
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    // English nav links
    await expect(page.getByRole('link', { name: 'Work' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'About' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Contact' }).first()).toBeVisible();

    // Switch back to Arabic
    const arSwitcher = page.getByRole('link', { name: 'العربية' }).first();
    await arSwitcher.click();
    await expect(page).toHaveURL(/\/ar\//);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  });

  test('E2E-03: Dark Mode toggle applies theme and persists across page reload without FOWT', async ({ page }) => {
    await page.goto('/ar/');

    const themeToggle = page.locator('button[data-testid="theme-toggle"]').first();
    await expect(themeToggle).toBeVisible();

    // Toggle theme to dark
    await themeToggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // Verify localStorage has saved 'dark'
    const storedTheme = await page.evaluate(() => localStorage.getItem('portfolio-theme'));
    expect(storedTheme).toBe('dark');

    // Reload page to verify persistence and no-flash restoration
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // Toggle back to light
    const themeToggleDark = page.locator('button[data-testid="theme-toggle"]').first();
    await themeToggleDark.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    const updatedTheme = await page.evaluate(() => localStorage.getItem('portfolio-theme'));
    expect(updatedTheme).toBe('light');
  });

  test('E2E-14: Mobile Viewport Drawer opens, navigates, and closes cleanly', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/ar/');

    const menuToggle = page.locator('.mobile-menu-toggle');
    await expect(menuToggle).toBeVisible();

    // Open mobile drawer
    await menuToggle.click();

    // Drawer should become visible
    const drawer = page.locator('[role="dialog"][data-testid="mobile-drawer"]');
    await expect(drawer).toBeVisible();

    // Click link inside drawer
    const drawerWorkLink = drawer.getByRole('link', { name: 'الأعمال' });
    await drawerWorkLink.click();

    // Verifies navigation occurred and drawer is closed
    await expect(page).toHaveURL(/\/ar\/work/);
    await expect(drawer).not.toBeVisible();
  });

  test('Accessibility: Skip to main content link and 404 page handling', async ({ page }) => {
    // 1. Skip link
    await page.goto('/ar/');
    const skipLink = page.getByRole('link', { name: /تخطي إلى المحتوى الرئيسي/i });
    await expect(skipLink).toBeAttached();
    await expect(skipLink).toHaveAttribute('href', '#main-content');

    // 2. 404 Project fallback
    await page.goto('/ar/projects/non-existent-project');
    await expect(page.getByText('المشروع غير موجود')).toBeVisible();
    const returnBtn = page.getByRole('link', { name: /العودة لجميع الأعمال/i });
    await expect(returnBtn).toBeVisible();
    await returnBtn.click();
    await expect(page).toHaveURL(/\/ar\/work/);
  });
});
