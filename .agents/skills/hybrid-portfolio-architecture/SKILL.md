---
name: hybrid-portfolio-architecture
description: Architecture standards for the Hybrid Single-Page portfolio model. Defines the continuous scroll homepage, independent dynamic project detail routes, global anchor navigation, React SSR hydration, and Laravel API contracts.
---

# Hybrid Portfolio Architecture Standards

## 1. Architectural Concept
- **Hybrid Single-Page Experience**:
  - The public front-of-house is a continuous, immersive single-page journey on `/:locale/` containing:
    1. Hero (Cinematic introduction)
    2. Selected Work (Interactive horizontal gallery & showcases)
    3. About (Editorial bio & philosophy)
    4. Skills & Expertise (Interactive discipline matrix)
    5. Creative Journey (Chronological milestone timeline)
    6. Contact (Full-screen closing section with live form)
  - Standalone dynamic routes for deep indexing and comprehensive project showcases:
    - `/:locale/projects/:slug` (SEO-optimized project detail pages)
  - Dedicated admin shell:
    - `/admin/*` (CSR application shell with Sanctum authentication)

## 2. Navigation & Anchor Routing
- When on the homepage (`/:locale/`): Header navigation links (`#work`, `#about`, `#skills`, `#contact`) smoothly scroll to the respective section using smooth scroll behavior:
  ```javascript
  const element = document.getElementById(sectionId);
  if (element) element.scrollIntoView({ behavior: 'smooth' });
  ```
- When on a standalone page (`/:locale/projects/:slug`): Header links navigate to `/:locale/#sectionId`, and upon landing, smoothly scroll to the target.
- Preserves deep linking, native browser back/forward history, and unique URL integrity.

## 3. SSR & Hydration Integrity
- Server renders semantic HTML with complete localized strings, headings, and metadata.
- Animations and ScrollTrigger initialize only after hydration on the client (`useEffect`).
- Zero hydration mismatch: server DOM and initial client DOM match exactly before GSAP attaches inline style transforms.

## 4. API Integration
- Connects to existing Laravel API endpoints:
  - `GET /api/v1/projects?featured=1`: Populates Selected Work horizontal gallery.
  - `GET /api/v1/projects/:slug`: Populates Project Detail page.
  - `GET /api/v1/categories`: Populates filter chips and capabilities.
  - `POST /api/v1/contact`: Sends validated inquiries with CSRF & anti-spam honeypot protection.
