<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

// Automatically purge soft-deleted projects older than 30 days every day
Schedule::command('projects:purge-trash --days=30')->daily();

// Daily encrypted database backup and 7-day retention
Schedule::command('backup:run')->dailyAt('02:00');
