#!/usr/bin/env bash
# ==============================================================================
# Graphic Designer Portfolio — Automated Database Backup Script
# Task 08.07: Encrypted MySQL dump with 7-day retention and alerting
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BACKEND_DIR="${PROJECT_ROOT}/backend"
LOG_DIR="${PROJECT_ROOT}/storage/logs"
LOG_FILE="${LOG_DIR}/backup.log"

mkdir -p "${LOG_DIR}"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

log "INFO: Starting automated database backup runner..."

if [ ! -d "${BACKEND_DIR}" ]; then
    log "ERROR: Backend directory ${BACKEND_DIR} does not exist!"
    exit 1
fi

cd "${BACKEND_DIR}"

# Execute Artisan backup command
if php artisan backup:run >> "${LOG_FILE}" 2>&1; then
    log "SUCCESS: Automated database backup completed successfully."
    exit 0
else
    log "CRITICAL: Automated database backup failed! Check logs at ${LOG_FILE}."
    exit 1
fi
