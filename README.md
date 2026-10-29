# Graphic Designer Portfolio

A modern, high-performance, bilingual (Arabic & English) web application tailored for a single graphic designer. Features an editorial-grade public portfolio with server-side rendering (SSR), subtle motion, dark mode, an intuitive block-based Page Builder, and a secure client-side rendered (CSR) admin management dashboard.

---

## Architecture Overview

| Layer | Technology | Responsibilities |
| --- | --- | --- |
| **Public Frontend (SSR)** | React 19, Vite, JavaScript, Node.js SSR | Fast initial load, SEO metadata, localized routes (`/ar/`, `/en/`), zero hydration mismatch, responsive editorial design. |
| **Admin Shell (CSR)** | React 19 SPA, Sanctum Session Auth | Secure authenticated portal for managing projects, categories, media, pages, site settings, and privacy-compliant analytics. |
| **Backend REST API** | Laravel 11, PHP 8.2+, Laravel Sanctum | Modular monolith providing `/api/v1/*` endpoints, input validation, policies, audit logging, and background processing. |
| **Database** | MySQL 8 (`utf8mb4`) | Relational persistence with transactional integrity, foreign key constraints, JSON schemas for block structures, and strict isolation for test runs. |
| **Media Pipeline** | Cloudinary & Local Storage Adapter | Secure uploads, automatic responsive variants, optional watermarks, and private original asset preservation. |
| **Testing Harness** | PHPUnit, Vitest, React Testing Library, Playwright | Comprehensive unit, integration, feature, and end-to-end browser testing. |
| **Deployment & Ops** | Nginx, Node SSR Daemon, PHP-FPM, Oracle Linux | Reverse proxy, SSL/TLS termination, daily encrypted database backups, and environment approval gates. |

---

## Repository Structure

```text
portfolio/
├── .github/
│   └── workflows/          # GitHub Actions CI/CD pipelines
├── backend/                # Laravel 11 REST API application
│   ├── app/                # Controllers, Requests, Resources, Models, Policies, Services
│   ├── config/             # Framework and service configuration
│   ├── database/           # Migrations, seeders, and model factories
│   ├── routes/             # API and console routes
│   └── tests/              # PHPUnit feature and unit test suites
├── docs/                   # Architectural blueprints, decisions, setup guides, and progress tracking
│   ├── ARCHITECTURE.md     # In-depth system architecture and data models
│   ├── DECISIONS.md        # Architecture Decision Records (ADRs)
│   ├── LOCAL_SETUP.md      # Detailed developer workstation setup guide
│   ├── PLAN_AUDIT.md       # Audit findings and execution clarifications
│   └── PROGRESS.md         # Living 97-task implementation register
├── e2e/                    # Playwright end-to-end test suites
│   ├── tests/              # Smoke, responsive, localization, and admin workflow tests
│   └── playwright.config.js
├── frontend/               # React 19 frontend application
│   ├── server/             # Node.js production SSR server
│   ├── src/                # App shell, components, features, pages, i18n, design tokens
│   └── tests/              # Vitest and React Testing Library suites
├── infrastructure/         # Deployment and infrastructure automation
│   ├── backup/             # Encrypted daily backup and restore scripts
│   ├── deployment/         # Service configuration (systemd, PM2) and deployment playbooks
│   └── nginx/              # Nginx reverse proxy configuration
├── .editorconfig           # Editor whitespace and formatting conventions
├── .gitignore              # Strict secret, dependency, and build artifact exclusions
├── AGENTS.md               # Autonomous agent guidelines and execution bounds
├── Graphic_Designer_Portfolio_Plan_v1_1.md # Approved canonical product scope
└── README.md               # This project documentation
```

---

## Git Workflow & Branching Strategy

To guarantee stability, safety, and reproducible builds, all development adheres to this branching model:

1. **`main`**: Protected production branch.
   - Represents releasable, deployed code.
   - Direct commits and force-pushes are strictly prohibited.
   - Merges require passing all CI suites and explicit owner authorization.
2. **`dev`**: Active integration branch.
   - Staging branch for completed, passing feature tasks.
   - All tests and lint checks must pass before merging.
3. **`feat/<task-id>-<description>`**: Task-specific feature branches.
   - Branched from `dev` (or initially from `main` during foundation).
   - Each task from the 97-task master plan is developed and verified in isolation.
   - Verified with passing automated checks before opening a pull request.

---

## Getting Started

Please refer to [`docs/LOCAL_SETUP.md`](docs/LOCAL_SETUP.md) for step-by-step developer setup instructions.

### Prerequisites

- **Node.js**: v20+ LTS (Tested on v25.9.0)
- **PHP**: v8.2+ with `pdo_mysql`, `mbstring`, `openssl`, `curl`, `gd`, `zip` extensions
- **Composer**: v2.6+
- **MySQL**: v8.0+
- **Git**: v2.40+
- **GitHub CLI (`gh`)**: v2.50+

### Quick Verification Commands

```bash
# Verify secret and dependency exclusions
git status
git diff --check
git check-ignore -v backend/.env frontend/node_modules

# Verify toolchain availability
php --version
composer --version
node --version
npm.cmd --version
```

---

## Project Documentation Index

- [Approved Master Plan](Graphic_Designer_Portfolio_Plan_v1_1.md): Canonical product scope across 9 phases and 97 tasks.
- [Agent Handoff & Bounds](AGENTS.md): Execution boundary and owner directives.
- [Architecture Blueprint](docs/ARCHITECTURE.md): System topology, immutable snapshots, hydration strategy, and domain entities.
- [Architecture Decision Records](docs/DECISIONS.md): Recorded decisions on branching, publishing, testing DB, and privacy.
- [Local Setup Guide](docs/LOCAL_SETUP.md): Comprehensive developer workstation setup instructions.
- [Plan Audit](docs/PLAN_AUDIT.md): Risk audit and required execution gates.
- [Implementation Progress](docs/PROGRESS.md): Live task register tracking status, tests, and commits.
