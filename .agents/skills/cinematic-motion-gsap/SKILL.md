---
name: cinematic-motion-gsap
description: Engineering and design principles for GSAP + ScrollTrigger and React motion. Covers pinned horizontal scroll showcases, parallax effects, staggered typography reveals, SSR safety, lifecycle cleanup, and prefers-reduced-motion support.
---

# Cinematic Motion & ScrollTrigger Engineering

## 1. Core Principles
- **Motion as Narrative**: Animation guides the eye, communicates physical weight, and reveals content seamlessly as the user scrolls. Never animate gratuitously.
- **Scroll-Scrubbing**: Tie horizontal translation and parallax to direct scroll position with smooth dampening (`scrub: 1` or `scrub: 1.2`).
- **Performance First**: Animate strictly GPU-accelerated properties: `transform` (`x`, `y`, `scale`) and `opacity`. Never animate `width`, `height`, `top`, `left`, or `margin`.

## 2. GSAP & ScrollTrigger in React SSR
- **Safe Environment Registration**:
  ```javascript
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    gsap.registerPlugin(ScrollTrigger);
  }
  ```
- **Lifecycle Cleanup**: Always kill ScrollTrigger instances inside `useEffect` cleanup returns:
  ```javascript
  useEffect(() => {
    const trigger = ScrollTrigger.create({ ... });
    return () => {
      if (trigger) trigger.kill();
    };
  }, [dependencies]);
  ```
- **RTL-Aware Horizontal Scrolling**: In Arabic RTL (`dir="rtl"`), the horizontal translation vector moves from right to left (positive X), whereas in LTR it moves from left to right (negative X).

## 3. Prefers-Reduced-Motion Guarantees
- Check `window.matchMedia('(prefers-reduced-motion: reduce)').matches`.
- If true: bypass ScrollTrigger pinning, set opacity to 1 immediately, and disable transforms to protect vestibular health.

## 4. Component Patterns
- **Pinned Horizontal Gallery**: Pin section when top hits viewport top (`pin: true`), scrub track width minus viewport width (`end: () => '+=' + trackWidth`).
- **Staggered Text Reveal**: Split lines or phrases into clipped containers (`overflow-hidden`), translateY from `100%` to `0%` with `ease: 'power3.out'`.
- **Card Parallax**: Translate background imagery slower than card scroll speed (`yPercent: -15`).
