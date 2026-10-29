<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\HealthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Versioned REST API endpoints for Graphic Designer Portfolio.
| Stateful Sanctum session authentication is used for admin requests.
|
*/

Route::prefix('v1')->group(function () {
    Route::get('/health', [HealthController::class, 'health'])->name('api.v1.health');

    // Authentication routes
    Route::prefix('auth')->group(function () {
        Route::post('/login', [AuthController::class, 'login'])->name('api.v1.auth.login');
        Route::post('/logout', [AuthController::class, 'logout'])->name('api.v1.auth.logout');
        Route::middleware('auth:sanctum')->get('/me', [AuthController::class, 'me'])->name('api.v1.auth.me');
    });

    // Protected Admin routes
    Route::prefix('admin')->middleware(['auth:sanctum', 'admin'])->group(function () {
        Route::get('/profile', [\App\Http\Controllers\Api\V1\Admin\ProfileController::class, 'show'])->name('api.v1.admin.profile.show');
        Route::put('/profile', [\App\Http\Controllers\Api\V1\Admin\ProfileController::class, 'update'])->name('api.v1.admin.profile.update');
        Route::put('/profile/password', [\App\Http\Controllers\Api\V1\Admin\ProfileController::class, 'updatePassword'])->name('api.v1.admin.profile.password');

        Route::get('/audit-logs', [\App\Http\Controllers\Api\V1\Admin\AuditLogController::class, 'index'])->name('api.v1.admin.audit.index');

        Route::apiResource('users', \App\Http\Controllers\Api\V1\Admin\UserController::class);
    });
});
