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

        // Project CRUD
        Route::apiResource('projects', \App\Http\Controllers\Api\V1\Admin\ProjectController::class);
        Route::patch('projects/{project}/relationships', [\App\Http\Controllers\Api\V1\Admin\ProjectController::class, 'syncRelationships'])
            ->name('api.v1.admin.projects.relationships');

        // Project Media Management (Attach, Reorder, Cover, Detach)
        Route::post('projects/{project}/media', [\App\Http\Controllers\Api\V1\Admin\ProjectMediaController::class, 'attach'])
            ->name('api.v1.admin.projects.media.attach');
        Route::patch('projects/{project}/media/reorder', [\App\Http\Controllers\Api\V1\Admin\ProjectMediaController::class, 'reorder'])
            ->name('api.v1.admin.projects.media.reorder');
        Route::put('projects/{project}/media/{media}/cover', [\App\Http\Controllers\Api\V1\Admin\ProjectMediaController::class, 'setCover'])
            ->name('api.v1.admin.projects.media.setCover');
        Route::delete('projects/{project}/media/{media}', [\App\Http\Controllers\Api\V1\Admin\ProjectMediaController::class, 'detach'])
            ->name('api.v1.admin.projects.media.detach');
        Route::patch('projects/{project}/watermark', [\App\Http\Controllers\Api\V1\Admin\ProjectController::class, 'toggleWatermark'])
            ->name('api.v1.admin.projects.watermark');

        // Category CRUD + reorder (reorder must precede apiResource to avoid {category}='reorder' collision)
        Route::patch('categories/reorder', [\App\Http\Controllers\Api\V1\Admin\CategoryController::class, 'reorder'])
            ->name('api.v1.admin.categories.reorder');
        Route::apiResource('categories', \App\Http\Controllers\Api\V1\Admin\CategoryController::class);

        // Tool CRUD
        Route::apiResource('tools', \App\Http\Controllers\Api\V1\Admin\ToolController::class);

        // Media Upload & Management
        Route::get('media', [\App\Http\Controllers\Api\V1\Admin\MediaController::class, 'index'])->name('api.v1.admin.media.index');
        Route::post('media/upload', [\App\Http\Controllers\Api\V1\Admin\MediaController::class, 'upload'])->name('api.v1.admin.media.upload');
        Route::post('media/upload-batch', [\App\Http\Controllers\Api\V1\Admin\MediaController::class, 'uploadBatch'])->name('api.v1.admin.media.uploadBatch');
        Route::patch('media/{media}/watermark', [\App\Http\Controllers\Api\V1\Admin\MediaController::class, 'toggleWatermark'])->name('api.v1.admin.media.watermark');
        Route::delete('media/{id}', [\App\Http\Controllers\Api\V1\Admin\MediaController::class, 'destroy'])->name('api.v1.admin.media.destroy');
    });
});
