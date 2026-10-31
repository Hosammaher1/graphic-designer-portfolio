import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render as testRender } from '@testing-library/react';
import {
  CWV_BUDGETS,
  getRating,
  isWithinBudget,
  initWebVitals,
} from '../src/utils/webVitals.js';
import { resolvePageMetadata, syncDocumentHead } from '../src/utils/seo.js';
import ResponsiveImage from '../src/components/ui/ResponsiveImage.jsx';

describe('Core Web Vitals Audit & Optimization (Task 07.09)', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    localStorage.clear();
  });

  describe('Performance Budgets & Metric Thresholds', () => {
    it('defines official Core Web Vitals threshold budgets', () => {
      expect(CWV_BUDGETS.LCP).toBeDefined();
      expect(CWV_BUDGETS.LCP.good).toBe(2500); // LCP < 2.5s
      expect(CWV_BUDGETS.FID.good).toBe(100);  // FID < 100ms
      expect(CWV_BUDGETS.INP.good).toBe(200);  // INP standard
      expect(CWV_BUDGETS.CLS.good).toBe(0.1);  // CLS < 0.1
      expect(CWV_BUDGETS.FCP.good).toBe(1800); // FCP < 1.8s
      expect(CWV_BUDGETS.TTFB.good).toBe(800); // TTFB < 800ms
    });

    it('getRating accurately classifies metric values', () => {
      // LCP
      expect(getRating('LCP', 1500)).toBe('good');
      expect(getRating('LCP', 3000)).toBe('needs-improvement');
      expect(getRating('LCP', 4500)).toBe('poor');

      // CLS
      expect(getRating('CLS', 0.05)).toBe('good');
      expect(getRating('CLS', 0.15)).toBe('needs-improvement');
      expect(getRating('CLS', 0.35)).toBe('poor');

      // FID
      expect(getRating('FID', 50)).toBe('good');
      expect(getRating('FID', 150)).toBe('needs-improvement');
      expect(getRating('FID', 400)).toBe('poor');
    });

    it('isWithinBudget validates whether metric satisfies good threshold', () => {
      expect(isWithinBudget('LCP', 2400)).toBe(true);
      expect(isWithinBudget('LCP', 2600)).toBe(false);

      expect(isWithinBudget('CLS', 0.08)).toBe(true);
      expect(isWithinBudget('CLS', 0.12)).toBe(false);
    });
  });

  describe('Hero Image Preload (LCP Optimization)', () => {
    it('resolvePageMetadata outputs preload link for hero images in SSR head tags', () => {
      const heroUrl = 'https://res.cloudinary.com/demo/image/upload/hero-cover.jpg';
      const meta = resolvePageMetadata('/ar/projects/test-project', {
        preloadImage: heroUrl,
      });

      expect(meta.preloadImage).toBe(heroUrl);
      const headTags = meta.renderHeadTags();
      expect(headTags).toContain(`<link rel="preload" as="image" href="${heroUrl}" fetchpriority="high">`);
    });

    it('syncDocumentHead synchronizes hero image preload link to DOM and cleans it up when absent', () => {
      const heroUrl = 'https://res.cloudinary.com/demo/image/upload/hero-cover.jpg';
      const metaWithPreload = resolvePageMetadata('/ar/projects/test-project', {
        preloadImage: heroUrl,
      });

      syncDocumentHead(metaWithPreload);

      let preloadEl = document.querySelector('link[rel="preload"][as="image"]');
      expect(preloadEl).not.toBeNull();
      expect(preloadEl.getAttribute('href')).toBe(heroUrl);
      expect(preloadEl.getAttribute('fetchpriority')).toBe('high');

      // Navigate to route without preloadImage
      const metaWithoutPreload = resolvePageMetadata('/ar/contact');
      syncDocumentHead(metaWithoutPreload);

      preloadEl = document.querySelector('link[rel="preload"][as="image"]');
      expect(preloadEl).toBeNull();
    });
  });

  describe('Layout Shift Prevention (CLS Optimization)', () => {
    it('ResponsiveImage enforces aspect-ratio and explicit dimensions to eliminate CLS', () => {
      const { container } = testRender(
        <ResponsiveImage
          src="https://res.cloudinary.com/demo/image/upload/v1/sample.jpg"
          alt="Visual Identity Mockup"
          aspectRatio="16/10"
          priority={true}
        />
      );

      const picture = container.querySelector('picture');
      expect(picture).not.toBeNull();
      expect(picture.style.aspectRatio.replace(/\s+/g, '')).toBe('16/10');

      const img = container.querySelector('img');
      expect(img).not.toBeNull();
      expect(img.style.aspectRatio.replace(/\s+/g, '')).toBe('16/10');
      expect(img.getAttribute('loading')).toBe('eager');
      expect(img.getAttribute('fetchpriority')).toBe('high');
    });
  });

  describe('Web Vitals Observer & RUM Integration', () => {
    it('initWebVitals safe execution and metric callback observer', () => {
      const reports = [];
      const mockCallback = (metric) => reports.push(metric);

      // Mock PerformanceObserver
      const originalPO = window.PerformanceObserver;
      try {
        let observerCallback = null;
        window.PerformanceObserver = vi.fn().mockImplementation((cb) => {
          observerCallback = cb;
          return {
            observe: vi.fn(),
            disconnect: vi.fn(),
          };
        });
        window.PerformanceObserver.supportedEntryTypes = [
          'largest-contentful-paint',
          'layout-shift',
          'first-input',
          'paint',
        ];

        const cleanup = initWebVitals(mockCallback);
        expect(typeof cleanup).toBe('function');
      } finally {
        window.PerformanceObserver = originalPO;
      }
    });
  });
});
