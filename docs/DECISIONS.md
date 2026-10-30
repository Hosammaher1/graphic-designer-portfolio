# Architecture Decision Records (ADRs)

This document records the architectural and execution decisions made for the **Graphic Designer Portfolio** project, providing rationale, alternatives considered, and implementation consequences.

---

## ADR-001: Git Branching Model and CI Verification Flow

- **Status:** Accepted
- **Context:**
  The project requires a structured, safe Git workflow that guarantees no untested code reaches production, prevents breaking changes on the canonical branch, and satisfies the audit requirement for verifying that failing CI checks block pull requests without disrupting normal integration.
- **Decision:**
  1. **`main`** is the protected production release branch. Direct pushes and force-pushes are forbidden. Merges only occur via pull requests after owner approval and green CI.
  2. **`dev`** is the active integration branch. Feature tasks are merged into `dev` upon verification.
  3. **`feat/<task-id>-<description>`** branches are used for all implementation tasks (e.g., `feat/01.01-repo-and-docs`).
  4. For Task 01.08 (CI failure verification), a dedicated disposable test branch and PR (`test/ci-failure-check`) will be used to demonstrate that failing tests block merges, ensuring neither `main` nor `dev` is ever left broken.
- **Consequences:**
  - High branch discipline is maintained.
  - Pull requests can be cleanly reviewed per task or phase.

---

## ADR-002: Project and Page Publication Contract (Immutable Snapshots)

- **Status:** Accepted
- **Context:**
  The Plan Audit (Finding 03.01 / 03.09) identified that mutable database rows could allow unpublished draft edits or partial changes to inadvertently leak to public visitors, breaking the requirement that public visitors always see an immutable published state.
- **Decision:**
  1. We decouple drafting from publishing through an immutable snapshot architecture.
  2. Pages use a versioned table (`page_versions`) containing the full JSON block document and metadata. The `pages` record holds a foreign key `published_version_id` pointing to the currently active snapshot.
  3. Public SSR routes and public REST API endpoints query strictly against the published version snapshot (`published_version_id`).
  4. Editing in the admin CMS creates or modifies draft records without mutating the active public snapshot until the designer explicitly triggers the **Publish** action.
  5. Projects follow the same principle: public endpoints filter strictly by `status = 'published'`, and previewing unpublished projects requires authenticated session tokens or short-lived cryptographic signed URLs.
- **Consequences:**
  - Zero risk of leaking unpublished work or staging edits to public visitors.
  - Clean rollback capability to previous version snapshots.

---

## ADR-003: Dedicated Isolated Test Database Strategy

- **Status:** Accepted
- **Context:**
  The Plan Audit (Finding 01.03) flagged that running `php artisan migrate --env=testing` does not inherently guarantee that an isolated disposable database is selected, creating a risk of running test migrations or truncations against development or production databases.
- **Decision:**
  1. Dedicated test configuration is enforced in `backend/phpunit.xml` and `backend/.env.testing`.
  2. The test database is explicitly designated as `portfolio_testing`.
  3. A pre-flight test bootstrap assertion will verify:
     ```php
     if (config('database.connections.mysql.database') !== 'portfolio_testing') {
         throw new \RuntimeException('Safety check failed: Tests must run against portfolio_testing database!');
     }
     ```
  4. Test credentials and database configuration will be documented with `.env.example` placeholders without exposing real production credentials.
- **Consequences:**
  - Eliminates data corruption risk during test execution.
  - Guarantees reproducible, isolated test environments.

---

## ADR-004: Media Provider Adapter with Local Fake Driver

- **Status:** Accepted
- **Context:**
  Cloudinary is the approved media host, but external credentials may not always be available during local unit testing, CI pipeline runs, or early phase execution.
- **Decision:**
  1. Introduce a `MediaStorageInterface` in Laravel (`app/Services/Media/MediaStorageInterface.php`).
  2. Implement two concrete adapters:
     - `CloudinaryMediaAdapter`: Production/staging adapter communicating with Cloudinary's REST API.
     - `LocalFakeMediaAdapter`: In-memory / local disk mock adapter for deterministic testing and offline development.
  3. The active adapter is bound via Laravel service container based on environment variables (`MEDIA_DRIVER=cloudinary` or `MEDIA_DRIVER=fake`).
- **Consequences:**
  - All unit, feature, and CI tests run fast and reliably offline without network dependencies or Cloudinary quota consumption.
  - Cloudinary credentials are required only when testing real uploads in Phase 03.

---

## ADR-005: Contact Form Phasing & Mail Delivery Strategy

- **Status:** Accepted
- **Context:**
  The Contact UI is scheduled for Phase 04, while the production mail endpoint and credentials are scheduled for Phase 07. Presenting a simulated success message when no mail was actually dispatched would violate delivery transparency.
- **Decision:**
  1. During Phase 04, the Contact form will be displayed in an explicit development/preview mode with clear visual indicators that mail dispatch is mocked or disabled until Phase 07.
  2. When Phase 07 implements the mail endpoint, it will use an asynchronous database queue with an idempotency key to prevent duplicate email transmissions if provider timeouts occur.
- **Consequences:**
  - Clear user expectations during development.
  - Transparent delivery guarantees.

---

## ADR-006: Page Builder Error Handling and Recovery

- **Status:** Accepted
- **Context:**
  The Plan Audit (Finding 05.04) noted an ambiguity between the skill table (requesting undo/cancel/error states) and Task 05.04 (stating undo is not required for v1).
- **Decision:**
  1. **Cancel** and **failed-save recovery** are required for v1:
     - A designer can cancel pending changes and revert the editor canvas to the last saved draft.
     - In case of network errors or server validation failures, editor state is retained in browser local storage so work is not lost.
  2. Multi-step timeline undo/redo history is deferred to a future post-v1 iteration.
- **Consequences:**
  - Meets usability and resilience requirements without bloating editor complexity.

---

## ADR-007: Privacy-First Analytics and Explicit Consent Architecture

- **Status:** Accepted
- **Context:**
  The Plan Audit (Finding 06.05 / 06.08) required a clear boundary between essential aggregate measurement and optional behavioral tracking.
- **Decision:**
  1. **Essential Aggregate Metrics** (First-Party):
     - Daily aggregated view counts per project and category.
     - Coarse referrer domains.
     - No cookies, no IP address storage, no unique visitor tracking.
     - Enabled by default as legitimate interest for portfolio operational metrics.
  2. **Personalized Recommendations & Behavioral Tracking**:
     - Requires explicit opt-in consent from the visitor via the consent banner.
     - Consented preference token stored in local storage.
     - If the visitor rejects or withdraws consent, tracking stops immediately, stored preferences are purged, and recommendations revert to generic rule-based logic.
- **Consequences:**
  - Full compliance with privacy regulations (GDPR/ePrivacy).
  - Clean architectural separation between operational telemetry and personalized analytics.

---

## ADR-008: Background Queue Driver for Durable Execution

- **Status:** Accepted
- **Context:**
  Tasks in Phases 03 through 08 require background processing: media optimization cleanup, 30-day soft-deleted trash purging, email delivery retries, and backup automation.
- **Decision:**
  1. Utilize Laravel's database queue driver (`QUEUE_CONNECTION=database`) for MVP.
  2. Does not introduce external dependencies like Redis in early phases.
  3. Jobs are tracked in `jobs` and `failed_jobs` tables with automatic retries and dead-letter failure logging.
- **Consequences:**
  - Reliable asynchronous task execution using the existing MySQL instance.
  - Can seamlessly migrate to Redis in the future if job volume demands it.


---

## ADR-009: Lean Native Node.js SSR Handler (Zero Express Dependency)

- **Status:** Accepted
- **Context:**
  The master plan specifies React + Vite SSR with `entry-server.jsx`, `entry-client.jsx`, and a production server script in `server/index.js` listening on port 3000 (Tasks 01.05 and 09.02). `docs/ARCHITECTURE.md` initially referenced Express as an assumed server implementation. However, Express was not in the approved stack and is not required.
- **Decision:**
  1. Do not introduce Express or any other third-party Node web framework into production.
  2. Implement `frontend/server/index.js` using Node's standard library `node:http` module directly.
  3. The native HTTP listener receives requests proxied from Nginx on `localhost:3000`, invokes the Vite SSR render bundle (`entry-server.jsx`), injects the serialized HTML and hydration tags, and streams the response.
  4. Keeps dependencies lean, eliminates third-party routing overhead, and avoids introducing an unapproved production web framework.
- **Consequences:**
  - Zero extra production dependencies for the SSR script.
  - Complete fidelity to the approved master plan (Node SSR on port 3000 per Task 01.05 and 09.02) without unapproved framework bloat.


---

## ADR-010: Versioned Page Builder Block Schema and Cross-Platform Validator

- **Status:** Accepted
- **Context:**
  Task 05.01 requires a versioned JSON schema for the 12 approved block types (`hero`, `text`, `heading`, `image`, `gallery`, `columns`, `spacer`, `cta`, `stats`, `services`, `category_preview`, `featured_work`) with strict validation to prevent malformed attributes or unsafe script payloads.
- **Decision:**
  1. Schema defines versioned JSON structure (`version: 1`) where every block requires `id`, `type`, `version`, and `data`.
  2. Disallowed attributes at the block root are strictly rejected to prevent object prototype pollution or unexpected keys.
  3. Strict recursive security scanner rejects HTML `<script>`, `<iframe>`, `<object>`, event handlers (`onload=`, `onerror=`), and dangerous pseudo-protocols (`javascript:`, `vbscript:`, `data:`).
  4. Both backend (`App\Services\PageBuilder\BlockSchema`) and frontend (`frontend/src/page-builder/schema.js`) enforce identical validation rules to ensure instant client editor feedback and zero-trust server validation.
- **Consequences:**
  - Guarantees data integrity for saved page drafts and published snapshots.
  - Complete protection against stored XSS vulnerabilities in custom layout documents.
