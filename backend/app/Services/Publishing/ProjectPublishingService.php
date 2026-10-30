<?php

namespace App\Services\Publishing;

use App\Models\Project;
use App\Services\Media\WatermarkService;
use Illuminate\Support\Facades\DB;

class ProjectPublishingService
{
    public function __construct(
        private readonly WatermarkService $watermarkService
    ) {
    }

    /**
     * Atomically publishes the project, creating an immutable published_snapshot
     * capturing all localized translations, ordered media, categories, and tools.
     */
    public function publish(Project $project): Project
    {
        return DB::transaction(function () use ($project) {
            $project->load(['translations', 'categories.translations', 'tools', 'media.mediaAsset', 'coverMedia']);

            $currentVersion = $project->published_snapshot['version'] ?? 0;
            $now = now();

            $mediaList = $project->media->map(function ($pm) use ($project) {
                return [
                    'id'          => $pm->id,
                    'is_cover'    => (bool) $pm->is_cover,
                    'sort_order'  => (int) $pm->sort_order,
                    'caption_ar'  => $pm->caption_ar,
                    'caption_en'  => $pm->caption_en,
                    'display_url' => $this->watermarkService->resolveDisplayUrl($pm->mediaAsset, $project),
                    'variants'    => $pm->mediaAsset?->variants,
                    'width'       => $pm->mediaAsset?->width,
                    'height'      => $pm->mediaAsset?->height,
                ];
            })->all();

            $coverMedia = $project->coverMedia;
            $coverUrl = $coverMedia
                ? $this->watermarkService->resolveDisplayUrl($coverMedia, $project)
                : null;

            $snapshot = [
                'version'          => $currentVersion + 1,
                'published_at'     => $now->toIso8601String(),
                'id'               => $project->id,
                'slug'             => $project->slug,
                'year'             => $project->year,
                'client'           => $project->client,
                'is_featured'      => (bool) $project->is_featured,
                'enable_watermark' => (bool) $project->enable_watermark,
                'cover_url'        => $coverUrl,
                'translations'     => [
                    'ar' => [
                        'title'           => $project->translations->firstWhere('locale', 'ar')?->title,
                        'summary'         => $project->translations->firstWhere('locale', 'ar')?->summary,
                        'description'     => $project->translations->firstWhere('locale', 'ar')?->description,
                        'seo_title'       => $project->translations->firstWhere('locale', 'ar')?->seo_title,
                        'seo_description' => $project->translations->firstWhere('locale', 'ar')?->seo_description,
                    ],
                    'en' => [
                        'title'           => $project->translations->firstWhere('locale', 'en')?->title,
                        'summary'         => $project->translations->firstWhere('locale', 'en')?->summary,
                        'description'     => $project->translations->firstWhere('locale', 'en')?->description,
                        'seo_title'       => $project->translations->firstWhere('locale', 'en')?->seo_title,
                        'seo_description' => $project->translations->firstWhere('locale', 'en')?->seo_description,
                    ],
                ],
                'categories'       => $project->categories->map(fn($c) => [
                    'id'   => $c->id,
                    'slug' => $c->slug,
                    'name' => [
                        'ar' => $c->translation('ar')?->name,
                        'en' => $c->translation('en')?->name,
                    ],
                ])->all(),
                'tools'            => $project->tools->map(fn($t) => [
                    'id'       => $t->id,
                    'slug'     => $t->slug,
                    'name'     => $t->name,
                    'icon_url' => $t->icon_url,
                ])->all(),
                'media'            => $mediaList,
                'layout_blocks'    => $project->layout_blocks ?? [],
            ];

            $project->update([
                'status'             => 'published',
                'published_at'       => $now,
                'published_snapshot' => $snapshot,
            ]);

            return $project->fresh();
        });
    }

    /**
     * Unpublishes the project back to draft status without destroying historical snapshots.
     */
    public function unpublish(Project $project): Project
    {
        $project->update(['status' => 'draft']);

        return $project->fresh();
    }
}
