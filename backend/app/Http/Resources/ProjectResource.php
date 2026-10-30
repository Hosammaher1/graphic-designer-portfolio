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
            'created_at'         => $this->created_at?->toIso8601String(),
            'updated_at'         => $this->updated_at?->toIso8601String(),
            'deleted_at'         => $this->deleted_at?->toIso8601String(),
            'translations'       => ProjectTranslationResource::collection($this->whenLoaded('translations')),
            'categories'         => $this->whenLoaded('categories', fn() => $this->categories->map(fn($c) => [
                'id'   => $c->id,
                'slug' => $c->slug,
            ])),
            'tools'              => $this->whenLoaded('tools', fn() => $this->tools->map(fn($t) => [
                'id'   => $t->id,
                'slug' => $t->slug,
                'name' => $t->name,
            ])),
        ];
    }
}
