# ==============================================================================
# Graphic Designer Portfolio — Automated Database Backup Script (PowerShell)
# Task 08.07: Encrypted MySQL dump with 7-day retention and alerting
# ==============================================================================
[CmdletBinding()]
param (
    [string]$Disk = "backups",
    [int]$Retention = 7
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Resolve-Path "$ScriptDir\..\.."
$BackendDir = "$ProjectRoot\backend"
$LogDir = "$ProjectRoot\storage\logs"
$LogFile = "$LogDir\backup.log"

if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

function Log-Message([string]$Message) {
    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    $line = "[$timestamp] $Message"
    Write-Output $line
    Add-Content -Path $LogFile -Value $line
}

Log-Message "INFO: Starting automated database backup runner (PowerShell)..."

if (-not (Test-Path $BackendDir)) {
    Log-Message "ERROR: Backend directory $BackendDir does not exist!"
    exit 1
}

Push-Location $BackendDir
try {
    php artisan backup:run --disk="$Disk" --retention="$Retention"
    if ($LASTEXITCODE -eq 0) {
        Log-Message "SUCCESS: Automated database backup completed successfully."
        exit 0
    } else {
        Log-Message "CRITICAL: Automated database backup failed with exit code $LASTEXITCODE."
        exit 1
    }
} catch {
    Log-Message "CRITICAL: Backup failed: $_"
    exit 1
} finally {
    Pop-Location
}
