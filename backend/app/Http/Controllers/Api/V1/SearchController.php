<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Search\SearchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    protected SearchService $searchService;

    public function __construct(SearchService $searchService)
    {
        $this->searchService = $searchService;
    }

    /**
     * Search published projects with bilingual query support and strict snapshot isolation.
     */
    public function search(Request $request): JsonResponse
    {
        $queryStr = (string) $request->input('q', $request->input('query', ''));
        $locale = $request->input('locale', 'ar');
        if (!in_array($locale, ['ar', 'en'], true)) {
            $locale = 'ar';
        }

        $filters = [
            'locale' => $locale,
            'category' => $request->input('category'),
            'tool' => $request->input('tool'),
            'year' => $request->input('year'),
            'per_page' => $request->input('per_page', 12),
            'page' => $request->input('page', 1),
        ];

        $paginated = $this->searchService->searchProjects($queryStr, $filters);

        $transformed = $paginated->getCollection()->map(function ($project) use ($locale) {
            $snapshot = $project->published_snapshot ?? [];
            $trans = $snapshot['translations'][$locale] ?? $snapshot['translations']['ar'] ?? [];

            return [
                'id' => $project->id,
                'slug' => $project->slug,
                'year' => $project->year,
                'client' => $project->client,
                'is_featured' => (bool) $project->is_featured,
                'published_at' => $project->published_at?->toIso8601String(),
                'title' => $trans['title'] ?? '',
                'summary' => $trans['summary'] ?? '',
                'cover_url' => $snapshot['cover_url'] ?? null,
                'categories' => $snapshot['categories'] ?? [],
                'tools' => $snapshot['tools'] ?? [],
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => [
                'query' => trim($queryStr),
                'locale' => $locale,
                'projects' => $transformed,
                'meta' => [
                    'current_page' => $paginated->currentPage(),
                    'per_page' => $paginated->perPage(),
                    'total' => $paginated->total(),
                    'last_page' => $paginated->lastPage(),
                ],
            ],
        ], 200);
    }
}
