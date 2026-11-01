---
name: playwright-visual-testing
description: Playwright E2E visual verification, responsive viewport testing, and motion inspection. Guides browser testing across Desktop Chromium and Mobile Chrome, screenshot capture, and visual validation.
---

# Playwright Visual & E2E Testing Guidelines

## 1. Multi-Device Browser Testing
- Test suites must run across:
  - **Desktop Chromium** (`viewport: { width: 1280, height: 720 }`)
  - **Mobile Chrome** (Pixel 5 emulation, `viewport: { width: 393, height: 851 }`, mobile touch enabled)

## 2. Visual Motion Verification Checklist
- [ ] Hero headline reveals smoothly and remains visible.
- [ ] Section markers (`01 //`, `02 //`, `03 //`, etc.) appear at top of sections.
- [ ] Selected Works horizontal track scrolls smoothly on Desktop and permits touch swiping on Mobile.
- [ ] Timeline Archive renders monumental year numbers without horizontal overflow.
- [ ] Interactive cards trigger hover transforms and focus rings.
- [ ] Reduced motion emulation (`prefers-reduced-motion: reduce`) displays content instantly without blocking or missing elements.

## 3. Evidence Collection & Screenshots
- Capture visual snapshots for verification records:
  - `test-results/hero-desktop.png`
  - `test-results/hero-mobile.png`
  - `test-results/gallery-desktop.png`
  - `test-results/timeline-desktop.png`
- Save screenshots into test output directory and link them in `docs/PROGRESS.md`.
