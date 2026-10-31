<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Services\Recommendations\RecommendationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecommendationController extends Controller
{
    protected RecommendationService $recommendationService;

    public function __construct(RecommendationService $recommendationService)
    {
        $this->recommendationService = $recommendationService;
    }

    /**
     * Get rule-based project recommendations based on documented weighted scoring.
     */
    public function getRelated(Request $request, string $slug): JsonResponse
    {
        $project = Project::published()
            ->whereNotNull('published_snapshot')
            ->where('slug', $slug)
            ->firstOrFail();

        $locale = $request->input('locale', 'ar');
        if (!in_array($locale, ['ar', 'en'], true)) {
            $locale = 'ar';
        }

        $limit = max(1, min(20, (int) $request->input('limit', 4)));

        $recommendations = $this->recommendationService->getRecommendationsForProject($project, $limit, $locale);

        return response()->json([
            'status' => 'success',
            'data' => [
                'target_slug' => $project->slug,
                'count' => count($recommendations),
                'weights' => $this->recommendationService->getWeightsDocumentation(),
                'recommendations' => $recommendations,
            ],
        ], 200);
    }
}
