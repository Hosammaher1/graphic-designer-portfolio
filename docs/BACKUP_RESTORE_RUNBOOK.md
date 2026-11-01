# Operations Runbook: Database Backup & Disaster Recovery

**Task Reference:** Phase 08 — Tasks 08.07 & 08.08  
**Canonical Plan:** `Graphic_Designer_Portfolio_Plan_v1_1.md`  
**Last Updated:** 2026-11-01  

---

## 1. Overview & Objectives

| Metric | Target | Description |
|---|---|---|
| **RPO (Recovery Point Objective)** | **24 Hours** | Automated daily database backups run at 02:00 UTC via Laravel Scheduler. Maximum potential data loss is limited to 24 hours of newly published content. |
| **RTO (Recovery Time Objective)** | **< 15 Minutes** | Full SQL restore and table integrity verification from encrypted archive to target database completes in under 15 minutes. |
| **Encryption Standard** | **AES-256-CBC + HMAC-SHA256** | All backups are encrypted before storage. Key custody is managed via environment secret (`BACKUP_ENCRYPTION_KEY`). Never commit encryption keys. |
| **Retention Policy** | **7 Days** | Daily backups older than 7 days are automatically purged to prevent unbounded storage consumption. |

---

## 2. Key Custody and Encryption Architecture

1. **Encryption Cipher:** AES-256-CBC with a 16-byte cryptographically secure random Initialization Vector (IV).
2. **Authentication:** HMAC-SHA256 (Encrypt-then-MAC) over `IV + Ciphertext` protects against ciphertext tampering and padding oracle attacks.
3. **Key Source:** Configured in `BACKUP_ENCRYPTION_KEY` in `backend/.env`. If omitted, defaults to `APP_KEY`.
4. **Manifest Inclusion:** Each archive bundles a JSON manifest containing:
   - Database name and creation timestamp
   - Checksum: SHA-256 hash of the unencrypted SQL dump
   - Table-by-table record counts
   - Media asset reference count
   - Cipher specification

---

## 3. Cloudinary Media Recovery Limitations & Policy

> [!IMPORTANT]
> **Media Recovery Boundary:** Database backups contain all relational metadata for media (`media_assets`, `project_media`), including Cloudinary public IDs, transformation URLs, responsive image dimensions, and watermark flags.
> 
> However, **raw binary images are hosted externally on Cloudinary** and are **not** bundled into the daily SQL archive (as per approved Architecture Plan v1.1, Section 0.4 and ADR-004).
> 
> **Disaster Recovery Strategy for Media:**
> 1. In standard database restoration drills, restoring the SQL dump fully reconnects all projects to their Cloudinary assets with zero broken image links.
> 2. If Cloudinary itself suffers catastrophic account loss, originals must be re-synced from designer local archives or Cloudinary auto-backup to AWS S3 / Google Cloud Storage.

---

## 4. Operational Commands

### 4.1 Run Manual Backup
```bash
# Via Artisan command
cd backend
php artisan backup:run

# With custom retention or storage disk
php artisan backup:run --disk=backups --retention=14
```

### 4.2 Verify Backup Integrity (Dry Run Drill)
```bash
# Verify latest backup decryptability, HMAC, and SHA-256 checksum without applying mutations
cd backend
php artisan backup:restore --verify-only

# Verify specific archive
php artisan backup:restore portfolio_backup_2026-11-01_201358.enc --verify-only
```

### 4.3 Execute Restore Drill to Isolated Database
```bash
# Restore to isolated testing connection (portfolio_testing)
cd backend
php artisan backup:restore portfolio_backup_2026-11-01_201358.enc --connection=restore_isolated --force
```

### 4.4 Automated Linux Server Cron
```bash
# /etc/cron.d/portfolio-backup
0 2 * * * www-data /var/www/portfolio/infrastructure/backup/backup.sh >> /var/log/portfolio-backup.log 2>&1
```

---

## 5. Verification Checklist for Restore Drills

1. [ ] Archive exists and decrypts cleanly with `BACKUP_ENCRYPTION_KEY`.
2. [ ] HMAC-SHA256 signature verification succeeds (zero tampering).
3. [ ] Unencrypted SQL SHA-256 matches manifest checksum.
4. [ ] All 26 database tables are restored into target database.
5. [ ] Post-restore table counts exactly match manifest expected counts (`users`, `projects`, `categories`, `media_assets`, `pages`).
6. [ ] Admin authentication and project show endpoints work properly against restored state.
