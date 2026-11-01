# Graphic Designer Portfolio — Master Implementation Plan

**Version:** 1.1 | **Status:** Approved product scope; execution not started | **Language:** English technical specification with Arabic product requirements | **Date:** 2026-10-29

> **Instructions for coding agent:** This is the canonical implementation plan for a single-designer portfolio SaaS-like website (not multi-tenant). Read the entire document before editing. Implement sequentially in small verified slices. Do not claim completion without actual passing evidence. Ask the owner for credentials and deployment authorization when needed. Do not deploy or incur charges without explicit approval.

## 0. Product scope and fixed decisions

1. Single graphic designer/admin; public visitors require no account.
2. Standalone designs and multi-image projects; multiple dynamic categories per project.
3. Minimal creative UI, light/dark, subtle motion, responsive grid, project details.
4. Images only in MVP; Cloudinary with optional baked-in watermarked display variants, originals preserved privately/appropriately.
5. Advanced dashboard: projects, categories, page builder, site settings, SEO, analytics.
6. React + Vite + **JavaScript**, SSR for public routes; admin CSR; Laravel REST API; **MySQL**; Laravel Sanctum.
7. Arabic/English, RTL/LTR, localized content and SEO; language-specific URLs.
8. Hybrid Single-Page Experience: ONE continuous, immersive, scroll-driven homepage (Hero, Selected Work horizontal showcase, About, Skills & Expertise, Creative Journey timeline, Contact), combined with independent dynamic project detail pages and an independent CSR admin dashboard.
9. Draft/preview/publish for pages and project layouts; public always reads published snapshot.
10. Search bilingual title, category, tool, year, popularity, recency.
11. Rule-based recommendations; personalization **only after explicit consent**; generic recommendations otherwise.
12. Privacy-aware analytics and consent withdrawal; contact form sends email, no permanent in-app inbox required.
13. Soft-delete projects for 30 days, restore, then scheduled purge and safe Cloudinary cleanup.
14. Daily encrypted off-server database backups, last seven copies, restore verification; external provider TBD.
15. Oracle Cloud Always Free intended hosting (account not yet created; capacity not guaranteed), Cloudinary external.
16. GitHub Actions CI and deployment on merge to main after tests; production deployment requires owner setup/approval.
17. Security: HTTPS, authorization, CSRF/session protection, rate limiting, security headers, file validation, logs and secrets management.
18. Tests: PHPUnit, Vitest + React Testing Library, Playwright; production-ready acceptance.
19. Monitoring: uptime/API/SSR, server CPU/RAM/disk, email alerts; advanced error handling/retries.
20. Visual direction approved: Apple/iOS-inspired premium dark editorial aesthetic, monumental typography, subtle glassmorphism and depth, GSAP + ScrollTrigger scroll-driven storytelling, vivid project imagery, high-contrast light/dark modes, and rigorous prefers-reduced-motion support.

### Explicit non-goals for v1
- Public user accounts, payments, multi-designer tenants, video hosting, freeform HTML/JS in page builder, AI/ML model training, full historical version-control UI, and an internal contact inbox.
- Never assume free-tier services or email/storage providers are available until verified.

## 1. Architecture and contracts

### 1.1 Runtime topology
- Nginx reverse proxy and TLS; `/api/v1/*` to Laravel; public routes to Node SSR server; static assets cached.
- React + Vite SSR with `entry-server.jsx` and `entry-client.jsx`; hydrate without mismatch. Admin route rendered as CSR application shell with authenticated API calls.
- Laravel modular monolith with controllers, form requests, policies, services, jobs, resources, migrations, tests.
- MySQL (utf8mb4) for transactional data; indexed relational columns; JSON for validated block documents and settings.
- Cloudinary media provider adapter for uploads/transformations/deletion; never expose API secret to client.
- Email adapter, backup provider adapter, optional queue and scheduler; do not rely on in-process timers for scheduled cleanup.

### 1.2 Suggested repository
```
portfolio/
  frontend/
    src/app/ src/components/ src/features/ src/pages/ src/layouts/
    src/i18n/ src/styles/ src/entry-client.jsx src/entry-server.jsx
    server/index.js tests/ package.json vite.config.js
  backend/
    app/Http/Controllers/Api/V1/ app/Http/Requests/ app/Http/Resources/
    app/Models/ app/Policies/ app/Services/ app/Jobs/ app/Console/
    database/migrations/ database/factories/ database/seeders/
    routes/api.php tests/Feature/ tests/Unit/
  e2e/tests/ playwright.config.js package.json
  infrastructure/nginx/ infrastructure/deployment/ infrastructure/backup/
  .github/workflows/ docs/ README.md .gitignore .editorconfig
```
Names may vary with framework version; document any justified changes in `docs/DECISIONS.md`.

### 1.3 Data model — required entities
- `users` (one seeded admin; unique email, hashed password, active status); `admin_activity_logs`.
- `projects` (slug, status, featured, publish_at, year, cover_media_id, view_count aggregate, deleted_at, timestamps); `project_translations` (project_id, locale, title, summary, description, seo_title, seo_description, unique locale/project); `project_media` (project_id, media_id, sort_order, caption translations or separate table); `project_tools` or project/tool pivot.
- `categories` (slug, sort_order, active); `category_translations` (locale/name/description); `category_project` (unique project/category).
- `media_assets` (provider, provider_id, resource type, width, height, bytes, mime, original reference, display variants, watermark flags, ownership/reference count); deletion must not remove shared asset.
- `pages` (slug, type, status, published_version_id); `page_versions` (page_id, locale or locale-neutral document, version, draft/published snapshot, JSON schema version, created_by, published_at); block schema validated server-side. Project layout may use the same block renderer with a distinct template/allowlist.
- `site_settings`, `social_links`, `contact_delivery_logs` (minimal, redacted), `consent_records` (non-identifying where possible), `analytics_events` (short TTL), `analytics_daily_aggregates`, `visitor_preferences` (only consented pseudonymous identifier).
- `jobs`, `failed_jobs` if using Laravel queue. All necessary indexes, FK constraints, unique rules and safe cascading semantics documented.

### 1.4 API conventions
- Prefix `/api/v1`; JSON envelope and predictable error structure; pagination and server-side validation.
- Public GET: `/health`, `/projects`, `/projects/{slug}`, `/categories`, `/pages/{slug}`, `/recommendations`, `/settings/public`; POST `/contact`, `/consent` only if required.
- Admin auth: `/auth/login`, `/auth/logout`, `/auth/me`, `/auth/password`; Sanctum cookie/session flow with CSRF, secure/same-site cookies, correct proxy trust.
- Admin CRUD: `/admin/projects`, `/admin/categories`, `/admin/media`, `/admin/pages`, `/admin/pages/{id}/preview`, `/admin/pages/{id}/publish`, `/admin/analytics`, `/admin/settings`, `/admin/trash`.
- Preview routes require authentication or short-lived signed tokens; `noindex` and no caching. Public routes never leak drafts, deleted items, unpublished assets or sensitive metadata.
- Define API resource schemas and maintain `docs/API.md`; prefer explicit query filters and strict sort allowlist.

### 1.5 UI design tokens
- Light editorial canvas, strong typography, vivid imagery; dark palette with accessible contrast.
- Motion durations approximately 200–500ms, restrained transforms, no layout shift; respect `prefers-reduced-motion` and support keyboard interaction.
- Desktop/tablet/mobile responsive; Arabic RTL/English LTR; route prefixes `/ar/` and `/en/`; proper `lang`, `dir`, localized titles, `hreflang`.

## 2. Mandatory agent execution protocol

1. Inspect repository, environment and existing changes. Never overwrite unrelated work. Ask if a decision conflicts with code or plan.
2. Maintain `docs/PROGRESS.md` with task IDs, status, commit hash, tests run, results, blockers and next task.
3. Activate relevant design/frontend skills before UI work and testing/TDD skills before test work, per Section 2A. For each behavior: RED failing automated test -> GREEN minimal implementation -> REFACTOR -> run related and regression tests -> code review -> commit. Visual changes require screenshots and responsive/keyboard review as well.
4. Use feature branches from `dev` or a documented branching equivalent. Protect `main`; only merge tested work. Avoid force pushes.
5. After every task report changed files, exact commands/results, security implications, and whether acceptance criteria pass. Never fabricate test results.
6. No production credentials in repo or logs; use `.env.example` placeholders and CI secrets. No paid services or deployment without owner approval.
7. Each phase gate requires passing its test matrix and documented review. Stop on failures; do not silently skip tests.
8. If a command differs by framework version, inspect package scripts and use the actual command, updating docs accordingly.
9. Keep components small and modular; no giant `App.jsx`; no TypeScript; use reusable validation and policies.
10. End-to-end verification must run against isolated test data and mock external services when feasible.

## 2A. Mandatory phase-aware Skills activation protocol

**This is a mandatory execution requirement, not a suggestion.** Before implementing a task, the coding agent MUST discover and read the relevant installed skills available in its own environment (skill catalog, skills tool, or local `SKILL.md` files). A skill is an executable agent workflow/instruction set, not merely a library dependency. Do not pretend to have activated a skill when it is unavailable. Record the exact skill name, path/source, and activation result in `docs/PROGRESS.md` and in each task report. If no matching skill exists, state `NOT AVAILABLE`, follow the equivalent checklist below, and proceed without inventing tools. Never download or install third-party skills without owner approval.

### Skill routing by work type

| Trigger / phase | Discover and invoke skill(s) for | Mandatory deliverables / gates |
|---|---|---|
| Phase 01: design foundation, tokens, layout architecture | UI/UX design, design systems, frontend architecture, React/Vite SSR, accessibility | documented tokens, responsive breakpoints, RTL/LTR strategy, SSR architecture, design-review checklist |
| Phase 02: admin UI and authentication forms | frontend design, React components, forms, accessibility, security | responsive login/admin shell, keyboard/focus review, auth/security tests |
| Phase 03: project/category/media management screens | frontend design, media upload UX, React, API testing | upload states (progress/retry/error), keyboard access, component + API tests |
| Phase 04: **all public-facing design work** | **UI/UX / frontend-design skill FIRST**, React frontend, responsive design, animation/motion, accessibility | compare to approved visual direction; desktop/tablet/mobile screenshots; subtle 200–500ms motion; reduced-motion test; visual review before completion |
| Phase 05: Page Builder interface | UI/UX, frontend-design, drag-and-drop accessibility, React architecture, frontend testing | editing/preview/publish UX, keyboard alternatives to drag/drop, undo/cancel/error states, component + E2E tests |
| Phase 06: search, filters, analytics dashboard | frontend-design, data visualization UX, privacy, frontend/backend testing | clear empty/loading/error states, chart accessibility, consent tests |
| Phase 07: SEO/performance/contact | frontend-design, performance/SSR/SEO, accessibility, test automation | visual regression, Core Web Vitals, SSR metadata tests, responsive contact form |
| Phase 08: security, reliability, backups | security-review, backend-testing, integration-testing, operations testing | negative tests, backup restore proof, alerts, redacted logs |
| Phase 09: release testing and deployment | **testing / QA / Playwright / E2E skills**, CI/CD, security and performance review | complete acceptance matrix, browser/device checks, release evidence and rollback rehearsal |

### Required workflow for every design or frontend task

1. **DISCOVER**: locate relevant installed `frontend-design`, `ui-ux`, `design-system`, `react`, `animation`, or `accessibility` skill (actual names may differ). Read its full instructions and any required references **before writing UI code**.
2. **PLAN**: cite the approved portfolio mockup/visual direction, identify component states, mobile/tablet/desktop behavior, Arabic RTL and English LTR, dark/light, keyboard navigation, and motion limits.
3. **BUILD**: follow the skill's recommended design workflow, while preserving approved stack (React + Vite + JavaScript; no TypeScript) and architecture. Skills do not override the approved decisions.
4. **VISUALLY VERIFY**: run the app, capture screenshots at mobile/tablet/desktop sizes and both directions where relevant; inspect screenshots and compare against the approved design. Fix spacing, hierarchy, contrast, overflow, and interaction states.
5. **TEST**: invoke available frontend-testing/Playwright/accessibility skills; write Vitest/React Testing Library tests and relevant Playwright checks. Verify `prefers-reduced-motion`, keyboard focus, hover/focus parity, and no horizontal overflow.
6. **REPORT**: record which skills were used, which were unavailable, screenshots/artifact locations, test commands/results, and visual review outcome.

### Required workflow for every testing task and each phase gate

1. **DISCOVER**: locate and read installed `testing`, `test-driven-development`, `systematic-debugging`, `playwright`, `webapp-testing`, `security-testing`, or `verification-before-completion` skills, as applicable; actual names vary by agent.
2. **DESIGN TESTS FIRST**: derive positive, negative, edge, authorization, privacy, bilingual, responsive and error-state cases from the task acceptance criteria; document them before implementation.
3. **EXECUTE RED → GREEN → REFACTOR**: prove the new test fails for the expected reason, implement minimally, rerun it and related regressions; record commands and real outputs.
4. **BROWSER/INTEGRATION**: use the testing skill's supported browser automation (prefer Playwright where available), with isolated fixtures/mocked third parties and screenshots/traces for failures.
5. **DEBUG**: when tests fail, use the available systematic debugging skill; identify root cause, add regression test, fix, rerun. Never mark a task done with failing required tests.
6. **VERIFY BEFORE COMPLETION**: run the full phase test matrix and relevant quality checks; inspect evidence, not just exit-code claims; log results in `docs/PROGRESS.md`.

### Skill activation checkpoints (must be explicitly logged)

- **At the start of each phase:** re-discover and read the matching design/frontend/testing skills; versions and availability may change.
- **Before the first UI implementation in each task:** activate the design/frontend skill; do not postpone it until after code is written.
- **Before writing tests and at the phase acceptance gate:** activate the testing/TDD/Playwright skill appropriate to that test layer.
- **When debugging:** activate systematic debugging skill if available.
- **Before claiming a phase complete:** activate verification/review skill if available and capture proof.

Task report MUST add:
```
Skills discovered:
Skills activated/read (exact names and locations):
Unavailable skills and fallback checklist:
Design artifacts/screenshots reviewed (for UI tasks):
Test skill applied and evidence:
```

## 3. Cross-cutting test strategy

| Layer | Tool | Required coverage focus |
|---|---|---|
| Laravel unit | PHPUnit | business rules, ranking, publishing, consent, cleanup, transformations |
| Laravel feature/integration | PHPUnit + test MySQL | auth, permissions, validation, CRUD, SQL relations, mail, jobs, migrations |
| React unit/components | Vitest + React Testing Library | states, forms, accessible controls, language, theme, blocks |
| Browser E2E | Playwright | public browsing, admin workflows, upload mocks, draft/publish, filters, mobile |
| SSR/SEO | Node test + HTTP assertions + Playwright | HTML content, hydration, meta, canonical, OG, sitemap, hreflang |
| Security | PHPUnit + automated dependency checks | IDOR, CSRF, XSS, upload validation, rate limits, secrets |
| Operations | shell/integration + runbook | backup/restore, health checks, failed deploy rollback, alert delivery |

**Global commands (scripts to implement):**
```
cd backend && php artisan test
cd backend && php artisan migrate --env=testing
cd frontend && npm ci && npm run lint && npm run test -- --run && npm run build
cd e2e && npm ci && npx playwright test
# run local SSR and API first, then:
curl -fsS http://localhost:8000/api/v1/health
curl -fsS http://localhost:3000/ar/
curl -fsS http://localhost:3000/en/
```
Note: exact scripts and ports must be verified in implementation. Never run migrations against production during tests.

## 4. Phase 01 — Foundation (Tasks 01.01–01.08)

**01.01 Repository and documentation.** Create `.gitignore`, `.editorconfig`, `README.md`, `docs/{ARCHITECTURE,DECISIONS,LOCAL_SETUP,PROGRESS}.md`, root folder layout. Verify `git status`, `git diff --check`, `git check-ignore backend/.env frontend/node_modules`. Gate: no secrets or vendor directories tracked.

**01.02 Laravel API bootstrap.** Create Laravel in `backend/`, `routes/api.php`, `app/Http/Controllers/Api/V1/HealthController.php`, `tests/Feature/Api/HealthTest.php`. RED: 200 JSON health response test; GREEN endpoint. Verify `php artisan route:list --path=api`, `php artisan test --filter=HealthTest`, `curl -i localhost:8000/api/v1/health`. Gate: deterministic JSON, no sensitive info.

**01.03 MySQL.** Configure `backend/.env.example`, migrations, isolated test DB, `tests/Feature/Database/SchemaTest.php`. Test schema constraints, migration up/down on disposable DB, no prod connection. Verify `php artisan migrate:status`, `php artisan migrate --env=testing`, `php artisan test --filter=SchemaTest`.

**01.04 React/Vite.** Set up `frontend/package.json`, `src/app/{App,routes}.jsx`, `src/pages/{HomePage,AdminPlaceholder}.jsx`, `src/styles/{tokens,global}.css`, `vite.config.js`; Vitest smoke tests. Verify `npm run dev`, `npm run test -- --run`, `npm run build`.

**01.05 SSR.** `src/entry-client.jsx`, `src/entry-server.jsx`, `server/index.js`, `tests/ssr.test.jsx`. RED: HTML includes title before JS; GREEN SSR + hydration. Test no mismatch and prod build/serve. Verify `npm run build`, production SSR start script, `curl -s localhost:3000/ar/`.

**01.06 Localization.** `src/i18n/{ar,en}.json`, `config.js`, `LanguageSwitcher.jsx`, tests. Assert `/ar/` has `<html lang="ar" dir="rtl">`, `/en/` en/ltr; switching works, no hydration mismatch; fallback behavior. Verify Vitest and curl both routes.

**01.07 Test harness.** `frontend/vitest.config.js`, `frontend/tests/setup.js`, `backend/phpunit.xml`, `e2e/playwright.config.js`, `e2e/tests/home.spec.js`. Tests: PHP feature, React component, E2E desktop/mobile smoke, language toggle. Verify all suites locally.

**01.08 CI.** `.github/workflows/ci.yml` with PHP/Node/MySQL, composer/npm caches, lint, tests, build, Playwright; pull-request checks for `main`/`dev`. Verify `gh workflow list`, `gh run list --limit 5`, intentionally failing test blocks CI. No deploy yet.

**Phase 01 gate:** clean setup from README, healthy API, isolated MySQL, working SSR HTML, localized routes, all tests and CI green.

## 5. Phase 02 — Authentication and Admin Shell (Tasks 02.01–02.08)

**02.01 Admin user model/seed.** `backend/database/seeders/AdminUserSeeder.php`, user factory, `tests/Feature/Auth/AdminSeedTest.php`. Seed one admin idempotently; password from secure environment or one-time bootstrap, never hardcode. Tests: repeated seed no duplicate; no public registration.

**02.02 Sanctum sessions/CSRF.** Auth controller, session config, routes, tests. Tests: login valid/invalid, session rotation, logout invalidation, CSRF rejection, cookie flags in prod config. `php artisan test --filter=Auth`.

**02.03 Authorization.** `app/Policies/*`, middleware, route guards. Tests: unauthenticated 401/redirect as appropriate; authenticated admin allowed; malicious object ID cannot bypass policy; no open registration. `php artisan route:list --path=api`.

**02.04 Rate limiting and brute-force protection.** Laravel limiter and auth events. Tests: repeated failed logins hit 429, successful login behavior, audit logs redact secrets.

**02.05 Admin shell UI.** `frontend/src/layouts/AdminLayout.jsx`, sidebar/header/nav, login page, protected routes. Component tests: loading/unauthenticated/authorized, keyboard nav, mobile drawer.

**02.06 Profile/password.** Endpoint and settings page. Tests: old password required, strong new password, other sessions invalidated if policy specifies, password never echoed.

**02.07 Admin audit log.** Log sensitive mutations/login events without payload secrets. Tests: events captured, timestamps and actor, no passwords/tokens.

**02.08 E2E auth.** `e2e/tests/admin-auth.spec.js`: successful login, wrong password, refresh session, logout, blocked admin route, mobile UI. Verify full PHPUnit/Vitest/Playwright.

**Phase 02 gate:** admin can securely log in/out; anonymous users cannot access admin API; protected shell works on mobile.

## 6. Phase 03 — Projects, Categories, Media (Tasks 03.01–03.12)

**03.01 Schema and factories.** Migrations/models for projects, translations, categories, pivots, tools, media, status, soft deletes. Tests: FK, unique slug, locale uniqueness, ordering, factory generation.

**03.02 Project CRUD API.** Controller, Form Requests, Resources, Policies. Tests: create/edit/read/list, invalid inputs 422, unauthorized 401/403, localized fields, duplicate slug 422, pagination.

**03.03 Category CRUD/reorder.** Tests: create/rename/delete, locale validation, sort order stable, prevent orphan/unintended project deletion, multiple categories per project.

**03.04 Tools and project metadata.** Tests: filterable year/tools, duplicate tool relation prevented, metadata normalized.

**03.05 Cloudinary adapter.** `app/Services/Media/MediaStorageInterface.php`, `CloudinaryMediaStorage.php`, fake implementation. Tests mock provider errors, upload metadata, no secret exposure, allowed formats JPG/PNG/WebP, MIME magic-byte checks, size/dimension caps, safe names.

**03.06 Multi-image upload UI/API.** Drag/drop, progress, cancel, per-file retry, concurrency limits. Tests: 1/20 images, partial failures, duplicate request idempotency, interrupted upload, accessible status messages. Playwright network mocks.

**03.07 Media ordering/cover.** Tests: deterministic sort, exactly one valid cover, cross-project media assignment denied, missing media rejected, concurrency conflict handling.

**03.08 Watermark variants.** Provider transforms or server-generated baked-in variants; originals protected and not overwritten. Tests: toggle affects display URL, original reference unchanged, no watermark for disabled projects, variant invalidation.

**03.09 Project drafts/publish.** Tests: draft excluded public, publish atomically swaps snapshot/status, unpublished changes do not leak, preview restricted.

**03.10 Trash/restore/30-day purge.** Tests: soft-deleted hidden, restored before cutoff, scheduled cleanup after cutoff, shared media not removed, provider failure retried, audit events.

**03.11 Admin project/category pages.** React listing, create/edit, forms, image management, status badges, trash. Tests: validation, loading/empty/error, reorder keyboard option, unsaved changes warning.

**03.12 E2E content workflow.** Login -> create bilingual project -> upload multiple mock images -> reorder -> assign categories -> publish -> visible public -> soft-delete -> restore. Run full suites.

**Phase 03 gate:** reliable end-to-end content management; original images preserved; public never sees draft/deleted projects.

## 7. Phase 04 — Public Website and Motion (Tasks 04.01–04.11)

**04.01 Design system.** Tokens, fonts (licensed/publicly available), buttons, cards, inputs, layout primitives. Tests: accessibility roles, focus, responsive snapshot checks; no embedded proprietary font files.

**04.02 Global header/footer.** Nav, language/theme switchers, social links, mobile menu. Tests: RTL order, keyboard navigation, menu close, persistence.

**04.03 Homepage.** Hero, featured projects, category preview, services, about, contact CTA. Tests: server HTML content, missing content fallbacks, featured ordering.

**04.04 Gallery.** Responsive cards, category tabs, pagination or load-more, hover, skeleton/empty/error states. Tests: no layout shift with image aspect ratios, accessible image alt.

**04.05 Project details.** Cover, thumbnails, full image viewer, metadata, dynamic layout renderer, next/previous. Tests: image ordering, invalid slug 404, SEO localized, mobile carousel controls.

**04.06 About page.** Biography, skills, experience and downloadable CV only if admin supplies it. Tests: translated content, missing asset fallback.

**04.07 Contact page.** Contact methods, validated form UI, success/failure states; actual email integration in Phase 07. Tests: field validation, keyboard, no accidental duplicate submit.

**04.08 Theme.** Light/dark, initial SSR theme handling without flash where feasible. Tests: toggle, persistence, contrast, no hydration warning.

**04.09 Motion.** Scroll reveal, hover transforms, image transitions, subtle float. Tests: reduced-motion disables nonessential motion, animations never block interaction, no horizontal overflow.

**04.10 Responsive/accessibility.** Test viewport widths 360/390/768/1024/1440, keyboard navigation, focus visible, labels, alt text, semantic headings; run automated accessibility checks plus manual review.

**04.11 Public E2E.** Home -> gallery -> category -> project -> related -> contact; Arabic/English and dark/light; mobile and desktop screenshots.

**Phase 04 gate:** approved visual direction reproduced, public pages SSR, mobile responsive, subtle accessible motion.

## 8. Phase 05 — Flexible Page Builder and Publishing (Tasks 05.01–05.12)

**05.01 Block schema.** Versioned JSON schema for hero, text, image, gallery, columns, spacer, CTA, stats, services, category preview, featured work, heading. Tests: accept valid blocks, reject malformed/unknown unsafe attributes.

**05.02 Server block validator.** Strict allowlist of styles, sizes, spacing, colors, animation tokens; no arbitrary script/HTML. Tests: XSS payload rejected/sanitized, nested depth/size limits, invalid references.

**05.03 Shared block renderer.** React components for each block, SSR-safe, responsive. Component tests for each type, fallback for unknown version, missing asset.

**05.04 Builder UI canvas.** Add/remove/duplicate/reorder blocks, property inspector. Tests: editing updates preview, undo not required, keyboard reordering alternative.

**05.05 Layout controls.** Columns, gaps, alignment, backgrounds, type scales, image aspect ratios, motion presets. Tests: constrained values, mobile stacking, no unsafe CSS injection.

**05.06 Image/text blocks.** Media picker and bilingual text. Tests: asset selection, alt text, translation fallback, no leaked unpublished media.

**05.07 Device previews.** Desktop/tablet/mobile viewport controls; tests verify layout switching and state consistency.

**05.08 Draft save.** Debounced or explicit save with optimistic concurrency/versioning. Tests: stale update conflict, failed save retains editor changes, published page unaffected.

**05.09 Secure preview.** Admin-only or short-lived signed preview URL, noindex, no cache. Tests: anonymous denied, expired signature denied, draft visible only authorized.

**05.10 Atomic publish.** Transaction creates immutable published snapshot and updates pointer; invalidate relevant caches/sitemap. Tests: rollback on failure, previous version stays public, localized completeness policy.

**05.11 Project layout builder.** Reuse renderer with restricted blocks; tests: project-specific media permissions, dynamic layout on detail page, published snapshot isolation.

**05.12 Builder E2E.** Edit hero -> add gallery -> reorder -> preview -> publish -> SSR public updated -> draft edit does not change public. Verify all suites.

**Phase 05 gate:** owner can edit pages without code; drafts cannot affect public until explicit publish; renderer is secure and SSR compatible.

## 9. Phase 06 — Search, Recommendations, Consent, Analytics (Tasks 06.01–06.12)

**06.01 Search indexes/query.** Bilingual title, summary as applicable; strict filtering. Tests: Arabic/English query, case normalization, pagination, SQL injection resistance, no drafts.

**06.02 Filters/sorting.** Category, tools, year, newest, most viewed. Tests: combined filters, empty results, stable ordering, invalid sort rejected.

**06.03 Search UI.** Search box, filter chips, clear filters, URL query sync. Tests: keyboard, debounce, back/forward state, loading/error/empty.

**06.04 Recommendation scoring.** Rule-based weighted categories/tools/recency/popularity; documented weights. Tests: excludes current/draft/deleted, deterministic ranking, no duplicate results.

**06.05 Consent UI.** Accept/reject/settings/withdraw in Arabic and English; no pre-ticked consent. Tests: refusal blocks personalized tracking, acceptance enables, withdrawal stops future collection.

**06.06 Consent backend/privacy.** Minimal pseudonymous preference records and expiration; test unauthorized data linkage, withdrawal deletion or deactivation, retention schedule.

**06.07 Personalized ranking.** Use consented browsing interests only; generic fallback. Tests: same anonymous session without consent receives generic ranking; withdrawal resets personalization.

**06.08 Analytics events.** Track permitted page/project views, approximate unique counts, referral categories; avoid storing raw IP indefinitely. Tests: consent rules, bot filtering heuristic, idempotent event handling.

**06.09 Aggregation/retention.** Scheduled daily rollups and raw-event expiry. Tests: day boundary, timezone consistency, deduplication, TTL purge, large dataset query performance.

**06.10 Analytics API.** Protected endpoints for counts, top projects, traffic sources, date ranges. Tests: unauthorized blocked, invalid date rejected, correct aggregates.

**06.11 Dashboard charts.** Visits trend, top projects, referrals, consent-safe metrics. Tests: loading/empty/errors, date filtering, chart accessibility text.

**06.12 E2E discovery/privacy.** Search/filter -> related recommendations; reject consent -> no personal events; accept -> personalized; withdraw -> generic; admin analytics display.

**Phase 06 gate:** discovery useful, recommendation deterministic, optional behavioral tracking never runs without consent, analytics privacy controls verified.

## 10. Phase 07 — SEO, Contact, Performance (Tasks 07.01–07.10)

**07.01 SSR metadata.** Per-language title/description/OG image and locale. Tests: view-source HTML includes metadata before JS, no draft indexing.

**07.02 Canonical/hreflang.** Tests: canonical points to correct language URL, bidirectional hreflang, no duplicate canonical, valid 404 status.

**07.03 Sitemap/robots.** Sitemap for published public routes, translated alternates, excludes deleted/draft/preview; robots disallow admin/preview; tests for XML correctness and updates.

**07.04 Structured data.** Appropriate Person/CreativeWork/Website JSON-LD where accurate; tests valid JSON, escaping and no fabricated claims.

**07.05 Contact email integration.** Backend request validation, mail adapter, SMTP/API provider configuration, queue/retry as needed. Tests: valid message dispatched once, invalid fields rejected, injection/spam/rate limit, provider failure safe, no permanent inbox required.

**07.06 Social/contact settings.** Admin configurable links and email; URL allowlist; tests safe URL protocols, missing link hidden.

**07.07 Image performance.** Cloudinary `srcset`/sizes, next-gen formats, dimensions, lazy load below fold, hero eager/preload where justified. Tests: correct widths, no CLS, watermark variant used.

**07.08 JS/SSR performance.** Route splitting, cache headers, server data caching with invalidation after publish, streaming only if warranted. Tests: published content refreshes after invalidation, private content never cached publicly.

**07.09 Web vitals and accessibility.** Lighthouse/Playwright audits on mobile, representative pages; record baselines and budgets (targets chosen after measurement). Tests: no severe accessibility violations; reduced motion honored.

**07.10 SEO/contact E2E.** Public source HTML, sitemap, sharing metadata, contact success/error with mocked provider, mobile performance smoke.

**Phase 07 gate:** indexable localized public content, working safe contact form, measured mobile performance and no critical regressions.

## 11. Phase 08 — Security, Reliability, Backups, Monitoring (Tasks 08.01–08.12)

**08.01 Security audit.** Auth, role policy, IDOR, SQL injection, XSS, CSRF, SSRF, open redirects; tests for representative attacks and boundary conditions.

**08.02 Upload hardening.** MIME sniffing, dimensions/bytes caps, image re-encoding/provider transform, safe asset identifiers, no executable file serving. Tests: disguised PHP, huge image, invalid mime, unauthorized asset.

**08.03 Security headers/TLS.** CSP appropriate for SSR/Cloudinary, HSTS in production, X-Content-Type-Options, frame/referrer policy; tests inspect headers and ensure scripts function.

**08.04 Error contract.** Consistent localized errors, error boundary pages, safe 404/500, no stack traces in prod. Tests for backend exception and SSR failure.

**08.05 Retry/idempotency.** Upload, email, cleanup, publish jobs with bounded retries/backoff and idempotency keys. Tests: repeated requests do not duplicate records or sends, transient provider failures recover.

**08.06 Audit logs and redaction.** Admin actions and errors; tests no tokens, passwords, message bodies or secrets leaked.

**08.07 Backup job.** Encrypted MySQL dump and essential configuration/metadata manifest to off-server provider, 7-day retention; never commit encryption key. Tests: archive integrity, encryption, retention policy, failed upload alert.

**08.08 Restore drill.** Restore to isolated disposable database and validate record counts/references; document RPO/RTO and Cloudinary image backup limitation. Test script checks expected schema and sample records.

**08.09 Trash cleanup scheduler.** Run daily; tests 30-day boundary, shared media safety, retries, idempotent deletes.

**08.10 Health checks.** Separate app/API/SSR readiness, DB dependency health; tests degraded response and no secret disclosure.

**08.11 Monitoring.** CPU/RAM/disk, uptime checks, log rotation, mail alerts; tests synthetic outage notification, alert deduplication, recovery notice.

**08.12 Reliability E2E.** Simulate Cloudinary/mail failure, database rollback, restore drill, SSR 500 page, recovery. Verify security scans and tests.

**Phase 08 gate:** no known critical security flaws, encrypted off-server backup successfully restored, alarms proven, safe error behavior.

## 12. Phase 09 — CI/CD, Oracle Deployment, Release (Tasks 09.01–09.12)

**09.01 Production readiness inventory.** Owner provides domain, Oracle account/VM, Cloudinary credentials, email provider, backup destination, DNS access; check Always Free availability and quotas. No assumptions.

**09.02 Infrastructure scripts.** Nginx, PHP-FPM, Node SSR service manager, MySQL, firewall, TLS, log rotation. Tests: config validation (`nginx -t`), service startup, firewall ports, cert renewal dry run.

**09.03 Secrets/environment.** GitHub Actions secrets, server environment, least privilege, rotated deploy keys. Tests: secrets absent from logs/repo, restricted permissions.

**09.04 CI final.** GitHub workflow PHP/MySQL, JS, Playwright, dependency audits, build; required status checks on main. Tests: deliberately broken test blocks merge/deploy.

**09.05 Deployment workflow.** Merge to main -> build artifacts -> deploy via secure channel -> migrations with safe strategy -> service reload -> health check. Tests: staging/dry run and artifact integrity.

**09.06 Rollback.** Preserve previous release, reversible application switch; handle incompatible DB migrations via expand/contract. Tests: forced failure restores previous healthy app.

**09.07 Production smoke.** `/ar/`, `/en/`, `/api/v1/health`, project details, auth, contact (test recipient), images, SSR source, sitemap, HTTPS.

**09.08 Browser matrix.** Chromium/Firefox/WebKit where available; mobile viewport, dark/light, RTL/LTR, keyboard and reduced motion.

**09.09 Security/SEO audit.** TLS, headers, sitemap, OG, canonical, robots, indexing of public only, no admin drafts exposed; dependency vulnerability review.

**09.10 Performance acceptance.** Lighthouse/Web Vitals recorded for home/gallery/details on mobile; tune images and SSR; document target thresholds and measured values.

**09.11 Backup/monitoring live drill.** Verify encrypted remote backup, restore in isolated env, synthetic outage email alert, log rotation and disk headroom.

**09.12 Release sign-off.** Owner reviews design, content, legal/privacy copy, operational runbooks; release tag, changelog, deployment report and known limitations. Only then declare production-ready.

**Phase 09 gate:** all acceptance checks green, owner approves go-live, monitoring and restore tested, documented rollback.

## 12.1 Phase 10 — Hybrid Single-Page Experience Redesign (Tasks 10.01–10.11)

Per owner Master Directive (2026-11-01), the public frontend is elevated into a continuous, immersive, Apple/iOS-inspired Hybrid Single-Page Experience. This phase restructures public presentation into ONE continuous homepage with independent project-detail pages, powered by GSAP + ScrollTrigger and an Apple-inspired design system.

**10.01 Design system & tokens.** Apple Human Interface Guidelines tokens: clamp display typography (`clamp(3.5rem, 8vw, 8.5rem)`), subtle glassmorphism (`backdrop-blur-md`), 1px translucent borders, refined stone/amber dark & light palettes, accessible contrast. Tests: token snapshot, contrast checks, focus-visible.

**10.02 Hybrid global navigation.** Header with smooth anchor scrolling to `#work`, `#about`, `#skills`, `#contact` on homepage; routes cleanly to `/:locale/#section` from standalone project pages. Deep linking and back/forward history preserved. Tests: anchor navigation, active state, drawer toggle, keyboard accessibility.

**10.03 Cinematic hero section.** Full-viewport hero, status pill (`AVAILABLE FOR SELECT COMMISSIONS`), oversized editorial title, staggered text reveals, subtle ambient glow, and animated scroll affordance. Tests: SSR headline rendering, RTL layout symmetry, reduced-motion bypass.

**10.04 Selected work interactive showcase.** The visual centerpiece: pinned GSAP ScrollTrigger horizontal track on desktop with scrubbed progress bar, card parallax, and interactive hover zoom. Graceful touch swipe fallback on mobile. Links to dedicated project detail pages. Tests: horizontal track rendering, dynamic Laravel API data binding, keyboard tab navigation, reduced-motion bypass.

**10.05 Editorial about section.** Asymmetric editorial composition with biography, design philosophy cards, high-contrast whitespace, and scroll-triggered reveals. Tests: CMS content rendering, translation integrity, responsive layout.

**10.06 Skills & creative capabilities matrix.** Interactive typography-first capabilities matrix (Brand Identity, Packaging, Editorial, Digital Direction) without generic progress bars. Tests: category mapping, hover states, keyboard focus.

**10.07 Creative journey & milestones timeline.** Chronological milestone archive with monumental year typography (`2024`, `2023`, `2022`) and project/recognition cards. Tests: year rendering, hover interaction, responsive mobile stacking.

**10.08 Full-screen cinematic contact section.** Full-bleed closing section, high-impact CTA, live contact form with CSRF protection, anti-spam honeypot, and real-time validation. Tests: field validation, duplicate submit lock, accessible alerts.

**10.09 Dynamic project detail pages.** Standalone, SEO-optimized detail routes (`/:locale/projects/:slug`) featuring full-bleed hero media, metadata chips, editorial layout, ordered media gallery, lightbox viewer, and next/prev project navigation. Tests: route loading, slug resolution, 404 fallback, SEO metadata.

**10.10 Responsive & reduced-motion accessibility hardening.** Multi-breakpoint review (390px, 768px, 1024px, 1440px), touch gestures, keyboard flow (`Tab`, `Escape`), visible focus rings, WCAG 2.1 AA compliance, and complete `prefers-reduced-motion` compliance. Tests: automated accessibility suite, reduced motion zeroing.

**10.11 Playwright visual & motion verification.** Full E2E visual verification across Desktop Chromium and Mobile Chrome. Validates scroll-driven animations, captures desktop and mobile screenshots, verifies RTL/LTR symmetry, and tests reduced-motion behavior. Tests: 12 visual & motion E2E scenarios passed.

**Phase 10 gate:** continuous animated homepage verified in real browsers (desktop + mobile); independent project detail pages fully functional; zero backend/API/admin regressions; visual evidence recorded.

## 13. Mandatory E2E scenario catalog

| ID | Scenario | Expected result |
|---|---|---|
| E2E-01 | Open Arabic home with JS disabled / inspect HTML | localized SSR content and SEO visible |
| E2E-02 | Switch Arabic to English | translated text, LTR, correct URL and hreflang |
| E2E-03 | Toggle theme and reload | persisted correct theme without flash/hydration error |
| E2E-04 | Browse gallery -> project -> next/related | published content and correct media order |
| E2E-05 | Search Arabic term and combine filters | correct results, URL state, no drafts |
| E2E-06 | Admin login/logout, invalid password, direct protected URL | authorized access only, rate limits |
| E2E-07 | Create bilingual project, upload 5 images, retry one failure | progress/retry and saved ordering |
| E2E-08 | Publish project then edit draft | public remains prior published snapshot until republish |
| E2E-09 | Trash project and restore | hidden while trashed, restored afterward |
| E2E-10 | Edit page builder blocks, preview, publish | draft isolated, public SSR updates after publish |
| E2E-11 | Reject tracking consent | no optional behavioral tracking; generic recommendations |
| E2E-12 | Accept then withdraw tracking | personalization only while consented; withdraw honored |
| E2E-13 | Submit contact form and trigger provider error | exactly one send when successful, safe error otherwise |
| E2E-14 | Keyboard-only/mobile/reduced motion | navigable, responsive, no excessive animation |
| E2E-15 | Simulate API/SSR outage | localized error UI, health alert, recovery |
| E2E-16 | Restore encrypted off-server backup | valid isolated database restore |
| E2E-17 | Fail CI test or deployment health check | no bad release; rollback or deployment halted |

## 14. Global acceptance criteria (Decision 037)

- [ ] All approved v1 features function on desktop and mobile.
- [ ] Public HTML server-rendered and SEO metadata correct for Arabic and English.
- [ ] Published vs draft isolation demonstrated in API and browser tests.
- [ ] Admin authorization, rate limits, CSRF, XSS/IDOR, uploads and headers reviewed.
- [ ] PHPUnit, Vitest, Playwright and required CI checks pass on current commit.
- [ ] Consent rejection and withdrawal tested; analytics comply with configured policy.
- [ ] Core Web Vitals measured and major performance issues addressed.
- [ ] Backup encryption, remote retention and restore drill verified.
- [ ] Monitoring, alert delivery and rollback tested.
- [ ] Owner approves visual QA and release; docs/runbooks current.

## 15. Definition of Done for each task

- Relevant installed skills discovered, read and applied at task start; exact names/paths and fallbacks logged (Section 2A).
- Failing test first (when testable), then passing implementation; relevant regression tests green.
- Input validation, authorization, error handling and locale coverage considered.
- Responsive/keyboard/accessibility reviewed for UI tasks.
- No secrets or unnecessary dependencies; no production side effects.
- Changed files and exact test output recorded in `docs/PROGRESS.md`.
- Focused commit with task ID, e.g. `feat(projects): implement create API [03.02]`.
- Phase-level gate approved before moving to next phase.

## 16. External prerequisites / owner handoffs

**At start:** existing GitHub repo URL or permission to create a new repo; local OS and versions; whether agent has filesystem/Git access.

**Before Cloudinary:** account and secret access through secure environment only; free-tier quotas confirmed.

**Before contact emails:** verified sending provider, sender domain and test recipient; provider pricing/limits confirmed.

**Before backup:** encrypted remote storage provider, keys and restore destination; retention agreed.

**Before production:** Oracle account/VM capacity, domain/DNS, SSH/deploy credentials, TLS, legal/privacy copy, go-live approval.

If prerequisite missing, implement local adapters/mocks and mark blocked production integration; do not invent credentials or claim integration succeeded.

## 17. Execution sequence and reporting format

Implement tasks across all phases in order (`01.01` through `10.11`), respecting dependencies. Continue autonomous sequential execution without stopping between tasks or sections. Maintain this report after every task:

```
Task ID:
Status: NOT_STARTED | IN_PROGRESS | BLOCKED | DONE | REWORK_REQUIRED
Files changed:
Tests written first:
Skills discovered/activated and evidence:
Design screenshots/review (if UI):
Commands executed and exact results:
Security/privacy/SEO considerations:
Commit hash:
Blockers/owner inputs:
Next task:
```

Execute all tasks sequentially on dedicated feature branches, verify each slice with targeted tests and browser inspection, record progress in `docs/PROGRESS.md`, and merge into `dev`.
