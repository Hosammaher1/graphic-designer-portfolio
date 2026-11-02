# Phase 09 infrastructure preparation (09.02)

These files are templates for an owner-approved Linux staging host. They do not install packages, configure a firewall, issue a certificate, deploy an application, or prove production readiness. The paths assume a release symlink at `/srv/portfolio/current`; verify the actual release layout and service users first.

## Install order and host checks

1. Confirm the actual Oracle VM, domain, DNS, PHP-FPM version, Node path, MySQL service, package versions and capacity. Keep production environment values outside the repository. Ensure `/srv/portfolio/current/backend/storage` and `bootstrap/cache` are writable by `www-data`, while application source and the frontend build are read-only to service users. The `portfolio` SSR user must be able to read the built client and server bundles.
2. Review and install `infrastructure/mysql/portfolio.cnf.template` only if this VM runs its own MySQL. Grant the app a dedicated least-privilege database user; never expose port 3306. Validate with `mysqld --validate-config` if supported by the installed server, then check `systemctl status mysql` and a local `SELECT 1` using a securely supplied account.
3. Review and install the PHP-FPM pool under the installed PHP version's pool directory; validate with that version's `php-fpm -t` command and start the matching PHP-FPM unit. Install `portfolio-ssr.service`, `portfolio-queue.service`, `portfolio-schedule.service` and `portfolio-schedule.timer` under `/etc/systemd/system/`; run `systemd-analyze verify` on them, `systemctl daemon-reload`, then start and check each unit. Node SSR currently binds `0.0.0.0:3000`, so host and cloud firewalls **must block public 3000**. Keep PHP-FPM on its Unix socket and MySQL on loopback.
4. Replace `example.invalid` in the Nginx template with the approved domain. Obtain the certificate through the approved ACME workflow before enabling its HTTPS server block. Set the certificate paths to the issued files, then run `nginx -t` before reloading Nginx. The HTTP block permits the ACME webroot at `/var/www/letsencrypt` and redirects other traffic to HTTPS. Confirm the challenge directory and DNS before attempting issuance.
5. Configure host and Oracle security-list/NSG ingress to allow only necessary public ports: TCP 80 and 443; allow SSH only from approved operator sources. Deny public TCP 3000, 3306, 9000 and any PHP-FPM socket access. Preserve an active SSH session and verify the SSH allow rule before applying firewall changes. Check effective rules with `ufw status numbered`, `ss -lntup`, and an external port scan from an authorized host. No firewall command is run by this repository.
6. Install the Laravel logrotate file and validate with `logrotate -d /etc/logrotate.d/portfolio`. The distribution's Nginx logrotate policy and journald retention for systemd services must also be reviewed. Check disk headroom, log permissions, and expected rotation after a real interval. `copytruncate` can lose log lines during rotation; use the host's approved logging policy if stronger guarantees are needed.

## Acceptance checks still requiring staging

- Run `nginx -t`, PHP-FPM pool validation, `systemd-analyze verify`, service startup/restart, and `curl -f https://DOMAIN/health/ready` on the configured host.
- Verify `/ar/` and `/en/` SSR, `/api/v1/health`, `/sanctum/csrf-cookie`, `/robots.txt`, `/sitemap.xml`, static assets, admin noindex, and HTTPS redirect. Confirm no PHP source or private files are served. Browser and frontend acceptance remain deferred under the frontend freeze.
- After a real certificate exists, run `certbot renew --dry-run` (or the selected ACME client's equivalent) and record its result. Verify the renewal timer.
- Verify only 80/443 and approved SSH are externally reachable, and confirm log rotation and disk headroom.

Do not mark 09.02 DONE until these checks pass on an approved staging host. No production service, firewall, certificate, or database was changed by this preparation.
