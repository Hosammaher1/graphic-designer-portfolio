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
- **Coverage:** Tests design system primitives, modals, language switchers, anti-spam validation, theme toggling, and data formatting.
- **Expected Results:** 236 passing tests covering all core UI components.

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
Configured in [`e2e/playwright.config.js`](file:///D:/programming/mohammed-Portfolio/e2e/playwright.config.js) across Desktop Chromium and Mobile Chrome (Pixel 5):
```bash
cd e2e
npx playwright test
```
- **Targeted Mobile Verification Scripts:**
  - `node e2e/tests/verify-all-sections-mobile.cjs`: Verifies that all 7 sections (`#hero`, `#selected-work`, `#about-me`, `#skills-expertise`, `#creative-journey`, `#contact`, `footer`) are 100% visible on scroll on mobile viewports.
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
