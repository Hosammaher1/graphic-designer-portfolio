<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCategoryRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'slug'           => ['required', 'string', 'max:100', 'regex:/^[a-z0-9-]+$/', 'unique:categories,slug'],
            'sort_order'     => ['sometimes', 'integer', 'min:0'],
            'is_active'      => ['sometimes', 'boolean'],
            'translations'   => ['required', 'array', 'min:1'],
            'translations.*.locale' => ['required', 'string', Rule::in(['ar', 'en'])],
            'translations.*.name'   => ['required', 'string', 'max:255'],
            'translations.*.description' => ['sometimes', 'nullable', 'string'],
        ];
    }
}
