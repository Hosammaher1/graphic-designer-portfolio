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

// Public Local Storage File Serving Fallback (Windows / No-Symlink Environments)
Route::get('/storage/{path}', function (string $path) {
    $fullPath = storage_path('app/public/' . $path);
    if (! file_exists($fullPath) || is_dir($fullPath)) {
        abort(404, 'File not found');
    }
    return response()->file($fullPath, [
        'Cache-Control' => 'public, max-age=86400',
        'Access-Control-Allow-Origin' => '*',
    ]);
})->where('path', '.*')->name('storage.local');


