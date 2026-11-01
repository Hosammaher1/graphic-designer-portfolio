# Phase 08 canonical compliance audit

**Date:** 2026-11-02. **Authority:** [Graphic_Designer_Portfolio_Plan_v1_1.md](../Graphic_Designer_Portfolio_Plan_v1_1.md), Section 11. This audit corrects task mapping in [PROGRESS.md](PROGRESS.md). Earlier execution reports and commits remain historical evidence under the labels used when they were written; their labels do not redefine the master plan.

| Canonical task | Satisfied by current local evidence | Partial, blocked, or absent |
| --- | --- | --- |
| **08.01 Security audit** | Fifteen penetration tests cover auth, IDOR, SQL injection, XSS/XXE, rate limiting, draft exposure, and signed previews. | **Partial:** no documented SSRF/open-redirect surface review or complete critical-finding sign-off. Current CSP and upload findings below remain open. |
| **08.02 Upload hardening** | Local FileUploadSecurityTest: 9 passed/39 assertions. Fileinfo-only MIME sniffing, extension agreement, JPEG/PNG/WebP allowlist, 15MB and dimension/pixel caps are implemented; unauthorized asset and disguised PHP tests exist. | **Partial:** image re-encoding/provider transform and real Cloudinary upload/delete are unproved. The adapter still constructs URLs locally, and its `original_url` points to a public delivery path. Provider integration and protected-original behavior remain open. |
| **08.03 Security headers/TLS** | Laravel production CSP excludes inline/eval scripts and localhost connections; production HSTS, nosniff, framing and referrer policy pass local tests (4 tests/29 assertions). | **Partial/blocked:** the frozen Node SSR server still sends a CSP with inline/eval and localhost allowances. Live TLS and browser script behavior cannot be verified without an approved host and frontend review. |
| **08.04 Error contract** | API exceptions now use fixed Arabic/English messages selected from `Accept-Language`, with a `Content-Language` header; 404 paths and production 500 details are masked. Admin 401/403 responses follow the same envelope while preserving the established English 403 text. | **Partial/blocked:** validation field messages and some controller-authored errors are still English. The frozen SSR error page and live failure behavior cannot be verified here. |
| **08.05 Retry/idempotency** | Contact requests with an optional Idempotency-Key now use a unique hashed key and payload fingerprint, preventing duplicate inquiries/mail queue entries; inquiry mailables have three bounded attempts and backoff. Project publishing records keyed snapshot versions under a row lock; repeat and stale-key tests pass. Repeated page publishing keeps the same version. | **Partial:** media uploads have no durable idempotency claim while the provider adapter is a stand-in. Provider timeout after accepted mail, failed queue dispatch after inquiry creation, cleanup retries, and transient provider recovery remain unresolved. |
| **08.06 Audit logs/redaction** | Every authenticated admin mutation now records a route/method/status audit event without request bodies. Nested audit details redact password/token/message/body/payload/exception/trace/cookie keys; user agents are hashed. Production exception logs and backup/provider failure logs use fixed text with exception class only. Negative message-body, secret, and exception-log tests pass locally. | **Partial:** live log shipping/retention and a production incident drill are unverified; database outage can prevent audit persistence, in which case a fixed error is logged. |
| **08.07 Backup job** | Encrypted SQL archive, integrity manifest, retention, and failure-alert tests pass locally. | **Blocked:** configured default disk is local; no selected off-server provider, key-custody proof, remote retention proof, or live upload-alert drill. |
| **08.08 Restore drill** | Isolated restore, HMAC/checksum rejection, and record-count tests pass locally; RPO/RTO and Cloudinary binary limitation are documented. | **Blocked:** no encrypted off-server archive has been restored into a disposable environment. |
| **08.09 Trash cleanup scheduler** | Daily purge is scheduled; 30-day boundary, shared-media, and provider-error tests exist. | **Partial:** after all provider delete attempts fail, project pivots are removed and the orphan asset has no durable cleanup retry path. |
| **08.10 Health checks** | API/root liveness and readiness routes, DB/cache/storage checks, 503 degradation, and no-secret tests pass locally. | **Blocked:** separate Node SSR readiness is absent; frontend/SSR files are frozen. Live deployment probes are unverified. |
| **08.11 Monitoring** | Configurable API/SSR HTTP probes, disk/PHP-memory/DB/failed-job checks, alert deduplication, recovery mail/webhook tests, and daily Laravel log rotation exist. | **Partial/blocked:** host CPU sampling is absent; outside-in uptime, live mail delivery, host log rotation, and alarm drill are unverified. |
| **08.12 Reliability E2E** | Backend unit/feature tests and an operations runbook exist. | **Blocked:** no combined Cloudinary/mail failure, DB rollback, off-server restore, SSR 500, recovery, and security-scan E2E proof. Frontend/browser work is deferred. |

## Historical task-label mapping

| Historical ledger label | Canonical destination |
| --- | --- |
| 08.01 Security headers and CSP | 08.03 Security headers/TLS |
| 08.02 Input sanitization and XSS | Evidence for 08.01 and 08.04; not canonical 08.02 |
| 08.03 File upload security | 08.02 Upload hardening |
| 08.04 Rate limiting hardening | Evidence for 08.01; not canonical 08.04 |
| 08.05 Error handling and redacting | 08.04 Error contract and 08.06 redaction; not canonical 08.05 |
| 08.06 Security penetration tests | 08.01 Security audit |
| 08.09 Health check endpoint and 08.11 graceful degradation | 08.10 Health checks |
| 08.10 Uptime and alert configuration | 08.11 Monitoring |
| 08.12 Operations runbook | Supporting evidence for 08.12, not Reliability E2E completion |

## Dependency-aware non-frontend queue

1. Close eligible security gaps in 08.01–08.06 with focused tests first: upload validation, production-safe headers, redaction, and retry/idempotency. Preserve public API compatibility.
2. Make 08.09 cleanup failures retryable and add host CPU monitoring for 08.11, with tests.
3. Re-run the applicable backend suite and review the diff. Keep 08.07/08.08 off-server proof, 08.10 SSR readiness, and 08.12 browser/SSR E2E blocked until their required inputs or frontend authorization exist.
4. Only after the Phase 08 gate has real evidence may Phase 09 work resume. The saved 09.01 WIP branch remains untouched during this audit.

**GitHub:** `gh auth status` last reported an invalid token. Re-authenticate only through the owner's interactive `gh auth login -h github.com` workflow. No push or GitHub CI result is claimed for the local Phase 08 branches.

## Focused security surface review

The backend source search found outbound HTTP only in configured monitoring/backup alert paths. No controller redirect or request-derived redirect destination was found. This narrows the current SSRF/open-redirect surface, but it does not close 08.01 while the upload and CSP findings above remain open. The Cloudinary adapter's URL construction is a local stand-in, not proof of a remote upload or protected original. The upload review follows the [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html); the URL surface review follows [OWASP SSRF](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html) and [redirect](https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html) guidance.
