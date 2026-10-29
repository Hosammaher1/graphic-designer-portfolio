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
});
