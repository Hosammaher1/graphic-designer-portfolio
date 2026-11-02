# Phase 09 rollback preparation (09.06)

Rollback is a staged operational action, not an automated database downgrade. No production or staging release was switched during this task. The live forced-failure drill remains blocked by missing infrastructure, a failing security audit, and owner approval.

## Preflight and switch

1. Keep each release under `/srv/portfolio/releases/RELEASE_ID` and retain at least the previous healthy release and its verified artifact digest. `/srv/portfolio/current` must be a symlink into that directory. Confirm a current encrypted remote backup, operational monitoring, and the approved prior release ID.
2. Run `infrastructure/deployment/switch-release.sh /srv/portfolio /srv/portfolio/releases/PRIOR_ID --check`. It requires Laravel and built SSR artifacts in the target and checks that current and target both resolve under the release root. This is read-only.
3. After an owner-authorized incident decision, run the same command with `--apply` and `PORTFOLIO_ROLLBACK_APPROVED=1` set in the operator session. The script creates a temporary link and renames it over `current` atomically; it does not delete releases, change the database, restart services, or declare recovery.
4. Restart PHP-FPM, SSR and queue workers, then check `/health/ready`, `/api/v1/health`, Arabic and English pages, API behavior, and logs. Keep traffic drained or in maintenance mode until checks pass. If the old application cannot read the migrated schema, stop and follow the reviewed database recovery plan; do not run destructive down migrations against production by default.

## Migration compatibility

Use expand/contract migrations: deploy additive schema changes while old and new versions both work, backfill safely, then remove old columns only after the rollback window closes. Review each migration for column drops, renames, new non-null constraints, data rewrites, and irreversible transformations before release. For an incompatible migration, prepare a separately tested restore or forward-fix path and obtain owner approval. A code symlink rollback alone cannot reverse database state or external provider writes.

## Acceptance drill still required

On an isolated staging host, deploy two known-good releases, force a failure after the new release becomes current, run the rollback, and prove the previous release serves healthy API and SSR responses while queued jobs remain safe. Record timings, artifact hashes, database compatibility, service status, and monitoring recovery. Do not call 09.06 DONE until this drill passes.
