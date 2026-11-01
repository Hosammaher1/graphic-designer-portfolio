import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * Vitest configuration — separate from Vite build config per 01.07 test harness task.
 * This file is the single source of truth for unit/component test configuration.
 * Vite's vite.config.js handles build only (no `test` block).
 */
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    testTimeout: 15000,
    include: ['tests/**/*.{test,spec}.{js,jsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/entry-client.jsx', 'src/entry-server.jsx'],
    },
  },
});
