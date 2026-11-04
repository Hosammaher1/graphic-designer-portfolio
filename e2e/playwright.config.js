// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright E2E configuration — Task 01.07 Test Harness.
 *
 * The webServer block builds + serves the SSR app automatically before tests.
 * In CI (01.08), the same block is used, but PORT env may be set explicitly.
 *
 * Browser matrix:
 * - Desktop Chromium  (desktop smoke, navigation, headings)
 * - Mobile Chrome     (Pixel 5 emulation — avoids WebKit install requirement)
 *
 * WebKit / Safari is intentionally deferred to Phase 09 browser matrix (09.08)
 * where Oracle VM and production infrastructure are available.
 *
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'Desktop Chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'node ../frontend/server/index.js',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 15_000,
  },
});
