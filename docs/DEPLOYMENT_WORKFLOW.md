# Phase 09 deployment workflow preparation (09.05)

This is a proposed release procedure for an owner-approved staging environment. It has not been deployed or tested on Oracle. The current CI dependency audit fails, GitHub authentication is invalid, and no production domain, server, or credentials are available. Do not activate a deploy job or merge to `main` until 09.03/09.04 and the Phase 08 gate are resolved.

## Release sequence

1. Require a reviewed commit on protected `main`, a green `CI Gate`, owner approval in a protected GitHub environment, and a reproducible release identifier. Keep build jobs read-only. Do not put secrets in build artifacts.
2. Build backend dependencies from `composer.lock` in an approved Linux builder with `infrastructure/deployment/build-backend.sh --build`; use the already approved client/SSR build process without editing frontend source. Archive the exact backend and frontend outputs and record a SHA-256 digest in the trusted CI run. Artifact construction and frontend build acceptance remain blocked under the current freeze.
3. Transfer the archive over an authenticated, pinned-host-key SSH channel using a scoped deploy identity. The deploy identity may create release directories and switch the `current` symlink but must not read production backup keys or hold database administrator privileges. Do not expose SSH material in process arguments, logs, or artifacts.
4. On staging, run `infrastructure/deployment/verify-release-artifact.sh ARCHIVE EXPECTED_SHA256` using the digest from the trusted CI run. Reject mismatches before extraction. Extract into a new release directory, verify the archive's paths and file ownership, and attach the externally stored `.env` only after release files are in place. The checksum alone does not make an untrusted archive safe to extract.
5. Before migrations, take and verify an encrypted remote backup and inspect `php artisan migrate:status`. Apply only reviewed backward-compatible expand/contract migrations with `php artisan migrate --force`; do not use `migrate:fresh` or destructive schema changes in a live release. If compatibility is uncertain, stop and obtain an owner decision.
6. Switch `/srv/portfolio/current` atomically to the new release; restart/reload PHP-FPM, SSR and queue workers, then run `php artisan queue:restart`. Check `/health/ready`, `/api/v1/health`, SSR pages, sitemap, API authentication, and logs. Retain the previous release and its artifact/digest for rollback. If health fails, follow the 09.06 rollback procedure; database changes require a separately reviewed strategy.

## Acceptance evidence still missing

- A staging dry run that uses the real release artifact, secure transfer, safe migration path, service reload, and health verification.
- Artifact digest comparison against the trusted CI value, followed by a negative checksum test and archive path review.
- A protected `main` branch and GitHub environment approval gate, with a deliberately failing CI check shown to block merge and deploy.
- A tested rollback after a forced failure. No deployment, merge, artifact upload, or service change was performed here.
