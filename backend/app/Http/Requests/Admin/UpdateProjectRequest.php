<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $projectId = $this->route('project');

        return [
            'slug'           => ['sometimes', 'string', 'max:150', 'regex:/^[a-z0-9-]+$/', Rule::unique('projects', 'slug')->ignore($projectId)],
            'status'         => ['sometimes', 'string', Rule::in(['draft', 'published', 'archived'])],
            'is_featured'    => ['sometimes', 'boolean'],
            'year'           => ['sometimes', 'nullable', 'integer', 'min:1900', 'max:2100'],
            'client'         => ['sometimes', 'nullable', 'string', 'max:255'],
            'cover_media_id' => ['sometimes', 'nullable', 'exists:media_assets,id'],
            'media_items'    => ['sometimes', 'nullable', 'array'],
            'media_items.*.media_asset_id' => ['required_with:media_items', 'integer', 'exists:media_assets,id'],
            'media_items.*.caption_en'     => ['sometimes', 'nullable', 'string', 'max:255'],
            'media_items.*.caption_ar'     => ['sometimes', 'nullable', 'string', 'max:255'],
            'media_items.*.is_cover'       => ['sometimes', 'boolean'],
            'media_items.*.sort_order'     => ['sometimes', 'integer', 'min:0'],
            'category_ids'   => ['sometimes', 'nullable', 'array'],
            'category_ids.*' => ['integer', 'exists:categories,id'],
            'tool_ids'       => ['sometimes', 'nullable', 'array'],
            'tool_ids.*'     => ['integer', 'exists:tools,id'],
            'translations'   => ['sometimes', 'array', 'min:1'],
            'translations.*.locale'      => ['required_with:translations', 'string', Rule::in(['ar', 'en'])],
            'translations.*.title'       => ['required_with:translations', 'string', 'max:255'],
            'translations.*.summary'     => ['sometimes', 'nullable', 'string'],
            'translations.*.description' => ['sometimes', 'nullable', 'string'],
            'translations.*.seo_title'   => ['sometimes', 'nullable', 'string', 'max:255'],
            'translations.*.seo_description' => ['sometimes', 'nullable', 'string'],
        ];
    }
}
