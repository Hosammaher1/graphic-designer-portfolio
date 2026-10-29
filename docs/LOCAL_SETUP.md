# Local Development Environment Setup Guide

This guide details the complete workstation setup process for contributors to the **Graphic Designer Portfolio** project. Follow these steps to configure your local runtime, databases, frontend, backend, and testing harnesses.

---

## 1. Prerequisites & Toolchain Verification

Ensure the following tools are installed on your machine:

| Tool | Minimum Version | Windows / macOS / Linux Verification Command |
| --- | --- | --- |
| **Git** | `2.40+` | `git --version` |
| **GitHub CLI** | `2.50+` | `gh --version` |
| **Node.js** | `20.0+ LTS` | `node --version` |
| **npm** | `10.0+` | `npm.cmd --version` (Windows) or `npm --version` (Unix) |
| **PHP** | `8.2+` | `php --version` |
| **Composer** | `2.6+` | `composer --version` |
| **MySQL Server**| `8.0+` | `mysql --version` (or active XAMPP/Docker daemon) |

### Required PHP Extensions

Verify that the following extensions are active in your `php.ini`:
- `pdo_mysql`
- `mbstring`
- `openssl`
- `curl`
- `gd`
- `zip`
- `fileinfo`
- `xml`

```bash
php -m | grep -E "pdo_mysql|mbstring|openssl|curl|gd|zip|fileinfo|xml"
```

---

## 2. Git Clone and Branching

```bash
# Clone the repository
git clone https://github.com/Hosammaher1/graphic-designer-portfolio.git
cd graphic-designer-portfolio

# Switch to the development integration branch
git checkout dev

# For a specific task, branch out from dev
git checkout -b feat/<task-id>-<description>
```

---

## 3. Database Initialization (MySQL)

Create two dedicated local databases in MySQL: one for local development and one isolated database for running automated test suites.

```sql
-- Connect via MySQL CLI or phpMyAdmin
CREATE DATABASE IF NOT EXISTS `portfolio_dev` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `portfolio_testing` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant permissions to your local database user (example: root)
GRANT ALL PRIVILEGES ON portfolio_dev.* TO 'root'@'localhost';
GRANT ALL PRIVILEGES ON portfolio_testing.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

---

## 4. Backend Setup (Laravel 11 API)

```bash
# Navigate to the backend directory
cd backend

# Install PHP dependencies
composer install

# Configure environment file
cp .env.example .env

# Generate application cryptographic key
php artisan key:generate

# Update database configuration in backend/.env:
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=portfolio_dev
# DB_USERNAME=root
# DB_PASSWORD=

# Run database migrations
php artisan migrate

# Seed initial admin user and sample data
php artisan db:seed --class=AdminUserSeeder

# Start the Laravel development server
php artisan serve --port=8000
```

The API will now be accessible at `http://localhost:8000/api/v1/health`.

---

## 5. Frontend Setup (React 19 + SSR)

In a separate terminal:

```bash
# Navigate to the frontend directory
cd frontend

# Install Node dependencies
npm ci

# Start the Vite client development server (hot-reloading)
npm run dev

# Or build and launch the production Node.js SSR server:
npm run build
npm run serve:ssr
```

The SSR web application will be accessible at:
- Arabic (Primary, RTL): `http://localhost:3000/ar/`
- English (Secondary, LTR): `http://localhost:3000/en/`
- Admin Shell: `http://localhost:3000/admin/`

---

## 6. End-to-End Testing Setup (Playwright)

In a separate terminal:

```bash
# Navigate to the e2e test directory
cd e2e

# Install test dependencies
npm ci

# Install Playwright browser binaries
npx playwright install --with-deps chromium firefox webkit

# Execute the complete browser test suite
npx playwright test
```

---

## 7. Verification & Sanity Checks

Run the following test commands across suites to verify a clean environment:

```bash
# 1. Backend PHPUnit feature & unit tests (runs against isolated portfolio_testing DB)
cd backend && php artisan test

# 2. Frontend Vitest unit & component tests
cd frontend && npm test -- --run

# 3. Frontend production build validation
cd frontend && npm run build

# 4. End-to-end browser smoke tests
cd e2e && npx playwright test

# 5. Verify no secrets or vendor folders are tracked
git status
git diff --check
git check-ignore -v backend/.env frontend/node_modules
```

---

## 8. Security Hygiene & Secret Exclusion

- **NEVER** commit `.env` or any file containing private keys, API secrets, or passwords.
- Always check that new configuration files use `.env.example` placeholders.
- Verify Git ignore status anytime new dependencies or config files are introduced:
  ```bash
  git check-ignore -v backend/.env frontend/node_modules
  ```
