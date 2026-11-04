<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$p = App\Models\Project::with('coverMedia', 'media.mediaAsset')->find(9);
echo json_encode([
    'id' => $p->id,
    'slug' => $p->slug,
    'status' => $p->status,
    'cover_media_id' => $p->cover_media_id,
    'cover_url' => $p->cover_url,
    'cover_media_file' => $p->coverMedia?->file_name,
    'media_count' => $p->media->count(),
    'media_items' => $p->media->map(fn($m) => [
        'id' => $m->id,
        'asset_id' => $m->media_asset_id,
        'is_cover' => $m->is_cover,
        'file' => $m->mediaAsset?->file_name
    ]),
    'snapshot_cover_url' => $p->published_snapshot['cover_url'] ?? null,
    'snapshot_media' => $p->published_snapshot['media'] ?? []
], JSON_PRETTY_PRINT);
echo "\n";
