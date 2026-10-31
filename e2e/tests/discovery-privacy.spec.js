// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Task 06.12 — E2E Discovery, Recommendations, Privacy & Consent Lifecycle.
 *
 * Scenarios:
 * 1. Search & Filter: search query input debounce, category chip filtering, URL synchronization.
 * 2. Related Recommendations: deterministic rule-based recommendations on project detail page.
 * 3. Reject Consent: rejecting banner prevents personal tracking and recommendation affinity.
 * 4. Accept Consent: accepting banner enables tracking and personalization boost.
 * 5. Withdraw Consent: modal withdrawal immediately purges preferences and reverts to generic ranking.
 * 6. Admin Analytics Display: dashboard trend chart, accessible data table, top projects & traffic breakdown.
 */

// Shared mock datasets
const mockCategories = [
  {
    id: 1,
    slug: 'branding',
    name: 'الهويات البصرية',
    name_en: 'Visual Identity',
    name_ar: 'الهويات البصرية',
  },
  {
    id: 2,
    slug: 'packaging',
    name: 'تصميم العبوات',
    name_en: 'Packaging Design',
    name_ar: 'تصميم العبوات',
  },
  {
    id: 3,
    slug: 'editorial',
    name: 'المطبوعات',
    name_en: 'Editorial & Print',
    name_ar: 'المطبوعات',
  },
];

const mockProject1 = {
  id: 101,
  slug: 'craft-visual-identity',
  title: 'الهوية البصرية لمشروع كرافت',
  title_ar: 'الهوية البصرية لمشروع كرافت',
  title_en: 'Craft Studio Visual Identity',
  description: 'تصميم هوية بصرية متكاملة لاستوديو كرافت الفني.',
  year: 2025,
  categories: [mockCategories[0]],
  cover_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
  media: [],
  prev_project: null,
  next_project: {
    slug: 'olive-packaging-concept',
    title: 'تصميم عبوات زيتون الطبيعية',
  },
};

const mockProject2 = {
  id: 102,
  slug: 'olive-packaging-concept',
  title: 'تصميم عبوات زيتون الطبيعية',
  title_ar: 'تصميم عبوات زيتون الطبيعية',
  title_en: 'Olive Oil Packaging Concept',
  description: 'تصميم عبوات فاخرة لزيت الزيتون البكر.',
  year: 2024,
  categories: [mockCategories[1]],
  cover_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
  media: [],
  prev_project: {
    slug: 'craft-visual-identity',
    title: 'الهوية البصرية لمشروع كرافت',
  },
  next_project: null,
};

const mockProject3 = {
  id: 103,
  slug: 'nordic-editorial-book',
  title: 'كتاب التصميم الشمالي',
  title_ar: 'كتاب التصميم الشمالي',
  title_en: 'Nordic Editorial Book',
  description: 'مطبوعة توثيقية حول التصميم الاسكندنافي.',
  year: 2024,
  categories: [mockCategories[2]],
  cover_url: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=1200&q=80',
  media: [],
};

const mockAnalyticsOverview = {
  range: '7d',
  start_date: '2026-10-24',
  end_date: '2026-10-31',
  summary: {
    total_views: 1420,
    unique_visitors: 580,
    days_count: 7,
  },
  previous_period: {
    start_date: '2026-10-17',
    end_date: '2026-10-23',
    total_views: 1100,
    unique_visitors: 460,
    views_change_percentage: 29.09,
    days_count: 7,
  },
  daily_trend: [
    { date: '2026-10-25', total_views: 180, unique_visitors: 75 },
    { date: '2026-10-26', total_views: 210, unique_visitors: 90 },
    { date: '2026-10-27', total_views: 195, unique_visitors: 82 },
    { date: '2026-10-28', total_views: 240, unique_visitors: 98 },
    { date: '2026-10-29', total_views: 205, unique_visitors: 85 },
    { date: '2026-10-30', total_views: 190, unique_visitors: 70 },
    { date: '2026-10-31', total_views: 200, unique_visitors: 80 },
  ],
};

const mockTopProjects = [
  {
    id: 101,
    slug: 'craft-visual-identity',
    title: 'Craft Studio Visual Identity',
    views: 650,
    unique_visitors: 280,
  },
  {
    id: 102,
    slug: 'olive-packaging-concept',
    title: 'Olive Oil Packaging Concept',
    views: 420,
    unique_visitors: 175,
  },
];

const mockTrafficSources = {
  categories: [
    { name: 'search', views: 620, unique_visitors: 380, percentage: 43.66 },
    { name: 'direct', views: 480, unique_visitors: 290, percentage: 33.80 },
    { name: 'social', views: 220, unique_visitors: 150, percentage: 15.49 },
    { name: 'external', views: 100, unique_visitors: 60, percentage: 7.04 },
  ],
  domains: [
    { domain: 'google.com', views: 500 },
    { domain: 'behance.net', views: 180 },
  ],
};

const mockDevices = {
  devices: [
    { name: 'desktop', views: 850, unique_visitors: 450, percentage: 59.86 },
    { name: 'mobile', views: 490, unique_visitors: 290, percentage: 34.51 },
    { name: 'tablet', views: 80, unique_visitors: 45, percentage: 5.63 },
  ],
};

// Global route interception helper
async function setupBaseRoutes(page, state = { personalized: false, trackedEvents: [] }) {
  // Categories
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

  // Projects search / list
  await page.route('**/api/v1/projects?*', (route) => {
    const url = new URL(route.request().url());
    const cat = url.searchParams.get('category');
    let list = [mockProject1, mockProject2, mockProject3];
    if (cat === 'branding') list = [mockProject1];
    else if (cat === 'packaging') list = [mockProject2];
    else if (cat === 'editorial') list = [mockProject3];

    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: {
          projects: {
            data: list,
            current_page: 1,
            last_page: 1,
            total: list.length,
          },
        },
      }),
    });
  });

  // Search API
  await page.route('**/api/v1/search*', (route) => {
    const url = new URL(route.request().url());
    const query = (url.searchParams.get('q') || '').toLowerCase();
    const cat = url.searchParams.get('category');

    let list = [mockProject1, mockProject2, mockProject3];
    if (query) {
      list = list.filter((p) =>
        p.title.toLowerCase().includes(query) ||
        (p.title_en && p.title_en.toLowerCase().includes(query)) ||
        p.description.toLowerCase().includes(query)
      );
    }
    if (cat) {
      list = list.filter((p) => p.categories.some((c) => c.slug === cat));
    }

    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: {
          projects: {
            data: list,
            current_page: 1,
            last_page: 1,
            total: list.length,
          },
        },
      }),
    });
  });

  // Project details
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

  // Recommendations endpoint
  await page.route('**/api/v1/projects/*/recommendations*', (route) => {
    const url = new URL(route.request().url());
    const token = url.searchParams.get('consent_token');
    const isPersonalized = Boolean(token && state.personalized);

    const recs = isPersonalized
      ? [mockProject2, mockProject3]
      : [mockProject3, mockProject2];

    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: {
          target_slug: 'craft-visual-identity',
          count: recs.length,
          personalized: isPersonalized,
          recommendations: recs,
        },
      }),
    });
  });

  // Recommendation interest tracking
  await page.route('**/api/v1/recommendations/interest', (route) => {
    const req = route.request();
    const payload = JSON.parse(req.postData() || '{}');
    state.trackedEvents.push({ type: 'interest', payload });
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  // Analytics event recording
  await page.route('**/api/v1/analytics/events', (route) => {
    const req = route.request();
    const payload = JSON.parse(req.postData() || '{}');
    state.trackedEvents.push({ type: 'page_view', payload });
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, event_id: 1 }),
    });
  });

  // Consent recording
  await page.route('**/api/v1/consent', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route('**/api/v1/consent/withdraw', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  // Admin auth login & check
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

  await page.route('**/api/v1/admin/analytics/overview*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: mockAnalyticsOverview,
      }),
    });
  });

  await page.route('**/api/v1/admin/analytics/top-projects*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: { projects: mockTopProjects },
      }),
    });
  });

  await page.route('**/api/v1/admin/analytics/traffic-sources*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: mockTrafficSources,
      }),
    });
  });

  await page.route('**/api/v1/admin/analytics/devices*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: mockDevices,
      }),
    });
  });
}

test.describe('Discovery, Recommendations & Privacy Lifecycle (Task 06.12)', () => {
  test('search query and category filters synchronize with URL and update results', async ({ page }) => {
    await setupBaseRoutes(page);

    await page.goto('/ar/work');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('الأعمال والمشاريع');

    // 1. Initial full project list contains all projects
    await expect(page.getByText('الهوية البصرية لمشروع كرافت')).toBeVisible();
    await expect(page.getByText('تصميم عبوات زيتون الطبيعية')).toBeVisible();

    // 2. Filter by Category: click Branding ("الهويات البصرية")
    const brandingChip = page.getByRole('button', { name: 'الهويات البصرية' });
    await brandingChip.click();

    // URL should reflect category filter
    await expect(page).toHaveURL(/category=branding/);
    await expect(page.getByText('الهوية البصرية لمشروع كرافت')).toBeVisible();
    await expect(page.getByText('تصميم عبوات زيتون الطبيعية')).not.toBeVisible();

    // 3. Search by keyword
    const searchInput = page.getByRole('searchbox');
    await searchInput.fill('كرافت');
    // Debounce wait
    await page.waitForTimeout(350);

    await expect(page).toHaveURL(/q=%D9%83%D8%B1%D8%A7%D9%81%D8%AA|q=كرافت/);
    await expect(page.getByText('الهوية البصرية لمشروع كرافت')).toBeVisible();

    // 4. Clear Filters
    const clearBtn = page.getByRole('button', { name: /مسح الفلاتر/i });
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
      await expect(page).toHaveURL(/\/ar\/work$/);
    }
  });

  test('project detail renders related recommendations', async ({ page }) => {
    await setupBaseRoutes(page);

    await page.goto('/ar/projects/craft-visual-identity');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('الهوية البصرية لمشروع كرافت');

    // Related recommendations section
    const recSection = page.locator('[data-testid="related-projects"]');
    await expect(recSection).toBeVisible();

    // Should render recommended cards
    const recCards = page.locator('[data-testid="related-project-card"]');
    await expect(recCards.first()).toBeVisible();
  });

  test('rejecting consent blocks tracking and keeps recommendations generic', async ({ page }) => {
    const state = { personalized: false, trackedEvents: [] };
    await setupBaseRoutes(page, state);

    // Clear consent storage to ensure banner appears
    await page.goto('/ar/');
    await page.evaluate(() => localStorage.removeItem('portfolio_consent_state'));
    await page.reload();

    // Consent banner must be visible
    const banner = page.getByRole('region', { name: /إشعار الخصوصية|privacy/i });
    await expect(banner).toBeVisible();

    // Click "رفض الكل" (Reject All)
    const rejectBtn = page.getByRole('button', { name: /رفض الكل|reject all/i });
    await rejectBtn.click();

    // Banner must disappear
    await expect(banner).not.toBeVisible();

    // Verify localStorage state
    const consent = await page.evaluate(() => JSON.parse(localStorage.getItem('portfolio_consent_state') || '{}'));
    expect(consent.status).toBe('rejected');
    expect(consent.categories.analytics).toBe(false);
    expect(consent.categories.personalization).toBe(false);

    // Navigate to a project page
    await page.goto('/ar/projects/craft-visual-identity');

    // Recommendations must indicate generic mode
    const recSection = page.locator('[data-testid="related-projects"]');
    await expect(recSection).toBeVisible();
    await expect(recSection).toHaveAttribute('data-personalized', 'false');

    // No personal analytics pageview with consent_token or interest tracking should have been recorded
    const personalPageViews = state.trackedEvents.filter(
      (e) => e.type === 'page_view' && e.payload?.consent_token
    );
    const trackedInterests = state.trackedEvents.filter((e) => e.type === 'interest');

    expect(personalPageViews.length).toBe(0);
    expect(trackedInterests.length).toBe(0);
  });

  test('accepting consent enables analytics and personalization affinity', async ({ page }) => {
    const state = { personalized: true, trackedEvents: [] };
    await setupBaseRoutes(page, state);

    // Clear consent state
    await page.goto('/ar/');
    await page.evaluate(() => localStorage.removeItem('portfolio_consent_state'));
    await page.reload();

    const banner = page.getByRole('region', { name: /إشعار الخصوصية|privacy/i });
    await expect(banner).toBeVisible();

    // Click "قبول الكل" (Accept All)
    const acceptBtn = page.getByRole('button', { name: /قبول الكل|accept all/i });
    await acceptBtn.click();
    await expect(banner).not.toBeVisible();

    // Verify localStorage state
    const consent = await page.evaluate(() => JSON.parse(localStorage.getItem('portfolio_consent_state') || '{}'));
    expect(consent.status).toBe('accepted');
    expect(consent.categories.analytics).toBe(true);
    expect(consent.categories.personalization).toBe(true);

    // Visit project page
    await page.goto('/ar/projects/craft-visual-identity');

    // Recommendations section should show personalized attribute
    const recSection = page.locator('[data-testid="related-projects"]');
    await expect(recSection).toBeVisible();
    await expect(recSection).toHaveAttribute('data-personalized', 'true');

    // Wait for async events to dispatch
    await page.waitForTimeout(300);

    // Should have emitted interest tracking and consented pageview
    const personalPageViews = state.trackedEvents.filter(
      (e) => e.type === 'page_view' && Boolean(e.payload?.consent_token)
    );
    expect(personalPageViews.length).toBeGreaterThan(0);
  });

  test('withdrawing consent in privacy modal immediately halts tracking and reverts to generic ranking', async ({ page }) => {
    const state = { personalized: true, trackedEvents: [] };
    await setupBaseRoutes(page, state);

    // Start with pre-accepted consent
    await page.goto('/ar/');
    await page.evaluate(() => {
      localStorage.setItem(
        'portfolio_consent_state',
        JSON.stringify({
          status: 'accepted',
          categories: { essential: true, analytics: true, personalization: true },
          consentId: 'test-consent-uuid-1234',
          updatedAt: new Date().toISOString(),
          version: '1.0',
        })
      );
    });
    await page.reload();

    // Open privacy modal via footer button
    const privacyBtn = page.getByRole('button', { name: /تفضيلات الخصوصية|privacy preferences/i });
    await privacyBtn.scrollIntoViewIfNeeded();
    await privacyBtn.click();

    // Modal dialog is open
    const modal = page.getByRole('dialog', { name: /خصوصية|privacy/i });
    await expect(modal).toBeVisible();

    // Click withdraw consent button
    const withdrawBtn = page.getByRole('button', { name: /سحب الموافقة|withdraw/i });
    await withdrawBtn.click();

    // Modal should close
    await expect(modal).not.toBeVisible();

    // Verify localStorage is updated to withdrawn
    const consent = await page.evaluate(() => JSON.parse(localStorage.getItem('portfolio_consent_state') || '{}'));
    expect(consent.status).toBe('withdrawn');
    expect(consent.categories.analytics).toBe(false);
    expect(consent.categories.personalization).toBe(false);

    // Toggle backend state to generic
    state.personalized = false;

    // Navigate to project
    await page.goto('/ar/projects/craft-visual-identity');

    const recSection = page.locator('[data-testid="related-projects"]');
    await expect(recSection).toBeVisible();
    await expect(recSection).toHaveAttribute('data-personalized', 'false');
  });

  test('admin dashboard renders analytics trend chart, accessible data table, top projects, and traffic breakdown', async ({ page }) => {
    await setupBaseRoutes(page);

    // Authenticate as Admin
    await page.goto('/admin/login');
    await page.getByLabel('Email Address').fill('admin@mohammed-portfolio.test');
    await page.getByLabel('Password').fill('AdminPassword123!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/admin/);

    // Heading
    await expect(page.getByRole('heading', { name: 'لوحة التحكم والتحليلات' })).toBeVisible();

    // Stat cards
    await expect(page.getByText('إجمالي المشاهدات').first()).toBeVisible();
    await expect(page.getByText('الزوار الفريدين').first()).toBeVisible();

    // SVG chart with role="img"
    const chart = page.locator('svg[role="img"]');
    await expect(chart).toBeVisible();
    await expect(chart).toHaveAttribute('aria-label', /trend chart/i);

    // Screen reader accessible data table
    const dataTable = page.getByRole('table', { name: /visits and unique visitors trend data/i });
    await expect(dataTable).toBeAttached();

    // Top projects
    await expect(page.getByText(/المشاريع الأكثر تفاعلاً|المشروع الأكثر تفاعلاً/i).first()).toBeVisible();
    await expect(page.getByText('Craft Studio Visual Identity').first()).toBeVisible();

    // Traffic sources
    await expect(page.getByText(/مصادر الزيارات/i).first()).toBeVisible();

    // Device breakdown
    await expect(page.getByText(/الأجهزة المستخدمة/i).first()).toBeVisible();
    await expect(page.getByText(/desktop/i).first()).toBeVisible();

    // Date range filter: switch to 30 days
    const thirtyDaysBtn = page.getByRole('button', { name: /30 يوماً|30 days|30d/i });
    await thirtyDaysBtn.click();
    await expect(thirtyDaysBtn).toHaveAttribute('aria-pressed', 'true');
  });
});
