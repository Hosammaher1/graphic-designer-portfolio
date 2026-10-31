<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;
use App\Models\ConsentRecord;
use App\Models\VisitorPreference;
use App\Models\Category;

class ConsentBackendPrivacyTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_record_pseudonymous_consent(): void
    {
        $payload = [
            'consent_token' => 'c_token_1234567890abcdef1234567890abcdef',
            'status' => 'accepted',
            'categories' => [
                'analytics' => true,
                'personalization' => true,
            ],
            'policy_version' => '1.0',
        ];

        $response = $this->postJson('/api/v1/consent', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'consent_token' => 'c_token_1234567890abcdef1234567890abcdef',
                    'status' => 'accepted',
                    'categories' => [
                        'essential' => true,
                        'analytics' => true,
                        'personalization' => true,
                    ],
                    'policy_version' => '1.0',
                ],
            ]);

        $this->assertDatabaseHas('consent_records', [
            'consent_token' => 'c_token_1234567890abcdef1234567890abcdef',
            'status' => 'accepted',
            'analytics_allowed' => 1,
            'personalization_allowed' => 1,
        ]);
    }

    public function test_recording_rejection_stores_false_for_optional_tracking(): void
    {
        $payload = [
            'consent_token' => 'c_token_reject_9876543210fedcba',
            'status' => 'rejected',
            'categories' => [
                'analytics' => false,
                'personalization' => false,
            ],
        ];

        $response = $this->postJson('/api/v1/consent', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'rejected',
                    'categories' => [
                        'essential' => true,
                        'analytics' => false,
                        'personalization' => false,
                    ],
                ],
            ]);

        $this->assertDatabaseHas('consent_records', [
            'consent_token' => 'c_token_reject_9876543210fedcba',
            'status' => 'rejected',
            'analytics_allowed' => 0,
            'personalization_allowed' => 0,
        ]);
    }

    public function test_withdrawal_deactivates_consent_and_purges_visitor_preferences(): void
    {
        $token = 'c_token_withdraw_test_123456789';

        // Pre-create consented record
        $record = ConsentRecord::create([
            'consent_token' => $token,
            'status' => 'accepted',
            'analytics_allowed' => true,
            'personalization_allowed' => true,
            'policy_version' => '1.0',
            'expires_at' => now()->addDays(180),
        ]);

        $category = Category::create([
            'name_ar' => 'هوية بصرية',
            'name_en' => 'Brand Identity',
            'slug' => 'brand-identity',
            'order' => 1,
        ]);

        // Pre-create associated visitor preferences
        VisitorPreference::create([
            'consent_token' => $token,
            'category_id' => $category->id,
            'interactions_count' => 5,
            'last_interacted_at' => now(),
        ]);

        $this->assertDatabaseHas('visitor_preferences', [
            'consent_token' => $token,
        ]);

        // Post withdrawal
        $response = $this->postJson('/api/v1/consent/withdraw', [
            'consent_token' => $token,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'withdrawn',
                    'categories' => [
                        'essential' => true,
                        'analytics' => false,
                        'personalization' => false,
                    ],
                ],
            ]);

        // Consent record must be updated to withdrawn
        $record->refresh();
        $this->assertEquals('withdrawn', $record->status);
        $this->assertFalse((bool) $record->analytics_allowed);
        $this->assertFalse((bool) $record->personalization_allowed);
        $this->assertNotNull($record->withdrawn_at);

        // Visitor preferences must be purged on withdrawal
        $this->assertDatabaseMissing('visitor_preferences', [
            'consent_token' => $token,
        ]);
    }

    public function test_unauthorized_data_linkage_is_rejected_or_unpersisted(): void
    {
        // Consent record schema must NOT have user_id, email, or raw IP columns
        $columns = DB::getSchemaBuilder()->getColumnListing('consent_records');

        $this->assertNotContains('user_id', $columns, 'Consent table must not contain user_id');
        $this->assertNotContains('email', $columns, 'Consent table must not contain email');
        $this->assertNotContains('ip_address', $columns, 'Consent table must not contain raw ip_address');

        // Trying to pass personal identifier payload must not store them
        $payload = [
            'consent_token' => 'c_token_privacy_audit_112233',
            'status' => 'accepted',
            'categories' => [
                'analytics' => true,
                'personalization' => true,
            ],
            'email' => 'victim@example.com',
            'user_id' => 999,
            'ip_address' => '192.168.1.100',
        ];

        $response = $this->postJson('/api/v1/consent', $payload);
        $response->assertStatus(200);

        $record = ConsentRecord::where('consent_token', 'c_token_privacy_audit_112233')->first();
        $this->assertNotNull($record);

        // Verify that record attributes contain no personal linkage
        $this->assertArrayNotHasKey('email', $record->toArray());
        $this->assertArrayNotHasKey('user_id', $record->toArray());
        $this->assertArrayNotHasKey('ip_address', $record->toArray());
    }

    public function test_get_consent_status_by_token(): void
    {
        $token = 'c_token_query_state_556677';

        ConsentRecord::create([
            'consent_token' => $token,
            'status' => 'customized',
            'analytics_allowed' => true,
            'personalization_allowed' => false,
            'policy_version' => '1.0',
            'expires_at' => now()->addDays(180),
        ]);

        $response = $this->getJson("/api/v1/consent/{$token}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'consent_token' => $token,
                    'status' => 'customized',
                    'categories' => [
                        'essential' => true,
                        'analytics' => true,
                        'personalization' => false,
                    ],
                ],
            ]);

        // Non-existent token returns 404
        $this->getJson('/api/v1/consent/unknown_nonexistent_token')
            ->assertStatus(404);
    }

    public function test_purge_command_removes_expired_records(): void
    {
        // 1. Expired record (expires_at in the past)
        ConsentRecord::create([
            'consent_token' => 'c_token_expired_1',
            'status' => 'accepted',
            'analytics_allowed' => true,
            'personalization_allowed' => true,
            'expires_at' => now()->subDay(),
        ]);

        // 2. Active record (expires_at in the future)
        ConsentRecord::create([
            'consent_token' => 'c_token_active_2',
            'status' => 'accepted',
            'analytics_allowed' => true,
            'personalization_allowed' => true,
            'expires_at' => now()->addDays(90),
        ]);

        // 3. Old withdrawn record (withdrawn > 30 days ago)
        ConsentRecord::create([
            'consent_token' => 'c_token_withdrawn_old_3',
            'status' => 'withdrawn',
            'analytics_allowed' => false,
            'personalization_allowed' => false,
            'withdrawn_at' => now()->subDays(35),
            'expires_at' => now()->addDays(90),
        ]);

        // Run purge command
        $exitCode = Artisan::call('consent:purge-expired');
        $this->assertEquals(0, $exitCode);

        // Assert expired and old withdrawn are removed
        $this->assertDatabaseMissing('consent_records', ['consent_token' => 'c_token_expired_1']);
        $this->assertDatabaseMissing('consent_records', ['consent_token' => 'c_token_withdrawn_old_3']);

        // Assert active record is preserved
        $this->assertDatabaseHas('consent_records', ['consent_token' => 'c_token_active_2']);
    }
}
