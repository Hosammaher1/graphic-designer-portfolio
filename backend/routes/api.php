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

    // Public Projects & Categories API
    Route::get('/projects', [\App\Http\Controllers\Api\V1\PublicProjectController::class, 'index'])->name('api.v1.projects.index');
    Route::get('/projects/{slug}/recommendations', [\App\Http\Controllers\Api\V1\RecommendationController::class, 'getRelated'])->name('api.v1.projects.recommendations');
    Route::get('/projects/{slug}/related', [\App\Http\Controllers\Api\V1\RecommendationController::class, 'getRelated'])->name('api.v1.projects.related');
    Route::post('/recommendations/interest', [\App\Http\Controllers\Api\V1\RecommendationController::class, 'trackInterest'])->name('api.v1.recommendations.interest');
    Route::get('/projects/{slug}', [\App\Http\Controllers\Api\V1\PublicProjectController::class, 'show'])->name('api.v1.projects.show');
    Route::get('/categories', [\App\Http\Controllers\Api\V1\PublicCategoryController::class, 'index'])->name('api.v1.categories.index');
    Route::get('/search', [\App\Http\Controllers\Api\V1\SearchController::class, 'search'])->name('api.v1.search');

    // Consent & Privacy API (Task 06.06)
    Route::post('/consent', [\App\Http\Controllers\Api\V1\ConsentController::class, 'store'])->name('api.v1.consent.store');
    Route::post('/consent/withdraw', [\App\Http\Controllers\Api\V1\ConsentController::class, 'withdraw'])->name('api.v1.consent.withdraw');
    Route::get('/consent/{token}', [\App\Http\Controllers\Api\V1\ConsentController::class, 'show'])->name('api.v1.consent.show');

    // Analytics Events API (Task 06.08)
    Route::post('/analytics/events', [\App\Http\Controllers\Api\V1\AnalyticsController::class, 'recordEvent'])->name('api.v1.analytics.events');

    // Secure Preview Route (Authorized via Cryptographic Signature or Admin Session)
    Route::get('/pages/{slug}/preview', [\App\Http\Controllers\Api\V1\Admin\PageBuilderController::class, 'preview'])->name('api.v1.pages.preview.signed');
    // Public Published Page Route
    Route::get('/pages/{slug}', [\App\Http\Controllers\Api\V1\Admin\PageBuilderController::class, 'showPublic'])->name('api.v1.pages.show');

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

        // Project CRUD & Trash (trash list must precede apiResource to avoid {project}='trash' collision)
        Route::get('projects/trash', [\App\Http\Controllers\Api\V1\Admin\ProjectController::class, 'trash'])
            ->name('api.v1.admin.projects.trash');
        Route::apiResource('projects', \App\Http\Controllers\Api\V1\Admin\ProjectController::class);
        Route::post('projects/{project}/restore', [\App\Http\Controllers\Api\V1\Admin\ProjectController::class, 'restore'])
            ->name('api.v1.admin.projects.restore');
        Route::delete('projects/{project}/force', [\App\Http\Controllers\Api\V1\Admin\ProjectController::class, 'forceDelete'])
            ->name('api.v1.admin.projects.forceDelete');
        Route::patch('projects/{project}/relationships', [\App\Http\Controllers\Api\V1\Admin\ProjectController::class, 'syncRelationships'])
            ->name('api.v1.admin.projects.relationships');
        Route::put('projects/{project}/layout', [\App\Http\Controllers\Api\V1\Admin\ProjectController::class, 'updateLayout'])
            ->name('api.v1.admin.projects.layout');
        Route::post('projects/{project}/publish', [\App\Http\Controllers\Api\V1\Admin\ProjectController::class, 'publish'])
            ->name('api.v1.admin.projects.publish');
        Route::post('projects/{project}/unpublish', [\App\Http\Controllers\Api\V1\Admin\ProjectController::class, 'unpublish'])
            ->name('api.v1.admin.projects.unpublish');
        Route::get('projects/{project}/preview', [\App\Http\Controllers\Api\V1\Admin\ProjectController::class, 'preview'])
            ->name('api.v1.admin.projects.preview');

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

        // Page Builder Draft, Preview & Publishing
        Route::get('pages/{slug}/draft', [\App\Http\Controllers\Api\V1\Admin\PageBuilderController::class, 'getDraft'])->name('api.v1.admin.pages.draft.get');
        Route::post('pages/{slug}/draft', [\App\Http\Controllers\Api\V1\Admin\PageBuilderController::class, 'saveDraft'])->name('api.v1.admin.pages.draft.save');
        Route::get('pages/{slug}/preview', [\App\Http\Controllers\Api\V1\Admin\PageBuilderController::class, 'preview'])->name('api.v1.admin.pages.preview');
        Route::post('pages/{slug}/preview-url', [\App\Http\Controllers\Api\V1\Admin\PageBuilderController::class, 'createPreviewUrl'])->name('api.v1.admin.pages.preview.url');
        Route::post('pages/{slug}/publish', [\App\Http\Controllers\Api\V1\Admin\PageBuilderController::class, 'publish'])->name('api.v1.admin.pages.publish');
    });
});
