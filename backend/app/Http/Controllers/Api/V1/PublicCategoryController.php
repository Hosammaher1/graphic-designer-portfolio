<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicCategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $locale = $request->input('locale', 'ar');

        $categories = Category::query()
            ->where('is_active', true)
            ->with(['translations' => function ($q) use ($locale) {
                $q->where('locale', $locale);
            }])
            ->orderBy('sort_order')
            ->get()
            ->map(function ($category) use ($locale) {
                $translation = $category->translations->first();

                return [
                    'id'          => $category->id,
                    'slug'        => $category->slug,
                    'sort_order'  => $category->sort_order,
                    'name'        => $translation?->name ?? $category->slug,
                    'description' => $translation?->description ?? '',
                ];
            });

        return response()->json([
            'status' => 'success',
            'data'   => [
                'categories' => $categories,
            ],
        ]);
    }
}
