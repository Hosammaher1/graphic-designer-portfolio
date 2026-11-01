<?php

use App\Http\Controllers\RobotsController;
use App\Http\Controllers\SitemapController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// System Health Probes
Route::get('/health', [\App\Http\Controllers\Api\V1\HealthController::class, 'health'])->name('health');
Route::get('/health/live', [\App\Http\Controllers\Api\V1\HealthController::class, 'live'])->name('health.live');
Route::get('/health/ready', [\App\Http\Controllers\Api\V1\HealthController::class, 'ready'])->name('health.ready');

// Dynamic SEO Endpoints
Route::get('/robots.txt', [RobotsController::class, 'index'])->name('robots.index');
Route::get('/sitemap.xml', [SitemapController::class, 'index'])->name('sitemap.index');

