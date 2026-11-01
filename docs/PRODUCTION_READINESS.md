# Production readiness inventory — preparation only

**Task:** Phase 09, Task 09.01. **Status:** No deployment or go-live is authorized. This inventory records known local evidence and missing owner inputs; it does not assert that Oracle Always Free capacity, external providers, or the production domain are ready.

| Requirement | Current evidence | Gate before activation |
| --- | --- | --- |
| GitHub repository and access | Local `origin` points to `Hosammaher1/graphic-designer-portfolio`; current `gh auth status` reports an invalid token. Local task branches are not pushed. | Repair CLI authentication, verify remote privacy/access, push and inspect required CI checks. |
| Domain, DNS, and TLS | No owner-provided production domain or DNS access is recorded. | Owner supplies domain/DNS and approves certificate setup. Test HTTPS and renewal in staging. |
| Oracle VM and capacity | Intended host is Oracle Cloud Always Free; no account, VM, capacity, or quota proof is recorded. | Owner supplies account/VM and confirms current capacity and terms before any provisioning. |
| Laravel and database | Laravel 11 and MySQL tests run locally. The API has health and readiness routes. | Verify production PHP extensions, MySQL identity and backups, queue worker, scheduler, and migrations on isolated staging first. |
| Node SSR and frontend artifact | Existing frontend and SSR files are read-only in this run. | Frontend build and browser acceptance are DEFERRED; do not change frontend files or claim a production artifact. |
| Cloudinary and media recovery | Adapter and local fake exist. SQL backups preserve references, not image binaries. | Owner supplies secure credentials, confirms private-original delivery and a recoverable copy of originals. |
| Contact email and alerts | Database queue and mail adapters exist; local tests use fakes. | Owner supplies provider, sender domain, test recipient, alert recipient, and delivery limits. Demonstrate controlled send, failure, and recovery. |
| Encrypted off-server backup | Local backup/restore code and runbook exist. | Owner selects remote destination and key custody; verify encrypted remote archive, seven-copy retention, and isolated restore. |
| Privacy/legal content | Consent logic has local tests. | Owner approves privacy/contact copy and retention policy before public launch. |
| Production approval and rollback | No deployment workflow or live rollback proof is recorded. | Require an explicit GitHub environment/manual approval gate, tested staging deploy, health check, rollback drill, and owner release sign-off. |

## Backend build boundary

`bash infrastructure/deployment/build-backend.sh --check` validates the locked Composer manifest and PHP entrypoint without installing dependencies. `--build` is reserved for an approved Linux/staging build environment and installs backend dependencies from `composer.lock` with `--no-dev`; it does not edit or build the frontend. The script does not cache runtime configuration because doing so before injecting production secrets could bake wrong or sensitive values into an artifact. No build or deployment was executed for this inventory.

## Next decisions

The owner must provide or approve the external items above before their corresponding live tasks can complete. Continue independent, reversible infrastructure and CI preparation on feature branches. Do not merge to `dev`/`main`, deploy, or start Phase 10 under the current instruction.
