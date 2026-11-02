# Phase 09 security and SEO audit (09.09)

This is focused local evidence, not production sign-off. The backend test command `php artisan test --filter='SecurityHeadersTest|SitemapTest|RobotsTest|PublicProjectsApiTest'` passed: 19 tests, 100 assertions. No live TLS, browser, or GitHub CI run has been verified.

| Canonical check | Local evidence | Status / remaining proof |
| --- | --- | --- |
| TLS and security headers | Laravel production header test passes; prepared Nginx HTTPS template includes HSTS and `nosniff`. | PARTIAL: no live certificate, `nginx -t`, browser CSP or header scan. The frozen Node SSR server still has permissive CSP and can expose exception text on a 500 response. |
| Sitemap and robots | `SitemapTest` and `RobotsTest` pass; sitemap service queries published projects and tests exclude draft/trashed entries. | PARTIAL: no live URL/crawl check or comparison against actual deployed routes. |
| Admin and draft indexing | Public API tests pass for draft exclusion, immutable published snapshots and preview `noindex`. Nginx template now adds `X-Robots-Tag: noindex, nofollow` on `/admin` routes. | PARTIAL: Nginx template has no runtime validation; no live crawl or auth check. Robots exclusion alone is not an access control. |
| Open Graph, canonical and locale metadata | Existing frontend SEO utility contains OG/canonical/hreflang generation. | DEFERRED: frontend files are frozen and no deployed SSR/browser source was inspected. |
| Dependency vulnerabilities | Full locked Composer audit found five Laravel framework advisories at v11.57.1, including a critical authentication advisory. Frontend npm audit found three Vitest/tinypool findings (two critical); E2E npm audit found zero. | BLOCKED: do not release with a failing security gate. Laravel remediation needs an owner stack decision; frontend dependency changes are frozen. |

The 09.09 acceptance gate remains open. Re-run dependency audits after approved remediation, validate Nginx and TLS on staging, inspect final HTTP response headers and page source, and confirm public indexing exposes no admin drafts or private media. No frontend file was modified for this audit.
