# Phase 09 secret and environment preparation (09.03)

No credential has been created, copied, printed, or placed in this repository. The current GitHub CLI session has an invalid token; GitHub environment secrets and branch protection cannot be configured or verified here. Use an owner-authorized interactive login before making account changes. Do not paste tokens into commands, issue logs, source files, or pull requests.

## Runtime inventory

| Purpose | Existing configuration keys | Custody and access |
| --- | --- | --- |
| Laravel signing and public URL | `APP_KEY`, `APP_ENV`, `APP_DEBUG`, `APP_URL` | Generate a unique production key on the approved host; keep debug off and URL HTTPS. Treat key rotation as a session and encrypted-data migration, not a routine redeploy. |
| Database | `DB_HOST`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | Dedicated application account limited to the application schema; bind MySQL to loopback; keep database administrator credentials separate. |
| Cloudinary | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Owner-supplied scoped provider account. Verify private-original policy and rotate by replacing the server secret, then confirm uploads before retiring old credentials. |
| Contact and alert email | `MAIL_MAILER`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS` | Scoped mail sender and verified domain; test with an owner-approved recipient. Never use `log` mailer for production messages. |
| Backups | `BACKUP_ENCRYPTION_KEY`, `BACKUP_DISK`, `BACKUP_ALERT_EMAIL`, `BACKUP_ALERT_WEBHOOK` | Separate key preferred over the `APP_KEY` fallback. Store outside the host as well as outside Git; retain old keys for existing archives during rotation. Off-server destination and key custody remain owner decisions. |
| Monitoring | `MONITORING_ENABLED`, `MONITORING_API_HEALTH_URL`, `MONITORING_SSR_HEALTH_URL`, `MONITORING_ALERT_EMAIL`, `MONITORING_ALERT_WEBHOOK` | Enable only after approved endpoints and alert recipient exist. Webhook URLs are secrets; keep them out of command output and logs. |

Use `backend/.env.example` only as a key inventory, not as a production secret file. Place the real backend environment outside release directories, for example `/etc/portfolio/backend.env`, owned by root with group `www-data` and mode `0640` (or mode `0600` when the runtime owner reads it). Link it into the active backend release as `.env` only after checking its resolved path and permissions. Keep the private deploy key outside the repository with mode `0600` or `0400`, owned by the deploy identity. Do not put deploy credentials in the web server or PHP-FPM process environment. Restrict release write access to the deploy identity; restrict Laravel `storage` and `bootstrap/cache` writes to the runtime identity.

`infrastructure/deployment/check-secret-permissions.sh ENV_FILE DEPLOY_PRIVATE_KEY` checks that each supplied path resolves outside the repository and has the expected file mode. It prints no secret contents. It does **not** prove owner/group ACLs, provider scope, key rotation, or that secret values are valid; check those on staging with `stat`, effective access tests, and provider consoles without printing values.

## GitHub and rotation gates

When authentication is restored, use a protected GitHub environment for deployment secrets and require owner approval for production. The future deployment workflow should consume a scoped deploy host/user, private key and pinned host key through environment secrets. Configure read-only repository permissions for build jobs and restrict the deploy job to the approved environment. Rotate deploy keys by adding a new key with the minimum host access, verifying a staging deploy, revoking the old key, and recording completion without recording key material.

Before declaring 09.03 done: verify every required provider credential exists in its intended vault/host or GitHub environment; test least-privilege access; check file owner, group, ACL and mode on the actual host; scan staged and committed files plus CI logs for accidental disclosure; and prove key rotation/revocation. These are external acceptance checks, so 09.03 remains IN_PROGRESS/BLOCKED until evidence exists.
