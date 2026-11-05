// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Task 07.10 — E2E SEO, Contact Form & Core Web Vitals.
 *
 * Scenarios:
 * 1. robots.txt accessible and valid directives.
 * 2. sitemap.xml valid XML and reciprocal alternates.
 * 3. Metadata, Open Graph, Twitter Card, and JSON-LD structured data on public & admin pages.
 * 4. Contact form validation (client-side error feedback on empty/invalid inputs).
 * 5. Contact form valid submission (success alert banner and field reset).
 * 6. Contact honeypot & anti-spam defense verification.
 * 7. Zero Cumulative Layout Shift (CLS < 0.1) during page load.
 */

test.describe('SEO Directives & Crawlability', () => {
  test('robots.txt is accessible and contains required disallow and sitemap directives', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'] || '';
    expect(contentType).toContain('text/plain');

    const body = await response.text();
    expect(body).toContain('User-agent: *');
    expect(body).toContain('Disallow: /admin');
    expect(body).toContain('Disallow: /api');
    expect(body).toContain('Sitemap:');
    expect(body).toContain('/sitemap.xml');
  });

  test('sitemap.xml is accessible and contains valid XML structure and hreflangs', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'] || '';
    expect(contentType).toMatch(/(xml|text)/);

    const body = await response.text();
    expect(body).toContain('<urlset');
    expect(body).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    expect(body).toContain('/ar/');
    expect(body).toContain('/en/');
    expect(body).toContain('hreflang="ar"');
    expect(body).toContain('hreflang="en"');
    expect(body).not.toContain('/admin');
  });
});

test.describe('Page Metadata, Canonicals & Structured Data', () => {
  test('Arabic public homepage exposes valid SEO meta tags and JSON-LD schema', async ({ page }) => {
    await page.goto('/ar/');
    await expect(page).toHaveURL(/\/ar\//);

    // Title & description
    await expect(page).toHaveTitle(/مصمم جرافيك|Mohammed/i);
    const descMeta = page.locator('meta[name="description"]');
    await expect(descMeta).toHaveAttribute('content', /.+/);

    // Canonical link
    const canonicalLink = page.locator('link[rel="canonical"]');
    await expect(canonicalLink).toHaveAttribute('href', /.*\/ar\/?$/);

    // Reciprocal hreflangs
    const hreflangAr = page.locator('link[rel="alternate"][hreflang="ar"]');
    const hreflangEn = page.locator('link[rel="alternate"][hreflang="en"]');
    await expect(hreflangAr).toHaveAttribute('href', /.*\/ar\/?$/);
    await expect(hreflangEn).toHaveAttribute('href', /.*\/en\/?$/);

    // Open Graph
    const ogTitle = page.locator('meta[property="og:title"]');
    const ogType = page.locator('meta[property="og:type"]');
    await expect(ogTitle).toHaveAttribute('content', /.+/);
    await expect(ogType).toHaveAttribute('content', 'website');

    // Schema.org JSON-LD script (may be array or single object)
    const jsonLdScript = page.locator('script[type="application/ld+json"]');
    await expect(jsonLdScript).toBeAttached();
    const jsonLdText = await jsonLdScript.textContent();
    expect(jsonLdText).toBeTruthy();
    const parsed = JSON.parse(jsonLdText || '[]');
    const rootNode = Array.isArray(parsed) ? parsed[0] : parsed;
    expect(rootNode['@context']).toBe('https://schema.org');
  });

  test('English public homepage exposes reciprocal alternates and language attributes', async ({ page }) => {
    await page.goto('/en/');
    await expect(page).toHaveURL(/\/en\//);

    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'en');
    await expect(html).toHaveAttribute('dir', 'ltr');

    const canonicalLink = page.locator('link[rel="canonical"]');
    await expect(canonicalLink).toHaveAttribute('href', /.*\/en\/?$/);

    const hreflangAr = page.locator('link[rel="alternate"][hreflang="ar"]');
    await expect(hreflangAr).toHaveAttribute('href', /.*\/ar\/?$/);
  });

  test('Admin routes emit noindex and exclude public hreflang alternates', async ({ page }) => {
    await page.goto('/admin/login');
    const robotsMeta = page.locator('meta[name="robots"]');
    await expect(robotsMeta).toHaveAttribute('content', /noindex/i);

    const publicHreflang = page.locator('link[rel="alternate"][hreflang="ar"]');
    await expect(publicHreflang).toHaveCount(0);
  });
});

test.describe('Contact Form & Anti-Spam Defense', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept project / categories / analytics queries cleanly
    await page.route('**/api/v1/projects**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { projects: { data: [] } } }),
      });
    });
    await page.route('**/api/v1/categories**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { categories: [] } }),
      });
    });
    await page.route('**/api/analytics/events**', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ status: 'ok' }) });
    });
  });

  test('validates required fields on empty contact form submission', async ({ page }) => {
    await page.goto('/ar/contact');

    // Click submit without entering data
    const submitBtn = page.getByRole('button', { name: /إرسال|send/i });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Verification: validation error shown on name or form
    const nameInput = page.locator('#contact-name, input[name="name"]');
    await expect(nameInput).toBeVisible();
    const isInvalid = await nameInput.evaluate((el) => !el.checkValidity() || el.getAttribute('aria-invalid') === 'true');
    expect(isInvalid).toBe(true);
  });

  test('submits valid contact inquiry and shows success feedback', async ({ page }) => {
    await page.route('**/api/v1/contact', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            message: 'تم استلام رسالتك بنجاح وسنقوم بالرد في أقرب وقت.',
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/ar/contact');

    // Fill valid contact form data
    const nameInput = page.locator('#contact-name, input[name="name"]');
    const emailInput = page.locator('#contact-email, input[name="email"]');
    const serviceSelect = page.locator('#contact-service, select[name="service"]');
    const subjectInput = page.locator('#contact-subject, input[name="subject"]');
    const messageInput = page.locator('#contact-message, textarea[name="message"]');

    await nameInput.fill('سارة أحمد');
    await emailInput.fill('sara@example.com');
    if (await serviceSelect.count() > 0) {
      await serviceSelect.selectOption('branding');
    }
    if (await subjectInput.count() > 0) {
      await subjectInput.fill('تصميم هوية بصرية كاملة وتغليف');
    }
    await messageInput.fill('مرحباً أستاذ محمد، نود التعاون لتطوير هوية بصرية جديدة لعلامتنا التجارية.');

    const submitBtn = page.getByRole('button', { name: /إرسال|send/i });
    await submitBtn.click();

    // Success feedback verification: form unmounts and success state renders
    const successBanner = page.locator('.contact-success-state, [role="alert"]');
    await expect(successBanner).toBeVisible({ timeout: 10_000 });
    await expect(successBanner).toContainText(/نجاح|تم استلام|رسالتك|success/i);
  });

  test('honeypot field is present and rejects bot spam submissions', async ({ page }) => {
    let apiCalled = false;
    await page.route('**/api/v1/contact', async (route) => {
      apiCalled = true;
      await route.fulfill({ status: 200, body: JSON.stringify({ status: 'success' }) });
    });

    await page.goto('/ar/contact');

    // Honeypot input is in DOM but hidden from human users
    const honeypot = page.locator('input[name="website"]');
    await expect(honeypot).toBeAttached();

    // Verify it is visually hidden
    const isHidden = await honeypot.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0' || el.tabIndex === -1;
    });
    expect(isHidden).toBe(true);

    // If bot fills the honeypot (dispatch native input setter to notify React)
    await honeypot.evaluate((el) => {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(el, 'http://spam-bot.site');
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Fill legitimate fields
    await page.locator('#contact-name, input[name="name"]').fill('Spam Bot');
    await page.locator('#contact-email, input[name="email"]').fill('bot@spam.com');
    const spamService = page.locator('#contact-service, select[name="service"]');
    if (await spamService.count() > 0) {
      await spamService.selectOption('branding');
    }
    const spamSubject = page.locator('#contact-subject, input[name="subject"]');
    if (await spamSubject.count() > 0) {
      await spamSubject.fill('Spam Inquiry');
    }
    await page.locator('#contact-message, textarea[name="message"]').fill('Spam text content here');

    const submitBtn = page.getByRole('button', { name: /إرسال|send/i });
    await submitBtn.click();

    // Client anti-spam drops the submission without calling API
    expect(apiCalled).toBe(false);
  });
});

test.describe('Cumulative Layout Shift (CLS) Audit', () => {
  test('accumulated CLS during initial page load satisfies good budget (< 0.1)', async ({ page }) => {
    // Record layout shifts
    await page.addInitScript(() => {
      window.__clsScore = 0;
      try {
        const observer = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!entry.hadRecentInput) {
              window.__clsScore += entry.value;
            }
          }
        });
        observer.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {}
    });

    await page.goto('/ar/');
    await page.waitForLoadState('networkidle');

    const clsScore = await page.evaluate(() => window.__clsScore || 0);
    // Official CWV Good threshold is < 0.1
    expect(clsScore).toBeLessThan(0.1);
  });
});
