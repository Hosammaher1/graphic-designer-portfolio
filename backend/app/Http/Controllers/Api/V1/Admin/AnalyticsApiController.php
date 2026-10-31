<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AnalyticsDailyAggregate;
use App\Models\AnalyticsEvent;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

class AnalyticsApiController extends Controller
{
    /**
     * Resolve date range window and compute non-overlapping prior comparison window.
     *
     * @return array{0: string, 1: string, 2: string, 3: int, 4: string, 5: string}
     */
    protected function resolveDateRange(Request $request): array
    {
        $request->validate([
            'range' => ['nullable', 'string', 'in:7d,30d,90d,custom'],
            'start_date' => ['nullable', 'date_format:Y-m-d'],
            'end_date' => ['nullable', 'date_format:Y-m-d'],
        ]);

        $range = $request->input('range', '30d');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        if ($range === 'custom' || ($startDate && $endDate)) {
            if (!$startDate || !$endDate) {
                throw ValidationException::withMessages([
                    'start_date' => 'Both start_date and end_date are required for custom range.',
                ]);
            }

            if ($startDate > $endDate) {
                throw ValidationException::withMessages([
                    'start_date' => 'The start date must be before or equal to the end date.',
                ]);
            }

            $start = $startDate;
            $end = $endDate;
            $rangeKey = 'custom';
        } elseif ($range === '7d') {
            $end = Carbon::today()->toDateString();
            $start = Carbon::today()->subDays(6)->toDateString();
            $rangeKey = '7d';
        } elseif ($range === '90d') {
            $end = Carbon::today()->toDateString();
            $start = Carbon::today()->subDays(89)->toDateString();
            $rangeKey = '90d';
        } else {
            // Default 30d
            $end = Carbon::today()->toDateString();
            $start = Carbon::today()->subDays(29)->toDateString();
            $rangeKey = '30d';
        }

        $daysCount = Carbon::parse($start)->diffInDays(Carbon::parse($end)) + 1;
        $prevEnd = Carbon::parse($start)->subDay()->toDateString();
        $prevStart = Carbon::parse($prevEnd)->subDays($daysCount - 1)->toDateString();

        return [$start, $end, $rangeKey, (int) $daysCount, $prevStart, $prevEnd];
    }

    /**
     * Get aggregate overview, daily trend, and prior window comparison.
     */
    public function overview(Request $request): JsonResponse
    {
        [$start, $end, $rangeKey, $daysCount, $prevStart, $prevEnd] = $this->resolveDateRange($request);

        // Fetch current period overview rollups
        $records = AnalyticsDailyAggregate::where('dimension_type', 'overview')
            ->where('dimension_value', 'total')
            ->whereBetween('date', [$start, $end])
            ->get()
            ->keyBy(fn($r) => $r->date->toDateString());

        // Fill all dates in window, including zero-count days
        $trend = [];
        $cursor = Carbon::parse($start);
        $endDateObj = Carbon::parse($end);

        while ($cursor->lte($endDateObj)) {
            $dStr = $cursor->toDateString();
            $row = $records->get($dStr);

            $trend[] = [
                'date' => $dStr,
                'total_views' => (int) ($row?->total_views ?? 0),
                'unique_visitors' => (int) ($row?->unique_visitors ?? 0),
            ];

            $cursor->addDay();
        }

        $totalViews = array_sum(array_column($trend, 'total_views'));
        $uniqueVisitors = array_sum(array_column($trend, 'unique_visitors'));

        // Fetch non-overlapping prior period rollups
        $prevRecords = AnalyticsDailyAggregate::where('dimension_type', 'overview')
            ->where('dimension_value', 'total')
            ->whereBetween('date', [$prevStart, $prevEnd])
            ->get();

        $prevViews = (int) $prevRecords->sum('total_views');
        $prevVisitors = (int) $prevRecords->sum('unique_visitors');

        $viewsChangePercentage = $prevViews > 0
            ? round((($totalViews - $prevViews) / $prevViews) * 100, 1)
            : 0.0;

        return response()->json([
            'success' => true,
            'data' => [
                'range' => $rangeKey,
                'start_date' => $start,
                'end_date' => $end,
                'summary' => [
                    'total_views' => $totalViews,
                    'unique_visitors' => $uniqueVisitors,
                    'days_count' => $daysCount,
                ],
                'daily_trend' => $trend,
                'previous_period' => [
                    'start_date' => $prevStart,
                    'end_date' => $prevEnd,
                    'total_views' => $prevViews,
                    'unique_visitors' => $prevVisitors,
                    'views_change_percentage' => $viewsChangePercentage,
                ],
            ],
        ], 200);
    }

    /**
     * Get top ranked projects by views and unique visitors.
     */
    public function topProjects(Request $request): JsonResponse
    {
        [$start, $end, $rangeKey] = $this->resolveDateRange($request);

        $limit = max(1, min(50, (int) $request->input('limit', 10)));

        $stats = AnalyticsDailyAggregate::where('dimension_type', 'project')
            ->whereBetween('date', [$start, $end])
            ->groupBy('dimension_value')
            ->selectRaw('dimension_value as project_id, SUM(total_views) as views, SUM(unique_visitors) as unique_visitors')
            ->orderByDesc('views')
            ->take($limit)
            ->get();

        $projectIds = $stats->pluck('project_id')->all();
        $projects = Project::whereIn('id', $projectIds)->get()->keyBy('id');

        $list = [];
        foreach ($stats as $stat) {
            $project = $projects->get((int) $stat->project_id);
            if ($project) {
                $snapshot = $project->published_snapshot ?? [];
                $trans = $snapshot['translations']['ar'] ?? $snapshot['translations']['en'] ?? [];
                $title = $trans['title'] ?? $project->slug;

                $list[] = [
                    'id' => $project->id,
                    'slug' => $project->slug,
                    'title' => $title,
                    'views' => (int) $stat->views,
                    'unique_visitors' => (int) $stat->unique_visitors,
                    'cover_url' => $snapshot['cover_url'] ?? null,
                ];
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'range' => $rangeKey,
                'start_date' => $start,
                'end_date' => $end,
                'projects' => $list,
            ],
        ], 200);
    }

    /**
     * Get traffic source categories and top referrer domains.
     */
    public function trafficSources(Request $request): JsonResponse
    {
        [$start, $end, $rangeKey] = $this->resolveDateRange($request);

        $catStats = AnalyticsDailyAggregate::where('dimension_type', 'referrer_category')
            ->whereBetween('date', [$start, $end])
            ->groupBy('dimension_value')
            ->selectRaw('dimension_value as name, SUM(total_views) as views, SUM(unique_visitors) as unique_visitors')
            ->orderByDesc('views')
            ->get();

        $totalViews = (int) $catStats->sum('views');

        $categories = $catStats->map(function ($cat) use ($totalViews) {
            $views = (int) $cat->views;
            return [
                'name' => $cat->name,
                'views' => $views,
                'unique_visitors' => (int) $cat->unique_visitors,
                'percentage' => $totalViews > 0 ? round(($views / $totalViews) * 100, 1) : 0.0,
            ];
        })->values()->all();

        // Top domains from raw events in window (if available)
        $domainStats = AnalyticsEvent::whereBetween('created_at', [
            $start . ' 00:00:00',
            $end . ' 23:59:59',
        ])
            ->whereNotNull('referrer_domain')
            ->where('is_bot', false)
            ->groupBy('referrer_domain')
            ->selectRaw('referrer_domain as domain, COUNT(*) as views')
            ->orderByDesc('views')
            ->take(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'range' => $rangeKey,
                'start_date' => $start,
                'end_date' => $end,
                'categories' => $categories,
                'domains' => $domainStats,
            ],
        ], 200);
    }

    /**
     * Get device type breakdown.
     */
    public function devices(Request $request): JsonResponse
    {
        [$start, $end, $rangeKey] = $this->resolveDateRange($request);

        $deviceStats = AnalyticsDailyAggregate::where('dimension_type', 'device')
            ->whereBetween('date', [$start, $end])
            ->groupBy('dimension_value')
            ->selectRaw('dimension_value as name, SUM(total_views) as views, SUM(unique_visitors) as unique_visitors')
            ->orderByDesc('views')
            ->get();

        $totalViews = (int) $deviceStats->sum('views');

        $devices = $deviceStats->map(function ($dev) use ($totalViews) {
            $views = (int) $dev->views;
            return [
                'name' => $dev->name,
                'views' => $views,
                'unique_visitors' => (int) $dev->unique_visitors,
                'percentage' => $totalViews > 0 ? round(($views / $totalViews) * 100, 1) : 0.0,
            ];
        })->values()->all();

        return response()->json([
            'success' => true,
            'data' => [
                'range' => $rangeKey,
                'start_date' => $start,
                'end_date' => $end,
                'devices' => $devices,
            ],
        ], 200);
    }
}
