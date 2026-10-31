<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Project;
use App\Models\Category;
use App\Models\Tool;
use App\Models\ConsentRecord;
use App\Models\VisitorPreference;

class PersonalizedRankingTest extends TestCase
{
    use RefreshDatabase;

    protected Project $targetProject;
    protected Project $brandingProject;
    protected Project $packagingProject;
    protected Category $brandingCat;
    protected Category $packagingCat;

    protected function setUp(): void
    {
        parent::setUp();

        $this->brandingCat = Category::create([
            'name_ar' => 'هوية بصرية',
            'name_en' => 'Brand Identity',
            'slug' => 'brand-identity',
            'order' => 1,
        ]);

        $this->packagingCat = Category::create([
            'name_ar' => 'تصميم العبوات',
            'name_en' => 'Packaging Design',
            'slug' => 'packaging',
            'order' => 2,
        ]);

        $tool = Tool::create([
            'name' => 'Illustrator',
            'slug' => 'illustrator',
        ]);

        // Target project has both categories
        $this->targetProject = Project::create([
            'slug' => 'target-flagship',
            'status' => 'published',
            'year' => 2024,
            'client' => 'Target Corp',
            'published_at' => now()->subDays(10),
            'view_count' => 100,
            'published_snapshot' => [
                'translations' => ['ar' => ['title' => 'مشروع الهدف', 'summary' => 'ملخص الهدف']],
                'categories' => ['brand-identity', 'packaging'],
                'tools' => ['illustrator'],
            ],
        ]);
        $this->targetProject->categories()->attach([$this->brandingCat->id, $this->packagingCat->id]);
        $this->targetProject->tools()->attach($tool->id);

        // Candidate 1: Packaging category, higher recency (generic winner without personalization)
        $this->packagingProject = Project::create([
            'slug' => 'candidate-packaging',
            'status' => 'published',
            'year' => 2024,
            'client' => 'Pack Corp',
            'published_at' => now()->subDays(1),
            'view_count' => 500,
            'published_snapshot' => [
                'translations' => ['ar' => ['title' => 'مشروع التغليف', 'summary' => 'ملخص التغليف']],
                'categories' => ['packaging'],
                'tools' => ['illustrator'],
            ],
        ]);
        $this->packagingProject->categories()->attach($this->packagingCat->id);
        $this->packagingProject->tools()->attach($tool->id);

        // Candidate 2: Branding category, older recency (generic runner-up, but user has strong affinity for branding)
        $this->brandingProject = Project::create([
            'slug' => 'candidate-branding',
            'status' => 'published',
            'year' => 2023,
            'client' => 'Brand Corp',
            'published_at' => now()->subDays(120),
            'view_count' => 50,
            'published_snapshot' => [
                'translations' => ['ar' => ['title' => 'مشروع الهوية', 'summary' => 'ملخص الهوية']],
                'categories' => ['brand-identity'],
                'tools' => ['illustrator'],
            ],
        ]);
        $this->brandingProject->categories()->attach($this->brandingCat->id);
        $this->brandingProject->tools()->attach($tool->id);
    }

    public function test_unconsented_session_receives_generic_ranking(): void
    {
        // 1. Without consent token parameter
        $response = $this->getJson("/api/v1/projects/{$this->targetProject->slug}/recommendations");

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'personalized' => false,
                ],
            ]);

        $recommendations = $response->json('data.recommendations');
        $this->assertNotEmpty($recommendations);

        // In generic ranking, candidate-packaging ranks higher due to higher recency and view_count
        $this->assertEquals('candidate-packaging', $recommendations[0]['slug']);
    }

    public function test_rejected_consent_receives_generic_ranking(): void
    {
        $token = 'c_token_rejected_session_9988';
        ConsentRecord::create([
            'consent_token' => $token,
            'status' => 'rejected',
            'analytics_allowed' => false,
            'personalization_allowed' => false,
            'expires_at' => now()->addDays(180),
        ]);

        $response = $this->getJson("/api/v1/projects/{$this->targetProject->slug}/recommendations?consent_token={$token}");

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'personalized' => false,
                ],
            ]);

        $recommendations = $response->json('data.recommendations');
        $this->assertEquals('candidate-packaging', $recommendations[0]['slug']);
    }

    public function test_tracking_interest_rejected_without_consent(): void
    {
        $token = 'c_token_no_consent_track_7766';

        // Attempting to track without consent record
        $response = $this->postJson('/api/v1/recommendations/interest', [
            'consent_token' => $token,
            'category_id' => $this->brandingCat->id,
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'Personalization consent has not been granted.',
            ]);

        $this->assertDatabaseMissing('visitor_preferences', [
            'consent_token' => $token,
        ]);
    }

    public function test_consented_visitor_with_interests_receives_personalized_ranking(): void
    {
        $token = 'c_token_consented_vip_1122';
        ConsentRecord::create([
            'consent_token' => $token,
            'status' => 'accepted',
            'analytics_allowed' => true,
            'personalization_allowed' => true,
            'expires_at' => now()->addDays(180),
        ]);

        // Track repeated interest in Branding category
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/recommendations/interest', [
                'consent_token' => $token,
                'category_id' => $this->brandingCat->id,
            ])->assertStatus(200);
        }

        $this->assertDatabaseHas('visitor_preferences', [
            'consent_token' => $token,
            'category_id' => $this->brandingCat->id,
            'interactions_count' => 5,
        ]);

        // Request recommendations with consented token
        $response = $this->getJson("/api/v1/projects/{$this->targetProject->slug}/recommendations?consent_token={$token}");

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'personalized' => true,
                ],
            ]);

        $recommendations = $response->json('data.recommendations');
        // Candidate branding was boosted by the user's explicit browsing interests and now ranks #1
        $this->assertEquals('candidate-branding', $recommendations[0]['slug']);
        $this->assertArrayHasKey('personalization', $recommendations[0]['score_breakdown']);
        $this->assertGreaterThan(0, $recommendations[0]['score_breakdown']['personalization']);
    }

    public function test_withdrawal_immediately_reverts_ranking_to_generic_fallback(): void
    {
        $token = 'c_token_withdraw_revert_4455';
        ConsentRecord::create([
            'consent_token' => $token,
            'status' => 'accepted',
            'analytics_allowed' => true,
            'personalization_allowed' => true,
            'expires_at' => now()->addDays(180),
        ]);

        // Register browsing affinity for branding
        $this->postJson('/api/v1/recommendations/interest', [
            'consent_token' => $token,
            'category_id' => $this->brandingCat->id,
        ])->assertStatus(200);

        // Before withdrawal: personalized
        $responseBefore = $this->getJson("/api/v1/projects/{$this->targetProject->slug}/recommendations?consent_token={$token}");
        $responseBefore->assertJson(['data' => ['personalized' => true]]);

        // Perform withdrawal
        $this->postJson('/api/v1/consent/withdraw', [
            'consent_token' => $token,
        ])->assertStatus(200);

        // After withdrawal: immediately returns generic ranking
        $responseAfter = $this->getJson("/api/v1/projects/{$this->targetProject->slug}/recommendations?consent_token={$token}");

        $responseAfter->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'personalized' => false,
                ],
            ]);

        $recommendations = $responseAfter->json('data.recommendations');
        // Reverted to generic winner: candidate-packaging
        $this->assertEquals('candidate-packaging', $recommendations[0]['slug']);
    }

    public function test_expired_consent_falls_back_to_generic(): void
    {
        $token = 'c_token_expired_session_6677';
        ConsentRecord::create([
            'consent_token' => $token,
            'status' => 'accepted',
            'analytics_allowed' => true,
            'personalization_allowed' => true,
            'expires_at' => now()->subDay(), // expired
        ]);

        VisitorPreference::create([
            'consent_token' => $token,
            'category_id' => $this->brandingCat->id,
            'interactions_count' => 10,
            'last_interacted_at' => now()->subDays(2),
        ]);

        $response = $this->getJson("/api/v1/projects/{$this->targetProject->slug}/recommendations?consent_token={$token}");

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'personalized' => false,
                ],
            ]);

        $recommendations = $response->json('data.recommendations');
        $this->assertEquals('candidate-packaging', $recommendations[0]['slug']);
    }
}
