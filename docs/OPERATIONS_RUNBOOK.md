# Operations runbook — non-production preparation

**Task:** 08.12. **Scope:** API, database, queue, backup, and monitoring operations through Phase 09. This document describes commands present in the repository. It is not evidence of a deployed service, a working external alert destination, or a completed disaster recovery drill.

## Service checks

| Check | Expected result | Use |
| --- | --- | --- |
| `GET /api/v1/health/live` | HTTP 200 while the Laravel process can answer | Process liveness. It does not prove dependencies work. |
| `GET /api/v1/health/ready` | HTTP 200 only when database, cache, and local storage checks pass; HTTP 503 otherwise | Load balancer readiness. |
| `GET /api/v1/health` | `ok`/200 or `degraded`/503 with per-service status | Incident triage without exception details. |
| `GET /health/live`, `/health/ready`, `/health` | Same checks at root paths | Reverse-proxy or external monitor integration. |
| `php artisan monitor:check` | Metrics and status, without sending notifications or changing alert cooldown state | Safe local inspection. |
| `php artisan schedule:list` | Daily trash purge, 02:00 backup, five-minute monitor | Verify scheduler registration. |

Run Artisan commands from `backend/`. Configure `MONITORING_ENABLED=true`, `MONITORING_API_HEALTH_URL`, `MONITORING_SSR_HEALTH_URL`, and at least one of `MONITORING_ALERT_EMAIL` or `MONITORING_ALERT_WEBHOOK` before enabling alert delivery. Test with a controlled recipient and synthetic outage; `monitor:check --alert` can send real email/webhook notifications. Keep URLs and credentials in environment configuration, never in Git or incident logs. The configured HTTP probes check response status only; an outside-in monitor is still needed to detect host or network loss.

## Incident response

1. Record the alert time, affected endpoint, and whether `/health/live` and `/health/ready` differ. Do not copy secrets or full inquiry messages into incident notes.
2. If liveness fails, check the PHP-FPM/web service and reverse proxy. If liveness passes but readiness fails, use the `dependencies` and `services` fields to identify database, cache, or storage failure. Do not restart a healthy service simply because an external probe is misconfigured.
3. If the API is healthy but public pages fail, check the Node SSR process and its configured probe. Browser and SSR recovery verification requires the frontend workstream; this run does not edit frontend files.
4. If media delivery fails, preserve the database's `media_assets` references and check provider status and configured transformations. Do not delete or re-upload originals as an incident shortcut.
5. If mail delivery fails, inspect queue failures and the configured mail provider. The contact API's accepted/queued response is not proof that a recipient received an email. Avoid blind retries where delivery may already have occurred.
6. On recovery, confirm readiness and the affected user journey, then verify one recovery notification and no duplicate alert storm.

## Background work and logs

`backend/.env.example` selects the database queue. The scheduler registers `projects:purge-trash --days=30` daily, `backup:run` at 02:00 application time, and `monitor:check --alert` every five minutes. A production scheduler and durable queue worker must be installed and supervised during Phase 09; registration alone does not run jobs. Use `php artisan queue:failed` to inspect failed jobs before retrying them. Laravel's `daily` log channel retains 14 days by configuration; verify server disk headroom and host log rotation separately.

Do not run `migrate:fresh`, `backup:restore`, destructive cleanup, or a production `queue:retry all` during triage. Restoration must target an isolated database first, following [BACKUP_RESTORE_RUNBOOK.md](BACKUP_RESTORE_RUNBOOK.md). Daily encrypted SQL backups cover database records, not Cloudinary image binaries. The off-server destination, key custody, and media recovery source require owner decisions and a live restore drill before the Phase 08 gate can pass.

## Verification matrix

| Scenario | Local evidence or command | Remaining release proof |
| --- | --- | --- |
| Database/cache/storage outage | `php artisan test --filter=HealthCheckEndpointTest`; live stays 200, readiness becomes 503 | Run against a disposable staging deployment. |
| API/SSR uptime alert and recovery | `php artisan test --filter=SystemMonitoringAndAlertTest` with fake HTTP/mail transports | Configure real endpoints and controlled recipient; observe alert, deduplication, and recovery outside the host. |
| Provider failure and retries | Existing media, contact, backup, and trash tests in `php artisan test` | Inject controlled Cloudinary and mail failures in staging; verify no duplicate send or deleted shared asset. |
| Backup integrity and restore | `php artisan test --filter=Backup`; [backup runbook](BACKUP_RESTORE_RUNBOOK.md) | Restore an encrypted off-server copy to an isolated database and compare records. |
| SSR error page and browser recovery | Existing Playwright suites under `e2e/tests/` | Frontend-dependent verification is DEFERRED in this run. |
| Security checks and logs | `php artisan test --filter=Security`; inspect redacted error responses | Review production headers, TLS, logs, and alert delivery after infrastructure approval. |

## Handoff gates

- **Before Phase 08 is called complete:** demonstrate a real off-server encrypted backup restore, synthetic outage alert and recovery, host CPU/RAM/disk coverage, provider failure recovery, and no critical security flaw. Record exact commands and outputs in `docs/PROGRESS.md`.
- **Before Phase 09 production activation:** obtain owner-approved domain, Oracle capacity, Cloudinary and mail settings, remote backup destination, deployment secrets, and go-live approval. Keep deployment behind an explicit approval gate; no merge alone may start the first production release.
- **Current restriction:** frontend files and Phase 10 are outside this run. Mark browser and UI-dependent checks DEFERRED instead of inferring that they passed.
