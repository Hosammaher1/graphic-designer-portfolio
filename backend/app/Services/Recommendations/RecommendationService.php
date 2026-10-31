<?php

namespace App\Services\Recommendations;

use App\Models\ConsentRecord;
use App\Models\Project;
use App\Models\VisitorPreference;

class RecommendationService
{
    /**
     * Documented rule-based scoring weights:
     * - CATEGORY_WEIGHT: 40.0 points (40%) based on shared category overlap ratio
     * - TOOL_WEIGHT: 25.0 points (25%) based on shared tool overlap ratio
     * - RECENCY_MAX_WEIGHT: 20.0 points (20%) decaying linearly over 365 days
     * - POPULARITY_MAX_WEIGHT: 15.0 points (15%) normalized logarithmically based on view_count
     * - PERSONALIZATION_MAX_WEIGHT: 20.0 points applied ONLY when explicit consent is active
     *
     * Total maximum achievable score = 100.0 points (generic) / 120.0 points (with consented personalization boost).
     * Deterministic tiebreaker: published_at DESC, id DESC.
     */
    public const CATEGORY_WEIGHT = 40.0;
    public const TOOL_WEIGHT = 25.0;
    public const RECENCY_MAX_WEIGHT = 20.0;
    public const POPULARITY_MAX_WEIGHT = 15.0;
    public const PERSONALIZATION_MAX_WEIGHT = 20.0;

    /**
     * Return transparent documentation of the recommendation scoring model weights.
     *
     * @return array<string, mixed>
     */
    public function getWeightsDocumentation(): array
    {
        return [
            'category_overlap_weight' => self::CATEGORY_WEIGHT,
            'tool_overlap_weight' => self::TOOL_WEIGHT,
            'recency_weight' => self::RECENCY_MAX_WEIGHT,
            'popularity_weight' => self::POPULARITY_MAX_WEIGHT,
            'personalization_weight' => self::PERSONALIZATION_MAX_WEIGHT,
            'total_max_score' => 100.0,
            'tiebreaker' => 'published_at_desc_then_id_desc',
        ];
    }

    /**
     * Get recommendations and personalization context.
     *
     * @return array{personalized: bool, recommendations: array<int, array<string, mixed>>}
     */
    public function getRecommendationsWithContext(
        Project $target,
        int $limit = 4,
        string $locale = 'ar',
        ?string $consentToken = null
    ): array {
        $limit = max(1, min(20, $limit));

        $targetCategoryIds = $target->categories()->pluck('categories.id')->all();
        $targetToolIds = $target->tools()->pluck('tools.id')->all();

        // 1. Fetch strictly published candidate projects excluding the target project itself
        $candidates = Project::published()
            ->whereNotNull('published_snapshot')
            ->where('id', '!=', $target->id)
            ->with(['categories', 'tools'])
            ->get();

        if ($candidates->isEmpty()) {
            return [
                'personalized' => false,
                'recommendations' => [],
            ];
        }

        // 2. Evaluate consent & retrieve visitor preferences if explicitly permitted
        $isPersonalized = false;
        $visitorCategoryInteractions = [];

        if ($consentToken) {
            $consent = ConsentRecord::where('consent_token', $consentToken)->first();
            if ($consent
                && in_array($consent->status, ['accepted', 'customized'], true)
                && (bool) $consent->personalization_allowed
                && is_null($consent->withdrawn_at)
                && ($consent->expires_at === null || $consent->expires_at->isFuture())
            ) {
                $prefs = VisitorPreference::where('consent_token', $consentToken)
                    ->whereNotNull('category_id')
                    ->pluck('interactions_count', 'category_id')
                    ->all();

                if (!empty($prefs)) {
                    $isPersonalized = true;
                    $visitorCategoryInteractions = $prefs;
                }
            }
        }

        $now = now();
        $maxVisitorInteractions = !empty($visitorCategoryInteractions) ? max($visitorCategoryInteractions) : 1;

        // 3. Compute rule-based scores
        $scored = $candidates->map(function (Project $candidate) use (
            $targetCategoryIds,
            $targetToolIds,
            $locale,
            $now,
            $isPersonalized,
            $visitorCategoryInteractions,
            $maxVisitorInteractions
        ) {
            $candidateCategoryIds = $candidate->categories->pluck('id')->all();
            $candidateToolIds = $candidate->tools->pluck('id')->all();

            // Component 1: Shared Category Overlap (up to 40 pts)
            $sharedCats = count(array_intersect($targetCategoryIds, $candidateCategoryIds));
            $catRatio = count($targetCategoryIds) > 0 ? ($sharedCats / count($targetCategoryIds)) : 0.0;
            $catScore = $catRatio * self::CATEGORY_WEIGHT;

            // Component 2: Shared Tool Overlap (up to 25 pts)
            $sharedTools = count(array_intersect($targetToolIds, $candidateToolIds));
            $toolRatio = count($targetToolIds) > 0 ? ($sharedTools / count($targetToolIds)) : 0.0;
            $toolScore = $toolRatio * self::TOOL_WEIGHT;

            // Component 3: Recency Score (up to 20 pts, linear decay over 365 days)
            $daysSincePublished = $candidate->published_at
                ? max(0, $now->diffInDays($candidate->published_at))
                : 365;
            $recencyRatio = max(0.0, 1.0 - ($daysSincePublished / 365.0));
            $recencyScore = $recencyRatio * self::RECENCY_MAX_WEIGHT;

            // Component 4: Popularity Score (up to 15 pts, logarithmic scale up to 10k views)
            $viewCount = max(0, (int) $candidate->view_count);
            $popRatio = min(1.0, log10($viewCount + 1) / 4.0);
            $popularityScore = $popRatio * self::POPULARITY_MAX_WEIGHT;

            // Component 5: Personalization Boost (up to 20 pts based strictly on consented browsing interests)
            $personalScore = 0.0;
            if ($isPersonalized && !empty($visitorCategoryInteractions)) {
                $matchedInteractions = 0;
                foreach ($candidateCategoryIds as $catId) {
                    if (isset($visitorCategoryInteractions[$catId])) {
                        $matchedInteractions += $visitorCategoryInteractions[$catId];
                    }
                }
                $personalRatio = min(1.0, $matchedInteractions / max(1, $maxVisitorInteractions));
                $personalScore = round($personalRatio * self::PERSONALIZATION_MAX_WEIGHT, 2);
            }

            $totalScore = round($catScore + $toolScore + $recencyScore + $popularityScore + $personalScore, 4);

            $snapshot = $candidate->published_snapshot ?? [];
            $trans = $snapshot['translations'][$locale] ?? $snapshot['translations']['ar'] ?? [];

            $breakdown = [
                'category' => round($catScore, 2),
                'tool' => round($toolScore, 2),
                'recency' => round($recencyScore, 2),
                'popularity' => round($popularityScore, 2),
            ];

            if ($isPersonalized) {
                $breakdown['personalization'] = $personalScore;
            }

            return [
                'id' => $candidate->id,
                'slug' => $candidate->slug,
                'year' => $candidate->year,
                'client' => $candidate->client,
                'published_at' => $candidate->published_at?->toIso8601String(),
                'title' => $trans['title'] ?? '',
                'summary' => $trans['summary'] ?? '',
                'cover_url' => $snapshot['cover_url'] ?? null,
                'categories' => $snapshot['categories'] ?? [],
                'tools' => $snapshot['tools'] ?? [],
                'score' => $totalScore,
                'score_breakdown' => $breakdown,
                'raw_timestamp' => $candidate->published_at?->timestamp ?? 0,
            ];
        });

        // 4. Deterministic Sorting with Tiebreakers
        $sorted = $scored->sort(function ($a, $b) {
            // Primary: Score descending
            if ($b['score'] != $a['score']) {
                return $b['score'] <=> $a['score'];
            }
            // Tiebreaker 1: published_at descending
            if ($b['raw_timestamp'] != $a['raw_timestamp']) {
                return $b['raw_timestamp'] <=> $a['raw_timestamp'];
            }
            // Tiebreaker 2: id descending
            return $b['id'] <=> $a['id'];
        })->values();

        // 5. Return top N unique results with context
        return [
            'personalized' => $isPersonalized,
            'recommendations' => $sorted->take($limit)->all(),
        ];
    }

    /**
     * Score and rank published projects related to the target project.
     * Preserves exact signature for backwards compatibility.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getRecommendationsForProject(
        Project $target,
        int $limit = 4,
        string $locale = 'ar',
        ?string $consentToken = null
    ): array {
        $result = $this->getRecommendationsWithContext($target, $limit, $locale, $consentToken);
        return $result['recommendations'];
    }
}
