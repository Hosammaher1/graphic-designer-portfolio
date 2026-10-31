import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite build configuration.
 * Configured with Rollup manualChunks for vendor splitting (Task 07.08).
 * Test configuration is in vitest.config.js (Task 01.07).
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist/client',
    rollupOptions: {
      input: 'index.html',
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, '/');
          if (normalized.includes('node_modules')) {
            if (normalized.includes('react-router')) {
              return 'vendor-router';
            }
            if (normalized.includes('lucide-react')) {
              return 'vendor-lucide';
            }
            if (
              normalized.includes('react-dom') ||
              normalized.includes('scheduler') ||
              normalized.includes('/react/') ||
              normalized.includes('/react@') ||
              normalized.includes('node_modules/react/')
            ) {
              return 'vendor-react';
            }
            return 'vendor-common';
          }
        },
      },
    },
  },
});
