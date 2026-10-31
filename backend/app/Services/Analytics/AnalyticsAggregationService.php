<?php

namespace App\Services\Analytics;

use App\Models\AnalyticsDailyAggregate;
use App\Models\AnalyticsEvent;
use Illuminate\Support\Carbon;

class AnalyticsAggregationService
{
    /**
     * Compute and upsert daily aggregated analytics rollups for a specific calendar date.
     */
    public function aggregateForDate(string $dateString): int
    {
        $date = Carbon::parse($dateString)->toDateString();
        $start = Carbon::parse($date)->startOfDay();
        $end = Carbon::parse($date)->endOfDay();

        $rowsToUpsert = [];
        $now = now();

        // 1. Overview Totals
        $overviewStats = AnalyticsEvent::whereBetween('created_at', [$start, $end])
            ->where('is_bot', false)
            ->selectRaw('COUNT(*) as total_views, COUNT(DISTINCT visitor_hash) as unique_visitors')
            ->first();

        $rowsToUpsert[] = [
            'date' => $date,
            'dimension_type' => 'overview',
            'dimension_value' => 'total',
            'total_views' => (int) ($overviewStats->total_views ?? 0),
            'unique_visitors' => (int) ($overviewStats->unique_visitors ?? 0),
            'created_at' => $now,
            'updated_at' => $now,
        ];

        // 2. Project Views Breakdown
        $projectStats = AnalyticsEvent::whereBetween('created_at', [$start, $end])
            ->where('is_bot', false)
            ->whereNotNull('project_id')
            ->groupBy('project_id')
            ->selectRaw('project_id, COUNT(*) as total_views, COUNT(DISTINCT visitor_hash) as unique_visitors')
            ->get();

        foreach ($projectStats as $stat) {
            $rowsToUpsert[] = [
                'date' => $date,
                'dimension_type' => 'project',
                'dimension_value' => (string) $stat->project_id,
                'total_views' => (int) $stat->total_views,
                'unique_visitors' => (int) $stat->unique_visitors,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        // 3. Referrer Category Breakdown
        $referrerStats = AnalyticsEvent::whereBetween('created_at', [$start, $end])
            ->where('is_bot', false)
            ->groupBy('referrer_category')
            ->selectRaw('referrer_category, COUNT(*) as total_views, COUNT(DISTINCT visitor_hash) as unique_visitors')
            ->get();

        foreach ($referrerStats as $stat) {
            $rowsToUpsert[] = [
                'date' => $date,
                'dimension_type' => 'referrer_category',
                'dimension_value' => (string) $stat->referrer_category,
                'total_views' => (int) $stat->total_views,
                'unique_visitors' => (int) $stat->unique_visitors,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        // 4. Device Type Breakdown
        $deviceStats = AnalyticsEvent::whereBetween('created_at', [$start, $end])
            ->where('is_bot', false)
            ->groupBy('device_type')
            ->selectRaw('device_type, COUNT(*) as total_views, COUNT(DISTINCT visitor_hash) as unique_visitors')
            ->get();

        foreach ($deviceStats as $stat) {
            $rowsToUpsert[] = [
                'date' => $date,
                'dimension_type' => 'device',
                'dimension_value' => (string) $stat->device_type,
                'total_views' => (int) $stat->total_views,
                'unique_visitors' => (int) $stat->unique_visitors,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        // Perform batch upsert with idempotency on compound unique index
        AnalyticsDailyAggregate::upsert(
            $rowsToUpsert,
            ['date', 'dimension_type', 'dimension_value'],
            ['total_views', 'unique_visitors', 'updated_at']
        );

        return count($rowsToUpsert);
    }
}
