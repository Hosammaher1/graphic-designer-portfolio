<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectTranslationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'locale'          => $this->locale,
            'title'           => $this->title,
            'summary'         => $this->summary,
            'description'     => $this->description,
            'seo_title'       => $this->seo_title,
            'seo_description' => $this->seo_description,
        ];
    }
}
