---
name: responsive-accessibility
description: Accessibility and responsive design standards for the portfolio. Enforces WCAG 2.1 AA compliance, keyboard navigation, focus indicators, ARIA landmark roles, bilingual RTL/LTR symmetry, and mobile touch adaptations.
---

# Responsive Web Design & Accessibility (WCAG 2.1 AA)

## 1. Responsive Viewport Strategy
- **Breakpoints**: Mobile (< 640px), Tablet (640px - 1023px), Desktop (>= 1024px), Wide Display (>= 1536px).
- **Mobile Fallbacks**:
  - Pinned horizontal GSAP ScrollTrigger converts into a native touch-friendly horizontal swipe container (`overflow-x-auto snap-x`) on screens < 1024px to ensure effortless navigation without scroll hijacking on touchscreens.
  - Monumental typography scales down smoothly via CSS clamp:
    `font-size: clamp(2.5rem, 7vw, 7rem)`.

## 2. Bilingual RTL / LTR Symmetry
- When `locale === 'ar'`: `dir="rtl"` on `<html>`. Arrow icons invert (`ArrowLeft` for forward progression). Layout flows right-to-left naturally with logical CSS properties (`ms-*`, `me-*`, `start-*`, `end-*`).
- When `locale === 'en'`: `dir="ltr"` on `<html>`. Arrow icons point right (`ArrowRight`).

## 3. WCAG 2.1 AA Compliance
- **Keyboard Navigation**:
  - Full tabindex flow: interactive cards, links, form inputs, and modal lightboxes must be reachable and operable via `Tab`, `Enter`, `Space`, and `Escape`.
  - Visible focus ring: `focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none`.
- **Skip to Content**:
  - `#main-content` anchor accessible via keyboard as first focusable item on the page.
- **Color Contrast**:
  - All text meets minimum 4.5:1 contrast ratio against background surfaces (`text-stone-100` on `bg-stone-950` is ~18:1).
- **Alt Text & Landmark Roles**:
  - Every image has meaningful localized `alt` attribute.
  - Page structure uses semantic landmarks: `<header>`, `<main id="main-content">`, `<nav>`, `<section aria-labelledby="...">`, `<footer>`.
