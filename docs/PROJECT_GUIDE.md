# Mohammed Maher Portfolio — Project Architecture & Developer Guide

Welcome to the **Mohammed Maher Portfolio** codebase. This guide serves as the authoritative single source of truth for the project's vision, system architecture, frontend and backend topology, data models, development workflows, environment configuration, and architectural decisions.

---

## 1. Executive Summary & Vision

- **Designer Identity:** Mohammed Maher Aldaya — Creative Visual Designer specialising in brand identity, digital systems, editorial print, and motion design.
- **Audience:** International design agencies, high-profile clients, creative directors, and collaborators.
- **Aesthetic Direction:** Apple/iOS-inspired premium creative studio aesthetic. Characterised by refined typography scales, generous whitespace, subtle glassmorphism, responsive tactile micro-interactions, dark studio ambiance by default, and a high-contrast Eclipse light mode.
- **Bilingual Experience:** Full bidirectional symmetry:
  - **English (Default):** Served on `/` and `/en/` with LTR layout, Plus Jakarta Sans, and Playfair Display typography.
  - **Arabic:** Served on `/ar/` with RTL layout, Cairo typography, and synchronized cultural layout flips.
- **Public Model:** **Hybrid Single-Page Experience** — an unbroken, immersive, scroll-driven visual narrative on the homepage complemented by dynamic, SEO-friendly project detail views (`/:locale/projects/:slug`), filterable project archives (`/:locale/projects`), and an independent Content Management System (`/admin/*`).

---

## 2. System Architecture & Topology

The application is deployed across a robust, low-maintenance multi-cloud infrastructure:

```
                                  +------------------------------------+
                                  |       Client Browser / Devices     |
                                  +-----------------+------------------+
                                                    |
                                      +-------------+-------------+
                                      |                           |
                            HTTPS     |                 HTTPS     |
                    (Static / SSR / UI)          (Direct REST API)|
                                      v                           v
                      +-------------------------------+   +-------------------------------+
                      |      Vercel Edge Platform     |   |         Render Cloud          |
                      |   - Static Assets (CDN Edge)  |   |   - Laravel 11 PHP 8.3 REST   |
                      |   - Serverless SSR Function   |   |   - Sanctum Session Auth      |
                      |   - Pre-rendered SSG Cache    |   |   - Database Queue Workers    |
                      +---------------+---------------+   +---------------+---------------+
                                      |                                   |
                                      | Proxy /api/v1/*                   | Relational Queries
                                      +---------------------------------->|
                                                                          v
                                                          +-------------------------------+
                                                          |          Aiven Cloud          |
                                                          |   - Managed MySQL 8.0         |
                                                          |   - utf8mb4_unicode_ci        |
                                                          +-------------------------------+
                                                                          ^
                                                                          | Binary Media CDN
                                                          +---------------+---------------+
                                                          |         Cloudinary CDN        |
                                                          |   - Media transformations     |
                                                          |   - WebP / AVIF delivery      |
                                                          +-------------------------------+
```

### 2.1 Component Roles
1. **Frontend & SSR (Vercel):**
   - Pure React 19 application built with Vite 6.
   - Pre-rendered static HTML (SSG) for `/`, `/en/`, and `/ar/` providing 0ms TTFB and instantaneous first paint.
   - Serverless SSR fallback (`api/index.js`) for dynamic paths, SEO metadata resolution, and security header injection.
   - Reverse proxy for backend APIs (`/api/:path*`), Sanctum auth (`/sanctum/:path*`), and storage (`/storage/:path*`).
2. **Backend API (Render):**
   - Laravel 11 application running on PHP 8.3 in a containerized environment.
   - Handles authentication, admin CRUD, project curation, category taxonomy, contact submissions, and background queues.
   - Database queue worker runs asynchronous email deliveries, trash purging, and system monitoring.
3. **Database (Aiven):**
   - Fully managed MySQL 8.0 instance running in the cloud with automated SSL/TLS encryption.
4. **Media Storage (Cloudinary):**
   - High-resolution client artwork and portfolio media stored and delivered via global CDN with automated WebP/AVIF format optimization and responsive dimension delivery.

---

## 3. Repository Directory Structure

```
mohammed-portfolio/
├── .agents/                    # Custom AI agent guidelines and design system skills
├── .github/workflows/          # GitHub Actions CI/CD workflows
├── api/                        # Vercel serverless SSR entrypoint (api/index.js)
├── backend/                    # Laravel 11 REST API Application
│   ├── app/
│   │   ├── Console/Commands/   # Scheduled CLI commands (PurgeTrash, Monitor, Backup)
│   │   ├── Http/Controllers/   # API v1 and Admin controllers
│   │   ├── Http/Middleware/    # Auth, localization, rate-limiting, security
│   │   ├── Models/             # Eloquent models (Project, Category, Media, Page)
│   │   ├── Policies/           # Authorization policies
│   │   └── Services/           # Media adapters, SEO, and PageBuilder schemas
│   ├── config/                 # Application configuration
│   ├── database/
│   │   ├── migrations/         # Relational database schema migrations
│   │   └── seeders/            # Initial admin user and curated project seeders
│   └── routes/api.php          # Versioned REST API endpoints
├── docs/                       # Consolidated project documentation
│   ├── PROJECT_GUIDE.md        # Architecture, vision, contracts, and setup (this file)
│   ├── MAINTENANCE.md          # Testing, operations, runbooks, and safeguards
│   └── screenshots/            # Approved UI verification reference captures
├── e2e/                        # Playwright E2E browser test harness
│   ├── tests/                  # Cross-browser, responsive, and accessibility tests
│   └── playwright.config.js    # Playwright configuration (Chromium & Mobile Chrome)
├── frontend/                   # React 19 + Vite 6 Frontend Application
│   ├── public/                 # Static assets, logos, sitemap.xml, robots.txt, llms.txt
│   ├── scripts/                # SSG Pre-rendering script (prerender.js)
│   ├── src/
│   │   ├── admin/              # Lazy-loaded Admin CMS dashboard application
│   │   ├── components/         # Design system components (Hero, Navbar, Work, etc.)
│   │   ├── context/            # AuthContext, ConsentContext
│   │   ├── data/               # Curated portfolio dataset and bilingual translations
│   │   ├── i18n/               # Locale configuration, RTL helpers, switchers
│   │   ├── page-builder/       # Visual block schema and canvas renderers
│   │   ├── pages/              # Standalone pages (AllProjects, ProjectDetail, etc.)
│   │   ├── styles/             # Global CSS tokens, index.css, Tailwind setup
│   │   ├── utils/              # API clients, SEO metadata resolver, Web Vitals RUM
│   │   ├── App.jsx             # Main Hybrid Single-Page entry & route synchronizer
│   │   ├── entry-client.jsx    # Client hydration entry
│   │   └── entry-server.jsx    # Server-Side Rendering entry
│   ├── package.json            # Frontend dependencies
│   ├── vite.config.js          # Client build and SSR configuration
│   └── vitest.config.js        # Unit and component test configuration
├── infrastructure/             # Nginx reverse proxy configs, systemd services
├── scripts/                    # Maintenance and operational utility scripts
│   └── generate-sitemap.cjs    # Production sitemap generator script
├── AGENTS.md                   # Operational guidelines for autonomous coding agents
├── README.md                   # Repository introduction and quickstart
├── render.yaml                 # Render infrastructure configuration
└── vercel.json                 # Vercel deployment routes, headers, and rewrite rules
```

---

## 4. Frontend Architecture & Design System

### 4.1 Hybrid Single-Page Model
The public interface is designed as an integrated scroll-driven single-page presentation with deep-linked routes:
- **`#hero`**: Full-viewport introduction with editorial serif headline, designer identity badge, 3D card deck, and smooth scroll affordance.
- **`#selected-work`**: Curated centerpiece featuring 3 featured project cards with edge-to-edge cover artwork, tag metadata, and detail modal triggers.
- **`#about-me`**: Editorial bio, designer portrait with gradient vignette, 3-stat glass summary card (50+ Projects, 20+ Clients, 5+ Years), and signature visual.
- **`#skills-expertise`**: Software proficiency grid (Figma, Photoshop, Illustrator, InDesign, After Effects, Premiere, Cinema 4D, Procreate, Canva, Notion), interactive Bezier pen tool graphic, and 3 core expertise cards.
- **`#creative-journey`**: Interactive chronological milestones timeline with monumental year typography.
- **`#contact`**: Direct email, WhatsApp trigger, and anti-spam protected contact form.
- **Project Detail Modals (`/:locale/projects/:slug`)**: Seamless dynamic modal overlays that open in-place on desktop/mobile without losing scroll position, displaying complete artwork galleries, concept narratives, and service metadata.
- **All Projects Archive (`/:locale/projects`)**: Filterable masonry gallery displaying all published projects categorized by taxonomy.

### 4.2 Typography & Design Tokens
Defined in [`frontend/src/index.css`](file:///D:/programming/mohammed-Portfolio/frontend/src/index.css) and [`frontend/src/styles/tokens.css`](file:///D:/programming/mohammed-Portfolio/frontend/src/styles/tokens.css):
- **Typography Stacks:**
  - `font-sans`: Plus Jakarta Sans, system-ui, sans-serif
  - `font-serif`: Playfair Display, Georgia, serif
  - `font-arabic`: Cairo, Plus Jakarta Sans, sans-serif
- **Dark Studio Theme (Default):**
  - Surface: `#18101a` | Background: `#09070c` | Primary Text: `#f5f5f5` | Muted Text: `#a39ca8`
  - Accent / Primary: `#e2827e` / `#f4a496` (Rose & Peach)
- **Eclipse Light Mode:**
  - Surface: `#FFFFFF` | Canvas: `#F6F1EB` (Alabaster Cream) | Primary Text: `#242027`
  - Muted Text: `#48404a` (Specially engineered to guarantee **> 7.5:1 contrast** on `#F6F1EB` for WCAG AAA compliance)
  - Primary Accent: `#5C1628` (Deep Burgundy / Wine)

### 4.3 Motion & Performance Safeguards
1. **Zero Black-Screen Guarantee:**
   - Pre-rendered static HTML (`dist/client/index.html`) delivers fully visible DOM nodes at byte 0.
   - Enforced CSS fallback rule: `@media (max-width: 1023px) { .about-reveal, .skill-stagger, .milestone-card, .hero-stagger { opacity: 1 !important; transform: none !important; } }`.
   - GSAP ScrollTrigger skips opacity resets on mobile viewports (`window.innerWidth < 1024 || 'ontouchstart' in window`), ensuring elements are never stuck at `opacity: 0`.
2. **Instant Multi-Tier Caching:**
   - Client initializes state synchronously from `localStorage` -> `sessionStorage` -> curated fallback data in 0ms.
   - Background API requests run asynchronously with a 5-second timeout and retry logic, preventing sleeping backend containers from freezing page reloads.
3. **Lazy-Loaded Admin Dashboard:**
   - `AdminApp` is dynamically imported (`React.lazy()`), stripping **> 275 kB of unused JavaScript** from the public visitor bundle.

---

## 5. Backend Architecture & Data Contracts

### 5.1 Technology Stack
- **Framework:** Laravel 11.x on PHP 8.3.
- **Authentication:** Laravel Sanctum with SPA cookie-based stateful sessions (`/sanctum/csrf-cookie`, `/api/v1/auth/login`).
- **Database ORM:** Eloquent ORM targeting MySQL 8.0 with strict typing, soft deletes, and timestamp audit trails.
- **Queue Connection:** Database driver (`jobs`, `failed_jobs` tables) running scheduled background jobs.

### 5.2 Core API Endpoints
All API endpoints return a uniform JSON envelope `{ "data": ... }` or `{ "message": ..., "errors": ... }`:

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/health/live` | Process liveness probe (returns 200 OK) | Public |
| `GET` | `/api/v1/health/ready` | Readiness probe (verifies database & cache) | Public |
| `GET` | `/api/v1/projects` | List published projects (supports `?category=`, `?locale=`) | Public |
| `GET` | `/api/v1/projects/{slug}` | Get single project detail by slug or ID | Public |
| `GET` | `/api/v1/categories` | List project taxonomy categories | Public |
| `GET` | `/api/v1/settings` | Get public site settings (profile, hero, contact copy) | Public |
| `POST` | `/api/v1/contact` | Submit contact inquiry (anti-spam protected) | Public |
| `POST` | `/api/v1/auth/login` | Authenticate admin user via Sanctum cookie | Public |
| `POST` | `/api/v1/auth/logout` | Terminate admin session | Authenticated |
| `GET` | `/api/v1/admin/projects` | List all projects (including drafts and trash) | Authenticated |
| `POST` | `/api/v1/admin/projects` | Create new project | Authenticated |
| `PUT` | `/api/v1/admin/projects/{id}` | Update existing project | Authenticated |
| `DELETE`| `/api/v1/admin/projects/{id}` | Soft-delete project | Authenticated |
| `POST` | `/api/v1/admin/media/upload`| Upload image to Cloudinary/Fake storage | Authenticated |

### 5.3 Publishing & Data Integrity Contract
- **Immutable Published Snapshots:** Public routes strictly query projects with `status = 'published'`. Edits in the Admin CMS modify working drafts without mutating active visitor views until explicitly published.
- **Multi-Tenant Upload Limits:** Server-side upload validator strictly limits uploads to JPEG, PNG, and WebP; caps maximum file size at 15 MB; and bounds image dimensions to 8192px / 40 million pixels.

---

## 6. Environment Configuration & Secrets

### 6.1 Frontend Environment (`frontend/.env`)
Copy from `frontend/.env.example`:
```env
# URL of the Laravel backend API
VITE_API_URL=https://mohammed-portfolio-api.onrender.com
# Vercel deployment root
VITE_SITE_URL=https://mohammed-design.vercel.app
# Default locale (en)
VITE_DEFAULT_LOCALE=en
```

### 6.2 Backend Environment (`backend/.env`)
Copy from `backend/.env.example`:
```env
APP_NAME="Mohammed Maher Portfolio"
APP_ENV=production
APP_KEY=base64:... # Generate with: php artisan key:generate
APP_DEBUG=false
APP_URL=https://mohammed-design.vercel.app

LOG_CHANNEL=daily
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=info

# Aiven Managed MySQL Database
DB_CONNECTION=mysql
DB_HOST=mysql-1244d130-mohmmed-ma48.c.aivencloud.com
DB_PORT=25761
DB_DATABASE=defaultdb
DB_USERNAME=avnadmin
DB_PASSWORD=... # Secret provided in deployment manager
MYSQL_ATTR_SSL_CA=/etc/ssl/certs/ca-certificates.crt

# Session & Sanctum SPA Settings
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=.mohammed-design.vercel.app
SANCTUM_STATEFUL_DOMAINS=mohammed-design.vercel.app,localhost:3000

# Queue & Mail Drivers
QUEUE_CONNECTION=database
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailgun.org
MAIL_PORT=587
MAIL_USERNAME=...
MAIL_PASSWORD=...
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="mohmmed.maher467@gmail.com"
MAIL_FROM_NAME="Mohammed Maher Portfolio"

# Media Storage (Cloudinary)
MEDIA_DRIVER=cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

---

## 7. Local Development Workstation Setup

### 7.1 Prerequisites
- **Node.js:** v20.x or v22.x LTS
- **PHP:** v8.2 or v8.3 with extensions `pdo_mysql`, `mbstring`, `openssl`, `curl`, `gd`, `zip`, `fileinfo`, `xml`
- **Composer:** v2.6+
- **MySQL:** v8.0+ (or local XAMPP/Docker)

### 7.2 Backend Setup
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve --port=8000
```

### 7.3 Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Vite runs at http://localhost:5173
```

### 7.4 Running SSR Locally
```bash
cd frontend
npm run build
node server/index.js
# Production SSR server listens at http://localhost:3000
```

---

## 8. Architectural Decision Records (ADRs)

- **ADR-001 (Git Branching Model):** Protected `main` branch for production releases. Dedicated feature branches (`feat/*`, `fix/*`) merged into `dev` upon verification.
- **ADR-002 (Immutable Snapshots):** Public visitors query published immutable records. Draft changes never leak into production.
- **ADR-003 (Isolated Test Database):** Tests run strictly against `portfolio_testing` with automated environment checks preventing production DB truncation.
- **ADR-004 (Media Adapter Pattern):** `MediaStorageInterface` supports `CloudinaryMediaAdapter` in production and `LocalFakeMediaAdapter` for offline and CI testing.
- **ADR-005 (Contact Idempotency):** Submissions use database queue workers with unique idempotency hashes to eliminate duplicate email dispatches.
- **ADR-006 (Page Builder Resilience):** State recovery prevents loss of work during draft editing if network dropouts occur.
- **ADR-007 (Privacy-First Telemetry):** Aggregate visit counts collected without IP tracking or third-party advertising cookies.
- **ADR-008 (Database Queue Architecture):** Reliable, dependency-free background jobs via MySQL `jobs` table without Redis overhead.
- **ADR-009 (Native Node SSR):** Lean native `node:http` SSR handler avoiding unapproved third-party framework overhead.
- **ADR-010 (Page Builder Schema):** Versioned JSON schema validation with strict XSS sanitization for all 12 block types.
- **ADR-011 (Hybrid Single-Page Experience):** One continuous scroll narrative on `/` with deep-linking, independent detail routes, and CSR admin shell.
- **ADR-012 (Upload Validation Constraints):** Strict MIME sniffing, 15 MB file size limit, and 8192px dimension cap.
