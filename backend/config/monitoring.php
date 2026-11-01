<?php

return [
    /*
    |--------------------------------------------------------------------------
    | System Monitoring & Uptime Alerts
    |--------------------------------------------------------------------------
    */
    'enabled' => env('MONITORING_ENABLED', false),

    'health_urls' => [
        'api' => env('MONITORING_API_HEALTH_URL'),
        'ssr' => env('MONITORING_SSR_HEALTH_URL'),
    ],

    'thresholds' => [
        'disk_free_min_percent' => (float) env('MONITORING_DISK_FREE_MIN_PERCENT', 15.0),
        'memory_max_percent' => (float) env('MONITORING_MEMORY_MAX_PERCENT', 85.0),
        'db_latency_max_ms' => (float) env('MONITORING_DB_LATENCY_MAX_MS', 500.0),
        'max_failed_jobs' => (int) env('MONITORING_MAX_FAILED_JOBS', 0),
    ],

    'alert_email' => env('MONITORING_ALERT_EMAIL'),
    'alert_webhook' => env('MONITORING_ALERT_WEBHOOK'),

    // Cooldown in minutes to prevent alert storms and duplicate notifications
    'cooldown_minutes' => (int) env('MONITORING_COOLDOWN_MINUTES', 30),
];
