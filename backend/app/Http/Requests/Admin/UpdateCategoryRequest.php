<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCategoryRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $id = $this->route('category');
        return [
            'slug'       => ['sometimes', 'string', 'max:100', 'regex:/^[a-z0-9-]+$/', Rule::unique('categories', 'slug')->ignore($id)],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active'  => ['sometimes', 'boolean'],
            'translations'   => ['sometimes', 'array', 'min:1'],
            'translations.*.locale' => ['required_with:translations', 'string', Rule::in(['ar', 'en'])],
            'translations.*.name'   => ['required_with:translations', 'string', 'max:255'],
            'translations.*.description' => ['sometimes', 'nullable', 'string'],
        ];
    }
}
