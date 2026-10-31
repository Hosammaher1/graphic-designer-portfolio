// @vitest-environment node
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import viteConfig from '../vite.config.js';

describe('Bundle Optimization (Task 07.08)', () => {
  it('vite config configures manualChunks for vendor splitting', () => {
    const rollupOptions = viteConfig.build?.rollupOptions;
    expect(rollupOptions).toBeDefined();

    const manualChunks = rollupOptions.output?.manualChunks;
    expect(typeof manualChunks).toBe('function');

    // Test categorization
    expect(manualChunks('node_modules/react/index.js')).toBe('vendor-react');
    expect(manualChunks('node_modules/react-dom/index.js')).toBe('vendor-react');
    expect(manualChunks('node_modules/react-router/dist/index.js')).toBe('vendor-router');
    expect(manualChunks('node_modules/react-router-dom/dist/index.js')).toBe('vendor-router');
    expect(manualChunks('node_modules/lucide-react/dist/esm/lucide-react.js')).toBe('vendor-lucide');
  });

  it('production build generates separated vendor chunks', () => {
    const clientDist = path.resolve(__dirname, '../dist/client/assets');
    expect(fs.existsSync(clientDist)).toBe(true);

    const files = fs.readdirSync(clientDist);
    const jsFiles = files.filter((f) => f.endsWith('.js'));

    const hasReactChunk = jsFiles.some((f) => f.startsWith('vendor-react'));
    const hasRouterChunk = jsFiles.some((f) => f.startsWith('vendor-router'));
    const hasLucideChunk = jsFiles.some((f) => f.startsWith('vendor-lucide'));

    expect(hasReactChunk).toBe(true);
    expect(hasRouterChunk).toBe(true);
    expect(hasLucideChunk).toBe(true);
  });

  it('initial JS bundle size is within gzip budget (< 150 kB)', () => {
    const clientDist = path.resolve(__dirname, '../dist/client/assets');
    const files = fs.readdirSync(clientDist);
    const jsFiles = files.filter((f) => f.endsWith('.js'));

    // Check entry index chunk gzip size
    const indexFile = jsFiles.find((f) => f.startsWith('index-'));
    expect(indexFile).toBeDefined();

    const indexContent = fs.readFileSync(path.join(clientDist, indexFile));
    const indexGzipSize = zlib.gzipSync(indexContent).length;

    // Gzip size of index chunk must be well under 150 kB
    expect(indexGzipSize).toBeLessThan(150 * 1024);

    // React vendor chunk gzip size must be under 70 kB
    const reactFile = jsFiles.find((f) => f.startsWith('vendor-react'));
    if (reactFile) {
      const reactContent = fs.readFileSync(path.join(clientDist, reactFile));
      const reactGzip = zlib.gzipSync(reactContent).length;
      expect(reactGzip).toBeLessThan(70 * 1024);
    }
  });
});
