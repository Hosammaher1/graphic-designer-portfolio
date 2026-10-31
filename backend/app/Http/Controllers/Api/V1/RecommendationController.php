<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\ConsentRecord;
use App\Models\Project;
use App\Models\VisitorPreference;
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
     * Incorporates consented personalized browsing interests if consent token is valid.
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
        $consentToken = $request->input('consent_token') ?: $request->header('X-Consent-Token');

        $result = $this->recommendationService->getRecommendationsWithContext(
            $project,
            $limit,
            $locale,
            $consentToken
        );

        return response()->json([
            'status' => 'success',
            'data' => [
                'target_slug' => $project->slug,
                'count' => count($result['recommendations']),
                'personalized' => $result['personalized'],
                'weights' => $this->recommendationService->getWeightsDocumentation(),
                'recommendations' => $result['recommendations'],
            ],
        ], 200);
    }

    /**
     * Track consented browsing interest for personalized recommendations.
     * Strictly verifies that consent is active and personalization is granted.
     */
    public function trackInterest(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'consent_token' => ['required', 'string', 'min:8', 'max:64'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'project_id' => ['nullable', 'exists:projects,id'],
        ]);

        $token = $validated['consent_token'];

        // Strict consent verification: only consented sessions are allowed
        $consent = ConsentRecord::where('consent_token', $token)->first();

        if (!$consent
            || !in_array($consent->status, ['accepted', 'customized'], true)
            || !(bool) $consent->personalization_allowed
            || $consent->withdrawn_at !== null
            || ($consent->expires_at && $consent->expires_at->isPast())
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Personalization consent has not been granted.',
            ], 403);
        }

        $categoryId = $validated['category_id'] ?? null;

        if (!$categoryId && !empty($validated['project_id'])) {
            $project = Project::find($validated['project_id']);
            $categoryId = $project?->categories()->value('categories.id');
        }

        if (!$categoryId) {
            return response()->json([
                'success' => false,
                'message' => 'No valid category identified to record interest.',
            ], 422);
        }

        $preference = VisitorPreference::firstOrNew([
            'consent_token' => $token,
            'category_id' => $categoryId,
        ]);

        $preference->interactions_count = ($preference->interactions_count ?? 0) + 1;
        $preference->last_interacted_at = now();
        $preference->save();

        return response()->json([
            'success' => true,
            'message' => 'Browsing interest recorded successfully.',
            'data' => [
                'consent_token' => $token,
                'category_id' => $categoryId,
                'interactions_count' => $preference->interactions_count,
            ],
        ], 200);
    }
}
