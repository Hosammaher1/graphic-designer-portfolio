<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class SyncProjectRelationshipsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_ids'   => ['sometimes', 'array'],
            'category_ids.*' => ['integer', 'exists:categories,id'],
            'tool_ids'       => ['sometimes', 'array'],
            'tool_ids.*'     => ['integer', 'exists:tools,id'],
        ];
    }
}
