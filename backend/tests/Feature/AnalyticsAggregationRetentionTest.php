<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;
use App\Models\Project;
use App\Models\AnalyticsEvent;
use App\Models\AnalyticsDailyAggregate;

class AnalyticsAggregationRetentionTest extends TestCase
{
    use RefreshDatabase;

    protected Project $projectA;
    protected Project $projectB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->projectA = Project::create([
            'slug' => 'project-alpha-agg',
            'status' => 'published',
            'year' => 2024,
            'client' => 'Alpha Corp',
            'published_at' => now()->subDays(10),
            'view_count' => 0,
            'published_snapshot' => ['title' => 'Alpha'],
        ]);

        $this->projectB = Project::create([
            'slug' => 'project-beta-agg',
            'status' => 'published',
            'year' => 2024,
            'client' => 'Beta Corp',
            'published_at' => now()->subDays(10),
            'view_count' => 0,
            'published_snapshot' => ['title' => 'Beta'],
        ]);
    }

    public function test_daily_rollup_aggregates_views_and_approximate_unique_visitors(): void
    {
        $targetDate = '2026-10-25';
        $time1 = Carbon::parse("{$targetDate} 10:00:00");
        $time2 = Carbon::parse("{$targetDate} 14:30:00");

        // Visitor 1 visits project A and home
        AnalyticsEvent::create([
            'event_type' => 'project_view',
            'path' => "/ar/projects/{$this->projectA->slug}",
            'project_id' => $this->projectA->id,
            'visitor_hash' => 'hash_visitor_1',
            'referrer_category' => 'search',
            'device_type' => 'desktop',
            'locale' => 'ar',
            'is_bot' => false,
            'created_at' => $time1,
        ]);
        AnalyticsEvent::create([
            'event_type' => 'page_view',
            'path' => '/ar/',
            'visitor_hash' => 'hash_visitor_1',
            'referrer_category' => 'direct',
            'device_type' => 'desktop',
            'locale' => 'ar',
            'is_bot' => false,
            'created_at' => $time1->copy()->addMinutes(2),
        ]);

        // Visitor 2 visits project A and project B
        AnalyticsEvent::create([
            'event_type' => 'project_view',
            'path' => "/ar/projects/{$this->projectA->slug}",
            'project_id' => $this->projectA->id,
            'visitor_hash' => 'hash_visitor_2',
            'referrer_category' => 'social',
            'device_type' => 'mobile',
            'locale' => 'ar',
            'is_bot' => false,
            'created_at' => $time2,
        ]);
        AnalyticsEvent::create([
            'event_type' => 'project_view',
            'path' => "/ar/projects/{$this->projectB->slug}",
            'project_id' => $this->projectB->id,
            'visitor_hash' => 'hash_visitor_2',
            'referrer_category' => 'social',
            'device_type' => 'mobile',
            'locale' => 'ar',
            'is_bot' => false,
            'created_at' => $time2->copy()->addMinutes(5),
        ]);

        // Run aggregation command for the target date
        $exitCode = Artisan::call('analytics:aggregate-daily', ['--date' => $targetDate]);
        $this->assertEquals(0, $exitCode);

        // 1. Overview aggregate: 4 total views, 2 unique visitors
        $overview = AnalyticsDailyAggregate::where('date', $targetDate)
            ->where('dimension_type', 'overview')
            ->where('dimension_value', 'total')
            ->first();
        $this->assertNotNull($overview);
        $this->assertEquals(4, $overview->total_views);
        $this->assertEquals(2, $overview->unique_visitors);

        // 2. Project A aggregate: 2 views, 2 unique visitors
        $projectAAgg = AnalyticsDailyAggregate::where('date', $targetDate)
            ->where('dimension_type', 'project')
            ->where('dimension_value', (string) $this->projectA->id)
            ->first();
        $this->assertNotNull($projectAAgg);
        $this->assertEquals(2, $projectAAgg->total_views);
        $this->assertEquals(2, $projectAAgg->unique_visitors);

        // 3. Referrer Social aggregate: 2 views, 1 unique visitor
        $socialAgg = AnalyticsDailyAggregate::where('date', $targetDate)
            ->where('dimension_type', 'referrer_category')
            ->where('dimension_value', 'social')
            ->first();
        $this->assertNotNull($socialAgg);
        $this->assertEquals(2, $socialAgg->total_views);
        $this->assertEquals(1, $socialAgg->unique_visitors);
    }

    public function test_day_boundary_and_timezone_consistency(): void
    {
        $day1 = '2026-10-25';
        $day2 = '2026-10-26';

        // Event just before midnight (Day 1)
        AnalyticsEvent::create([
            'event_type' => 'page_view',
            'path' => '/ar/work',
            'visitor_hash' => 'hash_boundary_1',
            'is_bot' => false,
            'created_at' => Carbon::parse("{$day1} 23:59:58"),
        ]);

        // Event just after midnight (Day 2)
        AnalyticsEvent::create([
            'event_type' => 'page_view',
            'path' => '/ar/work',
            'visitor_hash' => 'hash_boundary_2',
            'is_bot' => false,
            'created_at' => Carbon::parse("{$day2} 00:00:02"),
        ]);

        Artisan::call('analytics:aggregate-daily', ['--date' => $day1]);
        Artisan::call('analytics:aggregate-daily', ['--date' => $day2]);

        $day1Agg = AnalyticsDailyAggregate::where('date', $day1)
            ->where('dimension_type', 'overview')
            ->where('dimension_value', 'total')
            ->first();
        $day2Agg = AnalyticsDailyAggregate::where('date', $day2)
            ->where('dimension_type', 'overview')
            ->where('dimension_value', 'total')
            ->first();

        $this->assertEquals(1, $day1Agg->total_views);
        $this->assertEquals(1, $day2Agg->total_views);
    }

    public function test_deduplication_and_idempotent_aggregation(): void
    {
        $date = '2026-10-27';

        AnalyticsEvent::create([
            'event_type' => 'page_view',
            'path' => '/ar/contact',
            'visitor_hash' => 'hash_idempotent',
            'is_bot' => false,
            'created_at' => Carbon::parse("{$date} 12:00:00"),
        ]);

        // Run aggregation 3 times
        Artisan::call('analytics:aggregate-daily', ['--date' => $date]);
        Artisan::call('analytics:aggregate-daily', ['--date' => $date]);
        Artisan::call('analytics:aggregate-daily', ['--date' => $date]);

        $aggregatesCount = AnalyticsDailyAggregate::where('date', $date)
            ->where('dimension_type', 'overview')
            ->count();
        $this->assertEquals(1, $aggregatesCount, 'Overview aggregate must have exactly 1 record per date');

        $agg = AnalyticsDailyAggregate::where('date', $date)
            ->where('dimension_type', 'overview')
            ->first();
        $this->assertEquals(1, $agg->total_views);
    }

    public function test_bot_events_are_excluded_from_rollups(): void
    {
        $date = '2026-10-28';

        // 1 human event
        AnalyticsEvent::create([
            'event_type' => 'page_view',
            'path' => '/ar/',
            'visitor_hash' => 'human_hash',
            'is_bot' => false,
            'created_at' => Carbon::parse("{$date} 15:00:00"),
        ]);

        // 5 crawler/bot events
        for ($i = 0; $i < 5; $i++) {
            AnalyticsEvent::create([
                'event_type' => 'page_view',
                'path' => '/ar/',
                'visitor_hash' => 'crawler_hash_' . $i,
                'is_bot' => true,
                'created_at' => Carbon::parse("{$date} 15:0{$i}:00"),
            ]);
        }

        Artisan::call('analytics:aggregate-daily', ['--date' => $date]);

        $overview = AnalyticsDailyAggregate::where('date', $date)
            ->where('dimension_type', 'overview')
            ->first();

        $this->assertEquals(1, $overview->total_views);
        $this->assertEquals(1, $overview->unique_visitors);
    }

    public function test_ttl_purge_removes_old_raw_events_while_preserving_aggregates(): void
    {
        $oldDate = now()->subDays(45)->toDateString();

        // Old raw event
        AnalyticsEvent::create([
            'event_type' => 'page_view',
            'path' => '/ar/about',
            'visitor_hash' => 'old_visitor',
            'is_bot' => false,
            'created_at' => now()->subDays(45),
        ]);

        // Recent raw event
        AnalyticsEvent::create([
            'event_type' => 'page_view',
            'path' => '/ar/about',
            'visitor_hash' => 'recent_visitor',
            'is_bot' => false,
            'created_at' => now()->subDays(5),
        ]);

        // Aggregate for the old date
        AnalyticsDailyAggregate::create([
            'date' => $oldDate,
            'dimension_type' => 'overview',
            'dimension_value' => 'total',
            'total_views' => 100,
            'unique_visitors' => 80,
        ]);

        // Run TTL purge with 30 days retention
        $exitCode = Artisan::call('analytics:purge-raw-events', ['--days' => 30]);
        $this->assertEquals(0, $exitCode);

        // Old raw event must be deleted
        $this->assertDatabaseMissing('analytics_events', [
            'visitor_hash' => 'old_visitor',
        ]);

        // Recent raw event must be kept
        $this->assertDatabaseHas('analytics_events', [
            'visitor_hash' => 'recent_visitor',
        ]);

        // Aggregate for old date must be completely preserved
        $this->assertDatabaseHas('analytics_daily_aggregates', [
            'date' => $oldDate,
            'total_views' => 100,
            'unique_visitors' => 80,
        ]);
    }

    public function test_query_performance_on_aggregates(): void
    {
        // Seed 30 daily aggregate records
        $startDate = Carbon::parse('2026-09-01');
        for ($i = 0; $i < 30; $i++) {
            $current = $startDate->copy()->addDays($i)->toDateString();
            AnalyticsDailyAggregate::create([
                'date' => $current,
                'dimension_type' => 'overview',
                'dimension_value' => 'total',
                'total_views' => 50 + $i,
                'unique_visitors' => 30 + $i,
            ]);
        }

        $startBenchmark = microtime(true);

        $results = AnalyticsDailyAggregate::where('dimension_type', 'overview')
            ->whereBetween('date', ['2026-09-01', '2026-09-30'])
            ->orderBy('date', 'asc')
            ->get();

        $durationMs = (microtime(true) - $startBenchmark) * 1000;

        $this->assertCount(30, $results);
        $this->assertLessThan(100.0, $durationMs, 'Indexed aggregate query must execute in < 100ms');
    }
}
