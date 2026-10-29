# System Architecture Blueprint

This document specifies the technical architecture, runtime topology, data model, security boundary, and development workflows for the **Graphic Designer Portfolio** application.

---

## 1. System Topology & Runtime Architecture

The application is architected as a decoupled, modular system with a unified reverse proxy:

```
                      +-----------------------------+
                      |       Client / Browser      |
                      +--------------+--------------+
                                     |
                                     | HTTPS (Port 443)
                                     v
                      +-----------------------------+
                      |     Nginx Reverse Proxy     |
                      +-------+-------------+-------+
                              |             |
           /api/v1/*          |             |   /ar/*, /en/* (Public SSR)
           +------------------+             +-------------------+
           |                                                    |
           v                                                    v
+-----------------------+                            +-----------------------+
|  Laravel 11 REST API  |                            |   Node.js SSR Server  |
|  (PHP-FPM, Port 9000) |                            |  (Native HTTP, Port 3000)|
+-----------+-----------+                            +-----------+-----------+
            |                                                    |
            | Relational Queries                                 | Internal API (Fast path)
            v                                                    v
+-----------------------+                            +-----------------------+
| MySQL 8.0 (utf8mb4)   |                            |   React 19 Frontend   |
| Primary Database      |                            |   Component Tree      |
+-----------------------+                            +-----------------------+
            ^
            | Media References
            v
+-----------------------+
|  Cloudinary / Storage |
|  (Media & Variants)   |
+-----------------------+
```

### 1.1 Routing & Proxy Contracts

- **Public Localized Routes (`/ar/*`, `/en/*`)**:
  - Routed to the Node.js SSR server.
  - Server renders semantic, localized HTML with appropriate `lang` and `dir` attributes (`lang="ar" dir="rtl"` or `lang="en" dir="ltr"`).
  - Injects serialized page data into a JSON script tag (`id="__INITIAL_DATA__"`).
  - Client hydrates into a seamless Single Page Application without DOM mismatches.
- **Admin Management Shell (`/admin/*`)**:
  - Served as a Client-Side Rendered (CSR) application shell.
  - Authentication state is verified dynamically via Laravel Sanctum session cookies.
  - Search engines are instructed to exclude this area via `X-Robots-Tag: noindex, nofollow` headers.
- **REST API (`/api/v1/*`)**:
  - Proxied to Laravel 11.
  - Standardized JSON responses, consistent error envelopes, strict request validation, and policy-based authorization.
- **Static Assets (`/assets/*`, `/favicon.ico`, etc.)**:
  - Served directly from disk by Nginx with aggressive HTTP caching headers (`Cache-Control: public, max-age=31536000, immutable`).

---

## 2. Repository Layout

The codebase is organized as a structured monorepo:

```text
portfolio/
├── .github/
│   └── workflows/          # GitHub Actions CI/CD workflows
├── backend/                # Laravel 11 REST API
│   ├── app/
│   │   ├── Console/        # Scheduled commands (purge trash, daily backups)
│   │   ├── Http/
│   │   │   ├── Controllers/Api/V1/ # Versioned API controllers
│   │   │   ├── Middleware/ # Sanctum, localization, rate limiting
│   │   │   ├── Requests/   # Form request validation
│   │   │   └── Resources/  # API JSON resources
│   │   ├── Jobs/           # Asynchronous queue jobs (media, email)
│   │   ├── Models/         # Eloquent models & traits
│   │   ├── Policies/       # Model authorization policies
│   │   └── Services/       # Business logic (Media, Analytics, Publishing)
│   ├── database/
│   │   ├── factories/      # Test data factories
│   │   ├── migrations/     # Database schema migrations
│   │   └── seeders/        # Admin and initial data seeders
│   ├── routes/             # api.php, console.php
│   └── tests/              # Feature and Unit PHPUnit test suites
├── docs/                   # Architecture, decisions, setup, and progress documentation
├── e2e/                    # Playwright end-to-end browser test suites
│   ├── tests/              # Cross-browser, responsive, and accessibility tests
│   └── playwright.config.js
├── frontend/               # React 19 + Vite application
│   ├── server/             # Node.js production SSR server
│   ├── src/
│   │   ├── app/            # App shell, router, providers
│   │   ├── components/     # Reusable design system UI components
│   │   ├── features/       # Feature modules (portfolio, admin, page-builder)
│   │   ├── i18n/           # Translation dictionaries (ar.json, en.json)
│   │   ├── pages/          # Page components (Home, Projects, Admin)
│   │   ├── styles/         # CSS design tokens, reset, typography
│   │   ├── entry-client.jsx # Client hydration entry
│   │   └── entry-server.jsx # SSR render entry
│   └── tests/              # Vitest & React Testing Library suites
└── infrastructure/         # Deployment automation
    ├── backup/             # Encrypted MySQL backup/restore scripts
    ├── deployment/         # Systemd services, PM2 configurations
    └── nginx/              # Nginx site configuration
```

---

## 3. Data Model & Entity Relationship

The relational database uses **MySQL 8** with the `utf8mb4` charset and `utf8mb4_unicode_ci` collation.

### 3.1 Core Entities

1. **`users`**:
   - `id`, `name`, `email` (unique), `password` (hashed with bcrypt/argon2id), `is_active`, `remember_token`, `timestamps`.
   - Constrained to a single administrator account in MVP.
2. **`admin_activity_logs`**:
   - `id`, `user_id` (FK), `action`, `entity_type`, `entity_id`, `ip_address`, `user_agent`, `payload` (JSON), `created_at`.
3. **`projects`**:
   - `id`, `slug` (unique indexed), `status` (enum: `draft`, `published`, `archived`), `is_featured` (boolean), `published_at` (nullable timestamp), `year` (smallint), `cover_media_id` (nullable FK), `view_count` (unsigned int default 0), `deleted_at` (soft deletes with 30-day purge), `timestamps`.
4. **`project_translations`**:
   - `id`, `project_id` (FK cascade), `locale` (char: `ar`, `en`), `title`, `summary`, `description` (longtext), `seo_title`, `seo_description`, `timestamps`.
   - Unique compound index on `(project_id, locale)`.
5. **`categories`**:
   - `id`, `slug` (unique indexed), `sort_order` (int), `is_active` (boolean), `timestamps`.
6. **`category_translations`**:
   - `id`, `category_id` (FK cascade), `locale` (char: `ar`, `en`), `name`, `description`, `timestamps`.
   - Unique compound index on `(category_id, locale)`.
7. **`category_project`**:
   - `project_id` (FK cascade), `category_id` (FK cascade).
   - Primary key on `(project_id, category_id)`.
8. **`media_assets`**:
   - `id`, `provider` (enum: `cloudinary`, `local`), `provider_id` (string), `file_name`, `mime_type`, `bytes` (bigint), `width` (int), `height` (int), `original_url` (restricted access), `variants` (JSON: urls for thumbnail, medium, full, webp), `has_watermark` (boolean), `reference_count` (int default 0), `timestamps`.
9. **`project_media`**:
   - `id`, `project_id` (FK cascade), `media_asset_id` (FK cascade), `sort_order` (int), `caption_ar`, `caption_en`, `timestamps`.
10. **`pages`**:
    - `id`, `slug` (unique indexed, e.g., `home`, `about`, `services`, `contact`), `status` (enum: `draft`, `published`), `published_version_id` (nullable FK to `page_versions`), `timestamps`.
11. **`page_versions` (Immutable Snapshots)**:
    - `id`, `page_id` (FK cascade), `version_number` (int), `blocks` (JSON document adhering to Page Builder schema), `created_by` (FK to `users`), `published_at` (nullable timestamp), `timestamps`.
12. **`site_settings`**:
    - `id`, `key` (unique string), `value` (JSON/text), `is_public` (boolean), `timestamps`.
13. **`consent_records` & `analytics_daily_aggregates`**:
    - Privacy-first aggregate metrics. No raw personal identifiers stored without explicit consent.

---

## 4. Immutable Publication Contract

To resolve Plan Audit item **03.01 / 03.09**:
- **Draft vs. Published Separation**:
  - Editing a page or project in the admin dashboard never mutates live public output.
  - Page edits create or update draft version records (`page_versions`).
  - When the designer clicks **Publish**, a new snapshot is frozen in `page_versions`, and `pages.published_version_id` is updated in a database transaction.
- **Public Query Isolation**:
  - All public SSR routes and public API endpoints (`/api/v1/projects/*`, `/api/v1/pages/*`) strictly query `WHERE status = 'published'` and join only against the referenced `published_version_id`.
  - Drafts and archived entities are excluded at the query/scope level.
- **Admin Previews**:
  - Admin preview routes require authenticated session tokens or short-lived cryptographic signed URLs (`URL::temporarySignedRoute`).
  - Preview pages send `X-Robots-Tag: noindex, nofollow` and `Cache-Control: no-store` headers.

---

## 5. Localization & SSR Hydration Strategy

To resolve Plan Audit item **01.05 / 01.06**:
- **Route Prefixes**:
  - All public routes are explicitly prefixed with locale: `/ar/*` (primary, Arabic, RTL) and `/en/*` (secondary, English, LTR).
  - Root `/` performs a 302 redirect based on browser headers (`Accept-Language`) or stored cookie preference, defaulting to `/ar/`.
- **Request-Derived Server State**:
  - The Node.js SSR server extracts the locale from the route parameter.
  - Injects `<html lang="ar" dir="rtl">` or `<html lang="en" dir="ltr">`.
  - Serializes bootstrap data (locale, initial page props, active theme token) into a `<script id="__INITIAL_DATA__" type="application/json">` element.
- **Client Hydration**:
  - Client reads `window.__INITIAL_DATA__` on mount.
  - Initializes i18n dictionaries and React router with the identical bootstrap state.
  - Guarantees zero DOM mismatch and zero hydration warnings.

---

## 6. Security Architecture & Boundary

1. **Authentication & Session Management**:
   - Built on Laravel Sanctum using stateful cookie-based session authentication.
   - Session cookies configured with `HttpOnly`, `Secure` (HTTPS only), and `SameSite=Strict`.
   - Dedicated CSRF cookie handshake (`/sanctum/csrf-cookie`) required before authentication mutations.
2. **Authorization & Policies**:
   - Strict resource policies (`app/Policies/*`) for all admin mutations.
   - Public visitors have read-only access to published resources.
   - Registration endpoints are completely disabled. The single admin account is initialized via idempotent seeder.
3. **Media Protection**:
   - High-resolution original files are kept private with restricted access.
   - Public display variants are served through Cloudinary with automated optimization (format auto, quality auto) and optional watermarks for standalone designs.
4. **Rate Limiting & Brute Force Protection**:
   - Login endpoint constrained to 5 attempts per minute per IP using Laravel `RateLimiter`.
   - Contact API endpoint constrained to 3 requests per 10 minutes per IP with honeypot validation.
5. **Security Headers**:
   - Nginx enforces `Content-Security-Policy`, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.

---

## 7. Git Workflow & Quality Gates

Development follows a strict branch and verification model:

```text
main (Protected, Production)
  ^
  | (Reviewed Pull Request & CI Green)
dev (Active Integration)
  ^
  | (Task Completion & Local Checks)
feat/<task-id>-<description> (Isolated Task Branch)
```

- Every task is implemented on an isolated feature branch.
- Automated tests (PHPUnit, Vitest, Playwright) and lint checks must pass before merging.
- No direct pushes or force-pushes to `main` or `dev`.
- Production deployment requires explicit manual approval.
