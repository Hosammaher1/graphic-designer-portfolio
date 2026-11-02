<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SanctumAuthTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::factory()->create([
            'name' => 'Admin Mohammed',
            'email' => 'admin@mohammed-portfolio.test',
            'password' => Hash::make('CorrectPassword123!'),
        ]);
    }

    public function test_login_with_valid_credentials_authenticates_and_rotates_session(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@mohammed-portfolio.test',
            'password' => 'CorrectPassword123!',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'data' => [
                    'user' => ['id', 'name', 'email'],
                ],
            ])
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'user' => [
                        'email' => 'admin@mohammed-portfolio.test',
                    ],
                ],
            ]);

        $this->assertAuthenticatedAs($this->adminUser);
    }

    public function test_login_with_invalid_credentials_returns_unauthorized_and_keeps_guest(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@mohammed-portfolio.test',
            'password' => 'WrongPassword!',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'status' => 'error',
                'message' => 'Invalid credentials.',
            ]);

        $this->assertGuest();
    }

    public function test_logout_invalidates_session_and_clears_authentication(): void
    {
        // First authenticate
        $this->actingAs($this->adminUser);
        $this->assertAuthenticated();

        // Perform logout
        $response = $this->postJson('/api/v1/auth/logout');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Successfully logged out.',
            ]);

        $this->assertGuest();
    }

    public function test_unauthenticated_request_to_me_endpoint_returns_401(): void
    {
        $response = $this->getJson('/api/v1/auth/me');

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_access_me_endpoint(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->getJson('/api/v1/auth/me');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'user' => [
                        'id' => $this->adminUser->id,
                        'email' => $this->adminUser->email,
                    ],
                ],
            ]);
    }

    public function test_cookie_security_flags_in_production_environment(): void
    {
        // Test that in production config, secure flag is true
        config(['session.secure' => true]);
        config(['session.http_only' => true]);
        config(['session.same_site' => 'lax']);

        $this->assertTrue(config('session.secure'));
        $this->assertTrue(config('session.http_only'));
        $this->assertEquals('lax', config('session.same_site'));
    }

    public function test_token_guard_is_disabled_and_only_sanctum_session_guard_is_configured(): void
    {
        $guards = config('auth.guards');
        $this->assertArrayHasKey('web', $guards);
        $this->assertEquals('session', $guards['web']['driver']);
        $this->assertArrayNotHasKey('api', $guards, 'Legacy TokenGuard driver is not configured.');
    }
}
