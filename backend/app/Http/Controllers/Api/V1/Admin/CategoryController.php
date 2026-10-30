<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCategoryRequest;
use App\Http\Requests\Admin\UpdateCategoryRequest;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::with('translations')
            ->orderBy('sort_order')
            ->get();

        return response()->json(['status' => 'success', 'data' => ['categories' => $categories]]);
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $category = Category::create([
            'slug'       => $request->slug,
            'sort_order' => $request->input('sort_order', 0),
            'is_active'  => $request->boolean('is_active', true),
        ]);

        foreach ($request->translations as $trans) {
            $category->translations()->create($trans);
        }

        $category->load('translations');

        return response()->json(['status' => 'success', 'data' => ['category' => $category]], 201);
    }

    public function show(int $id): JsonResponse
    {
        $category = Category::with(['translations', 'projects'])->find($id);

        if (! $category) {
            return response()->json(['status' => 'error', 'message' => 'Category not found.'], 404);
        }

        return response()->json(['status' => 'success', 'data' => ['category' => $category]]);
    }

    public function update(UpdateCategoryRequest $request, int $id): JsonResponse
    {
        $category = Category::find($id);

        if (! $category) {
            return response()->json(['status' => 'error', 'message' => 'Category not found.'], 404);
        }

        $category->update($request->only(['slug', 'sort_order', 'is_active']));

        if ($request->has('translations')) {
            foreach ($request->translations as $trans) {
                $category->translations()->updateOrCreate(['locale' => $trans['locale']], $trans);
            }
        }

        $category->load('translations');

        return response()->json(['status' => 'success', 'data' => ['category' => $category]]);
    }

    public function destroy(int $id): JsonResponse
    {
        $category = Category::find($id);

        if (! $category) {
            return response()->json(['status' => 'error', 'message' => 'Category not found.'], 404);
        }

        $category->delete();

        return response()->json(['status' => 'success', 'message' => 'Category deleted.']);
    }

    /**
     * Bulk-reorder: accepts [{id, sort_order}, ...] and updates atomically.
     */
    public function reorder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order'          => ['required', 'array', 'min:1'],
            'order.*.id'     => ['required', 'integer', 'exists:categories,id'],
            'order.*.sort_order' => ['required', 'integer', 'min:0'],
        ]);

        foreach ($validated['order'] as $item) {
            Category::where('id', $item['id'])->update(['sort_order' => $item['sort_order']]);
        }

        return response()->json(['status' => 'success', 'message' => 'Categories reordered.']);
    }
}
