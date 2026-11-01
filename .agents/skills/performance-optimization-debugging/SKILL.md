---
name: performance-optimization-debugging
description: Performance optimization, Core Web Vitals, bundle size management, and systematic debugging workflows for the React/Vite SSR frontend.
---

# Frontend Performance Optimization & Systematic Debugging

## 1. Core Web Vitals Targets
- **Largest Contentful Paint (LCP)**: < 2.5s. Critical hero images preloaded or given `fetchpriority="high"`.
- **Cumulative Layout Shift (CLS)**: < 0.1. Explicit aspect ratios on image containers (`aspect-[16/10]`).
- **Interaction to Next Paint (INP)**: < 200ms. Passive event listeners, requestAnimationFrame throttling, debounced resize handlers.

## 2. Bundle Optimization
- Code-splitting with dynamic `React.lazy()` for heavy modals, lightboxes, and admin modules.
- Tree-shaking Lucide icons and vendor chunks configured in `vite.config.js`.
- Total initial client JS bundle kept lean with Gzip compression.

## 3. Systematic Debugging Protocol
1. **Reproduce**: Run the specific test or page in isolation.
2. **Inspect**: Check browser console logs, SSR output, or test runner error traces.
3. **Isolate**: Distinguish between SSR markup issues, client hydration mismatches, and animation lifecycle conflicts.
4. **Fix**: Apply minimal, root-cause solutions with zero regression on existing features.
5. **Verify**: Run unit tests, browser inspection, and full test suite before committing.
