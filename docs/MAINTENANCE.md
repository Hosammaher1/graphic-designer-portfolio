# Mohammed Maher Portfolio — Operations & Maintenance Manual

This manual provides operational procedures, automated testing instructions, health monitoring standards, incident triage playbooks, backup/restore runbooks, and critical engineering safeguards for maintaining the **Mohammed Maher Portfolio**.

---

## 1. Automated Testing & Verification Suites

### 1.1 Frontend Unit & Component Tests
The frontend uses **Vitest** configured in [`frontend/vitest.config.js`](file:///D:/programming/mohammed-Portfolio/frontend/vitest.config.js) with jsdom:
```bash
cd frontend
npm run test -- --run
```
- **Coverage:** Tests design system primitives, modals, language switchers, anti-spam validation, theme toggling, data formatting, skeletons, SSR pre-rendering, and accessibility landmarks.
- **Expected Results:** 42 test suites, 237 passing tests covering all core UI components.

### 1.2 Backend PHPUnit Tests
The backend test suite is configured in [`backend/phpunit.xml`](file:///D:/programming/mohammed-Portfolio/backend/phpunit.xml) and targets an isolated database (`portfolio_testing`):
```bash
cd backend
php artisan test
```
- **Key Test Filters:**
  - `php artisan test --filter=HealthCheckEndpointTest` (verifies live/ready probes)
  - `php artisan test --filter=ProjectApiTest` (verifies published project filtering)
  - `php artisan test --filter=ContactFormTest` (verifies honeypot anti-spam and validation)
  - `php artisan test --filter=MediaUploadTest` (verifies MIME sniffing and size bounds)

### 1.3 Playwright End-to-End Suites
Configured in [`e2e/playwright.config.js`](file:///D:/programming/mohammed-Portfolio/e2e/playwright.config.js) across Desktop Chromium and Mobile Chrome (Pixel 5 / iPhone 12):
```bash
cd e2e
npx playwright test
```
- **Targeted Verification Scripts:**
  - `node e2e/tests/verify-dynamic-loading-and-skeletons.cjs`: Tests slow 3G/4G network simulation (1000ms delay), verifies that 72+ elegant skeleton/shimmer placeholders appear during initial loading, confirms zero hardcoded demo text/stats ("50+", "20+", "5+"), verifies smooth data replacement upon arrival, validates Arabic RTL, tests all 6 mobile sections, and verifies non-blocking localized error recovery on API 500 failure.
  - `node e2e/tests/verify-all-sections-mobile.cjs`: Verifies that all 7 sections (`#hero`, `#selected-work`, `#about-me`, `#skills-expertise`, `#creative-journey`, `#contact`, `footer`) are 100% visible on scroll on mobile viewports across repeated reloads with zero black screen.
  - `node e2e/tests/verify-all-locales.cjs`: Verifies HTTP status, DOM attributes (`lang`, `dir`), and interactive language switching across `/`, `/en/`, and `/ar/`.

---

## 2. Operations & Health Monitoring

### 2.1 Health Check Endpoints

| Endpoint | Expected Status | Purpose | Failure Interpretation |
|---|---|---|---|
| `GET /api/v1/health/live` | `200 OK` | Process liveness | PHP-FPM process or container is frozen. Restart web container. |
| `GET /api/v1/health/ready` | `200 OK` | Service readiness | Database or cache failure. Inspect MySQL connection and disk headroom. |
| `GET /api/v1/health` | `200 OK` | Detailed triage | Reports structured status for `database`, `cache`, `storage`, and `queue`. |

### 2.2 Scheduled Tasks
The backend registers automated cron jobs in `backend/app/Console/Kernel.php`:
```bash
cd backend
php artisan schedule:list
```
1. **Daily Trash Purge:** `projects:purge-trash --days=30` (runs daily at midnight to permanently prune soft-deleted items older than 30 days).
2. **Encrypted Database Backup:** `backup:run` (runs daily at 02:00 UTC).
3. **System Telemetry Probe:** `monitor:check --alert` (executes every 5 minutes to verify service health and send alerts if outages are detected).

### 2.3 Queue Workers
All background operations (email dispatch, image cleanup, system checks) run via Laravel's database queue:
```bash
cd backend
# Inspect pending jobs
php artisan queue:monitor default
# Inspect failed jobs
php artisan queue:failed
# Retry failed jobs (never run blindly in production)
php artisan queue:retry <id>
```

---

## 3. Incident Response & Troubleshooting Playbook

### 3.1 Public Website Unreachable (HTTP 5xx / Timeout)
1. **Check Vercel Status:** Inspect Vercel deployment status in the dashboard or via CLI: `vercel inspect mohammed-design.vercel.app`.
2. **Check Render Backend:** Verify Render web service logs: `https://dashboard.render.com/web/mohammed-portfolio-api`.
3. **Check Aiven Database:** Verify Aiven MySQL metrics (CPU, RAM, Connections) in the Aiven Console: `mysql-1244d130-mohmmed-ma48`.
4. **Inspect Liveness Probe:** Run `curl -I https://mohammed-portfolio-api.onrender.com/api/v1/health/live`. If 200 OK, the container is up; proceed to test `/health/ready`.

### 3.2 Mobile Black Screen or Blank Page
- The application guarantees zero black screen via pre-rendered SSG HTML (`frontend/dist/client/index.html`) and CSS visibility rules.
- If a blank screen is reported:
  1. Inspect browser console for fatal JavaScript errors.
  2. Verify that pre-rendering executed during the build: `npm run build` must report `[Prerender] Successfully generated dist/client/index.html`.
  3. Verify that `@media (max-width: 1023px)` rule is intact in `frontend/src/index.css`.

### 3.3 Slow Page Reloads (> 5 seconds)
- The application uses a multi-tier instant cache (`localStorage` -> `sessionStorage` -> static defaults).
- If slow reloads occur:
  1. Check if the Render free-tier container is sleeping.
  2. Verify that `fetchWithTimeout` in [`frontend/src/App.jsx`](file:///D:/programming/mohammed-Portfolio/frontend/src/App.jsx) is set to 5000ms.
  3. Verify Vercel Edge Cache headers on SSR responses in [`api/index.js`](file:///D:/programming/mohammed-Portfolio/api/index.js): `Cache-Control: public, max-age=0, s-maxage=60, stale-while-revalidate=86400`.

---

## 4. Backup & Disaster Recovery Runbook

### 4.1 Automated Daily Backups
The `backup:run` Artisan command creates a compressed, AES-256 encrypted SQL dump stored in `backend/storage/app/backups/`.

### 4.2 Manual Backup Trigger
```bash
cd backend
php artisan backup:run --filename=manual-backup-$(date +%Y%m%d).sql.enc
```

### 4.3 Database Restoration Protocol
> [!CAUTION]
> Never restore a database directly onto the live production instance without verifying the dump first.

1. **Spin up an isolated staging database** (e.g., `portfolio_restore_drill`).
2. **Decrypt the SQL dump:**
   ```bash
   openssl enc -d -aes-256-cbc -in backup.sql.enc -out backup.sql -pass file:/path/to/backup.key
   ```
3. **Import into isolated database:**
   ```bash
   mysql -u avnadmin -p -h <host> -P <port> portfolio_restore_drill < backup.sql
   ```
4. **Verify Record Counts:**
   ```sql
   SELECT COUNT(*) FROM projects;
   SELECT COUNT(*) FROM categories;
   SELECT COUNT(*) FROM media_assets;
   ```
5. **Switch Traffic:** Once verified, update `DB_DATABASE` in Render environment variables to cut over cleanly.

---

## 5. Rollback Runbook

### 5.1 Vercel Frontend Rollback
1. Open the **Deployments** tab in the Vercel Dashboard for `graphic-designer-portfolio`.
2. Locate the previous healthy deployment SHA.
3. Click **Instant Rollback**. Traffic is immediately routed to the previous immutable deployment artifact within seconds.

### 5.2 Render Backend Rollback
1. In the Render Dashboard, locate the **Manual Deploy** menu.
2. Select **Deploy specific commit**.
3. Choose the last verified Git commit hash from `dev` or `main`.
4. Trigger deployment. The container rebuilds from the tested image.

### 5.3 Database Migration Rollback Safety
- Always follow the **Expand / Contract** database migration model:
  - Phase 1 (Expand): Add nullable columns, new tables, or optional foreign keys.
  - Phase 2 (Contract): Drop deprecated columns only after all application code stops reading them.
  - **Never** execute `php artisan migrate:fresh` on production or staging environments.
- To roll back the last migration batch safely:
  ```bash
  cd backend
  php artisan migrate:rollback --step=1
  ```

---

## 6. Historical Engineering Safeguards

| Stage | Date | Issue Identified | Engineering Solution |
|---|---|---|---|
| **Stage 25** | 2026-11-06 | 60s Mobile Reload Freeze | Implemented multi-tier instant cache (`localStorage` / `sessionStorage`), converted blocking monolithic `Promise.all` into 3 non-blocking async loaders with a strict 5-second fetch timeout and background retry, and added Vercel edge caching headers. Reload dropped from > 60s to **415ms**. |
| **Stage 26** | 2026-11-06 | Mobile Black Screen | Implemented build-time SSG pre-rendering (`scripts/prerender.js`), added CSS `@media (max-width: 1023px)` safeguard forcing `opacity: 1 !important`, and added mobile GSAP bypass so ScrollTrigger never hides elements on touch devices. |
| **Stage 27** | 2026-11-06 | Multi-Locale Default Routing | Corrected default language architecture across SSR, SSG, and hydration: `/` and `/en/` serve English LTR by default, while `/ar/` serves Arabic RTL. Language switcher dynamically updates history state and document attributes. |
| **Stage 28** | 2026-11-13 | Accessibility & SEO Remediation | Fixed light mode contrast (overrode muted text to `#48404a` for WCAG AAA > 7.5:1), served `/robots.txt` and `/llms.txt` as plain text, corrected heading order (`h1` → `h2` → `h3`), eliminated empty headings, generated canonical production `sitemap.xml`, and reduced public JS bundle size by > 275 kB via lazy-loaded `AdminApp`. |
| **Stage 29** | 2026-11-13 | Dynamic Loading & Skeleton Sync | Eliminated all hardcoded demo text, fake stats ("50+", "20+", "5+"), and placeholder projects. Established Admin Dashboard as single source of truth for all content. Implemented GPU-accelerated skeleton/shimmer loaders matching exact real geometry, synchronized SSR/client hydration without React #418 mismatches, and added localized non-blocking retry states. |

---

## 7. Verification Checkpoint — Stage 29 (Dynamic Loading & Skeletons)

- **Branch:** `feat/dynamic-content-skeletons-and-dashboard-sync`
- **Features Implemented:**
  1. `frontend/src/components/ui/Skeleton.jsx`: Added reusable `Skeleton` and `TextSkeleton` components with GPU-accelerated `.skeleton-shimmer` shimmer animation.
  2. `frontend/src/index.css`: Added `@keyframes skeleton-shimmer` and styling tokens for both Dark Studio and Eclipse Light modes.
  3. `frontend/src/App.jsx`: Initialized dynamic data states (`publishedProjects`, `categories`, `siteSettings`, `journeyMilestones`) to `null` with `isLoading* = true`. Added safe hydration cache restoration inside a client-side `useEffect` to ensure 100% matching SSR hydration without React error #418 while retaining 0ms warm reload.
  4. Skeletons integrated across all dynamic sections:
     - `HeroSection.jsx`: Display headline `<h1>`, kicker, description, and featured 3D card.
     - `AboutSection.jsx`: Profile title/badge, cover portrait, 3 stat counters (projects, clients, years), bio, and designer identity.
     - `SelectedWorkSection.jsx`: 3-card carousel skeletons (left peek, active centered card, right peek).
     - `SkillsSection.jsx`: Section headers, kicker, and descriptions.
     - `JourneySection.jsx`: 4 alternating timeline card skeletons with center node dots.
     - `ContactSection.jsx`: Clickable email, WhatsApp, Instagram cards and availability badge.
     - `AllProjectsScreen.jsx`: 6-card grid and category filter pills.
  5. Localized non-blocking error handling: Component-level retry buttons (`onRetrySettings`, `onRetryProjects`, `onRetryJourney`) on API errors without blocking or blacking out the screen.
- **Verification Suites Executed:**
  - **Vitest Unit/Component Suite:** 42 test files, 237 passed (0 failed).
  - **Vite Build & Pre-render:** `npm run build` generated `dist/client/en/index.html` (76,399 bytes) and `dist/client/ar/index.html` (76,295 bytes) with `skeleton-shimmer` and zero hardcoded demo numbers or fake projects.
  - **Dynamic Loading E2E:** `node e2e/tests/verify-dynamic-loading-and-skeletons.cjs` verified slow network simulation (72 skeletons active), real data arrival, Arabic RTL, mobile viewport heights, and API failure non-blocking resilience.
  - **Mobile Visibility E2E:** `node e2e/tests/verify-all-sections-mobile.cjs` verified 100% visibility for all 7 sections with zero black screen across repeated reloads.
  - **Locale & Hydration E2E:** `node e2e/tests/verify-all-locales.cjs` verified English default on `/` and `/en/`, Arabic RTL on `/ar/`, and interactive language switching without errors.

| **Stage 30** | 2026-11-14 | Cross-Device Architecture Divergence | Refactored application into ONE unified responsive codebase across desktop, tablet, and mobile. Removed artificial mobile-only animation suppressions (`innerWidth < 1024`), unified GSAP motion with safe initial opacity (`0.85`), removed destructive CSS `transform: none !important` rules, fixed Selected Work to strictly respect dashboard-defined featured projects without arbitrary `.slice(0, 3)` substitution, and added native touch swipe gesture navigation to the shared carousel. Verified across Desktop (1440x900), Tablet (iPad 768x1024), and Mobile (iPhone 12 390x844). |

---

## 8. Verification Checkpoint — Stage 30 (Unified Responsive Architecture)

- **Branch:** `feat/unified-responsive-architecture`
- **Core Architectural Standard:** ONE application, ONE source of truth, ONE shared business logic across all devices.
- **Divergence Removed & Standardized:**
  1. **Selected Work Carousel Synchronization:**
     - Replaced arbitrary `passedProjects.slice(0, 3)` with explicit dashboard-driven featured project filter (`passedProjects.filter(p => Boolean(p.featured))`).
     - Never substitutes standard projects when featured projects are explicitly defined.
     - Preserves dashboard-defined ordering across all devices.
  2. **Multi-Input Carousel Interaction:**
     - Added native touch swipe gesture handling (`onTouchStart`, `onTouchEnd` with horizontal dominant threshold > 40px) in [`SelectedWorkSection.jsx`](file:///D:/programming/mohammed-Portfolio/frontend/src/components/SelectedWorkSection.jsx).
     - Mouse click (arrows and flanking cards), keyboard navigation (`ArrowLeft` / `ArrowRight`), and touchscreen swipe all navigate the same carousel seamlessly.
  3. **Universal Cinematic Motion & Visibility Guarantee:**
     - Removed artificial `isMobile` / `innerWidth < 1024` bailouts from [`HeroSection.jsx`](file:///D:/programming/mohammed-Portfolio/frontend/src/components/HeroSection.jsx), [`AboutSection.jsx`](file:///D:/programming/mohammed-Portfolio/frontend/src/components/AboutSection.jsx), [`SkillsSection.jsx`](file:///D:/programming/mohammed-Portfolio/frontend/src/components/SkillsSection.jsx), [`JourneySection.jsx`](file:///D:/programming/mohammed-Portfolio/frontend/src/components/JourneySection.jsx), and [`AllProjectsScreen.jsx`](file:///D:/programming/mohammed-Portfolio/frontend/src/components/AllProjectsScreen.jsx).
     - Standardized GSAP animations to start from a visible base (`opacity: 0.85, y: 15`), ensuring 100% visible initial paint without black screens on any device.
     - Cleaned up [`index.css`](file:///D:/programming/mohammed-Portfolio/frontend/src/index.css), replacing blunt `transform: none !important; transition: none !important;` rules with accessible `prefers-reduced-motion: reduce` standards.
  4. **Root Default Locale Consistency:**
     - Standardized fallback in [`App.jsx`](file:///D:/programming/mohammed-Portfolio/frontend/src/App.jsx) to return `'en'` by default when accessing `/`, guaranteeing identical default behavior across mobile, tablet, and desktop.
- **Verification Suites & Measured Timings:**
  - **Vitest Unit/Component Suite:** 42 test files, 237 passed (0 failed).
  - **Vite Build & Pre-render:** `npm run build` generated production assets and SSG pre-render with exit code 0.
  - **Playwright Unified Responsive Suite** (`verify-unified-responsive-experience.cjs`):
    - **Desktop (1440x900):** Total load: **139ms** (DOMContentLoaded: 113ms). All 7 sections visible. Modal opened and closed via Escape. Language switched between EN and AR.
    - **Tablet (768x1024 iPad):** Total load: **119ms** (DOMContentLoaded: 109ms). Carousel touch swipe verified (swiped left to advance project). All 7 sections visible.
    - **Mobile (390x844 iPhone 12, 4G emulation):** Repeated reloads verified (3 runs, DOMContentLoaded ~4157ms on throttled 4G) with **zero black screen** (`heroVisible=true, h1Opacity=1`). Mobile hamburger drawer opened and navigated to section. All 7 sections 100% visible.
- **Justification of Retained Device-Specific Behavior:**
  - CSS responsive grid classes (e.g. `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` or `hidden lg:flex` vs mobile drawer menu) are retained strictly for responsive presentation and layout adaptation, in accordance with Section 1 of the requirements.


---

## 9. Verification Checkpoint — Stage 31 (Selected Work & Featured Project Field Reconciliation)

- **Task Title:** Fix Featured Project Field Mismatch & Selected Work Empty State
- **Status:** Complete & Verified in Production
- **Branch / Commit:** `dev` (Commit `4fee8ebc99588f048b471cfdca90c352295d9ebd`, pushed to `origin/dev`)
- **Root Cause Analysis:**
  1. **Field Name Inconsistency Across Layers:**
     - The Admin Dashboard (`AdminContext.jsx`) stored curated project state under `p.featured` and `studio_admin_projects_v2`.
     - Static curation definitions (`portfolioData.js`) stored `isFeatured: true` and `featuredOrder: 1..3`.
     - The Laravel backend (`PublicProjectController.php` & `ProjectResource.php`) only outputted `is_featured: false/true`.
     - When the fallback to all projects was removed in commit `cfb5897`, `passedProjects.filter(p => Boolean(p.featured))` evaluated to `[]` because `App.jsx` only mapped `featured: Boolean(p.is_featured)` from the remote API, ignoring `p.isFeatured`, `p.featuredOrder`, and the dashboard's local storage state `studio_admin_projects_v2`.
  2. **Persistence Boundary:**
     - Admin dashboard toggle calls to `/api/v1/admin/projects/:id` silently bypassed backend persistence when project IDs were string slugs rather than numeric keys, and unauthenticated demo sessions could not write to remote MySQL.
- **Implemented Fixes:**
  1. [`SelectedWorkSection.jsx`](file:///D:/programming/mohammed-Portfolio/frontend/src/components/SelectedWorkSection.jsx): Added robust `isProjectFeatured(p)` helper checking all representation variants (`featured`, `is_featured`, `isFeatured`, `selected`, `is_selected`, `isSelected`, `featuredOrder > 0`, `featured_order > 0`). Added `getProjectFeaturedOrder(p)` to strictly preserve explicit dashboard-saved ordering (`featuredOrder`, `featured_order`, `sort_order`, `order`).
  2. [`App.jsx`](file:///D:/programming/mohammed-Portfolio/frontend/src/App.jsx): Reconciled API project normalization by merging dashboard curation maps (`studio_admin_projects_v2`, `studio_admin_projects`, `studio_featured_projects_cache`). Hydrates featured flags and exact ordering on mount, cache restoration, and API fetches. Added real-time event listener for `studio:projects-updated` and `storage`.
  3. [`AdminContext.jsx`](file:///D:/programming/mohammed-Portfolio/frontend/src/admin/context/AdminContext.jsx): Prevented `fetchProjects()` from erasing local featured states by merging with `studio_admin_projects_v2`. Updated `toggleFeaturedProject()` to sync `studio_published_projects_cache` and dispatch `studio:projects-updated` in real-time. Supports updating endpoints by slug or numeric ID.
  4. [`ProjectController.php`](file:///D:/programming/mohammed-Portfolio/backend/app/Http/Controllers/Api/V1/Admin/ProjectController.php): Updated `update()` to accept `string|int $id` (matching by numeric `id` OR string `slug`), preserving soft-delete safety and refreshing published snapshots.
  5. [`PublicProjectController.php`](file:///D:/programming/mohammed-Portfolio/backend/app/Http/Controllers/Api/V1/PublicProjectController.php) & [`ProjectResource.php`](file:///D:/programming/mohammed-Portfolio/backend/app/Http/Resources/ProjectResource.php): Guaranteed that `is_featured`, `featured`, and `isFeatured` booleans are all returned in both list (`index`) and detail (`show`) endpoints.
- **Verification & Deployment Results:**
  - **Vitest Unit/Component Suite:** 42 test files, 237 passed (0 failed).
  - **Vite Build & SSR Pre-render:** `npm run build` compiled client bundle, SSR server bundle, and pre-rendered `/` (`index.html`), `/en/`, and `/ar/` with exit code 0.
  - **Vercel Production Deployment:** Deployment `dpl_E9pxVhoxA8S2Uxv6ufwogcG4ywGf` state `READY` on `https://mohammed-design.vercel.app`.
  - **Render Production Deployment:** Deployment `dep-dbs2nuei0phs73bv9uu0` state `live` on `https://mohammed-portfolio-api.onrender.com`.
  - **Live Verification:** HTTP 200 on `https://mohammed-design.vercel.app` (Selected Work rendered, "Curating New Works" placeholder gone). Proxy `/api/v1/projects` returns all three keys (`is_featured`, `featured`, `isFeatured`).


---

## 10. Verification Checkpoint — Stage 32 (Selected Work Capped to Exactly Top 3 Featured in Saved Order)

- **Task Title:** Limit Homepage Selected Work to Exactly Top 3 Featured Projects in Saved Order
- **Status:** Complete & Verified in Production
- **Branch / Commit:** `dev` (Commit `c2790abb546f1237c2b6705ea01d02ad8486fc5c`, pushed to `origin/dev`)
- **Key Implementation Details:**
  1. [`SelectedWorkSection.jsx`](file:///D:/programming/mohammed-Portfolio/frontend/src/components/SelectedWorkSection.jsx):
     - Filtered `passedProjects` using `isProjectFeatured(p)` and sorted by `getProjectFeaturedOrder(a) - getProjectFeaturedOrder(b)`.
     - Capped with `.slice(0, 3)` to display exactly 3 published projects selected as Featured in the Admin Dashboard, preserving their exact saved order.
     - If fewer than 3 projects are featured, displays only those selected.
     - Never falls back to recent or all projects.
  2. [`AllProjectsScreen.jsx`](file:///D:/programming/mohammed-Portfolio/frontend/src/components/AllProjectsScreen.jsx):
     - Preserves full catalog display: all published projects (`passedProjects`) remain visible in the All Projects page (`/#/work` or `/work`) without truncation.
  3. [`ProjectEditorPage.jsx`](file:///D:/programming/mohammed-Portfolio/frontend/src/admin/pages/ProjectEditorPage.jsx):
     - Normalized featured initialization to resolve `existingProject.featured ?? existingProject.is_featured ?? existingProject.isFeatured ?? false`.
- **Verification & Deployment Results:**
  - **Vitest Unit/Component Suite:** 42 test files, 237 passed (0 failed).
  - **Vite Build & SSR Pre-render:** `npm run build` compiled client and server bundles with exit code 0.
  - **Vercel Production Deployment:** Deployment `dpl_BRLmLXMajuNq6FtSu8KGNPyJYAMg` state `READY` on `https://mohammed-design.vercel.app`.
  - **Render API:** Unaltered and operational at `https://mohammed-portfolio-api.onrender.com`.

---

## 11. Verification Checkpoint — Stage 33 (Admin 3-Position Featured Project Curation & Database Persistence)

- **Task Title:** Homepage Selected Work 3-Position Curation and Database Persistence
- **Status:** Complete & Verified in Production
- **Branch / Commit:** `dev` (Commit `0f55e4b65ddfe75df07fc6778f77cba476df423a`, pushed to `origin/dev`)
- **Key Architecture & Implementation:**
  1. **Database Schema & Migration:**
     - Created migration [`2026_11_14_130000_add_featured_order_to_projects_table.php`](file:///D:/programming/mohammed-Portfolio/backend/database/migrations/2026_11_14_130000_add_featured_order_to_projects_table.php) adding indexed column `featured_order` (`unsignedTinyInteger`, nullable) to `projects` table.
     - Automatically executed in production on Render via `php artisan migrate --force`.
  2. **Laravel Models, Services & Controllers:**
     - Updated [`Project.php`](file:///D:/programming/mohammed-Portfolio/backend/app/Models/Project.php): Added `'featured_order'` to `$fillable` and `'featured_order' => 'integer'` to `$casts`.
     - Updated [`ProjectPublishingService.php`](file:///D:/programming/mohammed-Portfolio/backend/app/Services/Publishing/ProjectPublishingService.php): Added `featured_order` and `position` to immutable snapshots.
     - Updated [`ProjectResource.php`](file:///D:/programming/mohammed-Portfolio/backend/app/Http/Resources/ProjectResource.php): Exposes `featured_order`, `featuredOrder`, and `position`.
     - Updated [`StoreProjectRequest.php`](file:///D:/programming/mohammed-Portfolio/backend/app/Http/Requests/Admin/StoreProjectRequest.php) & [`UpdateProjectRequest.php`](file:///D:/programming/mohammed-Portfolio/backend/app/Http/Requests/Admin/UpdateProjectRequest.php): Enforces `featured_order` validation (`min:1`, `max:3`).
     - Added dedicated route `PUT /api/v1/admin/projects/featured` preceding `apiResource` in [`api.php`](file:///D:/programming/mohammed-Portfolio/backend/routes/api.php).
     - Implemented `reorderFeatured()` in [`ProjectController.php`](file:///D:/programming/mohammed-Portfolio/backend/app/Http/Controllers/Api/V1/Admin/ProjectController.php): Atomically validates maximum 3 projects, prevents duplicate positions (1, 2, 3), un-features omitted projects, updates database columns and snapshots, syncs `SiteSetting` preferences, and writes to audit log.
     - Updated [`PublicProjectController.php`](file:///D:/programming/mohammed-Portfolio/backend/app/Http/Controllers/Api/V1/PublicProjectController.php): When `is_featured=1` is queried, orders by `featured_order ASC`, then `published_at DESC`.
  3. **Admin Dashboard State & UI:**
     - In [`AdminContext.jsx`](file:///D:/programming/mohammed-Portfolio/frontend/src/admin/context/AdminContext.jsx): Added `saveFeaturedShowcase(list)` and `setProjectFeaturedPosition(id, pos)` supporting automatic position swapping, duplicate prevention, and server synchronization with real-time DOM events.
     - In [`ProjectsListPage.jsx`](file:///D:/programming/mohammed-Portfolio/frontend/src/admin/pages/ProjectsListPage.jsx): Added interactive top showcase management card with 3 visual slots (1st, 2nd, 3rd Slide), project dropdown assignment, position swap buttons, remove buttons, and explicit "Save Showcase to DB" button. Replaced table and grid toggles with direct position assignment dropdowns (`Standard`, `★ 1st`, `★ 2nd`, `★ 3rd`).
     - In [`ProjectEditorPage.jsx`](file:///D:/programming/mohammed-Portfolio/frontend/src/admin/pages/ProjectEditorPage.jsx): Added slide position dropdown selector when featured is enabled, persisting `featured_order` upon save.
  4. **Homepage Presentation:**
     - In [`SelectedWorkSection.jsx`](file:///D:/programming/mohammed-Portfolio/frontend/src/components/SelectedWorkSection.jsx): Updated `isProjectFeatured` and `getProjectFeaturedOrder` to support `position`, filtering and sorting featured projects strictly by assigned positions, capped to top 3.
- **Verification & Deployment Results:**
  - **Vitest Unit/Component Suite:** 42 test files, 237 passed (0 failed).
  - **Vite Build & SSR Pre-render:** `npm run build` compiled client bundle, server SSR bundle, and static prerendered HTML with 0 errors.
  - **PHP Syntax & Linting:** 9 modified files verified with `php -l` (0 errors).
  - **Render API Deployment:** Deployment `dep-dbs4aeu1egvs73cptkk0` LIVE with database migrations applied (`https://mohammed-portfolio-api.onrender.com/api/v1/health` -> 200 OK, `healthy`).
  - **Vercel Production Deployment:** Deployment `dpl_8V7QcG9Xyqptv2tAk6yWtfQvwrRN` READY and Aliased to `https://mohammed-design.vercel.app` (HTTP 200 OK).
