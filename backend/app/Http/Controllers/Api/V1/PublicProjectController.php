<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicProjectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'sort' => 'nullable|string|in:newest,oldest,most_viewed,year_desc,year_asc,title_asc,title_desc',
        ]);

        $locale = $request->input('locale', 'ar');

        $query = Project::published()
            ->whereNotNull('published_snapshot');

        if ($request->filled('year')) {
            $query->where('year', (int) $request->year);
        }

        if ($request->has('is_featured')) {
            $query->where('is_featured', $request->boolean('is_featured'));
        }

        if ($request->filled('category')) {
            $catSlug = $request->input('category');
            $query->whereHas('categories', fn($q) => $q->where('slug', $catSlug));
        }

        if ($request->filled('tool')) {
            $toolSlug = $request->input('tool');
            $query->whereHas('tools', fn($q) => $q->where('slug', $toolSlug));
        }

        $sort = $request->input('sort', 'newest');
        switch ($sort) {
            case 'oldest':
                $query->orderBy('published_at', 'asc')->orderBy('id', 'asc');
                break;
            case 'most_viewed':
                $query->orderByDesc('view_count')->orderByDesc('id');
                break;
            case 'year_desc':
                $query->orderByDesc('year')->orderByDesc('published_at')->orderByDesc('id');
                break;
            case 'year_asc':
                $query->orderBy('year', 'asc')->orderBy('published_at', 'asc')->orderBy('id', 'asc');
                break;
            case 'newest':
            default:
                $query->orderByDesc('published_at')->orderByDesc('id');
                break;
        }

        $paginated = $query->paginate(15);

        $transformed = $paginated->getCollection()->map(function ($project) use ($locale) {
            $snapshot = $project->published_snapshot ?? [];
            $trans = $snapshot['translations'][$locale] ?? $snapshot['translations']['ar'] ?? [];

            return [
                'id'           => $project->id,
                'slug'         => $project->slug,
                'year'         => $project->year,
                'client'       => $project->client,
                'is_featured'  => (bool) $project->is_featured,
                'published_at' => $project->published_at?->toIso8601String(),
                'title'        => $trans['title'] ?? '',
                'summary'      => $trans['summary'] ?? '',
                'cover_url'    => $snapshot['cover_url'] ?? null,
                'categories'   => $snapshot['categories'] ?? [],
                'tools'        => $snapshot['tools'] ?? [],
            ];
        });

        return response()->json([
            'status' => 'success',
            'data'   => [
                'projects' => [
                    'data'         => $transformed,
                    'current_page' => $paginated->currentPage(),
                    'per_page'     => $paginated->perPage(),
                    'total'        => $paginated->total(),
                    'last_page'    => $paginated->lastPage(),
                ],
            ],
        ]);
    }

    public function show(Request $request, string $slug): JsonResponse
    {
        $project = Project::published()
            ->whereNotNull('published_snapshot')
            ->where('slug', $slug)
            ->first();

        if (! $project) {
            return response()->json(['status' => 'error', 'message' => 'Project not found.'], 404);
        }

        $project->increment('view_count');

        $locale = $request->input('locale', 'ar');
        $snapshot = $project->published_snapshot ?? [];
        $trans = $snapshot['translations'][$locale] ?? $snapshot['translations']['ar'] ?? [];

        // Adjacent published projects for deterministic next/previous navigation
        $prevProject = Project::published()
            ->whereNotNull('published_snapshot')
            ->where('id', '!=', $project->id)
            ->where(function ($q) use ($project) {
                $q->where('published_at', '<', $project->published_at)
                    ->orWhere(function ($sub) use ($project) {
                        $sub->where('published_at', '=', $project->published_at)
                            ->where('id', '<', $project->id);
                    });
            })
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->first();

        $nextProject = Project::published()
            ->whereNotNull('published_snapshot')
            ->where('id', '!=', $project->id)
            ->where(function ($q) use ($project) {
                $q->where('published_at', '>', $project->published_at)
                    ->orWhere(function ($sub) use ($project) {
                        $sub->where('published_at', '=', $project->published_at)
                            ->where('id', '>', $project->id);
                    });
            })
            ->orderBy('published_at')
            ->orderBy('id')
            ->first();

        $prevTrans = $prevProject ? ($prevProject->published_snapshot['translations'][$locale] ?? $prevProject->published_snapshot['translations']['ar'] ?? []) : [];
        $nextTrans = $nextProject ? ($nextProject->published_snapshot['translations'][$locale] ?? $nextProject->published_snapshot['translations']['ar'] ?? []) : [];

        return response()->json([
            'status' => 'success',
            'data'   => [
                'project' => [
                    'id'              => $project->id,
                    'slug'            => $project->slug,
                    'year'            => $project->year,
                    'client'          => $project->client,
                    'view_count'      => $project->view_count,
                    'published_at'    => $project->published_at?->toIso8601String(),
                    'title'           => $trans['title'] ?? '',
                    'summary'         => $trans['summary'] ?? '',
                    'description'     => $trans['description'] ?? '',
                    'seo_title'       => $trans['seo_title'] ?? '',
                    'seo_description' => $trans['seo_description'] ?? '',
                    'cover_url'       => $snapshot['cover_url'] ?? null,
                    'categories'      => $snapshot['categories'] ?? [],
                    'tools'           => $snapshot['tools'] ?? [],
                    'media'           => $snapshot['media'] ?? [],
                    'layout_blocks'   => $snapshot['layout_blocks'] ?? [],
                    'prev_project'    => $prevProject ? [
                        'slug'  => $prevProject->slug,
                        'title' => $prevTrans['title'] ?? $prevProject->slug,
                    ] : null,
                    'next_project'    => $nextProject ? [
                        'slug'  => $nextProject->slug,
                        'title' => $nextTrans['title'] ?? $nextProject->slug,
                    ] : null,
                ],
            ],
        ]);
    }
}
