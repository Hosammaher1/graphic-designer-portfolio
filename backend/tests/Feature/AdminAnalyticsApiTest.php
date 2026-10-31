<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;
use App\Models\User;
use App\Models\Project;
use App\Models\AnalyticsDailyAggregate;

class AdminAnalyticsApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $regularUser;
    protected Project $project1;
    protected Project $project2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::factory()->create([
            'email' => 'admin@example.com',
            'is_admin' => true,
        ]);

        $this->regularUser = User::factory()->create([
            'email' => 'regular@example.com',
            'is_admin' => false,
        ]);

        $this->project1 = Project::create([
            'slug' => 'brand-flagship-api',
            'status' => 'published',
            'year' => 2024,
            'client' => 'Client A',
            'published_at' => now()->subDays(20),
            'view_count' => 500,
            'published_snapshot' => [
                'translations' => ['ar' => ['title' => 'مشروع الهوية المميزة']],
                'cover_url' => 'https://res.cloudinary.com/demo/image1.jpg',
            ],
        ]);

        $this->project2 = Project::create([
            'slug' => 'packaging-deluxe-api',
            'status' => 'published',
            'year' => 2024,
            'client' => 'Client B',
            'published_at' => now()->subDays(20),
            'view_count' => 300,
            'published_snapshot' => [
                'translations' => ['ar' => ['title' => 'مشروع التغليف الفاخر']],
                'cover_url' => 'https://res.cloudinary.com/demo/image2.jpg',
            ],
        ]);
    }

    public function test_unauthorized_access_is_blocked(): void
    {
        // 1. Unauthenticated request returns 401
        $this->getJson('/api/v1/admin/analytics/overview')->assertStatus(401);
        $this->getJson('/api/v1/admin/analytics/top-projects')->assertStatus(401);
        $this->getJson('/api/v1/admin/analytics/traffic-sources')->assertStatus(401);
        $this->getJson('/api/v1/admin/analytics/devices')->assertStatus(401);

        // 2. Non-admin authenticated user returns 403
        $this->actingAs($this->regularUser)
            ->getJson('/api/v1/admin/analytics/overview')
            ->assertStatus(403);
    }

    public function test_overview_endpoint_returns_aggregates_and_handles_zero_count_days(): void
    {
        // Seed some data for 2 specific days
        $day1 = Carbon::today()->subDays(2)->toDateString();
        $day2 = Carbon::today()->subDays(1)->toDateString();

        AnalyticsDailyAggregate::create([
            'date' => $day1,
            'dimension_type' => 'overview',
            'dimension_value' => 'total',
            'total_views' => 150,
            'unique_visitors' => 100,
        ]);

        AnalyticsDailyAggregate::create([
            'date' => $day2,
            'dimension_type' => 'overview',
            'dimension_value' => 'total',
            'total_views' => 200,
            'unique_visitors' => 140,
        ]);

        // Request 7-day range
        $response = $this->actingAs($this->adminUser)
            ->getJson('/api/v1/admin/analytics/overview?range=7d');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'range' => '7d',
                    'summary' => [
                        'total_views' => 350,
                        'unique_visitors' => 240,
                        'days_count' => 7,
                    ],
                ],
            ]);

        $trend = $response->json('data.daily_trend');
        $this->assertCount(7, $trend, 'Daily trend must include exactly 7 days');

        // Check that zero-count days are filled with 0s
        $zeroCountDays = collect($trend)->filter(fn($d) => $d['total_views'] === 0);
        $this->assertGreaterThan(0, $zeroCountDays->count(), 'Zero-count days must be filled with 0 gracefully');
    }

    public function test_overview_computes_non_overlapping_prior_window_comparison(): void
    {
        $today = Carbon::today()->toDateString();
        $currentStart = Carbon::today()->subDays(6)->toDateString();

        // Current 7-day period: 100 views
        AnalyticsDailyAggregate::create([
            'date' => $currentStart,
            'dimension_type' => 'overview',
            'dimension_value' => 'total',
            'total_views' => 100,
            'unique_visitors' => 80,
        ]);

        // Prior 7-day period: 50 views
        $priorDate = Carbon::today()->subDays(10)->toDateString();
        AnalyticsDailyAggregate::create([
            'date' => $priorDate,
            'dimension_type' => 'overview',
            'dimension_value' => 'total',
            'total_views' => 50,
            'unique_visitors' => 40,
        ]);

        $response = $this->actingAs($this->adminUser)
            ->getJson('/api/v1/admin/analytics/overview?range=7d');

        $response->assertStatus(200);

        $prior = $response->json('data.previous_period');
        $this->assertNotNull($prior);
        $this->assertEquals(50, $prior['total_views']);
        $this->assertEquals(40, $prior['unique_visitors']);

        // Current start is after previous end
        $this->assertTrue(Carbon::parse($prior['end_date'])->lt(Carbon::parse($response->json('data.start_date'))));
    }

    public function test_custom_date_range_validation(): void
    {
        // Invalid: start_date > end_date returns 422
        $this->actingAs($this->adminUser)
            ->getJson('/api/v1/admin/analytics/overview?range=custom&start_date=2026-10-30&end_date=2026-10-01')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['start_date']);

        // Valid custom range returns 200
        $this->actingAs($this->adminUser)
            ->getJson('/api/v1/admin/analytics/overview?range=custom&start_date=2026-10-01&end_date=2026-10-10')
            ->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'start_date' => '2026-10-01',
                    'end_date' => '2026-10-10',
                ],
            ]);
    }

    public function test_top_projects_endpoint(): void
    {
        $today = Carbon::today()->toDateString();

        AnalyticsDailyAggregate::create([
            'date' => $today,
            'dimension_type' => 'project',
            'dimension_value' => (string) $this->project1->id,
            'total_views' => 50,
            'unique_visitors' => 40,
        ]);

        AnalyticsDailyAggregate::create([
            'date' => $today,
            'dimension_type' => 'project',
            'dimension_value' => (string) $this->project2->id,
            'total_views' => 20,
            'unique_visitors' => 15,
        ]);

        $response = $this->actingAs($this->adminUser)
            ->getJson('/api/v1/admin/analytics/top-projects?range=7d');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $projects = $response->json('data.projects');
        $this->assertNotEmpty($projects);
        $this->assertEquals($this->project1->id, $projects[0]['id']);
        $this->assertEquals('brand-flagship-api', $projects[0]['slug']);
        $this->assertEquals(50, $projects[0]['views']);
    }

    public function test_traffic_sources_and_devices_endpoints(): void
    {
        $today = Carbon::today()->toDateString();

        // Seed referrers
        AnalyticsDailyAggregate::create([
            'date' => $today,
            'dimension_type' => 'referrer_category',
            'dimension_value' => 'social',
            'total_views' => 70,
            'unique_visitors' => 50,
        ]);
        AnalyticsDailyAggregate::create([
            'date' => $today,
            'dimension_type' => 'referrer_category',
            'dimension_value' => 'search',
            'total_views' => 30,
            'unique_visitors' => 25,
        ]);

        // Seed devices
        AnalyticsDailyAggregate::create([
            'date' => $today,
            'dimension_type' => 'device',
            'dimension_value' => 'mobile',
            'total_views' => 60,
            'unique_visitors' => 45,
        ]);
        AnalyticsDailyAggregate::create([
            'date' => $today,
            'dimension_type' => 'device',
            'dimension_value' => 'desktop',
            'total_views' => 40,
            'unique_visitors' => 30,
        ]);

        // Test Traffic Sources
        $sourceResponse = $this->actingAs($this->adminUser)
            ->getJson('/api/v1/admin/analytics/traffic-sources?range=7d');

        $sourceResponse->assertStatus(200)
            ->assertJson(['success' => true]);

        $categories = $sourceResponse->json('data.categories');
        $this->assertNotEmpty($categories);
        $this->assertEquals('social', $categories[0]['name']);
        $this->assertEquals(70, $categories[0]['views']);

        // Test Devices
        $deviceResponse = $this->actingAs($this->adminUser)
            ->getJson('/api/v1/admin/analytics/devices?range=7d');

        $deviceResponse->assertStatus(200)
            ->assertJson(['success' => true]);

        $devices = $deviceResponse->json('data.devices');
        $this->assertNotEmpty($devices);
        $this->assertEquals('mobile', $devices[0]['name']);
        $this->assertEquals(60, $devices[0]['views']);
    }
}
