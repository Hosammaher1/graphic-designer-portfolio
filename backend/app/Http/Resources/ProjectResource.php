<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                 => $this->id,
            'slug'               => $this->slug,
            'status'             => $this->status,
            'is_featured'        => $this->is_featured,
            'published_at'       => $this->published_at?->toIso8601String(),
            'year'               => $this->year,
            'client'             => $this->client,
            'view_count'         => $this->view_count,
            'cover_media_id'     => $this->cover_media_id,
            'cover_url'          => $this->cover_url,
            'cover_media'        => $this->whenLoaded('coverMedia', fn() => [
                'id'        => $this->coverMedia->id,
                'url'       => $this->cover_url,
                'file_name' => $this->coverMedia->file_name,
            ]),
            'media'              => $this->whenLoaded('media', fn() => $this->media->map(fn($pm) => [
                'id'             => $pm->id,
                'media_asset_id' => $pm->media_asset_id,
                'is_cover'       => (bool) $pm->is_cover,
                'sort_order'     => (int) $pm->sort_order,
                'caption_ar'     => $pm->caption_ar,
                'caption_en'     => $pm->caption_en,
                'url'            => $pm->mediaAsset ? app(\App\Services\Media\WatermarkService::class)->resolveDisplayUrl($pm->mediaAsset, $this->resource) : null,
                'display_url'    => $pm->mediaAsset ? app(\App\Services\Media\WatermarkService::class)->resolveDisplayUrl($pm->mediaAsset, $this->resource) : null,
            ])),
            'created_at'         => $this->created_at?->toIso8601String(),
            'updated_at'         => $this->updated_at?->toIso8601String(),
            'deleted_at'         => $this->deleted_at?->toIso8601String(),
            'translations'       => ProjectTranslationResource::collection($this->whenLoaded('translations')),
            'categories'         => $this->whenLoaded('categories', fn() => $this->categories->map(fn($c) => [
                'id'      => $c->id,
                'slug'    => $c->slug,
                'name_en' => $c->translations?->firstWhere('locale', 'en')?->name ?? $c->translation('en')?->name ?? $c->slug,
                'name_ar' => $c->translations?->firstWhere('locale', 'ar')?->name ?? $c->translation('ar')?->name ?? $c->slug,
                'name'    => [
                    'en' => $c->translations?->firstWhere('locale', 'en')?->name ?? $c->translation('en')?->name ?? $c->slug,
                    'ar' => $c->translations?->firstWhere('locale', 'ar')?->name ?? $c->translation('ar')?->name ?? $c->slug,
                ],
            ])),
            'tools'              => $this->whenLoaded('tools', fn() => $this->tools->map(fn($t) => [
                'id'   => $t->id,
                'slug' => $t->slug,
                'name' => $t->name,
            ])),
        ];
    }
}
