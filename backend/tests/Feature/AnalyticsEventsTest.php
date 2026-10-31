<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;
use App\Models\Project;
use App\Models\ConsentRecord;
use App\Models\AnalyticsEvent;

class AnalyticsEventsTest extends TestCase
{
    use RefreshDatabase;

    protected Project $project;

    protected function setUp(): void
    {
        parent::setUp();

        $this->project = Project::create([
            'slug' => 'brand-flagship-analytics',
            'status' => 'published',
            'year' => 2024,
            'client' => 'Design Studio',
            'published_at' => now()->subDays(5),
            'view_count' => 10,
            'published_snapshot' => [
                'translations' => ['ar' => ['title' => 'مشروع تحليلات', 'summary' => 'ملخص التحليلات']],
                'categories' => ['branding'],
                'tools' => ['photoshop'],
            ],
        ]);
    }

    public function test_can_track_permitted_page_view_with_categorized_referrer(): void
    {
        $token = 'c_token_analytics_allowed_123';
        ConsentRecord::create([
            'consent_token' => $token,
            'status' => 'accepted',
            'analytics_allowed' => true,
            'personalization_allowed' => true,
            'expires_at' => now()->addDays(180),
        ]);

        $payload = [
            'event_type' => 'page_view',
            'path' => '/ar/work',
            'referrer' => 'https://www.google.com/search?q=portfolio',
            'locale' => 'ar',
            'consent_token' => $token,
        ];

        $response = $this->withHeaders([
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ])->postJson('/api/v1/analytics/events', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'status' => 'recorded',
            ]);

        $this->assertDatabaseHas('analytics_events', [
            'event_type' => 'page_view',
            'path' => '/ar/work',
            'referrer_category' => 'search',
            'locale' => 'ar',
        ]);
    }

    public function test_project_view_records_event_and_increments_project_view_count(): void
    {
        $token = 'c_token_project_view_456';
        ConsentRecord::create([
            'consent_token' => $token,
            'status' => 'accepted',
            'analytics_allowed' => true,
            'personalization_allowed' => false,
            'expires_at' => now()->addDays(180),
        ]);

        $initialViewCount = $this->project->view_count;

        $payload = [
            'event_type' => 'project_view',
            'path' => "/ar/projects/{$this->project->slug}",
            'project_id' => $this->project->id,
            'referrer' => 'https://behance.net/gallery/123456',
            'locale' => 'ar',
            'consent_token' => $token,
        ];

        $response = $this->withHeaders([
            'User-Agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)',
        ])->postJson('/api/v1/analytics/events', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'status' => 'recorded',
            ]);

        $this->assertDatabaseHas('analytics_events', [
            'event_type' => 'project_view',
            'project_id' => $this->project->id,
            'referrer_category' => 'social',
        ]);

        $this->project->refresh();
        $this->assertEquals($initialViewCount + 1, $this->project->view_count);
    }

    public function test_rejection_or_withdrawal_blocks_analytics_event_tracking(): void
    {
        // 1. Rejected consent
        $rejectToken = 'c_token_reject_analytics_789';
        ConsentRecord::create([
            'consent_token' => $rejectToken,
            'status' => 'rejected',
            'analytics_allowed' => false,
            'personalization_allowed' => false,
            'expires_at' => now()->addDays(180),
        ]);

        $response1 = $this->postJson('/api/v1/analytics/events', [
            'event_type' => 'page_view',
            'path' => '/en/about',
            'consent_token' => $rejectToken,
        ]);

        $response1->assertStatus(200)
            ->assertJson([
                'success' => false,
                'status' => 'blocked',
            ]);

        $this->assertDatabaseMissing('analytics_events', [
            'path' => '/en/about',
        ]);

        // 2. Withdrawn consent
        $withdrawToken = 'c_token_withdrawn_analytics_001';
        ConsentRecord::create([
            'consent_token' => $withdrawToken,
            'status' => 'withdrawn',
            'analytics_allowed' => false,
            'personalization_allowed' => false,
            'withdrawn_at' => now()->subDay(),
            'expires_at' => now()->addDays(180),
        ]);

        $response2 = $this->postJson('/api/v1/analytics/events', [
            'event_type' => 'project_view',
            'path' => "/en/projects/{$this->project->slug}",
            'project_id' => $this->project->id,
            'consent_token' => $withdrawToken,
        ]);

        $response2->assertStatus(200)
            ->assertJson([
                'success' => false,
                'status' => 'blocked',
            ]);
    }

    public function test_bot_filtering_heuristics_detect_crawlers_and_ignore(): void
    {
        $token = 'c_token_bot_test_555';
        ConsentRecord::create([
            'consent_token' => $token,
            'status' => 'accepted',
            'analytics_allowed' => true,
            'expires_at' => now()->addDays(180),
        ]);

        // Known crawler user agent
        $botUserAgents = [
            'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
            'curl/7.88.1',
            'HeadlessChrome/120.0.0.0',
        ];

        foreach ($botUserAgents as $botUa) {
            $response = $this->withHeaders([
                'User-Agent' => $botUa,
            ])->postJson('/api/v1/analytics/events', [
                'event_type' => 'page_view',
                'path' => '/ar/',
                'consent_token' => $token,
            ]);

            $response->assertStatus(200)
                ->assertJson([
                    'success' => false,
                    'status' => 'ignored_bot',
                ]);
        }

        // None of the bot requests should be recorded as human visits
        $this->assertDatabaseMissing('analytics_events', [
            'path' => '/ar/',
            'is_bot' => false,
        ]);
    }

    public function test_idempotent_event_handling_prevents_duplicate_pageviews(): void
    {
        $token = 'c_token_idempotent_999';
        ConsentRecord::create([
            'consent_token' => $token,
            'status' => 'accepted',
            'analytics_allowed' => true,
            'expires_at' => now()->addDays(180),
        ]);

        $idempotencyKey = 'unique_event_tx_abc123456789';

        $payload = [
            'event_type' => 'project_view',
            'path' => "/ar/projects/{$this->project->slug}",
            'project_id' => $this->project->id,
            'consent_token' => $token,
            'idempotency_key' => $idempotencyKey,
        ];

        // First attempt: records event
        $res1 = $this->withHeaders([
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ])->postJson('/api/v1/analytics/events', $payload);

        $res1->assertStatus(200)
            ->assertJson(['success' => true, 'status' => 'recorded']);

        $countAfterFirst = AnalyticsEvent::where('idempotency_key', $idempotencyKey)->count();
        $this->assertEquals(1, $countAfterFirst);

        // Immediate second attempt with same idempotency_key: returns deduplicated
        $res2 = $this->withHeaders([
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ])->postJson('/api/v1/analytics/events', $payload);

        $res2->assertStatus(200)
            ->assertJson(['success' => true, 'status' => 'deduplicated']);

        $countAfterSecond = AnalyticsEvent::where('idempotency_key', $idempotencyKey)->count();
        $this->assertEquals(1, $countAfterSecond);
    }

    public function test_raw_ip_address_is_never_stored_in_database(): void
    {
        $token = 'c_token_ip_safety_check';
        ConsentRecord::create([
            'consent_token' => $token,
            'status' => 'accepted',
            'analytics_allowed' => true,
            'expires_at' => now()->addDays(180),
        ]);

        $columns = DB::getSchemaBuilder()->getColumnListing('analytics_events');

        $this->assertNotContains('ip_address', $columns, 'Analytics table must not contain ip_address');
        $this->assertNotContains('raw_ip', $columns, 'Analytics table must not contain raw_ip');
        $this->assertContains('visitor_hash', $columns, 'Analytics table must contain pseudonymous visitor_hash');

        $this->withHeaders([
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'REMOTE_ADDR' => '203.0.113.195',
        ])->postJson('/api/v1/analytics/events', [
            'event_type' => 'page_view',
            'path' => '/en/work',
            'consent_token' => $token,
        ])->assertStatus(200);

        $event = AnalyticsEvent::where('path', '/en/work')->first();
        $this->assertNotNull($event);

        // Visitor hash must be 64-character SHA-256 string, NOT the raw IP
        $this->assertEquals(64, strlen($event->visitor_hash));
        $this->assertStringNotContainsString('203.0.113.195', $event->visitor_hash);
    }
}
