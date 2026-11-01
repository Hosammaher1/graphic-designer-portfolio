<?php

namespace Tests\Feature\Auth;

use App\Models\AuditLog;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuditLogTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::factory()->create([
            'email' => 'admin@mohammed-portfolio.test',
            'password' => Hash::make('AdminPass123!'),
            'is_admin' => true,
        ]);
    }

    public function test_audit_event_is_persisted_to_database_with_actor_and_timestamp(): void
    {
        $log = AuditLogger::log('test.action', [
            'entity_id' => 42,
            'status' => 'published',
        ], $this->adminUser);

        $this->assertDatabaseHas('audit_logs', [
            'id' => $log->id,
            'user_id' => $this->adminUser->id,
            'actor_email' => 'admin@mohammed-portfolio.test',
            'action' => 'test.action',
        ]);

        $this->assertNotNull($log->created_at);
        $this->assertEquals(42, $log->details['entity_id']);
    }

    public function test_audit_log_scrubs_passwords_and_sensitive_tokens_from_payload(): void
    {
        $dirtyPayload = [
            'username' => 'admin',
            'password' => 'PlaintextSecretPassword!',
            'nested' => [
                'current_password' => 'AnotherSecret',
                'api_key' => 'live_secret_key_123',
                'safe_field' => 'visible_value',
            ],
        ];

        $log = AuditLogger::log('sensitive.mutation', $dirtyPayload, $this->adminUser);

        $savedLog = AuditLog::find($log->id);

        $this->assertEquals('[REDACTED]', $savedLog->details['password']);
        $this->assertEquals('[REDACTED]', $savedLog->details['nested']['current_password']);
        $this->assertEquals('[REDACTED]', $savedLog->details['nested']['api_key']);
        $this->assertEquals('visible_value', $savedLog->details['nested']['safe_field']);

        // Assert string does not exist in serialized database representation
        $rawJson = json_encode($savedLog->details);
        $this->assertStringNotContainsString('PlaintextSecretPassword!', $rawJson);
        $this->assertStringNotContainsString('live_secret_key_123', $rawJson);
    }

    public function test_audit_log_redacts_message_bodies_and_nested_exception_details(): void
    {
        $log = AuditLogger::log('contact.failed', [
            'message' => 'Private client message body',
            'request_body' => 'Private request payload',
            'nested' => [
                'exception' => 'Provider returned a secret token',
                'trace' => 'D:\\private\\stack.php',
                'status' => 'failed',
            ],
        ], $this->adminUser);

        $details = $log->fresh()->details;
        $this->assertSame('[REDACTED]', $details['message']);
        $this->assertSame('[REDACTED]', $details['request_body']);
        $this->assertSame('[REDACTED]', $details['nested']['exception']);
        $this->assertSame('[REDACTED]', $details['nested']['trace']);
        $this->assertSame('failed', $details['nested']['status']);
    }

    public function test_admin_can_retrieve_paginated_audit_logs(): void
    {
        AuditLogger::log('auth.login.success', ['email' => $this->adminUser->email], $this->adminUser);
        AuditLogger::log('admin.profile.updated', ['field' => 'name'], $this->adminUser);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson('/api/v1/admin/audit-logs');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'data' => [
                    'logs' => [
                        '*' => ['id', 'action', 'actor_email', 'created_at'],
                    ],
                    'pagination' => ['current_page', 'per_page', 'total', 'last_page'],
                ],
            ]);
    }

    public function test_unauthenticated_or_regular_user_cannot_access_audit_logs(): void
    {
        $unauthResponse = $this->getJson('/api/v1/admin/audit-logs');
        $unauthResponse->assertStatus(401);

        $regularUser = User::factory()->create(['is_admin' => false]);
        $forbiddenResponse = $this->actingAs($regularUser, 'sanctum')
            ->getJson('/api/v1/admin/audit-logs');
        $forbiddenResponse->assertStatus(403);
    }

    public function test_admin_mutation_audit_records_route_and_status_without_request_body(): void
    {
        $this->actingAs($this->adminUser, 'sanctum')->putJson('/api/v1/admin/profile', [
            'name' => 'Updated Admin',
            'email' => $this->adminUser->email,
            'message' => 'Private client message body',
        ])->assertOk();

        $audit = AuditLog::where('action', 'admin.request')->firstOrFail();
        $this->assertSame('api.v1.admin.profile.update', $audit->details['route']);
        $this->assertSame('PUT', $audit->details['method']);
        $this->assertSame(200, $audit->details['response_status']);
        $this->assertStringNotContainsString('Private client message body', json_encode($audit->details));
    }

    public function test_audit_log_does_not_store_raw_user_agent_header(): void
    {
        $request = \Illuminate\Http\Request::create('/api/v1/admin/profile', 'PUT');
        $request->headers->set('User-Agent', 'Browser Bearer private-session-token');

        $log = AuditLogger::log('admin.profile.updated', ['field' => 'name'], $this->adminUser, $request);

        $this->assertStringNotContainsString('private-session-token', json_encode($log->fresh()->toArray()));
    }
}
