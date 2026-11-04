<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// 1. Delete test projects with test slugs
$testProjects = \App\Models\Project::whereIn('slug', ['e2e-luxury-atelier', 'luxury-branding-test'])->get();
foreach ($testProjects as $project) {
    echo "Deleting project: {$project->id} ({$project->slug})\n";
    // Get media
    $mediaIds = $project->media()->pluck('media_asset_id')->filter()->all();
    if ($project->cover_media_id) {
        $mediaIds[] = $project->cover_media_id;
    }
    $project->forceDelete();

    foreach (array_unique($mediaIds) as $mid) {
        $asset = \App\Models\MediaAsset::find($mid);
        if ($asset) {
            if ($asset->file_path && \Illuminate\Support\Facades\Storage::disk('public')->exists($asset->file_path)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($asset->file_path);
            }
            $asset->delete();
            echo "Deleted asset {$mid}\n";
        }
    }
}

// 2. Delete test user
$user = \App\Models\User::where('email', 'e2e-runner@portfolio.test')->first();
if ($user) {
    $user->delete();
    echo "Deleted user e2e-runner@portfolio.test\n";
}

echo "CLEANUP_COMPLETE\n";
