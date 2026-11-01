<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Backup Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | The storage disk where encrypted backups will be stored. Defaults to
    | 'backups' (local storage/app/backups), or an off-server S3/remote disk.
    |
    */
    'disk' => env('BACKUP_DISK', 'backups'),

    /*
    |--------------------------------------------------------------------------
    | Backup Encryption Key
    |--------------------------------------------------------------------------
    |
    | Secret key used to encrypt the MySQL dump and metadata manifest.
    | If not specified, the application APP_KEY is used.
    | Never commit or expose this key.
    |
    */
    'encryption_key' => env('BACKUP_ENCRYPTION_KEY'),

    /*
    |--------------------------------------------------------------------------
    | Retention Policy (Days)
    |--------------------------------------------------------------------------
    |
    | Number of days to retain backups. Backups older than this will be
    | automatically purged during the backup process. Default is 7 days.
    |
    */
    'retention_days' => (int) env('BACKUP_RETENTION_DAYS', 7),

    /*
    |--------------------------------------------------------------------------
    | Notification and Alerting
    |--------------------------------------------------------------------------
    |
    | Email and webhook destination for critical backup failure alerts.
    |
    */
    'alert_email' => env('BACKUP_ALERT_EMAIL', env('MAIL_FROM_ADDRESS', 'admin@mohammed-portfolio.test')),
    'alert_webhook' => env('BACKUP_ALERT_WEBHOOK'),
];
