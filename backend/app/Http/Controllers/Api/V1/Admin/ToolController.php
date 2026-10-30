<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tool;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ToolController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data'   => ['tools' => Tool::orderBy('name')->get()],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:100'],
            'slug'     => ['required', 'string', 'max:100', 'regex:/^[a-z0-9-]+$/', 'unique:tools,slug'],
            'icon_url' => ['sometimes', 'nullable', 'url', 'max:255'],
        ]);

        $tool = Tool::create($validated);

        return response()->json(['status' => 'success', 'data' => ['tool' => $tool]], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $tool = Tool::find($id);
        if (! $tool) {
            return response()->json(['status' => 'error', 'message' => 'Tool not found.'], 404);
        }

        $validated = $request->validate([
            'name'     => ['sometimes', 'string', 'max:100'],
            'slug'     => ['sometimes', 'string', 'max:100', 'regex:/^[a-z0-9-]+$/', Rule::unique('tools', 'slug')->ignore($id)],
            'icon_url' => ['sometimes', 'nullable', 'url', 'max:255'],
        ]);

        $tool->update($validated);

        return response()->json(['status' => 'success', 'data' => ['tool' => $tool]]);
    }

    public function destroy(int $id): JsonResponse
    {
        $tool = Tool::find($id);
        if (! $tool) {
            return response()->json(['status' => 'error', 'message' => 'Tool not found.'], 404);
        }

        $tool->delete();

        return response()->json(['status' => 'success', 'message' => 'Tool deleted.']);
    }
}
