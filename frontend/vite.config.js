import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite build configuration.
 * Test configuration is now in vitest.config.js (Task 01.07).
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
    },
  },
});
