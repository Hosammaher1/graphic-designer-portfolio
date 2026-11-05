import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Vite build configuration for Google AI Studio frontend.
 * Integrated with Tailwind CSS v4 and React 19 SSR.
 * Configured with Rollup manualChunks for vendor splitting (Task 07.08).
 */
const backendTarget = process.env.VITE_BACKEND_URL || process.env.BACKEND_URL || 'http://127.0.0.1:8001';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  ssr: {
    noExternal: ['gsap'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
      },
      '/sanctum': {
        target: backendTarget,
        changeOrigin: true,
      },
      '/storage': {
        target: backendTarget,
        changeOrigin: true,
      },
    },
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
